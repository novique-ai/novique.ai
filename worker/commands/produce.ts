import { marked } from 'marked';
import slugify from 'slugify';
import { z } from 'zod';
import { config } from '../config';
import { budgetAvailable, generateStructured, generateText } from '../lib/anthropic';
import { saveArtifact } from '../lib/artifacts';
import { alertDiscord } from '../lib/discord';
import { buildSourceBundle } from '../lib/research';
import { assertNoError, getSupabase } from '../lib/supabase';
import type { SourceBundleItem } from '../types';

interface Campaign {
  id: string;
  slug: string;
  title: string;
  status: string;
  topic_brief: Record<string, unknown>;
  source_bundle: SourceBundleItem[];
  blog_post_id: string | null;
}

interface WeeklyApproval {
  id: string;
  payload: Record<string, unknown>;
  notes: string | null;
  decided_by: string | null;
  decided_at: string | null;
}

const factCheckSchema = z.object({
  all_supported: z.boolean(),
  claims: z.array(z.object({
    claim: z.string(),
    verdict: z.enum(['supported', 'unsupported', 'unclear']),
    source_urls: z.array(z.string()),
    explanation: z.string(),
  })),
  revised_markdown: z.string().nullable(),
  flags: z.array(z.string()),
});

const finalSchema = z.object({
  title: z.string(),
  summary: z.string(),
  meta_description: z.string(),
  tags: z.array(z.string()).min(3).max(7),
  key_insights: z.array(z.string()).length(3),
  core_takeaway: z.string(),
  markdown: z.string(),
});

function uuidSelections(approval: WeeklyApproval): string[] {
  const payload = approval.payload ?? {};
  const campaigns = Array.isArray(payload.campaigns) ? payload.campaigns as Array<Record<string, unknown>> : [];
  const allIds = Array.isArray(payload.campaign_ids)
    ? payload.campaign_ids.filter((id): id is string => typeof id === 'string')
    : campaigns.flatMap((campaign) => typeof campaign.id === 'string' ? [campaign.id] : []);
  const explicit = [payload.selected_campaign_ids, payload.selected_campaign_id]
    .flatMap((value) => Array.isArray(value) ? value : value ? [value] : [])
    .filter((id): id is string => typeof id === 'string');
  const notes = [typeof payload.notes === 'string' ? payload.notes : '', approval.notes ?? ''].filter(Boolean).join(' ');
  const notedIds = notes.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi) ?? [];
  const notedIndexes = [...notes.matchAll(/(?:^|\s|#)([1-9][0-9]*)(?:\s|$|[,.])/g)]
    .map((match) => campaigns[Number(match[1]) - 1]?.id)
    .filter((id): id is string => typeof id === 'string');
  const selected = [...new Set([...explicit, ...notedIds, ...notedIndexes])];
  return selected.length > 0 ? selected.filter((id) => allIds.includes(id)) : allIds;
}

async function checkBudget(): Promise<boolean> {
  const budget = await budgetAvailable();
  if (budget.available) return true;
  const message = `Novique content worker paused: monthly Claude spend is $${budget.spent.toFixed(4)} against the $${budget.limit.toFixed(2)} guard.`;
  console.error(message);
  await alertDiscord(message);
  return false;
}

function sourceMarkdown(sources: SourceBundleItem[]): string {
  return sources.map((source, index) =>
    `## Source ${index + 1}: [${source.title}](${source.url})\n\nPublisher: ${source.publisher}\n\n${source.excerpt}`
  ).join('\n\n');
}

function wordCount(markdown: string): number {
  return markdown.replace(/\[[^\]]+\]\([^\)]+\)/g, ' ').replace(/[#*_>`~-]/g, ' ').trim().split(/\s+/).filter(Boolean).length;
}

async function selectedCampaigns(): Promise<Array<{ campaign: Campaign; approval: WeeklyApproval }>> {
  const supabase = getSupabase();
  const { data: approvals, error } = await supabase
    .from('content_approvals')
    .select('id,payload,notes,decided_by,decided_at')
    .eq('subject_type', 'weekly_plan')
    .eq('status', 'approved');
  assertNoError(error, 'Read approved weekly plans');
  const pairs: Array<{ campaign: Campaign; approval: WeeklyApproval }> = [];
  for (const approval of (approvals ?? []) as WeeklyApproval[]) {
    const ids = uuidSelections(approval);
    if (ids.length === 0) continue;
    const { data: campaigns, error: campaignError } = await supabase
      .from('content_campaigns')
      .select('id,slug,title,status,topic_brief,source_bundle,blog_post_id')
      .in('id', ids)
      .is('blog_post_id', null)
      .in('status', ['proposed', 'approved', 'researching']);
    assertNoError(campaignError, 'Read approved campaigns');
    for (const campaign of (campaigns ?? []) as Campaign[]) pairs.push({ campaign, approval });
  }
  return pairs;
}

async function produceCampaign(campaign: Campaign, approval: WeeklyApproval): Promise<void> {
  const supabase = getSupabase();
  if (!await checkBudget()) return;
  const approvedAt = approval.decided_at ?? new Date().toISOString();
  const { error: statusError } = await supabase.from('content_campaigns').update({
    status: 'researching',
    approved_at: approvedAt,
    approved_by: approval.decided_by,
  }).eq('id', campaign.id).is('blog_post_id', null);
  assertNoError(statusError, `Mark campaign ${campaign.id} researching`);

  const research = await buildSourceBundle(campaign);
  const sourcesMd = sourceMarkdown(research.sources);
  const { error: sourceError } = await supabase.from('content_campaigns').update({ source_bundle: research.sources }).eq('id', campaign.id);
  assertNoError(sourceError, `Save source bundle for ${campaign.id}`);
  await saveArtifact({
    campaignId: campaign.id,
    kind: 'brief',
    content: `# ${campaign.title}\n\n${String(campaign.topic_brief.brief ?? '')}\n\n# Research bundle\n\n${sourcesMd}`,
    model: null,
    stage: 'research',
    meta: { source_count: research.sources.length, degraded_without_brave: research.degraded },
  });

  if (!await checkBudget()) return;
  const outline = await generateText({
    campaignId: campaign.id,
    stage: 'outline',
    model: config.models.writer.id,
    system: 'You are a technically rigorous content strategist for Novique.ai. Write for SMB decision-makers and avoid hype.',
    prompt: `Create a detailed markdown outline for a 900-1400 word article. Lead with the SMB operational problem, distinguish evidence from inference, and plan practical takeaways.\n\nCampaign brief:\n${JSON.stringify(campaign.topic_brief)}\n\nSources:\n${sourcesMd}`,
    maxTokens: 2400,
  });
  await saveArtifact({ campaignId: campaign.id, kind: 'outline', content: outline.value, model: config.models.writer.id, stage: 'outline', usage: outline.usage });

  if (!await checkBudget()) return;
  const draft = await generateText({
    campaignId: campaign.id,
    stage: 'draft',
    model: config.models.writer.id,
    system: 'You write plainspoken, technically grounded Novique.ai articles. Put SMB outcomes first. Never use the words revolutionize, unlock, or game-changing.',
    prompt: `Write the full 900-1400 word article in markdown from this outline. Cite factual assertions inline with markdown links to the supplied sources. Do not invent facts, quotes, customers, or Novique experience. Keep the writing useful, specific, and free of hype.\n\nOutline:\n${outline.value}\n\nSources:\n${sourcesMd}`,
    maxTokens: 6500,
  });
  await saveArtifact({ campaignId: campaign.id, kind: 'draft', content: draft.value, model: config.models.writer.id, stage: 'draft', usage: draft.usage });

  if (!await checkBudget()) return;
  const editorial = await generateText({
    campaignId: campaign.id,
    stage: 'editorial',
    model: config.models.writer.id,
    system: 'You are Novique.ai\'s senior editor. Preserve accurate citations and concrete detail while making the prose direct and natural.',
    prompt: `Edit this draft for structure, clarity, SMB-outcome-first framing, and brand voice. Remove repetition and hype. Do not add unsupported claims. Return only revised markdown, still 900-1400 words.\n\n${draft.value}`,
    maxTokens: 6500,
  });
  await saveArtifact({ campaignId: campaign.id, kind: 'editorial', content: editorial.value, model: config.models.writer.id, stage: 'editorial', usage: editorial.usage });

  if (!await checkBudget()) return;
  const factCheck = await generateStructured({
    campaignId: campaign.id,
    stage: 'fact_check',
    model: config.models.writer.id,
    system: 'You are a strict fact checker. Judge claims only against the supplied source excerpts. Never treat general model knowledge as verification.',
    prompt: `Extract every material factual claim from the article and verify it against the source excerpts. Mark unsupported or unclear claims. If any claim is unsupported or unclear, return a revised full article that removes, softens, or explicitly qualifies those claims; otherwise revised_markdown must be null.\n\nARTICLE:\n${editorial.value}\n\nSOURCE EXCERPTS:\n${sourcesMd}`,
    schema: factCheckSchema,
    maxTokens: 7500,
  });
  await saveArtifact({
    campaignId: campaign.id,
    kind: 'fact_check',
    content: JSON.stringify(factCheck.value, null, 2),
    model: config.models.writer.id,
    stage: 'fact_check',
    usage: factCheck.usage,
    meta: { all_supported: factCheck.value.all_supported, flag_count: factCheck.value.flags.length },
  });
  if (!factCheck.value.all_supported && !factCheck.value.revised_markdown) {
    await alertDiscord(`Content campaign “${campaign.title}” stopped at fact-check: unsupported claims require operator review.`);
    throw new Error('Fact-check found unsupported claims but did not return a safe revision');
  }

  if (!await checkBudget()) return;
  const checkedMarkdown = factCheck.value.revised_markdown ?? editorial.value;
  const final = await generateStructured({
    campaignId: campaign.id,
    stage: 'final',
    model: config.models.writer.id,
    system: 'You are the final Novique.ai editor. Produce publishable markdown and concise blog metadata without changing verified facts.',
    prompt: `Finalize this article and its metadata. Keep markdown body at 900-1400 words, preserve source links, use a plainspoken technically grounded SMB-outcome-first voice, and do not use “revolutionize”, “unlock”, or “game-changing”. Summary max 300 characters; meta description max 160; each key insight max 100; core takeaway max 150.\n\n${checkedMarkdown}`,
    schema: finalSchema,
    maxTokens: 7500,
  });
  const words = wordCount(final.value.markdown);
  const banned = /\b(revolutionize|unlock|game-changing)\b/i.exec(final.value.markdown);
  if (words < 900 || words > 1400) throw new Error(`Final article is ${words} words; required range is 900-1400`);
  if (banned) throw new Error(`Final article contains banned hype word: ${banned[0]}`);
  await saveArtifact({
    campaignId: campaign.id,
    kind: 'final',
    content: final.value.markdown,
    model: config.models.writer.id,
    stage: 'final',
    usage: final.usage,
    meta: { word_count: words, title: final.value.title, summary: final.value.summary },
  });

  const { data: admin, error: adminError } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
  assertNoError(adminError, 'Find admin author for blog post');
  if (!admin) throw new Error('Find admin author for blog post: no admin profile returned');
  const baseSlug = slugify(final.value.title, { lower: true, strict: true }).slice(0, 90) || campaign.slug;
  const { data: duplicate } = await supabase.from('blog_posts').select('id').eq('slug', baseSlug).maybeSingle();
  const slug = duplicate ? `${baseSlug}-${campaign.id.slice(0, 8)}` : baseSlug;
  const html = await marked.parse(final.value.markdown, { gfm: true, breaks: true });
  const postData = {
    slug,
    title: final.value.title,
    summary: final.value.summary.slice(0, 300),
    content: html,
    markdown_content: final.value.markdown,
    meta_description: final.value.meta_description.slice(0, 160),
    author_id: admin.id,
    header_image: null,
    featured: false,
    tags: final.value.tags,
    status: 'pending_review',
    ai_generated: true,
    ai_source: 'claude',
    ai_prompt: campaign.title,
    key_insights: final.value.key_insights.map((insight) => insight.slice(0, 100)),
    core_takeaway: final.value.core_takeaway.slice(0, 150),
    published_at: null,
    generation_metadata: {
      campaign_id: campaign.id,
      source_count: research.sources.length,
      models: config.models,
      fact_check: { all_supported: factCheck.value.all_supported, flags: factCheck.value.flags },
      final_usage: final.usage,
    },
  };
  const { data: post, error: postError } = await supabase.from('blog_posts').insert(postData).select('id,slug').single();
  assertNoError(postError, `Create pending-review blog post for ${campaign.id}`);
  if (!post) throw new Error(`Create pending-review blog post for ${campaign.id}: no row returned`);
  const { error: campaignError } = await supabase.from('content_campaigns').update({ status: 'drafted', blog_post_id: post.id }).eq('id', campaign.id).is('blog_post_id', null);
  assertNoError(campaignError, `Link blog post to campaign ${campaign.id}`);
  await alertDiscord(`Draft article ready for review: “${final.value.title}” (${post.slug}), campaign ${campaign.id}.`);
  console.log(`Produced campaign ${campaign.id}: blog post ${post.id} is pending_review.`);
}

export async function produce(): Promise<void> {
  const pairs = await selectedCampaigns();
  if (pairs.length === 0) {
    console.log('Produce complete: no approved, unproduced campaigns.');
    return;
  }
  for (const { campaign, approval } of pairs) {
    try {
      await produceCampaign(campaign, approval);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Campaign ${campaign.id} failed: ${message}`);
      await alertDiscord(`Novique content campaign “${campaign.title}” failed during production: ${message}`);
    }
  }
}

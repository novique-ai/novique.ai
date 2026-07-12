import { readFile } from 'node:fs/promises';
import slugify from 'slugify';
import { z } from 'zod';
import { config } from '../config';
import { candidatesPath } from './discover';
import { budgetAvailable, generateStructured } from '../lib/anthropic';
import { alertDiscord } from '../lib/discord';
import { assertNoError, getSupabase } from '../lib/supabase';
import { currentMonday } from '../lib/time';
import type { FeedCandidate } from '../types';

const briefsSchema = z.object({
  briefs: z.array(z.object({
    index: z.number().int().nonnegative(),
    title: z.string(),
    brief: z.string(),
    audience: z.string(),
    angle: z.string(),
  })),
});

export async function hasPlanForWeek(weekOf: string): Promise<boolean> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('content_approvals')
    .select('id,status,payload')
    .eq('subject_type', 'weekly_plan')
    .in('status', ['pending', 'approved']);
  assertNoError(error, 'Check weekly plan approvals');
  return (data ?? []).some((approval) => approval.payload?.week_of === weekOf || approval.payload?.weekOf === weekOf);
}

export async function plan(): Promise<void> {
  const supabase = getSupabase();
  const weekOf = currentMonday();
  const { data: pending, error: pendingError } = await supabase
    .from('content_approvals')
    .select('id')
    .eq('subject_type', 'weekly_plan')
    .eq('status', 'pending')
    .limit(1);
  assertNoError(pendingError, 'Check pending weekly plans');
  if ((pending ?? []).length > 0) {
    console.log('Plan skipped: a weekly_plan approval is already pending.');
    return;
  }
  const { data: existing, error: existingError } = await supabase
    .from('content_campaigns')
    .select('id')
    .eq('week_of', weekOf)
    .limit(1);
  assertNoError(existingError, 'Check current-week campaigns');
  if ((existing ?? []).length > 0) {
    console.log(`Plan skipped: campaigns already exist for ${weekOf}.`);
    return;
  }

  const parsed = JSON.parse(await readFile(candidatesPath, 'utf8')) as { candidates?: FeedCandidate[] };
  const candidates = (parsed.candidates ?? []).slice(0, 3);
  if (candidates.length === 0) throw new Error('No discovery candidates are available; run worker:discover first');
  const budget = await budgetAvailable();
  if (!budget.available) throw new Error(`Monthly token budget exhausted ($${budget.spent.toFixed(4)} / $${budget.limit.toFixed(2)})`);

  const generated = await generateStructured({
    stage: 'weekly_plan_briefs',
    model: config.models.utility.id,
    system: 'You create concrete, plainspoken content briefs for Novique.ai, an AI implementation company serving SMBs.',
    prompt: `Draft one concise paragraph brief for each candidate. Make the SMB problem, evidence-led angle, and useful outcome explicit. Avoid hype.\n${JSON.stringify(candidates.map((candidate, index) => ({ index, candidate })))}`,
    schema: briefsSchema,
    maxTokens: 2200,
  });

  const rows = generated.value.briefs.slice(0, 3).flatMap((brief) => {
    const candidate = candidates[brief.index];
    if (!candidate) return [];
    return [{
      slug: `${weekOf}-${slugify(brief.title, { lower: true, strict: true }).slice(0, 70)}`,
      title: brief.title,
      status: 'proposed',
      week_of: weekOf,
      topic_brief: {
        brief: brief.brief,
        audience: brief.audience,
        angle: brief.angle,
        score: candidate.score,
        rationale: candidate.rationale,
        candidate,
        plan_usage: generated.usage,
      },
    }];
  });
  if (rows.length === 0) throw new Error('Claude returned no usable weekly briefs');

  const { data: campaigns, error: insertError } = await supabase.from('content_campaigns').insert(rows).select('id,title,topic_brief');
  assertNoError(insertError, 'Create content campaigns');
  const payload = {
    week_of: weekOf,
    articles_per_week: config.articles_per_week,
    campaigns: (campaigns ?? []).map((campaign) => ({ id: campaign.id, title: campaign.title, brief: campaign.topic_brief.brief })),
    campaign_ids: (campaigns ?? []).map((campaign) => campaign.id),
  };
  const { error: approvalError } = await supabase.from('content_approvals').insert({
    subject_type: 'weekly_plan',
    subject_id: weekOf,
    status: 'pending',
    summary: `Choose the ${weekOf} Novique.ai article plan`,
    payload,
  });
  if (approvalError) {
    await supabase.from('content_campaigns').delete().in('id', payload.campaign_ids);
    throw new Error(`Create weekly plan approval: ${approvalError.message}`);
  }

  await alertDiscord(`Novique content plan for ${weekOf} is ready for approval:\n${payload.campaigns.map((item, index) => `${index + 1}. ${item.title} — ${item.brief}`).join('\n')}`);
  console.log(`Weekly plan proposed: ${payload.campaigns.length} campaigns for ${weekOf}.`);
}

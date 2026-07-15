import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { config } from '../config';
import { budgetAvailable, generateStructured } from '../lib/anthropic';
import { fetchFeeds } from '../lib/rss';
import type { FeedCandidate } from '../types';

const stateDir = path.join(process.cwd(), 'worker', 'state');
export const candidatesPath = path.join(stateDir, 'candidates.json');

const scoreSchema = z.object({
  scores: z.array(z.object({
    index: z.number().int().nonnegative(),
    audience_pain: z.number().int().min(0).max(10),
    novique_authority: z.number().int().min(0).max(10),
    evidence: z.number().int().min(0).max(10),
    business_fit: z.number().int().min(0).max(10),
    timing: z.number().int().min(0).max(10),
    rationale: z.string(),
  })),
});

function configuredFeeds(): Array<{ name: string; url: string }> {
  const override = process.env.WORKER_FEEDS_JSON;
  if (!override) return config.feeds;
  const urls = z.array(z.string().url()).parse(JSON.parse(override));
  return urls.map((url, index) => ({ name: `Override feed ${index + 1}`, url }));
}

export async function discover(): Promise<void> {
  const raw = (await fetchFeeds(configuredFeeds())).slice(0, 60);
  await mkdir(stateDir, { recursive: true });

  if (raw.length === 0) {
    await writeFile(candidatesPath, JSON.stringify({ generated_at: new Date().toISOString(), candidates: [] }, null, 2));
    console.warn('WARN: no feed items were available; wrote an empty candidate set without calling Claude.');
    return;
  }

  const budget = await budgetAvailable();
  if (!budget.available) {
    throw new Error(`Monthly token budget exhausted ($${budget.spent.toFixed(4)} / $${budget.limit.toFixed(2)})`);
  }

  const compact = raw.map((item, index) => ({
    index,
    title: item.title,
    source: item.source,
    date: item.published_at,
    summary: item.summary.slice(0, 500),
  }));
  const result = await generateStructured({
    stage: 'discovery_scoring',
    model: config.models.utility.id,
    system: 'You are Novique.ai\'s content strategist. Score every supplied item exactly once and return only the requested structure.',
    prompt: `Score these candidate stories from 0-10 on five axes:\n- audience_pain: concrete pain for SMB owners/operators\n- novique_authority: Novique can speak credibly from an AI implementation perspective\n- evidence: credible specifics can support a useful article\n- business_fit: aligns with practical AI products and custom SMB automation\n- timing: timely enough to publish this week\n\nCandidates:\n${JSON.stringify(compact)}`,
    schema: scoreSchema,
    maxTokens: 5000,
  });

  const scored: FeedCandidate[] = result.value.scores.flatMap((score) => {
    const candidate = raw[score.index];
    if (!candidate) return [];
    const scores = {
      audience_pain: score.audience_pain,
      novique_authority: score.novique_authority,
      evidence: score.evidence,
      business_fit: score.business_fit,
      timing: score.timing,
    };
    return [{ ...candidate, scores, score: Object.values(scores).reduce((sum, value) => sum + value, 0), rationale: score.rationale }];
  }).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 20);

  await writeFile(candidatesPath, JSON.stringify({ generated_at: new Date().toISOString(), usage: result.usage, candidates: scored }, null, 2));
  console.log(`Discovery complete: scored ${scored.length} candidates; top score ${scored[0]?.score ?? 0}/50.`);
}

import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getClient, AuthenticationError, TokenExpiredError } from '../../lib/social/clients';
import { decryptToken } from '../../lib/social/tokenCrypto';
import type { SocialPlatform, SocialPostMetrics } from '../../lib/social/types';
import { config } from '../config';
import { alertDiscord } from '../lib/discord';
import { assertNoError, getSupabase } from '../lib/supabase';

type MetricWindow = keyof typeof config.metrics.windows;

interface PublishedPost {
  id: string;
  platform: SocialPlatform;
  social_account_id: string;
  platform_post_id: string;
  platform_post_url: string | null;
  published_at: string;
  template_id: string | null;
}

interface SocialAccountRow {
  id: string;
  account_name: string;
  access_token: string;
  status: string;
  token_expires_at: string | null;
}

interface DueSnapshot {
  post: PublishedPost;
  window: MetricWindow;
  dueAt: number;
}

interface SnapshotRow {
  post_id: string;
  captured_at: string;
  metrics: Record<string, unknown>;
}

const stateDir = path.join(process.cwd(), 'worker', 'state');

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function accountIsExpired(account: SocialAccountRow): boolean {
  return account.status === 'expired' || (
    account.token_expires_at !== null &&
    new Date(account.token_expires_at).getTime() <= Date.now()
  );
}

function isExpiredTokenError(error: unknown): boolean {
  return error instanceof AuthenticationError || error instanceof TokenExpiredError;
}

async function storeSnapshot(
  post: PublishedPost,
  window: MetricWindow,
  metrics: SocialPostMetrics | { error: string }
): Promise<void> {
  const { error } = await getSupabase().from('social_metric_snapshots').insert({
    post_id: post.id,
    platform: post.platform,
    window,
    captured_at: new Date().toISOString(),
    metrics,
  });
  assertNoError(error, `Store ${window} metrics for post ${post.id}`);
}

async function dueSnapshots(): Promise<DueSnapshot[]> {
  const supabase = getSupabase();
  const oldestBoundaryHours = Math.min(...Object.values(config.metrics.windows));
  const cutoff = new Date(Date.now() - oldestBoundaryHours * 60 * 60 * 1000).toISOString();
  const { data: posts, error: postsError } = await supabase
    .from('social_posts')
    .select('id,platform,social_account_id,platform_post_id,platform_post_url,published_at,template_id')
    .eq('status', 'published')
    .not('social_account_id', 'is', null)
    .not('platform_post_id', 'is', null)
    .not('published_at', 'is', null)
    .lte('published_at', cutoff)
    .order('published_at', { ascending: true })
    .limit(config.metrics.candidate_post_limit);
  assertNoError(postsError, 'Load published posts eligible for metric snapshots');

  const eligiblePosts = (posts ?? []) as PublishedPost[];
  if (eligiblePosts.length === 0) return [];

  const { data: snapshots, error: snapshotsError } = await supabase
    .from('social_metric_snapshots')
    .select('post_id,window')
    .in('post_id', eligiblePosts.map((post) => post.id));
  assertNoError(snapshotsError, 'Load existing metric snapshot windows');

  const existing = new Set(
    (snapshots ?? []).map((snapshot) => `${snapshot.post_id}:${snapshot.window}`)
  );
  const now = Date.now();
  const due: DueSnapshot[] = [];

  for (const post of eligiblePosts) {
    const publishedAt = new Date(post.published_at).getTime();
    if (!Number.isFinite(publishedAt)) continue;

    for (const [window, hours] of Object.entries(config.metrics.windows) as Array<[MetricWindow, number]>) {
      const dueAt = publishedAt + hours * 60 * 60 * 1000;
      if (dueAt <= now && !existing.has(`${post.id}:${window}`)) {
        due.push({ post, window, dueAt });
      }
    }
  }

  return due
    .sort((left, right) => left.dueAt - right.dueAt)
    .slice(0, config.metrics.max_snapshot_calls_per_run);
}

async function captureSnapshots(): Promise<number> {
  const due = await dueSnapshots();
  if (due.length === 0) {
    console.log('Metrics snapshots: no fixed-window reads are due.');
    return 0;
  }

  const accountIds = [...new Set(due.map(({ post }) => post.social_account_id))];
  const { data: accounts, error: accountsError } = await getSupabase()
    .from('social_accounts')
    .select('id,account_name,access_token,status,token_expires_at')
    .in('id', accountIds);
  assertNoError(accountsError, 'Load social accounts for metric snapshots');
  const accountById = new Map(
    ((accounts ?? []) as SocialAccountRow[]).map((account) => [account.id, account])
  );
  const expiredAccountIds = new Set<string>();

  for (const item of due) {
    const account = accountById.get(item.post.social_account_id);
    if (!account) {
      await storeSnapshot(item.post, item.window, { error: 'Social account not found' });
      continue;
    }

    if (accountIsExpired(account)) {
      expiredAccountIds.add(account.id);
      await storeSnapshot(item.post, item.window, { error: 'Social account token is expired' });
      continue;
    }

    try {
      const client = getClient(item.post.platform);
      if (!client.getPostMetrics) {
        throw new Error(`${item.post.platform} does not support post metrics`);
      }
      const token = decryptToken(account.access_token);
      const result = await client.getPostMetrics(token, item.post.platform_post_id);
      await storeSnapshot(item.post, item.window, result);
    } catch (error) {
      if (isExpiredTokenError(error)) expiredAccountIds.add(account.id);
      await storeSnapshot(item.post, item.window, { error: errorMessage(error) });
    }
  }

  if (expiredAccountIds.size > 0) {
    const names = [...expiredAccountIds].map((id) => accountById.get(id)?.account_name || id);
    await alertDiscord(
      `Novique social metrics needs OAuth attention for ${names.length} expired-token account(s): ${names.join(', ')}`
    );
  }

  console.log(`Metrics snapshots: captured ${due.length} fixed-window reading(s).`);
  return due.length;
}

function previousMonth(now = new Date()): { start: Date; end: Date; key: string; label: string } {
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
  const label = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return { start, end, key, label };
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function numericMetric(metrics: Record<string, unknown>, key: string): number | null {
  const value = metrics[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

async function buildDigest(): Promise<{ markdown: string; key: string }> {
  const supabase = getSupabase();
  const month = previousMonth();
  const { data: posts, error: postsError } = await supabase
    .from('social_posts')
    .select('id,platform,platform_post_url,template_id')
    .eq('status', 'published')
    .gte('published_at', month.start.toISOString())
    .lt('published_at', month.end.toISOString());
  assertNoError(postsError, `Load ${month.key} published posts for metrics digest`);

  const monthPosts = (posts ?? []) as Array<Pick<PublishedPost, 'id' | 'platform' | 'platform_post_url' | 'template_id'>>;
  const postIds = monthPosts.map((post) => post.id);
  const templateIds = [...new Set(monthPosts.flatMap((post) => post.template_id ? [post.template_id] : []))];

  const [snapshotResult, templateResult] = await Promise.all([
    postIds.length > 0
      ? supabase
          .from('social_metric_snapshots')
          .select('post_id,captured_at,metrics')
          .in('post_id', postIds)
          .order('captured_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    templateIds.length > 0
      ? supabase.from('platform_templates').select('id,template_name').in('id', templateIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  assertNoError(snapshotResult.error, `Load ${month.key} snapshots for metrics digest`);
  assertNoError(templateResult.error, `Load ${month.key} templates for metrics digest`);

  const latestByPost = new Map<string, SnapshotRow>();
  for (const snapshot of (snapshotResult.data ?? []) as SnapshotRow[]) {
    if (!latestByPost.has(snapshot.post_id)) latestByPost.set(snapshot.post_id, snapshot);
  }
  const templateById = new Map(
    (templateResult.data ?? []).map((template) => [template.id, template.template_name as string])
  );
  const groups = new Map<string, typeof monthPosts>();

  for (const post of monthPosts) {
    const templateKey = post.template_id ? templateById.get(post.template_id) || 'unknown' : 'manual';
    const key = `${post.platform}:${templateKey}`;
    groups.set(key, [...(groups.get(key) || []), post]);
  }

  const lines = [
    `## Novique social metrics — ${month.label}`,
    '',
    `Published posts: ${monthPosts.length}`,
    '',
    '| Platform | Template | Posts | Median / max core metrics | Top post |',
    '| --- | --- | ---: | --- | --- |',
  ];

  for (const [groupKey, groupPosts] of [...groups.entries()].sort()) {
    const [platform, templateKey] = groupKey.split(':', 2);
    const metricSummaries: string[] = [];

    for (const metricKey of config.metrics.core_metrics) {
      const values = groupPosts.flatMap((post) => {
        const snapshot = latestByPost.get(post.id);
        if (!snapshot || typeof snapshot.metrics.error === 'string') return [];
        const value = numericMetric(snapshot.metrics, metricKey);
        return value === null ? [] : [value];
      });
      if (values.length > 0) {
        metricSummaries.push(`${metricKey} ${median(values).toLocaleString()} / ${Math.max(...values).toLocaleString()}`);
      }
    }

    const ranked = groupPosts
      .map((post) => {
        const snapshot = latestByPost.get(post.id);
        const score = snapshot
          ? config.metrics.core_metrics.reduce(
              (total, metricKey) => total + (numericMetric(snapshot.metrics, metricKey) || 0),
              0
            )
          : -1;
        return { post, score };
      })
      .sort((left, right) => right.score - left.score);
    const topUrl = ranked[0]?.post.platform_post_url;
    const topPost = topUrl ? `[View](${topUrl})` : '—';
    lines.push(
      `| ${platform} | ${templateKey} | ${groupPosts.length} | ${metricSummaries.join('; ') || 'No snapshot data'} | ${topPost} |`
    );
  }

  if (groups.size === 0) lines.push('| — | — | 0 | No published posts | — |');
  lines.push('', '_Values are median / max from each post’s latest available 24h, 7d, or 28d snapshot._', '');
  return { markdown: lines.join('\n'), key: month.key };
}

async function writeMonthlyDigest(force: boolean): Promise<void> {
  const month = previousMonth();
  const digestPath = path.join(stateDir, `digest-${month.key}.md`);

  if (!force) {
    try {
      await access(digestPath);
      console.log(`Metrics digest: ${digestPath} already exists; skipping duplicate delivery.`);
      return;
    } catch {
      // A missing file means this month's digest has not been delivered yet.
    }
  }

  const digest = await buildDigest();
  await mkdir(stateDir, { recursive: true });
  await writeFile(digestPath, digest.markdown, 'utf8');
  await alertDiscord(digest.markdown);
  console.log(`Metrics digest: wrote ${digestPath}.`);
}

export async function metrics(): Promise<void> {
  await captureSnapshots();
  const forceDigest = process.argv.includes('--digest');
  if (forceDigest || new Date().getDate() === 1) {
    await writeMonthlyDigest(forceDigest);
  }
}

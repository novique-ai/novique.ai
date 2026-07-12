import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { executePublish } from '@/lib/social/publishExecutor';
import {
  dequeuePost,
  sendPublishQueueAlert,
} from '@/lib/social/publishQueue';
import { createAdminClient } from '@/lib/supabase/server';
import type { SocialPostStatus } from '@/lib/social/types';

export const dynamic = 'force-dynamic';

const CLAIM_LIMIT = 5;
const CANDIDATE_LIMIT = 25;
const LEASE_MINUTES = 10;
const STALE_PUBLISHING_MINUTES = 15;
const BACKOFF_MINUTES = [1, 5, 25] as const;

interface QueueRow {
  id: string;
  social_post_id: string;
  priority: number | null;
  process_after: string;
  locked_at: string | null;
  locked_by: string | null;
  attempts: number | null;
  max_attempts: number | null;
  last_error: string | null;
  created_at: string;
}

interface QueueSummary {
  claimed: number;
  published: number;
  retried: number;
  deadLettered: number;
  needsReview: number;
  swept: number;
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function retryAt(attempt: number): string {
  const index = Math.min(Math.max(attempt - 1, 0), BACKOFF_MINUTES.length - 1);
  return new Date(Date.now() + BACKOFF_MINUTES[index] * 60_000).toISOString();
}

async function deleteClaim(
  row: QueueRow,
  invocationId: string
): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('social_post_queue')
    .delete()
    .eq('id', row.id)
    .eq('locked_by', invocationId)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

async function retryOrDeadLetter(
  row: QueueRow,
  invocationId: string,
  message: string,
  summary: QueueSummary
): Promise<void> {
  const attempts = (row.attempts ?? 0) + 1;
  const maxAttempts = row.max_attempts ?? 3;

  if (attempts >= maxAttempts) {
    const deleted = await deleteClaim(row, invocationId);
    if (!deleted) return;
    summary.deadLettered += 1;
    await sendPublishQueueAlert({
      kind: 'dead_letter',
      postId: row.social_post_id,
      attempts,
      message,
    });
    return;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('social_post_queue')
    .update({
      attempts,
      last_error: message,
      process_after: retryAt(attempts),
      locked_at: null,
      locked_by: null,
    })
    .eq('id', row.id)
    .eq('locked_by', invocationId)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  if (data) summary.retried += 1;
}

async function parkPermanentFailure(
  postId: string,
  currentStatus: SocialPostStatus,
  message: string
): Promise<void> {
  if (currentStatus !== 'queued' && currentStatus !== 'scheduled') return;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('social_posts')
    .update({
      status: 'failed',
      error_details: {
        code: 'PUBLISH_FAILED',
        message,
        timestamp: new Date().toISOString(),
      },
    })
    .eq('id', postId)
    .eq('status', currentStatus);

  if (error) throw error;
}

async function processClaim(
  row: QueueRow,
  invocationId: string,
  summary: QueueSummary
): Promise<void> {
  const supabase = createAdminClient();
  const { data: post, error: postError } = await supabase
    .from('social_posts')
    .select('id, status')
    .eq('id', row.social_post_id)
    .maybeSingle();

  if (postError) throw postError;
  if (!post || (post.status !== 'queued' && post.status !== 'scheduled')) {
    await deleteClaim(row, invocationId);
    return;
  }

  const result = await executePublish(row.social_post_id);
  if (result.ok) {
    await deleteClaim(row, invocationId);
    summary.published += 1;
    return;
  }

  const { data: currentPost, error: reloadError } = await supabase
    .from('social_posts')
    .select('status')
    .eq('id', row.social_post_id)
    .maybeSingle();
  if (reloadError) throw reloadError;

  if (currentPost?.status === 'needs_review') {
    await deleteClaim(row, invocationId);
    summary.needsReview += 1;
    await sendPublishQueueAlert({
      kind: 'needs_review',
      postId: row.social_post_id,
      message: result.error,
    });
    return;
  }

  if (!result.retryable) {
    await parkPermanentFailure(
      row.social_post_id,
      post.status as SocialPostStatus,
      result.error
    );
    await deleteClaim(row, invocationId);
    return;
  }

  await retryOrDeadLetter(row, invocationId, result.error, summary);
}

async function sweepStalePublishing(summary: QueueSummary): Promise<void> {
  const supabase = createAdminClient();
  const cutoff = minutesAgo(STALE_PUBLISHING_MINUTES);
  const message =
    'The post remained in publishing for more than 15 minutes. Verify the platform before retrying.';
  const { data: sweptPosts, error } = await supabase
    .from('social_posts')
    .update({
      status: 'needs_review',
      error_details: {
        code: 'STALE_PUBLISHING',
        message,
        timestamp: new Date().toISOString(),
      },
    })
    .eq('status', 'publishing')
    .lt('updated_at', cutoff)
    .select('id');

  if (error) throw error;

  for (const post of sweptPosts ?? []) {
    await dequeuePost(post.id);
    await sendPublishQueueAlert({
      kind: 'stale_publishing',
      postId: post.id,
      message,
    });
    summary.swept += 1;
  }
}

async function claimDueRows(invocationId: string): Promise<QueueRow[]> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const leaseExpiredBefore = minutesAgo(LEASE_MINUTES);
  const { data: candidates, error } = await supabase
    .from('social_post_queue')
    .select('*')
    .lte('process_after', now)
    .or(`locked_at.is.null,locked_at.lt.${leaseExpiredBefore}`)
    .order('priority', { ascending: false })
    .order('process_after', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(CANDIDATE_LIMIT);

  if (error) throw error;

  const claimed: QueueRow[] = [];
  for (const candidate of (candidates ?? []) as QueueRow[]) {
    if (claimed.length >= CLAIM_LIMIT) break;
    if ((candidate.attempts ?? 0) >= (candidate.max_attempts ?? 3)) continue;

    const lockedAt = new Date().toISOString();
    const { data: won, error: claimError } = await supabase
      .from('social_post_queue')
      .update({ locked_by: invocationId, locked_at: lockedAt })
      .eq('id', candidate.id)
      .eq('attempts', candidate.attempts ?? 0)
      .lte('process_after', now)
      .or(`locked_at.is.null,locked_at.lt.${leaseExpiredBefore}`)
      .select('*')
      .maybeSingle();

    if (claimError) throw claimError;
    if (won) claimed.push(won as QueueRow);
  }

  return claimed;
}

/**
 * Vercel Cron endpoint for due social posts and publish crash recovery.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error('Unauthorized cron request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const summary: QueueSummary = {
    claimed: 0,
    published: 0,
    retried: 0,
    deadLettered: 0,
    needsReview: 0,
    swept: 0,
  };

  try {
    await sweepStalePublishing(summary);

    const invocationId = randomUUID();
    const claimed = await claimDueRows(invocationId);
    summary.claimed = claimed.length;

    for (const row of claimed) {
      try {
        await processClaim(row, invocationId, summary);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown queue error';
        console.error(`Social queue post ${row.social_post_id} failed:`, error);
        try {
          await retryOrDeadLetter(row, invocationId, message, summary);
        } catch (retryError) {
          console.error(`Could not release social queue post ${row.social_post_id}:`, retryError);
        }
      }
    }

    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    console.error('Social queue cron error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        ...summary,
      },
      { status: 500 }
    );
  }
}

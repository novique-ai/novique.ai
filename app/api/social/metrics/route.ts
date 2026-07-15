import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import type {
  SocialMetricsDashboardSummary,
  SocialMetricsPlatformSummary,
  SocialPlatform,
} from '@/lib/social/types';

const PLATFORMS: SocialPlatform[] = ['twitter', 'linkedin', 'instagram'];

function emptyPlatformSummary(): SocialMetricsPlatformSummary {
  return { impressions: null, likes: null, captured_at: null };
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403 });
    }

    const supabase = await createClient();
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const [publishedResult, approvalsResult, snapshotsResult] = await Promise.all([
      supabase
        .from('social_posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')
        .gte('published_at', monthStart.toISOString()),
      supabase
        .from('content_approvals')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('social_metric_snapshots')
        .select('post_id,platform,captured_at,metrics')
        .order('captured_at', { ascending: false })
        .limit(1000),
    ]);

    if (publishedResult.error) throw publishedResult.error;
    if (approvalsResult.error) throw approvalsResult.error;
    if (snapshotsResult.error) throw snapshotsResult.error;

    const platforms = Object.fromEntries(
      PLATFORMS.map((platform) => [platform, emptyPlatformSummary()])
    ) as Record<SocialPlatform, SocialMetricsPlatformSummary>;
    const latestPostIds = new Set<string>();

    for (const snapshot of snapshotsResult.data ?? []) {
      if (latestPostIds.has(snapshot.post_id)) continue;
      latestPostIds.add(snapshot.post_id);

      const platform = snapshot.platform as SocialPlatform;
      if (!PLATFORMS.includes(platform)) continue;
      const metrics = snapshot.metrics as Record<string, unknown> | null;
      if (!metrics || typeof metrics.error === 'string') continue;

      const summary = platforms[platform];
      if (typeof metrics.impressions === 'number') {
        summary.impressions = (summary.impressions ?? 0) + metrics.impressions;
      }
      if (typeof metrics.likes === 'number') {
        summary.likes = (summary.likes ?? 0) + metrics.likes;
      }
      if (!summary.captured_at || snapshot.captured_at > summary.captured_at) {
        summary.captured_at = snapshot.captured_at;
      }
    }

    const data: SocialMetricsDashboardSummary = {
      published_this_month: publishedResult.count ?? 0,
      pending_approvals: approvalsResult.count ?? 0,
      platforms,
    };
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Social metrics summary error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch social metrics' },
      { status: 500 }
    );
  }
}

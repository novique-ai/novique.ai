import { createAdminClient } from '@/lib/supabase/server';
import type { SocialPost } from '@/lib/social/types';

/**
 * Record one clean publish without changing the publish result if bookkeeping
 * is unavailable. The database RPC performs the increment and promotion
 * atomically so concurrent platform callbacks cannot lose progress.
 */
export async function recordCleanPublish(
  post: Pick<SocialPost, 'campaign_id' | 'platform' | 'template_id'>
): Promise<void> {
  if (!post.template_id && !post.campaign_id) return;

  try {
    const supabase = createAdminClient();
    let templateKey = 'campaign_default';

    if (post.template_id) {
      const { data: template, error: templateError } = await supabase
        .from('platform_templates')
        .select('template_name')
        .eq('id', post.template_id)
        .maybeSingle();

      if (templateError) throw templateError;
      templateKey = template?.template_name || post.template_id;
    }

    const { error } = await supabase.rpc('record_template_clean_publish', {
      p_platform: post.platform,
      p_template_key: templateKey,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Template probation bookkeeping failed:', error);
  }
}

import { adaptContentForPlatforms } from '@/lib/ai/socialAdapter';
import { enqueuePost, sendPublishQueueAlert } from '@/lib/social/publishQueue';
import type { ContentSource, SocialPlatform } from '@/lib/social/types';
import { createAdminClient } from '@/lib/supabase/server';

const FALLBACK_PLATFORMS: SocialPlatform[] = ['twitter', 'linkedin'];
const PLATFORM_DELAYS_MS: Record<SocialPlatform, number> = {
  linkedin: 5 * 60 * 1000,
  twitter: 60 * 60 * 1000,
  instagram: 3 * 60 * 60 * 1000,
};

const SOCIAL_PLATFORMS = new Set<SocialPlatform>([
  'twitter',
  'linkedin',
  'instagram',
]);

export interface PublishedBlogPost {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string | null;
  tags: string[] | null;
  header_image: string | null;
  key_insights: string[] | null;
  core_takeaway: string | null;
}

function parsePlatforms(value: unknown): SocialPlatform[] {
  if (!Array.isArray(value)) return FALLBACK_PLATFORMS;

  const platforms = value.filter(
    (platform): platform is SocialPlatform =>
      typeof platform === 'string' &&
      SOCIAL_PLATFORMS.has(platform as SocialPlatform)
  );

  return platforms.length > 0 ? [...new Set(platforms)] : FALLBACK_PLATFORMS;
}

async function alertFanout(postId: string, message: string): Promise<void> {
  await sendPublishQueueAlert({
    kind: 'needs_review',
    postId,
    message,
  });
}

/**
 * Generate the platform derivatives for a newly published canonical article.
 * The blog route schedules this after the response so publishing remains
 * independent from AI, queue, approval, and notification availability.
 */
export async function fanOutDerivatives(
  blogPost: PublishedBlogPost
): Promise<void> {
  const supabase = createAdminClient();

  try {
    const [settingsResult, existingResult, campaignResult] = await Promise.all([
      supabase
        .from('social_settings')
        .select('setting_value')
        .eq('setting_key', 'default_platforms')
        .maybeSingle(),
      supabase
        .from('social_posts')
        .select('platform')
        .eq('source_type', 'blog')
        .eq('source_id', blogPost.id),
      supabase
        .from('content_campaigns')
        .select('id')
        .eq('blog_post_id', blogPost.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (settingsResult.error) throw settingsResult.error;
    if (existingResult.error) throw existingResult.error;
    if (campaignResult.error) throw campaignResult.error;

    const configuredPlatforms = parsePlatforms(
      settingsResult.data?.setting_value
    );
    const existingPlatforms = new Set(
      (existingResult.data || []).map((post) => post.platform as SocialPlatform)
    );
    const pendingPlatforms = configuredPlatforms.filter(
      (platform) => !existingPlatforms.has(platform)
    );

    if (pendingPlatforms.length === 0) return;

    const source: ContentSource = {
      type: 'blog',
      title: blogPost.title,
      summary: blogPost.summary || '',
      content: blogPost.content || '',
      url: `https://novique.ai/blog/${blogPost.slug}`,
      tags: blogPost.tags || [],
      header_image: blogPost.header_image || undefined,
      key_insights: blogPost.key_insights || undefined,
      core_takeaway: blogPost.core_takeaway || undefined,
    };
    const adaptation = await adaptContentForPlatforms({
      source,
      platforms: pendingPlatforms,
      postType: 'auto_distributed',
    });

    for (const generationError of adaptation.errors) {
      await alertFanout(
        blogPost.id,
        `Derivative generation failed for ${generationError.platform}: ${generationError.error}`
      );
    }

    for (const derivative of adaptation.posts) {
      try {
        // Re-check immediately before insert so retries and completed fan-outs
        // do not create a second derivative for the same blog/platform pair.
        const { data: existing, error: existingError } = await supabase
          .from('social_posts')
          .select('id')
          .eq('source_type', 'blog')
          .eq('source_id', blogPost.id)
          .eq('platform', derivative.platform)
          .limit(1)
          .maybeSingle();

        if (existingError) throw existingError;
        if (existing) continue;

        const templateKey =
          derivative.template.template_name || derivative.template.id;
        const { data: probation, error: probationError } = await supabase
          .from('template_probation')
          .select('status')
          .eq('platform', derivative.platform)
          .eq('template_key', templateKey)
          .maybeSingle();

        if (probationError) throw probationError;

        const trusted = probation?.status === 'trusted';
        const scheduledFor = new Date(
          Date.now() + PLATFORM_DELAYS_MS[derivative.platform]
        );
        const mediaUrls = blogPost.header_image
          ? [blogPost.header_image]
          : null;

        const { data: createdPost, error: createError } = await supabase
          .from('social_posts')
          .insert({
            source_type: 'blog',
            source_id: blogPost.id,
            source_title: blogPost.title,
            source_url: source.url,
            platform: derivative.platform,
            content: derivative.content,
            media_urls: mediaUrls,
            hashtags: derivative.hashtags,
            status: trusted ? 'queued' : 'draft',
            auto_publish: trusted,
            scheduled_at: trusted ? scheduledFor.toISOString() : null,
            post_type: 'auto_distributed',
            template_id: derivative.template.id,
            campaign_id: campaignResult.data?.id || null,
            generation_metadata: derivative.generationMetadata,
          })
          .select('id')
          .single();

        if (createError) throw createError;

        if (trusted) {
          try {
            await enqueuePost(createdPost.id, scheduledFor);
          } catch (queueError) {
            const message =
              queueError instanceof Error
                ? queueError.message
                : 'Unknown queue error';
            await supabase
              .from('social_posts')
              .update({
                status: 'draft',
                auto_publish: false,
                scheduled_at: null,
                error_details: {
                  code: 'DERIVATIVE_QUEUE_FAILED',
                  message,
                  timestamp: new Date().toISOString(),
                },
              })
              .eq('id', createdPost.id);
            throw queueError;
          }
        } else {
          const { error: approvalError } = await supabase
            .from('content_approvals')
            .insert({
              subject_type: 'post_review',
              subject_id: createdPost.id,
              status: 'pending',
              summary: `Review ${derivative.platform} derivative for “${blogPost.title}”`,
              payload: {
                social_post_id: createdPost.id,
                blog_post_id: blogPost.id,
                campaign_id: campaignResult.data?.id || null,
                platform: derivative.platform,
                template_id: derivative.template.id,
                template_key: templateKey,
              },
            });

          if (approvalError) throw approvalError;
          await alertFanout(
            createdPost.id,
            `${derivative.platform} derivative is awaiting post review while template “${templateKey}” is on probation.`
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(
          `Derivative fan-out failed for ${derivative.platform}:`,
          error
        );
        await alertFanout(
          blogPost.id,
          `Derivative fan-out failed for ${derivative.platform}: ${message}`
        );
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Blog derivative fan-out failed:', error);
    await alertFanout(blogPost.id, `Blog derivative fan-out failed: ${message}`);
  }
}

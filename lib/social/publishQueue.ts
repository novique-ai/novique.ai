import { discordWebhookNotifications } from '@/lib/services/discord-webhook-notifications';
import { createAdminClient } from '@/lib/supabase/server';

export type PublishQueueAlertKind =
  | 'dead_letter'
  | 'needs_review'
  | 'stale_publishing';

interface PublishQueueAlert {
  kind: PublishQueueAlertKind;
  postId: string;
  message: string;
  attempts?: number;
}

export async function enqueuePost(
  postId: string,
  processAfter: string | Date,
  priority = 0
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('social_post_queue').upsert(
    {
      social_post_id: postId,
      process_after:
        processAfter instanceof Date ? processAfter.toISOString() : processAfter,
      priority,
      locked_at: null,
      locked_by: null,
      attempts: 0,
      last_error: null,
    },
    { onConflict: 'social_post_id' }
  );

  if (error) throw error;
}

export async function dequeuePost(postId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('social_post_queue')
    .delete()
    .eq('social_post_id', postId);

  if (error) throw error;
}

export async function sendPublishQueueAlert(
  alert: PublishQueueAlert
): Promise<void> {
  try {
    const result = await discordWebhookNotifications.socialPublishAlert(alert);
    if (!result.success) {
      console.error('Social publish alert was not delivered:', result.error);
    }
  } catch (error) {
    console.error('Social publish alert failed:', error);
  }
}

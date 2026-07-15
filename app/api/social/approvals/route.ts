import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { decideContentApprovalSchema } from '@/lib/social/apiValidation';
import { enqueuePost } from '@/lib/social/publishQueue';
import type {
  ContentApproval,
  ContentApprovalSubjectType,
  SocialPlatform,
} from '@/lib/social/types';
import { createAdminClient, createClient } from '@/lib/supabase/server';

const APPROVAL_TYPES: ContentApprovalSubjectType[] = [
  'weekly_plan',
  'article',
  'template_probation',
  'image_style',
  'post_review',
];

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (user.role !== 'admin') {
    return {
      response: NextResponse.json(
        { error: 'Forbidden - admin only' },
        { status: 403 }
      ),
    };
  }
  return { user };
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if ('response' in auth) return auth.response;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('content_approvals')
      .select('*')
      .eq('status', 'pending')
      .order('requested_at', { ascending: true });

    if (error) throw error;

    const approvals = (data || []) as ContentApproval[];
    const counts = Object.fromEntries(
      APPROVAL_TYPES.map((type) => [
        type,
        approvals.filter((approval) => approval.subject_type === type).length,
      ])
    ) as Record<ContentApprovalSubjectType, number>;

    return NextResponse.json({
      success: true,
      data: approvals,
      counts,
      total: approvals.length,
    });
  } catch (error) {
    console.error('Content approvals list error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list approvals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('response' in auth) return auth.response;

    const parsed = decideContentApprovalSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid approval decision', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, decision, notes } = parsed.data;
    const supabase = createAdminClient();
    const { data: approval, error: approvalError } = await supabase
      .from('content_approvals')
      .select('*')
      .eq('id', id)
      .eq('status', 'pending')
      .maybeSingle();

    if (approvalError) throw approvalError;
    if (!approval) {
      return NextResponse.json(
        { error: 'Pending approval not found' },
        { status: 404 }
      );
    }

    if (approval.subject_type === 'post_review') {
      const postId = approval.subject_id;

      if (decision === 'approved') {
        const { data: post, error: postError } = await supabase
          .from('social_posts')
          .update({
            status: 'queued',
            auto_publish: true,
            scheduled_at: null,
            approved_by: auth.user.id,
            approved_at: new Date().toISOString(),
            error_details: null,
          })
          .eq('id', postId)
          .in('status', ['draft', 'queued'])
          .select('*')
          .maybeSingle();

        if (postError) throw postError;
        if (!post) {
          return NextResponse.json(
            { error: 'Draft social post not found for this approval' },
            { status: 409 }
          );
        }

        try {
          await enqueuePost(postId, new Date());
        } catch (queueError) {
          const message =
            queueError instanceof Error ? queueError.message : 'Unknown queue error';
          await supabase
            .from('social_posts')
            .update({
              status: 'draft',
              auto_publish: false,
              error_details: {
                code: 'APPROVAL_QUEUE_FAILED',
                message,
                timestamp: new Date().toISOString(),
              },
            })
            .eq('id', postId)
            .eq('status', 'queued');
          throw queueError;
        }
      } else {
        const rejectionDetails = {
          code: 'CONTENT_REJECTED',
          message: notes || 'Social derivative rejected during approval review',
          timestamp: new Date().toISOString(),
          platform_error: { approval_id: id },
        };
        const { error: postError } = await supabase
          .from('social_posts')
          .update({ error_details: rejectionDetails })
          .eq('id', postId)
          .eq('status', 'draft');

        if (postError) throw postError;
      }
    }

    if (
      approval.subject_type === 'template_probation' &&
      decision === 'approved'
    ) {
      const payload = approval.payload as Record<string, unknown>;
      const platform = payload.platform;
      const templateKey = payload.template_key;

      if (
        typeof platform !== 'string' ||
        !['twitter', 'linkedin', 'instagram'].includes(platform) ||
        typeof templateKey !== 'string' ||
        templateKey.length === 0
      ) {
        return NextResponse.json(
          { error: 'Template probation approval payload is invalid' },
          { status: 409 }
        );
      }

      const { error: probationError } = await supabase
        .from('template_probation')
        .upsert(
          {
            platform: platform as SocialPlatform,
            template_key: templateKey,
            status: 'trusted',
          },
          { onConflict: 'platform,template_key' }
        );

      if (probationError) throw probationError;
    }

    const { data: decidedApproval, error: decisionError } = await supabase
      .from('content_approvals')
      .update({
        status: decision,
        notes: notes || null,
        decided_at: new Date().toISOString(),
        decided_by: auth.user.id,
      })
      .eq('id', id)
      .eq('status', 'pending')
      .select('*')
      .maybeSingle();

    if (decisionError) throw decisionError;
    if (!decidedApproval) {
      return NextResponse.json(
        { error: 'Approval was decided concurrently' },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, data: decidedApproval });
  } catch (error) {
    console.error('Content approval decision error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to decide approval',
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/session'
import {
  getScheduledFor,
  isAllowedSocialPostStatusTransition,
  updateSocialPostSchema,
} from '@/lib/social/apiValidation'
import type { SocialPost, SocialPostStatus } from '@/lib/social/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/social/posts/[id]
 * Get a single social post with source details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin' && user.role !== 'editor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const supabase = await createClient()

    let postQuery = supabase
      .from('social_posts')
      .select('*')
      .eq('id', id)

    if (user.role === 'editor') {
      postQuery = postQuery.eq('created_by', user.id)
    }

    const { data: post, error } = await postQuery.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      throw error
    }

    // If post has a source, fetch the source details
    let sourceDetails = null
    if (post.source_type === 'blog' && post.source_id) {
      const { data: blog } = await supabase
        .from('blog_posts')
        .select('slug, title, summary, header_image')
        .eq('id', post.source_id)
        .single()
      sourceDetails = blog
    } else if (post.source_type === 'lab' && post.source_id) {
      const { data: lab } = await supabase
        .from('labs')
        .select('slug, title, overview')
        .eq('id', post.source_id)
        .single()
      sourceDetails = lab
    }

    // Fetch template details if template_id exists
    let templateDetails = null
    if (post.template_id) {
      const { data: template } = await supabase
        .from('platform_templates')
        .select('template_name, display_name, tone')
        .eq('id', post.template_id)
        .single()
      templateDetails = template
    }

    return NextResponse.json({
      success: true,
      data: post as SocialPost,
      source: sourceDetails,
      template: templateDetails,
    })
  } catch (error) {
    console.error('Social post get error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/social/posts/[id]
 * Update a social post
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin' && user.role !== 'editor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    let requestBody: unknown
    try {
      requestBody = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', fieldErrors: {} },
        { status: 400 }
      )
    }

    const initialParse = updateSocialPostSchema.safeParse(requestBody)
    if (!initialParse.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          fieldErrors: initialParse.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const body = initialParse.data
    const readClient = await createClient()

    // First check if post exists and its current status
    let existingQuery = readClient
      .from('social_posts')
      .select('status, platform, content, hashtags, scheduled_at')
      .eq('id', id)

    if (user.role === 'editor') {
      existingQuery = existingQuery.eq('created_by', user.id)
    }

    const { data: existing, error: fetchError } = await existingQuery.single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      throw fetchError
    }

    // Cannot update published posts (except for certain fields)
    if (existing.status === 'published') {
      return NextResponse.json(
        { error: 'Cannot modify published posts' },
        { status: 400 }
      )
    }

    const platformParse = updateSocialPostSchema.safeParse({
      ...body,
      platform: body.platform ?? existing.platform,
      ...(body.platform !== undefined
        ? {
            content: body.content ?? existing.content,
            hashtags: body.hashtags ?? existing.hashtags ?? [],
          }
        : {}),
    })
    if (!platformParse.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          fieldErrors: platformParse.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    if (
      body.status !== undefined &&
      !isAllowedSocialPostStatusTransition(
        existing.status as SocialPostStatus,
        body.status
      )
    ) {
      return NextResponse.json(
        {
          error: `Invalid status transition from ${existing.status} to ${body.status}`,
          fieldErrors: {
            status: [`Cannot transition from ${existing.status} to ${body.status}`],
          },
        },
        { status: 400 }
      )
    }

    const resultingStatus = body.status ?? existing.status
    const scheduledFor = getScheduledFor(body)
    const resultingScheduledFor =
      scheduledFor !== undefined ? scheduledFor : existing.scheduled_at
    if (resultingStatus === 'scheduled' && !resultingScheduledFor) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          fieldErrors: {
            scheduledFor: ['A scheduled date is required when status is scheduled'],
          },
        },
        { status: 400 }
      )
    }

    if (
      resultingStatus === 'scheduled' &&
      resultingScheduledFor &&
      new Date(resultingScheduledFor) <= new Date()
    ) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          fieldErrors: {
            scheduledFor: ['Scheduled date must be in the future'],
          },
        },
        { status: 400 }
      )
    }

    // Build update object with only allowed fields
    const updateData: Record<string, unknown> = {}

    if (body.content !== undefined) {
      updateData.content = body.content
    }

    if (body.platform !== undefined) {
      updateData.platform = body.platform
    }

    if (body.hashtags !== undefined) {
      updateData.hashtags = body.hashtags
    }

    if (body.mediaUrls !== undefined) {
      updateData.media_urls = body.mediaUrls
    }

    if (body.status !== undefined) {
      updateData.status = body.status
    }

    if (scheduledFor !== undefined) {
      updateData.scheduled_at = scheduledFor
    }

    if (body.autoPublish !== undefined) {
      updateData.auto_publish = body.autoPublish
    }

    if (body.socialAccountId !== undefined) {
      updateData.social_account_id = body.socialAccountId
    }

    if (body.sourceType !== undefined) {
      updateData.source_type = body.sourceType
    }

    if (body.sourceId !== undefined) {
      updateData.source_id = body.sourceId
    }

    if (body.sourceTitle !== undefined) {
      updateData.source_title = body.sourceTitle
    }

    if (body.sourceUrl !== undefined) {
      updateData.source_url = body.sourceUrl
    }

    if (body.postType !== undefined) {
      updateData.post_type = body.postType
    }

    if (body.templateId !== undefined) {
      updateData.template_id = body.templateId
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    updateData.updated_at = new Date().toISOString()

    // Editors have no UPDATE RLS policy, so service role is limited to their own unchanged-status row.
    const writeClient = user.role === 'editor' ? createAdminClient() : readClient
    let updateQuery = writeClient
      .from('social_posts')
      .update(updateData)
      .eq('id', id)

    if (user.role === 'editor') {
      updateQuery = updateQuery.eq('created_by', user.id)
    }

    const { data, error } = await updateQuery
      .eq('status', existing.status)
      .neq('status', 'published')
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: data as SocialPost,
    })
  } catch (error) {
    console.error('Social post update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update post' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/social/posts/[id]
 * Delete a non-published social post
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin' && user.role !== 'editor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const readClient = await createClient()

    // First check if post exists and its status
    let existingQuery = readClient
      .from('social_posts')
      .select('status')
      .eq('id', id)

    if (user.role === 'editor') {
      existingQuery = existingQuery.eq('created_by', user.id)
    }

    const { data: existing, error: fetchError } = await existingQuery.single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      throw fetchError
    }

    // Cannot delete published posts
    if (existing.status === 'published') {
      return NextResponse.json(
        { error: 'Cannot delete published posts' },
        { status: 400 }
      )
    }

    // Editors have no DELETE RLS policy, so service role is limited to their own non-published row.
    const writeClient = user.role === 'editor' ? createAdminClient() : readClient
    let deleteQuery = writeClient
      .from('social_posts')
      .delete()
      .eq('id', id)

    if (user.role === 'editor') {
      deleteQuery = deleteQuery.eq('created_by', user.id)
    }

    const { error } = await deleteQuery
      .eq('status', existing.status)
      .neq('status', 'published')

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully',
    })
  } catch (error) {
    console.error('Social post delete error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete post' },
      { status: 500 }
    )
  }
}

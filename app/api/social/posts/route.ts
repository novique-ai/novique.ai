import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/session'
import {
  createSocialPostSchema,
  getScheduledFor,
} from '@/lib/social/apiValidation'
import type { SocialPost, SocialPlatform, SocialPostStatus, SocialSourceType } from '@/lib/social/types'

interface PostStats {
  total: number
  byStatus: Record<SocialPostStatus, number>
  byPlatform: Record<SocialPlatform, number>
}

/**
 * GET /api/social/posts
 * List social posts with filtering and stats
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin' && user.role !== 'editor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const platform = searchParams.get('platform') as SocialPlatform | null
    const status = searchParams.get('status') as SocialPostStatus | null
    const sourceType = searchParams.get('sourceType') as SocialSourceType | null
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query for posts
    let query = supabase
      .from('social_posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (user.role === 'editor') {
      query = query.eq('created_by', user.id)
    }

    // Apply filters
    if (platform) {
      query = query.eq('platform', platform)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (sourceType) {
      query = query.eq('source_type', sourceType)
    }

    if (search) {
      const safeSearch = search.replace(/[(),]/g, ' ').trim()
      if (safeSearch) {
        query = query.or(`content.ilike.%${safeSearch}%,source_title.ilike.%${safeSearch}%`)
      }
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: posts, error, count } = await query

    if (error) {
      throw error
    }

    // Get stats (separate query for all posts, not filtered)
    let statsQuery = supabase
      .from('social_posts')
      .select('status, platform')

    if (user.role === 'editor') {
      statsQuery = statsQuery.eq('created_by', user.id)
    }

    const { data: allPosts } = await statsQuery

    const stats: PostStats = {
      total: allPosts?.length || 0,
      byStatus: {
        draft: 0,
        queued: 0,
        scheduled: 0,
        publishing: 0,
        published: 0,
        failed: 0,
      },
      byPlatform: {
        twitter: 0,
        linkedin: 0,
        instagram: 0,
      },
    }

    allPosts?.forEach((post) => {
      if (post.status in stats.byStatus) {
        stats.byStatus[post.status as SocialPostStatus]++
      }
      if (post.platform in stats.byPlatform) {
        stats.byPlatform[post.platform as SocialPlatform]++
      }
    })

    return NextResponse.json({
      success: true,
      data: posts as SocialPost[],
      stats,
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    })
  } catch (error) {
    console.error('Social posts list error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/social/posts
 * Create a new social post
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin' && user.role !== 'editor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let requestBody: unknown
    try {
      requestBody = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', fieldErrors: {} },
        { status: 400 }
      )
    }

    const parsed = createSocialPostSchema.safeParse(requestBody)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const body = parsed.data
    const supabase = await createClient()

    // Create post
    const { data, error } = await supabase
      .from('social_posts')
      .insert({
        platform: body.platform,
        content: body.content,
        hashtags: body.hashtags,
        media_urls: body.mediaUrls || [],
        status: body.status,
        social_account_id: body.socialAccountId || null,
        source_type: body.sourceType || 'manual',
        source_id: body.sourceId ?? null,
        source_title: body.sourceTitle ?? null,
        source_url: body.sourceUrl ?? null,
        auto_publish: body.autoPublish ?? false,
        scheduled_at: getScheduledFor(body) ?? null,
        post_type: body.postType || 'auto_distributed',
        template_id: body.templateId ?? null,
        created_by: user.id,
      })
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
    console.error('Social post create error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create post' },
      { status: 500 }
    )
  }
}

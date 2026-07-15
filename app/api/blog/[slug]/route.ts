import { after, NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/session'
import { fanOutDerivatives } from '@/lib/social/derivativeFanout'

interface RouteParams {
  params: Promise<{
    slug: string
  }>
}

/**
 * GET /api/blog/[slug]
 * Get single blog post by slug
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { slug } = await params

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*, author:profiles(id, full_name, email)')
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Blog fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/blog/[slug]
 * Update blog post
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check role (admin or editor)
    if (user.role !== 'admin' && user.role !== 'editor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = await createClient()
    const { slug } = await params
    const body = await request.json()

    // Get existing post
    const { data: existingPost, error: fetchError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .single()

    if (fetchError || !existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check permissions: editors can only edit their own posts, admins can edit all
    if (user.role === 'editor' && existingPost.author_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own posts' },
        { status: 403 }
      )
    }

    // Update post
    const updateData: any = {
      title: body.title,
      summary: body.summary,
      content: body.content,
      markdown_content: body.markdownContent || null,
      meta_description: body.metaDescription || body.summary,
      header_image: body.headerImage || null,
      featured: body.featured || false,
      tags: body.tags || [],
      // Social metadata
      key_insights: body.keyInsights || [],
      core_takeaway: body.coreTakeaway || null,
      updated_at: new Date().toISOString(),
    }

    // Only admins can change status
    if (user.role === 'admin' && body.status) {
      updateData.status = body.status

      // Set published_at when publishing
      if (body.status === 'published' && !existingPost.published_at) {
        updateData.published_at = new Date().toISOString()
      }
    }

    // Update slug if changed (admin only)
    if (user.role === 'admin' && body.slug && body.slug !== slug) {
      // Check if new slug is available
      const { data: slugExists } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', body.slug)
        .single()

      if (slugExists) {
        return NextResponse.json({ error: 'New slug already exists' }, { status: 409 })
      }

      updateData.slug = body.slug
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('slug', slug)
      .select('*, author:profiles(id, full_name, email)')
      .single()

    if (error) {
      throw error
    }

    if (existingPost.status !== 'published' && data.status === 'published') {
      after(async () => {
        await fanOutDerivatives(data).catch((fanoutError) => {
          console.error('Blog derivative fan-out invocation failed:', fanoutError)
        })
      })
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Blog update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update post' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/blog/[slug]
 * Delete blog post (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can delete posts
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can delete posts' },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    const { slug } = await params

    // Check if post exists
    const { data: existingPost, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .single()

    if (fetchError || !existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Delete post
    const { error } = await supabase.from('blog_posts').delete().eq('slug', slug)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully',
    })
  } catch (error) {
    console.error('Blog delete error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete post' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getClient, isTokenExpired, TokenExpiredError } from '@/lib/social/clients'
import { decryptToken, encryptToken } from '@/lib/social/tokenCrypto'
import type { SocialPost, SocialAccount, SocialPlatform } from '@/lib/social/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/social/posts/[id]/publish
 * Publish a draft social post to the platform
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can publish
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403 })
    }

    const { id } = await params
    const supabase = createAdminClient()

    // Get the post
    const { data: post, error: postError } = await supabase
      .from('social_posts')
      .select('*')
      .eq('id', id)
      .single()

    if (postError) {
      if (postError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      throw postError
    }

    // Validate post status
    if (post.status === 'published') {
      return NextResponse.json(
        { error: 'Post is already published' },
        { status: 400 }
      )
    }

    if (post.status === 'publishing') {
      return NextResponse.json(
        { error: 'Post is currently being published' },
        { status: 400 }
      )
    }

    // Get connected account for this platform
    const { data: accounts, error: accountError } = await supabase
      .from('social_accounts')
      .select('id, access_token, refresh_token, token_expires_at')
      .eq('platform', post.platform)
      .eq('status', 'active')
      .limit(1)

    if (accountError) throw accountError

    if (!accounts || accounts.length === 0) {
      return NextResponse.json(
        { error: `No active ${post.platform} account connected. Connect an account in Settings > Social Accounts.` },
        { status: 400 }
      )
    }

    const account = accounts[0] as SocialAccount
    account.access_token = decryptToken(account.access_token)
    account.refresh_token = account.refresh_token
      ? decryptToken(account.refresh_token)
      : null

    // Check if token is expired
    if (isTokenExpired(account.token_expires_at)) {
      // Try to refresh the token
      if (account.refresh_token) {
        try {
          const client = getClient(post.platform as SocialPlatform)
          const newTokens = await client.refreshAccessToken(account.refresh_token)

          // Update account with new tokens
          await supabase
            .from('social_accounts')
            .update({
              access_token: encryptToken(newTokens.access_token),
              refresh_token: encryptToken(
                newTokens.refresh_token || account.refresh_token
              ),
              token_expires_at: new Date(
                Date.now() + (newTokens.expires_in || 3600) * 1000
              ).toISOString(),
              last_verified_at: new Date().toISOString(),
            })
            .eq('id', account.id)

          account.access_token = newTokens.access_token
        } catch (refreshError) {
          // Mark account as expired
          await supabase
            .from('social_accounts')
            .update({
              status: 'expired',
              error_message: 'Token refresh failed',
            })
            .eq('id', account.id)

          return NextResponse.json(
            { error: `${post.platform} account token expired. Please reconnect the account.` },
            { status: 400 }
          )
        }
      } else {
        // No refresh token, mark as expired
        await supabase
          .from('social_accounts')
          .update({
            status: 'expired',
            error_message: 'Token expired and no refresh token available',
          })
          .eq('id', account.id)

        return NextResponse.json(
          { error: `${post.platform} account token expired. Please reconnect the account.` },
          { status: 400 }
        )
      }
    }

    // Update post status to publishing
    await supabase
      .from('social_posts')
      .update({ status: 'publishing' })
      .eq('id', id)

    // Get the platform client and publish
    const client = getClient(post.platform as SocialPlatform)

    try {
      const result = await client.createPost(
        account.access_token,
        post.content,
        post.media_urls || undefined
      )

      // Update post with success
      const { data: updatedPost, error: updateError } = await supabase
        .from('social_posts')
        .update({
          status: 'published',
          platform_post_id: result.id,
          platform_post_url: result.url,
          published_at: new Date().toISOString(),
          social_account_id: account.id,
          error_details: null,
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      return NextResponse.json({
        success: true,
        data: updatedPost as SocialPost,
        platformUrl: result.url,
      })
    } catch (publishError) {
      // Update post with failure
      const errorMessage = publishError instanceof Error ? publishError.message : 'Unknown error'
      const errorDetails = {
        error: errorMessage,
        timestamp: new Date().toISOString(),
        platform: post.platform,
      }

      await supabase
        .from('social_posts')
        .update({
          status: 'failed',
          error_details: errorDetails,
        })
        .eq('id', id)

      // Check if it's an auth error
      if (publishError instanceof TokenExpiredError) {
        await supabase
          .from('social_accounts')
          .update({
            status: 'expired',
            error_message: 'Token expired during publish',
          })
          .eq('id', account.id)
      }

      console.error(
        `Failed to publish to ${post.platform}:`,
        publishError instanceof Error ? publishError.name : 'UnknownError'
      )

      return NextResponse.json(
        {
          error: `Failed to publish to ${post.platform}: ${errorMessage}`,
          details: errorDetails,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error(
      'Social post publish error:',
      error instanceof Error ? error.name : 'UnknownError'
    )
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to publish post' },
      { status: 500 }
    )
  }
}

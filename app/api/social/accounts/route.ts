import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';
import {
  getClient,
  generateOAuthState,
  generatePKCE,
  isTokenExpired,
} from '@/lib/social/clients';
import { getSocialOAuthCallbackUrl } from '@/lib/social/oauth';
import type { SocialPlatform } from '@/lib/social/types';

/**
 * GET /api/social/accounts
 *
 * List connected social media accounts.
 * Only returns accounts for admin users.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = await createClient();

    // Get all social accounts
    const { data: accounts, error } = await supabase
      .from('social_accounts')
      .select(
        `
        id,
        platform,
        account_name,
        account_handle,
        account_id,
        profile_image_url,
        status,
        last_verified_at,
        error_message,
        token_expires_at,
        rate_limit_remaining,
        rate_limit_reset_at,
        created_at,
        updated_at,
        connected_by
      `
      )
      .order('platform', { ascending: true });

    if (error) {
      throw error;
    }

    // Check token expiration status for each account
    const accountsWithStatus = accounts?.map((account) => ({
      ...account,
      token_status: account.token_expires_at
        ? isTokenExpired(account.token_expires_at)
          ? 'expired'
          : 'valid'
        : 'unknown',
    }));

    return NextResponse.json({
      success: true,
      data: accountsWithStatus || [],
    });
  } catch (error) {
    console.error('Social accounts list error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch accounts',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/social/accounts
 *
 * Initiate OAuth flow to connect a new social account.
 * Returns the authorization URL to redirect the user to.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { platform } = body as { platform: SocialPlatform };

    // Validate platform
    if (!['twitter', 'linkedin', 'instagram'].includes(platform)) {
      return NextResponse.json(
        { error: `Invalid platform: ${platform}` },
        { status: 400 }
      );
    }

    // Get the platform client
    const client = getClient(platform);

    // Generate OAuth state for CSRF protection
    const state = generateOAuthState();
    const codeVerifier = client.requiresPKCE
      ? (await generatePKCE()).codeVerifier
      : undefined;

    // Build and persist the exact redirect URI used throughout this flow
    const redirectUri = getSocialOAuthCallbackUrl(platform);
    const supabase = createAdminClient();
    const { error: transactionError } = await supabase
      .from('social_oauth_transactions')
      .insert({
        platform,
        state,
        code_verifier: codeVerifier || null,
        redirect_uri: redirectUri,
        created_by: user.id,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

    if (transactionError) {
      throw transactionError;
    }

    // Get authorization URL
    const authorizationUrl = client.getAuthorizationUrl(
      state,
      redirectUri,
      codeVerifier
    );

    return NextResponse.json({
      success: true,
      data: {
        authorizationUrl,
        state,
      },
    });
  } catch (error) {
    console.error('Social account connect error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to initiate OAuth',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/social/accounts
 *
 * Disconnect a social account.
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { accountId } = body as { accountId: string };

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    const supabase = createAdminClient();

    // Delete the account
    const { error } = await supabase
      .from('social_accounts')
      .delete()
      .eq('id', accountId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Account disconnected successfully',
    });
  } catch (error) {
    console.error('Social account disconnect error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to disconnect account',
      },
      { status: 500 }
    );
  }
}

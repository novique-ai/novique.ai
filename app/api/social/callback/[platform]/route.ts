import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';
import {
  getClient,
  SocialAPIError,
  AuthenticationError,
  calculateTokenExpiration,
} from '@/lib/social/clients';
import { getSocialOAuthCallbackUrl } from '@/lib/social/oauth';
import { encryptToken } from '@/lib/social/tokenCrypto';
import type { SocialPlatform, SocialAccountStatus } from '@/lib/social/types';

function accountRedirect(
  requestUrl: string,
  status: 'success' | 'error',
  platform: string,
  message?: string
) {
  const url = new URL('/admin/social/accounts', requestUrl);
  url.searchParams.set('status', status);
  url.searchParams.set('platform', platform);
  if (message) {
    url.searchParams.set('message', message);
    if (status === 'error') {
      url.searchParams.set('error', message);
    }
  }
  return NextResponse.redirect(url);
}

/**
 * GET /api/social/callback/[platform]
 *
 * OAuth callback handler for social media platforms.
 * Handles the authorization code exchange and stores tokens.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform: platformParam } = await params;
  const platform = platformParam as SocialPlatform;

  // Validate platform
  if (!['twitter', 'linkedin', 'instagram'].includes(platform)) {
    return accountRedirect(
      request.url,
      'error',
      platformParam,
      `Invalid platform: ${platformParam}`
    );
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (!state) {
    return accountRedirect(
      request.url,
      'error',
      platform,
      'Missing OAuth state'
    );
  }

  try {
    // Verify user is authenticated and is admin
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.redirect(
        new URL('/login?redirect=/admin/social/accounts', request.url)
      );
    }

    if (user.role !== 'admin') {
      return accountRedirect(
        request.url,
        'error',
        platform,
        'Only admins can connect social accounts'
      );
    }

    const supabase = createAdminClient();
    const { data: transaction, error: transactionError } = await supabase
      .from('social_oauth_transactions')
      .select(
        'id, platform, code_verifier, redirect_uri, created_by, expires_at, consumed_at'
      )
      .eq('state', state)
      .maybeSingle();

    if (transactionError) {
      throw transactionError;
    }

    if (!transaction) {
      return accountRedirect(
        request.url,
        'error',
        platform,
        'Invalid OAuth state'
      );
    }

    if (transaction.platform !== platform) {
      return accountRedirect(
        request.url,
        'error',
        platform,
        'OAuth platform mismatch'
      );
    }

    if (transaction.created_by !== user.id) {
      return accountRedirect(
        request.url,
        'error',
        platform,
        'OAuth transaction belongs to another user'
      );
    }

    if (transaction.consumed_at) {
      return accountRedirect(
        request.url,
        'error',
        platform,
        'OAuth transaction has already been used'
      );
    }

    if (new Date(transaction.expires_at).getTime() <= Date.now()) {
      return accountRedirect(
        request.url,
        'error',
        platform,
        'OAuth transaction has expired'
      );
    }

    // Atomically claim the transaction so concurrent callbacks cannot reuse it
    const consumedAt = new Date().toISOString();
    const { data: consumedTransaction, error: consumeError } = await supabase
      .from('social_oauth_transactions')
      .update({ consumed_at: consumedAt })
      .eq('id', transaction.id)
      .is('consumed_at', null)
      .gt('expires_at', consumedAt)
      .select('id')
      .maybeSingle();

    if (consumeError) {
      throw consumeError;
    }

    if (!consumedTransaction) {
      return accountRedirect(
        request.url,
        'error',
        platform,
        'OAuth transaction is no longer valid'
      );
    }

    // Provider errors and malformed callbacks are also single-use
    if (error) {
      console.error(`[${platform}] OAuth error:`, error, errorDescription);
      return accountRedirect(
        request.url,
        'error',
        platform,
        errorDescription || error
      );
    }

    if (!code) {
      return accountRedirect(
        request.url,
        'error',
        platform,
        'Missing authorization code'
      );
    }

    // Get the platform client only after the transaction is validated and claimed
    const client = getClient(platform);

    // Exchange code for tokens
    const redirectUri = getSocialOAuthCallbackUrl(
      platform,
      transaction.redirect_uri
    );
    const tokens = await client.exchangeCodeForToken(
      code,
      redirectUri,
      transaction.code_verifier || undefined
    );
    console.log(`[${platform} OAuth] Token exchange succeeded`);

    // Resolve the platform identity associated with the new token.
    let accountInfo: { id: string; name: string; handle?: string; profile_image_url?: string };
    if (platform === 'linkedin') {
      const userInfoResponse = await fetch(
        'https://api.linkedin.com/v2/userinfo',
        { headers: { Authorization: `Bearer ${tokens.access_token}` } }
      );
      if (!userInfoResponse.ok) {
        throw new AuthenticationError(
          'linkedin',
          'LinkedIn identity lookup failed. Please reconnect the account.'
        );
      }
      const userInfo = (await userInfoResponse.json()) as {
        sub?: string;
        name?: string;
        given_name?: string;
        family_name?: string;
        picture?: string;
      };
      if (!userInfo.sub) {
        throw new AuthenticationError(
          'linkedin',
          'LinkedIn identity response did not include a member ID.'
        );
      }
      accountInfo = {
        id: `urn:li:person:${userInfo.sub}`,
        name:
          userInfo.name ||
          [userInfo.given_name, userInfo.family_name].filter(Boolean).join(' ') ||
          'LinkedIn Member',
        profile_image_url: userInfo.picture,
      };
    } else {
      try {
        accountInfo = await client.getAccountInfo(tokens.access_token);
      } catch (err) {
        console.warn(
          `[${platform} OAuth] Profile lookup failed, continuing with connection:`,
          err instanceof Error ? err.name : 'UnknownError'
        );
        accountInfo = {
          id: `${platform}-${user.id}`,
          name: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Account`,
        };
      }
    }

    // Calculate token expiration
    const tokenExpiresAt = tokens.expires_in
      ? calculateTokenExpiration(tokens.expires_in)
      : null;
    const encryptedAccessToken = encryptToken(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token
      ? encryptToken(tokens.refresh_token)
      : null;

    // Store in database using admin client (bypasses RLS)
    // Check if account already exists
    let { data: existingAccount } = await supabase
      .from('social_accounts')
      .select('id')
      .eq('platform', platform)
      .eq('account_id', accountInfo.id)
      .single();

    if (!existingAccount && platform === 'linkedin') {
      const { data: syntheticAccount } = await supabase
        .from('social_accounts')
        .select('id')
        .eq('platform', platform)
        .eq('account_id', `linkedin-${user.id}`)
        .maybeSingle();
      existingAccount = syntheticAccount;
    }

    if (existingAccount) {
      // Update existing account
      const { error: updateError } = await supabase
        .from('social_accounts')
        .update({
          account_name: accountInfo.name,
          account_handle: accountInfo.handle || null,
          account_id: accountInfo.id,
          profile_image_url: accountInfo.profile_image_url || null,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expires_at: tokenExpiresAt?.toISOString() || null,
          token_scope: tokens.scope || null,
          status: 'active' as SocialAccountStatus,
          last_verified_at: new Date().toISOString(),
          error_message: null,
          connected_by: user.id,
        })
        .eq('id', existingAccount.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Create new account
      const { error: insertError } = await supabase
        .from('social_accounts')
        .insert({
          platform,
          account_name: accountInfo.name,
          account_handle: accountInfo.handle || null,
          account_id: accountInfo.id,
          profile_image_url: accountInfo.profile_image_url || null,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expires_at: tokenExpiresAt?.toISOString() || null,
          token_scope: tokens.scope || null,
          status: 'active' as SocialAccountStatus,
          last_verified_at: new Date().toISOString(),
          connected_by: user.id,
        });

      if (insertError) {
        throw insertError;
      }
    }

    // Redirect to success page
    return accountRedirect(
      request.url,
      'success',
      platform,
      `${platform} account connected successfully`
    );
  } catch (err) {
    console.error(
      `[${platform}] OAuth callback error:`,
      err instanceof Error ? err.name : 'UnknownError'
    );

    let errorMessage = 'Failed to connect account';

    if (err instanceof AuthenticationError) {
      errorMessage = 'Authentication failed. Please try again.';
    } else if (err instanceof SocialAPIError) {
      errorMessage = err.message;
    } else if (err instanceof Error) {
      errorMessage = err.message;
    }

    return accountRedirect(request.url, 'error', platform, errorMessage);
  }
}

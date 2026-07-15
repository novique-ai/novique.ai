import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';
import {
  getClient,
  TokenExpiredError,
  calculateTokenExpiration,
} from '@/lib/social/clients';
import { decryptToken, encryptToken } from '@/lib/social/tokenCrypto';
import type { SocialPlatform } from '@/lib/social/types';

/**
 * POST /api/social/accounts/[id]/refresh
 *
 * Refresh the access token for a social account.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: accountId } = await params;

  try {
    // Verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Get the account
    const { data: account, error: fetchError } = await supabase
      .from('social_accounts')
      .select('platform, access_token, refresh_token, token_scope')
      .eq('id', accountId)
      .single();

    if (fetchError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const platform = account.platform as SocialPlatform;
    const client = getClient(platform);
    const accessToken = decryptToken(account.access_token);
    const refreshToken = account.refresh_token
      ? decryptToken(account.refresh_token)
      : null;

    // Check if we have a refresh token
    if (!refreshToken) {
      // For Instagram/Facebook, we can try to extend the token
      if (platform === 'instagram') {
        try {
          const newTokens = await client.refreshAccessToken(accessToken);

          // Update the account
          const { error: updateError } = await supabase
            .from('social_accounts')
            .update({
              access_token: encryptToken(newTokens.access_token),
              token_expires_at: newTokens.expires_in
                ? calculateTokenExpiration(newTokens.expires_in).toISOString()
                : null,
              status: 'active',
              last_verified_at: new Date().toISOString(),
              error_message: null,
            })
            .eq('id', accountId);

          if (updateError) {
            throw updateError;
          }

          return NextResponse.json({
            success: true,
            message: 'Token refreshed successfully',
          });
        } catch (err) {
          // Mark as expired
          await supabase
            .from('social_accounts')
            .update({
              status: 'expired',
              error_message: 'Token refresh failed. Please reconnect the account.',
            })
            .eq('id', accountId);

          return NextResponse.json(
            {
              error: 'Token refresh failed. Please reconnect the account.',
              requiresReconnect: true,
            },
            { status: 400 }
          );
        }
      }

      return NextResponse.json(
        {
          error: 'No refresh token available. Please reconnect the account.',
          requiresReconnect: true,
        },
        { status: 400 }
      );
    }

    // Refresh the token
    try {
      const newTokens = await client.refreshAccessToken(refreshToken);

      // Update the account
      const { error: updateError } = await supabase
        .from('social_accounts')
        .update({
          access_token: encryptToken(newTokens.access_token),
          refresh_token: encryptToken(newTokens.refresh_token || refreshToken),
          token_expires_at: newTokens.expires_in
            ? calculateTokenExpiration(newTokens.expires_in).toISOString()
            : null,
          token_scope: newTokens.scope || account.token_scope,
          status: 'active',
          last_verified_at: new Date().toISOString(),
          error_message: null,
        })
        .eq('id', accountId);

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        message: 'Token refreshed successfully',
      });
    } catch (err) {
      // Check if refresh token is also expired
      if (err instanceof TokenExpiredError) {
        await supabase
          .from('social_accounts')
          .update({
            status: 'expired',
            error_message:
              'Refresh token expired. Please reconnect the account.',
          })
          .eq('id', accountId);

        return NextResponse.json(
          {
            error: 'Refresh token expired. Please reconnect the account.',
            requiresReconnect: true,
          },
          { status: 400 }
        );
      }

      throw err;
    }
  } catch (error) {
    console.error(
      'Token refresh error:',
      error instanceof Error ? error.name : 'UnknownError'
    );
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to refresh token',
      },
      { status: 500 }
    );
  }
}

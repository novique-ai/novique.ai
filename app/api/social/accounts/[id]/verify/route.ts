import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getClient } from '@/lib/social/clients';
import { decryptToken } from '@/lib/social/tokenCrypto';
import type { SocialPlatform, SocialAccountStatus } from '@/lib/social/types';

/**
 * POST /api/social/accounts/[id]/verify
 *
 * Verify that a social account's credentials are still valid.
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
      .select('platform, access_token')
      .eq('id', accountId)
      .single();

    if (fetchError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const platform = account.platform as SocialPlatform;
    const client = getClient(platform);
    const accessToken = decryptToken(account.access_token);

    // Verify credentials
    const isValid = await client.verifyCredentials(accessToken);

    // Update account status
    const newStatus: SocialAccountStatus = isValid ? 'active' : 'expired';
    const updateData: Record<string, unknown> = {
      status: newStatus,
      last_verified_at: new Date().toISOString(),
    };

    if (isValid) {
      updateData.error_message = null;

      // Also update account info while we're at it
      try {
        const accountInfo = await client.getAccountInfo(accessToken);
        updateData.account_name = accountInfo.name;
        updateData.account_handle = accountInfo.handle;
        updateData.profile_image_url = accountInfo.profile_image_url;
      } catch {
        // Ignore errors updating account info
      }
    } else {
      updateData.error_message =
        'Credentials are no longer valid. Please reconnect the account.';
    }

    const { error: updateError } = await supabase
      .from('social_accounts')
      .update(updateData)
      .eq('id', accountId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      data: {
        valid: isValid,
        status: newStatus,
      },
    });
  } catch (error) {
    console.error(
      'Account verification error:',
      error instanceof Error ? error.name : 'UnknownError'
    );
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to verify account',
      },
      { status: 500 }
    );
  }
}

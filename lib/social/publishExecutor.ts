import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/server';
import {
  AuthenticationError,
  ContentPolicyError,
  getClient,
  isTokenExpired,
  RateLimitError,
  SocialAPIError,
  TokenExpiredError,
} from '@/lib/social/clients';
import { decryptToken, encryptToken } from '@/lib/social/tokenCrypto';
import { recordCleanPublish } from '@/lib/social/probation';
import type {
  SocialPlatform,
  SocialPost,
  SocialPostError,
  SocialPostStatus,
} from '@/lib/social/types';

interface ExecutePublishOptions {
  manual?: boolean;
}

interface PublishAttempt {
  id: string;
  status: 'started' | 'succeeded' | 'failed' | 'unknown';
  platform_post_id: string | null;
  platform_post_url: string | null;
  error_code: string | null;
  error_message: string | null;
}

interface PublishAccount {
  id: string;
  platform: SocialPlatform;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  account_id: string;
  account_name: string;
  token_scope: string | null;
}

export type ExecutePublishResult =
  | {
      ok: true;
      data: SocialPost;
      platformUrl: string | null;
      adopted: boolean;
    }
  | {
      ok: false;
      error: string;
      retryable: boolean;
      statusCode: number;
      details?: SocialPostError;
    };

interface ClassifiedError {
  code: string;
  message: string;
  retryable: boolean;
}

const PUBLISHABLE_STATUSES: readonly SocialPostStatus[] = [
  'draft',
  'queued',
  'scheduled',
  'failed',
];

function buildIdempotencyKey(post: SocialPost, accountId: string): string {
  const sortedMediaUrls = [...(post.media_urls ?? [])].sort();
  const contentHash = createHash('sha256')
    .update(post.content + JSON.stringify(sortedMediaUrls))
    .digest('hex')
    .slice(0, 16);

  return `${post.id}:${accountId}:${contentHash}`;
}

function classifyPublishError(error: unknown): ClassifiedError {
  const message = error instanceof Error ? error.message : 'Unknown error';

  if (error instanceof RateLimitError) {
    return { code: error.code, message, retryable: true };
  }

  if (error instanceof TokenExpiredError) {
    return { code: error.code, message, retryable: false };
  }

  if (error instanceof AuthenticationError) {
    return { code: error.code, message, retryable: false };
  }

  if (error instanceof ContentPolicyError) {
    return { code: error.code, message, retryable: false };
  }

  if (
    error instanceof TypeError ||
    (error instanceof Error && error.name === 'AbortError')
  ) {
    return { code: 'NETWORK_ERROR', message, retryable: true };
  }

  if (error instanceof SocialAPIError) {
    const retryable =
      error.statusCode === 408 ||
      error.statusCode === 429 ||
      (error.statusCode !== undefined && error.statusCode >= 500);

    return { code: error.code, message, retryable };
  }

  return { code: 'VALIDATION_ERROR', message, retryable: false };
}

function errorDetails(
  classified: ClassifiedError,
  platform: SocialPlatform
): SocialPostError {
  return {
    code: classified.code,
    message: classified.message,
    timestamp: new Date().toISOString(),
    platform_error: { platform, retryable: classified.retryable },
  };
}

async function loadPost(postId: string): Promise<
  | { post: SocialPost }
  | { result: ExecutePublishResult }
> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('social_posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return {
        result: {
          ok: false,
          error: 'Post not found',
          retryable: false,
          statusCode: 404,
        },
      };
    }

    throw error;
  }

  return { post: data as SocialPost };
}

async function loadAccountById(
  accountId: string,
  platform: SocialPlatform
): Promise<PublishAccount | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('social_accounts')
    .select(
      'id, platform, access_token, refresh_token, token_expires_at, account_id, account_name, token_scope'
    )
    .eq('id', accountId)
    .eq('platform', platform)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw error;
  return data as PublishAccount | null;
}

async function resolveAccount(
  post: SocialPost
): Promise<
  | { account: PublishAccount; post: SocialPost }
  | { result: ExecutePublishResult }
> {
  const supabase = createAdminClient();

  if (post.social_account_id) {
    const account = await loadAccountById(post.social_account_id, post.platform);
    if (!account) {
      return {
        result: {
          ok: false,
          error: `The selected ${post.platform} account is not active. Reconnect it or select another account.`,
          retryable: false,
          statusCode: 400,
        },
      };
    }

    return { account, post };
  }

  const { data: accounts, error } = await supabase
    .from('social_accounts')
    .select(
      'id, platform, access_token, refresh_token, token_expires_at, account_id, account_name, token_scope'
    )
    .eq('platform', post.platform)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) throw error;
  if (!accounts || accounts.length === 0) {
    return {
      result: {
        ok: false,
        error: `No active ${post.platform} account connected. Connect an account in Settings > Social Accounts.`,
        retryable: false,
        statusCode: 400,
      },
    };
  }

  const account = accounts[0] as PublishAccount;
  const { data: persistedPost, error: persistError } = await supabase
    .from('social_posts')
    .update({ social_account_id: account.id })
    .eq('id', post.id)
    .is('social_account_id', null)
    .select('*')
    .maybeSingle();

  if (persistError) throw persistError;
  if (persistedPost) {
    return { account, post: persistedPost as SocialPost };
  }

  const reloaded = await loadPost(post.id);
  if ('result' in reloaded) return reloaded;
  if (!reloaded.post.social_account_id) {
    return {
      result: {
        ok: false,
        error: 'Could not persist the selected social account',
        retryable: true,
        statusCode: 409,
      },
    };
  }

  const persistedAccount = await loadAccountById(
    reloaded.post.social_account_id,
    post.platform
  );
  if (!persistedAccount) {
    return {
      result: {
        ok: false,
        error: `The selected ${post.platform} account is not active.`,
        retryable: false,
        statusCode: 400,
      },
    };
  }

  return { account: persistedAccount, post: reloaded.post };
}

async function markPostNeedsReview(
  post: SocialPost,
  message: string
): Promise<void> {
  const supabase = createAdminClient();
  const details: SocialPostError = {
    code: 'AMBIGUOUS_PUBLISH_RESULT',
    message,
    timestamp: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('social_posts')
    .update({ status: 'needs_review', error_details: details })
    .eq('id', post.id)
    .eq('status', post.status)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  if (data) return;

  const reloaded = await loadPost(post.id);
  if ('result' in reloaded || reloaded.post.status === 'needs_review') return;

  if (reloaded.post.status === 'publishing') {
    const { error: retryError } = await supabase
      .from('social_posts')
      .update({ status: 'needs_review', error_details: details })
      .eq('id', post.id)
      .eq('status', 'publishing');

    if (retryError) throw retryError;
  }
}

async function adoptSucceededAttempt(
  post: SocialPost,
  attempt: PublishAttempt
): Promise<ExecutePublishResult> {
  const supabase = createAdminClient();

  if (!attempt.platform_post_id) {
    await markPostNeedsReview(
      post,
      'A succeeded publish attempt is missing its platform post ID.'
    );
    return {
      ok: false,
      error: 'Publish result is incomplete and requires review',
      retryable: false,
      statusCode: 409,
    };
  }

  if (
    post.status === 'published' &&
    post.platform_post_id === attempt.platform_post_id
  ) {
    return {
      ok: true,
      data: post,
      platformUrl: attempt.platform_post_url,
      adopted: true,
    };
  }

  const { data, error } = await supabase
    .from('social_posts')
    .update({
      status: 'published',
      platform_post_id: attempt.platform_post_id,
      platform_post_url: attempt.platform_post_url,
      published_at: post.published_at ?? new Date().toISOString(),
      error_details: null,
    })
    .eq('id', post.id)
    .eq('status', post.status)
    .select('*')
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      error: 'The platform post succeeded, but the local post could not be updated. Retrying is safe.',
      retryable: true,
      statusCode: 500,
    };
  }

  if (data) {
    await recordCleanPublish(data as SocialPost);
    return {
      ok: true,
      data: data as SocialPost,
      platformUrl: attempt.platform_post_url,
      adopted: true,
    };
  }

  const reloaded = await loadPost(post.id);
  if (
    'post' in reloaded &&
    reloaded.post.status === 'published' &&
    reloaded.post.platform_post_id === attempt.platform_post_id
  ) {
    return {
      ok: true,
      data: reloaded.post,
      platformUrl: attempt.platform_post_url,
      adopted: true,
    };
  }

  return {
    ok: false,
    error: 'The post changed during publish result adoption. Retrying is safe.',
    retryable: true,
    statusCode: 409,
  };
}

async function handleExistingAttempt(
  post: SocialPost,
  attempt: PublishAttempt
): Promise<ExecutePublishResult | null> {
  const supabase = createAdminClient();

  if (attempt.status === 'succeeded') {
    return adoptSucceededAttempt(post, attempt);
  }

  if (attempt.status === 'started' || attempt.status === 'unknown') {
    if (attempt.status === 'started') {
      const { data: unknownAttempt, error } = await supabase
        .from('social_publish_attempts')
        .update({
          status: 'unknown',
          error_code: 'AMBIGUOUS_PUBLISH_RESULT',
          error_message: 'A prior publish run ended without a durable result.',
          finished_at: new Date().toISOString(),
        })
        .eq('id', attempt.id)
        .eq('status', 'started')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (!unknownAttempt) {
        const { data: current, error: rereadError } = await supabase
          .from('social_publish_attempts')
          .select('*')
          .eq('id', attempt.id)
          .single();
        if (rereadError) throw rereadError;

        if ((current as PublishAttempt).status === 'succeeded') {
          return adoptSucceededAttempt(post, current as PublishAttempt);
        }
      }
    }

    await markPostNeedsReview(
      post,
      'A prior publish may have reached the platform. Verify the platform before retrying.'
    );
    return {
      ok: false,
      error: 'Publish result is ambiguous and requires manual review before retrying',
      retryable: false,
      statusCode: 409,
    };
  }

  return null;
}

async function findExistingAttempt(
  idempotencyKey: string
): Promise<PublishAttempt | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('social_publish_attempts')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();

  if (error) throw error;
  return data as PublishAttempt | null;
}

async function prepareAttempt(
  post: SocialPost,
  accountId: string,
  idempotencyKey: string,
  manual: boolean
): Promise<
  | { attempt: PublishAttempt }
  | { result: ExecutePublishResult }
> {
  const supabase = createAdminClient();
  const { data: existing, error: lookupError } = await supabase
    .from('social_publish_attempts')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing) {
    const attempt = existing as PublishAttempt;
    const handled = await handleExistingAttempt(post, attempt);
    if (handled) return { result: handled };

    const storedRetryable =
      attempt.error_code?.endsWith(':retryable') === true;

    if (!manual && !storedRetryable) {
      return {
        result: {
          ok: false,
          error: attempt.error_message ?? 'The prior publish attempt failed permanently',
          retryable: false,
          statusCode: 400,
        },
      };
    }

    const { data: restarted, error: restartError } = await supabase
      .from('social_publish_attempts')
      .update({
        status: 'started',
        platform_post_id: null,
        platform_post_url: null,
        error_code: null,
        error_message: null,
        started_at: new Date().toISOString(),
        finished_at: null,
      })
      .eq('id', attempt.id)
      .eq('status', 'failed')
      .select('*')
      .maybeSingle();

    if (restartError) throw restartError;
    if (restarted) return { attempt: restarted as PublishAttempt };

    const { data: raced, error: raceReadError } = await supabase
      .from('social_publish_attempts')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .single();
    if (raceReadError) throw raceReadError;

    const raceResult = await handleExistingAttempt(
      post,
      raced as PublishAttempt
    );
    if (raceResult) return { result: raceResult };

    return {
      result: {
        ok: false,
        error: 'Publish attempt changed concurrently. Retry the request.',
        retryable: true,
        statusCode: 409,
      },
    };
  }

  const { data: inserted, error: insertError } = await supabase
    .from('social_publish_attempts')
    .insert({
      post_id: post.id,
      account_id: accountId,
      idempotency_key: idempotencyKey,
      status: 'started',
    })
    .select('*')
    .single();

  if (!insertError) return { attempt: inserted as PublishAttempt };
  if (insertError.code !== '23505') throw insertError;

  const { data: raced, error: raceReadError } = await supabase
    .from('social_publish_attempts')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .single();
  if (raceReadError) throw raceReadError;

  const raceResult = await handleExistingAttempt(post, raced as PublishAttempt);
  if (raceResult) return { result: raceResult };

  return {
    result: {
      ok: false,
      error: 'Publish attempt changed concurrently. Retry the request.',
      retryable: true,
      statusCode: 409,
    },
  };
}

async function refreshAccountToken(
  account: PublishAccount,
  platform: SocialPlatform
): Promise<string> {
  const supabase = createAdminClient();
  const accessToken = decryptToken(account.access_token);
  const refreshToken = account.refresh_token
    ? decryptToken(account.refresh_token)
    : null;

  if (!isTokenExpired(account.token_expires_at)) return accessToken;

  if (!refreshToken) {
    if (platform !== 'instagram') {
      await supabase
        .from('social_accounts')
        .update({
          status: 'expired',
          error_message: 'Token expired and no refresh token available',
        })
        .eq('id', account.id);
      throw new TokenExpiredError(platform);
    }

    try {
      const client = getClient(platform);
      // Meta long-lived tokens do not provide a refresh_token. Extend the
      // access token at publish time for now; WS4+ should hoist this into a
      // proactive account-refresh job before posts reach the executor.
      const newTokens = await client.refreshAccessToken(accessToken);
      const { error } = await supabase
        .from('social_accounts')
        .update({
          access_token: encryptToken(newTokens.access_token),
          token_expires_at: new Date(
            Date.now() + (newTokens.expires_in || 3600) * 1000
          ).toISOString(),
          status: 'active',
          last_verified_at: new Date().toISOString(),
          error_message: null,
        })
        .eq('id', account.id);

      if (error) throw error;
      return newTokens.access_token;
    } catch (error) {
      await supabase
        .from('social_accounts')
        .update({
          status: 'expired',
          error_message: 'Instagram token extension failed',
        })
        .eq('id', account.id);

      if (error instanceof SocialAPIError) throw error;
      throw new AuthenticationError(
        platform,
        'Instagram account token extension failed. Please reconnect the account.'
      );
    }
  }

  try {
    const client = getClient(platform);
    const newTokens = await client.refreshAccessToken(refreshToken);
    const { error } = await supabase
      .from('social_accounts')
      .update({
        access_token: encryptToken(newTokens.access_token),
        refresh_token: encryptToken(newTokens.refresh_token || refreshToken),
        token_expires_at: new Date(
          Date.now() + (newTokens.expires_in || 3600) * 1000
        ).toISOString(),
        last_verified_at: new Date().toISOString(),
      })
      .eq('id', account.id);

    if (error) throw error;
    return newTokens.access_token;
  } catch (error) {
    await supabase
      .from('social_accounts')
      .update({ status: 'expired', error_message: 'Token refresh failed' })
      .eq('id', account.id);

    if (error instanceof SocialAPIError) throw error;
    throw new AuthenticationError(
      platform,
      `${platform} account token refresh failed. Please reconnect the account.`
    );
  }
}

/**
 * Execute one social publish with a durable, payload-specific idempotency key.
 * This is the only application code path permitted to call createPost.
 */
export async function executePublish(
  postId: string,
  opts: ExecutePublishOptions = {}
): Promise<ExecutePublishResult> {
  const supabase = createAdminClient();
  const loaded = await loadPost(postId);
  if ('result' in loaded) return loaded.result;

  let post = loaded.post;
  if (post.status === 'published') {
    return {
      ok: false,
      error: 'Post is already published',
      retryable: false,
      statusCode: 400,
    };
  }

  const resolved = await resolveAccount(post);
  if ('result' in resolved) return resolved.result;
  post = resolved.post;
  const account = resolved.account;
  const idempotencyKey = buildIdempotencyKey(post, account.id);

  const existingAttempt = await findExistingAttempt(idempotencyKey);
  if (existingAttempt) {
    const existingResult = await handleExistingAttempt(post, existingAttempt);
    if (existingResult) return existingResult;

    if (post.status === 'publishing' && existingAttempt.status === 'failed') {
      const details: SocialPostError = {
        code: existingAttempt.error_code?.replace(/:retryable$/, '') ?? 'PUBLISH_FAILED',
        message: existingAttempt.error_message ?? 'The prior publish attempt failed',
        timestamp: new Date().toISOString(),
      };
      const { data: reconciled, error: reconcileError } = await supabase
        .from('social_posts')
        .update({ status: 'failed', error_details: details })
        .eq('id', post.id)
        .eq('status', 'publishing')
        .select('*')
        .maybeSingle();
      if (reconcileError) throw reconcileError;
      if (reconciled) post = reconciled as SocialPost;
    }
  }

  if (post.status === 'publishing') {
    await markPostNeedsReview(
      post,
      'The post was left publishing without a durable publish result.'
    );
    return {
      ok: false,
      error: 'Publish state is ambiguous and requires manual review',
      retryable: false,
      statusCode: 409,
    };
  }
  if (post.status === 'needs_review') {
    return {
      ok: false,
      error: 'Post requires manual review before it can be published again',
      retryable: false,
      statusCode: 409,
    };
  }
  if (!PUBLISHABLE_STATUSES.includes(post.status)) {
    return {
      ok: false,
      error: `Post cannot be published from status ${post.status}`,
      retryable: false,
      statusCode: 400,
    };
  }

  const prepared = await prepareAttempt(
    post,
    account.id,
    idempotencyKey,
    opts.manual === true
  );
  if ('result' in prepared) return prepared.result;
  const attempt = prepared.attempt;

  const { data: claimedPost, error: claimError } = await supabase
    .from('social_posts')
    .update({ status: 'publishing', error_details: null })
    .eq('id', post.id)
    .eq('status', post.status)
    .select('*')
    .maybeSingle();

  if (claimError) throw claimError;
  if (!claimedPost) {
    await supabase
      .from('social_publish_attempts')
      .update({
        status: 'failed',
        error_code: 'CONCURRENT_DISPATCH',
        error_message: 'Post status changed before the publish call.',
        finished_at: new Date().toISOString(),
      })
      .eq('id', attempt.id)
      .eq('status', 'started');

    return {
      ok: false,
      error: 'Post changed concurrently and was not published',
      retryable: true,
      statusCode: 409,
    };
  }
  post = claimedPost as SocialPost;

  let platformResult: { id: string; url: string };
  try {
    const accessToken = await refreshAccountToken(account, post.platform);
    const client = getClient(post.platform);
    platformResult = await client.createPost(
      accessToken,
      post.content,
      post.media_urls || undefined,
      {
        accountId: account.id,
        platformUserId: account.account_id,
        accountName: account.account_name,
        scopes: account.token_scope?.split(/[\s,]+/).filter(Boolean) ?? null,
      }
    );
  } catch (error) {
    const classified = classifyPublishError(error);
    const details = errorDetails(classified, post.platform);

    const { data: failedAttempt, error: attemptUpdateError } = await supabase
      .from('social_publish_attempts')
      .update({
        status: 'failed',
        error_code: classified.retryable
          ? `${classified.code}:retryable`
          : classified.code,
        error_message: classified.message,
        finished_at: new Date().toISOString(),
      })
      .eq('id', attempt.id)
      .eq('status', 'started')
      .select('id')
      .maybeSingle();
    if (attemptUpdateError) throw attemptUpdateError;

    if (!failedAttempt) {
      await markPostNeedsReview(
        post,
        'The publish attempt changed while a platform result was pending.'
      );
      return {
        ok: false,
        error: 'Publish result is ambiguous and requires manual review',
        retryable: false,
        statusCode: 409,
      };
    }

    const { error: postUpdateError } = await supabase
      .from('social_posts')
      .update({ status: 'failed', error_details: details })
      .eq('id', post.id)
      .eq('status', 'publishing');
    if (postUpdateError) throw postUpdateError;

    if (error instanceof TokenExpiredError) {
      await supabase
        .from('social_accounts')
        .update({
          status: 'expired',
          error_message: 'Token expired during publish',
        })
        .eq('id', account.id);
    }

    console.error(
      `Failed to publish to ${post.platform}:`,
      error instanceof Error ? error.name : 'UnknownError'
    );

    return {
      ok: false,
      error: `Failed to publish to ${post.platform}: ${classified.message}`,
      retryable: classified.retryable,
      statusCode: 500,
      details,
    };
  }

  const { data: succeededAttempt, error: attemptError } = await supabase
    .from('social_publish_attempts')
    .update({
      status: 'succeeded',
      platform_post_id: platformResult.id,
      platform_post_url: platformResult.url,
      error_code: null,
      error_message: null,
      finished_at: new Date().toISOString(),
    })
    .eq('id', attempt.id)
    .eq('status', 'started')
    .select('*')
    .maybeSingle();

  if (attemptError || !succeededAttempt) {
    await markPostNeedsReview(
      post,
      'The platform accepted the post, but its durable result could not be recorded.'
    );
    return {
      ok: false,
      error: 'The platform may have published the post, but confirmation requires manual review',
      retryable: false,
      statusCode: 500,
    };
  }

  return adoptSucceededAttempt(post, succeededAttempt as PublishAttempt);
}

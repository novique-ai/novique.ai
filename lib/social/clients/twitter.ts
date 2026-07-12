/**
 * X (Twitter) API Client
 *
 * Implements OAuth 2.0 with PKCE for user authentication
 * and Twitter API v2 for posting and engagement.
 *
 * Requires:
 * - TWITTER_CLIENT_ID
 * - TWITTER_CLIENT_SECRET
 * - Basic tier ($100/month) or higher for posting
 */

import crypto from 'crypto';
import type {
  SocialClient,
  OAuthTokenResponse,
  SocialPostMetrics,
} from '../types';
import {
  SocialAPIError,
  AuthenticationError,
  TokenExpiredError,
  RateLimitError,
  fetchWithTimeout,
  handleAPIResponse,
  withRetry,
  buildURL,
  calculateTokenExpiration,
  countCharacters,
  sleep,
} from './base';

// =====================================================
// CONFIGURATION
// =====================================================

const TWITTER_API_BASE = 'https://api.x.com/2';
const TWITTER_AUTH_BASE = 'https://twitter.com/i/oauth2';
const TWITTER_TOKEN_URL = 'https://api.x.com/2/oauth2/token';

// Twitter OAuth 2.0 scopes
const TWITTER_SCOPES = [
  'tweet.read',
  'tweet.write',
  'users.read',
  'offline.access',
].join(' ');

// Character limit for tweets
const TWEET_MAX_LENGTH = 280;
const MAX_MEDIA_ITEMS = 4;
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const GIF_MAX_BYTES = 15 * 1024 * 1024;
const MEDIA_CHUNK_BYTES = 1024 * 1024;
const MEDIA_PROCESSING_TIMEOUT_MS = 30_000;

// =====================================================
// TYPES
// =====================================================

interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
}

interface TwitterTweet {
  id: string;
  text: string;
  edit_history_tweet_ids?: string[];
}

interface TwitterTweetResponse {
  data: TwitterTweet;
}

interface TwitterUserResponse {
  data: TwitterUser;
}

interface TwitterPublicMetrics {
  retweet_count: number;
  reply_count: number;
  like_count: number;
  quote_count: number;
  impression_count?: number;
  bookmark_count?: number;
}

interface TwitterTweetMetricsResponse {
  data: {
    id: string;
    public_metrics: TwitterPublicMetrics;
    non_public_metrics?: {
      impression_count: number;
      url_link_clicks?: number;
      user_profile_clicks?: number;
    };
    organic_metrics?: {
      impression_count: number;
      like_count: number;
      reply_count: number;
      retweet_count: number;
      url_link_clicks?: number;
      user_profile_clicks?: number;
    };
  };
}

interface TwitterMediaInputWithAltText {
  url: string;
  alt_text?: string;
  altText?: string;
}

type TwitterMediaInput = string | TwitterMediaInputWithAltText;

interface NormalizedMediaInput {
  url: string;
  altText?: string;
}

type SupportedImageType =
  'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

interface DownloadedMedia {
  bytes: Uint8Array;
  mediaType: SupportedImageType;
}

interface TwitterMediaProcessingInfo {
  state?: 'pending' | 'in_progress' | 'succeeded' | 'failed';
  check_after_secs?: number;
  error?: { code?: number; name?: string; message?: string };
}

interface TwitterMediaUploadResponse {
  data: {
    id: string;
    processing_info?: TwitterMediaProcessingInfo;
  };
}

interface TwitterPostBody {
  text: string;
  media?: { media_ids: string[] };
  reply?: { in_reply_to_tweet_id: string };
}

// =====================================================
// MEDIA UPLOAD
// =====================================================

function mediaValidationError(message: string): SocialAPIError {
  return new SocialAPIError(
    `Twitter media validation failed: ${message}`,
    'twitter',
    'MEDIA_VALIDATION_ERROR',
    400
  );
}

function normalizeMediaInputs(
  mediaInputs: TwitterMediaInput[] | undefined
): NormalizedMediaInput[] {
  if (!mediaInputs?.length) return [];
  if (mediaInputs.length > MAX_MEDIA_ITEMS) {
    throw mediaValidationError(
      `received ${mediaInputs.length} images; X allows at most ${MAX_MEDIA_ITEMS}`
    );
  }

  return mediaInputs.map((input, index) => {
    const normalized =
      typeof input === 'string'
        ? { url: input }
        : { url: input.url, altText: input.alt_text ?? input.altText };

    if (!normalized.url) {
      throw mediaValidationError(`media index ${index} is missing a URL`);
    }
    if (normalized.altText && normalized.altText.length > 1000) {
      throw mediaValidationError(
        `alt text at media index ${index} exceeds 1000 characters`
      );
    }
    return normalized;
  });
}

function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '::1' ||
    host.startsWith('fc') ||
    host.startsWith('fd') ||
    host.startsWith('fe80:') ||
    host === 'metadata.google.internal'
  ) {
    return true;
  }

  const octets = host.split('.').map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet))) {
    return false;
  }

  return (
    octets[0] === 0 ||
    octets[0] === 10 ||
    octets[0] === 127 ||
    (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168)
  );
}

function validatePublicMediaUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw mediaValidationError(`invalid media URL: ${rawUrl}`);
  }

  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    isPrivateHostname(url.hostname)
  ) {
    throw mediaValidationError(
      `media URL must be a public HTTPS URL: ${rawUrl}`
    );
  }
  return url;
}

function normalizeContentType(value: string | null): SupportedImageType | null {
  const mediaType = value?.split(';', 1)[0].trim().toLowerCase();
  if (mediaType === 'image/jpeg' || mediaType === 'image/pjpeg') {
    return 'image/jpeg';
  }
  if (
    mediaType === 'image/png' ||
    mediaType === 'image/webp' ||
    mediaType === 'image/gif'
  ) {
    return mediaType;
  }
  return null;
}

function detectImageType(bytes: Uint8Array): SupportedImageType | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return 'image/jpeg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }
  const prefix = String.fromCharCode(...bytes.slice(0, 12));
  if (prefix.startsWith('GIF87a') || prefix.startsWith('GIF89a')) {
    return 'image/gif';
  }
  if (prefix.startsWith('RIFF') && prefix.slice(8, 12) === 'WEBP') {
    return 'image/webp';
  }
  return null;
}

async function readBoundedResponse(
  response: Response,
  maxBytes: number
): Promise<Uint8Array> {
  if (!response.body) {
    throw new SocialAPIError(
      'Twitter media download returned an empty body',
      'twitter',
      'MEDIA_DOWNLOAD_ERROR',
      502
    );
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  const reader = response.body.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw mediaValidationError(
          `download exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB limit`
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const result = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

async function downloadMedia(rawUrl: string): Promise<DownloadedMedia> {
  let url = validatePublicMediaUrl(rawUrl);
  let response: Response | undefined;

  for (let redirect = 0; redirect <= 5; redirect++) {
    response = await fetchWithTimeout(url.toString(), {
      method: 'GET',
      redirect: 'manual',
      timeout: 30_000,
      headers: { Accept: 'image/jpeg,image/png,image/webp,image/gif' },
    });

    if (response.status < 300 || response.status >= 400) break;
    const location = response.headers.get('location');
    if (!location) {
      throw new SocialAPIError(
        `Twitter media download redirect had no location: ${url}`,
        'twitter',
        'MEDIA_DOWNLOAD_ERROR',
        502
      );
    }
    url = validatePublicMediaUrl(new URL(location, url).toString());
    response = undefined;
  }

  if (!response) {
    throw new SocialAPIError(
      `Twitter media download exceeded the redirect limit: ${rawUrl}`,
      'twitter',
      'MEDIA_DOWNLOAD_ERROR',
      502
    );
  }
  if (!response.ok) {
    throw new SocialAPIError(
      `Twitter media download failed with HTTP ${response.status}: ${rawUrl}`,
      'twitter',
      'MEDIA_DOWNLOAD_ERROR',
      response.status
    );
  }

  const declaredType = normalizeContentType(
    response.headers.get('content-type')
  );
  const declaredLength = Number(response.headers.get('content-length'));
  const initialLimit =
    declaredType === 'image/gif'
      ? GIF_MAX_BYTES
      : declaredType
        ? IMAGE_MAX_BYTES
        : GIF_MAX_BYTES;
  if (Number.isFinite(declaredLength) && declaredLength > initialLimit) {
    throw mediaValidationError(
      `${declaredType === 'image/gif' ? 'GIF' : 'image'} is ${declaredLength} bytes; limit is ${initialLimit} bytes`
    );
  }

  // Unknown types get the GIF ceiling while streaming, then the detected type's
  // stricter limit is enforced below.
  const bytes = await readBoundedResponse(response, initialLimit);
  const detectedType = detectImageType(bytes);
  if (!detectedType || (declaredType && declaredType !== detectedType)) {
    throw mediaValidationError(
      `unsupported or mismatched image type at ${rawUrl}; expected jpg, png, webp, or gif`
    );
  }

  const sizeLimit =
    detectedType === 'image/gif' ? GIF_MAX_BYTES : IMAGE_MAX_BYTES;
  if (bytes.byteLength > sizeLimit) {
    throw mediaValidationError(
      `${detectedType === 'image/gif' ? 'GIF' : 'image'} is ${bytes.byteLength} bytes; limit is ${sizeLimit} bytes`
    );
  }
  return { bytes, mediaType: detectedType };
}

async function waitForMediaProcessing(
  accessToken: string,
  mediaId: string,
  initialInfo?: TwitterMediaProcessingInfo
): Promise<void> {
  let processingInfo = initialInfo;
  const deadline = Date.now() + MEDIA_PROCESSING_TIMEOUT_MS;

  while (
    processingInfo &&
    processingInfo.state !== 'succeeded' &&
    processingInfo.state !== 'failed'
  ) {
    const waitMs = Math.max(
      250,
      Math.min((processingInfo.check_after_secs ?? 1) * 1000, 5_000)
    );
    if (Date.now() + waitMs > deadline) {
      throw new SocialAPIError(
        `Twitter media ${mediaId} processing timed out`,
        'twitter',
        'MEDIA_PROCESSING_TIMEOUT',
        503
      );
    }
    await sleep(waitMs);

    const statusUrl = buildURL(`${TWITTER_API_BASE}/media/upload`, {
      command: 'STATUS',
      media_id: mediaId,
    });
    const status = await withRetry(async () => {
      const response = await fetchWithTimeout(statusUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return handleAPIResponse<TwitterMediaUploadResponse>(response, 'twitter');
    }, 'twitter');
    processingInfo = status.data.processing_info;
  }

  if (processingInfo?.state === 'failed') {
    throw new SocialAPIError(
      `Twitter media ${mediaId} processing failed: ${processingInfo.error?.message ?? processingInfo.error?.name ?? 'unknown error'}`,
      'twitter',
      'MEDIA_PROCESSING_FAILED',
      400,
      processingInfo.error
    );
  }
}

async function uploadMedia(
  accessToken: string,
  media: DownloadedMedia,
  altText?: string
): Promise<string> {
  const initialized = await withRetry(async () => {
    const response = await fetchWithTimeout(
      `${TWITTER_API_BASE}/media/upload/initialize`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          total_bytes: media.bytes.byteLength,
          media_type: media.mediaType,
          media_category:
            media.mediaType === 'image/gif' ? 'tweet_gif' : 'tweet_image',
        }),
      }
    );
    return handleAPIResponse<TwitterMediaUploadResponse>(response, 'twitter');
  }, 'twitter');

  const mediaId = initialized.data.id;
  for (
    let offset = 0, segmentIndex = 0;
    offset < media.bytes.byteLength;
    offset += MEDIA_CHUNK_BYTES, segmentIndex++
  ) {
    const chunk = media.bytes.slice(offset, offset + MEDIA_CHUNK_BYTES);
    await withRetry(async () => {
      const response = await fetchWithTimeout(
        `${TWITTER_API_BASE}/media/upload/${mediaId}/append`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            media: Buffer.from(chunk).toString('base64'),
            segment_index: segmentIndex,
          }),
        }
      );
      return handleAPIResponse<unknown>(response, 'twitter');
    }, 'twitter');
  }

  const finalized = await withRetry(async () => {
    const response = await fetchWithTimeout(
      `${TWITTER_API_BASE}/media/upload/${mediaId}/finalize`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return handleAPIResponse<TwitterMediaUploadResponse>(response, 'twitter');
  }, 'twitter');

  await waitForMediaProcessing(
    accessToken,
    mediaId,
    finalized.data.processing_info
  );

  if (altText) {
    await withRetry(async () => {
      const response = await fetchWithTimeout(
        `${TWITTER_API_BASE}/media/metadata`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: mediaId,
            metadata: { alt_text: { text: altText } },
          }),
        }
      );
      return handleAPIResponse<unknown>(response, 'twitter');
    }, 'twitter');
  }

  return mediaId;
}

async function uploadMediaInputs(
  accessToken: string,
  inputs: NormalizedMediaInput[]
): Promise<string[]> {
  const downloaded = await Promise.all(
    inputs.map(async (input, index) => {
      try {
        return await downloadMedia(input.url);
      } catch (error) {
        if (error instanceof Error) {
          error.message = `Twitter media download failed at index ${index}: ${error.message}`;
        }
        throw error;
      }
    })
  );

  if (
    downloaded.some((media) => media.mediaType === 'image/gif') &&
    downloaded.length > 1
  ) {
    throw mediaValidationError(
      'an animated GIF cannot be combined with other images'
    );
  }

  const mediaIds: string[] = [];
  for (let index = 0; index < downloaded.length; index++) {
    try {
      mediaIds.push(
        await uploadMedia(accessToken, downloaded[index], inputs[index].altText)
      );
    } catch (error) {
      if (error instanceof Error) {
        error.message = `Twitter media upload failed at index ${index}: ${error.message}`;
      }
      throw error;
    }
  }
  return mediaIds;
}

async function publishTweet(
  accessToken: string,
  body: TwitterPostBody
): Promise<TwitterTweetResponse> {
  return withRetry(async () => {
    const response = await fetchWithTimeout(`${TWITTER_API_BASE}/tweets`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return handleAPIResponse<TwitterTweetResponse>(response, 'twitter');
  }, 'twitter');
}

// =====================================================
// ENVIRONMENT
// =====================================================

function getTwitterCredentials() {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new SocialAPIError(
      'Twitter API credentials not configured. Set TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET.',
      'twitter',
      'MISSING_CREDENTIALS'
    );
  }

  return { clientId, clientSecret };
}

// =====================================================
// TWITTER CLIENT IMPLEMENTATION
// =====================================================

export const twitterClient: SocialClient = {
  platform: 'twitter',
  requiresPKCE: true,

  /**
   * Get the authorization URL for OAuth 2.0 with PKCE
   */
  getAuthorizationUrl(
    state: string,
    redirectUri: string,
    codeVerifier?: string
  ): string {
    const { clientId } = getTwitterCredentials();

    if (!codeVerifier) {
      throw new AuthenticationError(
        'twitter',
        'PKCE code verifier is required for Twitter OAuth'
      );
    }

    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    return buildURL(`${TWITTER_AUTH_BASE}/authorize`, {
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: TWITTER_SCOPES,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
  },

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(
    code: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<OAuthTokenResponse> {
    const { clientId, clientSecret } = getTwitterCredentials();

    if (!codeVerifier) {
      throw new AuthenticationError(
        'twitter',
        'PKCE code verifier is required for Twitter token exchange'
      );
    }

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    });

    const response = await fetchWithTimeout(TWITTER_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: params.toString(),
    });

    const data = await handleAPIResponse<{
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      token_type: string;
      scope: string;
    }>(response, 'twitter');

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
      scope: data.scope,
    };
  },

  /**
   * Refresh an expired access token
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
    const { clientId, clientSecret } = getTwitterCredentials();

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    });

    const response = await fetchWithTimeout(TWITTER_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new TokenExpiredError('twitter');
      }
      await handleAPIResponse(response, 'twitter');
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
      scope: data.scope,
    };
  },

  /**
   * Get authenticated user's account info
   */
  async getAccountInfo(accessToken: string) {
    const response = await withRetry(
      () =>
        fetchWithTimeout(`${TWITTER_API_BASE}/users/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          method: 'GET',
        }),
      'twitter'
    );

    const data = await handleAPIResponse<TwitterUserResponse>(
      response,
      'twitter'
    );

    return {
      id: data.data.id,
      name: data.data.name,
      handle: `@${data.data.username}`,
      profile_image_url: data.data.profile_image_url,
    };
  },

  /**
   * Verify if credentials are still valid
   */
  async verifyCredentials(accessToken: string): Promise<boolean> {
    try {
      await this.getAccountInfo(accessToken);
      return true;
    } catch (error) {
      if (
        error instanceof AuthenticationError ||
        error instanceof TokenExpiredError
      ) {
        return false;
      }
      throw error;
    }
  },

  /**
   * Create a new tweet
   */
  async createPost(
    accessToken: string,
    content: string,
    mediaUrls?: string[]
  ): Promise<{ id: string; url: string }> {
    const mediaInputs = normalizeMediaInputs(
      mediaUrls as unknown as TwitterMediaInput[] | undefined
    );
    if (!content.trim() && mediaInputs.length === 0) {
      throw new SocialAPIError(
        'Twitter post must include text or media',
        'twitter',
        'CONTENT_VALIDATION_ERROR',
        400
      );
    }

    const mediaIds = await uploadMediaInputs(accessToken, mediaInputs);

    if (countCharacters(content) > TWEET_MAX_LENGTH) {
      const tweets = splitIntoTweets(content);
      const thread = await createThread(accessToken, tweets, mediaIds);
      return { id: thread.ids[0], url: thread.urls[0] };
    }

    const body: TwitterPostBody = { text: content };
    if (mediaIds.length) body.media = { media_ids: mediaIds };
    const data = await publishTweet(accessToken, body);

    // Get the username to construct the URL
    let username = 'i'; // Fallback to generic URL
    try {
      const userInfo = await this.getAccountInfo(accessToken);
      username = userInfo.handle.replace('@', '');
    } catch {
      // Ignore - use fallback URL
    }

    return {
      id: data.data.id,
      url: `https://x.com/${username}/status/${data.data.id}`,
    };
  },

  /**
   * Delete a tweet
   */
  async deletePost(accessToken: string, postId: string): Promise<void> {
    const response = await withRetry(
      () =>
        fetchWithTimeout(`${TWITTER_API_BASE}/tweets/${postId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      'twitter'
    );

    if (!response.ok) {
      await handleAPIResponse(response, 'twitter');
    }
  },

  /**
   * Get comments (replies) on a tweet
   */
  async getComments(accessToken: string, postId: string) {
    // Search for replies to this tweet
    const query = `conversation_id:${postId} is:reply`;

    const url = buildURL(`${TWITTER_API_BASE}/tweets/search/recent`, {
      query,
      'tweet.fields': 'author_id,created_at,conversation_id',
      'user.fields': 'name,username',
      expansions: 'author_id',
      max_results: 100,
    });

    const response = await withRetry(
      () =>
        fetchWithTimeout(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      'twitter'
    );

    const data = await handleAPIResponse<{
      data?: Array<{
        id: string;
        text: string;
        author_id: string;
        created_at: string;
      }>;
      includes?: {
        users?: Array<{
          id: string;
          name: string;
          username: string;
        }>;
      };
    }>(response, 'twitter');

    if (!data.data) {
      return [];
    }

    // Map users for lookup
    const userMap = new Map(
      data.includes?.users?.map((u) => [u.id, u]) || []
    );

    return data.data.map((tweet) => {
      const author = userMap.get(tweet.author_id);
      return {
        id: tweet.id,
        content: tweet.text,
        author_name: author?.name || 'Unknown',
        author_id: tweet.author_id,
        created_at: tweet.created_at,
      };
    });
  },

  /**
   * Hide a reply (soft delete - only hides from view)
   */
  async hideComment(accessToken: string, commentId: string): Promise<void> {
    const response = await withRetry(
      () =>
        fetchWithTimeout(`${TWITTER_API_BASE}/tweets/${commentId}/hidden`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ hidden: true }),
        }),
      'twitter'
    );

    if (!response.ok) {
      await handleAPIResponse(response, 'twitter');
    }
  },

  /**
   * Reply to a comment
   */
  async replyToComment(
    accessToken: string,
    commentId: string,
    content: string
  ): Promise<{ id: string }> {
    const response = await withRetry(
      () =>
        fetchWithTimeout(`${TWITTER_API_BASE}/tweets`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: content,
            reply: {
              in_reply_to_tweet_id: commentId,
            },
          }),
        }),
      'twitter'
    );

    const data = await handleAPIResponse<TwitterTweetResponse>(
      response,
      'twitter'
    );

    return { id: data.data.id };
  },

  /**
   * Get engagement metrics for a tweet
   */
  async getPostMetrics(
    accessToken: string,
    postId: string
  ): Promise<SocialPostMetrics> {
    const url = buildURL(`${TWITTER_API_BASE}/tweets/${postId}`, {
      'tweet.fields': 'public_metrics,non_public_metrics,organic_metrics',
    });

    const response = await withRetry(
      () =>
        fetchWithTimeout(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      'twitter'
    );

    const data =
      await handleAPIResponse<TwitterTweetMetricsResponse>(response, 'twitter');

    const publicMetrics = data.data.public_metrics;
    const nonPublicMetrics = data.data.non_public_metrics;

    return {
      likes: publicMetrics.like_count,
      retweets: publicMetrics.retweet_count,
      comments: publicMetrics.reply_count,
      impressions: nonPublicMetrics?.impression_count || publicMetrics.impression_count,
      shares: publicMetrics.quote_count,
      clicks: nonPublicMetrics?.url_link_clicks,
    };
  },
};

// =====================================================
// THREAD SUPPORT
// =====================================================

/**
 * Create a Twitter thread from long content
 */
export async function createThread(
  accessToken: string,
  tweets: string[],
  firstTweetMediaIds: string[] = []
): Promise<{ ids: string[]; urls: string[] }> {
  const ids: string[] = [];
  const urls: string[] = [];
  let previousTweetId: string | undefined;

  for (let index = 0; index < tweets.length; index++) {
    const body: TwitterPostBody = { text: tweets[index] };

    if (previousTweetId) {
      body.reply = { in_reply_to_tweet_id: previousTweetId };
    }
    if (index === 0 && firstTweetMediaIds.length) {
      body.media = { media_ids: firstTweetMediaIds };
    }

    let data: TwitterTweetResponse;
    try {
      data = await publishTweet(accessToken, body);
    } catch (error) {
      if (error instanceof Error) {
        error.message = `Twitter thread publish failed at index ${index} (tweet ${index + 1}/${tweets.length}): ${error.message}`;
      }
      throw error;
    }

    ids.push(data.data.id);
    urls.push(`https://x.com/i/status/${data.data.id}`);
    previousTweetId = data.data.id;
  }

  return { ids, urls };
}

/**
 * Split long content into tweet-sized chunks for threading
 */
export function splitIntoTweets(
  content: string,
  maxLength: number = TWEET_MAX_LENGTH - 10 // Leave room for thread numbering
): string[] {
  const tweets: string[] = [];
  const tokens = content.match(/https?:\/\/[^\s]+|\s+|[^\s]+/g) ?? [];
  let currentTweet = '';

  const pushCurrent = () => {
    const trimmed = currentTweet.trim();
    if (trimmed) tweets.push(trimmed);
    currentTweet = '';
  };

  for (const token of tokens) {
    const candidate = currentTweet + token;
    if (countCharacters(candidate) <= maxLength) {
      currentTweet = candidate;
      continue;
    }

    pushCurrent();
    if (countCharacters(token.trim()) <= maxLength) {
      currentTweet = token.trimStart();
      continue;
    }

    // Long non-URL tokens are split without losing any characters. URLs are
    // always weighted as 23 characters and therefore never enter this branch.
    let remainder = token.trim();
    while (remainder) {
      let end = Math.min(remainder.length, maxLength);
      while (end > 0 && countCharacters(remainder.slice(0, end)) > maxLength) {
        end--;
      }
      if (end === 0) {
        throw new SocialAPIError(
          'Twitter thread contains content that cannot fit in a tweet',
          'twitter',
          'CONTENT_VALIDATION_ERROR',
          400
        );
      }
      tweets.push(remainder.slice(0, end));
      remainder = remainder.slice(end);
    }
  }

  pushCurrent();

  // Add thread numbering if multiple tweets
  if (tweets.length > 1) {
    if (tweets.length > 999) {
      throw new SocialAPIError(
        'Twitter thread exceeds the supported 999-tweet maximum',
        'twitter',
        'CONTENT_VALIDATION_ERROR',
        400
      );
    }
    const numbered = tweets.map(
      (tweet, index) => `${index + 1}/${tweets.length} ${tweet}`
    );
    if (numbered.some((tweet) => countCharacters(tweet) > TWEET_MAX_LENGTH)) {
      throw new SocialAPIError(
        'Twitter thread numbering caused a tweet to exceed 280 characters',
        'twitter',
        'CONTENT_VALIDATION_ERROR',
        400
      );
    }
    return numbered;
  }

  return tweets;
}

// =====================================================
// EXPORTS
// =====================================================

export default twitterClient;

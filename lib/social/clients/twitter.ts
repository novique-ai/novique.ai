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
  truncateText,
} from './base';

// =====================================================
// CONFIGURATION
// =====================================================

const TWITTER_API_BASE = 'https://api.twitter.com/2';
const TWITTER_AUTH_BASE = 'https://twitter.com/i/oauth2';
const TWITTER_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';

// Twitter OAuth 2.0 scopes
const TWITTER_SCOPES = [
  'tweet.read',
  'tweet.write',
  'users.read',
  'offline.access',
].join(' ');

// Character limit for tweets
const TWEET_MAX_LENGTH = 280;

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
    // Validate content length
    if (content.length > TWEET_MAX_LENGTH) {
      content = truncateText(content, TWEET_MAX_LENGTH - 3);
    }

    const body: { text: string; media?: { media_ids: string[] } } = {
      text: content,
    };

    // Handle media if provided
    // Note: Media must be uploaded separately first using Twitter Media Upload API
    // This is a simplified implementation
    if (mediaUrls && mediaUrls.length > 0) {
      // In production, upload media first and get media_ids
      console.warn(
        '[Twitter] Media upload not yet implemented, posting without media'
      );
    }

    const response = await withRetry(
      () =>
        fetchWithTimeout(`${TWITTER_API_BASE}/tweets`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }),
      'twitter'
    );

    const data = await handleAPIResponse<TwitterTweetResponse>(
      response,
      'twitter'
    );

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
      url: `https://twitter.com/${username}/status/${data.data.id}`,
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
  tweets: string[]
): Promise<{ ids: string[]; urls: string[] }> {
  const ids: string[] = [];
  const urls: string[] = [];
  let previousTweetId: string | undefined;

  for (const text of tweets) {
    const body: {
      text: string;
      reply?: { in_reply_to_tweet_id: string };
    } = { text };

    if (previousTweetId) {
      body.reply = { in_reply_to_tweet_id: previousTweetId };
    }

    const response = await withRetry(
      () =>
        fetchWithTimeout(`${TWITTER_API_BASE}/tweets`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }),
      'twitter'
    );

    const data = await handleAPIResponse<TwitterTweetResponse>(
      response,
      'twitter'
    );

    ids.push(data.data.id);
    urls.push(`https://twitter.com/i/status/${data.data.id}`);
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
  const paragraphs = content.split(/\n\n+/);

  let currentTweet = '';

  for (const paragraph of paragraphs) {
    if (currentTweet.length + paragraph.length + 2 <= maxLength) {
      currentTweet += (currentTweet ? '\n\n' : '') + paragraph;
    } else {
      if (currentTweet) {
        tweets.push(currentTweet);
      }

      // If paragraph is too long, split by sentences
      if (paragraph.length > maxLength) {
        const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
        currentTweet = '';

        for (const sentence of sentences) {
          if (currentTweet.length + sentence.length <= maxLength) {
            currentTweet += sentence;
          } else {
            if (currentTweet) {
              tweets.push(currentTweet.trim());
            }
            currentTweet = sentence;
          }
        }
      } else {
        currentTweet = paragraph;
      }
    }
  }

  if (currentTweet) {
    tweets.push(currentTweet);
  }

  // Add thread numbering if multiple tweets
  if (tweets.length > 1) {
    return tweets.map((tweet, i) => `${i + 1}/${tweets.length} ${tweet}`);
  }

  return tweets;
}

// =====================================================
// EXPORTS
// =====================================================

export default twitterClient;

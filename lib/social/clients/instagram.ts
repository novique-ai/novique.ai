/**
 * Instagram API Client (via Meta Graph API)
 *
 * Implements OAuth 2.0 via Facebook for Instagram Business accounts.
 * Uses Instagram Graph API for posting and engagement.
 *
 * Requires:
 * - META_APP_ID
 * - META_APP_SECRET
 * - Instagram Business or Creator account connected to Facebook Page
 */

import type {
  SocialClient,
  OAuthTokenResponse,
  SocialPostMetrics,
} from '../types';
import {
  SocialAPIError,
  AuthenticationError,
  TokenExpiredError,
  fetchWithTimeout,
  handleAPIResponse,
  withRetry,
  buildURL,
  truncateText,
} from './base';

// =====================================================
// CONFIGURATION
// =====================================================

const META_GRAPH_VERSION = 'v25.0';
const FACEBOOK_GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;
const FACEBOOK_AUTH_URL = `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth`;

// Instagram/Facebook OAuth scopes
const INSTAGRAM_SCOPES = [
  'instagram_basic', // Read profile info
  'instagram_content_publish', // Create posts
  'instagram_manage_comments', // Read/manage comments
  'instagram_manage_insights', // Read analytics
  'pages_show_list', // List pages user manages
  'pages_read_engagement', // Read page engagement
].join(',');

// Character limit for Instagram captions
const INSTAGRAM_MAX_LENGTH = 2200;

// =====================================================
// TYPES
// =====================================================

interface InstagramAccount {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
  followers_count?: number;
}

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: {
    id: string;
  };
}

interface InstagramMediaResponse {
  id: string;
}

interface InstagramComment {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  from?: {
    id: string;
    username: string;
  };
}

// =====================================================
// ENVIRONMENT
// =====================================================

function getMetaCredentials() {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    throw new SocialAPIError(
      'Meta API credentials not configured. Set META_APP_ID and META_APP_SECRET.',
      'instagram',
      'MISSING_CREDENTIALS'
    );
  }

  return { appId, appSecret };
}

// =====================================================
// INSTAGRAM CLIENT IMPLEMENTATION
// =====================================================

export const instagramClient: SocialClient = {
  platform: 'instagram',
  requiresPKCE: false,

  /**
   * Get the authorization URL for Facebook OAuth (required for Instagram)
   */
  getAuthorizationUrl(
    state: string,
    redirectUri: string,
    _codeVerifier?: string
  ): string {
    const { appId } = getMetaCredentials();

    return buildURL(FACEBOOK_AUTH_URL, {
      client_id: appId,
      redirect_uri: redirectUri,
      state,
      scope: INSTAGRAM_SCOPES,
      response_type: 'code',
    });
  },

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(
    code: string,
    redirectUri: string,
    _codeVerifier?: string
  ): Promise<OAuthTokenResponse> {
    const { appId, appSecret } = getMetaCredentials();

    // Exchange code for short-lived token
    const tokenUrl = buildURL(`${FACEBOOK_GRAPH_BASE}/oauth/access_token`, {
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code,
    });

    const shortTokenResponse = await fetchWithTimeout(tokenUrl);
    const shortTokenData = await handleAPIResponse<{
      access_token: string;
      token_type: string;
      expires_in?: number;
    }>(shortTokenResponse, 'instagram');

    // Exchange for long-lived token (60 days)
    const longTokenUrl = buildURL(`${FACEBOOK_GRAPH_BASE}/oauth/access_token`, {
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortTokenData.access_token,
    });

    const longTokenResponse = await fetchWithTimeout(longTokenUrl);
    const longTokenData = await handleAPIResponse<{
      access_token: string;
      token_type: string;
      expires_in: number;
    }>(longTokenResponse, 'instagram');

    return {
      access_token: longTokenData.access_token,
      expires_in: longTokenData.expires_in,
      token_type: longTokenData.token_type,
    };
  },

  /**
   * Refresh an access token (get a new long-lived token)
   */
  async refreshAccessToken(accessToken: string): Promise<OAuthTokenResponse> {
    const { appId, appSecret } = getMetaCredentials();

    const url = buildURL(`${FACEBOOK_GRAPH_BASE}/oauth/access_token`, {
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: accessToken,
    });

    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      if (response.status === 401) {
        throw new TokenExpiredError('instagram');
      }
      await handleAPIResponse(response, 'instagram');
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type || 'Bearer',
    };
  },

  /**
   * Get Instagram Business account info
   * Note: Requires getting the Instagram account ID through Facebook Pages first
   */
  async getAccountInfo(accessToken: string) {
    // First, get the Facebook Pages the user manages
    const pagesResponse = await withRetry(
      () =>
        fetchWithTimeout(
          buildURL(`${FACEBOOK_GRAPH_BASE}/me/accounts`, {
            access_token: accessToken,
            fields: 'id,name,access_token,instagram_business_account',
          })
        ),
      'instagram'
    );

    const pagesData = await handleAPIResponse<{
      data: FacebookPage[];
    }>(pagesResponse, 'instagram');

    // Find a page with an Instagram Business account
    const pageWithInstagram = pagesData.data.find(
      (page) => page.instagram_business_account
    );

    if (!pageWithInstagram?.instagram_business_account) {
      throw new SocialAPIError(
        'No Instagram Business account found. Make sure your Instagram account is connected to a Facebook Page.',
        'instagram',
        'NO_INSTAGRAM_ACCOUNT'
      );
    }

    const instagramId = pageWithInstagram.instagram_business_account.id;

    // Get Instagram account details
    const igResponse = await withRetry(
      () =>
        fetchWithTimeout(
          buildURL(`${FACEBOOK_GRAPH_BASE}/${instagramId}`, {
            access_token: accessToken,
            fields: 'id,username,name,profile_picture_url,followers_count',
          })
        ),
      'instagram'
    );

    const igData = await handleAPIResponse<InstagramAccount>(
      igResponse,
      'instagram'
    );

    return {
      id: igData.id,
      name: igData.name || igData.username,
      handle: `@${igData.username}`,
      profile_image_url: igData.profile_picture_url,
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
   * Create an Instagram post
   * Instagram requires a two-step process: create container, then publish
   */
  async createPost(
    accessToken: string,
    content: string,
    mediaUrls?: string[]
  ): Promise<{ id: string; url: string }> {
    // Instagram REQUIRES an image for posts
    if (!mediaUrls || mediaUrls.length === 0) {
      throw new SocialAPIError(
        'Instagram requires at least one image for posts',
        'instagram',
        'MEDIA_REQUIRED'
      );
    }

    // Get Instagram account ID
    const accountInfo = await this.getAccountInfo(accessToken);
    const instagramId = accountInfo.id;

    // Validate caption length
    if (content.length > INSTAGRAM_MAX_LENGTH) {
      content = truncateText(content, INSTAGRAM_MAX_LENGTH - 3);
    }

    // Step 1: Create media container
    let containerId: string;

    if (mediaUrls.length === 1) {
      // Single image post
      const containerResponse = await withRetry(
        () =>
          fetchWithTimeout(`${FACEBOOK_GRAPH_BASE}/${instagramId}/media`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image_url: mediaUrls[0],
              caption: content,
              access_token: accessToken,
            }),
          }),
        'instagram'
      );

      const containerData = await handleAPIResponse<InstagramMediaResponse>(
        containerResponse,
        'instagram'
      );
      containerId = containerData.id;
    } else {
      // Carousel post (multiple images)
      // First, create containers for each image
      const childContainerIds: string[] = [];

      for (const imageUrl of mediaUrls.slice(0, 10)) {
        // Max 10 images
        const childResponse = await withRetry(
          () =>
            fetchWithTimeout(`${FACEBOOK_GRAPH_BASE}/${instagramId}/media`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                image_url: imageUrl,
                is_carousel_item: true,
                access_token: accessToken,
              }),
            }),
          'instagram'
        );

        const childData = await handleAPIResponse<InstagramMediaResponse>(
          childResponse,
          'instagram'
        );
        childContainerIds.push(childData.id);
      }

      // Create carousel container
      const carouselResponse = await withRetry(
        () =>
          fetchWithTimeout(`${FACEBOOK_GRAPH_BASE}/${instagramId}/media`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              media_type: 'CAROUSEL',
              children: childContainerIds.join(','),
              caption: content,
              access_token: accessToken,
            }),
          }),
        'instagram'
      );

      const carouselData = await handleAPIResponse<InstagramMediaResponse>(
        carouselResponse,
        'instagram'
      );
      containerId = carouselData.id;
    }

    // Step 2: Wait for container to be ready (poll status)
    let isReady = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!isReady && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

      const statusResponse = await fetchWithTimeout(
        buildURL(`${FACEBOOK_GRAPH_BASE}/${containerId}`, {
          access_token: accessToken,
          fields: 'status_code',
        })
      );

      const statusData = await handleAPIResponse<{
        status_code: 'EXPIRED' | 'ERROR' | 'FINISHED' | 'IN_PROGRESS' | 'PUBLISHED';
      }>(statusResponse, 'instagram');

      if (statusData.status_code === 'FINISHED') {
        isReady = true;
      } else if (
        statusData.status_code === 'ERROR' ||
        statusData.status_code === 'EXPIRED'
      ) {
        throw new SocialAPIError(
          `Media container failed with status: ${statusData.status_code}`,
          'instagram',
          'MEDIA_PROCESSING_FAILED'
        );
      }

      attempts++;
    }

    if (!isReady) {
      throw new SocialAPIError(
        'Media container processing timed out',
        'instagram',
        'MEDIA_PROCESSING_TIMEOUT'
      );
    }

    // Step 3: Publish the container
    const publishResponse = await withRetry(
      () =>
        fetchWithTimeout(
          `${FACEBOOK_GRAPH_BASE}/${instagramId}/media_publish`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              creation_id: containerId,
              access_token: accessToken,
            }),
          }
        ),
      'instagram'
    );

    const publishData = await handleAPIResponse<InstagramMediaResponse>(
      publishResponse,
      'instagram'
    );

    // Get the permalink for the post
    const permalinkResponse = await fetchWithTimeout(
      buildURL(`${FACEBOOK_GRAPH_BASE}/${publishData.id}`, {
        access_token: accessToken,
        fields: 'permalink',
      })
    );

    const permalinkData = await handleAPIResponse<{
      id: string;
      permalink?: string;
    }>(permalinkResponse, 'instagram');

    return {
      id: publishData.id,
      url:
        permalinkData.permalink ||
        `https://www.instagram.com/p/${publishData.id}/`,
    };
  },

  /**
   * Delete an Instagram post
   * Note: Instagram API doesn't support deleting posts programmatically
   */
  async deletePost(accessToken: string, postId: string): Promise<void> {
    throw new SocialAPIError(
      'Instagram does not support deleting posts via API. Posts must be deleted manually.',
      'instagram',
      'DELETE_NOT_SUPPORTED'
    );
  },

  /**
   * Get comments on an Instagram post
   */
  async getComments(accessToken: string, postId: string) {
    const url = buildURL(`${FACEBOOK_GRAPH_BASE}/${postId}/comments`, {
      access_token: accessToken,
      fields: 'id,text,username,timestamp,from',
    });

    const response = await withRetry(() => fetchWithTimeout(url), 'instagram');

    const data = await handleAPIResponse<{
      data: InstagramComment[];
    }>(response, 'instagram');

    return data.data.map((comment) => ({
      id: comment.id,
      content: comment.text,
      author_name: comment.from?.username || comment.username,
      author_id: comment.from?.id || '',
      created_at: comment.timestamp,
    }));
  },

  /**
   * Hide a comment
   */
  async hideComment(accessToken: string, commentId: string): Promise<void> {
    const response = await withRetry(
      () =>
        fetchWithTimeout(`${FACEBOOK_GRAPH_BASE}/${commentId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            hide: true,
            access_token: accessToken,
          }),
        }),
      'instagram'
    );

    if (!response.ok) {
      await handleAPIResponse(response, 'instagram');
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
        fetchWithTimeout(`${FACEBOOK_GRAPH_BASE}/${commentId}/replies`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            access_token: accessToken,
          }),
        }),
      'instagram'
    );

    const data = await handleAPIResponse<{ id: string }>(
      response,
      'instagram'
    );
    return { id: data.id };
  },

  /**
   * Get engagement metrics for a post
   */
  async getPostMetrics(
    accessToken: string,
    postId: string
  ): Promise<SocialPostMetrics> {
    // Get basic metrics
    const mediaUrl = buildURL(`${FACEBOOK_GRAPH_BASE}/${postId}`, {
      access_token: accessToken,
      fields: 'like_count,comments_count',
    });

    const mediaResponse = await withRetry(
      () => fetchWithTimeout(mediaUrl),
      'instagram'
    );

    const mediaData = await handleAPIResponse<{
      like_count?: number;
      comments_count?: number;
    }>(mediaResponse, 'instagram');

    // Get insights (requires instagram_manage_insights permission)
    let impressions = 0;
    let reach = 0;
    let saved = 0;

    try {
      const insightsUrl = buildURL(
        `${FACEBOOK_GRAPH_BASE}/${postId}/insights`,
        {
          access_token: accessToken,
          metric: 'impressions,reach,saved',
        }
      );

      const insightsResponse = await fetchWithTimeout(insightsUrl);

      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        for (const insight of insightsData.data || []) {
          switch (insight.name) {
            case 'impressions':
              impressions = insight.values?.[0]?.value || 0;
              break;
            case 'reach':
              reach = insight.values?.[0]?.value || 0;
              break;
            case 'saved':
              saved = insight.values?.[0]?.value || 0;
              break;
          }
        }
      }
    } catch {
      // Insights may not be available for all accounts
    }

    return {
      likes: mediaData.like_count || 0,
      comments: mediaData.comments_count || 0,
      impressions,
      reach,
      saves: saved,
    };
  },
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get all Instagram Business accounts the user has access to
 */
export async function getInstagramAccounts(
  accessToken: string
): Promise<Array<{ id: string; username: string; pageName: string }>> {
  const pagesResponse = await withRetry(
    () =>
      fetchWithTimeout(
        buildURL(`${FACEBOOK_GRAPH_BASE}/me/accounts`, {
          access_token: accessToken,
          fields: 'id,name,instagram_business_account{id,username}',
        })
      ),
    'instagram'
  );

  const pagesData = await handleAPIResponse<{
    data: Array<{
      id: string;
      name: string;
      instagram_business_account?: {
        id: string;
        username: string;
      };
    }>;
  }>(pagesResponse, 'instagram');

  return pagesData.data
    .filter((page) => page.instagram_business_account)
    .map((page) => ({
      id: page.instagram_business_account!.id,
      username: page.instagram_business_account!.username,
      pageName: page.name,
    }));
}

/**
 * Get page access token for a specific Facebook Page
 * (needed for some operations)
 */
export async function getPageAccessToken(
  userAccessToken: string,
  pageId: string
): Promise<string> {
  const response = await withRetry(
    () =>
      fetchWithTimeout(
        buildURL(`${FACEBOOK_GRAPH_BASE}/${pageId}`, {
          access_token: userAccessToken,
          fields: 'access_token',
        })
      ),
    'instagram'
  );

  const data = await handleAPIResponse<{
    access_token: string;
  }>(response, 'instagram');

  return data.access_token;
}

// =====================================================
// EXPORTS
// =====================================================

export default instagramClient;

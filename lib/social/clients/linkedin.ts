/**
 * LinkedIn API Client
 *
 * Implements OAuth 2.0 for user/organization authentication
 * and LinkedIn Marketing API for posting.
 *
 * Requires:
 * - LINKEDIN_CLIENT_ID
 * - LINKEDIN_CLIENT_SECRET
 * - Marketing Developer Platform access for company pages
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

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';

// Only requesting w_member_social for now.
// LinkedIn requires special approval for w_organization_social.
// When approved, update scope to include it.
const LINKEDIN_SCOPES = [
  'w_member_social',
].join(' ');

// Character limit for LinkedIn posts
const LINKEDIN_MAX_LENGTH = 3000;

// =====================================================
// TYPES
// =====================================================

interface LinkedInProfile {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  profilePicture?: {
    'displayImage~'?: {
      elements?: Array<{
        identifiers?: Array<{
          identifier: string;
        }>;
      }>;
    };
  };
}

interface LinkedInOrganization {
  id: number;
  localizedName: string;
  vanityName?: string;
  logoV2?: {
    original?: string;
  };
}

interface LinkedInShareResponse {
  id: string;
  activity: string;
}

interface LinkedInUGCPost {
  author: string;
  lifecycleState: 'PUBLISHED';
  specificContent: {
    'com.linkedin.ugc.ShareContent': {
      shareCommentary: {
        text: string;
      };
      shareMediaCategory: 'NONE' | 'ARTICLE' | 'IMAGE';
      media?: Array<{
        status: 'READY';
        description?: { text: string };
        media?: string;
        originalUrl?: string;
        title?: { text: string };
      }>;
    };
  };
  visibility: {
    'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' | 'CONNECTIONS';
  };
}

// =====================================================
// ENVIRONMENT
// =====================================================

function getLinkedInCredentials() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new SocialAPIError(
      'LinkedIn API credentials not configured. Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET.',
      'linkedin',
      'MISSING_CREDENTIALS'
    );
  }

  return { clientId, clientSecret };
}

// =====================================================
// LINKEDIN CLIENT IMPLEMENTATION
// =====================================================

export const linkedinClient: SocialClient = {
  platform: 'linkedin',
  requiresPKCE: false,

  /**
   * Get the authorization URL for OAuth 2.0
   */
  getAuthorizationUrl(
    state: string,
    redirectUri: string,
    _codeVerifier?: string
  ): string {
    const { clientId } = getLinkedInCredentials();

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      scope: LINKEDIN_SCOPES,
    });

    const authUrl = `${LINKEDIN_AUTH_URL}?${params.toString()}`;
    console.log('[LinkedIn OAuth] Authorization URL generated:', authUrl);
    return authUrl;
  },

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(
    code: string,
    redirectUri: string,
    _codeVerifier?: string
  ): Promise<OAuthTokenResponse> {
    const { clientId, clientSecret } = getLinkedInCredentials();

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetchWithTimeout(LINKEDIN_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await handleAPIResponse<{
      access_token: string;
      expires_in: number;
      refresh_token?: string;
      refresh_token_expires_in?: number;
      scope: string;
    }>(response, 'linkedin');

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: 'Bearer',
      scope: data.scope,
    };
  },

  /**
   * Refresh an expired access token
   * Note: LinkedIn refresh tokens are only available for certain apps
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
    const { clientId, clientSecret } = getLinkedInCredentials();

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetchWithTimeout(LINKEDIN_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new TokenExpiredError('linkedin');
      }
      await handleAPIResponse(response, 'linkedin');
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: 'Bearer',
      scope: data.scope,
    };
  },

  /**
   * Get authenticated user's account info
   */
  async getAccountInfo(accessToken: string) {
    // Get basic profile
    const profileResponse = await withRetry(
      () =>
        fetchWithTimeout(`${LINKEDIN_API_BASE}/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }),
      'linkedin'
    );

    const profile = await handleAPIResponse<LinkedInProfile>(
      profileResponse,
      'linkedin'
    );

    // Try to get profile picture
    let profileImageUrl: string | undefined;
    try {
      const pictureResponse = await fetchWithTimeout(
        `${LINKEDIN_API_BASE}/me?projection=(id,profilePicture(displayImage~:playableStreams))`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      if (pictureResponse.ok) {
        const pictureData = await pictureResponse.json();
        profileImageUrl =
          pictureData.profilePicture?.['displayImage~']?.elements?.[0]
            ?.identifiers?.[0]?.identifier;
      }
    } catch {
      // Ignore profile picture errors
    }

    return {
      id: profile.id,
      name: `${profile.localizedFirstName} ${profile.localizedLastName}`,
      handle: profile.id, // LinkedIn doesn't have public handles
      profile_image_url: profileImageUrl,
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
   * Create a new LinkedIn post
   */
  async createPost(
    accessToken: string,
    content: string,
    mediaUrls?: string[]
  ): Promise<{ id: string; url: string }> {
    // Get the user's URN first
    const userInfo = await this.getAccountInfo(accessToken);
    const authorUrn = `urn:li:person:${userInfo.id}`;

    // Validate content length
    if (content.length > LINKEDIN_MAX_LENGTH) {
      content = truncateText(content, LINKEDIN_MAX_LENGTH - 3);
    }

    // Build the post payload
    const postBody: LinkedInUGCPost = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    // Add article/link if URLs are provided
    if (mediaUrls && mediaUrls.length > 0) {
      const urlMatch = content.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        postBody.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'ARTICLE';
        postBody.specificContent['com.linkedin.ugc.ShareContent'].media = [
          {
            status: 'READY',
            originalUrl: urlMatch[0],
          },
        ];
      }
    }

    const response = await withRetry(
      () =>
        fetchWithTimeout(`${LINKEDIN_API_BASE}/ugcPosts`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
          body: JSON.stringify(postBody),
        }),
      'linkedin'
    );

    const data = await handleAPIResponse<LinkedInShareResponse>(
      response,
      'linkedin'
    );

    // Extract post ID from URN
    const postId = data.id.split(':').pop() || data.id;

    return {
      id: data.id,
      url: `https://www.linkedin.com/feed/update/${data.id}`,
    };
  },

  /**
   * Delete a LinkedIn post
   */
  async deletePost(accessToken: string, postId: string): Promise<void> {
    // LinkedIn UGC posts are deleted via the ugcPosts endpoint
    const response = await withRetry(
      () =>
        fetchWithTimeout(`${LINKEDIN_API_BASE}/ugcPosts/${encodeURIComponent(postId)}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }),
      'linkedin'
    );

    if (!response.ok && response.status !== 204) {
      await handleAPIResponse(response, 'linkedin');
    }
  },

  /**
   * Get comments on a LinkedIn post
   */
  async getComments(accessToken: string, postId: string) {
    const url = buildURL(`${LINKEDIN_API_BASE}/socialActions/${encodeURIComponent(postId)}/comments`, {
      count: 100,
    });

    const response = await withRetry(
      () =>
        fetchWithTimeout(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }),
      'linkedin'
    );

    const data = await handleAPIResponse<{
      elements: Array<{
        id: string;
        message: { text: string };
        actor: string;
        created: { time: number };
      }>;
    }>(response, 'linkedin');

    return data.elements.map((comment) => ({
      id: comment.id,
      content: comment.message.text,
      author_name: 'LinkedIn User', // Would need additional API call to resolve
      author_id: comment.actor,
      created_at: new Date(comment.created.time).toISOString(),
    }));
  },

  /**
   * Hide a comment (LinkedIn doesn't support hiding, only deletion by author)
   */
  async hideComment(accessToken: string, commentId: string): Promise<void> {
    // LinkedIn doesn't have a hide feature
    // This would require deleting the comment, which only the author can do
    console.warn(
      '[LinkedIn] Comment hiding not supported - can only delete own comments'
    );
  },

  /**
   * Reply to a comment
   */
  async replyToComment(
    accessToken: string,
    commentId: string,
    content: string
  ): Promise<{ id: string }> {
    // Extract the post URN from the comment ID
    // Comment IDs are in format: urn:li:comment:(urn:li:activity:...,...)
    const postUrnMatch = commentId.match(/urn:li:activity:[^,)]+/);
    if (!postUrnMatch) {
      throw new SocialAPIError(
        'Invalid comment ID format',
        'linkedin',
        'INVALID_COMMENT_ID'
      );
    }

    const postUrn = postUrnMatch[0];

    const response = await withRetry(
      () =>
        fetchWithTimeout(
          `${LINKEDIN_API_BASE}/socialActions/${encodeURIComponent(postUrn)}/comments`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'X-Restli-Protocol-Version': '2.0.0',
            },
            body: JSON.stringify({
              message: { text: content },
              parentComment: commentId,
            }),
          }
        ),
      'linkedin'
    );

    const data = await handleAPIResponse<{ id: string }>(response, 'linkedin');
    return { id: data.id };
  },

  /**
   * Get engagement metrics for a post
   */
  async getPostMetrics(
    accessToken: string,
    postId: string
  ): Promise<SocialPostMetrics> {
    // Get social actions (likes, comments, shares)
    const url = `${LINKEDIN_API_BASE}/socialActions/${encodeURIComponent(postId)}`;

    const response = await withRetry(
      () =>
        fetchWithTimeout(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }),
      'linkedin'
    );

    const data = await handleAPIResponse<{
      likesSummary?: { totalLikes: number };
      commentsSummary?: { totalFirstLevelComments: number };
      shareStatistics?: { shareCount: number };
    }>(response, 'linkedin');

    return {
      likes: data.likesSummary?.totalLikes || 0,
      comments: data.commentsSummary?.totalFirstLevelComments || 0,
      shares: data.shareStatistics?.shareCount || 0,
      // LinkedIn doesn't provide impressions via this API
      // Would need LinkedIn Marketing API for more detailed analytics
    };
  },
};

// =====================================================
// COMPANY PAGE SUPPORT
// =====================================================

/**
 * Get organizations (company pages) the user administers
 */
export async function getAdministeredOrganizations(
  accessToken: string
): Promise<Array<{ id: string; name: string; vanityName?: string }>> {
  const response = await withRetry(
    () =>
      fetchWithTimeout(
        `${LINKEDIN_API_BASE}/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organizationalTarget~(id,localizedName,vanityName)))`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      ),
    'linkedin'
  );

  const data = await handleAPIResponse<{
    elements: Array<{
      'organizationalTarget~': LinkedInOrganization;
    }>;
  }>(response, 'linkedin');

  return data.elements.map((el) => ({
    id: String(el['organizationalTarget~'].id),
    name: el['organizationalTarget~'].localizedName,
    vanityName: el['organizationalTarget~'].vanityName,
  }));
}

/**
 * Post to a company page
 */
export async function postToOrganization(
  accessToken: string,
  organizationId: string,
  content: string,
  linkUrl?: string
): Promise<{ id: string; url: string }> {
  const orgUrn = `urn:li:organization:${organizationId}`;

  // Validate content length
  if (content.length > LINKEDIN_MAX_LENGTH) {
    content = truncateText(content, LINKEDIN_MAX_LENGTH - 3);
  }

  const postBody: LinkedInUGCPost = {
    author: orgUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: content,
        },
        shareMediaCategory: linkUrl ? 'ARTICLE' : 'NONE',
        ...(linkUrl && {
          media: [
            {
              status: 'READY',
              originalUrl: linkUrl,
            },
          ],
        }),
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  const response = await withRetry(
    () =>
      fetchWithTimeout(`${LINKEDIN_API_BASE}/ugcPosts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(postBody),
      }),
    'linkedin'
  );

  const data = await handleAPIResponse<LinkedInShareResponse>(
    response,
    'linkedin'
  );

  return {
    id: data.id,
    url: `https://www.linkedin.com/feed/update/${data.id}`,
  };
}

// =====================================================
// EXPORTS
// =====================================================

export default linkedinClient;

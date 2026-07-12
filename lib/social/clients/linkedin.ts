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
  PublishContext,
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
const LINKEDIN_REST_BASE = 'https://api.linkedin.com/rest';
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_VERSION = '202606';

// Character limit for LinkedIn posts
const LINKEDIN_MAX_LENGTH = 3000;

// =====================================================
// TYPES
// =====================================================

interface LinkedInUserInfo {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

interface LinkedInOrganization {
  id: number;
  localizedName: string;
  vanityName?: string;
  logoV2?: {
    original?: string;
  };
}

interface LinkedInPost {
  author: string;
  commentary: string;
  visibility: 'PUBLIC';
  distribution: {
    feedDistribution: 'MAIN_FEED';
    targetEntities: never[];
    thirdPartyDistributionChannels: never[];
  };
  lifecycleState: 'PUBLISHED';
  isReshareDisabledByAuthor: false;
  content?: {
    media?: { id: string; title?: string };
    article?: {
      source: string;
      title: string;
      description: string;
      thumbnail?: string;
    };
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

function getLinkedInScopes(): string {
  const scopes = ['openid', 'profile', 'w_member_social'];
  if (process.env.LINKEDIN_ORG_URN) scopes.push('w_organization_social');
  return scopes.join(' ');
}

function linkedInHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Linkedin-Version': LINKEDIN_VERSION,
    'X-Restli-Protocol-Version': '2.0.0',
  };
}

async function uploadImage(
  accessToken: string,
  owner: string,
  imageUrl: string
): Promise<string> {
  const imageResponse = await fetchWithTimeout(imageUrl);
  if (!imageResponse.ok) {
    throw new SocialAPIError(
      `Could not download LinkedIn image (${imageResponse.status})`,
      'linkedin',
      'MEDIA_DOWNLOAD_FAILED',
      imageResponse.status
    );
  }

  const contentType = imageResponse.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    throw new SocialAPIError(
      'LinkedIn media URL did not return an image',
      'linkedin',
      'INVALID_MEDIA_TYPE'
    );
  }
  const imageBytes = await imageResponse.arrayBuffer();

  const initializeResponse = await fetchWithTimeout(
    `${LINKEDIN_REST_BASE}/images?action=initializeUpload`,
    {
      method: 'POST',
      headers: {
        ...linkedInHeaders(accessToken),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initializeUploadRequest: { owner } }),
    }
  );
  const initialized = await handleAPIResponse<{
    value: { uploadUrl: string; image: string };
  }>(initializeResponse, 'linkedin');

  const uploadResponse = await fetchWithTimeout(initialized.value.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: imageBytes,
  });
  if (!uploadResponse.ok) {
    throw new SocialAPIError(
      `LinkedIn image upload failed (${uploadResponse.status})`,
      'linkedin',
      'MEDIA_UPLOAD_FAILED',
      uploadResponse.status
    );
  }

  return initialized.value.image;
}

function extractMeta(html: string, key: string): string | undefined {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${escapedKey}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      'i'
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escapedKey}["'][^>]*>`,
      'i'
    ),
  ];
  return patterns.map((pattern) => html.match(pattern)?.[1]).find(Boolean);
}

function cleanMetadata(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

async function buildArticle(
  accessToken: string,
  owner: string,
  source: string,
  commentary: string
): Promise<NonNullable<NonNullable<LinkedInPost['content']>['article']>> {
  let html = '';
  try {
    const response = await fetchWithTimeout(source);
    if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
      html = await response.text();
    }
  } catch {
    // Metadata enrichment is best-effort; the source URL remains publishable.
  }

  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  const title = cleanMetadata(
    extractMeta(html, 'og:title') ||
      titleTag ||
      new URL(source).hostname.replace(/^www\./, '')
  );
  const description = cleanMetadata(
    extractMeta(html, 'og:description') ||
      extractMeta(html, 'description') ||
      commentary.replace(source, '') ||
      title
  );
  const article: NonNullable<
    NonNullable<LinkedInPost['content']>['article']
  > = {
    source,
    title: truncateText(title, 200),
    description: truncateText(description, 256),
  };

  const thumbnailUrl = extractMeta(html, 'og:image');
  if (thumbnailUrl) {
    const resolvedThumbnail = new URL(thumbnailUrl, source).toString();
    article.thumbnail = await uploadImage(accessToken, owner, resolvedThumbnail);
  }
  return article;
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
      scope: getLinkedInScopes(),
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
    const profileResponse = await withRetry(
      () =>
        fetchWithTimeout(`${LINKEDIN_API_BASE}/userinfo`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      'linkedin'
    );

    const profile = await handleAPIResponse<LinkedInUserInfo>(
      profileResponse,
      'linkedin'
    );

    return {
      id: `urn:li:person:${profile.sub}`,
      name:
        profile.name ||
        [profile.given_name, profile.family_name].filter(Boolean).join(' ') ||
        'LinkedIn Member',
      handle: profile.sub,
      profile_image_url: profile.picture,
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
    mediaUrls?: string[],
    context?: PublishContext
  ): Promise<{ id: string; url: string }> {
    const memberUrn = context?.platformUserId;
    if (!memberUrn?.startsWith('urn:li:person:')) {
      throw new AuthenticationError(
        'linkedin',
        'LinkedIn member identity is missing. Reconnect the LinkedIn account before publishing.'
      );
    }
    const organizationUrn = process.env.LINKEDIN_ORG_URN;
    const authorUrn =
      organizationUrn && context?.scopes?.includes('w_organization_social')
        ? organizationUrn
        : memberUrn;

    // Validate content length
    if (content.length > LINKEDIN_MAX_LENGTH) {
      content = truncateText(content, LINKEDIN_MAX_LENGTH - 3);
    }

    const postBody: LinkedInPost = {
      author: authorUrn,
      commentary: content,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    };

    if (mediaUrls?.[0]) {
      const imageUrn = await uploadImage(
        accessToken,
        authorUrn,
        mediaUrls[0]
      );
      postBody.content = { media: { id: imageUrn } };
    } else {
      const urlMatch = content.match(/https?:\/\/[^\s<>()]+/);
      const articleUrl = urlMatch?.[0].replace(/[.,!?;:]+$/, '');
      if (articleUrl) {
        postBody.content = {
          article: await buildArticle(
            accessToken,
            authorUrn,
            articleUrl,
            content
          ),
        };
      }
    }

    const response = await withRetry(
      () =>
        fetchWithTimeout(`${LINKEDIN_REST_BASE}/posts`, {
          method: 'POST',
          headers: {
            ...linkedInHeaders(accessToken),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postBody),
        }),
      'linkedin'
    );

    if (!response.ok) await handleAPIResponse(response, 'linkedin');
    const postId = response.headers.get('x-restli-id');
    if (!postId) {
      throw new SocialAPIError(
        'LinkedIn created the post without returning its identifier',
        'linkedin',
        'MISSING_POST_ID',
        response.status
      );
    }

    return {
      id: postId,
      url: `https://www.linkedin.com/feed/update/${postId}`,
    };
  },

  /**
   * Delete a LinkedIn post
   */
  async deletePost(accessToken: string, postId: string): Promise<void> {
    const response = await withRetry(
      () =>
        fetchWithTimeout(`${LINKEDIN_REST_BASE}/posts/${encodeURIComponent(postId)}`, {
          method: 'DELETE',
          headers: {
            ...linkedInHeaders(accessToken),
            'X-RestLi-Method': 'DELETE',
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
    const url = `${LINKEDIN_REST_BASE}/socialActions/${encodeURIComponent(postId)}`;

    const response = await withRetry(
      () =>
        fetchWithTimeout(url, {
          headers: {
            ...linkedInHeaders(accessToken),
          },
        }),
      'linkedin'
    );

    const data = await handleAPIResponse<{
      likesSummary?: { totalLikes: number; aggregatedTotalLikes?: number };
      commentsSummary?: { totalFirstLevelComments: number };
      shareStatistics?: { shareCount: number };
    }>(response, 'linkedin');

    return {
      likes:
        data.likesSummary?.aggregatedTotalLikes ||
        data.likesSummary?.totalLikes ||
        0,
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

  const postBody: LinkedInPost = {
    author: orgUrn,
    commentary: content,
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  };
  if (linkUrl) {
    postBody.content = {
      article: await buildArticle(accessToken, orgUrn, linkUrl, content),
    };
  }

  const response = await withRetry(
    () =>
      fetchWithTimeout(`${LINKEDIN_REST_BASE}/posts`, {
        method: 'POST',
        headers: {
          ...linkedInHeaders(accessToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postBody),
      }),
    'linkedin'
  );

  if (!response.ok) await handleAPIResponse(response, 'linkedin');
  const postId = response.headers.get('x-restli-id');
  if (!postId) {
    throw new SocialAPIError(
      'LinkedIn created the organization post without returning its identifier',
      'linkedin',
      'MISSING_POST_ID',
      response.status
    );
  }

  return {
    id: postId,
    url: `https://www.linkedin.com/feed/update/${postId}`,
  };
}

// =====================================================
// EXPORTS
// =====================================================

export default linkedinClient;

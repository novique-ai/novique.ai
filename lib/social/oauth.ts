import type { SocialPlatform } from './types';

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

/**
 * Build the platform-specific OAuth callback URL used for both authorization
 * and token exchange.
 *
 * NEXT_PUBLIC_SOCIAL_OAUTH_CALLBACK_URL is a callback base such as
 * http://localhost:3000/api/social/callback; the platform is appended here.
 */
export function getSocialOAuthCallbackUrl(
  platform: SocialPlatform,
  persistedRedirectUri?: string
): string {
  // A callback must exchange against the exact URI persisted at initiation,
  // even if deployment environment variables changed during the OAuth flow.
  if (persistedRedirectUri) {
    return persistedRedirectUri;
  }

  const callbackBase = process.env.NEXT_PUBLIC_SOCIAL_OAUTH_CALLBACK_URL?.trim();
  if (callbackBase) {
    return `${withoutTrailingSlash(callbackBase)}/${platform}`;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) {
    return `${withoutTrailingSlash(siteUrl)}/api/social/callback/${platform}`;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const vercelHost = vercelUrl.replace(/^https?:\/\//, '');
    return `https://${withoutTrailingSlash(vercelHost)}/api/social/callback/${platform}`;
  }

  return `http://localhost:3000/api/social/callback/${platform}`;
}

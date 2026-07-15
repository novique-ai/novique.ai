import { afterEach, describe, expect, it } from 'vitest'
import { getSocialOAuthCallbackUrl } from '@/lib/social/oauth'

const envNames = [
  'NEXT_PUBLIC_SOCIAL_OAUTH_CALLBACK_URL',
  'NEXT_PUBLIC_SITE_URL',
  'VERCEL_URL',
] as const
const originalEnv = Object.fromEntries(envNames.map((name) => [name, process.env[name]]))

afterEach(() => {
  for (const name of envNames) {
    const original = originalEnv[name]
    if (original === undefined) delete process.env[name]
    else process.env[name] = original
  }
})

describe('getSocialOAuthCallbackUrl', () => {
  it('prefers a persisted redirect URI over every environment override', () => {
    process.env.NEXT_PUBLIC_SOCIAL_OAUTH_CALLBACK_URL = 'https://override.example/callback'
    process.env.NEXT_PUBLIC_SITE_URL = 'https://site.example'
    process.env.VERCEL_URL = 'preview.vercel.app'

    expect(
      getSocialOAuthCallbackUrl('twitter', 'https://persisted.example/exact-callback')
    ).toBe('https://persisted.example/exact-callback')
  })

  it('prefers the callback-base override and trims its trailing slash', () => {
    process.env.NEXT_PUBLIC_SOCIAL_OAUTH_CALLBACK_URL =
      'https://auth.example/api/social/callback/'
    process.env.NEXT_PUBLIC_SITE_URL = 'https://site.example'

    expect(getSocialOAuthCallbackUrl('linkedin')).toBe(
      'https://auth.example/api/social/callback/linkedin'
    )
  })

  it('uses NEXT_PUBLIC_SITE_URL when there is no callback-base override', () => {
    delete process.env.NEXT_PUBLIC_SOCIAL_OAUTH_CALLBACK_URL
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.novique.ai/'

    expect(getSocialOAuthCallbackUrl('instagram')).toBe(
      'https://www.novique.ai/api/social/callback/instagram'
    )
  })

  it('forces HTTPS and removes an existing scheme from VERCEL_URL', () => {
    delete process.env.NEXT_PUBLIC_SOCIAL_OAUTH_CALLBACK_URL
    delete process.env.NEXT_PUBLIC_SITE_URL
    process.env.VERCEL_URL = 'http://preview.vercel.app/'

    expect(getSocialOAuthCallbackUrl('twitter')).toBe(
      'https://preview.vercel.app/api/social/callback/twitter'
    )
  })

  it('falls back to the local callback URL', () => {
    delete process.env.NEXT_PUBLIC_SOCIAL_OAUTH_CALLBACK_URL
    delete process.env.NEXT_PUBLIC_SITE_URL
    delete process.env.VERCEL_URL

    expect(getSocialOAuthCallbackUrl('linkedin')).toBe(
      'http://localhost:3000/api/social/callback/linkedin'
    )
  })
})

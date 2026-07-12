import { describe, expect, it } from 'vitest'
import { applyUtm } from '@/lib/social/utm'

const options = {
  source: 'linkedin' as const,
  campaignSlug: 'Summer AI Guide',
  content: 'Hero Link',
}

describe('applyUtm', () => {
  it('stamps stable attribution on Novique URLs', () => {
    const result = applyUtm('Read https://novique.ai/services.', options)

    expect(result).toBe(
      'Read https://novique.ai/services?utm_source=linkedin&utm_medium=organic_social&utm_campaign=summer-ai-guide&utm_content=linkedin_hero-link.'
    )
  })

  it('is idempotent when a URL is already stamped', () => {
    const once = applyUtm('Read https://www.novique.ai/work', options)

    expect(applyUtm(once, options)).toBe(once)
  })

  it('leaves non-Novique URLs untouched', () => {
    const text = 'Research: https://example.com/ai?source=novique'

    expect(applyUtm(text, options)).toBe(text)
  })
})

import { describe, expect, it } from 'vitest'
import {
  createSocialPostSchema,
  isAllowedSocialPostStatusTransition,
  updateSocialPostSchema,
} from '@/lib/social/apiValidation'
import {
  PLATFORM_CONSTRAINTS,
  type SocialPlatform,
  type SocialPostStatus,
} from '@/lib/social/types'

const statuses: SocialPostStatus[] = [
  'draft',
  'queued',
  'scheduled',
  'publishing',
  'needs_review',
  'published',
  'failed',
]

const allowedTransitions = new Set([
  'draft:queued',
  'draft:scheduled',
  'queued:draft',
  'scheduled:draft',
  'failed:draft',
  'failed:queued',
  'failed:scheduled',
])

const transitionCases = statuses.flatMap((current) =>
  statuses.map((next) => ({
    current,
    next,
    allowed: current === next || allowedTransitions.has(`${current}:${next}`),
  }))
)

describe('social post status transitions', () => {
  it.each(transitionCases)(
    '$current -> $next is allowed=$allowed',
    ({ current, next, allowed }) => {
      expect(isAllowedSocialPostStatusTransition(current, next)).toBe(allowed)
    }
  )

  it('rejects client-set published status on create', () => {
    const result = createSocialPostSchema.safeParse({
      platform: 'twitter',
      content: 'Ready to publish',
      status: 'published',
    })

    expect(result.success).toBe(false)
  })

  it('rejects client-set published status on update', () => {
    expect(updateSocialPostSchema.safeParse({ status: 'published' }).success).toBe(false)
  })

  it.each(statuses.filter((status) => status !== 'published'))(
    'keeps published posts immutable against transition to %s',
    (next) => {
      expect(isAllowedSocialPostStatusTransition('published', next)).toBe(false)
    }
  )
})

describe('platform constraints', () => {
  const platforms = Object.keys(PLATFORM_CONSTRAINTS) as SocialPlatform[]

  it.each(platforms)('enforces %s content length', (platform) => {
    const result = createSocialPostSchema.safeParse({
      platform,
      content: 'x'.repeat(PLATFORM_CONSTRAINTS[platform].maxLength + 1),
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.content).toBeDefined()
    }
  })

  it.each(platforms)('enforces %s hashtag count', (platform) => {
    const result = createSocialPostSchema.safeParse({
      platform,
      content: 'Valid content',
      hashtags: Array.from(
        { length: PLATFORM_CONSTRAINTS[platform].maxHashtags + 1 },
        (_, index) => `tag${index}`
      ),
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.hashtags).toBeDefined()
    }
  })

  it('rejects hashtags with a leading #', () => {
    const result = createSocialPostSchema.safeParse({
      platform: 'twitter',
      content: 'Valid content',
      hashtags: ['#novique'],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.hashtags).toContain(
        'Hashtags must not include a leading #'
      )
    }
  })

  it('accepts HTTPS media URLs and rejects HTTP media URLs', () => {
    const valid = createSocialPostSchema.safeParse({
      platform: 'instagram',
      content: 'Valid content',
      mediaUrls: ['https://cdn.example.com/image.jpg'],
    })
    const invalid = createSocialPostSchema.safeParse({
      platform: 'instagram',
      content: 'Valid content',
      mediaUrls: ['http://cdn.example.com/image.jpg'],
    })

    expect(valid.success).toBe(true)
    expect(invalid.success).toBe(false)
  })
})

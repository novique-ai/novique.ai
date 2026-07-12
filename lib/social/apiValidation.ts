import { z } from 'zod'
import {
  PLATFORM_CONSTRAINTS,
  type SocialPlatform,
  type SocialPostStatus,
} from '@/lib/social/types'

const platformSchema = z.enum(['twitter', 'linkedin', 'instagram'])
const clientStatusSchema = z.enum(['draft', 'queued', 'scheduled'])
const sourceTypeSchema = z.enum(['blog', 'lab', 'manual'])
const postTypeSchema = z.enum([
  'auto_distributed',
  'native_insight',
  'founder_post',
])
const nullableIsoDateTimeSchema = z
  .string()
  .datetime({ offset: true })
  .nullable()
const nullableUuidSchema = z.string().uuid().nullable()
const hashtagSchema = z
  .string()
  .trim()
  .min(1, 'Hashtags cannot be empty')
  .refine((hashtag) => !hashtag.startsWith('#'), {
    message: 'Hashtags must not include a leading #',
  })
const mediaUrlSchema = z
  .string()
  .url()
  .refine((url) => new URL(url).protocol === 'https:', {
    message: 'Media URLs must use HTTPS',
  })

const sourceFields = {
  sourceType: sourceTypeSchema.optional(),
  sourceId: z.string().min(1).nullable().optional(),
  sourceTitle: z.string().nullable().optional(),
  sourceUrl: z.string().url().nullable().optional(),
  autoPublish: z.boolean().optional(),
  postType: postTypeSchema.optional(),
  templateId: nullableUuidSchema.optional(),
}

const scheduledFields = {
  scheduledFor: nullableIsoDateTimeSchema.optional(),
  // The existing editor sends scheduledAt; scheduledFor is the canonical API name.
  scheduledAt: nullableIsoDateTimeSchema.optional(),
}

function addPlatformConstraintIssues(
  data: {
    platform?: SocialPlatform
    content?: string
    hashtags?: string[]
  },
  context: z.RefinementCtx
) {
  if (!data.platform) return

  const constraints = PLATFORM_CONSTRAINTS[data.platform]

  if (data.content !== undefined && data.content.length > constraints.maxLength) {
    context.addIssue({
      code: 'custom',
      path: ['content'],
      message: `Content must be at most ${constraints.maxLength} characters for ${data.platform}`,
    })
  }

  if (data.hashtags !== undefined && data.hashtags.length > constraints.maxHashtags) {
    context.addIssue({
      code: 'custom',
      path: ['hashtags'],
      message: `At most ${constraints.maxHashtags} hashtags are allowed for ${data.platform}`,
    })
  }
}

function addSchedulingIssues(
  data: {
    status?: 'draft' | 'queued' | 'scheduled'
    scheduledFor?: string | null
    scheduledAt?: string | null
  },
  context: z.RefinementCtx
) {
  if (
    data.scheduledFor !== undefined &&
    data.scheduledAt !== undefined &&
    data.scheduledFor !== data.scheduledAt
  ) {
    context.addIssue({
      code: 'custom',
      path: ['scheduledFor'],
      message: 'scheduledFor and scheduledAt must match when both are provided',
    })
  }

  const scheduledFor =
    data.scheduledFor !== undefined ? data.scheduledFor : data.scheduledAt

  if (data.status === 'scheduled' && !scheduledFor) {
    context.addIssue({
      code: 'custom',
      path: [data.scheduledAt !== undefined ? 'scheduledAt' : 'scheduledFor'],
      message: 'A scheduled date is required when status is scheduled',
    })
  }

  if (
    data.status === 'scheduled' &&
    scheduledFor &&
    new Date(scheduledFor) <= new Date()
  ) {
    context.addIssue({
      code: 'custom',
      path: [data.scheduledAt !== undefined ? 'scheduledAt' : 'scheduledFor'],
      message: 'Scheduled date must be in the future',
    })
  }
}

export const createSocialPostSchema = z
  .object({
    platform: platformSchema,
    content: z.string().refine((content) => content.trim().length > 0, {
      message: 'Content is required',
    }),
    hashtags: z.array(hashtagSchema).optional().default([]),
    mediaUrls: z.array(mediaUrlSchema).max(10).optional(),
    status: clientStatusSchema.optional().default('draft'),
    socialAccountId: nullableUuidSchema.optional(),
    ...scheduledFields,
    ...sourceFields,
  })
  .superRefine((data, context) => {
    addPlatformConstraintIssues(data, context)
    addSchedulingIssues(data, context)
  })

export const updateSocialPostSchema = z
  .object({
    platform: platformSchema.optional(),
    content: z
      .string()
      .refine((content) => content.trim().length > 0, {
        message: 'Content cannot be empty',
      })
      .optional(),
    hashtags: z.array(hashtagSchema).optional(),
    mediaUrls: z.array(mediaUrlSchema).max(10).optional(),
    status: clientStatusSchema.optional(),
    socialAccountId: nullableUuidSchema.optional(),
    ...scheduledFields,
    ...sourceFields,
  })
  .superRefine((data, context) => {
    addPlatformConstraintIssues(data, context)
    addSchedulingIssues(data, context)
  })

export const decideContentApprovalSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(['approved', 'rejected']),
  notes: z.string().trim().max(4000).optional(),
})

const allowedStatusTransitions: Partial<
  Record<SocialPostStatus, readonly SocialPostStatus[]>
> = {
  draft: ['queued', 'scheduled'],
  queued: ['draft'],
  scheduled: ['draft'],
  failed: ['draft', 'queued', 'scheduled'],
}

export function isAllowedSocialPostStatusTransition(
  currentStatus: SocialPostStatus,
  nextStatus: SocialPostStatus
) {
  // Sending the current status is a no-op, not a status transition.
  return (
    currentStatus === nextStatus ||
    allowedStatusTransitions[currentStatus]?.includes(nextStatus) === true
  )
}

export function getScheduledFor(input: {
  scheduledFor?: string | null
  scheduledAt?: string | null
}) {
  return input.scheduledFor !== undefined
    ? input.scheduledFor
    : input.scheduledAt
}

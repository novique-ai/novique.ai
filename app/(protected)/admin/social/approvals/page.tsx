'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ApprovalCard,
  PlatformBadge,
  PlatformPreview,
  SocialStatusBadge,
} from '@/components/social'
import type {
  ContentApproval,
  ContentApprovalSubjectType,
  SocialPlatform,
  SocialPost,
} from '@/lib/social/types'

interface ApprovalListResponse {
  data?: ContentApproval[]
  total?: number
  error?: string
}

interface PostsResponse {
  data?: SocialPost[]
  error?: string
}

interface CampaignBrief {
  title: string
  brief: string
  scores: Array<{ label: string; value: string }>
}

const APPROVAL_SECTIONS: Array<{
  type: ContentApprovalSubjectType
  title: string
  description: string
}> = [
  {
    type: 'weekly_plan',
    title: 'Weekly plans',
    description: 'Approve the proposed campaign mix before research and drafting begin.',
  },
  {
    type: 'article',
    title: 'Article reviews',
    description: 'Review canonical articles before they move into distribution.',
  },
  {
    type: 'post_review',
    title: 'Post reviews',
    description: 'Approved posts enter the publish queue immediately.',
  },
  {
    type: 'template_probation',
    title: 'Template probation',
    description: 'Promote proven platform templates to trusted status.',
  },
  {
    type: 'image_style',
    title: 'Image styles',
    description: 'Approve or reject proposed visual directions.',
  },
]

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function firstString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (typeof record[key] === 'string' && record[key]) return record[key] as string
  }
  return ''
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(formatValue).join(', ')
  return Object.entries(value as Record<string, unknown>)
    .map(([key, item]) => `${formatLabel(key)}: ${formatValue(item)}`)
    .join(' · ')
}

function getCampaignBriefs(payload: Record<string, unknown>): CampaignBrief[] {
  const possibleLists = [
    payload.campaigns,
    payload.briefs,
    payload.topics,
    payload.plan,
    payload.weekly_plan,
  ]
  const list = possibleLists.find(Array.isArray)
  const entries = Array.isArray(list) ? list : [payload]

  return entries.flatMap((entry, index) => {
    const record = asRecord(entry)
    if (!record) return []
    const topicBrief = asRecord(record.topic_brief) || record
    const title =
      firstString(record, ['title', 'campaign_title', 'name', 'topic']) ||
      `Campaign ${index + 1}`
    const suppliedBrief =
      firstString(record, ['brief', 'summary', 'description']) ||
      firstString(topicBrief, ['brief', 'summary', 'description'])
    const brief = suppliedBrief || [
      firstString(topicBrief, ['audience'])
        ? `Audience: ${firstString(topicBrief, ['audience'])}.`
        : '',
      firstString(topicBrief, ['angle'])
        ? `Angle: ${firstString(topicBrief, ['angle'])}.`
        : '',
      firstString(topicBrief, ['rationale'])
        ? `Rationale: ${firstString(topicBrief, ['rationale'])}.`
        : '',
    ].filter(Boolean).join(' ')
    const scoresRecord = asRecord(record.scores) || asRecord(topicBrief.scores)
    const scores = scoresRecord
      ? Object.entries(scoresRecord).map(([label, value]) => ({
          label: formatLabel(label),
          value: formatValue(value),
        }))
      : Object.entries({ ...topicBrief, ...record })
          .filter(([key, value]) => key.toLowerCase().includes('score') && value !== undefined)
          .map(([label, value]) => ({
            label: formatLabel(label),
            value: formatValue(value),
          }))

    return [{ title, brief, scores }]
  })
}

function PayloadDetails({ payload }: { payload: Record<string, unknown> }) {
  const entries = Object.entries(payload)
  if (entries.length === 0) return null

  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-lg bg-gray-50 px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {formatLabel(key)}
          </dt>
          <dd className="mt-1 text-sm text-gray-900 break-words">{formatValue(value)}</dd>
        </div>
      ))}
    </dl>
  )
}

function WeeklyPlanDetails({ payload }: { payload: Record<string, unknown> }) {
  const briefs = getCampaignBriefs(payload)

  return (
    <div className="space-y-4">
      {briefs.map((campaign, index) => (
        <div key={`${campaign.title}-${index}`} className="rounded-lg border border-gray-200 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h4 className="font-semibold text-gray-900">{campaign.title}</h4>
            {campaign.scores.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {campaign.scores.map((score) => (
                  <span
                    key={score.label}
                    className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                  >
                    {score.label}: {score.value}
                  </span>
                ))}
              </div>
            )}
          </div>
          <p className="mt-2 text-sm leading-6 text-gray-700">
            {campaign.brief || 'No campaign brief was supplied.'}
          </p>
        </div>
      ))}
    </div>
  )
}

function PostReviewDetails({
  approval,
  post,
}: {
  approval: ContentApproval
  post?: SocialPost
}) {
  if (!post) {
    return (
      <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
        The referenced post preview could not be loaded.{' '}
        <Link
          href={`/admin/social/${approval.subject_id}/edit`}
          className="font-medium underline hover:text-amber-900"
        >
          Open the post editor
        </Link>{' '}
        before deciding.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PlatformBadge platform={post.platform} size="sm" />
        <Link
          href={`/admin/social/${post.id}/edit`}
          className="text-sm font-medium text-blue-600 hover:text-blue-900"
        >
          Edit post
        </Link>
      </div>
      <PlatformPreview
        platform={post.platform}
        content={post.content}
        hashtags={post.hashtags || []}
      />
      {post.hashtags && post.hashtags.length > 0 && (
        <p className="text-sm text-blue-600">
          {post.hashtags.map((tag) => `#${tag}`).join(' ')}
        </p>
      )}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {post.media_urls.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
            >
              <Image
                src={url}
                alt={`${post.platform} media ${index + 1}`}
                fill
                unoptimized
                sizes="(max-width: 640px) 50vw, 180px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
      {Object.keys(approval.payload).length > 0 && (
        <details className="text-sm text-gray-600">
          <summary className="cursor-pointer font-medium text-gray-700">Review metadata</summary>
          <div className="mt-3">
            <PayloadDetails payload={approval.payload} />
          </div>
        </details>
      )}
    </div>
  )
}

export default function SocialApprovalsPage() {
  const [approvals, setApprovals] = useState<ContentApproval[]>([])
  const [postReviews, setPostReviews] = useState<Record<string, SocialPost>>({})
  const [needsReview, setNeedsReview] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [decidingId, setDecidingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadInbox = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [approvalsResponse, needsReviewResponse] = await Promise.all([
        fetch('/api/social/approvals'),
        fetch('/api/social/posts?status=needs_review&limit=100'),
      ])
      const approvalsResult = (await approvalsResponse.json()) as ApprovalListResponse
      const needsReviewResult = (await needsReviewResponse.json()) as PostsResponse

      if (!approvalsResponse.ok) {
        throw new Error(approvalsResult.error || 'Failed to load approvals')
      }
      if (!needsReviewResponse.ok) {
        throw new Error(needsReviewResult.error || 'Failed to load needs-review posts')
      }

      const pending = approvalsResult.data || []
      setApprovals(pending)
      setNeedsReview(needsReviewResult.data || [])
      window.dispatchEvent(
        new CustomEvent('social-approvals-updated', { detail: approvalsResult.total || 0 })
      )

      const postApprovals = pending.filter(
        (approval) => approval.subject_type === 'post_review'
      )
      const postResults = await Promise.all(
        postApprovals.map(async (approval) => {
          const response = await fetch(`/api/social/posts/${approval.subject_id}`)
          if (!response.ok) return null
          const result = (await response.json()) as { data?: SocialPost }
          return result.data ? ([approval.id, result.data] as const) : null
        })
      )
      setPostReviews(
        Object.fromEntries(postResults.filter((result) => result !== null))
      )
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load approval inbox')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInbox()
  }, [loadInbox])

  const approvalsByType = useMemo(
    () =>
      Object.fromEntries(
        APPROVAL_SECTIONS.map((section) => [
          section.type,
          approvals.filter((approval) => approval.subject_type === section.type),
        ])
      ) as Record<ContentApprovalSubjectType, ContentApproval[]>,
    [approvals]
  )

  const decideApproval = async (
    id: string,
    decision: 'approved' | 'rejected',
    notes?: string
  ) => {
    setDecidingId(id)
    setError(null)

    try {
      const response = await fetch('/api/social/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, decision, notes }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to save decision')

      setApprovals((current) => {
        const next = current.filter((approval) => approval.id !== id)
        window.dispatchEvent(
          new CustomEvent('social-approvals-updated', { detail: next.length })
        )
        return next
      })
    } catch (decisionError) {
      setError(
        decisionError instanceof Error ? decisionError.message : 'Failed to save decision'
      )
    } finally {
      setDecidingId(null)
    }
  }

  const renderApprovalDetails = (approval: ContentApproval) => {
    if (approval.subject_type === 'weekly_plan') {
      return <WeeklyPlanDetails payload={approval.payload} />
    }
    if (approval.subject_type === 'post_review') {
      return (
        <PostReviewDetails approval={approval} post={postReviews[approval.id]} />
      )
    }
    return <PayloadDetails payload={approval.payload} />
  }

  const pendingTotal = approvals.length

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Approval inbox</h1>
            {!loading && pendingTotal > 0 && (
              <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
                {pendingTotal} pending
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-700">
            Review content gates and posts parked for operator attention.
          </p>
        </div>
        <Link
          href="/admin/social"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to posts
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex flex-wrap items-center justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={loadInbox}
            className="font-medium text-red-700 hover:text-red-900"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-white shadow rounded-lg py-16 text-center text-gray-500">
          Loading approval inbox...
        </div>
      ) : (
        <>
          {pendingTotal === 0 && needsReview.length === 0 && (
            <div className="bg-white shadow rounded-lg px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">Inbox clear</h2>
              <p className="mt-1 text-sm text-gray-500">
                There are no pending approvals or needs-review posts.
              </p>
            </div>
          )}

          {APPROVAL_SECTIONS.map((section) => {
            const sectionApprovals = approvalsByType[section.type]
            if (sectionApprovals.length === 0) return null

            return (
              <section key={section.type} className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
                    <span className="inline-flex rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      {sectionApprovals.length}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{section.description}</p>
                </div>
                <div className="space-y-4">
                  {sectionApprovals.map((approval) => (
                    <ApprovalCard
                      key={approval.id}
                      id={approval.id}
                      title={approval.summary}
                      requestedAt={approval.requested_at}
                      deciding={decidingId === approval.id}
                      onDecision={decideApproval}
                    >
                      {renderApprovalDetails(approval)}
                    </ApprovalCard>
                  ))}
                </div>
              </section>
            )
          })}

          {needsReview.length > 0 && (
            <section className="space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-gray-900">Needs-review posts</h2>
                  <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                    {needsReview.length}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  Posts parked after ambiguous publishing outcomes or stale sweeps.
                </p>
              </div>
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {needsReview.map((post) => (
                    <li key={post.id} className="p-5 hover:bg-gray-50">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <PlatformBadge platform={post.platform as SocialPlatform} size="sm" />
                            <SocialStatusBadge status={post.status} />
                            {post.source_title && (
                              <span className="text-sm text-gray-500">{post.source_title}</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-900 whitespace-pre-wrap line-clamp-3">
                            {post.content}
                          </p>
                          {post.error_details?.message && (
                            <p className="text-xs text-red-600">{post.error_details.message}</p>
                          )}
                        </div>
                        <Link
                          href={`/admin/social/${post.id}/edit`}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Review post
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

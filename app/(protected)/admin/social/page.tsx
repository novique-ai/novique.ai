'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { PlatformBadge, SocialStatusBadge, SocialGenerateModal } from '@/components/social'
import type {
  SocialMetricsDashboardSummary,
  SocialPost,
  SocialPlatform,
  SocialPostStatus,
} from '@/lib/social/types'

interface PostStats {
  total: number
  byStatus: Record<SocialPostStatus, number>
  byPlatform: Record<SocialPlatform, number>
}

function emptyMetricsSummary(): SocialMetricsDashboardSummary {
  return {
    published_this_month: 0,
    pending_approvals: 0,
    platforms: {
      twitter: { impressions: null, likes: null, captured_at: null },
      linkedin: { impressions: null, likes: null, captured_at: null },
      instagram: { impressions: null, likes: null, captured_at: null },
    },
  }
}

export default function AdminSocialPage() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [metricsSummary, setMetricsSummary] = useState<SocialMetricsDashboardSummary>(
    emptyMetricsSummary
  )
  const [stats, setStats] = useState<PostStats>({
    total: 0,
    byStatus: {
      draft: 0,
      queued: 0,
      scheduled: 0,
      publishing: 0,
      published: 0,
      failed: 0,
      needs_review: 0,
    },
    byPlatform: {
      twitter: 0,
      linkedin: 0,
      instagram: 0,
    },
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)

  // Filters
  const [platformFilter, setPlatformFilter] = useState<SocialPlatform | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<SocialPostStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const loadPosts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (platformFilter !== 'all') params.append('platform', platformFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchQuery) params.append('search', searchQuery)

      const [postsResponse, metricsResponse] = await Promise.all([
        fetch(`/api/social/posts?${params.toString()}`),
        fetch('/api/social/metrics'),
      ])
      if (!postsResponse.ok) {
        throw new Error('Failed to fetch posts')
      }
      if (!metricsResponse.ok) {
        throw new Error('Failed to fetch social metrics')
      }

      const [postsResult, metricsResult] = await Promise.all([
        postsResponse.json(),
        metricsResponse.json(),
      ])
      setPosts(postsResult.data || [])
      setStats((current) => postsResult.stats || current)
      setMetricsSummary(metricsResult.data || emptyMetricsSummary())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [platformFilter, statusFilter, searchQuery])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const response = await fetch(`/api/social/posts/${postId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete post')
      }

      loadPosts()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete post')
    }
  }

  const handlePublish = async (postId: string) => {
    if (!confirm('Publish this post now?')) return

    setPublishingId(postId)
    setError(null)

    try {
      const response = await fetch(`/api/social/posts/${postId}/publish`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish post')
      }

      // Show success with link to post
      if (data.platformUrl) {
        const viewPost = confirm(
          `Post published successfully!\n\nView on ${data.data.platform}?`
        )
        if (viewPost) {
          window.open(data.platformUrl, '_blank')
        }
      }

      loadPosts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish post')
    } finally {
      setPublishingId(null)
    }
  }

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const statsArray = [
    { name: 'Total Posts', value: stats.total, color: 'bg-gray-50' },
    { name: 'Drafts', value: stats.byStatus.draft, color: 'bg-gray-50' },
    { name: 'Scheduled', value: stats.byStatus.scheduled, color: 'bg-blue-50' },
    { name: 'Published', value: stats.byStatus.published, color: 'bg-green-50' },
  ]
  const compactNumber = (value: number | null) =>
    value === null ? '—' : Intl.NumberFormat('en-US', { notation: 'compact' }).format(value)
  const metricsPlatforms: Array<{ platform: SocialPlatform; label: string }> = [
    { platform: 'twitter', label: 'X' },
    { platform: 'linkedin', label: 'LinkedIn' },
    { platform: 'instagram', label: 'Instagram' },
  ]

  return (
    <div className="space-y-6">
      {/* Generate Modal */}
      <SocialGenerateModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onSave={() => {
          setShowGenerateModal(false)
          loadPosts()
        }}
      />

      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Social Media</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage social media posts across all platforms
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/social/accounts"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            Manage Accounts
          </Link>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-purple-300 text-sm font-medium rounded-md shadow-sm text-purple-700 bg-purple-50 hover:bg-purple-100"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Generate from Blog
          </button>
        </div>
      </div>

      {/* Fixed-window metrics summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="bg-white overflow-hidden shadow rounded-lg p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Published this month
          </div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {metricsSummary.published_this_month}
          </div>
        </div>
        <div className="bg-amber-50 overflow-hidden shadow rounded-lg p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Pending approvals
          </div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {metricsSummary.pending_approvals}
          </div>
        </div>
        {metricsPlatforms.map(({ platform, label }) => {
          const metric = metricsSummary.platforms[platform]
          return (
            <div key={platform} className="bg-gray-50 overflow-hidden shadow rounded-lg p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {label} latest totals
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {compactNumber(metric.impressions)} impressions
              </div>
              <div className="text-xs text-gray-600">
                {compactNumber(metric.likes)} likes
              </div>
            </div>
          )
        })}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        {statsArray.map((stat) => (
          <div
            key={stat.name}
            className={`${stat.color} overflow-hidden shadow rounded-lg`}
          >
            <div className="p-5">
              <dt className="text-sm font-medium text-gray-500 truncate">
                {stat.name}
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {stat.value}
              </dd>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          {/* Platform Filter */}
          <div className="flex-1 min-w-[150px]">
            <label
              htmlFor="platform"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Platform
            </label>
            <select
              id="platform"
              value={platformFilter}
              onChange={(e) =>
                setPlatformFilter(e.target.value as SocialPlatform | 'all')
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Platforms</option>
              <option value="twitter">X (Twitter)</option>
              <option value="linkedin">LinkedIn</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex-1 min-w-[150px]">
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as SocialPostStatus | 'all')
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="queued">Queued</option>
              <option value="published">Published</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex-[2] min-w-[200px]">
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search
            </label>
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search content..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Posts Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Platform
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Content
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Source
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {posts && posts.length > 0 ? (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PlatformBadge platform={post.platform} size="sm" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md">
                        {truncateContent(post.content)}
                      </div>
                      {post.hashtags && post.hashtags.length > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          {post.hashtags.slice(0, 3).map((tag) => `#${tag}`).join(' ')}
                          {post.hashtags.length > 3 && ` +${post.hashtags.length - 3}`}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {post.source_title ? (
                        <div className="text-sm">
                          <span className="text-gray-900">{truncateContent(post.source_title, 30)}</span>
                          <div className="text-xs text-gray-500 capitalize">
                            {post.source_type}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Manual</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SocialStatusBadge status={post.status} />
                      {post.status === 'scheduled' && post.scheduled_at && (
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(post.scheduled_at)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {post.status === 'published'
                        ? formatDate(post.published_at)
                        : formatDate(post.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      {/* Publish button for unpublished posts */}
                      {(post.status === 'draft' || post.status === 'scheduled' || post.status === 'failed') && (
                        <button
                          onClick={() => handlePublish(post.id)}
                          disabled={publishingId === post.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          {publishingId === post.id ? 'Publishing...' : 'Publish'}
                        </button>
                      )}
                      <Link
                        href={`/admin/social/${post.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </Link>
                      {post.status !== 'published' && post.status !== 'publishing' && (
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                      {post.platform_post_url && (
                        <a
                          href={post.platform_post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-900"
                        >
                          View
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="space-y-2">
                      <p>No social posts yet.</p>
                      <button
                        onClick={() => setShowGenerateModal(true)}
                        className="text-blue-600 hover:text-blue-500"
                      >
                        Generate posts from a blog article
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

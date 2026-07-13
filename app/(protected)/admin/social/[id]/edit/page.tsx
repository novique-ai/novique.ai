'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { SocialPostEditor } from '@/components/social'
import type { SocialPost } from '@/lib/social/types'
import type { SocialPostData } from '@/hooks/useSocialPostEditor'

export default function EditSocialPostPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string

  const [post, setPost] = useState<SocialPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPost() {
      try {
        const response = await fetch(`/api/social/posts/${postId}`)
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to load post')
        }
        const result = await response.json()
        setPost(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [postId])

  const handleSave = () => {
    router.push('/admin/social')
  }

  const handleDelete = () => {
    router.push('/admin/social')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-ink-2">Loading...</div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="space-y-4">
        <div className="bg-red-500/10 border border-red-500/25 text-red-300 px-4 py-3 rounded-lg">
          {error || 'Post not found'}
        </div>
        <Link
          href="/admin/social"
          className="inline-flex items-center text-aqua hover:text-aqua-bright"
        >
          &larr; Back to Social Posts
        </Link>
      </div>
    )
  }

  // Convert SocialPost to SocialPostData format
  const initialData: Partial<SocialPostData> = {
    id: post.id,
    platform: post.platform,
    content: post.content,
    hashtags: post.hashtags || [],
    status: post.status,
    scheduledAt: post.scheduled_at,
    autoPublish: post.auto_publish,
    sourceType: post.source_type,
    sourceId: post.source_id,
    sourceTitle: post.source_title,
    sourceUrl: post.source_url,
    postType: post.post_type,
    templateId: post.template_id,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <nav className="text-sm text-ink-2 mb-2">
            <Link href="/admin/social" className="hover:text-aqua">
              Social Posts
            </Link>
            <span className="mx-2">/</span>
            <span>Edit</span>
          </nav>
          <h1 className="text-3xl font-bold text-ink-0">Edit Social Post</h1>
        </div>
      </div>

      {/* Editor */}
      <div className="bg-surface-2 shadow rounded-lg p-6">
        <SocialPostEditor
          initialData={initialData}
          platform={post.platform}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </div>
    </div>
  )
}

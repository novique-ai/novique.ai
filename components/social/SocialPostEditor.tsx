'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  PlatformBadge,
  SocialStatusBadge,
  CharacterCounter,
  HashtagEditor,
  SchedulePicker,
  PlatformPreview,
  MediaPicker,
} from '@/components/social'
import { useSocialPostEditor, type SocialPostData } from '@/hooks/useSocialPostEditor'
import type { SocialPlatform, SocialPostStatus } from '@/lib/social/types'

interface SocialPostEditorProps {
  initialData?: Partial<SocialPostData>
  platform: SocialPlatform
  onSave?: () => void
  onDelete?: () => void
}

const PLATFORM_MAX_HASHTAGS: Record<SocialPlatform, number> = {
  twitter: 5,
  linkedin: 10,
  instagram: 30,
}

export default function SocialPostEditor({
  initialData,
  platform,
  onSave,
  onDelete,
}: SocialPostEditorProps) {
  const {
    formData,
    updateField,
    errors,
    savePost,
    deletePost,
    isSaving,
    characterCount,
    characterLimit,
    isWithinLimit,
  } = useSocialPostEditor({ initialData, platform })

  const [saveError, setSaveError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const handleSave = async () => {
    setSaveError(null)
    try {
      await savePost()
      onSave?.()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      return
    }
    try {
      await deletePost()
      onDelete?.()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const isPublished = formData.status === 'published'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Editor Column */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PlatformBadge platform={formData.platform} size="lg" />
            {formData.id && <SocialStatusBadge status={formData.status} size="md" />}
          </div>
          {formData.sourceTitle && (
            <div className="text-sm text-gray-500">
              From: <span className="font-medium">{formData.sourceTitle}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => updateField('content', e.target.value)}
            disabled={isPublished}
            rows={6}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
              errors.content ? 'border-red-300' : 'border-gray-300'
            } ${isPublished ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder="Write your social post content..."
          />
          <div className="flex justify-between items-center mt-2">
            {errors.content && (
              <p className="text-sm text-red-600">{errors.content}</p>
            )}
            <div className="ml-auto">
              <CharacterCounter
                current={characterCount}
                max={characterLimit}
              />
            </div>
          </div>
        </div>

        {/* Hashtags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hashtags
          </label>
          <HashtagEditor
            hashtags={formData.hashtags}
            onChange={(hashtags) => updateField('hashtags', hashtags)}
            max={PLATFORM_MAX_HASHTAGS[formData.platform]}
          />
        </div>

        {/* Media */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Media
          </label>
          <MediaPicker
            mediaUrls={formData.mediaUrls}
            onChange={(mediaUrls) => updateField('mediaUrls', mediaUrls)}
            platform={formData.platform}
            postId={formData.id}
            sourceType={formData.sourceType}
            disabled={isPublished}
            error={errors.mediaUrls}
          />
        </div>

        {/* Status & Scheduling */}
        {!isPublished && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => updateField('status', e.target.value as SocialPostStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="queued">Queued</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <input
                  type="checkbox"
                  checked={formData.autoPublish}
                  onChange={(e) => updateField('autoPublish', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Auto-publish when ready
              </label>
            </div>
          </div>
        )}

        {/* Schedule Picker */}
        {formData.status === 'scheduled' && !isPublished && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule For
            </label>
            <SchedulePicker
              value={formData.scheduledAt}
              onChange={(value) => updateField('scheduledAt', value)}
              error={errors.scheduledAt}
            />
          </div>
        )}

        {/* Error Message */}
        {saveError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {saveError}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex gap-3">
            {formData.id && !isPublished && (
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  deleteConfirm
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'text-red-600 hover:bg-red-50'
                }`}
              >
                {deleteConfirm ? 'Click again to confirm' : 'Delete'}
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin/social"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
            {!isPublished && (
              <button
                onClick={handleSave}
                disabled={isSaving || !isWithinLimit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : formData.id ? 'Update Post' : 'Create Post'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preview Column */}
      <div className="lg:sticky lg:top-6 self-start">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Preview</h3>
        <div className="bg-gray-100 rounded-lg p-6 flex justify-center">
          <PlatformPreview
            platform={formData.platform}
            content={formData.content}
            hashtags={formData.hashtags}
            sourceUrl={formData.sourceUrl || undefined}
          />
        </div>
      </div>
    </div>
  )
}

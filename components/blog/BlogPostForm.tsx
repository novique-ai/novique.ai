'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import TipTapEditor from './TipTapEditor'
import SocialMetadataSection from './SocialMetadataSection'
import { useBlogEditor } from '@/hooks/useBlogEditor'
import { useAutoSave } from '@/hooks/useAutoSave'

interface BlogPostFormProps {
  initialData?: any
  isAdmin?: boolean
}

export default function BlogPostForm({ initialData, isAdmin = false }: BlogPostFormProps) {
  const router = useRouter()
  const { formData, updateField, errors, savePost, deletePost, isSaving } = useBlogEditor({
    initialData,
    autoGenerateSlug: !initialData?.id,
  })

  const [tagInput, setTagInput] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

  // Auto-save every 30 seconds
  const { lastSaved, isSaving: isAutoSaving } = useAutoSave({
    onSave: async () => {
      if (formData.title && formData.content) {
        await savePost(false) // Save as draft
      }
    },
    interval: 30000,
    enabled: !!formData.title, // Only auto-save if there's a title
  })

  // Upload header image
  const handleHeaderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      uploadData.append('postSlug', formData.slug || 'temp')

      const response = await fetch('/api/blog/upload-image', {
        method: 'POST',
        body: uploadData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      updateField('headerImage', result.data.original)
    } catch (error) {
      console.error('Header image upload error:', error)
      alert('Failed to upload header image')
    } finally {
      setUploadingImage(false)
    }
  }

  // Upload content image (for TipTap editor)
  const handleContentImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/blog/upload-image', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    const result = await response.json()
    return result.data.medium // Use medium size for content images
  }

  // Add tag
  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !formData.tags.includes(tag)) {
      updateField('tags', [...formData.tags, tag])
      setTagInput('')
    }
  }

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    updateField(
      'tags',
      formData.tags.filter((tag) => tag !== tagToRemove)
    )
  }

  // Save and publish
  const handlePublish = async () => {
    try {
      await savePost(true)
      router.push('/admin/blog')
    } catch (error) {
      alert('Failed to publish post')
    }
  }

  // Save as draft
  const handleSaveDraft = async () => {
    try {
      await savePost(false)
      alert('Draft saved successfully')
    } catch (error) {
      alert('Failed to save draft')
    }
  }

  // Delete post
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      await deletePost()
    } catch (error) {
      alert('Failed to delete post')
    }
  }

  return (
    <form className="space-y-6 max-w-5xl mx-auto" onSubmit={(e) => e.preventDefault()}>
      {/* Auto-save indicator */}
      {lastSaved && (
        <div className="bg-aqua/10 border border-aqua/30 rounded-lg p-3 text-sm text-aqua">
          {isAutoSaving ? (
            <span>Saving...</span>
          ) : (
            <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
          )}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-ink-1 mb-2">
          Title *
        </label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => updateField('title', e.target.value)}
          className="w-full px-4 py-2 bg-surface-1 border border-stroke-1 text-ink-0 placeholder-ink-3 rounded-lg focus:ring-2 focus:ring-aqua/60 focus:border-transparent"
          placeholder="Enter blog post title..."
        />
        {errors.title && <p className="mt-1 text-sm text-red-400">{errors.title}</p>}
      </div>

      {/* Slug */}
      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-ink-1 mb-2">
          Slug *
        </label>
        <input
          id="slug"
          type="text"
          value={formData.slug}
          onChange={(e) => updateField('slug', e.target.value.toLowerCase())}
          className="w-full px-4 py-2 bg-surface-1 border border-stroke-1 text-ink-0 placeholder-ink-3 rounded-lg focus:ring-2 focus:ring-aqua/60 focus:border-transparent font-mono text-sm"
          placeholder="url-friendly-slug"
        />
        {errors.slug && <p className="mt-1 text-sm text-red-400">{errors.slug}</p>}
        <p className="mt-1 text-sm text-ink-2">
          URL: /blog/{formData.slug || 'your-slug-here'}
        </p>
      </div>

      {/* Summary */}
      <div>
        <label htmlFor="summary" className="block text-sm font-medium text-ink-1 mb-2">
          Summary * <span className="text-ink-2 font-normal">({formData.summary.length}/300)</span>
        </label>
        <textarea
          id="summary"
          value={formData.summary}
          onChange={(e) => updateField('summary', e.target.value)}
          rows={3}
          maxLength={300}
          className="w-full px-4 py-2 bg-surface-1 border border-stroke-1 text-ink-0 placeholder-ink-3 rounded-lg focus:ring-2 focus:ring-aqua/60 focus:border-transparent"
          placeholder="Brief summary for blog listing page..."
        />
        {errors.summary && <p className="mt-1 text-sm text-red-400">{errors.summary}</p>}
      </div>

      {/* Meta Description (SEO) */}
      <div>
        <label htmlFor="metaDescription" className="block text-sm font-medium text-ink-1 mb-2">
          Meta Description (SEO){' '}
          <span className="text-ink-2 font-normal">
            ({formData.metaDescription?.length || 0}/160)
          </span>
        </label>
        <textarea
          id="metaDescription"
          value={formData.metaDescription || ''}
          onChange={(e) => updateField('metaDescription', e.target.value)}
          rows={2}
          maxLength={160}
          className="w-full px-4 py-2 bg-surface-1 border border-stroke-1 text-ink-0 placeholder-ink-3 rounded-lg focus:ring-2 focus:ring-aqua/60 focus:border-transparent"
          placeholder="SEO meta description (optional, defaults to summary)..."
        />
      </div>

      {/* Header Image */}
      <div>
        <label className="block text-sm font-medium text-ink-1 mb-2">Header Image</label>
        {formData.headerImage && (
          <div className="mb-3">
            <img
              src={formData.headerImage}
              alt="Header preview"
              className="max-w-md rounded-lg border border-stroke-1"
            />
          </div>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleHeaderImageUpload}
          disabled={uploadingImage}
          className="block w-full text-sm text-ink-2 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-aqua/10 file:text-aqua hover:file:bg-aqua/20"
        />
        {uploadingImage && <p className="mt-1 text-sm text-aqua">Uploading...</p>}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-ink-1 mb-2">Tags</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            className="flex-1 px-4 py-2 bg-surface-1 border border-stroke-1 text-ink-0 placeholder-ink-3 rounded-lg focus:ring-2 focus:ring-aqua/60 focus:border-transparent"
            placeholder="Add tag and press Enter..."
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-4 py-2 bg-surface-2 border border-stroke-1 text-ink-1 rounded-lg hover:bg-surface-3"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-aqua/10 text-aqua ring-1 ring-inset ring-aqua/25 rounded-full text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-aqua-bright"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Featured & Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => updateField('featured', e.target.checked)}
              className="w-4 h-4 accent-[#2be8c2] border-stroke-1 rounded focus:ring-aqua/60"
            />
            <span className="text-sm font-medium text-ink-1">Featured Post</span>
          </label>
        </div>

        {isAdmin && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-ink-1 mb-2">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => updateField('status', e.target.value)}
              className="w-full px-4 py-2 bg-surface-1 border border-stroke-1 text-ink-0 placeholder-ink-3 rounded-lg focus:ring-2 focus:ring-aqua/60 focus:border-transparent"
            >
              <option value="draft">Draft</option>
              <option value="pending_review">Pending Review</option>
              <option value="published">Published</option>
            </select>
          </div>
        )}
      </div>

      {/* Social Media Metadata */}
      <SocialMetadataSection
        keyInsights={formData.keyInsights || []}
        coreTakeaway={formData.coreTakeaway || ''}
        onKeyInsightsChange={(insights) => updateField('keyInsights', insights)}
        onCoreTakeawayChange={(takeaway) => updateField('coreTakeaway', takeaway)}
        blogTitle={formData.title}
        blogContent={formData.content}
        blogSummary={formData.summary}
        postId={formData.id}
      />

      {/* Content Editor */}
      <div>
        <label className="block text-sm font-medium text-ink-1 mb-2">Content *</label>
        <TipTapEditor
          content={formData.content}
          onChange={(html, markdown) => {
            updateField('content', html)
            updateField('markdownContent', markdown)
          }}
          onImageUpload={handleContentImageUpload}
        />
        {errors.content && <p className="mt-1 text-sm text-red-400">{errors.content}</p>}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-stroke-0">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="px-6 py-2 border border-stroke-1 text-ink-1 rounded-lg hover:bg-surface-3/60 disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isSaving}
            className="px-6 py-2 bg-aqua text-[#04110d] font-semibold rounded-lg hover:bg-aqua-bright disabled:opacity-50"
          >
            {formData.status === 'published' ? 'Update' : 'Publish'}
          </button>
        </div>

        {initialData?.id && isAdmin && (
          <button
            type="button"
            onClick={handleDelete}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  )
}

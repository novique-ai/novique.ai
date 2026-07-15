import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type {
  SocialPost,
  SocialPlatform,
  SocialPostStatus,
  SocialSourceType,
  SocialPostType,
  PLATFORM_CONSTRAINTS,
} from '@/lib/social/types'

export interface SocialPostData {
  id?: string
  platform: SocialPlatform
  content: string
  hashtags: string[]
  mediaUrls: string[]
  status: SocialPostStatus
  scheduledAt: string | null
  autoPublish: boolean
  sourceType: SocialSourceType
  sourceId: string | null
  sourceTitle: string | null
  sourceUrl: string | null
  postType: SocialPostType
  templateId: string | null
}

interface UseSocialPostEditorOptions {
  initialData?: Partial<SocialPostData>
  platform?: SocialPlatform
}

// Platform character limits
const PLATFORM_LIMITS: Record<SocialPlatform, number> = {
  twitter: 280,
  linkedin: 3000,
  instagram: 2200,
}

// Twitter counts URLs as 23 characters
const TWITTER_URL_LENGTH = 23
const URL_REGEX = /https?:\/\/[^\s]+/g

/**
 * Count characters for a platform, applying platform-specific rules
 * Twitter counts all URLs as 23 characters
 */
function countCharacters(content: string, platform: SocialPlatform): number {
  if (platform === 'twitter') {
    // Replace URLs with placeholder of 23 chars
    const urls = content.match(URL_REGEX) || []
    let count = content.length
    urls.forEach((url) => {
      count = count - url.length + TWITTER_URL_LENGTH
    })
    return count
  }
  return content.length
}

export function useSocialPostEditor({
  initialData,
  platform = 'twitter',
}: UseSocialPostEditorOptions = {}) {
  const router = useRouter()
  const [formData, setFormData] = useState<SocialPostData>({
    id: initialData?.id,
    platform: initialData?.platform || platform,
    content: initialData?.content || '',
    hashtags: initialData?.hashtags || [],
    mediaUrls: initialData?.mediaUrls || [],
    status: initialData?.status || 'draft',
    scheduledAt: initialData?.scheduledAt || null,
    autoPublish: initialData?.autoPublish || false,
    sourceType: initialData?.sourceType || 'manual',
    sourceId: initialData?.sourceId || null,
    sourceTitle: initialData?.sourceTitle || null,
    sourceUrl: initialData?.sourceUrl || null,
    postType: initialData?.postType || 'auto_distributed',
    templateId: initialData?.templateId || null,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  // Character count with platform-specific rules
  const characterCount = useMemo(
    () => countCharacters(formData.content, formData.platform),
    [formData.content, formData.platform]
  )

  const characterLimit = PLATFORM_LIMITS[formData.platform]
  const isWithinLimit = characterCount <= characterLimit

  // Update form field
  const updateField = useCallback(
    (field: keyof SocialPostData, value: unknown) => {
      setFormData((prev) => ({ ...prev, [field]: value }))

      // Clear error for this field
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[field]
          return newErrors
        })
      }
    },
    [errors]
  )

  // Validate form
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required'
    } else if (!isWithinLimit) {
      newErrors.content = `Content exceeds ${characterLimit} character limit for ${formData.platform}`
    }

    if (formData.platform === 'instagram' && formData.mediaUrls.length === 0) {
      newErrors.mediaUrls = 'Instagram requires at least one image'
    }

    // Validate scheduled date if status is scheduled
    if (formData.status === 'scheduled' && !formData.scheduledAt) {
      newErrors.scheduledAt = 'Scheduled date is required when status is scheduled'
    }

    if (formData.scheduledAt) {
      const scheduledDate = new Date(formData.scheduledAt)
      if (scheduledDate <= new Date()) {
        newErrors.scheduledAt = 'Scheduled date must be in the future'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, isWithinLimit, characterLimit])

  // Save post
  const savePost = useCallback(async () => {
    if (!validate()) {
      return null
    }

    setIsSaving(true)

    try {
      const endpoint = formData.id
        ? `/api/social/posts/${formData.id}`
        : '/api/social/posts'
      const method = formData.id ? 'PUT' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save post')
      }

      const result = await response.json()
      return result.data as SocialPost
    } catch (error) {
      console.error('Save error:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }, [formData, validate])

  // Delete post
  const deletePost = useCallback(async () => {
    if (!formData.id) return

    try {
      const response = await fetch(`/api/social/posts/${formData.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete post')
      }

      router.push('/admin/social')
    } catch (error) {
      console.error('Delete error:', error)
      throw error
    }
  }, [formData.id, router])

  // Add hashtag
  const addHashtag = useCallback((tag: string) => {
    const cleanTag = tag.startsWith('#') ? tag.slice(1) : tag
    if (!cleanTag.trim()) return

    setFormData((prev) => {
      if (prev.hashtags.includes(cleanTag)) return prev
      return { ...prev, hashtags: [...prev.hashtags, cleanTag] }
    })
  }, [])

  // Remove hashtag
  const removeHashtag = useCallback((tag: string) => {
    setFormData((prev) => ({
      ...prev,
      hashtags: prev.hashtags.filter((t) => t !== tag),
    }))
  }, [])

  return {
    formData,
    updateField,
    errors,
    validate,
    savePost,
    deletePost,
    isSaving,
    // Character counting
    characterCount,
    characterLimit,
    isWithinLimit,
    // Hashtag helpers
    addHashtag,
    removeHashtag,
  }
}

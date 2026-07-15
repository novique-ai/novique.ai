'use client'

import Image from 'next/image'
import { FormEvent, useEffect, useRef, useState } from 'react'
import type {
  BrandedCardTemplate,
  SocialMediaUploadResult,
  SocialPlatform,
  SocialSourceType,
} from '@/lib/social/types'

const MAX_MEDIA = 10

interface MediaPickerProps {
  mediaUrls: string[]
  onChange: (mediaUrls: string[]) => void
  platform: SocialPlatform
  postId?: string
  sourceType?: SocialSourceType
  disabled?: boolean
  error?: string
}

export default function MediaPicker({
  mediaUrls,
  onChange,
  platform,
  postId,
  sourceType,
  disabled = false,
  error,
}: MediaPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [urlInput, setUrlInput] = useState('')
  const [headerImage, setHeaderImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isGeneratingCard, setIsGeneratingCard] = useState(false)
  const [cardTemplate, setCardTemplate] =
    useState<BrandedCardTemplate>('quote_card')
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const mediaCountRef = useRef(mediaUrls.length)
  const onChangeRef = useRef(onChange)
  mediaCountRef.current = mediaUrls.length
  onChangeRef.current = onChange

  useEffect(() => {
    if (!postId) return

    let cancelled = false
    async function loadHeaderImage() {
      try {
        const response = await fetch(`/api/social/posts/${postId}`)
        if (!response.ok) return
        const result = await response.json()
        if (cancelled) return

        const persistedMedia = result.data?.media_urls
        if (
          mediaCountRef.current === 0 &&
          Array.isArray(persistedMedia) &&
          persistedMedia.length > 0
        ) {
          onChangeRef.current(persistedMedia)
        }

        const sourceHeader = result.source?.header_image
        if (
          sourceType === 'blog' &&
          typeof sourceHeader === 'string' &&
          sourceHeader
        ) {
          setHeaderImage(sourceHeader)
        }
      } catch {
        // Header-image selection is optional; uploads and pasted URLs still work.
      }
    }

    loadHeaderImage()
    return () => {
      cancelled = true
    }
  }, [postId, sourceType])

  const appendUrls = (urls: string[]) => {
    const uniqueUrls = urls.filter((url) => !mediaUrls.includes(url))
    if (mediaUrls.length + uniqueUrls.length > MAX_MEDIA) {
      setLocalError(`A post can contain up to ${MAX_MEDIA} images`)
      return
    }
    setLocalError(null)
    onChange([...mediaUrls, ...uniqueUrls])
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (mediaUrls.length + files.length > MAX_MEDIA) {
      setLocalError(`A post can contain up to ${MAX_MEDIA} images`)
      return
    }

    setIsUploading(true)
    setLocalError(null)
    try {
      const body = new FormData()
      Array.from(files).forEach((file) => body.append('files', file))
      const response = await fetch('/api/social/upload-media', {
        method: 'POST',
        body,
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Upload failed')

      const uploads = result.data as SocialMediaUploadResult[]
      appendUrls(uploads.map((upload) => upload.instagram.url))
    } catch (uploadError) {
      setLocalError(
        uploadError instanceof Error ? uploadError.message : 'Upload failed'
      )
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleUrlSubmit = (event: FormEvent) => {
    event.preventDefault()
    try {
      const url = new URL(urlInput.trim())
      if (url.protocol !== 'https:') throw new Error('URL must use HTTPS')
      appendUrls([url.toString()])
      setUrlInput('')
    } catch (urlError) {
      setLocalError(
        urlError instanceof Error ? urlError.message : 'Enter a valid HTTPS URL'
      )
    }
  }

  const handleGenerateCard = async () => {
    if (!postId) {
      setLocalError('Save the post before generating a branded card')
      return
    }

    setIsGeneratingCard(true)
    setLocalError(null)
    try {
      const response = await fetch('/api/social/render-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: cardTemplate, postId }),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Branded card generation failed')
      }

      const url = result.data?.url
      if (typeof url !== 'string' || !url) {
        throw new Error('Branded card generation returned no URL')
      }
      setGeneratedPreview(url)
      appendUrls([url])
    } catch (generationError) {
      setLocalError(
        generationError instanceof Error
          ? generationError.message
          : 'Branded card generation failed'
      )
    } finally {
      setIsGeneratingCard(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={disabled || isUploading || mediaUrls.length >= MAX_MEDIA}
          onChange={(event) => handleFiles(event.target.files)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isUploading || mediaUrls.length >= MAX_MEDIA}
          className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading...' : 'Upload images'}
        </button>
        {headerImage && (
          <button
            type="button"
            onClick={() => appendUrls([headerImage])}
            disabled={
              disabled ||
              mediaUrls.includes(headerImage) ||
              mediaUrls.length >= MAX_MEDIA
            }
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Use blog header image
          </button>
        )}
      </div>

      <form onSubmit={handleUrlSubmit} className="flex gap-2">
        <input
          type="url"
          inputMode="url"
          value={urlInput}
          onChange={(event) => setUrlInput(event.target.value)}
          placeholder="https://example.com/image.jpg"
          disabled={disabled || mediaUrls.length >= MAX_MEDIA}
          className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
        />
        <button
          type="submit"
          disabled={disabled || !urlInput.trim() || mediaUrls.length >= MAX_MEDIA}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add URL
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <select
          aria-label="Branded card template"
          value={cardTemplate}
          onChange={(event) =>
            setCardTemplate(event.target.value as BrandedCardTemplate)
          }
          disabled={disabled || isGeneratingCard}
          className="min-w-[170px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
        >
          <option value="quote_card">Quote card</option>
          <option value="insight_card">Insight card</option>
          <option value="article_og">Article OG</option>
        </select>
        <button
          type="button"
          onClick={handleGenerateCard}
          disabled={
            disabled ||
            isGeneratingCard ||
            !postId ||
            mediaUrls.length >= MAX_MEDIA
          }
          className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800 hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGeneratingCard ? 'Generating...' : 'Generate branded card'}
        </button>
        {generatedPreview && (
          <div className="relative h-12 w-12 overflow-hidden rounded border border-gray-200 bg-gray-100">
            <Image
              src={generatedPreview}
              alt="Generated branded card preview"
              fill
              unoptimized
              sizes="48px"
              className="object-cover"
            />
          </div>
        )}
      </div>

      {mediaUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {mediaUrls.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
            >
              <Image
                src={url}
                alt={`Attached media ${index + 1}`}
                fill
                unoptimized
                sizes="(max-width: 640px) 50vw, 180px"
                className="object-cover"
              />
              <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
                {index + 1}
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onChange(mediaUrls.filter((_, itemIndex) => itemIndex !== index))}
                  aria-label={`Remove image ${index + 1}`}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-600"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap justify-between gap-2 text-xs text-gray-500">
        <span>
          {platform === 'instagram'
            ? 'Instagram requires at least 1 image. 1080x1080 or 1080x1350 recommended.'
            : 'JPEG, PNG, or WebP; up to 8MB each.'}
        </span>
        <span>{mediaUrls.length} / {MAX_MEDIA}</span>
      </div>
      {(error || localError) && (
        <p className="text-sm text-red-600">{error || localError}</p>
      )}
    </div>
  )
}

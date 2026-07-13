'use client'

import { useState } from 'react'

interface UnsplashImage {
  id: string
  url: string
  downloadUrl: string
  photographer: string
  photographerUrl: string
  description: string | null
  altDescription: string | null
}

interface UnsplashImagePickerProps {
  isOpen: boolean
  onClose: () => void
  onSelectImage: (imageUrl: string, altText: string) => void
}

export default function UnsplashImagePicker({
  isOpen,
  onClose,
  onSelectImage,
}: UnsplashImagePickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [images, setImages] = useState<UnsplashImage[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query')
      return
    }

    setIsSearching(true)
    setError('')

    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, count: 9 }),
      })

      if (!response.ok) {
        throw new Error('Failed to search images')
      }

      const result = await response.json()
      setImages(result.data || [])

      if (result.data.length === 0) {
        setError('No images found. Try a different search term.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search images')
    } finally {
      setIsSearching(false)
    }
  }

  const handleImageSelect = (image: UnsplashImage) => {
    const altText = image.altDescription || image.description || searchQuery
    onSelectImage(image.url, altText)
    onClose()
    // Reset state
    setSearchQuery('')
    setImages([])
    setError('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface-2 rounded-lg shadow-xl max-w-4xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-ink-0">Search Unsplash Images</h2>
          <button
            onClick={onClose}
            className="text-ink-3 hover:text-ink-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search for images... (e.g., technology, business, office)"
            className="flex-1 px-4 py-2 bg-surface-1 border border-stroke-1 text-ink-0 placeholder-ink-3 rounded-lg focus:ring-2 focus:ring-aqua/60 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-6 py-2 bg-aqua text-[#04110d] font-semibold rounded-lg hover:bg-aqua-bright disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/25 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* Image Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-aqua transition-all"
                onClick={() => handleImageSelect(image)}
              >
                <img
                  src={image.url}
                  alt={image.altDescription || image.description || 'Unsplash image'}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                  <button className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-aqua text-[#04110d] rounded-lg font-semibold">
                    Insert Image
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                  <p className="text-white text-xs">
                    Photo by{' '}
                    <a
                      href={image.photographerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {image.photographer}
                    </a>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isSearching && images.length === 0 && !error && (
          <div className="text-center py-12 text-ink-2">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-ink-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-lg">Search for professional images from Unsplash</p>
            <p className="text-sm mt-2">Enter a keyword above to get started</p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-stroke-0">
          <p className="text-sm text-ink-1">
            Images provided by{' '}
            <a
              href="https://unsplash.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-aqua hover:underline"
            >
              Unsplash
            </a>
            . Free tier: 50 requests/hour.
          </p>
        </div>
      </div>
    </div>
  )
}

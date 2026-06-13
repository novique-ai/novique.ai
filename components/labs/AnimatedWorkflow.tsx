'use client'

import { useState, useRef, useEffect } from 'react'
import DOMPurify from 'dompurify'

interface AnimatedWorkflowProps {
  svg: string
  height?: string
  className?: string
  showControls?: boolean
}

// Detect if content is an image URL rather than SVG content
function isImageUrl(content: string): boolean {
  if (!content) return false
  // Check if it's a URL (starts with http/https or is a relative path)
  if (content.startsWith('http://') || content.startsWith('https://')) {
    return true
  }
  // Check if it ends with an image extension
  if (/\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/i.test(content)) {
    return true
  }
  return false
}

export default function AnimatedWorkflow({
  svg,
  height = '25vh',
  className = '',
  showControls = false,
}: AnimatedWorkflowProps) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [key, setKey] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Determine if this is an image URL or SVG content
  const isImage = isImageUrl(svg)

  // Sanitize SVG on client side (only if it's SVG content)
  const sanitizedSvg = !isImage && typeof window !== 'undefined'
    ? DOMPurify.sanitize(svg, {
        USE_PROFILES: { svg: true, svgFilters: true },
        ADD_TAGS: ['animate', 'animateTransform', 'animateMotion'],
        ADD_ATTR: [
          'attributeName',
          'values',
          'dur',
          'repeatCount',
          'begin',
          'fill',
          'calcMode',
          'keyTimes',
          'keySplines',
        ],
      })
    : svg

  // Handle animation pause/play (only for SVG content)
  useEffect(() => {
    if (isImage) return
    if (!containerRef.current) return

    const svgElement = containerRef.current.querySelector('svg')
    if (!svgElement) return

    if (isPlaying) {
      svgElement.unpauseAnimations?.()
    } else {
      svgElement.pauseAnimations?.()
    }
  }, [isPlaying, isImage])

  const handleRestart = () => {
    setKey((prev) => prev + 1)
    setIsPlaying(true)
  }

  if (!svg) {
    return (
      <div
        className={`flex items-center justify-center bg-surface-2 rounded-lg ${className}`}
        style={{ height }}
      >
        <p className="text-ink-3">No workflow diagram available</p>
      </div>
    )
  }

  // Render image if it's a URL
  if (isImage) {
    return (
      <div className={`relative ${className}`}>
        <div
          className="nv-diagram w-full flex items-center justify-center bg-surface-2 rounded-lg overflow-hidden"
          style={{ height, minHeight: '200px' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={svg}
            alt="Workflow diagram"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </div>
    )
  }

  // Render SVG content
  return (
    <div className={`relative ${className}`}>
      <div
        key={key}
        ref={containerRef}
        className="nv-diagram w-full flex items-center justify-center bg-surface-2 rounded-lg overflow-hidden"
        style={{ height, minHeight: '200px' }}
        dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
      />

      {showControls && (
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-1.5 text-sm bg-surface-3/90 text-ink-1 hover:bg-surface-3 hover:text-ink-0 rounded-md shadow-sm border border-stroke-1 transition-colors"
            aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
          >
            {isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button
            onClick={handleRestart}
            className="px-3 py-1.5 text-sm bg-surface-3/90 text-ink-1 hover:bg-surface-3 hover:text-ink-0 rounded-md shadow-sm border border-stroke-1 transition-colors"
            aria-label="Restart animation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

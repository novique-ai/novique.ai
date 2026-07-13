'use client'

import { useState } from 'react'

interface SocialMetadataSectionProps {
  keyInsights: string[]
  coreTakeaway: string
  onKeyInsightsChange: (insights: string[]) => void
  onCoreTakeawayChange: (takeaway: string) => void
  blogTitle: string
  blogContent: string
  blogSummary: string
  postId?: string
}

export default function SocialMetadataSection({
  keyInsights,
  coreTakeaway,
  onKeyInsightsChange,
  onCoreTakeawayChange,
  blogTitle,
  blogContent,
  blogSummary,
  postId,
}: SocialMetadataSectionProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExpanded, setIsExpanded] = useState(
    keyInsights.length > 0 || coreTakeaway.length > 0
  )

  // Ensure we always have 3 insight slots
  const insights = [...keyInsights]
  while (insights.length < 3) {
    insights.push('')
  }

  const handleInsightChange = (index: number, value: string) => {
    const newInsights = [...insights]
    newInsights[index] = value
    // Filter out empty strings when saving
    onKeyInsightsChange(newInsights.filter((i) => i.trim() !== ''))
  }

  const handleGenerateWithAI = async () => {
    if (!blogTitle || !blogSummary) {
      alert('Please add a title and summary before generating social metadata')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/social/generate-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: blogTitle,
          content: blogContent,
          summary: blogSummary,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate metadata')
      }

      const data = await response.json()

      if (data.keyInsights) {
        onKeyInsightsChange(data.keyInsights)
      }
      if (data.coreTakeaway) {
        onCoreTakeawayChange(data.coreTakeaway)
      }

      setIsExpanded(true)
    } catch (error) {
      console.error('Generation error:', error)
      alert('Failed to generate social metadata. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="border border-stroke-0 rounded-lg overflow-hidden">
      {/* Header - Always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-surface-1 flex items-center justify-between text-left hover:bg-surface-3/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-aqua"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          <span className="font-medium text-ink-0">Social Media Metadata</span>
          {(keyInsights.length > 0 || coreTakeaway) && (
            <span className="text-xs bg-green-500/10 text-green-300 ring-1 ring-inset ring-green-500/25 px-2 py-0.5 rounded-full">
              Configured
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-ink-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-surface-2">
          <p className="text-sm text-ink-1">
            This metadata is used to generate platform-specific social media posts when you publish.
            It helps create better LinkedIn, X, and Instagram content.
          </p>

          {/* AI Generate Button */}
          <button
            type="button"
            onClick={handleGenerateWithAI}
            disabled={isGenerating || !blogTitle || !blogSummary}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Generate with AI
              </>
            )}
          </button>

          {/* Key Insights */}
          <div>
            <label className="block text-sm font-medium text-ink-1 mb-2">
              Key Insights (3 bullet points for LinkedIn)
            </label>
            <div className="space-y-2">
              {[0, 1, 2].map((index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-ink-3 mt-2">•</span>
                  <input
                    type="text"
                    value={insights[index] || ''}
                    onChange={(e) => handleInsightChange(index, e.target.value)}
                    maxLength={100}
                    className="flex-1 px-3 py-2 bg-surface-1 border border-stroke-1 text-ink-0 placeholder-ink-3 rounded-lg focus:ring-2 focus:ring-aqua/60 focus:border-transparent text-sm"
                    placeholder={`Key insight ${index + 1}...`}
                  />
                  <span className="text-xs text-ink-3 mt-2 w-12">
                    {(insights[index] || '').length}/100
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-ink-2">
              These will be used as bullet points in LinkedIn posts
            </p>
          </div>

          {/* Core Takeaway */}
          <div>
            <label
              htmlFor="coreTakeaway"
              className="block text-sm font-medium text-ink-1 mb-2"
            >
              Core Takeaway (sharp summary for X/Twitter)
              <span className="text-ink-2 font-normal ml-2">
                ({coreTakeaway.length}/150)
              </span>
            </label>
            <textarea
              id="coreTakeaway"
              value={coreTakeaway}
              onChange={(e) => onCoreTakeawayChange(e.target.value)}
              rows={2}
              maxLength={150}
              className="w-full px-3 py-2 bg-surface-1 border border-stroke-1 text-ink-0 placeholder-ink-3 rounded-lg focus:ring-2 focus:ring-aqua/60 focus:border-transparent text-sm"
              placeholder="A single sharp, opinionated sentence that captures the essence..."
            />
            <p className="mt-1 text-xs text-ink-2">
              This will be used as the hook for X/Twitter posts
            </p>
          </div>

          {/* Preview Section */}
          {(keyInsights.length > 0 || coreTakeaway) && (
            <div className="mt-4 p-3 bg-surface-1 rounded-lg">
              <h4 className="text-sm font-medium text-ink-1 mb-2">Preview</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* LinkedIn Preview */}
                <div className="p-2 bg-surface-2 rounded border border-stroke-0">
                  <div className="flex items-center gap-1 text-xs text-aqua mb-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                    LinkedIn
                  </div>
                  <p className="text-xs text-ink-1 line-clamp-4">
                    {keyInsights.length > 0
                      ? `In this post:\n• ${keyInsights.join('\n• ')}`
                      : 'Add key insights to preview'}
                  </p>
                </div>

                {/* X Preview */}
                <div className="p-2 bg-surface-2 rounded border border-stroke-0">
                  <div className="flex items-center gap-1 text-xs text-ink-0 mb-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    X (Twitter)
                  </div>
                  <p className="text-xs text-ink-1 line-clamp-3">
                    {coreTakeaway || 'Add core takeaway to preview'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

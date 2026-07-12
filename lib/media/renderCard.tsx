import { ImageResponse } from 'next/og'
import React from 'react'
import type {
  BrandedCardData,
  BrandedCardSize,
  BrandedCardTemplate,
} from '@/lib/social/types'
import { uploadSocialMedia } from '@/lib/storage/socialMediaUpload'

export const CARD_SIZES: Record<BrandedCardTemplate, BrandedCardSize> = {
  quote_card: { width: 1080, height: 1080 },
  insight_card: { width: 1080, height: 1350 },
  article_og: { width: 1200, height: 630 },
}

const COLORS = {
  background: '#070a0c',
  surface: '#11171b',
  ink: '#f4f8f9',
  muted: '#8e9ca1',
  stroke: '#26323a',
  accent: '#2be8c2',
  accentBright: '#5ff3d6',
  accentDeep: '#0e8c7c',
}

const FONT_FAMILY = 'Inter, Arial, sans-serif'

function clampText(value: string | undefined, maxLength: number): string {
  const normalized = value?.replace(/\s+/g, ' ').trim() || ''
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`
}

function Mark() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        color: COLORS.ink,
        fontSize: 27,
        fontWeight: 700,
        letterSpacing: '-0.03em',
      }}
    >
      <div
        style={{
          display: 'flex',
          width: 18,
          height: 18,
          borderRadius: 99,
          background: COLORS.accent,
          boxShadow: `0 0 28px ${COLORS.accentDeep}`,
        }}
      />
      novique.ai
    </div>
  )
}

function Frame({
  children,
  size,
}: {
  children: React.ReactNode
  size: BrandedCardSize
}) {
  const padding = size.height <= 700 ? 64 : 82

  return (
    <div
      style={{
        display: 'flex',
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        padding,
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: COLORS.ink,
        background: COLORS.background,
        fontFamily: FONT_FAMILY,
      }}
    >
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          width: 480,
          height: 480,
          right: -190,
          top: -210,
          borderRadius: 999,
          background: `radial-gradient(circle, ${COLORS.accentDeep} 0%, ${COLORS.background} 68%)`,
          opacity: 0.6,
        }}
      />
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          width: 2,
          height: '70%',
          left: 42,
          top: '15%',
          background: `linear-gradient(180deg, transparent, ${COLORS.accent}, transparent)`,
        }}
      />
      {children}
    </div>
  )
}

export function QuoteCard({
  data,
  size = CARD_SIZES.quote_card,
}: {
  data: BrandedCardData
  size?: BrandedCardSize
}) {
  const quote = clampText(data.quote || data.subtitle || data.title, 240)
  const fontSize = quote.length > 170 ? 54 : quote.length > 105 ? 64 : 76

  return (
    <Frame size={size}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div
          style={{
            display: 'flex',
            color: COLORS.accentBright,
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          A practical AI insight
        </div>
        <div
          style={{
            display: 'flex',
            width: 52,
            height: 52,
            border: `1px solid ${COLORS.stroke}`,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.accent,
            fontSize: 40,
          }}
        >
          “
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
        <div
          style={{
            display: 'flex',
            maxWidth: 900,
            fontSize,
            fontWeight: 650,
            lineHeight: 1.08,
            letterSpacing: '-0.045em',
          }}
        >
          {quote}
        </div>
        <div
          style={{
            display: 'flex',
            color: COLORS.muted,
            fontSize: 26,
            fontWeight: 500,
          }}
        >
          — {clampText(data.attribution, 70) || 'Novique.AI'}
        </div>
      </div>

      <Mark />
    </Frame>
  )
}

export function InsightCard({
  data,
  size = CARD_SIZES.insight_card,
}: {
  data: BrandedCardData
  size?: BrandedCardSize
}) {
  const insights = (data.insights || []).slice(0, 3)

  return (
    <Frame size={size}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
        <div
          style={{
            display: 'flex',
            color: COLORS.accentBright,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          Field notes
        </div>
        <div
          style={{
            display: 'flex',
            maxWidth: 900,
            fontSize: 62,
            fontWeight: 680,
            lineHeight: 1.06,
            letterSpacing: '-0.045em',
          }}
        >
          {clampText(data.title, 130)}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 25,
          width: '100%',
        }}
      >
        {(insights.length > 0 ? insights : [data.subtitle || data.title]).map(
          (insight, index) => (
            <div
              key={`${index}-${insight}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 25,
                padding: '24px 28px',
                border: `1px solid ${COLORS.stroke}`,
                borderRadius: 20,
                background: COLORS.surface,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexShrink: 0,
                  width: 42,
                  height: 42,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 99,
                  background: COLORS.accent,
                  color: COLORS.background,
                  fontSize: 20,
                  fontWeight: 800,
                }}
              >
                {index + 1}
              </div>
              <div
                style={{
                  display: 'flex',
                  color: COLORS.ink,
                  fontSize: 30,
                  lineHeight: 1.28,
                }}
              >
                {clampText(insight, 125)}
              </div>
            </div>
          )
        )}
      </div>

      <Mark />
    </Frame>
  )
}

export function ArticleOgCard({
  data,
  size = CARD_SIZES.article_og,
}: {
  data: BrandedCardData
  size?: BrandedCardSize
}) {
  const title = clampText(data.title, 125)
  const fontSize = title.length > 88 ? 52 : title.length > 55 ? 60 : 70

  return (
    <Frame size={size}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Mark />
        <div
          style={{
            display: 'flex',
            color: COLORS.accentBright,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          Applied intelligence
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div
          style={{
            display: 'flex',
            maxWidth: 1000,
            fontSize,
            fontWeight: 680,
            lineHeight: 1.04,
            letterSpacing: '-0.045em',
          }}
        >
          {title}
        </div>
        {data.subtitle && (
          <div
            style={{
              display: 'flex',
              maxWidth: 920,
              color: COLORS.muted,
              fontSize: 26,
              lineHeight: 1.35,
            }}
          >
            {clampText(data.subtitle, 180)}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          width: 170,
          height: 5,
          borderRadius: 99,
          background: `linear-gradient(90deg, ${COLORS.accentBright}, ${COLORS.accentDeep})`,
        }}
      />
    </Frame>
  )
}

function renderTemplate(
  template: BrandedCardTemplate,
  data: BrandedCardData,
  size: BrandedCardSize
) {
  switch (template) {
    case 'quote_card':
      return <QuoteCard data={data} size={size} />
    case 'insight_card':
      return <InsightCard data={data} size={size} />
    case 'article_og':
      return <ArticleOgCard data={data} size={size} />
  }
}

export async function renderCardToBuffer(
  template: BrandedCardTemplate,
  data: BrandedCardData,
  size: BrandedCardSize = CARD_SIZES[template]
): Promise<Buffer> {
  if (!data.title?.trim()) throw new Error('Card title is required')
  if (size.width < 1 || size.height < 1) throw new Error('Invalid card size')

  const response = new ImageResponse(renderTemplate(template, data, size), {
    width: size.width,
    height: size.height,
  })
  return Buffer.from(await response.arrayBuffer())
}

export async function renderAndStoreCard(
  template: BrandedCardTemplate,
  data: BrandedCardData,
  size: BrandedCardSize = CARD_SIZES[template]
): Promise<string> {
  const buffer = await renderCardToBuffer(template, data, size)
  const file = new File([new Uint8Array(buffer)], `${template}.png`, {
    type: 'image/png',
  })
  const upload = await uploadSocialMedia(file)
  return size.width <= 1080 ? upload.instagram.url : upload.full.url
}

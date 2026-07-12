import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import {
  CARD_SIZES,
  renderAndStoreCard,
  renderCardToBuffer,
} from '@/lib/media/renderCard'
import type {
  BrandedCardData,
  BrandedCardTemplate,
} from '@/lib/social/types'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const TEMPLATES = new Set<BrandedCardTemplate>([
  'quote_card',
  'insight_card',
  'article_og',
])

function parseTemplate(value: unknown): BrandedCardTemplate | null {
  return typeof value === 'string' &&
    TEMPLATES.has(value as BrandedCardTemplate)
    ? (value as BrandedCardTemplate)
    : null
}

async function requireAdminResponse(): Promise<NextResponse | null> {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

function stringField(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function stringArrayField(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const items = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3)
  return items.length > 0 ? items : undefined
}

function parseFields(value: unknown): Partial<BrandedCardData> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const fields = value as Record<string, unknown>
  return {
    title: stringField(fields.title),
    subtitle: stringField(fields.subtitle),
    quote: stringField(fields.quote),
    attribution: stringField(fields.attribution),
    insights: stringArrayField(fields.insights),
  }
}

async function hydratePostFields(
  postId: string
): Promise<Partial<BrandedCardData> | null> {
  const supabase = createAdminClient()
  const { data: post, error } = await supabase
    .from('social_posts')
    .select('source_title, content, source_type, source_id')
    .eq('id', postId)
    .single()

  if (error || !post) return null

  const hydrated: Partial<BrandedCardData> = {
    title: post.source_title || 'Novique.AI insight',
    quote: post.content || undefined,
    attribution: 'Novique.AI',
  }

  if (post.source_type === 'blog' && post.source_id) {
    const { data: blog } = await supabase
      .from('blog_posts')
      .select('title, summary, key_insights, core_takeaway')
      .eq('id', post.source_id)
      .single()

    if (blog) {
      hydrated.title = blog.title || hydrated.title
      hydrated.subtitle = blog.summary || undefined
      hydrated.quote = blog.core_takeaway || hydrated.quote
      hydrated.insights = blog.key_insights || undefined
    }
  }

  return hydrated
}

export async function GET(request: NextRequest) {
  try {
    const denied = await requireAdminResponse()
    if (denied) return denied

    const params = request.nextUrl.searchParams
    const template = parseTemplate(params.get('template')) || 'quote_card'
    const repeatedInsights = params.getAll('insight').filter(Boolean)
    const packedInsights = params.get('insights')
      ?.split('|')
      .map((item) => item.trim())
      .filter(Boolean)
    const title = params.get('title')?.trim() || 'Put practical AI to work'
    const data: BrandedCardData = {
      title,
      subtitle: params.get('subtitle') || undefined,
      quote: params.get('quote') || undefined,
      attribution: params.get('attribution') || undefined,
      insights:
        repeatedInsights.length > 0 ? repeatedInsights : packedInsights,
    }
    const buffer = await renderCardToBuffer(template, data)

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="${template}.png"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Branded card preview failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Card render failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireAdminResponse()
    if (denied) return denied

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const payload = body as Record<string, unknown>
    const template = parseTemplate(payload.template)
    if (!template) {
      return NextResponse.json(
        { error: 'template must be quote_card, insight_card, or article_og' },
        { status: 400 }
      )
    }

    const postId = stringField(payload.postId)
    const postFields = postId ? await hydratePostFields(postId) : undefined
    if (postId && !postFields) {
      return NextResponse.json({ error: 'Social post not found' }, { status: 404 })
    }
    const explicitFields = parseFields(payload.fields)
    const data = { ...postFields, ...explicitFields } as BrandedCardData
    if (!data.title) {
      return NextResponse.json(
        { error: 'A postId or fields.title is required' },
        { status: 400 }
      )
    }

    const url = await renderAndStoreCard(template, data)
    return NextResponse.json({
      success: true,
      data: { url, template, size: CARD_SIZES[template] },
    })
  } catch (error) {
    console.error('Branded card generation failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Card generation failed' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { generateLab, regenerateLabSvg } from '@/lib/ai/labGenerator'
import { generateCustomWorkflowSvg, sanitizeSvg } from '@/lib/ai/svgGenerator'

// Increase timeout for lab generation (requires Vercel Pro for >10s)
export const maxDuration = 60

/**
 * POST /api/labs/generate
 * Generate lab content from GitHub repository
 */
export async function POST(request: NextRequest) {
  console.log('[Lab Generate] API route called')

  try {
    // Check required environment variables
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('[Lab Generate] Missing OPENROUTER_API_KEY')
      return NextResponse.json(
        { error: 'Server configuration error: Missing AI API key' },
        { status: 500 }
      )
    }

    // Check authentication
    const user = await getCurrentUser()
    console.log('[Lab Generate] User:', user?.email || 'not authenticated')

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check role (admin or editor)
    if (user.role !== 'admin' && user.role !== 'editor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body
    try {
      body = await request.json()
      console.log('[Lab Generate] Request body:', JSON.stringify(body).substring(0, 200))
    } catch (parseError) {
      console.error('[Lab Generate] Failed to parse request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Check if this is a custom workflow SVG request
    if (body.customNodes && Array.isArray(body.customNodes)) {
      const svg = generateCustomWorkflowSvg(body.customNodes, body.title || 'Infrastructure Workflow')
      return NextResponse.json({
        success: true,
        svg: sanitizeSvg(svg),
      })
    }

    // Validate GitHub URL for other operations
    if (!body.githubUrl) {
      return NextResponse.json(
        { error: 'GitHub URL is required' },
        { status: 400 }
      )
    }

    // Validate URL format
    if (!body.githubUrl.includes('github.com')) {
      return NextResponse.json(
        { error: 'Invalid GitHub URL' },
        { status: 400 }
      )
    }

    // Check if this is a regenerate SVG request
    if (body.regenerateSvgOnly) {
      const svg = await regenerateLabSvg(body.githubUrl)
      if (!svg) {
        return NextResponse.json(
          { error: 'Failed to regenerate SVG' },
          { status: 500 }
        )
      }
      return NextResponse.json({
        success: true,
        svg,
      })
    }

    // Generate full lab
    console.log('[Lab Generate] Starting lab generation for:', body.githubUrl)
    const result = await generateLab(
      {
        githubUrl: body.githubUrl,
        generateSvg: body.generateSvg !== false,
      },
      user.id
    )
    console.log('[Lab Generate] Generation result:', result.success ? 'success' : 'failed')

    if (!result.success) {
      console.error('[Lab Generate] Generation failed:', result.error)
      return NextResponse.json(
        { error: result.error || 'Lab generation failed' },
        { status: 500 }
      )
    }

    console.log('[Lab Generate] Lab created with slug:', result.slug)
    return NextResponse.json({
      success: true,
      labId: result.labId,
      slug: result.slug,
      generationData: result.generationData,
    })
  } catch (error) {
    console.error('[Lab Generate] Unhandled error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate lab' },
      { status: 500 }
    )
  }
}

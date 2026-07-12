import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { executePublish } from '@/lib/social/publishExecutor'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/social/posts/[id]/publish
 * Publish a social post through the idempotent executor.
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403 })
    }

    const { id } = await params
    const result = await executePublish(id, { manual: true })

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          retryable: result.retryable,
          details: result.details,
        },
        { status: result.statusCode }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      platformUrl: result.platformUrl,
    })
  } catch (error) {
    console.error(
      'Social post publish error:',
      error instanceof Error ? error.name : 'UnknownError'
    )
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to publish post' },
      { status: 500 }
    )
  }
}

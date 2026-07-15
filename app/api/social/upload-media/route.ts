import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import {
  deleteSocialMedia,
  uploadSocialMedia,
  validateSocialMediaFile,
} from '@/lib/storage/socialMediaUpload'
import type { SocialMediaUploadResult } from '@/lib/social/types'

const MAX_ATTACHMENTS = 10

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin' && user.role !== 'editor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const entries = [...formData.getAll('files'), ...formData.getAll('file')]
    const files = entries.filter((entry): entry is File => entry instanceof File)

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (files.length > MAX_ATTACHMENTS) {
      return NextResponse.json(
        { error: `A maximum of ${MAX_ATTACHMENTS} images can be uploaded at once` },
        { status: 400 }
      )
    }

    try {
      files.forEach(validateSocialMediaFile)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid file' },
        { status: 400 }
      )
    }

    const uploaded: SocialMediaUploadResult[] = []
    try {
      for (const file of files) {
        uploaded.push(await uploadSocialMedia(file))
      }
    } catch (error) {
      await Promise.allSettled(
        uploaded.map((item) => deleteSocialMedia(item.fileName))
      )
      throw error
    }

    return NextResponse.json({
      success: true,
      data: uploaded,
      urls: uploaded.map((item) => item.instagram.url),
    })
  } catch (error) {
    console.error('Social media upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

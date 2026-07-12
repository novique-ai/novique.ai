import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'
import type {
  SocialMediaUploadResult,
  SocialMediaUploadVariant,
} from '@/lib/social/types'

const BUCKET_NAME = 'social-media'
const UPLOAD_PREFIX = 'uploads'
const MAX_FILE_SIZE = 8 * 1024 * 1024
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

const OUTPUT_FORMATS: Record<
  AllowedMimeType,
  { extension: 'jpg' | 'png' | 'webp'; contentType: AllowedMimeType }
> = {
  'image/jpeg': { extension: 'jpg', contentType: 'image/jpeg' },
  'image/png': { extension: 'png', contentType: 'image/png' },
  'image/webp': { extension: 'webp', contentType: 'image/webp' },
}

export function validateSocialMediaFile(file: File): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 8MB limit')
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.')
  }
}

async function encodeImage(buffer: Buffer, contentType: AllowedMimeType) {
  const image = sharp(buffer).rotate()

  if (contentType === 'image/png') {
    return image.png({ compressionLevel: 9 }).toBuffer()
  }

  if (contentType === 'image/webp') {
    return image.webp({ quality: 88 }).toBuffer()
  }

  return image.jpeg({ quality: 88, progressive: true }).toBuffer()
}

async function processVariant(
  buffer: Buffer,
  contentType: AllowedMimeType,
  maxWidth?: number
): Promise<{ buffer: Buffer; width: number | null; height: number | null }> {
  const resized = maxWidth
    ? await sharp(buffer)
        .rotate()
        .resize(maxWidth, null, { fit: 'inside', withoutEnlargement: true })
        .toBuffer()
    : buffer
  const encoded = await encodeImage(resized, contentType)
  const metadata = await sharp(encoded).metadata()

  return {
    buffer: encoded,
    width: metadata.width ?? null,
    height: metadata.height ?? null,
  }
}

/**
 * Upload full-size and Instagram-ready (max 1080px wide) variants.
 *
 * The `social-media` Supabase bucket must be public: Instagram fetches images
 * from these URLs during container creation and cannot ingest signed/private URLs.
 */
export async function uploadSocialMedia(
  file: File
): Promise<SocialMediaUploadResult> {
  validateSocialMediaFile(file)

  const contentType = file.type as AllowedMimeType
  const { extension } = OUTPUT_FORMATS[contentType]
  const fileName = `social-${randomUUID()}.${extension}`
  const baseName = fileName.slice(0, -(extension.length + 1))
  const source = Buffer.from(await file.arrayBuffer())
  const [full, instagram] = await Promise.all([
    processVariant(source, contentType),
    processVariant(source, contentType, 1080),
  ])
  const supabase = await createClient()

  const variants = [
    { name: fileName, data: full },
    { name: `${baseName}-1080.${extension}`, data: instagram },
  ]

  const uploadedPaths: string[] = []
  try {
    for (const variant of variants) {
      const path = `${UPLOAD_PREFIX}/${variant.name}`
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, variant.data.buffer, {
          contentType,
          upsert: false,
        })

      if (error) throw new Error(`Upload failed: ${error.message}`)
      uploadedPaths.push(path)
    }
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(BUCKET_NAME).remove(uploadedPaths)
    }
    throw error
  }

  const publicVariant = (
    path: string,
    dimensions: { width: number | null; height: number | null }
  ): SocialMediaUploadVariant => ({
    url: supabase.storage.from(BUCKET_NAME).getPublicUrl(path).data.publicUrl,
    width: dimensions.width,
    height: dimensions.height,
  })

  return {
    fileName,
    contentType,
    full: publicVariant(uploadedPaths[0], full),
    instagram: publicVariant(uploadedPaths[1], instagram),
  }
}

export async function deleteSocialMedia(fileName: string): Promise<void> {
  const match = /^social-[0-9a-f-]+\.(jpg|png|webp)$/i.exec(fileName)
  if (!match) throw new Error('Invalid social media file name')

  const extension = match[1].toLowerCase()
  const baseName = fileName.slice(0, -(extension.length + 1))
  const paths = [
    `${UPLOAD_PREFIX}/${fileName}`,
    `${UPLOAD_PREFIX}/${baseName}-1080.${extension}`,
  ]
  const supabase = await createClient()
  const { error } = await supabase.storage.from(BUCKET_NAME).remove(paths)

  if (error) throw new Error(`Delete failed: ${error.message}`)
}

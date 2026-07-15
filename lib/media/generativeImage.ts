import OpenAI from 'openai'
import { uploadSocialMedia } from '@/lib/storage/socialMediaUpload'

export interface GenerativeImageBrief {
  prompt: string
  size?: '1024x1024' | '1024x1536' | '1536x1024'
}

export interface GeneratedImage {
  url: string
}

export interface GenerativeImageProvider {
  generateImage(brief: GenerativeImageBrief): Promise<GeneratedImage>
}

export class NotConfiguredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotConfiguredError'
  }
}

async function imageResultToBuffer(result: {
  b64_json?: string | null
  url?: string | null
}): Promise<Buffer> {
  if (result.b64_json) return Buffer.from(result.b64_json, 'base64')
  if (result.url) {
    const response = await fetch(result.url)
    if (!response.ok) throw new Error('OpenAI image download failed')
    return Buffer.from(await response.arrayBuffer())
  }
  throw new Error('OpenAI returned no image data')
}

export class OpenAIImageProvider implements GenerativeImageProvider {
  async generateImage(brief: GenerativeImageBrief): Promise<GeneratedImage> {
    if (process.env.GENERATIVE_IMAGE_ENABLED !== '1') {
      throw new NotConfiguredError(
        'Generative images are disabled. Set GENERATIVE_IMAGE_ENABLED=1 to enable deliberate generation.'
      )
    }
    if (!process.env.OPENAI_API_KEY) {
      throw new NotConfiguredError(
        'OPENAI_API_KEY is required when generative images are enabled.'
      )
    }
    if (!brief.prompt.trim()) throw new Error('Image brief prompt is required')

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: brief.prompt,
      size: brief.size || '1024x1024',
    })
    const result = response.data?.[0]
    if (!result) throw new Error('OpenAI returned no generated image')

    const buffer = await imageResultToBuffer(result)
    const file = new File([new Uint8Array(buffer)], 'generated-image.png', {
      type: 'image/png',
    })
    const upload = await uploadSocialMedia(file)
    return { url: upload.full.url }
  }
}

export async function generateImage(
  brief: GenerativeImageBrief
): Promise<GeneratedImage> {
  return new OpenAIImageProvider().generateImage(brief)
}

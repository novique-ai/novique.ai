/**
 * OpenRouter text generation for the Novique site.
 * Open-weight models only (Novique workspace guardrail). No direct Anthropic.
 */
import OpenAI from 'openai'
import { z } from 'zod'

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

/** Haiku-class utility model (OpenRouter open-weight). */
export const LLM_UTILITY_MODEL =
  process.env.LLM_UTILITY_MODEL?.trim() || 'qwen/qwen3-32b'

/** Sonnet-class writer model (OpenRouter open-weight). */
export const LLM_WRITER_MODEL =
  process.env.LLM_WRITER_MODEL?.trim() || 'deepseek/deepseek-v3.2'

function getOpenRouterClient() {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is required')
  }
  return new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: {
      'HTTP-Referer':
        process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.novique.ai',
      'X-Title': 'Novique.ai',
    },
  })
}

export interface LLMGenerationOptions {
  prompt: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  model?: string
}

/**
 * Generate text via OpenRouter (open-weight models).
 */
export async function generateWithLLM({
  prompt,
  systemPrompt = 'You are a helpful AI assistant that writes professional blog content about technology and business.',
  maxTokens = 4096,
  temperature = 0.7,
  model = LLM_UTILITY_MODEL,
}: LLMGenerationOptions): Promise<string> {
  try {
    const client = getOpenRouterClient()
    const response = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    })

    const content = response.choices[0]?.message?.content?.trim()
    if (!content) {
      throw new Error('Unexpected empty response from OpenRouter')
    }
    return content
  } catch (error) {
    console.error('OpenRouter LLM error:', error)
    throw new Error(
      `Failed to generate content with LLM: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/** @deprecated Use generateWithLLM — kept for gradual import migration. */
export const generateWithClaude = generateWithLLM

/**
 * Generate blog post outline
 */
export async function generateBlogOutline(
  topic: string,
  keywords: string[]
): Promise<string> {
  const prompt = `Generate a detailed blog post outline for the following topic:

Topic: ${topic}
Keywords to include: ${keywords.join(', ')}

Requirements:
- Create 5-7 main sections
- Include subsections for complex topics
- Focus on practical, actionable insights
- Target audience: small business owners and IT professionals
- Tone: professional but accessible

Format the outline in markdown with headings (##) and bullet points.`

  return generateWithLLM({
    prompt,
    systemPrompt:
      'You are an expert content strategist who creates engaging, well-structured blog post outlines for business and technology topics.',
    maxTokens: 2048,
    temperature: 0.8,
    model: LLM_UTILITY_MODEL,
  })
}

/**
 * Generate full blog post content from outline
 */
export async function generateBlogContent(
  topic: string,
  outline: string,
  researchData: string
): Promise<string> {
  const prompt = `Write a comprehensive blog post based on this outline and research:

Topic: ${topic}

Outline:
${outline}

Research Data:
${researchData}

Requirements:
- Write 1000-1500 words
- Use clear, professional language
- Include practical examples and insights
- Target audience: small business owners and IT professionals
- Use markdown formatting (headings, lists, bold, italic)
- Include an engaging introduction and conclusion
- Focus on actionable takeaways

Write the full blog post content in markdown format.`

  return generateWithLLM({
    prompt,
    systemPrompt:
      'You are an expert technology writer who creates engaging, informative blog content for business professionals.',
    maxTokens: 4096,
    temperature: 0.7,
    model: LLM_WRITER_MODEL,
  })
}

const seoSchema = z.object({
  title: z.string(),
  metaDescription: z.string(),
  tags: z.array(z.string()),
})

/**
 * Generate SEO metadata (title, meta description, tags)
 */
export async function generateSEOMetadata(content: string): Promise<{
  title: string
  metaDescription: string
  tags: string[]
}> {
  const prompt = `Based on this blog post content, generate SEO-optimized metadata:

${content.substring(0, 2000)}...

Generate:
1. A compelling, SEO-friendly title (50-60 characters)
2. A meta description (150-160 characters)
3. 5-7 relevant tags/keywords

Format your response as JSON:
{
  "title": "...",
  "metaDescription": "...",
  "tags": ["tag1", "tag2", ...]
}`

  const response = await generateWithLLM({
    prompt,
    systemPrompt:
      'You are an SEO expert who creates optimized metadata for blog posts. Always respond with valid JSON only.',
    maxTokens: 512,
    temperature: 0.5,
    model: LLM_UTILITY_MODEL,
  })

  try {
    const trimmed = response.trim()
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
    return seoSchema.parse(JSON.parse(jsonMatch?.[0] ?? trimmed))
  } catch (error) {
    console.error('Failed to parse SEO metadata:', error)
    throw new Error('Invalid JSON response from LLM')
  }
}

/**
 * Generate blog post summary
 */
export async function generateSummary(content: string): Promise<string> {
  const prompt = `Write a compelling 2-3 sentence summary of this blog post (max 300 characters):

${content.substring(0, 2000)}...

The summary should:
- Be engaging and informative
- Highlight the main value proposition
- Encourage readers to read more
- Be under 300 characters`

  return generateWithLLM({
    prompt,
    systemPrompt:
      'You are an expert copywriter who creates compelling, concise summaries.',
    maxTokens: 256,
    temperature: 0.7,
    model: LLM_UTILITY_MODEL,
  })
}

export default getOpenRouterClient

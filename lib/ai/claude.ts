import Anthropic from '@anthropic-ai/sdk'

function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required')
  }
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })
}

export interface ClaudeGenerationOptions {
  prompt: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  model?: string
}

/**
 * Generate text using Claude API
 */
export async function generateWithClaude({
  prompt,
  systemPrompt = 'You are a helpful AI assistant that writes professional blog content about technology and business.',
  maxTokens = 4096,
  temperature = 0.7,
  model = 'claude-haiku-4-5',
}: ClaudeGenerationOptions): Promise<string> {
  try {
    const anthropic = getAnthropicClient()
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type === 'text') {
      return content.text
    }

    throw new Error('Unexpected response format from Claude API')
  } catch (error) {
    console.error('Claude API error:', error)
    throw new Error(`Failed to generate content with Claude: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate blog post outline
 */
export async function generateBlogOutline(topic: string, keywords: string[]): Promise<string> {
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

  return generateWithClaude({
    prompt,
    systemPrompt: 'You are an expert content strategist who creates engaging, well-structured blog post outlines for business and technology topics.',
    maxTokens: 2048,
    temperature: 0.8,
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

  return generateWithClaude({
    prompt,
    systemPrompt: 'You are an expert technology writer who creates engaging, informative blog content for business professionals.',
    maxTokens: 4096,
    temperature: 0.7,
  })
}

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

  const response = await generateWithClaude({
    prompt,
    systemPrompt: 'You are an SEO expert who creates optimized metadata for blog posts. Always respond with valid JSON.',
    maxTokens: 512,
    temperature: 0.5,
  })

  try {
    return JSON.parse(response)
  } catch (error) {
    console.error('Failed to parse SEO metadata:', error)
    throw new Error('Invalid JSON response from Claude API')
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

  return generateWithClaude({
    prompt,
    systemPrompt: 'You are an expert copywriter who creates compelling, concise summaries.',
    maxTokens: 256,
    temperature: 0.7,
  })
}

export default getAnthropicClient

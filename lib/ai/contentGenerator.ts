import { generateBlogOutline, generateBlogContent, generateSEOMetadata, generateSummary } from './llm'
import { generateBlogOutline as generateOutlineOpenAI, generateBlogContent as generateContentOpenAI } from './openai'
import { researchTopic, ResearchData } from './research'
import { getBlogHeaderImage, generateImageAltText } from './imageGeneration'
import { marked } from 'marked'
import slugify from 'slugify'
import { createClient } from '@/lib/supabase/server'

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true,
})

export interface BlogGenerationInput {
  topic?: string
  keywords?: string[]
  useOpenAI?: boolean // Fallback to OpenAI if true
}

export interface BlogGenerationResult {
  success: boolean
  postId?: string
  slug?: string
  error?: string
  generationData?: {
    topic: string
    research: ResearchData
    outline: string
    content: string
    metadata: {
      title: string
      summary: string
      metaDescription: string
      tags: string[]
    }
    headerImage: {
      url: string
      alt: string
      attribution: string
    }
  }
}

/**
 * Main AI blog post generation workflow
 */
export async function generateBlogPost(
  input: BlogGenerationInput,
  authorId: string
): Promise<BlogGenerationResult> {
  console.log('Starting blog post generation...')

  try {
    // Step 1: Determine topic (auto-generate if not provided)
    let topic = input.topic
    if (!topic) {
      topic = await generateTopic(input.keywords || [])
    }

    console.log(`Topic: ${topic}`)

    // Step 2: Research the topic
    console.log('Step 1/6: Researching topic...')
    const research = await researchTopic(topic, input.keywords)

    // Step 3: Generate outline
    console.log('Step 2/6: Generating outline...')
    const outline = input.useOpenAI
      ? await generateOutlineOpenAI(topic, research.keywords)
      : await generateBlogOutline(topic, research.keywords)

    // Step 4: Generate full content
    console.log('Step 3/6: Generating content...')
    const markdownContent = input.useOpenAI
      ? await generateContentOpenAI(topic, outline, research.summary)
      : await generateBlogContent(topic, outline, research.summary)

    // Convert markdown to HTML
    const htmlContent = marked(markdownContent) as string

    // Step 5: Generate SEO metadata
    console.log('Step 4/6: Generating SEO metadata...')
    const seoMetadata = await generateSEOMetadata(markdownContent)

    // Step 6: Generate summary
    console.log('Step 5/6: Generating summary...')
    const summary = await generateSummary(markdownContent)

    // Step 7: Get header image
    console.log('Step 6/6: Fetching header image...')
    const headerImage = await getBlogHeaderImage(topic, research.keywords)

    if (!headerImage) {
      console.warn('No header image found, post will be created without one')
    }

    // Generate slug from title
    const slug = slugify(seoMetadata.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'\"!:@]/g,
    })

    // Prepare post data
    const postData = {
      slug,
      title: seoMetadata.title,
      summary: summary.substring(0, 300), // Ensure it's under 300 chars
      content: htmlContent,
      markdown_content: markdownContent,
      meta_description: seoMetadata.metaDescription,
      author_id: authorId,
      header_image: headerImage?.url || null,
      featured: false,
      tags: seoMetadata.tags,
      status: 'pending_review',
      ai_generated: true,
      ai_source: input.useOpenAI ? 'openai' : 'openrouter',
      ai_prompt: topic,
      generation_metadata: {
        topic,
        keywords: research.keywords,
        researchSources: research.articles.map((a) => a.source),
        outline,
        imageAttribution: headerImage
          ? {
              photographer: headerImage.photographer,
              photographerUrl: headerImage.photographerUrl,
            }
          : null,
      },
    }

    // Save to database
    console.log('Saving to database...')
    const supabase = await createClient()

    const { data: post, error: insertError } = await supabase
      .from('blog_posts')
      .insert([postData])
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      throw new Error(`Failed to save blog post: ${insertError.message}`)
    }

    console.log('✅ Blog post generated successfully!')

    return {
      success: true,
      postId: post.id,
      slug: post.slug,
      generationData: {
        topic,
        research,
        outline,
        content: markdownContent,
        metadata: {
          title: seoMetadata.title,
          summary,
          metaDescription: seoMetadata.metaDescription,
          tags: seoMetadata.tags,
        },
        headerImage: headerImage
          ? {
              url: headerImage.url,
              alt: generateImageAltText(headerImage, topic),
              attribution: `Photo by ${headerImage.photographer}`,
            }
          : {
              url: '',
              alt: '',
              attribution: '',
            },
      },
    }
  } catch (error) {
    console.error('Blog generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Auto-generate a trending topic based on research
 */
async function generateTopic(keywords: string[]): Promise<string> {
  // If no keywords, use default tech topics
  if (keywords.length === 0) {
    keywords = ['AI', 'automation', 'small business', 'technology', 'productivity']
  }

  // Simple topic generation - in production, this could use AI
  const topics = [
    `How ${keywords[0]} is Transforming ${keywords[1] || 'Business'}`,
    `The Future of ${keywords[0]}: What ${keywords[1] || 'Businesses'} Need to Know`,
    `${keywords[0]} Best Practices for ${keywords[1] || 'Modern Businesses'}`,
    `Why ${keywords[0]} Matters for ${keywords[1] || 'Small Business Success'}`,
    `${keywords[0]} Trends: ${keywords[1] || 'Innovation'} in 2025`,
  ]

  // Return random topic
  return topics[Math.floor(Math.random() * topics.length)]
}

/**
 * Generate multiple blog post suggestions
 */
export async function generateTopicSuggestions(count: number = 5): Promise<string[]> {
  const keywords = ['AI', 'automation', 'productivity', 'cloud computing', 'cybersecurity', 'data analytics']

  const suggestions: string[] = []
  for (let i = 0; i < count; i++) {
    const randomKeywords = keywords.sort(() => Math.random() - 0.5).slice(0, 2)
    const topic = await generateTopic(randomKeywords)
    suggestions.push(topic)
  }

  return suggestions
}

import { generateWithClaude } from './llm'
import { readGitHubRepo, RepoAnalysis } from '../github/repoReader'
import { generateLabWorkflowSvg, analyzeWorkflow } from './svgGenerator'
import { marked } from 'marked'
import slugify from 'slugify'
import { createClient } from '@/lib/supabase/server'

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true,
})

export interface LabGenerationInput {
  githubUrl: string
  generateSvg?: boolean
}

export interface LabSections {
  title: string
  overview: string
  architecture: string
  setupDeployment: string
  troubleshooting: string
  businessUse: string
  tags: string[]
  // HTML versions for the editor (optional, added during generation)
  overviewHtml?: string
  architectureHtml?: string
  setupDeploymentHtml?: string
  troubleshootingHtml?: string
  businessUseHtml?: string
}

export interface LabGenerationResult {
  success: boolean
  labId?: string
  slug?: string
  error?: string
  generationData?: {
    githubUrl: string
    repoAnalysis: RepoAnalysis
    sections: LabSections
    workflowSvg: string
  }
}

/**
 * Generate a single lab section
 */
async function generateSection(
  sectionName: string,
  prompt: string,
  repoData: RepoAnalysis
): Promise<string> {
  const contextParts: string[] = []

  if (repoData.readme) {
    contextParts.push(`README content:\n${repoData.readme.substring(0, 4000)}`)
  }

  if (repoData.mainTf) {
    contextParts.push(`main.tf:\n${repoData.mainTf}`)
  }

  const fullPrompt = `Based on this GitHub repository for an infrastructure lab:

Repository: ${repoData.owner}/${repoData.repo}
Description: ${repoData.description}

${contextParts.join('\n\n---\n\n')}

${prompt}

Write in markdown format. Be concise but thorough. Target audience: IT professionals interested in learning infrastructure as code.`

  const response = await generateWithClaude({
    prompt: fullPrompt,
    systemPrompt: `You are an expert technical writer specializing in infrastructure documentation. You write clear, practical content that helps IT professionals learn and implement cloud infrastructure.`,
    maxTokens: 2048,
    temperature: 0.6,
  })

  return response
}

/**
 * Generate all lab sections from repository data
 */
async function generateAllSections(repoData: RepoAnalysis): Promise<LabSections> {
  console.log('Generating lab sections...')

  // Generate title
  const titlePrompt = `Generate a concise, descriptive title for this infrastructure lab (max 60 characters).
The title should:
- Describe what the lab teaches
- Be catchy and professional
- Include key technologies (e.g., "AWS", "Terraform", "Docker")

Respond with ONLY the title text, no quotes or formatting.`

  const title = await generateSection('title', titlePrompt, repoData)

  // Generate overview
  const overviewPrompt = `Write a "Lab Overview" section (2-3 paragraphs) that covers:
- What this lab teaches and demonstrates
- Target audience and skill level
- Key outcomes and what you'll learn
- Prerequisites (brief mention)

Keep it engaging and under 300 words.`

  const overview = await generateSection('overview', overviewPrompt, repoData)

  // Generate architecture
  const architecturePrompt = `Write an "Architecture" section that explains:
- High-level architecture diagram description
- Key components and their roles
- How resources interact with each other
- Design decisions and why they were made

Include bullet points for clarity. Use technical but accessible language.`

  const architecture = await generateSection('architecture', architecturePrompt, repoData)

  // Generate setup and deployment
  const setupPrompt = `Write a "Setup and Deployment" section with:
- Prerequisites (tools, accounts, permissions needed)
- Step-by-step deployment instructions
- Configuration options and variables
- Verification steps to confirm success

Use numbered steps and code blocks where appropriate. Be specific about commands.`

  const setupDeployment = await generateSection('setup', setupPrompt, repoData)

  // Generate troubleshooting
  const troubleshootingPrompt = `Write a "Troubleshooting Highlights" section covering:
- Common errors and their solutions
- Debugging tips and techniques
- Configuration gotchas to watch out for
- Cleanup and teardown procedures

Focus on practical, actionable solutions. Use bullet points.`

  const troubleshooting = await generateSection('troubleshooting', troubleshootingPrompt, repoData)

  // Generate business use
  const businessPrompt = `Write a "Practical Business Use" section explaining:
- Real-world scenarios where this infrastructure applies
- Cost considerations and optimization tips
- When to use this approach vs alternatives
- Business value and ROI considerations

Target small-to-medium businesses. Be practical and business-focused.`

  const businessUse = await generateSection('business', businessPrompt, repoData)

  // Generate tags
  const tagsPrompt = `Generate 5-8 relevant tags for this infrastructure lab.
Tags should be lowercase, single words or short phrases.
Include technologies used (terraform, aws, docker, etc.) and concepts demonstrated.

Respond with a JSON array of strings: ["tag1", "tag2", ...]`

  const tagsResponse = await generateWithClaude({
    prompt: tagsPrompt,
    systemPrompt: 'You generate SEO-friendly tags for technical content. Respond with valid JSON only.',
    maxTokens: 256,
    temperature: 0.5,
  })

  let tags: string[] = ['terraform', 'infrastructure', 'lab']
  try {
    const jsonMatch = tagsResponse.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      tags = JSON.parse(jsonMatch[0])
    }
  } catch (error) {
    console.warn('Failed to parse tags, using defaults')
  }

  return {
    title: title.trim(),
    overview: overview.trim(),
    architecture: architecture.trim(),
    setupDeployment: setupDeployment.trim(),
    troubleshooting: troubleshooting.trim(),
    businessUse: businessUse.trim(),
    tags,
  }
}

/**
 * Main lab generation workflow
 */
export async function generateLab(
  input: LabGenerationInput,
  authorId: string
): Promise<LabGenerationResult> {
  console.log('Starting lab generation from:', input.githubUrl)

  try {
    // Step 1: Read GitHub repository
    console.log('Step 1/3: Reading GitHub repository...')
    const repoData = await readGitHubRepo(input.githubUrl)

    if (!repoData) {
      return {
        success: false,
        error: 'Failed to read GitHub repository. Check the URL and ensure the repository is public.',
      }
    }

    // Step 2: Generate content sections
    console.log('Step 2/3: Generating content sections...')
    const sections = await generateAllSections(repoData)

    // Step 3: Generate workflow SVG
    console.log('Step 3/3: Generating workflow SVG...')
    let workflowSvg = ''
    if (input.generateSvg !== false) {
      workflowSvg = await generateLabWorkflowSvg(repoData)
    }

    // Generate slug from title
    const slug = slugify(sections.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'\"!:@]/g,
    })

    // Convert markdown sections to HTML
    const overviewHtml = marked(sections.overview) as string
    const architectureHtml = marked(sections.architecture) as string
    const setupHtml = marked(sections.setupDeployment) as string
    const troubleshootingHtml = marked(sections.troubleshooting) as string
    const businessHtml = marked(sections.businessUse) as string

    // Prepare lab data
    const labData = {
      slug,
      title: sections.title,
      overview: overviewHtml,
      architecture: architectureHtml,
      setup_deployment: setupHtml,
      troubleshooting: troubleshootingHtml,
      business_use: businessHtml,
      workflow_svg: workflowSvg,
      github_url: input.githubUrl,
      github_metadata: {
        owner: repoData.owner,
        repo: repoData.repo,
        defaultBranch: repoData.defaultBranch,
        filesRead: [
          repoData.readme ? 'README.md' : null,
          repoData.mainTf ? 'main.tf' : null,
          repoData.variablesTf ? 'variables.tf' : null,
          repoData.outputsTf ? 'outputs.tf' : null,
        ].filter(Boolean),
      },
      meta_description: sections.overview.substring(0, 160).replace(/[#*_\n]/g, ''),
      author_id: authorId,
      tags: sections.tags,
      status: 'draft',
      ai_generated: true,
    }

    // Save to database
    console.log('Saving to database...')
    const supabase = await createClient()

    // Check if slug exists
    const { data: existing } = await supabase.from('labs').select('id').eq('slug', slug).single()

    if (existing) {
      // Append timestamp to make unique
      labData.slug = `${slug}-${Date.now()}`
    }

    const { data: lab, error: insertError } = await supabase
      .from('labs')
      .insert([labData])
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      throw new Error(`Failed to save lab: ${insertError.message}`)
    }

    console.log('Lab generated successfully!')

    return {
      success: true,
      labId: lab.id,
      slug: lab.slug,
      generationData: {
        githubUrl: input.githubUrl,
        repoAnalysis: repoData,
        sections: {
          ...sections,
          // Include HTML versions for the editor
          overviewHtml,
          architectureHtml,
          setupDeploymentHtml: setupHtml,
          troubleshootingHtml,
          businessUseHtml: businessHtml,
        },
        workflowSvg,
      },
    }
  } catch (error) {
    console.error('Lab generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Regenerate workflow SVG for an existing lab
 */
export async function regenerateLabSvg(githubUrl: string): Promise<string | null> {
  try {
    const repoData = await readGitHubRepo(githubUrl)
    if (!repoData) {
      return null
    }
    return await generateLabWorkflowSvg(repoData)
  } catch (error) {
    console.error('SVG regeneration error:', error)
    return null
  }
}

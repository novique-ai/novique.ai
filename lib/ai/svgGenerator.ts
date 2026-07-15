import { generateWithClaude } from './llm'
import { RepoAnalysis, extractTerraformResources, extractTerraformProviders } from '../github/repoReader'

export interface WorkflowNode {
  id: string
  type: string
  name: string
  provider: string
  label: string
}

export interface WorkflowConnection {
  from: string
  to: string
  label?: string
}

export interface WorkflowAnalysis {
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  summary: string
}

// Resource types that should be excluded from workflow diagrams (utility resources)
const EXCLUDED_RESOURCE_TYPES = [
  'random_string',
  'random_id',
  'random_integer',
  'random_password',
  'random_pet',
  'random_shuffle',
  'random_uuid',
  'null_resource',
  'time_sleep',
  'time_offset',
  'time_rotating',
  'time_static',
  'local_file',
  'local_sensitive_file',
]

/**
 * Analyze repository and extract workflow structure
 */
export async function analyzeWorkflow(repoData: RepoAnalysis): Promise<WorkflowAnalysis> {
  const allResources = repoData.mainTf ? extractTerraformResources(repoData.mainTf) : []
  // Filter out utility resources that shouldn't appear in diagrams
  const resources = allResources.filter(r => !EXCLUDED_RESOURCE_TYPES.includes(r.type))
  const providers = repoData.mainTf ? extractTerraformProviders(repoData.mainTf) : []

  // Build context for AI analysis
  const contextParts: string[] = []

  if (repoData.readme) {
    contextParts.push(`README:\n${repoData.readme.substring(0, 3000)}`)
  }

  if (repoData.mainTf) {
    contextParts.push(`main.tf:\n${repoData.mainTf}`)
  }

  if (repoData.variablesTf) {
    contextParts.push(`variables.tf:\n${repoData.variablesTf}`)
  }

  const prompt = `Analyze this Terraform infrastructure and identify the workflow:

${contextParts.join('\n\n---\n\n')}

Extracted resources: ${JSON.stringify(resources, null, 2)}
Providers: ${providers.join(', ')}

Respond with a JSON object describing the infrastructure workflow:
{
  "nodes": [
    {
      "id": "unique-id",
      "type": "resource_type (e.g., aws_s3_bucket)",
      "name": "resource_name",
      "provider": "provider (e.g., aws, docker)",
      "label": "Human-readable label"
    }
  ],
  "connections": [
    {
      "from": "source-node-id",
      "to": "target-node-id",
      "label": "optional relationship label"
    }
  ],
  "summary": "Brief 1-2 sentence summary of what this infrastructure does"
}

Include the logical flow of data/resources. For Terraform labs, think about:
- What gets created first (dependencies)
- Data flow between resources
- Input variables → Resources → Outputs

IMPORTANT: Do NOT include utility resources like random_string, random_id, null_resource, time_sleep, or local_file in the workflow. Only include actual infrastructure resources.`

  const response = await generateWithClaude({
    prompt,
    systemPrompt: 'You are an infrastructure expert who analyzes Terraform code and identifies resource relationships. Always respond with valid JSON.',
    maxTokens: 2048,
    temperature: 0.3,
  })

  try {
    // Extract JSON from response (in case there's markdown around it)
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Failed to parse workflow analysis:', error)
    // Return a basic structure based on extracted resources
    return {
      nodes: resources.map((r, i) => ({
        id: `resource-${i}`,
        type: r.type,
        name: r.name,
        provider: r.provider,
        label: `${r.type}.${r.name}`,
      })),
      connections: [],
      summary: repoData.description || 'Terraform infrastructure deployment',
    }
  }
}

/**
 * Get color scheme for provider/resource type
 */
function getProviderColors(provider: string, resourceType: string): { primary: string; secondary: string; bg: string } {
  // Resource type based colors
  if (resourceType.includes('s3') || resourceType.includes('storage') || resourceType.includes('bucket')) {
    return { primary: '#8B5CF6', secondary: '#A78BFA', bg: '#F5F3FF' } // Purple for storage
  }
  if (resourceType.includes('vpc') || resourceType.includes('network') || resourceType.includes('subnet') || resourceType.includes('security_group')) {
    return { primary: '#3B82F6', secondary: '#60A5FA', bg: '#EFF6FF' } // Blue for networking
  }
  if (resourceType.includes('instance') || resourceType.includes('container') || resourceType.includes('compute') || resourceType.includes('lambda')) {
    return { primary: '#10B981', secondary: '#34D399', bg: '#ECFDF5' } // Green for compute
  }
  if (resourceType.includes('iam') || resourceType.includes('role') || resourceType.includes('policy')) {
    return { primary: '#F59E0B', secondary: '#FBBF24', bg: '#FFFBEB' } // Yellow for IAM
  }
  if (resourceType.includes('db') || resourceType.includes('rds') || resourceType.includes('database')) {
    return { primary: '#EF4444', secondary: '#F87171', bg: '#FEF2F2' } // Red for databases
  }

  // Provider based fallbacks
  const providerColors: Record<string, { primary: string; secondary: string; bg: string }> = {
    aws: { primary: '#FF9900', secondary: '#FFAD33', bg: '#FFF7ED' },
    docker: { primary: '#2496ED', secondary: '#4AA8F0', bg: '#EFF6FF' },
    google: { primary: '#4285F4', secondary: '#6B9DF7', bg: '#EFF6FF' },
    azure: { primary: '#0078D4', secondary: '#2E96E8', bg: '#EFF6FF' },
    kubernetes: { primary: '#326CE5', secondary: '#5A8AEB', bg: '#EFF6FF' },
    random: { primary: '#6B7280', secondary: '#9CA3AF', bg: '#F9FAFB' },
  }

  return providerColors[provider] || { primary: '#6B7280', secondary: '#9CA3AF', bg: '#F9FAFB' }
}

/**
 * Get icon SVG path for resource type
 */
function getResourceIcon(resourceType: string): string {
  if (resourceType.includes('s3') || resourceType.includes('storage') || resourceType.includes('bucket')) {
    return '<path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" fill="currentColor"/>' // Storage icon
  }
  if (resourceType.includes('vpc') || resourceType.includes('network') || resourceType.includes('subnet')) {
    return '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" fill="none" stroke-width="2"/>' // Network icon
  }
  if (resourceType.includes('instance') || resourceType.includes('container') || resourceType.includes('compute')) {
    return '<rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" fill="none" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/>' // Compute icon
  }
  if (resourceType.includes('security_group') || resourceType.includes('iam')) {
    return '<path d="M12 2L4 6v6c0 5.5 3.4 10.3 8 12 4.6-1.7 8-6.5 8-12V6l-8-4z" stroke="currentColor" fill="none" stroke-width="2"/>' // Shield icon
  }
  // Default: cube icon
  return '<path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" fill="none" stroke-width="2"/>'
}

/**
 * Generate animated infographic-style SVG from workflow analysis
 * Creates a hub-and-spoke layout with animated flowing dots
 */
export async function generateWorkflowSvg(analysis: WorkflowAnalysis): Promise<string> {
  const { nodes } = analysis

  // SVG dimensions
  const svgWidth = 900
  const svgHeight = 500
  const centerX = svgWidth / 2
  const centerY = svgHeight / 2 + 20

  // Card dimensions
  const cardWidth = 180
  const cardHeight = 80
  const headerHeight = 28

  // Hub dimensions
  const hubRadius = 50

  // Calculate positions in a circle around the hub
  const radius = 180
  const nodeCount = Math.min(nodes.length, 8) // Max 8 nodes for clean layout
  const displayNodes = nodes.slice(0, nodeCount)

  // Position cards around center
  const nodePositions: Array<{ x: number; y: number; angle: number }> = displayNodes.map((_, index) => {
    const angle = (index * 2 * Math.PI) / nodeCount - Math.PI / 2 // Start from top
    return {
      x: centerX + radius * Math.cos(angle) - cardWidth / 2,
      y: centerY + radius * Math.sin(angle) - cardHeight / 2,
      angle,
    }
  })

  // Generate curved paths from hub to each card
  const pathElements = nodePositions
    .map((pos, index) => {
      const colors = getProviderColors(displayNodes[index].provider, displayNodes[index].type)
      const cardCenterX = pos.x + cardWidth / 2
      const cardCenterY = pos.y + cardHeight / 2

      // Calculate control points for smooth curve
      const dx = cardCenterX - centerX
      const dy = cardCenterY - centerY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const midX = centerX + dx * 0.5
      const midY = centerY + dy * 0.5

      // Perpendicular offset for curve
      const perpX = -dy / dist * 30
      const perpY = dx / dist * 30
      const ctrl1X = centerX + dx * 0.3 + perpX
      const ctrl1Y = centerY + dy * 0.3 + perpY
      const ctrl2X = centerX + dx * 0.7 + perpX
      const ctrl2Y = centerY + dy * 0.7 + perpY

      const pathId = `path-${index}`
      const delay = index * 0.15

      return `
    <g class="connection" style="animation: fadeIn 0.6s ease-out ${delay}s forwards; opacity: 0;">
      <!-- Path line -->
      <path
        id="${pathId}"
        d="M ${centerX} ${centerY} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${cardCenterX} ${cardCenterY}"
        fill="none"
        stroke="${colors.secondary}"
        stroke-width="2"
        stroke-opacity="0.4"
      />
      <!-- Animated dot -->
      <circle r="5" fill="${colors.primary}">
        <animateMotion dur="${2 + index * 0.3}s" repeatCount="indefinite" begin="${delay}s">
          <mpath href="#${pathId}"/>
        </animateMotion>
      </circle>
      <!-- Second dot with offset -->
      <circle r="4" fill="${colors.primary}" opacity="0.6">
        <animateMotion dur="${2 + index * 0.3}s" repeatCount="indefinite" begin="${delay + 1}s">
          <mpath href="#${pathId}"/>
        </animateMotion>
      </circle>
    </g>`
    })
    .join('')

  // Generate card elements
  const cardElements = displayNodes
    .map((node, index) => {
      const pos = nodePositions[index]
      const colors = getProviderColors(node.provider, node.type)
      const delay = 0.3 + index * 0.15
      const icon = getResourceIcon(node.type)

      // Truncate labels
      const displayLabel = node.label.length > 22 ? node.label.substring(0, 20) + '...' : node.label
      const displayType = node.type.replace(/_/g, ' ').replace(/^aws /, '').substring(0, 25)

      return `
    <g class="card card-${index}" style="animation: cardFadeIn 0.5s ease-out ${delay}s forwards; opacity: 0;">
      <!-- Card shadow -->
      <rect
        x="${pos.x + 3}"
        y="${pos.y + 3}"
        width="${cardWidth}"
        height="${cardHeight}"
        rx="10"
        fill="#00000010"
      />
      <!-- Card body -->
      <rect
        x="${pos.x}"
        y="${pos.y}"
        width="${cardWidth}"
        height="${cardHeight}"
        rx="10"
        fill="white"
        stroke="${colors.primary}30"
        stroke-width="1"
      />
      <!-- Card header -->
      <rect
        x="${pos.x}"
        y="${pos.y}"
        width="${cardWidth}"
        height="${headerHeight}"
        rx="10"
        fill="${colors.primary}"
      />
      <rect
        x="${pos.x}"
        y="${pos.y + 10}"
        width="${cardWidth}"
        height="${headerHeight - 10}"
        fill="${colors.primary}"
      />
      <!-- Header icon -->
      <g transform="translate(${pos.x + 10}, ${pos.y + 4}) scale(0.8)" fill="white" stroke="white">
        ${icon}
      </g>
      <!-- Header text -->
      <text
        x="${pos.x + 36}"
        y="${pos.y + 18}"
        fill="white"
        font-size="11"
        font-weight="600"
      >${node.provider.toUpperCase()}</text>
      <!-- Card content -->
      <text
        x="${pos.x + cardWidth / 2}"
        y="${pos.y + 48}"
        text-anchor="middle"
        fill="#374151"
        font-size="12"
        font-weight="500"
      >${displayLabel}</text>
      <text
        x="${pos.x + cardWidth / 2}"
        y="${pos.y + 66}"
        text-anchor="middle"
        fill="#6B7280"
        font-size="10"
      >${displayType}</text>
    </g>`
    })
    .join('')

  // Generate central hub
  const mainProvider = displayNodes[0]?.provider || 'terraform'
  const hubElement = `
    <g class="hub" style="animation: hubPulse 0.8s ease-out forwards;">
      <!-- Outer glow ring -->
      <circle cx="${centerX}" cy="${centerY}" r="${hubRadius + 15}" fill="none" stroke="#7C3AED20" stroke-width="8">
        <animate attributeName="r" values="${hubRadius + 10};${hubRadius + 20};${hubRadius + 10}" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="stroke-opacity" values="0.3;0.1;0.3" dur="3s" repeatCount="indefinite"/>
      </circle>
      <!-- Hub circle -->
      <circle cx="${centerX}" cy="${centerY}" r="${hubRadius}" fill="url(#hubGradient)" stroke="#7C3AED" stroke-width="3"/>
      <!-- Terraform icon in center -->
      <g transform="translate(${centerX - 20}, ${centerY - 20})">
        <path d="M13.5 2.5v12l10.5-6v-12l-10.5 6z" fill="#7C3AED"/>
        <path d="M2.5 8.5v12l10.5-6v-12l-10.5 6z" fill="#5B21B6"/>
        <path d="M13.5 26.5v12l10.5-6v-12l-10.5 6z" fill="#5B21B6"/>
        <path d="M24.5 14.5v12l10.5-6v-12l-10.5 6z" fill="#7C3AED"/>
      </g>
      <!-- Hub label -->
      <text x="${centerX}" y="${centerY + hubRadius + 25}" text-anchor="middle" fill="#5B21B6" font-size="12" font-weight="600">
        TERRAFORM
      </text>
    </g>`

  // Title element
  const titleElement = `
    <text x="${svgWidth / 2}" y="35" text-anchor="middle" font-size="18" font-weight="700" fill="#111827">
      ${analysis.summary.length > 55 ? analysis.summary.substring(0, 52) + '...' : analysis.summary}
    </text>`

  // Generate full SVG
  const svg = `<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 ${svgWidth} ${svgHeight}"
  width="100%"
  height="100%"
  preserveAspectRatio="xMidYMid meet"
  role="img"
  aria-label="Infrastructure workflow diagram: ${analysis.summary}"
>
  <defs>
    <linearGradient id="hubGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F5F3FF"/>
      <stop offset="100%" stop-color="#EDE9FE"/>
    </linearGradient>
  </defs>

  <style>
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes cardFadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes hubPulse {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }
    .card:hover rect:first-of-type {
      filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
    }
    text {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
  </style>

  <!-- Background -->
  <rect width="100%" height="100%" fill="#FAFAFA" rx="16"/>

  <!-- Subtle grid pattern -->
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E5E7EB" stroke-width="0.5"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)" opacity="0.5"/>

  <!-- Title -->
  ${titleElement}

  <!-- Connection paths with animated dots -->
  ${pathElements}

  <!-- Central hub -->
  ${hubElement}

  <!-- Resource cards -->
  ${cardElements}

</svg>`

  return svg
}

/**
 * Generate SVG from repository analysis
 * Uses programmatic generation for consistent, high-quality output
 */
export async function generateAiSvg(repoData: RepoAnalysis): Promise<string> {
  const analysis = await analyzeWorkflow(repoData)

  // Always use programmatic generation for consistent quality
  return generateWorkflowSvg(analysis)
}

/**
 * Generate a custom workflow SVG from user-defined nodes
 * Useful when the AI inference doesn't match the actual setup
 */
export function generateCustomWorkflowSvg(
  nodes: Array<{
    id: string
    label: string
    sublabel: string
    type: 'laptop' | 'server' | 'cloud' | 'storage' | 'network' | 'container' | 'database'
    provider?: string
  }>,
  title: string
): string {
  // Map node types to colors and icons
  const typeConfig: Record<string, { primary: string; secondary: string; icon: string }> = {
    laptop: {
      primary: '#6366F1',
      secondary: '#818CF8',
      icon: '<rect x="4" y="6" width="16" height="10" rx="1" stroke="currentColor" fill="none" stroke-width="2"/><path d="M2 18h20" stroke="currentColor" stroke-width="2"/>'
    },
    server: {
      primary: '#10B981',
      secondary: '#34D399',
      icon: '<rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" fill="none" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/>'
    },
    cloud: {
      primary: '#F59E0B',
      secondary: '#FBBF24',
      icon: '<path d="M18 10a4 4 0 00-8 0 4 4 0 00-4 4 3 3 0 003 3h10a3 3 0 001-5.83A4 4 0 0018 10z" stroke="currentColor" fill="none" stroke-width="2"/>'
    },
    storage: {
      primary: '#8B5CF6',
      secondary: '#A78BFA',
      icon: '<path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" fill="currentColor"/>'
    },
    network: {
      primary: '#3B82F6',
      secondary: '#60A5FA',
      icon: '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" fill="none" stroke-width="2"/>'
    },
    container: {
      primary: '#2496ED',
      secondary: '#4AA8F0',
      icon: '<rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" fill="none" stroke-width="2"/><path d="M3 9h18M9 3v18" stroke="currentColor" stroke-width="2"/>'
    },
    database: {
      primary: '#EF4444',
      secondary: '#F87171',
      icon: '<ellipse cx="12" cy="6" rx="8" ry="3" stroke="currentColor" fill="none" stroke-width="2"/><path d="M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6" stroke="currentColor" fill="none" stroke-width="2"/>'
    }
  }

  const svgWidth = 900
  const svgHeight = 500
  const centerX = svgWidth / 2
  const centerY = svgHeight / 2 + 20

  const cardWidth = 180
  const cardHeight = 80
  const headerHeight = 28
  const hubRadius = 50
  const radius = 180

  const nodeCount = nodes.length
  const nodePositions = nodes.map((_, index) => {
    const angle = (index * 2 * Math.PI) / nodeCount - Math.PI / 2
    return {
      x: centerX + radius * Math.cos(angle) - cardWidth / 2,
      y: centerY + radius * Math.sin(angle) - cardHeight / 2,
      angle,
    }
  })

  // Generate paths
  const pathElements = nodePositions.map((pos, index) => {
    const config = typeConfig[nodes[index].type] || typeConfig.server
    const cardCenterX = pos.x + cardWidth / 2
    const cardCenterY = pos.y + cardHeight / 2

    const dx = cardCenterX - centerX
    const dy = cardCenterY - centerY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const perpX = -dy / dist * 30
    const perpY = dx / dist * 30
    const ctrl1X = centerX + dx * 0.3 + perpX
    const ctrl1Y = centerY + dy * 0.3 + perpY
    const ctrl2X = centerX + dx * 0.7 + perpX
    const ctrl2Y = centerY + dy * 0.7 + perpY

    const pathId = `path-${index}`
    const delay = index * 0.15

    return `
    <g class="connection" style="animation: fadeIn 0.6s ease-out ${delay}s forwards; opacity: 0;">
      <path id="${pathId}" d="M ${centerX} ${centerY} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${cardCenterX} ${cardCenterY}" fill="none" stroke="${config.secondary}" stroke-width="2" stroke-opacity="0.4"/>
      <circle r="5" fill="${config.primary}">
        <animateMotion dur="${2 + index * 0.3}s" repeatCount="indefinite" begin="${delay}s">
          <mpath href="#${pathId}"/>
        </animateMotion>
      </circle>
      <circle r="4" fill="${config.primary}" opacity="0.6">
        <animateMotion dur="${2 + index * 0.3}s" repeatCount="indefinite" begin="${delay + 1}s">
          <mpath href="#${pathId}"/>
        </animateMotion>
      </circle>
    </g>`
  }).join('')

  // Generate cards
  const cardElements = nodes.map((node, index) => {
    const pos = nodePositions[index]
    const config = typeConfig[node.type] || typeConfig.server
    const delay = 0.3 + index * 0.15
    const displayLabel = node.label.length > 22 ? node.label.substring(0, 20) + '...' : node.label
    const displaySublabel = node.sublabel.length > 25 ? node.sublabel.substring(0, 23) + '...' : node.sublabel

    return `
    <g class="card" style="animation: cardFadeIn 0.5s ease-out ${delay}s forwards; opacity: 0;">
      <rect x="${pos.x + 3}" y="${pos.y + 3}" width="${cardWidth}" height="${cardHeight}" rx="10" fill="#00000010"/>
      <rect x="${pos.x}" y="${pos.y}" width="${cardWidth}" height="${cardHeight}" rx="10" fill="white" stroke="${config.primary}30" stroke-width="1"/>
      <rect x="${pos.x}" y="${pos.y}" width="${cardWidth}" height="${headerHeight}" rx="10" fill="${config.primary}"/>
      <rect x="${pos.x}" y="${pos.y + 10}" width="${cardWidth}" height="${headerHeight - 10}" fill="${config.primary}"/>
      <g transform="translate(${pos.x + 10}, ${pos.y + 4}) scale(0.8)" fill="white" stroke="white">${config.icon}</g>
      <text x="${pos.x + 36}" y="${pos.y + 18}" fill="white" font-size="11" font-weight="600">${node.provider?.toUpperCase() || node.type.toUpperCase()}</text>
      <text x="${pos.x + cardWidth / 2}" y="${pos.y + 48}" text-anchor="middle" fill="#374151" font-size="12" font-weight="500">${displayLabel}</text>
      <text x="${pos.x + cardWidth / 2}" y="${pos.y + 66}" text-anchor="middle" fill="#6B7280" font-size="10">${displaySublabel}</text>
    </g>`
  }).join('')

  // Hub
  const hubElement = `
    <g class="hub" style="animation: hubPulse 0.8s ease-out forwards;">
      <circle cx="${centerX}" cy="${centerY}" r="${hubRadius + 15}" fill="none" stroke="#7C3AED20" stroke-width="8">
        <animate attributeName="r" values="${hubRadius + 10};${hubRadius + 20};${hubRadius + 10}" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="stroke-opacity" values="0.3;0.1;0.3" dur="3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${centerX}" cy="${centerY}" r="${hubRadius}" fill="url(#hubGradient)" stroke="#7C3AED" stroke-width="3"/>
      <g transform="translate(${centerX - 20}, ${centerY - 20})">
        <path d="M13.5 2.5v12l10.5-6v-12l-10.5 6z" fill="#7C3AED"/>
        <path d="M2.5 8.5v12l10.5-6v-12l-10.5 6z" fill="#5B21B6"/>
        <path d="M13.5 26.5v12l10.5-6v-12l-10.5 6z" fill="#5B21B6"/>
        <path d="M24.5 14.5v12l10.5-6v-12l-10.5 6z" fill="#7C3AED"/>
      </g>
      <text x="${centerX}" y="${centerY + hubRadius + 25}" text-anchor="middle" fill="#5B21B6" font-size="12" font-weight="600">TERRAFORM</text>
    </g>`

  const titleElement = `<text x="${svgWidth / 2}" y="35" text-anchor="middle" font-size="18" font-weight="700" fill="#111827">${title.length > 55 ? title.substring(0, 52) + '...' : title}</text>`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Infrastructure workflow: ${title}">
  <defs>
    <linearGradient id="hubGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F5F3FF"/>
      <stop offset="100%" stop-color="#EDE9FE"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E5E7EB" stroke-width="0.5"/>
    </pattern>
  </defs>
  <style>
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes cardFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes hubPulse { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
    text { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  </style>
  <rect width="100%" height="100%" fill="#FAFAFA" rx="16"/>
  <rect width="100%" height="100%" fill="url(#grid)" opacity="0.5"/>
  ${titleElement}
  ${pathElements}
  ${hubElement}
  ${cardElements}
</svg>`
}

/**
 * Sanitize SVG for safe rendering
 * Simple sanitization that removes potentially dangerous content
 * Since we generate SVGs ourselves, this is mainly a safety check
 */
export function sanitizeSvg(svg: string): string {
  // Remove script tags and event handlers
  let sanitized = svg
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, 'data-blocked:')

  // Ensure it starts with svg tag
  if (!sanitized.trim().startsWith('<svg')) {
    // Try to extract just the svg element
    const svgMatch = sanitized.match(/<svg[\s\S]*<\/svg>/i)
    if (svgMatch) {
      sanitized = svgMatch[0]
    }
  }

  return sanitized
}

/**
 * Main function to generate sanitized workflow SVG from repository
 */
export async function generateLabWorkflowSvg(repoData: RepoAnalysis): Promise<string> {
  try {
    const svg = await generateAiSvg(repoData)
    return sanitizeSvg(svg)
  } catch (error) {
    console.error('SVG generation error:', error)
    // Return a fallback SVG
    return sanitizeSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="100%" height="100%">
      <rect width="100%" height="100%" fill="#F9FAFB" rx="12"/>
      <text x="400" y="200" text-anchor="middle" fill="#6B7280" font-size="16">
        Workflow diagram generation in progress...
      </text>
    </svg>`)
  }
}

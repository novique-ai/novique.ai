import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getLabBySlug, getAllLabs } from '@/lib/labs'
import { enhanceContentImages } from '@/lib/editor/enhanceImages'
import AnimatedWorkflow from '@/components/labs/AnimatedWorkflow'
import ThemeShell from '@/components/marketing/ThemeShell'
import DarkButton from '@/components/marketing/DarkButton'
import GraphicFrame from '@/components/graphics/GraphicFrame'
import AuroraOrbField from '@/components/graphics/AuroraOrbField'

// Revalidate lab pages every 60 seconds to pick up edits
export const revalidate = 60

interface LabPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const labs = await getAllLabs()
  return labs.map((lab) => ({ slug: lab.slug }))
}

export async function generateMetadata({ params }: LabPageProps): Promise<Metadata> {
  const { slug } = await params
  const lab = await getLabBySlug(slug)

  if (!lab) {
    return { title: 'Lab Not Found | Novique.AI' }
  }

  // Strip HTML from overview for description
  const description = lab.overview.replace(/<[^>]*>/g, '').substring(0, 160)

  return {
    title: `${lab.title} | Labs | Novique.AI`,
    description,
    openGraph: {
      title: lab.title,
      description,
      type: 'article',
    },
  }
}

const SECTIONS = [
  { key: 'overview', label: 'Lab Overview' },
  { key: 'architecture', label: 'Architecture' },
  { key: 'setupDeployment', label: 'Setup and Deployment' },
  { key: 'troubleshooting', label: 'Troubleshooting Highlights' },
  { key: 'businessUse', label: 'Practical Business Use' },
] as const

const PROSE_CLASS =
  'prose prose-invert max-w-none prose-headings:font-display prose-a:text-link hover:prose-a:text-link-hover prose-code:rounded prose-code:bg-surface-3 prose-code:px-1 prose-pre:bg-surface-3 prose-pre:border prose-pre:border-stroke-1 prose-li:my-0 prose-ul:my-2 prose-ol:my-2 [&_ul]:space-y-1 [&_ol]:space-y-1'

export default async function LabPage({ params }: LabPageProps) {
  const { slug } = await params
  const lab = await getLabBySlug(slug)

  if (!lab) {
    notFound()
  }

  const formattedDate = new Date(lab.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const sections = SECTIONS.map((s) => ({ ...s, html: lab[s.key] })).filter(
    (s) => s.html,
  )

  return (
    <ThemeShell>
      {/* Header */}
      <section className="relative isolate overflow-hidden border-b border-stroke-1">
        <AuroraOrbField intensity="soft" />
        <div className="relative mx-auto max-w-4xl px-6 pb-12 pt-20 md:pt-24">
          <Link
            href="/labs"
            className="mb-6 inline-flex items-center text-sm text-ink-2 transition-colors hover:text-ink-0"
          >
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Labs
          </Link>

          <h1 className="font-display text-display text-ink-0 text-balance">{lab.title}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-sm text-ink-2">
            <time dateTime={lab.date}>{formattedDate}</time>
            <span aria-hidden="true">•</span>
            <span>{lab.author}</span>
          </div>

          {/* Tags */}
          <div className="mt-4 flex flex-wrap gap-2">
            {lab.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-stroke-1 bg-surface-2 px-3 py-1 font-mono text-xs text-ink-2"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Animated Workflow Diagram */}
      <section className="mx-auto -mt-8 max-w-5xl px-6">
        <GraphicFrame className="nv-card rounded-2xl">
          <AnimatedWorkflow
            svg={lab.workflowSvg || ''}
            height="45vh"
            showControls={true}
          />
        </GraphicFrame>
        {lab.githubUrl && (
          <div className="mt-4 text-center">
            <a
              href={lab.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center font-medium text-link hover:text-link-hover"
            >
              <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              View on GitHub
            </a>
          </div>
        )}
      </section>

      {/* Content Sections */}
      <article className="mx-auto max-w-4xl px-6 py-12 md:py-16">
        {sections.map((section, i) => (
          <section key={section.key} className="mb-12">
            <h2 className="mb-4 flex items-center font-display text-dh2 text-ink-0">
              <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg border border-stroke-accent bg-aqua/10 font-mono text-base text-aqua-bright">
                {i + 1}
              </span>
              {section.label}
            </h2>
            <div
              className={PROSE_CLASS}
              dangerouslySetInnerHTML={{ __html: enhanceContentImages(section.html as string) }}
            />
          </section>
        ))}
      </article>

      {/* CTA Section */}
      <section className="relative overflow-hidden border-t border-stroke-1 bg-surface-1">
        <div className="relative mx-auto max-w-4xl px-6 py-16 text-center md:py-20">
          <h2 className="font-display text-dh1 text-ink-0">
            Need help implementing this?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-body-lg text-ink-2">
            Our team can help you customize this infrastructure for your organization,
            or train your team on infrastructure as code best practices.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <DarkButton href="/contact" size="lg">Book a Consultation</DarkButton>
            <DarkButton href="/labs" variant="ghost" size="lg">View More Labs</DarkButton>
          </div>
        </div>
      </section>
    </ThemeShell>
  )
}

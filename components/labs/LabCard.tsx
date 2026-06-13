import Link from 'next/link'
import { Lab } from '@/lib/labs'
import AnimatedWorkflow from './AnimatedWorkflow'

interface LabCardProps {
  lab: Lab
}

export default function LabCard({ lab }: LabCardProps) {
  const formattedDate = new Date(lab.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Strip HTML tags from overview for preview
  const overviewText = lab.overview.replace(/<[^>]*>/g, '').substring(0, 150)

  return (
    <Link href={`/labs/${lab.slug}`} className="group block">
      <article className="nv-card flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-stroke-2 hover:shadow-glow">
        {/* SVG Preview */}
        <div className="relative h-48 border-b border-stroke-1 bg-surface-3">
          {lab.workflowSvg ? (
            <AnimatedWorkflow svg={lab.workflowSvg} height="100%" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <svg
                className="h-16 w-16 text-ink-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                />
              </svg>
            </div>
          )}

          {/* Featured badge */}
          {lab.featured && (
            <div className="absolute right-3 top-3 rounded-full border border-stroke-accent bg-aqua/10 px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-wider text-aqua-bright">
              Featured
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-2 flex items-center gap-2 font-mono text-xs text-ink-3">
            <time dateTime={lab.date}>{formattedDate}</time>
          </div>

          <h3 className="mb-2 line-clamp-2 font-display text-dh3 text-ink-0 transition-colors group-hover:text-aqua">
            {lab.title}
          </h3>

          <p className="mb-4 line-clamp-3 text-sm text-ink-2">
            {overviewText}...
          </p>

          {/* Tags */}
          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            {lab.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-stroke-1 bg-surface-3 px-2.5 py-0.5 font-mono text-[0.7rem] text-ink-2"
              >
                {tag}
              </span>
            ))}
            {lab.tags.length > 3 && (
              <span className="font-mono text-[0.7rem] text-ink-3">+{lab.tags.length - 3} more</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}

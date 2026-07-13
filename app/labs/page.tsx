import { Metadata } from 'next'
import { getAllLabs } from '@/lib/labs'
import LabCard from '@/components/labs/LabCard'
import ThemeShell from '@/components/marketing/ThemeShell'
import PageHero from '@/components/marketing/PageHero'
import SectionHeading from '@/components/marketing/SectionHeading'
import DarkButton from '@/components/marketing/DarkButton'

export const metadata: Metadata = {
  title: 'Labs | Novique.AI',
  description: 'Explore our hands-on infrastructure labs with animated workflow diagrams. Learn Terraform, AWS, Docker, and more through practical examples.',
}

export const revalidate = 60 // Revalidate every minute

const STACK = ['Terraform', 'AWS', 'Docker', 'Infrastructure as Code']

export default async function LabsPage() {
  const labs = await getAllLabs()

  return (
    <ThemeShell>
      <PageHero
        eyebrow="Infrastructure Labs"
        headline={
          <>
            Learn by
            <br />
            <span className="text-ink-2">building.</span>
          </>
        }
        subhead="Explore hands-on infrastructure labs with animated workflow diagrams. Each lab walks you through real-world cloud deployments using Terraform, AWS, Docker, and more."
        ctas={[
          { label: 'Book a call', href: '/consultation', variant: 'primary' },
          { label: 'See what we can do', href: '/services', variant: 'ghost' },
        ]}
      />

      {/* Stack pills */}
      <section className="mx-auto max-w-container px-6">
        <div className="flex flex-wrap justify-center gap-3">
          {STACK.map((s) => (
            <span
              key={s}
              className="rounded-full border border-stroke-1 bg-surface-2 px-4 py-1.5 font-mono text-xs text-ink-2"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* Labs Grid */}
      <section className="mx-auto max-w-container px-6 py-16 md:py-24">
        <SectionHeading
          eyebrow="Built in the open"
          title={
            <>
              Available labs
              <span className="ml-3 font-mono text-base font-normal tracking-normal text-ink-3">
                ({labs.length} {labs.length === 1 ? 'lab' : 'labs'})
              </span>
            </>
          }
          subhead="Exploration and testing labs we built on GitHub while designing solutions for our customers. Read through each one below — and every lab links to its repo if you want to build it yourself."
        />

        {labs.length > 0 ? (
          <div className="mt-12">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {labs.map((lab) => (
                <LabCard key={lab.slug} lab={lab} />
              ))}
            </div>
          </div>
        ) : (
          <div className="py-16 text-center">
            <svg
              className="mx-auto h-24 w-24 text-ink-3"
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
            <h3 className="mt-4 font-display text-dh3 text-ink-0">No Labs Yet</h3>
            <p className="mx-auto mt-2 max-w-md text-ink-2">
              Infrastructure labs are coming soon. Check back later for hands-on tutorials
              with animated workflow diagrams.
            </p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden border-t border-stroke-1 bg-surface-1">
        <div className="relative mx-auto max-w-container px-6 py-20 text-center md:py-24">
          <h2 className="mx-auto max-w-2xl font-display text-dh1 text-ink-0">
            Need help with your infrastructure?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-body-lg text-ink-2">
            Our team can help you implement these patterns in your organization,
            customize solutions for your needs, or train your team on infrastructure as code.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <DarkButton href="/consultation" size="lg">Book a call</DarkButton>
            <DarkButton href="/work" size="lg" variant="ghost">See our work</DarkButton>
          </div>
        </div>
      </section>
    </ThemeShell>
  )
}

import ThemeShell from "@/components/marketing/ThemeShell";
import PageHero from "@/components/marketing/PageHero";
import SectionHeading from "@/components/marketing/SectionHeading";
import StatusTag from "@/components/marketing/StatusTag";
import DarkButton from "@/components/marketing/DarkButton";
import IsoFigure from "@/components/graphics/IsoFigure";
import { PRODUCTS, SYSTEMS, statusMeta } from "@/lib/work/products";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Novique — builds and operates its own AI products",
  description:
    "Novique is a small AI studio that builds and runs its own software products, and builds the same kind of software for small and mid-sized businesses. No jargon, no enterprise budget required.",
};

// What separates us from a typical AI consultancy — honest, side-by-side.
const DIFFERENCE = [
  {
    them: "Decks, jargon, and a roadmap you maintain alone.",
    us: "Working software, plain English, and an operating plan.",
  },
  {
    them: "Enterprise-only pricing and six-month projects.",
    us: "A small first step, fixed price, fixed timeline.",
  },
  {
    them: "Hand it over and walk away.",
    us: "We can keep it running and watching for you.",
  },
];

export default function AboutPage() {
  return (
    <ThemeShell>
      <PageHero
        eyebrow="About Novique"
        headline={
          <>
            We build AI products —
            <br />
            <span className="text-ink-2">and build them for you.</span>
          </>
        }
        subhead="Novique is a small studio that designs, ships, and operates its own AI software. We do the same work for small and mid-sized businesses, with a team that has already felt every production edge."
        intensity="hero"
        ctas={[
          { label: "Book a free call", href: "/consultation", variant: "primary" },
          { label: "See our work", href: "/work", variant: "ghost" },
        ]}
      />

      {/* Parent-brand framing — two lines of business under one roof */}
      <section className="mx-auto max-w-container px-6 py-16 md:py-24">
        <div className="grid gap-10 md:grid-cols-[1fr_360px] md:items-center">
          <div>
            <SectionHeading
              eyebrow="What Novique is"
              title="One studio, two lines of business."
              subhead="We split our time roughly 50/50: building and operating our own AI products, and building the same kind of software for clients. Each side sharpens the other — the products keep us honest about production, and client work keeps us close to real problems."
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="nv-card p-6">
                <h3 className="font-display text-dh3 text-ink-0">Our own products</h3>
                <p className="mt-2 text-sm text-ink-2">
                  Software we build, ship, and run ourselves — with real customers, real billing, and real uptime to defend.
                </p>
              </div>
              <div className="nv-card p-6">
                <h3 className="font-display text-dh3 text-ink-0">Built for clients</h3>
                <p className="mt-2 text-sm text-ink-2">
                  Custom AI and automation for small and mid-sized businesses — scoped small, shipped to production, kept running.
                </p>
              </div>
            </div>
          </div>
          <div className="group relative h-72">
            <IsoFigure variant="lattice" />
            <span className="absolute left-0 top-0 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-ink-3">
              FIG 01
            </span>
          </div>
        </div>
      </section>

      {/* Mission — the why, in builder voice */}
      <section className="mx-auto max-w-container px-6 pb-4">
        <div className="nv-card rounded-2xl p-8 md:p-12">
          <SectionHeading
            eyebrow="Why we exist"
            title="Level the playing field."
            size="dh2"
          />
          <div className="mt-6 max-w-reading space-y-5 text-body-lg text-ink-1">
            <p>
              Large companies have used AI to gain an advantage for years. Small and mid-sized businesses — the
              backbone of the economy — have mostly been locked out by complexity, cost, and corporate jargon.
            </p>
            <p>
              We started Novique to close that gap. The same powerful tools the Fortune 500 uses can be engineered to
              be cost-effective and genuinely useful for the rest of us — without a dedicated tech team or an
              enterprise budget.
            </p>
            <p className="text-ink-2">
              No corporate jargon. No hidden costs. Practical, working software that delivers real results.
            </p>
          </div>
        </div>
      </section>

      {/* Operating model (replaces fictional team) */}
      <section className="mx-auto max-w-container px-6 py-16 md:py-24">
        <SectionHeading
          eyebrow="How we operate"
          title="A small team, built to ship and run."
          subhead="Novique was founded by Mark Howell after roughly a decade at IBM solving large-scale technical problems for enterprises. The bet: that same capability, re-engineered for the businesses that never had access to it."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              k: "Founder-led, hands-on",
              v: "The person who scopes your work is the person who builds it. No layers, no handoff to a junior team you never met.",
            },
            {
              k: "We run what we build",
              v: "Operating our own products means we account for the boring, critical parts — billing, alerts, uptime — not just the demo.",
            },
            {
              k: "A product factory, not a one-off",
              v: "An internal toolchain takes an idea to a deployed, operated product. It's how a small team ships like a larger one.",
            },
          ].map((c) => (
            <div key={c.k} className="nv-card p-6">
              <h3 className="font-display text-dh3 text-ink-0">{c.k}</h3>
              <p className="mt-2 text-sm text-ink-2">{c.v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Proof — our live products */}
      <section className="mx-auto max-w-container px-6 pb-4">
        <SectionHeading
          eyebrow="Proof, not promises"
          title="We ship the real thing."
          subhead="These are our own products — the same kind of software we build for clients. The honest status of each is below."
        />
        <div className="mt-8 space-y-3">
          {PRODUCTS.map((p) => {
            const meta = statusMeta(p.status);
            return (
              <div
                key={p.slug}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-stroke-1 bg-surface-2 px-5 py-4"
              >
                <span className="font-display text-dh3 text-ink-0">{p.name}</span>
                <StatusTag label={meta.label} tone={meta.tone} />
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-ink-3">{p.line}</span>
                <span className="w-full text-sm text-ink-2 sm:w-auto sm:flex-1">{p.blurb}</span>
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-link hover:text-link-hover"
                  >
                    {p.url.replace(/^https?:\/\//, "")} ↗
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* What we can run for you */}
      <section className="mx-auto max-w-container px-6 py-16 md:py-24">
        <SectionHeading
          eyebrow="What we can run for you"
          title="The same systems, pointed at your business."
          subhead="These are operational competencies we use every day on our own products — and can stand up for you."
        />
        <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {SYSTEMS.map((s, i) => (
            <div key={s.title} className="flex gap-4 border-t border-stroke-1 pt-6">
              <span className="font-mono text-xs text-aqua">0{i + 1}</span>
              <div>
                <h3 className="font-display text-dh3 text-ink-0">{s.title}</h3>
                <p className="mt-1.5 text-sm text-ink-2">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How we're different */}
      <section className="mx-auto max-w-container px-6 pb-4">
        <SectionHeading
          eyebrow="How we're different"
          title="A typical AI consultant vs. Novique."
          align="center"
          className="mx-auto text-center"
        />
        <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border border-stroke-1">
          <div className="grid grid-cols-2 border-b border-stroke-1 bg-surface-1">
            <div className="px-5 py-4 font-mono text-xs uppercase tracking-[0.16em] text-ink-3">
              Typical consultant
            </div>
            <div className="border-l border-stroke-1 px-5 py-4 font-mono text-xs uppercase tracking-[0.16em] text-aqua">
              Novique
            </div>
          </div>
          {DIFFERENCE.map((row) => (
            <div key={row.us} className="grid grid-cols-2 border-b border-stroke-1 last:border-b-0">
              <div className="px-5 py-4 text-sm text-ink-2">{row.them}</div>
              <div className="flex gap-2 border-l border-stroke-1 bg-surface-2 px-5 py-4 text-sm text-ink-1">
                <span className="text-aqua" aria-hidden="true">
                  ✓
                </span>
                {row.us}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative mt-16 overflow-hidden border-y border-stroke-1 bg-surface-1 md:mt-24">
        <div className="relative mx-auto max-w-container px-6 py-20 text-center md:py-24">
          <h2 className="mx-auto max-w-2xl font-display text-dh1 text-ink-0">
            Tell us the task you wish would just handle itself.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-body-lg text-ink-2">
            The first call is free. We&apos;ll tell you straight whether AI is the right tool — and if it is, what the
            smallest version that proves value looks like.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <DarkButton href="/consultation" size="lg">
              Book a free call
            </DarkButton>
            <DarkButton href="/services" variant="ghost" size="lg">
              See what we can do
            </DarkButton>
          </div>
        </div>
      </section>
    </ThemeShell>
  );
}

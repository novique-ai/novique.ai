import Link from "next/link";
import ThemeShell from "@/components/marketing/ThemeShell";
import PageHero from "@/components/marketing/PageHero";
import SectionHeading from "@/components/marketing/SectionHeading";
import StatusTag from "@/components/marketing/StatusTag";
import DarkButton from "@/components/marketing/DarkButton";
import GraphicFrame from "@/components/graphics/GraphicFrame";
import SignalField from "@/components/graphics/SignalField";
import SplitFlowDiagram from "@/components/graphics/SplitFlowDiagram";
import IsoFigure from "@/components/graphics/IsoFigure";
import { TRACKS } from "@/lib/work/products";

export const metadata = {
  title: "Novique — Put AI to work in your business",
  description:
    "Novique builds custom AI and automation for small and mid-sized businesses — designed, built, and run for you. We operate our own AI products too, so you get a team that's shipped the real thing.",
};

// original isometric wireframe figures (our family, not Linear's shapes)
const TRACK_GRAPHICS = [
  <IsoFigure key="g0" variant="conduit" />,
  <IsoFigure key="g1" variant="orbit" />,
  <IsoFigure key="g2" variant="lattice" />,
];

export default function Home() {
  return (
    <ThemeShell>
      {/* Hero — capability-first */}
      <PageHero
        eyebrow="AI consulting + products"
        headline={
          <>
            Put AI to work
            <br />
            <span className="text-ink-2">in your business.</span>
          </>
        }
        subhead="We build custom AI and automation for small and mid-sized businesses — designed, built, and run for you. We operate our own AI products too, so you get a team that's shipped the real thing."
        ctas={[
          { label: "Book a free call", href: "/consultation", variant: "primary" },
          { label: "See what we can do", href: "/services", variant: "ghost" },
        ]}
      />

      {/* What we can do — FOCAL (open, frameless columns à la Linear FIG) */}
      <section className="mx-auto max-w-container px-6 py-16 md:py-24">
        <SectionHeading
          eyebrow="What we can do for you"
          title="Three ways we put AI to work"
          subhead="Start with one. Most engagements begin small, prove value, then scale."
        />
        <div className="mt-14 grid gap-x-10 gap-y-14 md:grid-cols-3 md:divide-x md:divide-stroke-1">
          {TRACKS.map((t, i) => (
            <div key={t.title} className="group flex flex-col md:px-9 md:first:pl-0 md:last:pr-0">
              <div className="relative mb-7 h-52">
                {TRACK_GRAPHICS[i]}
                <span className="absolute left-0 top-0 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-ink-3">
                  FIG 0{i + 1}
                </span>
              </div>
              <h3 className="font-display text-dh3 text-ink-0">{t.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{t.reassurance}</p>
              <div className="mt-5 flex items-center justify-between">
                <span className="font-mono text-xs text-ink-3">~{t.timeframe}</span>
                <Link href="/services" className="text-sm text-link hover:text-link-hover">
                  Learn more →
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-14 text-center">
          <DarkButton href="/consultation" size="lg">Tell us the task you wish would just handle itself</DarkButton>
        </div>
      </section>

      {/* How we work — quick reassurance */}
      <section className="mx-auto max-w-container px-6 pb-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { k: "Call", v: "A free call. We tell you straight if AI is the right tool." },
            { k: "Scope", v: "The smallest version that proves value — fixed price, fixed timeline." },
            { k: "Build", v: "Working software, not slides, the whole way." },
            { k: "Operate", v: "We can keep it running and watching, so it stays useful." },
          ].map((s, i) => (
            <div key={s.k} className="rounded-xl border border-stroke-1 bg-surface-1 p-5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-aqua">0{i + 1}</span>
                <h3 className="font-display text-dh3 text-ink-0">{s.k}</h3>
              </div>
              <p className="mt-2 text-sm text-ink-2">{s.v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Proof — products demoted to "we've shipped the real thing" */}
      <section className="mx-auto max-w-container px-6 py-20 md:py-24">
        <div className="grid items-center gap-10 md:grid-cols-[1fr_300px]">
          <div>
            <SectionHeading
              eyebrow="Proof, not promises"
              title="We don't just advise — we run our own AI products."
              subhead="The same team that builds yours ships and operates software in production today. So we've felt every edge we'd put you through."
            />
            <div className="mt-7 space-y-3">
              {/* LabelWatch — live */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-stroke-1 bg-surface-2 px-5 py-4">
                <span className="font-display text-dh3 text-ink-0">LabelWatch</span>
                <StatusTag label="Live now" tone="live" />
                <span className="text-sm text-ink-2">FDA recall intelligence for supplement brands.</span>
                <a href="https://label.watch" target="_blank" rel="noopener noreferrer" className="ml-auto text-sm text-link hover:text-link-hover">
                  label.watch ↗
                </a>
              </div>
              {/* In the works */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-stroke-1 bg-surface-1 px-5 py-4">
                <span className="font-display text-dh3 text-ink-1">In the works</span>
                <span className="inline-flex items-center gap-2 text-sm text-ink-2">LienSentry <StatusTag label="Waitlist" tone="soon" /></span>
                <span className="inline-flex items-center gap-2 text-sm text-ink-2">Glow Routine <StatusTag label="Coming soon" tone="soon" /></span>
                <Link href="/work" className="ml-auto text-sm text-link hover:text-link-hover">See our work →</Link>
              </div>
            </div>
          </div>
          <GraphicFrame height={240} className="nv-card rounded-2xl">
            <SplitFlowDiagram />
          </GraphicFrame>
        </div>
      </section>

      {/* Consulting CTA band */}
      <section className="relative overflow-hidden border-y border-stroke-1 bg-surface-1">
        <GraphicFrame className="absolute inset-0 opacity-50">
          <SignalField density={0.7} accentRatio={0.06} />
        </GraphicFrame>
        <div className="relative mx-auto max-w-container px-6 py-20 text-center md:py-24">
          <h2 className="mx-auto max-w-2xl font-display text-dh1 text-ink-0">What would you automate first?</h2>
          <p className="mx-auto mt-4 max-w-xl text-body-lg text-ink-2">
            Automate the repetitive, monitor the critical, ship something that runs. Start with a free call and a small, provable first step.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <DarkButton href="/consultation" size="lg">Book a free call</DarkButton>
            <DarkButton href="/services" variant="ghost" size="lg">See what we can do</DarkButton>
          </div>
        </div>
      </section>
    </ThemeShell>
  );
}

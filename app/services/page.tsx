import ThemeShell from "@/components/marketing/ThemeShell";
import PageHero from "@/components/marketing/PageHero";
import SectionHeading from "@/components/marketing/SectionHeading";
import DarkButton from "@/components/marketing/DarkButton";
import GraphicFrame from "@/components/graphics/GraphicFrame";
import IsoFigure from "@/components/graphics/IsoFigure";
import ProcessFlowLine from "@/components/graphics/ProcessFlowLine";
import SplitFlowDiagram from "@/components/graphics/SplitFlowDiagram";
import { TRACKS, PROCESS, AUDIENCE } from "@/lib/work/products";

export const metadata = {
  title: "Services — Novique",
  description:
    "AI that does the work you keep putting off. Novique builds custom automation and monitoring for small and mid-sized businesses — and can keep operating it.",
};

const TRACK_FIGS = [
  <IsoFigure key="s0" variant="conduit" />,
  <IsoFigure key="s1" variant="orbit" />,
  <IsoFigure key="s2" variant="lattice" />,
];

export default function ServicesPage() {
  return (
    <ThemeShell>
      <PageHero
        eyebrow="Services"
        headline="AI that does the work you keep putting off."
        subhead="We find the repetitive, error-prone, easy-to-miss parts of your business and build software that just handles them — then we can keep it running."
        intensity="soft"
        ctas={[
          { label: "Book a call", href: "/consultation", variant: "primary" },
          { label: "See pricing", href: "#pricing", variant: "ghost" },
        ]}
      />

      {/* Who this is for */}
      <section className="mx-auto max-w-container px-6 py-16 md:py-24">
        <div className="grid gap-10 md:grid-cols-[360px_1fr] md:items-center">
          <div className="group relative order-2 h-72 md:order-1">
            <IsoFigure variant="gantt" />
          </div>
          <div className="order-1 md:order-2">
            <SectionHeading eyebrow="Who this is for" title="If any of these sound like you, we should talk." />
            <ul className="mt-7 space-y-4">
              {AUDIENCE.map((line) => (
                <li key={line} className="flex gap-3 text-body-lg text-ink-1">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-aqua" aria-hidden="true" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Consulting tracks */}
      <section className="mx-auto max-w-container px-6 py-12 md:py-16">
        <SectionHeading
          eyebrow="What we do"
          title="Three ways we help"
          subhead="Start with one. Most engagements begin small and prove value before they scale."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {TRACKS.map((t, i) => (
            <div key={t.title} className="group nv-card flex flex-col p-6">
              <div className="relative mb-4 h-40">
                {TRACK_FIGS[i]}
                <span className="absolute left-0 top-0 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ink-3">
                  FIG 0{i + 1}
                </span>
              </div>
              <h3 className="font-display text-dh3 text-ink-0">{t.title}</h3>
              <p className="mt-2 text-sm text-ink-2">{t.reassurance}</p>
              <ul className="mt-5 space-y-2 border-t border-stroke-1 pt-5">
                {t.gets.map((g) => (
                  <li key={g} className="flex gap-2 text-sm text-ink-1">
                    <span className="text-aqua">✓</span>
                    {g}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-center justify-between border-t border-stroke-1 pt-4">
                <span className="font-mono text-xs text-ink-3">~{t.timeframe}</span>
                <a href="/consultation" className="text-sm text-link hover:text-link-hover">
                  Start here →
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How we work */}
      <section className="mx-auto max-w-container px-6 py-16 md:py-24">
        <SectionHeading eyebrow="How we work" title="Call → Scope → Build → Operate" align="center" className="mx-auto text-center" />
        <GraphicFrame height={64} className="mx-auto mt-8 max-w-3xl">
          <ProcessFlowLine />
        </GraphicFrame>
        <div className="mt-8 grid gap-6 md:grid-cols-4">
          {PROCESS.map((p, i) => (
            <div key={p.step} className="nv-card p-6">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-aqua">0{i + 1}</span>
                <h3 className="font-display text-dh3 text-ink-0">{p.step}</h3>
              </div>
              <p className="mt-2 text-sm text-ink-2">{p.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Novique */}
      <section className="mx-auto max-w-container px-6 py-16 md:py-24">
        <div className="grid items-center gap-10 md:grid-cols-[1fr_320px]">
          <div>
            <SectionHeading
              eyebrow="Why Novique"
              title="We don't just consult — we operate our own AI products."
              subhead="LabelWatch is live and charging customers today. The same team that built and runs it builds yours. We've felt every production edge we'd put you through."
            />
            <div className="mt-6">
              <DarkButton href="/work" variant="outline">See what we&apos;ve shipped</DarkButton>
            </div>
          </div>
          <GraphicFrame height={220} className="nv-card rounded-2xl">
            <SplitFlowDiagram />
          </GraphicFrame>
        </div>
      </section>

      {/* Pricing / engagement */}
      <section id="pricing" className="mx-auto max-w-container px-6 py-16 md:py-20">
        <div className="nv-card rounded-2xl p-8 text-center md:p-12">
          <h2 className="font-display text-dh2 text-ink-0">Pricing</h2>
          <p className="mx-auto mt-3 max-w-2xl text-body-lg text-ink-2">
            Most automation projects start small and prove value before they scale, so we scope and price each one on the call — no generic packages, no surprise invoices. The first call is free.
          </p>
          <div className="mt-7">
            <DarkButton href="/consultation" size="lg">Book a free call</DarkButton>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-stroke-1 bg-surface-1">
        <div className="relative mx-auto max-w-container px-6 py-20 text-center">
          <h2 className="mx-auto max-w-2xl font-display text-dh1 text-ink-0">
            Tell us the task you wish would just handle itself.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <DarkButton href="/consultation" size="lg">Book a call</DarkButton>
            <DarkButton href="/work" variant="ghost" size="lg">See our work</DarkButton>
          </div>
        </div>
      </section>
    </ThemeShell>
  );
}

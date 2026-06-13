import ThemeShell from "@/components/marketing/ThemeShell";
import PageHero from "@/components/marketing/PageHero";
import SectionHeading from "@/components/marketing/SectionHeading";
import StatusTag from "@/components/marketing/StatusTag";
import DarkButton from "@/components/marketing/DarkButton";
import WaitlistCapture from "@/components/marketing/WaitlistCapture";
import GraphicFrame from "@/components/graphics/GraphicFrame";
import RecallSignal from "@/components/graphics/RecallSignal";
import IsoFigure from "@/components/graphics/IsoFigure";
import SignalField from "@/components/graphics/SignalField";
import QueuedNodesRow from "@/components/graphics/QueuedNodesRow";
import { PRODUCTS, SYSTEMS, statusMeta } from "@/lib/work/products";

export const metadata = {
  title: "Work — Novique",
  description:
    "What Novique has shipped and what's next. One AI product live today (LabelWatch), more being built in the open — plus the systems we operate.",
};

const labelwatch = PRODUCTS.find((p) => p.slug === "labelwatch")!;
const liensentry = PRODUCTS.find((p) => p.slug === "liensentry")!;
const glow = PRODUCTS.find((p) => p.slug === "glow-routine")!;

const CASE = [
  { k: "The problem", v: "Dietary-supplement brands are liable for ingredients they don't manufacture. When the FDA posts a recall, the brands affected are often the last to know — and a missed recall is a legal and PR fire." },
  { k: "What we built", v: "A service that ingests the federal recall feeds every night, normalizes them, and matches each entry against a brand's catalog and competitors — alerting them the moment something lands." },
  { k: "The model", v: "A subscription SaaS at $39 / $99 / $299 a month on Stripe, live today at label.watch. Real customers, real billing." },
  { k: "We operate it", v: "We don't hand it off. The same team that built the recall pipeline runs it in production and watches it — which is exactly how we'd run something for you." },
];

export default function WorkPage() {
  return (
    <ThemeShell>
      <PageHero
        eyebrow="Portfolio"
        headline="What we've shipped — and what's next."
        subhead="One product live today, the rest being built in the open. No vaporware, no invented screenshots — just what's real, labeled honestly."
        ctas={[
          { label: "Book a call", href: "/consultation", variant: "primary" },
          { label: "How we work", href: "/services", variant: "ghost" },
        ]}
      />

      {/* LabelWatch case study */}
      <section className="mx-auto max-w-container px-6 py-16 md:py-24">
        <div className="nv-card overflow-hidden rounded-2xl">
          <GraphicFrame height={160} className="border-b border-stroke-1 bg-surface-1">
            <RecallSignal className="absolute inset-0" />
          </GraphicFrame>
          <div className="p-8 md:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-dh1 text-ink-0">{labelwatch.name}</h2>
              <StatusTag label="Live now" tone="live" />
            </div>
            <p className="mt-2 font-mono text-sm text-ink-3">SaaS product · label.watch</p>
            <div className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-2">
              {CASE.map((c) => (
                <div key={c.k}>
                  <h3 className="nv-eyebrow mb-2">{c.k}</h3>
                  <p className="text-ink-1">{c.v}</p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <DarkButton href="https://label.watch" external variant="outline">
                Visit label.watch ↗
              </DarkButton>
            </div>
          </div>
        </div>
      </section>

      {/* Coming work */}
      <section className="mx-auto max-w-container px-6 py-12 md:py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <SectionHeading eyebrow="Next up" title="Being built in the open" subhead="Honest status on each — no fabricated UI." />
          <QueuedNodesRow tones={["soon", "soon"]} className="hidden shrink-0 pb-2 md:flex" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <ComingCard name={liensentry.name} sub="SaaS product" meta={statusMeta(liensentry.status)} blurb={liensentry.blurb}>
            <WaitlistCapture product="LienSentry" />
          </ComingCard>
          <ComingCard name={glow.name} sub="App Store app · Shell Apps" meta={statusMeta(glow.status)} blurb={glow.blurb}>
            <span className="text-sm text-ink-3">Private by design — no account, no tracking, nothing leaves the device.</span>
          </ComingCard>
        </div>
      </section>

      {/* Systems we operate */}
      <section className="mx-auto max-w-container px-6 py-16 md:py-24">
        <div className="grid gap-10 md:grid-cols-[1fr_360px] md:items-center">
          <div>
            <SectionHeading
              eyebrow="Beyond the products"
              title="The systems we operate"
              subhead="Credibility isn't a logo wall. It's the production infrastructure we run every day — the same competencies we bring to your build."
            />
            <ul className="mt-8 space-y-5">
              {SYSTEMS.map((s) => (
                <li key={s.title} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-aqua" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-ink-0">{s.title}</p>
                    <p className="text-sm text-ink-2">{s.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="group relative h-[340px]">
            <IsoFigure variant="lattice" />
          </div>
        </div>
      </section>

      {/* Build-in-public note */}
      <section className="relative overflow-hidden border-y border-stroke-1 bg-surface-1">
        <GraphicFrame className="absolute inset-0 opacity-40">
          <SignalField density={0.6} accentRatio={0.05} />
        </GraphicFrame>
        <div className="relative mx-auto max-w-reading px-6 py-16 text-center">
          <p className="font-display text-dh2 text-ink-0 text-balance">
            We&apos;d rather show one product that&apos;s live than ten that are vapor.
          </p>
          <p className="mt-3 text-ink-2">This page grows as we ship.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-container px-6 py-20 text-center md:py-24">
        <h2 className="mx-auto max-w-2xl font-display text-dh1 text-ink-0">Want us to build the next one for you?</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <DarkButton href="/consultation" size="lg">Book a call</DarkButton>
          <DarkButton href="https://label.watch" external variant="ghost" size="lg">See LabelWatch</DarkButton>
        </div>
      </section>
    </ThemeShell>
  );
}

function ComingCard({
  name,
  sub,
  meta,
  blurb,
  children,
}: {
  name: string;
  sub: string;
  meta: { label: string; tone: "live" | "soon" };
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <div className="nv-card flex flex-col p-6">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h3 className="font-display text-dh3 text-ink-0">{name}</h3>
        <StatusTag label={meta.label} tone={meta.tone} />
      </div>
      <p className="mb-3 font-mono text-xs text-ink-3">{sub}</p>
      <p className="text-sm leading-relaxed text-ink-2">{blurb}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

import { Suspense } from "react";
import { redirect } from "next/navigation";
import ThemeShell from "@/components/marketing/ThemeShell";
import PageHero from "@/components/marketing/PageHero";
import SectionHeading from "@/components/marketing/SectionHeading";
import ROICalculatorForm from "@/components/roi-calculator/ROICalculatorForm";
import { Metadata } from "next";

type SegmentKey = "financial" | "healthcare" | "logistics" | "real-estate";
const SEGMENT_KEYS: SegmentKey[] = ["financial", "healthcare", "logistics", "real-estate"];

function isSegmentKey(value: string | null): value is SegmentKey {
  return !!value && SEGMENT_KEYS.includes(value as SegmentKey);
}

// Base ROI page is indexable, canonical is /roi
export const metadata: Metadata = {
  title: "AI Automation ROI Calculator | Novique.ai",
  description: "Calculate your potential savings from AI automation. See real ROI projections for your small business in under 2 minutes.",
  alternates: { canonical: "/roi" },
  robots: { index: true, follow: true },
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const METHOD = [
  {
    title: "Time savings",
    body: "We calculate hours saved per workflow based on industry benchmarks and your specific inputs.",
  },
  {
    title: "Fully loaded costs",
    body: "We factor in the true cost of labor — benefits, taxes, and overhead — not just base wage.",
  },
  {
    title: "Conservative defaults",
    body: "Our projections use conservative estimates. Real results often exceed these numbers.",
  },
];

export default async function ROICalculatorPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const segmentParamRaw = resolvedSearchParams?.segment;
  const segmentParam = Array.isArray(segmentParamRaw) ? segmentParamRaw[0] : segmentParamRaw ?? null;

  // Redirect query-based segment URLs to canonical path-based URLs
  if (isSegmentKey(segmentParam)) {
    redirect(`/roi/${segmentParam}`);
  }
  return (
    <ThemeShell>
      {/* Hero */}
      <PageHero
        eyebrow="ROI calculator"
        headline={
          <>
            Calculate your ROI
            <br />
            <span className="text-ink-2">from a Novique solution.</span>
          </>
        }
        subhead="See how much time and money AI automation could save your business. Answer a few questions and get a personalized ROI estimate in under 2 minutes."
        intensity="soft"
      />

      {/* Reassurance strip */}
      <section className="mx-auto max-w-container px-6 pb-2">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-[0.18em] text-ink-3">
          <span>No email required</span>
          <span className="text-stroke-2" aria-hidden="true">/</span>
          <span>No obligation</span>
          <span className="text-stroke-2" aria-hidden="true">/</span>
          <span>Estimate only</span>
        </div>
      </section>

      {/* Calculator */}
      <section className="mx-auto max-w-container px-6 py-12 md:py-16">
        <Suspense
          fallback={
            <div className="mx-auto max-w-6xl animate-pulse">
              <div className="h-96 rounded-2xl border border-stroke-1 bg-surface-2" />
            </div>
          }
        >
          <ROICalculatorForm />
        </Suspense>
      </section>

      {/* How we calculate */}
      <section className="mx-auto max-w-container px-6 py-16 md:py-24">
        <SectionHeading
          eyebrow="Methodology"
          title="How we calculate your ROI"
          align="center"
          className="mx-auto text-center"
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {METHOD.map((m, i) => (
            <div key={m.title} className="nv-card p-6">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-aqua">0{i + 1}</span>
                <h3 className="font-display text-dh3 text-ink-0">{m.title}</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{m.body}</p>
            </div>
          ))}
        </div>
      </section>
    </ThemeShell>
  );
}

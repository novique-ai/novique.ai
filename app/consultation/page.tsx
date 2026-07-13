import ThemeShell from "@/components/marketing/ThemeShell";
import PageHero from "@/components/marketing/PageHero";
import SectionHeading from "@/components/marketing/SectionHeading";
import GraphicFrame from "@/components/graphics/GraphicFrame";
import IsoFigure from "@/components/graphics/IsoFigure";
import ProcessFlowLine from "@/components/graphics/ProcessFlowLine";
import ConsultationForm from "@/components/ConsultationForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Free Consultation | Novique.ai",
  description:
    "Schedule your free AI consultation with Novique.ai. We'll discuss your business challenges and propose tailored solutions. No cost, no pressure.",
};

const EXPECT = [
  {
    variant: "radar" as const,
    title: "We listen",
    body: "Tell us about your business, your goals, and your current challenges.",
  },
  {
    variant: "orbit" as const,
    title: "We analyze",
    body: "We find the friction points where AI can make the biggest difference.",
  },
  {
    variant: "conduit" as const,
    title: "We propose",
    body: "You get tailored AI solutions designed specifically for your needs.",
  },
];

const PROCESS = [
  {
    step: "Book your slot",
    detail:
      "Fill out the form below with your preferred date and time. We meet virtually or in person, whichever you prefer.",
  },
  {
    step: "60-minute discovery session",
    detail:
      "We dig into how your business actually runs, understand your challenges, and find the spots where AI can help.",
  },
  {
    step: "Custom proposal",
    detail:
      "Within 48 hours you get a detailed proposal: recommended solutions, timeline, and pricing. No obligation to proceed.",
  },
  {
    step: "You decide",
    detail:
      "Take your time to review. If you're ready, we start building. If not, no hard feelings — we're here when you are.",
  },
];

const FAQ = [
  {
    q: "Is the consultation really free?",
    a: "Yes. No cost and no obligation. We'd rather show you the value before asking for any commitment.",
  },
  {
    q: "How long is the consultation?",
    a: "Typically 60 minutes — enough time to genuinely understand your business and give you recommendations worth acting on.",
  },
  {
    q: "Do I need to prepare anything?",
    a: "Just come ready to talk about your business. It helps to think about your biggest pain points and what you wish could be automated or improved.",
  },
  {
    q: "What if I'm not ready to commit after the call?",
    a: "That's completely fine. There's zero pressure — plenty of clients take weeks or months to decide. We're here when you're ready.",
  },
];

export default function ConsultationPage() {
  return (
    <ThemeShell>
      {/* Hero */}
      <PageHero
        eyebrow="Free consultation"
        headline={
          <>
            Book your free call.
            <br />
            <span className="text-ink-2">No cost. No pressure.</span>
          </>
        }
        subhead="An honest conversation about how AI can help your business — and a straight answer on whether it's even the right tool for the job."
        ctas={[{ label: "Jump to the form", href: "#book", variant: "primary" }]}
      />

      {/* What to expect */}
      <section className="mx-auto max-w-container px-6 py-16 md:py-24">
        <SectionHeading
          eyebrow="What to expect"
          title="What happens on the call"
          subhead="One conversation, three things. No slide decks, no sales script."
          align="center"
          className="mx-auto text-center"
        />
        <div className="mt-14 grid gap-x-10 gap-y-14 md:grid-cols-3 md:divide-x md:divide-stroke-1">
          {EXPECT.map((e, i) => (
            <div key={e.title} className="group flex flex-col md:px-9 md:first:pl-0 md:last:pr-0">
              <div className="relative mb-7 h-44">
                <IsoFigure variant={e.variant} />
                <span className="absolute left-0 top-0 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-ink-3">
                  FIG 0{i + 1}
                </span>
              </div>
              <h3 className="font-display text-dh3 text-ink-0">{e.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{e.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The process */}
      <section className="mx-auto max-w-container px-6 py-12 md:py-16">
        <SectionHeading
          eyebrow="The process"
          title="From first call to working software"
          subhead="A clear path, with a decision point that's always yours."
        />
        <GraphicFrame height={64} className="mt-8 max-w-3xl">
          <ProcessFlowLine />
        </GraphicFrame>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PROCESS.map((p, i) => (
            <div key={p.step} className="nv-card p-6">
              <span className="font-mono text-xs text-aqua">0{i + 1}</span>
              <h3 className="mt-2 font-display text-lg font-semibold tracking-tight text-ink-0">{p.step}</h3>
              <p className="mt-2 text-sm text-ink-2">{p.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Booking form */}
      <section id="book" className="mx-auto max-w-container px-6 py-16 md:py-24">
        <div className="mx-auto max-w-2xl">
          <SectionHeading
            eyebrow="Book a call"
            title="Schedule your free consultation"
            subhead="Fill out the form and we'll be in touch within 24 hours to confirm your time."
            align="center"
            className="mx-auto text-center"
          />
          <div className="nv-card mt-10 rounded-2xl p-6 md:p-8">
            <ConsultationForm />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-container px-6 pb-20 md:pb-28">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions, answered"
          align="center"
          className="mx-auto text-center"
        />
        <div className="mx-auto mt-10 max-w-3xl space-y-4">
          {FAQ.map((item) => (
            <div key={item.q} className="nv-card p-6">
              <h3 className="font-display text-dh3 text-ink-0">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </ThemeShell>
  );
}

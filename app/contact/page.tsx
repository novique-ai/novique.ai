import Link from "next/link";
import ThemeShell from "@/components/marketing/ThemeShell";
import PageHero from "@/components/marketing/PageHero";
import SectionHeading from "@/components/marketing/SectionHeading";
import ContactForm from "@/components/ContactForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Novique.ai | Get in Touch",
  description: "Have questions about AI for your small business? Contact Novique.ai today. We're here to help!",
};

const FAQS = [
  {
    q: "How long does it take to get started?",
    a: "After your free consultation, most projects can begin within 1-2 weeks, depending on complexity and your schedule.",
  },
  {
    q: "What does the free consultation include?",
    a: "A 60-minute meeting (virtual or in-person) where we discuss your business, identify pain points, and propose tailored AI solutions – with zero obligation.",
  },
  {
    q: "Do you work with all industries?",
    a: "Yes! We've worked with retail, restaurants, professional services, healthcare, and many other industries. Every solution is custom-tailored.",
  },
];

export default function ContactPage() {
  return (
    <ThemeShell>
      <PageHero
        eyebrow="Contact"
        headline={
          <>
            Let&apos;s talk about
            <br />
            <span className="text-ink-2">your business.</span>
          </>
        }
        subhead="Have questions? Want to learn more? We're here to help."
        intensity="soft"
      />

      {/* Contact content */}
      <section className="mx-auto max-w-container px-6 py-16 md:py-24">
        <div className="grid gap-12 md:grid-cols-2">
          {/* Contact info */}
          <div>
            <SectionHeading
              eyebrow="Get in touch"
              title="Reach us directly"
              subhead="Whether you have questions about our services, want to discuss your specific needs, or are ready to book your free consultation, we'd love to hear from you."
            />

            {/* Contact details */}
            <div className="mt-9 space-y-5">
              <div className="flex items-start gap-4 rounded-xl border border-stroke-1 bg-surface-2 px-5 py-4">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stroke-1 bg-surface-3" aria-hidden="true">
                  <svg className="h-5 w-5 text-aqua" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-display text-dh3 text-ink-0">Phone</h3>
                  <a href="tel:+18334560671" className="mt-1 inline-block text-link hover:text-link-hover">
                    1 (833) 456-0671
                  </a>
                  <p className="mt-1 text-sm text-ink-2">Toll-free, leave a voicemail anytime</p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-xl border border-stroke-1 bg-surface-2 px-5 py-4">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stroke-1 bg-surface-3" aria-hidden="true">
                  <svg className="h-5 w-5 text-aqua" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-display text-dh3 text-ink-0">Email</h3>
                  <a href="mailto:sales@novique.ai" className="mt-1 inline-block text-link hover:text-link-hover">
                    sales@novique.ai
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-xl border border-stroke-1 bg-surface-2 px-5 py-4">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stroke-1 bg-surface-3" aria-hidden="true">
                  <svg className="h-5 w-5 text-aqua" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-display text-dh3 text-ink-0">Response time</h3>
                  <p className="mt-1 text-sm text-ink-2">We typically respond within 24 hours.</p>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="mt-8 border-t border-stroke-1 pt-6">
              <p className="nv-eyebrow mb-4">Quick links</p>
              <ul className="space-y-3">
                <li>
                  <Link href="/roi" className="inline-flex items-center gap-2 text-link hover:text-link-hover">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Novique Solution ROI Calculator
                  </Link>
                </li>
                <li>
                  <Link href="/consultation" className="inline-flex items-center gap-2 text-link hover:text-link-hover">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Book a Consultation
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact form */}
          <div className="nv-card p-8">
            <h2 className="font-display text-dh2 text-ink-0">Send us a message</h2>
            <p className="mt-2 text-sm text-ink-2">Tell us about your business and we&apos;ll get back to you.</p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-container px-6 pb-20 md:pb-28">
        <SectionHeading eyebrow="FAQ" title="Quick answers" align="center" className="mx-auto text-center" />
        <div className="mx-auto mt-10 max-w-3xl space-y-4">
          {FAQS.map((item) => (
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

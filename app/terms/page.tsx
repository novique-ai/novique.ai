import ThemeShell from "@/components/marketing/ThemeShell";
import PageHero from "@/components/marketing/PageHero";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Novique.ai",
  description: "Novique.ai terms of service. Read our terms and conditions.",
};

export default function TermsPage() {
  return (
    <ThemeShell>
      <PageHero
        eyebrow="Legal"
        headline="Terms of Service"
        subhead="The terms and conditions that govern your use of novique.ai."
        intensity="soft"
        align="left"
      />

      <section className="mx-auto max-w-container px-6 pb-20 md:pb-28">
        <div className="prose prose-invert max-w-reading prose-a:text-link prose-headings:font-display prose-headings:text-ink-0 prose-h2:text-dh3">
          <p className="font-mono text-sm text-ink-2">Last updated: December 13, 2025</p>

          <h2>Agreement to Terms</h2>
          <p>
            By accessing or using novique.ai, you agree to be bound by these Terms of Service.
            If you disagree with any part of these terms, you may not access our services.
          </p>

          <h2>Services</h2>
          <p>
            Novique.ai provides AI consulting and implementation services for small businesses.
            Our services include:
          </p>
          <ul>
            <li>Free initial consultations</li>
            <li>Custom AI solution design and implementation</li>
            <li>Ongoing support and maintenance</li>
            <li>Training and documentation</li>
          </ul>

          <h2>User Responsibilities</h2>
          <p>You agree to:</p>
          <ul>
            <li>Provide accurate and complete information</li>
            <li>Maintain the confidentiality of any account credentials</li>
            <li>Use our services only for lawful purposes</li>
            <li>Not interfere with or disrupt our services</li>
          </ul>

          <h2>Intellectual Property</h2>
          <p>
            All content, features, and functionality on novique.ai are owned by Novique.ai
            and are protected by copyright, trademark, and other intellectual property laws.
          </p>

          <h2>Limitation of Liability</h2>
          <p>
            Novique.ai shall not be liable for any indirect, incidental, special, consequential,
            or punitive damages resulting from your use or inability to use our services.
          </p>

          <h2>Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will notify users of
            any material changes via email or website notice.
          </p>

          <h2>Contact Information</h2>
          <p>For questions about these Terms of Service, please contact us at:</p>
          <p>
            Email: <a href="mailto:legal@novique.ai">legal@novique.ai</a>
            <br />
            Phone: <a href="tel:+18334560671">1 (833) 456-0671</a>
          </p>
        </div>
      </section>
    </ThemeShell>
  );
}

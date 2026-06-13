import ThemeShell from "@/components/marketing/ThemeShell";
import PageHero from "@/components/marketing/PageHero";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Novique.ai",
  description: "Novique.ai privacy policy. Learn how we protect and handle your data.",
};

export default function PrivacyPage() {
  return (
    <ThemeShell>
      <PageHero
        eyebrow="Legal"
        headline="Privacy Policy"
        subhead="How we collect, use, and safeguard your information."
        intensity="soft"
        align="left"
      />

      <section className="mx-auto max-w-container px-6 pb-20 md:pb-28">
        <div className="prose prose-invert max-w-reading prose-a:text-link prose-headings:font-display prose-headings:text-ink-0 prose-h2:text-dh3">
          <p className="font-mono text-sm text-ink-2">Last updated: December 13, 2025</p>

          <h2>Introduction</h2>
          <p>
            At Novique.ai, we take your privacy seriously. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you visit our website
            or use our services.
          </p>

          <h2>Information We Collect</h2>
          <p>We collect information that you provide directly to us, including:</p>
          <ul>
            <li>Name, email address, phone number, and business information when you contact us or book a consultation</li>
            <li>Communication preferences and feedback</li>
            <li>Any other information you choose to provide</li>
          </ul>

          <h2>How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our services</li>
            <li>Respond to your inquiries and schedule consultations</li>
            <li>Send you updates, marketing communications, and other information (with your consent)</li>
            <li>Analyze usage patterns and improve our website</li>
          </ul>

          <h2>Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your
            personal information against unauthorized access, alteration, disclosure, or destruction.
          </p>

          <h2>Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access and receive a copy of your personal data</li>
            <li>Correct inaccurate or incomplete data</li>
            <li>Request deletion of your personal data</li>
            <li>Opt-out of marketing communications</li>
          </ul>

          <h2>Contact Us</h2>
          <p>If you have questions about this Privacy Policy, please contact us at:</p>
          <p>
            Email: <a href="mailto:privacy@novique.ai">privacy@novique.ai</a>
            <br />
            Phone: <a href="tel:+18334560671">1 (833) 456-0671</a>
          </p>
        </div>
      </section>
    </ThemeShell>
  );
}

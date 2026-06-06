import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Section from "@/components/Section";
import {
  getApp,
  getAllApps,
  appPath,
  appUrl,
} from "@/lib/apps/registry";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllApps().map((app) => ({ slug: app.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const app = getApp(slug);
  if (!app) return {};

  const title = `${app.appStoreName} Support | Novique.ai`;
  const description = `Get help with ${app.appStoreName}: contact support, restore purchases, report a bug, and request features.`;
  return {
    title,
    description,
    alternates: { canonical: appPath(app.slug, "support") },
    openGraph: {
      title: `${app.appStoreName} Support`,
      description,
      type: "website",
      url: appUrl(app.slug, "support"),
    },
  };
}

/** Render a body string as paragraphs, splitting on blank lines. */
function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split("\n\n").map((para, i) => (
        <p key={i} className="mt-3 text-gray-700 first:mt-0">
          {para}
        </p>
      ))}
    </>
  );
}

export default async function AppSupportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const app = getApp(slug);
  if (!app) notFound();

  return (
    <>
      <Header />
      <main>
        <Section background="white" className="pt-32">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm font-medium uppercase tracking-wide text-primary-600">
              {app.appStoreName}
            </p>
            <h1 className="mt-2 text-4xl font-bold text-primary-900">Support</h1>
            <p className="mt-4 text-lg text-gray-600">
              Need help with {app.appStoreName}? Email{" "}
              <a
                href={`mailto:${app.supportEmail}`}
                className="text-primary-600 hover:underline"
              >
                {app.supportEmail}
              </a>{" "}
              and we&apos;ll get back to you, usually within two business days.
            </p>

            <div className="mt-12 space-y-10">
              {app.support.sections.map((section) => (
                <section key={section.title}>
                  <h2 className="text-2xl font-bold text-primary-900">
                    {section.title}
                  </h2>
                  <div className="mt-3">
                    <Paragraphs text={section.body} />
                  </div>
                </section>
              ))}

              <section>
                <h2 className="text-2xl font-bold text-primary-900">
                  Privacy questions
                </h2>
                <p className="mt-3 text-gray-700">
                  For anything about your data, see the{" "}
                  <Link
                    href={appPath(app.slug, "privacy")}
                    className="text-primary-600 hover:underline"
                  >
                    {app.appStoreName} Privacy Policy
                  </Link>{" "}
                  or email{" "}
                  <a
                    href={`mailto:${app.privacyContactEmail}`}
                    className="text-primary-600 hover:underline"
                  >
                    {app.privacyContactEmail}
                  </a>
                  .
                </p>
              </section>
            </div>

            <div className="mt-12 border-t border-gray-200 pt-8 text-sm text-gray-500">
              {app.copyrightOwner} ·{" "}
              <Link href={appPath(app.slug)} className="hover:underline">
                {app.appStoreName}
              </Link>{" "}
              ·{" "}
              <Link href={appPath(app.slug, "privacy")} className="hover:underline">
                Privacy
              </Link>
            </div>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}

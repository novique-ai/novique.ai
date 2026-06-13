import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import AppDocHeader from "@/components/apps/AppDocHeader";
import { getApp, getAllApps, appPath, appUrl } from "@/lib/apps/registry";

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
      images: [{ url: app.icon.src1024, width: 1024, height: 1024 }],
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

  const b = app.brand;

  return (
    <>
      <SiteHeader solid />
      <main style={{ backgroundColor: b.bg }}>
        <div className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
          <div
            className="rounded-[2rem] border bg-white p-8 sm:p-12"
            style={{ borderColor: b.cardBorder }}
          >
            <AppDocHeader app={app} title="Support" />

            <p className="mt-4 text-lg text-gray-600">
              Need help with {app.appStoreName}? Email{" "}
              <a
                href={`mailto:${app.supportEmail}`}
                className="font-medium hover:underline"
                style={{ color: b.accent }}
              >
                {app.supportEmail}
              </a>{" "}
              and we&apos;ll get back to you, usually within two business days.
            </p>

            <div className="mt-12 space-y-10">
              {app.support.sections.map((section) => (
                <section key={section.title}>
                  <h2 className="text-2xl font-bold" style={{ color: b.ink }}>
                    {section.title}
                  </h2>
                  <div className="mt-3">
                    <Paragraphs text={section.body} />
                  </div>
                </section>
              ))}

              <section>
                <h2 className="text-2xl font-bold" style={{ color: b.ink }}>
                  Privacy questions
                </h2>
                <p className="mt-3 text-gray-700">
                  For anything about your data, see the{" "}
                  <Link
                    href={appPath(app.slug, "privacy")}
                    className="font-medium hover:underline"
                    style={{ color: b.accent }}
                  >
                    {app.appStoreName} Privacy Policy
                  </Link>{" "}
                  or email{" "}
                  <a
                    href={`mailto:${app.privacyContactEmail}`}
                    className="font-medium hover:underline"
                    style={{ color: b.accent }}
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
              <Link
                href={appPath(app.slug, "privacy")}
                className="hover:underline"
              >
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

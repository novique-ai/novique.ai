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
  statusLabel,
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

  const title = `${app.appStoreName} | Novique.ai`;
  const description = app.shortDescription;
  return {
    title,
    description,
    alternates: { canonical: appPath(app.slug) },
    openGraph: {
      title: app.appStoreName,
      description,
      type: "website",
      url: appUrl(app.slug),
    },
  };
}

const PLATFORM_LABELS: Record<string, string> = {
  ios: "iOS",
  android: "Android",
  web: "Web",
};

export default async function AppLandingPage({
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
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
                {app.platforms.map((p) => PLATFORM_LABELS[p] ?? p).join(" · ")}
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                {statusLabel(app.status)}
              </span>
            </div>

            <h1 className="mt-6 text-4xl font-bold text-primary-900">
              {app.appStoreName}
            </h1>
            <p className="mt-2 text-xl text-gray-600">{app.subtitle}</p>

            <p className="mt-8 text-lg leading-relaxed text-gray-700">
              {app.landingCopy}
            </p>

            {app.appStoreUrl ? (
              <div className="mt-8">
                <a
                  href={app.appStoreUrl}
                  className="inline-flex items-center rounded-lg bg-primary-900 px-5 py-3 font-medium text-white transition-colors hover:bg-primary-800"
                >
                  Download on the App Store
                </a>
              </div>
            ) : (
              <p className="mt-8 text-gray-500">
                {statusLabel(app.status)} on the App Store.
              </p>
            )}

            <div className="mt-12 flex flex-wrap gap-4 border-t border-gray-200 pt-8">
              <Link
                href={appPath(app.slug, "support")}
                className="font-medium text-primary-600 hover:underline"
              >
                Support
              </Link>
              <span className="text-gray-300">·</span>
              <Link
                href={appPath(app.slug, "privacy")}
                className="font-medium text-primary-600 hover:underline"
              >
                Privacy Policy
              </Link>
              <span className="text-gray-300">·</span>
              <a
                href={`mailto:${app.supportEmail}`}
                className="font-medium text-primary-600 hover:underline"
              >
                {app.supportEmail}
              </a>
            </div>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}

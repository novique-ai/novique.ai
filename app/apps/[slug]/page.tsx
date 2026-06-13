import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import Section from "@/components/Section";
import PhoneMockup from "@/components/apps/PhoneMockup";
import {
  getApp,
  getAllApps,
  appPath,
  appUrl,
  statusLabel,
  type NoviqueApp,
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
      images: [{ url: app.icon.src1024, width: 1024, height: 1024 }],
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

  return app.landing ? <ThemedLanding app={app} /> : <SimpleLanding app={app} />;
}

/* ---------------------------------------------------------------- themed --- */

function ThemedLanding({ app }: { app: NoviqueApp }) {
  const b = app.brand;
  const l = app.landing!;

  return (
    <>
      <SiteHeader solid />
      <main
        className="relative overflow-hidden"
        style={{ backgroundColor: b.bg }}
      >
        {/* ambient glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, ${b.accent}33, transparent 70%)`,
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -right-32 h-[460px] w-[460px] rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, ${b.sage}33, transparent 70%)`,
          }}
        />

        <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
          {/* hero image */}
          <div
            className="overflow-hidden rounded-[2rem] border shadow-sm"
            style={{ borderColor: b.cardBorder }}
          >
            <Image
              src={l.hero.src}
              alt={l.hero.alt}
              width={1408}
              height={768}
              className="h-auto w-full object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 960px"
            />
          </div>

          {/* eyebrow + icon + status */}
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Image
              src={app.icon.src}
              alt={app.icon.alt}
              width={56}
              height={56}
              className="rounded-[14px] ring-1 ring-black/5"
            />
            <span className="text-lg font-bold" style={{ color: b.eyebrow }}>
              {l.eyebrow}
            </span>
            <span
              className="rounded-full px-3 py-1 text-sm font-medium"
              style={{ backgroundColor: b.surface, color: b.body }}
            >
              {app.platforms.map((p) => PLATFORM_LABELS[p] ?? p).join(" · ")} ·{" "}
              {statusLabel(app.status)}
            </span>
          </div>

          <h1
            className="mt-6 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl"
            style={{ color: b.ink }}
          >
            {l.headline}
          </h1>
          <p
            className="mt-5 max-w-2xl text-lg sm:text-xl"
            style={{ color: b.body }}
          >
            {l.subcopy}
          </p>

          {app.appStoreUrl ? (
            <a
              href={app.appStoreUrl}
              className="mt-8 inline-flex items-center rounded-xl px-5 py-3 font-semibold"
              style={{ backgroundColor: b.accent, color: b.accentInk }}
            >
              Download on the App Store
            </a>
          ) : (
            <p className="mt-8 font-medium" style={{ color: b.muted }}>
              {statusLabel(app.status)} on the App Store.
            </p>
          )}

          {/* showcase: setup card + phone mockup */}
          <div className="mt-16 grid gap-8 md:grid-cols-2 md:items-center">
            <div
              className="rounded-[2rem] border p-8"
              style={{ backgroundColor: b.surface, borderColor: b.cardBorder }}
            >
              <h2 className="text-3xl font-bold" style={{ color: b.ink }}>
                {l.setupCard.title}
              </h2>
              <p
                className="mt-4 text-lg leading-relaxed"
                style={{ color: b.body }}
              >
                {l.setupCard.body}
              </p>
            </div>

            <PhoneMockup
              brand={b}
              preview={l.preview}
              appName={app.displayName}
            />
          </div>

          {/* safety strip */}
          <div
            className="mt-16 rounded-3xl border px-6 py-5 text-center"
            style={{ backgroundColor: b.softCard, borderColor: b.softBorder }}
          >
            <p className="font-semibold" style={{ color: b.eyebrow }}>
              {l.safetyStrip}
            </p>
          </div>

          {/* nav */}
          <div
            className="mt-12 flex flex-wrap gap-4 border-t pt-8"
            style={{ borderColor: b.cardBorder }}
          >
            <Link
              href={appPath(app.slug, "support")}
              className="font-medium hover:underline"
              style={{ color: b.accent }}
            >
              Support
            </Link>
            <span style={{ color: b.muted }}>·</span>
            <Link
              href={appPath(app.slug, "privacy")}
              className="font-medium hover:underline"
              style={{ color: b.accent }}
            >
              Privacy Policy
            </Link>
            <span style={{ color: b.muted }}>·</span>
            <a
              href={`mailto:${app.supportEmail}`}
              className="font-medium hover:underline"
              style={{ color: b.accent }}
            >
              {app.supportEmail}
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

/* ---------------------------------------------------------------- simple --- */

function SimpleLanding({ app }: { app: NoviqueApp }) {
  return (
    <>
      <SiteHeader solid />
      <main>
        <Section background="white" className="pt-32">
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <Image
                src={app.icon.src}
                alt={app.icon.alt}
                width={48}
                height={48}
                className="rounded-[12px] ring-1 ring-black/5"
              />
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
      <SiteFooter />
    </>
  );
}

import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import ThemeShell from "@/components/marketing/ThemeShell";
import PageHero from "@/components/marketing/PageHero";
import StatusTag from "@/components/marketing/StatusTag";
import { getAllApps, appPath, statusLabel } from "@/lib/apps/registry";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Apps | Novique.ai",
  description:
    "Novique mobile apps. Private, well-made tools with support and privacy information for each release.",
  alternates: { canonical: "/apps" },
  openGraph: {
    title: "Novique Apps",
    description:
      "Private, well-made mobile tools from Novique — with clear support and privacy information.",
    type: "website",
  },
};

export default function AppsIndexPage() {
  const apps = getAllApps();

  return (
    <ThemeShell>
      <PageHero
        eyebrow="Apps"
        headline="Novique Apps"
        subhead="Private, well-made mobile tools. Every app has its own support and privacy page."
      />
      <section className="mx-auto max-w-container px-6 pb-24">
        <ul className="grid gap-5 sm:grid-cols-2">
          {apps.map((app) => (
            <li key={app.slug}>
              <Link
                href={appPath(app.slug)}
                className="nv-card group flex gap-5 p-6 transition-colors duration-300 hover:border-stroke-2"
              >
                <Image
                  src={app.icon.src}
                  alt={app.icon.alt}
                  width={72}
                  height={72}
                  className="h-[72px] w-[72px] shrink-0 rounded-[16px] ring-1 ring-white/10"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h2 className="font-display text-dh3 text-ink-0">{app.appStoreName}</h2>
                    <StatusTag
                      label={statusLabel(app.status)}
                      tone={app.status === "available" ? "live" : "soon"}
                    />
                  </div>
                  <p className="mt-2 text-sm text-ink-2">{app.subtitle}</p>
                  <p className="mt-2 text-sm text-ink-1">{app.shortDescription}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </ThemeShell>
  );
}

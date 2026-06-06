import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Section from "@/components/Section";
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
    <>
      <Header />
      <main>
        <Section background="white" className="pt-32">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-primary-900 mb-4">Novique Apps</h1>
            <p className="text-lg text-gray-600 mb-12">
              Private, well-made mobile tools. Every app has its own support and
              privacy page below.
            </p>

            <ul className="space-y-6">
              {apps.map((app) => (
                <li key={app.slug}>
                  <Link
                    href={appPath(app.slug)}
                    className="flex gap-5 rounded-xl border border-gray-200 p-6 transition-colors hover:border-primary-300 hover:bg-gray-50"
                  >
                    <Image
                      src={app.icon.src}
                      alt={app.icon.alt}
                      width={72}
                      height={72}
                      className="h-[72px] w-[72px] shrink-0 rounded-[16px] ring-1 ring-black/5"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <h2 className="text-2xl font-bold text-primary-900">
                          {app.appStoreName}
                        </h2>
                        <span className="shrink-0 rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
                          {statusLabel(app.status)}
                        </span>
                      </div>
                      <p className="mt-2 text-gray-600">{app.subtitle}</p>
                      <p className="mt-3 text-gray-700">{app.shortDescription}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}

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

  const title = `${app.appStoreName} Privacy Policy | Novique.ai`;
  const description = `Privacy policy for ${app.appStoreName}: no account, no tracking, no analytics, no cloud sync. Your data stays on your device.`;
  return {
    title,
    description,
    alternates: { canonical: appPath(app.slug, "privacy") },
    openGraph: {
      title: `${app.appStoreName} Privacy Policy`,
      description,
      type: "website",
      url: appUrl(app.slug, "privacy"),
      images: [{ url: app.icon.src1024, width: 1024, height: 1024 }],
    },
  };
}

export default async function AppPrivacyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const app = getApp(slug);
  if (!app) notFound();

  const p = app.privacy;
  const b = app.brand;
  const h2 = "text-2xl font-bold";

  return (
    <>
      <SiteHeader solid />
      <main style={{ backgroundColor: b.bg }}>
        <div className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
          <div
            className="rounded-[2rem] border bg-white p-8 sm:p-12"
            style={{ borderColor: b.cardBorder }}
          >
            <AppDocHeader app={app} title="Privacy Policy" />

            <p className="mt-4 text-gray-600">
              Effective date: {p.effectiveDate} · {app.appStoreName} is owned and
              operated by {app.copyrightOwner}.
            </p>

            <div className="mt-10 space-y-8">
              <section>
                <h2 className={h2} style={{ color: b.ink }}>
                  The short version
                </h2>
                <p className="mt-3 text-gray-700">
                  {app.displayName} is built to keep your information private. It
                  works entirely on your device. We don&apos;t make you create an
                  account, we don&apos;t track you, and we don&apos;t collect your
                  routine data, notes, or photos.
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-700">
                  {p.claims.map((claim) => (
                    <li key={claim}>{claim}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className={h2} style={{ color: b.ink }}>
                  Information stored on your device
                </h2>
                <p className="mt-3 text-gray-700">
                  Everything you create in {app.displayName} — your AM/PM
                  routines, product names, notes, checklist history, and progress
                  photos — is stored locally on your device. It stays there. We
                  have no servers that receive or store this information.
                </p>
              </section>

              <section>
                <h2 className={h2} style={{ color: b.ink }}>
                  Information we do not collect
                </h2>
                <p className="mt-3 text-gray-700">
                  {app.copyrightOwner} does not collect, receive, sell, or share
                  your personal information. Specifically, we do not collect your
                  routine data, notes, product names, checklist history, or
                  progress photos, and there is no account, email, or profile tied
                  to your use of the app.
                </p>
              </section>

              {(p.usesCamera || p.usesPhotoLibrary) && (
                <section>
                  <h2 className={h2} style={{ color: b.ink }}>
                    Camera and photos
                  </h2>
                  <p className="mt-3 text-gray-700">
                    {app.displayName} can ask for permission to use your camera
                    and photo library so you can add progress photos to your
                    journal. These photos are saved locally on your device and are
                    never uploaded to {app.copyrightOwner} or any third party. You
                    can decline these permissions and still use the rest of the
                    app.
                  </p>
                </section>
              )}

              {p.usesStoreKit && (
                <section>
                  <h2 className={h2} style={{ color: b.ink }}>
                    Purchases
                  </h2>
                  <p className="mt-3 text-gray-700">
                    Any in-app purchases are processed by Apple through the App
                    Store. {app.copyrightOwner} does not receive or store your
                    payment details. Apple&apos;s handling of that transaction is
                    governed by Apple&apos;s privacy policy.
                  </p>
                </section>
              )}

              <section>
                <h2 className={h2} style={{ color: b.ink }}>
                  No tracking
                </h2>
                <p className="mt-3 text-gray-700">
                  {app.displayName} does not track you across apps or websites and
                  does not use advertising identifiers.
                  {!p.thirdPartyAnalytics &&
                    ` It also does not use third-party analytics or advertising SDKs.`}
                </p>
              </section>

              <section>
                <h2 className={h2} style={{ color: b.ink }}>
                  Children
                </h2>
                <p className="mt-3 text-gray-700">
                  {app.displayName} is not directed to children, and because the
                  app collects no personal information from anyone, it collects no
                  personal information from children.
                </p>
              </section>

              <section>
                <h2 className={h2} style={{ color: b.ink }}>
                  Changes to this policy
                </h2>
                <p className="mt-3 text-gray-700">
                  If we change how {app.displayName} handles information, we will
                  update this page and revise the effective date above. Material
                  changes will be reflected here before they take effect.
                </p>
              </section>

              <section>
                <h2 className={h2} style={{ color: b.ink }}>
                  Contact
                </h2>
                <p className="mt-3 text-gray-700">
                  Questions about your privacy? Email{" "}
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
                href={appPath(app.slug, "support")}
                className="hover:underline"
              >
                Support
              </Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

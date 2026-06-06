/**
 * Novique mobile apps registry.
 *
 * Single source of truth for the `/apps/<slug>/` page family (landing, support,
 * privacy). Each App Store app gets one entry here; the routes under
 * `app/apps/[slug]/` are generated from this data so adding a new app is a
 * data-only change.
 *
 * App Store Connect requires a public, stable, no-auth support URL and privacy
 * policy URL per app. The canonical public host is www.novique.ai (the apex
 * 307-redirects to www), so all final URLs use that form.
 *
 * Plan of record: Notion "Create Novique App Page for Glow Routine Journal"
 * (novique-app-pages-plan.json).
 */

export const SITE_URL = "https://www.novique.ai";

export type AppPlatform = "ios" | "android" | "web";

export type AppStatus = "pre-release" | "testflight" | "available" | "retired";

/** A single support topic rendered on the support page. */
export interface SupportSection {
  title: string;
  /** Plain-language body. Paragraphs split on blank lines at render time. */
  body: string;
}

/** Structured, factual privacy posture used to render the privacy policy. */
export interface AppPrivacy {
  /** Human-readable effective date, e.g. "June 6, 2026". */
  effectiveDate: string;
  collectsData: boolean;
  tracking: boolean;
  thirdPartyAnalytics: boolean;
  cloudSync: boolean;
  accountRequired: boolean;
  usesStoreKit: boolean;
  usesCamera: boolean;
  usesPhotoLibrary: boolean;
  dataStorage: "local_device_only" | "cloud" | "hybrid";
  /** Verbatim, user-facing privacy guarantees. Must stay true to the product. */
  claims: string[];
}

export interface NoviqueApp {
  slug: string;
  appStoreName: string;
  displayName: string;
  bundleId: string;
  sku: string;
  appleAppId: string;
  platforms: AppPlatform[];
  category: string;
  status: AppStatus;
  supportEmail: string;
  privacyContactEmail: string;
  copyrightOwner: string;
  subtitle: string;
  shortDescription: string;
  /** One-paragraph landing blurb. */
  landingCopy: string;
  /** Public App Store URL. Undefined until the listing is live. */
  appStoreUrl?: string;
  privacy: AppPrivacy;
  support: {
    sections: SupportSection[];
  };
}

const apps: Record<string, NoviqueApp> = {
  "glow-routine": {
    slug: "glow-routine",
    appStoreName: "Glow Routine Journal",
    displayName: "Glow Routine",
    bundleId: "ai.novique.glowroutine",
    sku: "glow-routine-ios",
    appleAppId: "6777208251",
    platforms: ["ios"],
    category: "Lifestyle",
    status: "pre-release",
    supportEmail: "support@novique.ai",
    privacyContactEmail: "privacy@novique.ai",
    copyrightOwner: "Novique AI",
    subtitle: "Private skincare routine tracker",
    shortDescription: "Private skincare routine and progress journal.",
    landingCopy:
      "Glow Routine is a private skincare routine and progress journal for tracking AM/PM care, notes, and local progress photos without an account. Your routines, product notes, checklist history, and photos stay on your device.",
    // appStoreUrl is intentionally omitted until the listing is public.
    privacy: {
      effectiveDate: "June 6, 2026",
      collectsData: false,
      tracking: false,
      thirdPartyAnalytics: false,
      cloudSync: false,
      accountRequired: false,
      usesStoreKit: true,
      usesCamera: true,
      usesPhotoLibrary: true,
      dataStorage: "local_device_only",
      claims: [
        "Glow Routine does not require an account.",
        "Glow Routine does not track users.",
        "Glow Routine does not use third-party analytics in v1.",
        "Glow Routine does not upload routine data, notes, product names, checklist history, or progress photos.",
        "Progress photos are stored locally on your device.",
        "In-app purchases are processed by Apple.",
      ],
    },
    support: {
      sections: [
        {
          title: "Contact support",
          body:
            "The fastest way to reach us is email. Write to support@novique.ai and we'll typically reply within two business days.\n\nPlease include your device model and iOS version so we can help faster.",
        },
        {
          title: "Restore purchases",
          body:
            "If you've bought a Glow Routine upgrade and don't see it — for example after reinstalling or moving to a new device — open the app, go to Settings, and tap \"Restore Purchases.\" Purchases are tied to the Apple ID that made them, so make sure you're signed in to that Apple ID.\n\nAll payments and restores are handled by Apple. If a charge looks wrong, you can also manage or request a refund from your Apple account.",
        },
        {
          title: "Your photos stay on your device",
          body:
            "Progress photos you add to Glow Routine are stored locally on your device. They are never uploaded to Novique or any third party. If you delete the app, those photos are removed with it (unless you separately saved them to your Photos library).",
        },
        {
          title: "No account or password",
          body:
            "Glow Routine has no sign-up, no login, and no password. There's no account to recover and nothing for us to reset, because your data never leaves your device.",
        },
        {
          title: "Reset or delete your data",
          body:
            "You can clear your routines, notes, and history at any time from Settings → Reset Data inside the app. To remove everything completely, delete the app from your device — that erases all locally stored Glow Routine data, including progress photos held by the app.",
        },
        {
          title: "Report a bug",
          body:
            "Found something broken? Email support@novique.ai with the subject \"Bug report.\" Tell us what you expected, what happened instead, the steps to reproduce it, and your device model and iOS version. Screenshots help.",
        },
        {
          title: "Request a feature",
          body:
            "We build Glow Routine around what people actually need. Send ideas to support@novique.ai with the subject \"Feature request\" — we read every one.",
        },
      ],
    },
  },
};

/** All registered apps, in display order. */
export function getAllApps(): NoviqueApp[] {
  return Object.values(apps);
}

/** Look up one app by slug, or undefined if it doesn't exist. */
export function getApp(slug: string): NoviqueApp | undefined {
  return apps[slug];
}

/** Build the path for an app page. */
export function appPath(
  slug: string,
  sub: "" | "support" | "privacy" = "",
): string {
  return `/apps/${slug}${sub ? `/${sub}` : ""}`;
}

/** Build the absolute public URL for an app page (www canonical host). */
export function appUrl(slug: string, sub: "" | "support" | "privacy" = ""): string {
  return `${SITE_URL}${appPath(slug, sub)}`;
}

const STATUS_LABELS: Record<AppStatus, string> = {
  "pre-release": "Coming soon",
  testflight: "TestFlight beta",
  available: "On the App Store",
  retired: "Retired",
};

export function statusLabel(status: AppStatus): string {
  return STATUS_LABELS[status];
}

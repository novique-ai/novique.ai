/**
 * Novique portfolio + services registry (redesign).
 *
 * Single source of truth for the dark /work + /services + home surfaces.
 * Honesty constraint is enforced here: only `live` items make revenue/launch
 * claims; everything else is `coming-soon`. App statuses for App Store apps
 * defer to lib/apps/registry.ts (the real source of truth) — do not restate
 * them here as "shipped".
 */

export type WorkStatus = "live" | "coming-soon" | "waitlist";

export interface PriceTier {
  name: string;
  price: string; // display string, mono-rendered
}

export interface WorkItem {
  slug: string;
  name: string;
  status: WorkStatus;
  line: string; // which line of business: SaaS product / App Store app
  blurb: string;
  url?: string; // external product URL, only when truly live/public
  tiers?: PriceTier[];
}

export const PRODUCTS: WorkItem[] = [
  {
    slug: "labelwatch",
    name: "LabelWatch",
    status: "live",
    line: "SaaS product",
    blurb:
      "FDA recall intelligence for dietary-supplement brands. We parse the federal recall feeds nightly and alert brands the moment something touches their ingredients or competitors.",
    url: "https://label.watch",
    tiers: [
      { name: "Starter", price: "$39" },
      { name: "Pro", price: "$99" },
      { name: "Team", price: "$299" },
    ],
  },
  {
    slug: "liensentry",
    name: "LienSentry",
    status: "waitlist",
    line: "SaaS product",
    blurb:
      "Texas Chapter 53 lien-deadline tracking for commercial-mechanical subcontractors — the three statutory notices per job, watched and sent by certified mail before the deadline.",
  },
  {
    slug: "glow-routine",
    name: "Glow Routine Journal",
    status: "coming-soon",
    line: "App Store app",
    blurb:
      "A private, local-only skincare routine and progress journal for iOS — no account, no tracking, nothing leaves the device. Part of our Shell Apps line.",
  },
];

/** Plain-language, honest operational competencies (no client logos). */
export const SYSTEMS: { title: string; detail: string }[] = [
  {
    title: "Recall & data pipelines",
    detail: "Nightly ingestion of federal feeds, normalized and matched against each customer's catalog.",
  },
  {
    title: "Monitoring agents",
    detail: "Always-on agents that watch feeds, filings, and inboxes and surface only the exceptions worth a human.",
  },
  {
    title: "Billing & subscriptions",
    detail: "Live Stripe billing, tiers, and customer lifecycle — the same stack we'd stand up for you.",
  },
  {
    title: "App Store delivery",
    detail: "Shipping and supporting real iOS apps end to end, from build to privacy posture.",
  },
  {
    title: "The product factory",
    detail: "An internal toolchain that takes an idea to a deployed, operated product — it's how we move fast.",
  },
];

/** /services consulting tracks — owner-language title + technical reassurance. */
export const TRACKS: {
  title: string;
  reassurance: string;
  gets: string[];
  timeframe: string;
}[] = [
  {
    title: "Automate a process",
    reassurance: "We take one repetitive, error-prone workflow off your plate end to end.",
    gets: ["A working automation in production", "Handover docs + a human-in-the-loop for exceptions", "We can keep operating it"],
    timeframe: "2–4 weeks",
  },
  {
    title: "Monitor what matters",
    reassurance: "AI agents watch the data, filings, and feeds you can't watch 24/7 — and ping you only when it counts.",
    gets: ["Continuous monitoring of your critical signals", "Alerts that reach you where you already work", "Tuned to cut false alarms"],
    timeframe: "3–5 weeks",
  },
  {
    title: "Build a product",
    reassurance: "Your own software, built and shipped through the same product factory we use for ours.",
    gets: ["A deployed product, not a prototype", "Stripe billing + auth if you sell it", "An operating plan so it keeps running"],
    timeframe: "6–10 weeks",
  },
];

/** How we work — plain, no methodology jargon. */
export const PROCESS: { step: string; detail: string }[] = [
  { step: "Call", detail: "A free 30-minute call. You describe the task; we tell you straight if AI is the right tool." },
  { step: "Scope", detail: "We write down the smallest version that proves value, with a fixed price and timeline." },
  { step: "Build", detail: "We build it — and show you working software, not slides, along the way." },
  { step: "Operate", detail: "We can keep it running and watch it, so it stays useful instead of rotting." },
];

/** /services "Who this is for" self-identify lines. */
export const AUDIENCE: string[] = [
  "You're drowning in manual checks that a computer should just do.",
  "You're missing things — deadlines, recalls, replies — that quietly cost you money.",
  "You want automation, but not a six-month enterprise project with a six-figure invoice.",
];

export function statusMeta(status: WorkStatus): { label: string; tone: "live" | "soon" } {
  switch (status) {
    case "live":
      return { label: "Live now", tone: "live" };
    case "waitlist":
      return { label: "Waitlist open", tone: "soon" };
    case "coming-soon":
    default:
      return { label: "Coming soon", tone: "soon" };
  }
}

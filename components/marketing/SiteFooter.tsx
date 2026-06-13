import Link from "next/link";

const COLS: { title: string; links: { href: string; label: string; external?: boolean; tag?: "live" | "soon" }[] }[] = [
  {
    title: "Products",
    links: [
      { href: "https://label.watch", label: "LabelWatch", external: true, tag: "live" },
      { href: "/work", label: "LienSentry", tag: "soon" },
      { href: "/apps/glow-routine", label: "Glow Routine", tag: "soon" },
    ],
  },
  {
    title: "Services",
    links: [
      { href: "/services", label: "What we do" },
      { href: "/consultation", label: "Book a call" },
      { href: "/work", label: "Our work" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/blog", label: "Blog" },
      { href: "/labs", label: "Labs" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="theme-dark relative overflow-hidden border-t border-stroke-1 bg-surface-1">
      <div className="nv-dotgrid absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="relative mx-auto max-w-container px-6 py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <div className="flex items-baseline gap-0.5">
              <span className="font-display text-lg font-semibold tracking-tight text-ink-0">Novique</span>
              <span className="text-lg font-semibold text-aqua">.</span>
              <span className="font-display text-lg font-semibold tracking-tight text-ink-2">ai</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-2">
              We build and operate our own AI products — and build custom AI and automation for small and mid-sized businesses.
            </p>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 font-mono text-[0.7rem] uppercase tracking-wider text-ink-3">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-ink-2 transition-colors hover:text-ink-0"
                      >
                        {l.label}
                        {l.tag && <StatusDot tone={l.tag} />}
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="inline-flex items-center gap-2 text-sm text-ink-2 transition-colors hover:text-ink-0"
                      >
                        {l.label}
                        {l.tag && <StatusDot tone={l.tag} />}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-stroke-1 pt-6 text-sm text-ink-3 md:flex-row md:items-center">
          <p>© {year} Novique AI. All rights reserved.</p>
          <p className="font-mono text-[0.7rem] uppercase tracking-wider">Build in public. Ship for real.</p>
        </div>
      </div>
    </footer>
  );
}

function StatusDot({ tone }: { tone: "live" | "soon" }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full ${tone === "live" ? "" : "opacity-60"}`}
      style={{ background: tone === "live" ? "var(--accent-2)" : "var(--ink-3)" }}
      aria-hidden="true"
    />
  );
}

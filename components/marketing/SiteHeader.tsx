"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeaderUser from "./SiteHeaderUser";

const NAV = [
  { href: "/work", label: "Work" },
  { href: "/services", label: "Services" },
  { href: "/blog", label: "Blog" },
  { href: "/labs", label: "Labs" },
  { href: "/contact", label: "Contact" },
];

function Wordmark() {
  return (
    <Link href="/" className="group inline-flex items-baseline gap-0.5" aria-label="Novique home">
      <span className="font-display text-lg font-semibold tracking-tight text-ink-0">Novique</span>
      <span className="text-lg font-semibold leading-none text-aqua">.</span>
      <span className="font-display text-lg font-semibold tracking-tight text-ink-2 transition-colors group-hover:text-ink-1">
        ai
      </span>
    </Link>
  );
}

/**
 * Standalone dark marketing header — NOT a wrapper over the auth-coupled
 * Header.tsx (which imports useAuth → lib/supabase, on the do-not-touch list).
 * Static nav + a plain "Sign in" link; no auth state, no Supabase client in the
 * marketing bundle.
 */
export default function SiteHeader({ solid = false }: { solid?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const dark = solid || scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="theme-dark sticky top-0 z-50 transition-colors duration-300"
      style={{
        background: dark ? "rgba(10,11,13,0.9)" : "transparent",
        backdropFilter: dark ? "blur(10px)" : undefined,
        borderBottom: dark ? "1px solid var(--border-1)" : "1px solid transparent",
      }}
    >
      <nav className="mx-auto flex h-16 max-w-container items-center justify-between px-6">
        <Wordmark />

        <div className="hidden items-center gap-8 md:flex">
          {NAV.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-ink-2 transition-colors hover:text-ink-0"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <SiteHeaderUser variant="desktop" />
        </div>

        <button
          className="rounded-md p-2 text-ink-1 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg className="h-6 w-6" fill="none" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            {open ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-stroke-1 px-6 py-4 md:hidden" style={{ background: "rgba(10,11,13,0.95)", backdropFilter: "blur(10px)" }}>
          <div className="flex flex-col gap-1">
            {NAV.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-md px-2 py-2 text-ink-1 hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <SiteHeaderUser variant="mobile" onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </header>
  );
}

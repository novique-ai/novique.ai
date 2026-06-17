"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DarkButton from "./DarkButton";
import { useUser } from "@/hooks/useUser";
import { isAdmin, isEditorOrHigher } from "@/lib/auth/roles";

/**
 * Auth-aware controls for the dark marketing header (SiteHeader).
 *
 * The dark redesign replaced the old auth-coupled Header.tsx with a static
 * SiteHeader that always showed a plain "Sign in" link, so a logged-in admin
 * looked signed-out on the public site and lost the dropdown that linked into
 * the editor (Labs/Blog) and admin areas. This restores that behaviour using
 * the same client hooks the old UserMenu used.
 *
 * Signed out (or while the session is still loading): the original
 * "Sign in" + "Book a call" cluster. Signed in: a user dropdown (desktop) or an
 * inline link list (mobile) with the editor/admin destinations + sign out.
 */

type Variant = "desktop" | "mobile";

function initialsFor(name: string | null, email: string): string {
  if (name && name.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email[0]?.toUpperCase() ?? "U";
}

export default function SiteHeaderUser({
  variant,
  onNavigate,
}: {
  variant: Variant;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const { profile } = useUser();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the desktop dropdown when clicking outside it.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setOpen(false);
    onNavigate?.();
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // No profile yet (anonymous, or session still resolving): show the original
  // public CTAs, so anonymous visitors see no change and there is no flash of an
  // empty header for logged-in users.
  if (!profile) {
    if (variant === "mobile") {
      return (
        <div className="mt-3 flex items-center gap-3">
          <DarkButton href="/consultation" size="sm" className="flex-1">
            Book a call
          </DarkButton>
          <Link href="/login" className="px-3 text-sm text-ink-2" onClick={onNavigate}>
            Sign in
          </Link>
        </div>
      );
    }
    return (
      <>
        <Link href="/login" className="text-sm text-ink-2 transition-colors hover:text-ink-0">
          Sign in
        </Link>
        <DarkButton href="/consultation" size="sm">
          Book a call
        </DarkButton>
      </>
    );
  }

  // Signed in.
  const p = profile;
  const admin = isAdmin(p.role);
  const editor = isEditorOrHigher(p.role);
  const initials = initialsFor(p.full_name, p.email);

  const links: { href: string; label: string }[] = [];
  if (admin) links.push({ href: "/admin/dashboard", label: "Admin Dashboard" });
  if (editor) {
    links.push({ href: "/editor/dashboard", label: "Editor Dashboard" });
    links.push({ href: "/editor/labs", label: "Manage Labs" });
    links.push({ href: "/editor/blog", label: "Manage Blog" });
  }

  if (variant === "mobile") {
    return (
      <div className="mt-3 border-t border-stroke-1 pt-3">
        <div className="px-2 pb-2">
          <p className="text-sm font-medium text-ink-0">{p.full_name || p.email}</p>
          <p className="text-xs capitalize text-ink-3">{p.role} account</p>
        </div>
        <div className="flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-2 py-2 text-sm text-ink-1 hover:bg-white/5"
              onClick={onNavigate}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={handleSignOut}
            className="rounded-md px-2 py-2 text-left text-sm text-red-300 hover:bg-white/5"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // Desktop dropdown.
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full text-ink-1 transition-colors hover:text-ink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-aqua"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-aqua/15 text-xs font-semibold text-aqua-bright">
          {initials}
        </span>
        <span className="hidden text-sm text-ink-1 lg:block">{p.full_name || p.email}</span>
        <svg
          className={`h-4 w-4 text-ink-3 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-stroke-1 bg-surface-2 shadow-xl">
          <div className="border-b border-stroke-1 px-4 py-3">
            <p className="truncate text-sm font-medium text-ink-0">{p.full_name || "User"}</p>
            <p className="truncate text-xs text-ink-3">{p.email}</p>
            <p className="mt-1 text-xs capitalize text-ink-3">{p.role} account</p>
          </div>
          <div className="py-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block px-4 py-2 text-sm text-ink-1 hover:bg-white/5 hover:text-ink-0"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-stroke-1 py-1">
            <button
              onClick={handleSignOut}
              className="block w-full px-4 py-2 text-left text-sm text-red-300 hover:bg-white/5"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

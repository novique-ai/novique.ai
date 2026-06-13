import type { ReactNode } from "react";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

/**
 * Scopes the dark theme to the redesign pages WITHOUT touching the global light
 * theme (existing light pages keep working). The `.theme-dark` class defines the
 * token CSS vars that the Tailwind surface/ink/aqua/... utilities resolve
 * against, so these tokens only apply inside this subtree.
 */
export default function ThemeShell({ children }: { children: ReactNode }) {
  return (
    <div className="theme-dark min-h-screen bg-surface-0 font-sans text-ink-1 antialiased">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

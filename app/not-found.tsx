import ThemeShell from "@/components/marketing/ThemeShell";
import PageHero from "@/components/marketing/PageHero";

export const metadata = {
  title: "Page not found — Novique",
  description: "The page you were looking for doesn't exist or has moved.",
};

export default function NotFound() {
  return (
    <ThemeShell>
      <PageHero
        eyebrow="Error 404"
        headline={
          <>
            This page
            <br />
            <span className="text-ink-2">went missing.</span>
          </>
        }
        subhead="The page you were looking for doesn't exist, moved, or never shipped. Head back home and we'll point you the right way."
        ctas={[
          { label: "Back to home", href: "/", variant: "primary" },
          { label: "See what we can do", href: "/services", variant: "ghost" },
        ]}
      />
    </ThemeShell>
  );
}

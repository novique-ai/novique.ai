import type { ReactNode } from "react";
import AuroraOrbField from "../graphics/AuroraOrbField";
import DarkButton from "./DarkButton";

type CTA = {
  label: string;
  href: string;
  variant?: "primary" | "ghost" | "outline";
  external?: boolean;
};

/**
 * Shared dark hero. The H1 is plain SSR text so it is the LCP element — the
 * AuroraOrbField backdrop sits behind at a lower layer and is never the largest
 * painted element.
 */
export default function PageHero({
  eyebrow,
  headline,
  subhead,
  ctas = [],
  intensity = "hero",
  align = "center",
}: {
  eyebrow?: string;
  headline: ReactNode;
  subhead?: ReactNode;
  ctas?: CTA[];
  intensity?: "hero" | "soft";
  align?: "center" | "left";
}) {
  const centered = align === "center";
  return (
    <section className="relative isolate overflow-hidden">
      <AuroraOrbField intensity={intensity} />
      <div className={`relative mx-auto max-w-container px-6 pb-20 pt-24 md:pb-28 md:pt-32 ${centered ? "text-center" : ""}`}>
        {eyebrow && <p className="nv-eyebrow mb-4">{eyebrow}</p>}
        <h1 className={`font-display text-display-xl text-ink-0 text-balance ${centered ? "mx-auto max-w-4xl" : "max-w-4xl"}`}>
          {headline}
        </h1>
        {subhead && (
          <p className={`mt-6 text-body-lg text-ink-2 ${centered ? "mx-auto max-w-2xl" : "max-w-2xl"}`}>{subhead}</p>
        )}
        {ctas.length > 0 && (
          <div className={`mt-9 flex flex-wrap gap-3 ${centered ? "justify-center" : ""}`}>
            {ctas.map((c) => (
              <DarkButton key={c.label} href={c.href} variant={c.variant ?? "primary"} size="lg" external={c.external}>
                {c.label}
              </DarkButton>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

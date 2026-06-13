/**
 * Ambient hero/section backdrop — pure CSS, zero JS. Slow-drifting accent orbs
 * + faint dot grid + a subtle conic sheen, all behind content at low z-index.
 * Shared across home / work / services so the three pages feel like one system.
 * Reduced-motion (via the global .theme-dark [data-graphic] rule) freezes the
 * drift — still a composed, premium still.
 */
export default function AuroraOrbField({
  className = "",
  intensity = "hero",
}: {
  className?: string;
  intensity?: "hero" | "soft";
}) {
  const op = intensity === "hero" ? 1 : 0.55;
  return (
    <div
      data-graphic=""
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div className="nv-dotgrid absolute inset-0 opacity-60" />
      <div
        className="nv-anim-float-a absolute -left-[12%] -top-[20%] h-[62vh] w-[62vh] rounded-full blur-3xl"
        style={{ background: "var(--accent-orb)", opacity: 0.95 * op }}
      />
      <div
        className="nv-anim-float-b absolute -right-[8%] top-[6%] h-[52vh] w-[52vh] rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(18,181,160,0.16), transparent 70%)",
          opacity: 0.8 * op,
        }}
      />
      <div
        className="nv-anim-orbsweep absolute left-1/2 -top-[30%] h-[80vh] w-[80vh] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "conic-gradient(from var(--angle), rgba(43,232,194,0.06), transparent 30%, rgba(95,243,214,0.05), transparent 72%)",
          opacity: 0.5 * op,
        }}
      />
      {/* top + bottom fades so chrome and the next section read cleanly */}
      <div
        className="absolute inset-x-0 top-0 h-28"
        style={{ background: "linear-gradient(var(--bg-0), transparent)" }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-32"
        style={{ background: "linear-gradient(transparent, var(--bg-0))" }}
      />
    </div>
  );
}

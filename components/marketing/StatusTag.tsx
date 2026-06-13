export default function StatusTag({
  label,
  tone,
}: {
  label: string;
  tone: "live" | "soon";
}) {
  const live = tone === "live";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-wider ${
        live ? "border-stroke-accent text-aqua-bright" : "border-stroke-1 text-ink-2"
      }`}
      style={live ? { background: "rgba(43,232,194,0.08)" } : undefined}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${live ? "nv-anim-pulse" : ""}`}
        style={{ background: live ? "var(--accent-2)" : "var(--ink-3)" }}
      />
      {label}
    </span>
  );
}

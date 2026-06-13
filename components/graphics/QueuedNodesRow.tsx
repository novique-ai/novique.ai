/**
 * A small row of status nodes — one per upcoming item. Glow intensity encodes
 * status (live = bright accent, soon = dim). Zero JS. Reduced-motion → static row.
 */
export default function QueuedNodesRow({
  tones,
  className = "",
}: {
  tones: ("live" | "soon")[];
  className?: string;
}) {
  return (
    <div
      data-graphic=""
      aria-hidden="true"
      className={`flex items-center gap-3 ${className}`}
    >
      {tones.map((tone, i) => (
        <span key={i} className="relative inline-flex h-2.5 w-2.5 items-center justify-center">
          {tone === "live" && (
            <span
              className="nv-anim-glow absolute inline-flex h-5 w-5 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(43,232,194,0.5), transparent 70%)" }}
            />
          )}
          <span
            className={`relative inline-flex h-2.5 w-2.5 rounded-full ${tone === "soon" ? "nv-anim-pulse" : ""}`}
            style={{
              background: tone === "live" ? "var(--accent-2)" : "var(--ink-3)",
              animationDelay: `${i * 0.3}s`,
            }}
          />
        </span>
      ))}
    </div>
  );
}

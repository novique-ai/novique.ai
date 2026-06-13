/**
 * SIGNATURE MOTIF. One "product factory" source node splitting into two mirrored
 * branches — left = products we own, right = AI we build for clients. This is the
 * literal shape of the 50/50 brand, and the thing that makes the system Novique
 * rather than a Linear/Resend clone. Inline SVG, CSS draw-in (zero JS).
 */
export default function SplitFlowDiagram({ className = "" }: { className?: string }) {
  return (
    <div data-graphic="" aria-hidden="true" className={`relative h-full w-full ${className}`}>
      <svg viewBox="0 0 280 180" fill="none" className="h-full w-full">
        {/* branch paths */}
        <path
          d="M140 36 C 140 86, 70 96, 56 146"
          stroke="var(--accent)"
          strokeOpacity="0.5"
          strokeWidth="1.5"
          className="nv-anim-draw"
          style={{ ["--nv-len" as string]: 200, strokeDasharray: 200 }}
        />
        <path
          d="M140 36 C 140 86, 210 96, 224 146"
          stroke="var(--accent)"
          strokeOpacity="0.5"
          strokeWidth="1.5"
          className="nv-anim-draw"
          style={{ ["--nv-len" as string]: 200, strokeDasharray: 200, animationDelay: "0.25s" }}
        />
        {/* secondary hairlines */}
        <path d="M140 36 C 140 80, 110 110, 104 150" stroke="var(--border-2)" strokeWidth="1" strokeOpacity="0.7" />
        <path d="M140 36 C 140 80, 170 110, 176 150" stroke="var(--border-2)" strokeWidth="1" strokeOpacity="0.7" />

        {/* source node */}
        <circle cx="140" cy="32" r="18" fill="var(--bg-2)" stroke="var(--accent)" strokeOpacity="0.6" />
        <circle cx="140" cy="32" r="5" fill="var(--accent-2)" className="nv-anim-glow" />

        {/* product (left) + client (right) destination nodes */}
        <circle cx="56" cy="150" r="10" fill="var(--bg-2)" stroke="var(--accent)" strokeOpacity="0.45" />
        <circle cx="56" cy="150" r="3.5" fill="var(--accent)" />
        <circle cx="224" cy="150" r="10" fill="var(--bg-2)" stroke="var(--accent)" strokeOpacity="0.45" />
        <circle cx="224" cy="150" r="3.5" fill="var(--accent)" />

        {/* faint mid waypoints */}
        <circle cx="104" cy="150" r="2.5" fill="var(--ink-3)" />
        <circle cx="176" cy="150" r="2.5" fill="var(--ink-3)" />
      </svg>
    </div>
  );
}

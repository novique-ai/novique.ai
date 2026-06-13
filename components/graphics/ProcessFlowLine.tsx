/**
 * Horizontal 4-waypoint signal line (Call → Scope → Build → Operate) with a
 * sequential accent pulse. Inline SVG + staggered CSS pulse. Reduced-motion →
 * static line with all waypoints lit.
 */
export default function ProcessFlowLine({
  className = "",
  count = 4,
}: {
  className?: string;
  count?: number;
}) {
  const pts = Array.from({ length: count });
  const x0 = 24;
  const x1 = 296;
  const step = (x1 - x0) / (count - 1);
  return (
    <div data-graphic="" aria-hidden="true" className={`relative h-full w-full ${className}`}>
      <svg viewBox="0 0 320 48" fill="none" className="h-full w-full">
        <line x1={x0} y1="24" x2={x1} y2="24" stroke="var(--border-2)" strokeWidth="1.5" />
        <line
          x1={x0}
          y1="24"
          x2={x1}
          y2="24"
          stroke="var(--accent)"
          strokeOpacity="0.5"
          strokeWidth="1.5"
          className="nv-anim-draw"
          style={{ ["--nv-len" as string]: x1 - x0, strokeDasharray: x1 - x0 }}
        />
        {pts.map((_, i) => {
          const cx = x0 + step * i;
          return (
            <g key={i}>
              <circle cx={cx} cy="24" r="7" fill="var(--bg-2)" stroke="var(--accent)" strokeOpacity="0.5" />
              <circle
                cx={cx}
                cy="24"
                r="3"
                fill="var(--accent)"
                className="nv-anim-pulse"
                style={{ animationDelay: `${i * 0.45}s` }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

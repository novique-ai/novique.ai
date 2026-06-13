/**
 * Abstract pulse-tick timeline standing in for LabelWatch's monitored feed —
 * a flat signal with one ignited tick ("a recall event detected"). NOT a product
 * screenshot. Inline SVG + a CSS sweep highlight. Reduced-motion → static reading
 * with the ignited tick visible.
 */
export default function RecallSignal({ className = "" }: { className?: string }) {
  const ticks = Array.from({ length: 15 });
  const ignited = 10;
  return (
    <div data-graphic="" aria-hidden="true" className={`relative h-full w-full overflow-hidden ${className}`}>
      {/* sweeping highlight */}
      <div
        className="nv-anim-sweep absolute inset-y-0 w-1/3"
        style={{ background: "linear-gradient(90deg, transparent, rgba(43,232,194,0.10), transparent)" }}
      />
      <svg viewBox="0 0 320 90" fill="none" className="relative h-full w-full">
        <line x1="12" y1="62" x2="308" y2="62" stroke="var(--border-2)" strokeWidth="1" />
        {ticks.map((_, i) => {
          const x = 20 + i * 20;
          const isIgnited = i === ignited;
          const h = isIgnited ? 40 : 8 + ((i * 7) % 11);
          return (
            <g key={i}>
              <line
                x1={x}
                y1={62}
                x2={x}
                y2={62 - h}
                stroke={isIgnited ? "var(--accent)" : "var(--ink-3)"}
                strokeOpacity={isIgnited ? 1 : 0.5}
                strokeWidth={isIgnited ? 2 : 1.5}
                className={isIgnited ? "nv-anim-pulse" : undefined}
              />
              {isIgnited && (
                <circle cx={x} cy={62 - h} r="4" fill="var(--accent-2)" className="nv-anim-glow" />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

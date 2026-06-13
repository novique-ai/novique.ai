/**
 * Structured dot matrix converging on a low-opacity accent orb — "composed from
 * first principles." Pure CSS/SVG, zero JS. Pillar 3 + small /services accent.
 */
export default function DotGridOrb({ className = "" }: { className?: string }) {
  return (
    <div data-graphic="" aria-hidden="true" className={`relative h-full w-full ${className}`}>
      <div
        className="nv-dotgrid absolute inset-0"
        style={{
          maskImage: "radial-gradient(circle at 50% 55%, black 0%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 55%, black 0%, transparent 72%)",
        }}
      />
      <div className="absolute inset-0" style={{ background: "var(--accent-orb)" }} />
      <div
        className="nv-anim-glow absolute left-1/2 top-[55%] h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl"
        style={{ background: "radial-gradient(circle, rgba(43,232,194,0.22), transparent 65%)" }}
      />
    </div>
  );
}

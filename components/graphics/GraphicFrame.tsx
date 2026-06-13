import type { ReactNode } from "react";

/**
 * Fixed-size wrapper for every decorative graphic: holds a stable aspect box
 * (CLS ~ 0), marks the subtree aria-hidden (graphics are decorative), and tags
 * it [data-graphic] so the reduced-motion CSS rule can neutralize it.
 */
export default function GraphicFrame({
  children,
  className = "",
  aspect,
  height,
}: {
  children: ReactNode;
  className?: string;
  aspect?: string; // e.g. "16 / 9"
  height?: number; // fixed px height alternative
}) {
  return (
    <div
      aria-hidden="true"
      data-graphic=""
      className={`relative overflow-hidden ${className}`}
      style={{
        aspectRatio: aspect,
        height: height ? `${height}px` : undefined,
      }}
    >
      {children}
    </div>
  );
}

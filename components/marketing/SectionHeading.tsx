import type { ReactNode } from "react";

export default function SectionHeading({
  eyebrow,
  title,
  subhead,
  align = "left",
  size = "dh2",
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  subhead?: ReactNode;
  align?: "left" | "center";
  size?: "dh1" | "dh2";
  className?: string;
}) {
  return (
    <div className={`${align === "center" ? "mx-auto text-center" : ""} max-w-reading ${className}`}>
      {eyebrow && <p className="nv-eyebrow mb-3">{eyebrow}</p>}
      <h2 className={`font-display ${size === "dh1" ? "text-dh1" : "text-dh2"} text-ink-0`}>{title}</h2>
      {subhead && <p className="mt-4 text-body-lg text-ink-2">{subhead}</p>}
    </div>
  );
}

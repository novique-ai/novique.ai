import type { ReactNode } from "react";
import GraphicFrame from "../graphics/GraphicFrame";

export default function PillarCard({
  title,
  sub,
  graphic,
}: {
  title: string;
  sub: string;
  graphic: ReactNode;
}) {
  return (
    <div className="nv-card relative flex flex-col overflow-hidden p-6 transition-colors duration-300 hover:border-stroke-2">
      <GraphicFrame height={150} className="-mx-6 -mt-6 mb-6 border-b border-stroke-1 bg-surface-1">
        {graphic}
      </GraphicFrame>
      <h3 className="font-display text-dh3 text-ink-0">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">{sub}</p>
    </div>
  );
}

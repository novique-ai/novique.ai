/**
 * Isometric line-art wireframe figures — Linear's monochrome-iso *style* (thin
 * strokes on near-black, one aqua accent, a mono FIG caption) but ORIGINAL
 * geometry (not Linear's stack/cluster/fan illustrations). Abstract on purpose:
 * implies capability without depicting any real product. Pure inline SVG.
 *
 * Dynamic: the accent element has a subtle continuous bob; the whole figure
 * lifts + scales on hover of the enclosing `.group`. Both honor reduced-motion.
 *
 *   conduit → an automation loop with a token circulating   (Automate)
 *   orbit   → a core node with agents on an iso orbit        (Monitor)
 *   lattice → an open grid with raised towers (infra/build)  (Build)
 *   radar   → concentric scan rings + a blip                 (audience / scanning)
 */

const S = 29;
const CX = 140;
const CY = 100;

function iso(x: number, y: number, z: number): [number, number] {
  return [CX + (x - y) * S * 0.866, CY + (x + y) * S * 0.5 - z * S];
}
const pp = (p: [number, number]) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
const poly = (arr: [number, number][]) => arr.map(pp).join(" ");
function ringPath(cx: number, cy: number, r: number, z: number, n = 40): string {
  const a: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * 2 * Math.PI;
    a.push(iso(cx + r * Math.cos(t), cy + r * Math.sin(t), z));
  }
  return "M" + a.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L");
}
const ringPt = (cx: number, cy: number, r: number, z: number, deg: number): [number, number] =>
  iso(cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180), z);

const INK = "var(--ink-2)";
const ACC = "var(--accent)";

function Tower({ x, y, h, accent = false }: { x: number; y: number; h: number; accent?: boolean }) {
  const s = 0.55;
  const stroke = accent ? ACC : INK;
  const top: [number, number][] = [iso(x, y, h), iso(x + s, y, h), iso(x + s, y + s, h), iso(x, y + s, h)];
  const right: [number, number][] = [iso(x + s, y, h), iso(x + s, y + s, h), iso(x + s, y + s, 0), iso(x + s, y, 0)];
  const left: [number, number][] = [iso(x, y + s, h), iso(x + s, y + s, h), iso(x + s, y + s, 0), iso(x, y + s, 0)];
  return (
    <g strokeLinejoin="round" className={accent ? "nv-iso-bob" : undefined}>
      <polygon points={poly(left)} fill="rgba(255,255,255,0.02)" stroke={stroke} strokeOpacity={accent ? 0.8 : 0.4} strokeWidth={accent ? 1.4 : 1} />
      <polygon points={poly(right)} fill="rgba(255,255,255,0.035)" stroke={stroke} strokeOpacity={accent ? 0.9 : 0.5} strokeWidth={accent ? 1.4 : 1} />
      <polygon points={poly(top)} fill={accent ? "rgba(43,232,194,0.08)" : "rgba(255,255,255,0.06)"} stroke={stroke} strokeOpacity={accent ? 1 : 0.7} strokeWidth={accent ? 1.4 : 1} />
    </g>
  );
}

function Conduit() {
  const z = 0.3;
  const outer: [number, number][] = [iso(0, 0, z), iso(3.2, 0, z), iso(3.2, 2.2, z), iso(0, 2.2, z)];
  const inner: [number, number][] = [iso(0.45, 0.45, z), iso(2.75, 0.45, z), iso(2.75, 1.75, z), iso(0.45, 1.75, z)];
  const token = iso(1.6, 0, z);
  const s1 = iso(3.2, 2.2, z);
  const s2 = iso(0, 0, z);
  return (
    <g>
      <polygon points={poly(outer)} fill="none" stroke={INK} strokeOpacity={0.5} strokeWidth={1} strokeLinejoin="round" />
      <polygon points={poly(inner)} fill="rgba(255,255,255,0.015)" stroke={INK} strokeOpacity={0.35} strokeWidth={1} strokeLinejoin="round" />
      <circle cx={s2[0]} cy={s2[1]} r={3} fill={INK} fillOpacity={0.6} />
      <circle cx={s1[0]} cy={s1[1]} r={3.5} fill={ACC} />
      <g className="nv-iso-bob">
        <circle cx={token[0]} cy={token[1]} r={9} fill="rgba(43,232,194,0.18)" />
        <circle cx={token[0]} cy={token[1]} r={4} fill={ACC} />
      </g>
    </g>
  );
}

function Orbit() {
  const cx = 1.5,
    cy = 1.5,
    r = 1.7,
    z = 0.7;
  const [ccx, ccy] = iso(cx, cy, z);
  const sats: { p: [number, number]; accent: boolean }[] = [
    { p: ringPt(cx, cy, r, z, 20), accent: true },
    { p: ringPt(cx, cy, r, z, 150), accent: false },
    { p: ringPt(cx, cy, r, z, 265), accent: false },
  ];
  return (
    <g>
      <path d={ringPath(cx, cy, r, z)} fill="none" stroke={INK} strokeOpacity={0.4} strokeWidth={1} />
      <path d={ringPath(cx, cy, r * 0.55, z)} fill="none" stroke={INK} strokeOpacity={0.25} strokeWidth={1} />
      <circle cx={ccx} cy={ccy} r={11} fill="rgba(43,232,194,0.12)" />
      <circle cx={ccx} cy={ccy} r={5} fill={ACC} />
      {sats.map((s, i) => (
        <g key={i} className={s.accent ? "nv-iso-bob" : undefined}>
          {s.accent && <circle cx={s.p[0]} cy={s.p[1]} r={8} fill="rgba(43,232,194,0.16)" />}
          <circle cx={s.p[0]} cy={s.p[1]} r={s.accent ? 4 : 3} fill={s.accent ? ACC : INK} fillOpacity={s.accent ? 1 : 0.6} />
        </g>
      ))}
    </g>
  );
}

function Lattice() {
  const lines = [];
  for (let i = 0; i <= 3; i++) {
    const a = iso(i, 0, 0),
      b = iso(i, 3, 0);
    const c = iso(0, i, 0),
      d = iso(3, i, 0);
    lines.push(<line key={`x${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={INK} strokeOpacity={0.28} strokeWidth={1} />);
    lines.push(<line key={`y${i}`} x1={c[0]} y1={c[1]} x2={d[0]} y2={d[1]} stroke={INK} strokeOpacity={0.28} strokeWidth={1} />);
  }
  return (
    <g>
      {lines}
      <Tower x={1.9} y={1.9} h={1.2} />
      <Tower x={1.35} y={0.6} h={1.0} />
      <Tower x={0.55} y={1.6} h={2.05} />
      <Tower x={0.25} y={0.25} h={1.55} accent />
    </g>
  );
}

function Radar() {
  const cx = 1.5,
    cy = 1.5,
    z = 0.4;
  const [ccx, ccy] = iso(cx, cy, z);
  const blip = ringPt(cx, cy, 1.9, z, 310);
  return (
    <g>
      {[0.8, 1.4, 1.9].map((r, i) => (
        <path key={i} d={ringPath(cx, cy, r, z)} fill="none" stroke={INK} strokeOpacity={0.45 - i * 0.1} strokeWidth={1} />
      ))}
      <circle cx={ccx} cy={ccy} r={4} fill={ACC} />
      <g className="nv-iso-bob">
        <circle cx={blip[0]} cy={blip[1]} r={8} fill="rgba(43,232,194,0.16)" />
        <circle cx={blip[0]} cy={blip[1]} r={3.5} fill={ACC} />
      </g>
    </g>
  );
}

function Gantt() {
  // flat Gantt: tasks progressing, a dashed due-line, one task overrunning it
  // (danger-red) — reads as "behind on a project."
  const due = 196;
  const bh = 13;
  const rows = [
    { x: 34, w: 80, y: 40, tone: "ink" as const },
    { x: 34, w: 124, y: 66, tone: "ink" as const },
    { x: 64, w: 84, y: 92, tone: "ink" as const },
    { x: 52, w: 116, y: 118, tone: "acc" as const },
    { x: 76, w: 150, y: 144, tone: "late" as const },
  ];
  return (
    <g>
      <line x1="22" y1="28" x2="22" y2="160" stroke={INK} strokeOpacity={0.25} strokeWidth={1} />
      <line x1={due} y1="22" x2={due} y2="162" stroke={ACC} strokeOpacity={0.7} strokeWidth={1} strokeDasharray="3 4" />
      <polygon points={`${due - 4},22 ${due + 4},22 ${due},29`} fill={ACC} />
      {rows.map((r, i) => {
        if (r.tone === "late") {
          return (
            <g key={i} className="nv-anim-pulse">
              <rect x={r.x} y={r.y} width={due - r.x} height={bh} rx={3} fill="rgba(255,255,255,0.04)" stroke={INK} strokeOpacity={0.4} />
              <rect x={due} y={r.y} width={r.x + r.w - due} height={bh} rx={3} fill="rgba(242,85,90,0.18)" stroke="var(--danger)" strokeOpacity={0.9} strokeWidth={1.3} />
            </g>
          );
        }
        const acc = r.tone === "acc";
        return (
          <rect
            key={i}
            x={r.x}
            y={r.y}
            width={r.w}
            height={bh}
            rx={3}
            fill={acc ? "rgba(43,232,194,0.08)" : "rgba(255,255,255,0.04)"}
            stroke={acc ? ACC : INK}
            strokeOpacity={acc ? 0.9 : 0.4}
            strokeWidth={acc ? 1.4 : 1}
          />
        );
      })}
    </g>
  );
}

export default function IsoFigure({
  variant,
  className = "",
}: {
  variant: "conduit" | "orbit" | "lattice" | "radar" | "gantt";
  className?: string;
}) {
  return (
    <div
      data-graphic=""
      aria-hidden="true"
      className={`absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out will-change-transform group-hover:-translate-y-1.5 group-hover:scale-[1.05] ${className}`}
    >
      <svg viewBox="0 0 280 200" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        {variant === "conduit" && <Conduit />}
        {variant === "orbit" && <Orbit />}
        {variant === "lattice" && <Lattice />}
        {variant === "radar" && <Radar />}
        {variant === "gantt" && <Gantt />}
      </svg>
    </div>
  );
}

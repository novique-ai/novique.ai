"use client";

import { useEffect, useRef } from "react";
import {
  usePrefersReducedMotion,
  useInViewActive,
  useRafFrame,
  readVar,
  dpr,
} from "./useGraphics";

type Props = {
  className?: string;
  /** index of the single "live" node (bright + pulsing) */
  liveIndex?: number;
  nodeCount?: number;
  seed?: number;
};

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Node = { x: number; y: number; r: number };

/**
 * A small cluster of "build" nodes wired by hairline edges, with a signal
 * pulse that travels toward one bright "live" node — the honest "one product
 * live, rest queued" truth encoded structurally. Canvas2D, single shared rAF,
 * offscreen-paused, reduced-motion → drawn once.
 */
export default function AgentConstellation({
  className = "",
  liveIndex = 0,
  nodeCount = 9,
  seed = 7,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const active = useInViewActive(wrapRef) && !reduced;

  const model = useRef<{
    nodes: Node[];
    edges: [number, number][];
    path: number[]; // edge indices the pulse traverses, ending at live node
    w: number;
    h: number;
    progress: number;
    colors: { accent: string; accent2: string; dim: string; edge: string };
  } | null>(null);

  const draw = (t: number) => {
    const canvas = canvasRef.current;
    const m = model.current;
    if (!canvas || !m) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h, nodes, edges, path, colors } = m;
    ctx.clearRect(0, 0, w, h);

    // edges (hairline)
    ctx.lineWidth = 1;
    ctx.strokeStyle = colors.edge;
    for (const [a, b] of edges) {
      ctx.beginPath();
      ctx.moveTo(nodes[a].x, nodes[a].y);
      ctx.lineTo(nodes[b].x, nodes[b].y);
      ctx.stroke();
    }

    // traveling pulse along the path
    if (path.length) {
      const total = path.length;
      const pos = (t % 1) * total;
      const seg = Math.floor(pos);
      const f = pos - seg;
      const [ea, eb] = edges[path[Math.min(seg, total - 1)]];
      const px = nodes[ea].x + (nodes[eb].x - nodes[ea].x) * f;
      const py = nodes[ea].y + (nodes[eb].y - nodes[ea].y) * f;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, 14);
      grad.addColorStop(0, colors.accent);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    // nodes
    nodes.forEach((n, i) => {
      const live = i === liveIndex;
      if (live) {
        const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 22 + pulse * 8);
        glow.addColorStop(0, "rgba(43,232,194,0.45)");
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 22 + pulse * 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = live ? colors.accent2 : colors.dim;
      ctx.beginPath();
      ctx.arc(n.x, n.y, live ? n.r + 1.5 : n.r, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // build + size + draw once
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const colors = {
      accent: readVar(wrap, "--accent", "#2be8c2"),
      accent2: readVar(wrap, "--accent-2", "#5ff3d6"),
      dim: readVar(wrap, "--ink-3", "#5e6b70"),
      edge: "rgba(94,107,112,0.35)",
    };

    const build = () => {
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      const ratio = dpr();
      canvas.width = Math.floor(w * ratio);
      canvas.height = Math.floor(h * ratio);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const rng = mulberry32(seed);
      const nodes: Node[] = [];
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: w * (0.12 + rng() * 0.76),
          y: h * (0.16 + rng() * 0.68),
          r: 2.5 + rng() * 1.8,
        });
      }
      // edges: connect each node to its nearest 2 neighbors
      const edges: [number, number][] = [];
      const seen = new Set<string>();
      for (let i = 0; i < nodes.length; i++) {
        const d = nodes
          .map((n, j) => ({ j, dist: (n.x - nodes[i].x) ** 2 + (n.y - nodes[i].y) ** 2 }))
          .filter((o) => o.j !== i)
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 2);
        for (const { j } of d) {
          const key = i < j ? `${i}-${j}` : `${j}-${i}`;
          if (!seen.has(key)) {
            seen.add(key);
            edges.push(i < j ? [i, j] : [j, i]);
          }
        }
      }
      // path: edges that touch the live node, then a couple leading in
      const path = edges
        .map((e, idx) => ({ e, idx }))
        .filter(({ e }) => e[0] === liveIndex || e[1] === liveIndex)
        .map(({ idx }) => idx);
      if (!path.length && edges.length) path.push(0);

      model.current = { nodes, edges, path, w, h, progress: 0, colors };
      draw(0);
    };

    build();
    const ro = new ResizeObserver(build);
    ro.observe(wrap);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, nodeCount, seed, liveIndex]);

  const tRef = useRef(0);
  useRafFrame((dt) => {
    tRef.current = (tRef.current + dt / 6000) % 1;
    draw(tRef.current);
  }, active);

  return (
    <div ref={wrapRef} className={`absolute inset-0 ${className}`}>
      <canvas ref={canvasRef} />
    </div>
  );
}

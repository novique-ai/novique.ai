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
  /** rough particle density multiplier */
  density?: number;
  accentRatio?: number; // fraction of particles tinted accent
};

type P = { x: number; y: number; px: number; py: number; accent: boolean; life: number };

/** cheap hash-based value noise -> flow angle, no external lib */
function noiseAngle(x: number, y: number, t: number) {
  const s = Math.sin(x * 0.0125 + t) + Math.cos(y * 0.014 - t * 0.6) + Math.sin((x + y) * 0.008);
  return s * 1.4;
}

/**
 * Canvas2D flow field: faint left-to-right streamlines with occasional brighter
 * accent ribbons (the "events worth a human"). Used for the agents pillar and as
 * a low-opacity full-bleed section divider. Reduced-motion → one frozen
 * long-exposure frame.
 */
export default function SignalField({ className = "", density = 1, accentRatio = 0.08 }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const active = useInViewActive(wrapRef) && !reduced;

  const model = useRef<{
    parts: P[];
    w: number;
    h: number;
    accent: string;
    dim: string;
    t: number;
  } | null>(null);

  const step = (advance: boolean) => {
    const canvas = canvasRef.current;
    const m = model.current;
    if (!canvas || !m) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { parts, w, h, accent, dim } = m;

    // fade trails (gives the streak/long-exposure look)
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(7,10,12,0.12)";
    ctx.fillRect(0, 0, w, h);

    for (const p of parts) {
      const a = noiseAngle(p.x, p.y, m.t);
      p.px = p.x;
      p.py = p.y;
      p.x += Math.cos(a) * 1.1 + 0.5; // bias rightward
      p.y += Math.sin(a) * 1.1;
      p.life -= 1;
      if (p.x > w + 4 || p.y < -4 || p.y > h + 4 || p.life <= 0) {
        p.x = -4;
        p.y = Math.random() * h;
        p.px = p.x;
        p.py = p.y;
        p.life = 120 + Math.random() * 160;
      }
      ctx.globalCompositeOperation = p.accent ? "lighter" : "source-over";
      ctx.strokeStyle = p.accent ? accent : dim;
      ctx.globalAlpha = p.accent ? 0.6 : 0.28;
      ctx.lineWidth = p.accent ? 1.4 : 1;
      ctx.beginPath();
      ctx.moveTo(p.px, p.py);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    if (advance) m.t += 0.0015;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const accent = readVar(wrap, "--accent", "#2be8c2");
    const dim = readVar(wrap, "--ink-3", "#5e6b70");

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
      ctx.fillStyle = "#070a0c";
      ctx.fillRect(0, 0, w, h);

      const count = Math.min(
        320,
        Math.max(40, Math.round((w / 1000) * 220 * density)),
      );
      const parts: P[] = [];
      for (let i = 0; i < count; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        parts.push({ x, y, px: x, py: y, accent: Math.random() < accentRatio, life: 60 + Math.random() * 200 });
      }
      model.current = { parts, w, h, accent, dim, t: 0 };

      if (reduced) {
        // draw a frozen long-exposure: advance silently a few hundred frames
        for (let i = 0; i < 260; i++) step(true);
      } else {
        step(false);
      }
    };

    build();
    const ro = new ResizeObserver(build);
    ro.observe(wrap);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, density, accentRatio]);

  useRafFrame(() => step(true), active);

  return (
    <div ref={wrapRef} className={`absolute inset-0 ${className}`}>
      <canvas ref={canvasRef} />
    </div>
  );
}

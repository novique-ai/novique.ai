"use client";

import { useEffect, useRef, useState } from "react";

/* ---------------------------------------------------------------------------
 * Shared graphics engine: ONE rAF driver all canvas graphics subscribe to,
 * plus reduced-motion + in-view gating. Keeps many ambient canvases from each
 * spinning their own loop (feasibility-critic requirement).
 * ------------------------------------------------------------------------- */

type Cb = (dt: number) => void;
const subscribers = new Set<Cb>();
let rafId = 0;
let last = 0;
const FRAME_MS = 1000 / 45; // cap ~45fps; neutralizes 144Hz, saves battery

function tick(now: number) {
  rafId = requestAnimationFrame(tick);
  const dt = last ? now - last : FRAME_MS;
  if (dt < FRAME_MS) return; // throttle
  last = now;
  for (const cb of subscribers) {
    try {
      cb(Math.min(dt, 64)); // clamp huge gaps (tab refocus)
    } catch {
      /* a broken subscriber must not kill the loop */
    }
  }
}

function subscribe(cb: Cb) {
  subscribers.add(cb);
  if (!rafId && typeof requestAnimationFrame !== "undefined") {
    last = 0;
    rafId = requestAnimationFrame(tick);
  }
  return () => {
    subscribers.delete(cb);
    if (subscribers.size === 0 && rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };
}

/** Respects prefers-reduced-motion and live OS-toggle changes. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/** True while the element is at least partially on screen and the tab visible. */
export function useInViewActive<T extends Element>(ref: React.RefObject<T | null>): boolean {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let onScreen = false;
    const apply = () => setActive(onScreen && document.visibilityState === "visible");
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        apply();
      },
      { rootMargin: "120px" },
    );
    io.observe(el);
    const vis = () => apply();
    document.addEventListener("visibilitychange", vis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, [ref]);
  return active;
}

/** Subscribe a per-frame callback to the shared driver while `active`. */
export function useRafFrame(cb: Cb, active: boolean) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    if (!active) return;
    return subscribe((dt) => cbRef.current(dt));
  }, [active]);
}

/** Read a CSS custom property off an element (so canvas never hardcodes hex). */
export function readVar(el: Element | null, name: string, fallback: string): string {
  if (!el) return fallback;
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  return v || fallback;
}

/** Device-pixel-ratio capped at 2 (perf). */
export function dpr(): number {
  if (typeof window === "undefined") return 1;
  return Math.min(window.devicePixelRatio || 1, 2);
}

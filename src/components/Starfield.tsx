"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  twinkleSpeed: number;
  phase: number;
  drift: number;
  hue: string;
  /** Depth layer index (0 = farthest/smallest, 2 = nearest/largest). Drives parallax strength. */
  layer: number;
}

const STAR_HUES = ["#e8ddb5", "#d4af37", "#c0c7d1", "#b8a9d9"]; // parchment, gold, silver, lilac

/** Per-layer size/opacity/parallax ranges, far → near. */
const LAYERS = [
  { rMin: 0.25, rMax: 0.9, alphaMin: 0.12, alphaMax: 0.4, parallax: 6 },
  { rMin: 0.6, rMax: 1.7, alphaMin: 0.25, alphaMax: 0.65, parallax: 14 },
  { rMin: 1.1, rMax: 2.6, alphaMin: 0.35, alphaMax: 0.95, parallax: 26 },
] as const;

/**
 * Animated starfield rendered to a single viewport-fixed canvas behind every
 * page (mounted once in the root layout). Stars are split across depth layers
 * with widened size/opacity ranges; nearer layers drift faster and shift more
 * under mouse/scroll parallax for a sense of depth. Pauses entirely when the
 * user prefers reduced motion, falling back to a static field.
 */
export function Starfield({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const context = canvasEl.getContext("2d");
    if (!context) return;
    // Narrowed, non-null locals so the closures below stay type-safe.
    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = context;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;

    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Pointer/scroll parallax target, normalized to [-1, 1] from center.
    let targetPx = 0;
    let targetPy = 0;
    let px = 0;
    let py = 0;

    function seed() {
      // Always cover the viewport (the canvas is fixed), independent of
      // document/scroll height.
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round((width * height) / 5500);
      stars = Array.from({ length: count }, () => {
        const layer = Math.floor(Math.random() * LAYERS.length);
        const spec = LAYERS[layer];
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * (spec.rMax - spec.rMin) + spec.rMin,
          baseAlpha:
            Math.random() * (spec.alphaMax - spec.alphaMin) + spec.alphaMin,
          twinkleSpeed: Math.random() * 0.6 + 0.2,
          phase: Math.random() * Math.PI * 2,
          drift: (Math.random() * 0.08 + 0.02) * (1 + layer * 0.6),
          hue: STAR_HUES[Math.floor(Math.random() * STAR_HUES.length)],
          layer,
        };
      });
    }

    function draw(t: number) {
      // Ease the parallax offset toward its target for a smooth, lagged feel.
      px += (targetPx - px) * 0.06;
      py += (targetPy - py) * 0.06;

      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        const spec = LAYERS[s.layer];
        const offsetX = px * spec.parallax;
        const offsetY = py * spec.parallax;

        const twinkle =
          0.5 + 0.5 * Math.sin(t * 0.001 * s.twinkleSpeed + s.phase);
        ctx.globalAlpha = Math.min(1, s.baseAlpha + twinkle * 0.5);
        ctx.fillStyle = s.hue;
        ctx.beginPath();
        ctx.arc(s.x + offsetX, s.y + offsetY, s.r, 0, Math.PI * 2);
        ctx.fill();

        if (!reduceMotion) {
          s.y -= s.drift;
          if (s.y < -2) {
            s.y = height + 2;
            s.x = Math.random() * width;
          }
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    }

    seed();
    if (reduceMotion) {
      draw(0);
    } else {
      raf = requestAnimationFrame(draw);
    }

    const onResize = () => {
      cancelAnimationFrame(raf);
      seed();
      if (reduceMotion) draw(0);
      else raf = requestAnimationFrame(draw);
    };
    window.addEventListener("resize", onResize);

    // Mouse parallax — skip entirely for touch/reduced-motion.
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetPx = ((e.clientX - rect.left) / Math.max(1, width)) * 2 - 1;
      targetPy = ((e.clientY - rect.top) / Math.max(1, height)) * 2 - 1;
    };

    // Scroll parallax — gentle vertical shift tied to how far the section
    // has scrolled past the top of the viewport.
    const onScroll = () => {
      const rect = canvas.getBoundingClientRect();
      targetPy = Math.max(-1, Math.min(1, -rect.top / Math.max(1, height)));
    };

    if (!reduceMotion && !isTouch) {
      window.addEventListener("pointermove", onPointerMove, {
        passive: true,
      });
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-60 ${className}`}
    />
  );
}

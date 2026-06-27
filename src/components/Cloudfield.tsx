"use client";

import { useEffect, useRef } from "react";

interface Cloud {
  x: number;
  y: number;
  baseR: number;    // base radius of the cloud cluster
  alpha: number;
  speed: number;   // drift speed in px/frame (skipped under reduced-motion)
  phase: number;   // vertical float phase offset
}

const CLOUD_COUNT = 6;

/** Plasma cells for the sun's fiery surface texture (offsets/size relative to R).
    `hot` cells brighten (yellow-white), others deepen (orange) for turbulence. */
const SUN_CELLS = [
  { dx: -0.30, dy: -0.30, r: 0.40, a: 0.40, hot: true },
  { dx: 0.28, dy: -0.16, r: 0.34, a: 0.30, hot: false },
  { dx: 0.10, dy: 0.30, r: 0.42, a: 0.38, hot: true },
  { dx: -0.34, dy: 0.22, r: 0.30, a: 0.30, hot: false },
  { dx: 0.36, dy: 0.30, r: 0.24, a: 0.28, hot: true },
  { dx: -0.06, dy: -0.04, r: 0.26, a: 0.26, hot: true },
  { dx: 0.44, dy: -0.34, r: 0.18, a: 0.24, hot: false },
] as const;

/**
 * Draw a simple cloud shape (3-bump ellipse cluster) centred at (x, y).
 * `baseR` controls the overall scale. No external library needed.
 */
function drawCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  baseR: number,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(255, 252, 248, 0.82)";
  ctx.beginPath();
  // Left puff
  ctx.arc(x - baseR * 0.65, y + baseR * 0.15, baseR * 0.62, 0, Math.PI * 2);
  // Centre puff (tallest)
  ctx.arc(x, y - baseR * 0.1, baseR * 0.85, 0, Math.PI * 2);
  // Right puff
  ctx.arc(x + baseR * 0.75, y + baseR * 0.1, baseR * 0.68, 0, Math.PI * 2);
  // Bottom fill to smooth the base
  ctx.arc(x + baseR * 0.15, y + baseR * 0.45, baseR * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Daytime horizon canvas — a soft blue sky fading to warm cream, with a sun
 * and a handful of slowly drifting clouds. Counterpart to `Starfield` (night).
 *
 * Gates:
 * - Rendered only in day mode via `BackgroundScene` (never mounted at night).
 * - `prefers-reduced-motion`: static sky + sun + clouds, no drift.
 */
export function Cloudfield({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const context = canvasEl.getContext("2d");
    if (!context) return;

    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = context;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let clouds: Cloud[] = [];
    let raf = 0;
    let t = 0;

    function seed() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Spread clouds across the upper 55 % of the viewport with random sizes.
      clouds = Array.from({ length: CLOUD_COUNT }, (_, i) => ({
        x: (width * (i + 0.5)) / CLOUD_COUNT + (Math.random() - 0.5) * (width / CLOUD_COUNT) * 0.8,
        y: height * (0.05 + Math.random() * 0.45),
        baseR: 28 + Math.random() * 32,
        alpha: 0.55 + Math.random() * 0.3,
        speed: 0.08 + Math.random() * 0.14,
        phase: Math.random() * Math.PI * 2,
      }));
    }

    function drawSky() {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0,   "rgba(100, 163, 215, 0.72)");
      skyGrad.addColorStop(0.3, "rgba(140, 190, 225, 0.42)");
      skyGrad.addColorStop(0.6, "rgba(190, 215, 232, 0.18)");
      skyGrad.addColorStop(0.85, "rgba(230, 225, 210, 0.06)");
      skyGrad.addColorStop(1,   "rgba(244, 236, 216, 0)");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);
    }

    function drawSun(tick: number) {
      const sunX = width * 0.76;
      const sunY = height * 0.16;
      const sunR = Math.min(34, width * 0.045);

      // Broad, visible glow halo (warm, soft — no hard rays).
      const halo = ctx.createRadialGradient(
        sunX, sunY, sunR * 0.5,
        sunX, sunY, sunR * 6.5,
      );
      halo.addColorStop(0,    "rgba(255, 223, 120, 0.55)");
      halo.addColorStop(0.22, "rgba(255, 202, 80, 0.30)");
      halo.addColorStop(0.5,  "rgba(255, 184, 60, 0.13)");
      halo.addColorStop(1,    "rgba(255, 160, 40, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR * 6.5, 0, Math.PI * 2);
      ctx.fill();

      // Subtle breathing pulse (skip if reduce-motion).
      const pulse = reduceMotion ? 0 : Math.sin(tick * 0.0008) * 1.5;
      const bodyR = sunR + pulse;

      // Soft inner corona to blend the disc edge into the glow (less cartoonish).
      const corona = ctx.createRadialGradient(
        sunX, sunY, bodyR * 0.75,
        sunX, sunY, bodyR * 2,
      );
      corona.addColorStop(0, "rgba(255, 214, 96, 0.50)");
      corona.addColorStop(1, "rgba(255, 214, 96, 0)");
      ctx.fillStyle = corona;
      ctx.beginPath();
      ctx.arc(sunX, sunY, bodyR * 2, 0, Math.PI * 2);
      ctx.fill();

      // Sun body — warm gradient deepening to fiery orange at the limb.
      const bodyGrad = ctx.createRadialGradient(
        sunX, sunY, 0,
        sunX, sunY, bodyR,
      );
      bodyGrad.addColorStop(0,    "rgba(255, 244, 190, 1)");
      bodyGrad.addColorStop(0.45, "rgba(255, 198, 80, 1)");
      bodyGrad.addColorStop(0.8,  "rgba(248, 152, 48, 1)");
      bodyGrad.addColorStop(1,    "rgba(232, 110, 32, 1)");
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, bodyR, 0, Math.PI * 2);
      ctx.fill();

      // Fiery surface texture — soft plasma cells clipped to the disc.
      ctx.save();
      ctx.beginPath();
      ctx.arc(sunX, sunY, bodyR, 0, Math.PI * 2);
      ctx.clip();
      for (const c of SUN_CELLS) {
        const cx = sunX + c.dx * bodyR;
        const cy = sunY + c.dy * bodyR;
        const cr = c.r * bodyR;
        const cell = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
        const col = c.hot ? "255, 246, 175" : "214, 96, 28";
        cell.addColorStop(0, `rgba(${col}, ${c.a})`);
        cell.addColorStop(1, `rgba(${col}, 0)`);
        ctx.fillStyle = cell;
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Bright limb — a glowing rim around the disc (soft, not a hard stroke).
      const limb = ctx.createRadialGradient(
        sunX, sunY, bodyR * 0.78,
        sunX, sunY, bodyR,
      );
      limb.addColorStop(0, "rgba(255, 226, 130, 0)");
      limb.addColorStop(0.82, "rgba(255, 232, 150, 0.45)");
      limb.addColorStop(1, "rgba(255, 244, 200, 0.85)");
      ctx.fillStyle = limb;
      ctx.beginPath();
      ctx.arc(sunX, sunY, bodyR, 0, Math.PI * 2);
      ctx.fill();

      // Warm bright core.
      const coreR = bodyR * 0.5;
      const core = ctx.createRadialGradient(
        sunX, sunY, 0,
        sunX, sunY, coreR,
      );
      core.addColorStop(0, "rgba(255, 250, 222, 0.85)");
      core.addColorStop(1, "rgba(255, 238, 170, 0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(sunX, sunY, coreR, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawFrame(tick: number) {
      ctx.clearRect(0, 0, width, height);
      drawSky();
      drawSun(tick);

      for (const c of clouds) {
        // Gentle vertical float
        const floatY = reduceMotion
          ? c.y
          : c.y + Math.sin(tick * 0.0003 + c.phase) * 4;
        drawCloud(ctx, c.x, floatY, c.baseR, c.alpha);

        if (!reduceMotion) {
          // Drift left; wrap around when off screen.
          c.x -= c.speed;
          if (c.x < -c.baseR * 2) c.x = width + c.baseR * 2;
        }
      }
    }

    function animate(now: number) {
      t = now;
      drawFrame(t);
      raf = requestAnimationFrame(animate);
    }

    seed();
    if (reduceMotion) {
      drawFrame(0);
    } else {
      raf = requestAnimationFrame(animate);
    }

    const onResize = () => {
      cancelAnimationFrame(raf);
      seed();
      if (reduceMotion) drawFrame(0);
      else raf = requestAnimationFrame(animate);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 -z-10 h-full w-full ${className}`}
    />
  );
}

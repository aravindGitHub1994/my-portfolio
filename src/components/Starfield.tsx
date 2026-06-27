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

interface NightCloud {
  x: number;
  y: number;
  baseR: number;
  alpha: number;
  speed: number;
  phase: number;
}

/** A few drifting clouds for the night sky — dark, moonlit-topped, not white. */
const NIGHT_CLOUD_COUNT = 4;

/** "Maria" patches + smaller craters for the moon's surface — soft grey blotches
    (no hard rings). Offsets/sizes relative to the moon radius; `a` is opacity. */
const MOON_MARIA = [
  { dx: -0.20, dy: -0.28, r: 0.42, a: 0.34 },
  { dx: 0.28, dy: 0.12, r: 0.36, a: 0.30 },
  { dx: -0.04, dy: 0.36, r: 0.30, a: 0.26 },
  { dx: 0.36, dy: -0.30, r: 0.20, a: 0.24 },
  { dx: -0.42, dy: 0.16, r: 0.18, a: 0.22 },
  { dx: 0.10, dy: -0.06, r: 0.14, a: 0.20 },
  { dx: -0.30, dy: 0.40, r: 0.12, a: 0.20 },
] as const;

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
    let nightClouds: NightCloud[] = [];
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

      // Clouds drift across the upper sky; scaled to viewport width.
      const cloudScale = Math.max(0.7, Math.min(1.6, width / 1200));
      nightClouds = Array.from({ length: NIGHT_CLOUD_COUNT }, (_, i) => ({
        x: (width * (i + 0.5)) / NIGHT_CLOUD_COUNT + (Math.random() - 0.5) * 200,
        y: height * (0.08 + Math.random() * 0.4),
        baseR: (34 + Math.random() * 30) * cloudScale,
        alpha: 0.4 + Math.random() * 0.2,
        speed: 0.05 + Math.random() * 0.09,
        phase: Math.random() * Math.PI * 2,
      }));
    }

    /** A soft night cloud — moonlit indigo top fading to a shadowed base. */
    function drawNightCloud(x: number, y: number, baseR: number, alpha: number) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x - baseR * 0.65, y + baseR * 0.15, baseR * 0.62, 0, Math.PI * 2);
      ctx.arc(x, y - baseR * 0.1, baseR * 0.85, 0, Math.PI * 2);
      ctx.arc(x + baseR * 0.75, y + baseR * 0.1, baseR * 0.68, 0, Math.PI * 2);
      ctx.arc(x + baseR * 0.15, y + baseR * 0.45, baseR * 0.55, 0, Math.PI * 2);
      const grad = ctx.createLinearGradient(x, y - baseR, x, y + baseR * 0.7);
      grad.addColorStop(0, "rgba(74, 80, 124, 1)"); // moonlit top
      grad.addColorStop(1, "rgba(26, 28, 54, 1)"); // shadowed base
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }

    function drawNightClouds(t: number) {
      for (const c of nightClouds) {
        const floatY = reduceMotion
          ? c.y
          : c.y + Math.sin(t * 0.0002 + c.phase) * 4;
        drawNightCloud(c.x, floatY, c.baseR, c.alpha);
        if (!reduceMotion) {
          c.x -= c.speed;
          if (c.x < -c.baseR * 2.2) c.x = width + c.baseR * 2.2;
        }
      }
    }

    function drawMoon(t: number) {
      const moonX = width * 0.76;
      const moonY = height * 0.16;
      const moonR = Math.min(34, width * 0.045);

      // Soft cool glow halo, with a gentle breathing pulse (static if reduce-motion).
      const pulse = reduceMotion ? 1 : 1 + Math.sin(t * 0.0006) * 0.05;
      const haloR = moonR * 4.2 * pulse;
      const halo = ctx.createRadialGradient(
        moonX, moonY, moonR * 0.6,
        moonX, moonY, haloR,
      );
      halo.addColorStop(0, "rgba(228, 234, 244, 0.40)");
      halo.addColorStop(0.4, "rgba(198, 206, 220, 0.16)");
      halo.addColorStop(1, "rgba(190, 200, 220, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(moonX, moonY, haloR, 0, Math.PI * 2);
      ctx.fill();

      // Bright, near-opaque body (centered fill so the whole disc reads bright).
      const bodyGrad = ctx.createRadialGradient(
        moonX, moonY, moonR * 0.2,
        moonX, moonY, moonR,
      );
      bodyGrad.addColorStop(0, "rgba(249, 248, 243, 1)");
      bodyGrad.addColorStop(0.7, "rgba(231, 233, 237, 1)");
      bodyGrad.addColorStop(1, "rgba(206, 210, 218, 1)");
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.clip();

      // Maria — soft grey patches for a natural mottled lunar surface.
      for (const m of MOON_MARIA) {
        const mx = moonX + m.dx * moonR;
        const my = moonY + m.dy * moonR;
        const mr = m.r * moonR;
        const patch = ctx.createRadialGradient(mx, my, 0, mx, my, mr);
        patch.addColorStop(0, `rgba(116, 122, 138, ${m.a})`);
        patch.addColorStop(0.65, `rgba(132, 138, 152, ${m.a * 0.55})`);
        patch.addColorStop(1, "rgba(132, 138, 152, 0)");
        ctx.fillStyle = patch;
        ctx.beginPath();
        ctx.arc(mx, my, mr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Gentle terminator — slight shading on the lower-right edge for depth.
      const term = ctx.createRadialGradient(
        moonX - moonR * 0.35, moonY - moonR * 0.35, moonR * 0.3,
        moonX, moonY, moonR * 1.05,
      );
      term.addColorStop(0, "rgba(120, 128, 145, 0)");
      term.addColorStop(1, "rgba(120, 128, 145, 0.28)");
      ctx.fillStyle = term;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
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
        // Scale by 0.6 to preserve the previous canvas-wide opacity-60 look,
        // now that the canvas itself renders at full opacity for the moon.
        ctx.globalAlpha = Math.min(1, s.baseAlpha + twinkle * 0.5) * 0.6;
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
      // Clouds drift over the stars; the moon is drawn last so it stays crisp.
      drawNightClouds(t);
      drawMoon(t);
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
      className={`pointer-events-none fixed inset-0 -z-10 h-full w-full ${className}`}
    />
  );
}

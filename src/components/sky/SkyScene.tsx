"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { THEME_TRANSITION_MS } from "@/lib/theme";
import { nightAlpha, dayAlpha } from "@/components/sky/palette";
import { seedStars, drawStars, type Star } from "@/components/sky/drawStars";
import { drawMoon } from "@/components/sky/drawMoon";
import { drawSun } from "@/components/sky/drawSun";
import {
  seedClouds,
  drawClouds,
  type SkyCloud,
} from "@/components/sky/drawClouds";
import { drawHorizon } from "@/components/sky/drawHorizon";

/**
 * Maps t ∈ [0,1] to a point on a quadratic-Bézier arc from below the horizon
 * (t = 0) to the rest-high position (t = 1).
 *
 * Contract for all slices:
 *   t = 0 → (0.50·w, 1.15·h)  — off-screen below horizon (hidden steady state)
 *   t = 0.5 → mid-arc, near horizon  — twilight crossover during S2 animation
 *   t = 1 → (0.76·w, 0.16·h)  — rest-high, exact parity with Starfield/Cloudfield
 *
 * The sun uses t = progress; the moon uses t = 1 − progress.
 * S2 (Agent B) animates `progress` over THEME_TRANSITION_MS; this function is
 * the stable arc contract — do not change the t=1 endpoint.
 */
export function bodyPosition(
  t: number,
  w: number,
  h: number,
): { x: number; y: number } {
  // Quadratic Bézier: P0 → P1 (control) → P2
  const p0x = w * 0.50;  const p0y = h * 1.15; // below horizon, centred
  const p1x = w * 0.76;  const p1y = h * 0.75; // pulls the arc to the right
  const p2x = w * 0.76;  const p2y = h * 0.16; // rest-high (parity target)

  const mt = 1 - t;
  return {
    x: mt * mt * p0x + 2 * mt * t * p1x + t * t * p2x,
    y: mt * mt * p0y + 2 * mt * t * p1y + t * t * p2y,
  };
}

/** Ease-in-out cubic — slow start/end, used for the arc tween. */
function easeInOut(k: number): number {
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
}

const noop = () => () => {};

/**
 * SSR-safe "are we on the client yet?" flag (server snapshot = false).
 * Folded in from the former `BackgroundScene` hydration gate (removed in S6).
 */
function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}

/**
 * Hydration gate (ADR-004, S6). Renders nothing until the client has mounted,
 * so the canvas never appears during the static prerender or before the
 * resolved theme is known — the CSS `body::before` gradient covers that gap
 * (no flash of the wrong theme). This was previously `BackgroundScene.tsx`;
 * keeping `SkyCanvas` behind this guard preserves its mount-once RAF setup
 * effect (it only runs after the canvas element actually exists).
 */
export function SkyScene({ className = "" }: { className?: string }) {
  const mounted = useMounted();
  if (!mounted) return null;
  return <SkyCanvas className={className} />;
}

/**
 * Unified full-viewport sky canvas (ADR-004, S1 spine + S2 transition driver).
 *
 * One fixed `-z-10` `<canvas>` owning a single RAF loop, drawing everything as
 * a function of `progress` (0 = deep night, 1 = full day).
 *
 * S2: `progress` lives in a ref and is tweened inside the running RAF loop, so a
 * theme change never tears the loop down. The RAF setup effect runs **once**; a
 * separate effect keyed on `transition.id` arms the tween (animate) or snaps
 * (reduced-motion / refocus). A mid-arc re-trigger captures the current progress
 * as the tween start, so it reverses smoothly with no jump/restart. First mount
 * pins progress to the target (no opening arc) and the whole canvas eases in once
 * via CSS opacity (the "gentle settle").
 */
function SkyCanvas({ className = "" }: { className?: string }) {
  const { resolved, transition } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated progress, mutated every frame by the RAF loop (no re-render).
  // Initialised to the resolved target so first mount is already correct (the
  // pre-paint script set the tokens) — there is no opening arc.
  const progressRef = useRef<number>(resolved === "day" ? 1 : 0);
  // Active tween, or null when steady. A re-trigger overwrites `from` with the
  // current progress so a mid-arc reversal is continuous.
  const tweenRef = useRef<{ from: number; to: number; start: number } | null>(
    null,
  );
  const reduceMotionRef = useRef<boolean>(false);
  // Set by the RAF setup effect; lets the transition effect wake the loop (or
  // redraw once under reduced-motion) without owning the canvas closure.
  const wakeRef = useRef<(() => void) | null>(null);
  // Distinguishes first mount (snap + settle) from later toggles (arc).
  const mountedRef = useRef<boolean>(false);

  // RAF setup — runs once. Progress is read from a ref each frame, so a theme
  // change reuses this running loop instead of tearing it down.
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const context = canvasEl.getContext("2d");
    if (!context) return;
    // Narrowed, non-null locals so closures below stay type-safe
    // (same pattern as Starfield.tsx and Cloudfield.tsx).
    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = context;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    reduceMotionRef.current = reduceMotion;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let clouds: SkyCloud[] = [];
    let raf = 0;

    // Parallax offsets normalised to [-1, 1] from centre.
    let targetPx = 0;
    let targetPy = 0;
    let px = 0;
    let py = 0;

    function seed() {
      // Always cover the viewport (the canvas is position:fixed), independent
      // of document/scroll height — same pattern as Starfield.tsx.
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      stars = seedStars(width, height);
      clouds = seedClouds(width, height);
    }

    /** Advance the arc tween toward its target; clears itself when complete. */
    function stepProgress(now: number) {
      const tw = tweenRef.current;
      if (!tw) return;
      const k = Math.min(1, (now - tw.start) / THEME_TRANSITION_MS);
      progressRef.current = tw.from + (tw.to - tw.from) * easeInOut(k);
      if (k >= 1) {
        progressRef.current = tw.to;
        tweenRef.current = null;
      }
    }

    /** Sky background gradient. Transparent at night (CSS body::before handles it).
     *  Day: soft azure gradient matching Cloudfield.tsx drawSky() exactly at progress=1.
     *  The `progress * 2` ramp fades the day sky in from the twilight midpoint. */
    function drawSky(progress: number) {
      ctx.clearRect(0, 0, width, height);
      if (progress <= 0) return; // Night: canvas transparent, CSS gradient shows through.

      const a = Math.min(1, progress * 2); // fade in from twilight midpoint
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0,    `rgba(100, 163, 215, ${(0.72 * a).toFixed(3)})`);
      skyGrad.addColorStop(0.3,  `rgba(140, 190, 225, ${(0.42 * a).toFixed(3)})`);
      skyGrad.addColorStop(0.6,  `rgba(190, 215, 232, ${(0.18 * a).toFixed(3)})`);
      skyGrad.addColorStop(0.85, `rgba(230, 225, 210, ${(0.06 * a).toFixed(3)})`);
      skyGrad.addColorStop(1,    "rgba(244, 236, 216, 0)");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);
    }

    function drawFrame(t: number) {
      stepProgress(t);
      const progress = progressRef.current;

      // Ease parallax offset toward its target for a smooth, lagged feel.
      px += (targetPx - px) * 0.06;
      py += (targetPy - py) * 0.06;

      drawSky(progress);

      // Stars — furthest back, fade out as progress → 1.
      drawStars(ctx, stars, width, height, t, px, py, progress, reduceMotion);

      // Shared body radius — ~1.5x the prior min(34, w*0.045) so the moon photo
      // reads and the sun/moon stay equal during the cross (plan-0002).
      const bodyR = Math.min(51, width * 0.0675);

      // Clouds — one tinted layer (moonlit at night → white by day), drawn
      // behind the celestial bodies so the moon/sun stay crisp.
      drawClouds(ctx, clouds, width, t, progress, reduceMotion);

      const moonAlpha = nightAlpha(progress);
      const moonPos = bodyPosition(1 - progress, width, height);
      drawMoon(ctx, moonPos.x, moonPos.y, bodyR, t, reduceMotion, moonAlpha);

      const sunAlpha = dayAlpha(progress);
      const sunPos = bodyPosition(progress, width, height);
      drawSun(ctx, sunPos.x, sunPos.y, bodyR, t, reduceMotion, sunAlpha);

      // Observatory horizon silhouette on top of everything.
      drawHorizon(ctx, width, height, progress);
    }

    function animate(now: number) {
      drawFrame(now);
      raf = requestAnimationFrame(animate);
    }

    // Exposed to the transition effect: keep the loop running (or, under
    // reduced-motion where there is no loop, redraw once at the new progress).
    wakeRef.current = () => {
      if (reduceMotion) {
        drawFrame(performance.now());
      } else if (raf === 0 && document.visibilityState !== "hidden") {
        raf = requestAnimationFrame(animate);
      }
    };

    seed();
    if (reduceMotion) {
      // Reduced-motion: draw exactly once, no continuous loop.
      drawFrame(performance.now());
    } else {
      raf = requestAnimationFrame(animate);
    }

    // First-mount "gentle settle": fade the whole canvas in once via CSS opacity.
    // Driven imperatively (not React state) so it never re-renders or cascades;
    // independent of the draw helpers' own per-element alpha. Reduced-motion zeroes
    // the CSS transition, so it snaps to visible with no fade.
    requestAnimationFrame(() => {
      canvas.style.opacity = "1";
    });

    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      seed();
      if (reduceMotion) drawFrame(performance.now());
      else raf = requestAnimationFrame(animate);
    };
    window.addEventListener("resize", onResize);

    // Mouse parallax — shifts stars by their depth-layer amount.
    // Skipped for touch screens and reduced-motion (mirrors Starfield.tsx).
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetPx = ((e.clientX - rect.left) / Math.max(1, width)) * 2 - 1;
      targetPy = ((e.clientY - rect.top)  / Math.max(1, height)) * 2 - 1;
    };

    // Scroll parallax — gentle vertical shift tied to the canvas offset.
    const onScroll = () => {
      const rect = canvas.getBoundingClientRect();
      targetPy = Math.max(-1, Math.min(1, -rect.top / Math.max(1, height)));
    };

    if (!reduceMotion && !isTouch) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("scroll",      onScroll,      { passive: true });
    }

    // Pause the RAF loop while the tab is hidden; resume on visibility.
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!reduceMotion && raf === 0) {
        raf = requestAnimationFrame(animate);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      window.removeEventListener("resize",      onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll",      onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // Mount-once: progress/theme flow in through refs, never through deps, so the
    // single RAF loop is reused across theme changes (see the transition effect).
  }, []);

  // Transition driver — keyed on `transition.id`. Arms the tween on an animated
  // toggle, snaps otherwise. The first invocation (mount) just pins progress to
  // the target so there is no opening arc.
  useEffect(() => {
    const target = resolved === "day" ? 1 : 0;

    if (!mountedRef.current) {
      mountedRef.current = true;
      progressRef.current = target;
      return;
    }

    if (transition.animate && !reduceMotionRef.current) {
      // Reverse smoothly from wherever progress currently is (no jump/restart).
      tweenRef.current = {
        from: progressRef.current,
        to: target,
        start: performance.now(),
      };
    } else {
      // Snap (reduced-motion / auto refocus): jump straight to the target.
      tweenRef.current = null;
      progressRef.current = target;
    }
    wakeRef.current?.();
  }, [transition.id, transition.animate, resolved]);

  // Starts at opacity 0; the setup effect fades it to 1 once (gentle settle).
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ opacity: 0 }}
      className={`pointer-events-none fixed inset-0 -z-10 h-full w-full transition-opacity duration-700 ease-out ${className}`}
    />
  );
}

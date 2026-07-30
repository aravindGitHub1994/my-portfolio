// Viewport adaptation (ADR-014 §3, plan-0011 §1.1): the ONE decision of
// "what does the viewport's shape do to the camera?". Pure — no DOM reads,
// no three.js — so the journey camera and the dock aligner can both call it
// and can never disagree. Same shape, and the same reason, as shellLayout.ts.
//
// The defect this exists to fix: the journey camera had no aspect term at
// all. `fov: 50` was set once on the Canvas and never touched, so vertical
// fov held while HORIZONTAL fov collapsed as the viewport narrowed — 73° at
// 1440×900, 67° at iPad landscape, 36° at iPad portrait. The wide shots were
// cropped to a slot. Meanwhile the dock quad, derived analytically from a
// hard-coded 0.26 m dock pose, worked out to 1.2578 × viewport height and so
// only fitted when aspect ≥ 1.2578; a 12.9" iPad in portrait got a 1718 px
// dock on a 1024 px viewport.
//
// Both are the same missing term, which is why one module owns both.

import { CRT_SCREEN_SIZE } from "../builders/crt";

const DEG = Math.PI / 180;
const halfTan = (fovDeg: number) => Math.tan((fovDeg * DEG) / 2);

/** The shipped journey fov, and the fov every viewport at or above
 *  REF_ASPECT still gets. Also the Canvas's initial camera fov. */
export const REF_FOV_DEG = 50;

/** The shipped dock distance — `DOCK_DISTANCE = 0.26` as it stood on main.
 *  Kept as a constant because it is the anchor the rest is derived FROM,
 *  not a number this module is free to choose. */
const DOCK_REF_DISTANCE = 0.26;

/** World height visible at the screen plane from the shipped dock pose:
 *  0.2425 m against a 0.24 m screen, i.e. the screen fills 99 % of the
 *  viewport height. That 1 % is the shipped framing and is carried, not
 *  re-derived — plan-0011 §1.1 sketches this as a `FILL` factor on the
 *  height term and this is that factor (1.0103), expressed as the distance
 *  it actually came from. */
const REF_VISIBLE_H = 2 * DOCK_REF_DISTANCE * halfTan(REF_FOV_DEG);

/**
 * The aspect at which the CRT screen exactly fills the viewport WIDTH at
 * the shipped dock pose — 1.2578. Above it the height binds and nothing
 * about the shipped experience changes; below it the width binds, which is
 * precisely the aspect at which the old constant started overflowing.
 *
 * Deriving the fov's reference from the dock's own break-even means the two
 * halves of this module change regime at the same number, so "at or above
 * REF_ASPECT, nothing moves" is one statement rather than two coincidences.
 */
export const REF_ASPECT = CRT_SCREEN_SIZE.width / REF_VISIBLE_H;

/** Vertical fov ceiling. Holding horizontal fov constant all the way down
 *  wants ~90° vertical at iPad portrait and ~112° at phone portrait, which
 *  is a fisheye — the room bows and the figure stretches at frame edges.
 *  75° is the widest this scene reads straight at. */
const FOV_MAX_DEG = 75;

/** Below this the arithmetic stops meaning anything (a zero-height viewport
 *  during an orientation change reports aspect 0 or Infinity). */
const MIN_ASPECT = 0.2;
const MAX_ASPECT = 8;

/** Horizontal half-fov held constant below REF_ASPECT — 30.4°, i.e. a 60.8°
 *  horizontal frame, which is exactly what a REF_ASPECT viewport sees today. */
const REF_HALF_TAN_H = REF_ASPECT * halfTan(REF_FOV_DEG);

const clampAspect = (aspect: number) =>
  Number.isFinite(aspect)
    ? Math.min(Math.max(aspect, MIN_ASPECT), MAX_ASPECT)
    : REF_ASPECT;

/**
 * Vertical fov in degrees for a viewport aspect.
 *
 * `REF_FOV_DEG` at and above `REF_ASPECT` — no desktop viewport sees any
 * change whatsoever. Below it the vertical fov widens to hold the horizontal
 * frame roughly constant ("hor+"), clamped at `FOV_MAX_DEG` so portrait does
 * not become a fisheye. Monotonically non-increasing in aspect, and
 * continuous at `REF_ASPECT` — both branches return exactly 50 there.
 */
export function journeyFov(aspect: number): number {
  const a = clampAspect(aspect);
  if (a >= REF_ASPECT) return REF_FOV_DEG;
  const fov = (2 * Math.atan(REF_HALF_TAN_H / a)) / DEG;
  return Math.min(FOV_MAX_DEG, fov);
}

/**
 * Camera distance from the CRT screen plane at the dock pose, in metres.
 *
 * The screen must fit in BOTH axes, so the world height the frame has to
 * show is `max(REF_VISIBLE_H, CRT width / aspect)` and the distance is that
 * over `2·tan(fov/2)`. The `max` collapses into a branch: below `REF_ASPECT`
 * the width term always wins (it is `W/a > W/REF_ASPECT = REF_VISIBLE_H` by
 * definition of REF_ASPECT), at or above it the height term always does —
 * so the desktop branch returns the shipped 0.26 exactly, bit for bit,
 * rather than to within a rounding error.
 *
 * **The rect stays analytic on purpose (ADR-014 §3).** The DOM shell
 * cross-fades with the CRT's canvas texture at the dock, and that swap is
 * the one moment the two renderers must agree pixel-for-pixel. A rect fitted
 * to the viewport with a `Math.min` would not sit where the 3D screen is and
 * the swap would become a visible jump. The camera is what moves, never the
 * rect — do not "simplify" this into a fit.
 */
export function dockDistance(aspect: number): number {
  const a = clampAspect(aspect);
  if (a >= REF_ASPECT) return DOCK_REF_DISTANCE;
  return CRT_SCREEN_SIZE.width / a / (2 * halfTan(journeyFov(a)));
}

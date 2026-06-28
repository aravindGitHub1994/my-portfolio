/**
 * Colour-lerp helpers for the night→twilight→day sky palette (ADR-004).
 *
 * `progress` is always in [0, 1]: 0 = deep night, 0.5 = twilight midpoint,
 * 1 = full day. All functions are pure — no DOM/window access.
 */

/** Linear RGBA: r,g,b ∈ [0,255], a ∈ [0,1]. */
export type RGBA = readonly [number, number, number, number];

/** Linear scalar interpolation. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Clamp a value to [lo, hi] (defaults to [0, 1]). */
export function clamp(v: number, lo = 0, hi = 1): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Interpolate between two RGBA tuples. */
export function lerpRGBA(from: RGBA, to: RGBA, t: number): RGBA {
  return [
    lerp(from[0], to[0], t),
    lerp(from[1], to[1], t),
    lerp(from[2], to[2], t),
    lerp(from[3], to[3], t),
  ] as const;
}

/**
 * Three-stop palette lerp: picks the right segment based on progress.
 *   0.0 → night
 *   0.5 → twilight
 *   1.0 → day
 */
export function palette3(
  night: RGBA,
  twilight: RGBA,
  day: RGBA,
  progress: number,
): RGBA {
  const p = clamp(progress);
  if (p <= 0.5) return lerpRGBA(night, twilight, p * 2);
  return lerpRGBA(twilight, day, (p - 0.5) * 2);
}

/** Render an RGBA tuple to a CSS `rgba()` string. */
export function toRGBA(c: RGBA, alphaOverride?: number): string {
  return `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${alphaOverride ?? c[3]})`;
}

// ---------------------------------------------------------------------------
// Sky gradient colour stops — lerped between night / twilight / day.
//
// Night: near-transparent dark navy so the CSS body::before gradient shows
//        through (matching how Starfield.tsx leaves the canvas clear).
// Twilight: deep warm-purple top with an amber/orange glow at the horizon.
// Day: soft azure sky matching Cloudfield.tsx drawSky() at 100%.
// ---------------------------------------------------------------------------

const _SKY_TOP = [
  [7,   7,  26, 0.0 ] as RGBA,   // night: fully transparent — CSS handles it
  [58,  28,  72, 0.92] as RGBA,  // twilight: deep violet
  [100, 163, 215, 0.72] as RGBA, // day: sky blue (matches Cloudfield)
] as const;

const _SKY_BTM = [
  [7,   7,  26, 0.0 ] as RGBA,   // night: transparent base
  [200, 120,  60, 0.30] as RGBA, // twilight: warm amber at horizon
  [244, 236, 216, 0.0 ] as RGBA, // day: transparent cream (CSS bg shows)
] as const;

/** Sky gradient colour at the **top** of the viewport for the given progress. */
export function skyTopAt(progress: number): RGBA {
  return palette3(_SKY_TOP[0], _SKY_TOP[1], _SKY_TOP[2], progress);
}

/** Sky gradient colour at the **bottom** of the viewport for the given progress. */
export function skyBottomAt(progress: number): RGBA {
  return palette3(_SKY_BTM[0], _SKY_BTM[1], _SKY_BTM[2], progress);
}

/**
 * Night-element alpha multiplier.
 * 1 at night (progress 0), fades linearly to 0 at twilight midpoint (0.5).
 */
export function nightAlpha(progress: number): number {
  return clamp(1 - progress * 2);
}

/**
 * Day-element alpha multiplier.
 * 0 at night (progress 0), fades in linearly from twilight midpoint (0.5)
 * to 1 at full day (progress 1).
 */
export function dayAlpha(progress: number): number {
  return clamp((progress - 0.5) * 2);
}

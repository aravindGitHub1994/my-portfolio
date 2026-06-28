/**
 * Cloud helper — a single fluffy cloud layer shared by both themes.
 *
 * One cloud array (the day puff shape from `Cloudfield.tsx:32-53`) is drawn in
 * every theme; only its **fill colour lerps** with `progress` — a cool moonlit
 * tint at night (`progress` 0) → warm white by day (`progress` 1). The previous
 * separate moonlit-indigo night clouds were removed in favour of this.
 *
 * Clouds mutate their `.x` position on each non-reduced-motion frame.
 * `SkyScene.tsx` passes the array by reference and draws it behind the
 * sun/moon so the celestial bodies stay crisp.
 */

import { lerp } from "@/components/sky/palette";

/** A single cloud puff cluster. */
export interface SkyCloud {
  x: number;
  y: number;
  baseR: number;
  alpha: number; // individual base opacity
  speed: number; // drift speed px/frame
  phase: number; // vertical float phase offset
}

/** Number of clouds (matches the old Cloudfield day count). */
const CLOUD_COUNT = 6;

/** Seed the cloud array for the given viewport (call on mount + resize). */
export function seedClouds(w: number, h: number): SkyCloud[] {
  return Array.from({ length: CLOUD_COUNT }, (_, i) => ({
    x:
      (w * (i + 0.5)) / CLOUD_COUNT +
      (Math.random() - 0.5) * (w / CLOUD_COUNT) * 0.8,
    y: h * (0.05 + Math.random() * 0.45),
    baseR: 28 + Math.random() * 32,
    alpha: 0.55 + Math.random() * 0.3,
    speed: 0.08 + Math.random() * 0.14,
    phase: Math.random() * Math.PI * 2,
  }));
}

/**
 * Draw the four-puff cloud shape at (x, y). Geometry is verbatim from
 * `Cloudfield.tsx:44-51`.
 */
function puffPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  baseR: number,
): void {
  ctx.beginPath();
  ctx.arc(x - baseR * 0.65, y + baseR * 0.15, baseR * 0.62, 0, Math.PI * 2); // left
  ctx.arc(x,                 y - baseR * 0.1,  baseR * 0.85, 0, Math.PI * 2); // centre (tallest)
  ctx.arc(x + baseR * 0.75,  y + baseR * 0.1,  baseR * 0.68, 0, Math.PI * 2); // right
  ctx.arc(x + baseR * 0.15,  y + baseR * 0.45, baseR * 0.55, 0, Math.PI * 2); // base fill
}

/**
 * Cloud fill for the current `progress`. Night = a soft moonlit blue-grey that
 * reads against the dark sky; day = warm white. A faint vertical gradient gives
 * the puff a little form in both themes.
 */
function cloudGradient(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  baseR: number,
  progress: number,
): CanvasGradient {
  // Top (lit) and base (shadowed) colours, each lerped night → day.
  const topR = Math.round(lerp(96, 255, progress));
  const topG = Math.round(lerp(104, 252, progress));
  const topB = Math.round(lerp(138, 248, progress));
  const botR = Math.round(lerp(58, 232, progress));
  const botG = Math.round(lerp(64, 228, progress));
  const botB = Math.round(lerp(96, 224, progress));
  const grad = ctx.createLinearGradient(x, y - baseR, x, y + baseR * 0.7);
  grad.addColorStop(0, `rgb(${topR}, ${topG}, ${topB})`);
  grad.addColorStop(1, `rgb(${botR}, ${botG}, ${botB})`);
  return grad;
}

/**
 * Draw the cloud layer, recoloured night → day by `progress`. Always visible in
 * both steady states. Mutates cloud `.x` positions when `!reduceMotion`.
 */
export function drawClouds(
  ctx: CanvasRenderingContext2D,
  clouds: SkyCloud[],
  w: number,
  t: number,
  progress: number,
  reduceMotion: boolean,
): void {
  for (const c of clouds) {
    const floatY = reduceMotion
      ? c.y
      : c.y + Math.sin(t * 0.0003 + c.phase) * 4;

    ctx.save();
    ctx.globalAlpha = c.alpha * 0.9;
    puffPath(ctx, c.x, floatY, c.baseR);
    ctx.fillStyle = cloudGradient(ctx, c.x, floatY, c.baseR, progress);
    ctx.fill();
    ctx.restore();

    if (!reduceMotion) {
      c.x -= c.speed;
      if (c.x < -c.baseR * 2) c.x = w + c.baseR * 2;
    }
  }
}

/**
 * Sun renderer — procedural, themeable, upgraded (ADR-004, S5 · Agent C).
 *
 * Kept fully procedural (per ADR-004 "Real sun texture too" was rejected) so it
 * stays re-tintable across twilight. Upgrades over the S1 migration:
 *   - **layered multi-stop corona** (three falloff bands instead of one);
 *   - **limb darkening** + a glowing rim;
 *   - **finer granulation** — the original `SUN_CELLS` plus a denser fine-cell
 *     layer for a more convective surface;
 *   - **gentle limb flicker** — a subtle per-frame modulation of the rim and a
 *     tiny radius shimmer, disabled under reduced-motion.
 *
 * `SUN_CELLS` is re-exported unchanged for any other consumer.
 */

/** Plasma cells for the sun's fiery surface texture (verbatim from Cloudfield.tsx). */
export const SUN_CELLS = [
  { dx: -0.30, dy: -0.30, r: 0.40, a: 0.40, hot: true  },
  { dx:  0.28, dy: -0.16, r: 0.34, a: 0.30, hot: false },
  { dx:  0.10, dy:  0.30, r: 0.42, a: 0.38, hot: true  },
  { dx: -0.34, dy:  0.22, r: 0.30, a: 0.30, hot: false },
  { dx:  0.36, dy:  0.30, r: 0.24, a: 0.28, hot: true  },
  { dx: -0.06, dy: -0.04, r: 0.26, a: 0.26, hot: true  },
  { dx:  0.44, dy: -0.34, r: 0.18, a: 0.24, hot: false },
] as const;

/** Finer granulation cells layered over SUN_CELLS for a more convective surface. */
const SUN_FINE_CELLS = [
  { dx: -0.12, dy: -0.46, r: 0.14, a: 0.20, hot: true  },
  { dx:  0.20, dy:  0.04, r: 0.12, a: 0.18, hot: false },
  { dx: -0.46, dy: -0.10, r: 0.13, a: 0.18, hot: true  },
  { dx:  0.06, dy:  0.50, r: 0.11, a: 0.16, hot: false },
  { dx:  0.48, dy:  0.06, r: 0.10, a: 0.16, hot: true  },
  { dx: -0.24, dy:  0.46, r: 0.12, a: 0.16, hot: false },
  { dx:  0.30, dy: -0.46, r: 0.10, a: 0.14, hot: true  },
  { dx: -0.02, dy:  0.16, r: 0.10, a: 0.14, hot: false },
  { dx:  0.36, dy:  0.46, r: 0.09, a: 0.14, hot: true  },
] as const;

function drawCells(
  ctx: CanvasRenderingContext2D,
  cells: readonly { dx: number; dy: number; r: number; a: number; hot: boolean }[],
  x: number,
  y: number,
  bodyR: number,
): void {
  for (const c of cells) {
    const cx = x + c.dx * bodyR;
    const cy = y + c.dy * bodyR;
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
}

/**
 * Draw the procedural sun centred at (x, y) with radius r.
 *
 * @param ctx          The 2-D rendering context.
 * @param x            Sun centre x (CSS pixels).
 * @param y            Sun centre y (CSS pixels).
 * @param r            Sun radius (CSS pixels).
 * @param t            Current timestamp in ms (breathing + limb flicker).
 * @param reduceMotion If true, suppress the breathing pulse and limb flicker.
 * @param alpha        Overall opacity multiplier (from `dayAlpha(progress)`).
 */
export function drawSun(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  t: number,
  reduceMotion: boolean,
  alpha: number,
): void {
  if (alpha <= 0) return;

  ctx.save();
  ctx.globalAlpha = alpha;

  // --- Layered multi-stop corona (three bands, broad → tight) ----------------
  const outer = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 7);
  outer.addColorStop(0,    "rgba(255, 223, 120, 0.45)");
  outer.addColorStop(0.18, "rgba(255, 205,  90, 0.26)");
  outer.addColorStop(0.42, "rgba(255, 186,  64, 0.12)");
  outer.addColorStop(0.7,  "rgba(255, 168,  48, 0.05)");
  outer.addColorStop(1,    "rgba(255, 150,  36, 0)");
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.arc(x, y, r * 7, 0, Math.PI * 2);
  ctx.fill();

  const mid = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 3.2);
  mid.addColorStop(0,   "rgba(255, 222, 110, 0.40)");
  mid.addColorStop(0.5, "rgba(255, 198,  78, 0.16)");
  mid.addColorStop(1,   "rgba(255, 186,  64, 0)");
  ctx.fillStyle = mid;
  ctx.beginPath();
  ctx.arc(x, y, r * 3.2, 0, Math.PI * 2);
  ctx.fill();

  // Subtle breathing + limb flicker (both disabled under reduced-motion).
  const pulse = reduceMotion ? 0 : Math.sin(t * 0.0008) * 1.5;
  const flicker = reduceMotion
    ? 0
    : (Math.sin(t * 0.013) + Math.sin(t * 0.031 + 1.7)) * 0.5; // ~[-1,1]
  const bodyR = r + pulse + flicker * 0.4;

  // Inner corona blending the disc edge into the glow.
  const inner = ctx.createRadialGradient(x, y, bodyR * 0.75, x, y, bodyR * 2);
  inner.addColorStop(0, "rgba(255, 214, 96, 0.50)");
  inner.addColorStop(1, "rgba(255, 214, 96, 0)");
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.arc(x, y, bodyR * 2, 0, Math.PI * 2);
  ctx.fill();

  // --- Sun body: limb darkening (bright core → fiery, deeper-orange limb) -----
  const bodyGrad = ctx.createRadialGradient(x, y, 0, x, y, bodyR);
  bodyGrad.addColorStop(0,    "rgba(255, 246, 198, 1)");
  bodyGrad.addColorStop(0.42, "rgba(255, 202,  86, 1)");
  bodyGrad.addColorStop(0.78, "rgba(248, 150,  46, 1)");
  bodyGrad.addColorStop(0.93, "rgba(228, 104,  30, 1)");
  bodyGrad.addColorStop(1,    "rgba(198,  84,  26, 1)"); // darkened limb
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(x, y, bodyR, 0, Math.PI * 2);
  ctx.fill();

  // --- Granulation: coarse then fine, clipped to the disc ---------------------
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, bodyR, 0, Math.PI * 2);
  ctx.clip();
  drawCells(ctx, SUN_CELLS, x, y, bodyR);
  drawCells(ctx, SUN_FINE_CELLS, x, y, bodyR);
  ctx.restore();

  // --- Glowing limb rim, modulated by the flicker ----------------------------
  const rimA = 0.85 + (reduceMotion ? 0 : flicker * 0.12);
  const limb = ctx.createRadialGradient(x, y, bodyR * 0.8, x, y, bodyR);
  limb.addColorStop(0,    "rgba(255, 226, 130, 0)");
  limb.addColorStop(0.84, `rgba(255, 232, 150, ${(0.42 + flicker * 0.06).toFixed(3)})`);
  limb.addColorStop(1,    `rgba(255, 244, 200, ${rimA.toFixed(3)})`);
  ctx.fillStyle = limb;
  ctx.beginPath();
  ctx.arc(x, y, bodyR, 0, Math.PI * 2);
  ctx.fill();

  // Warm bright core.
  const coreR = bodyR * 0.5;
  const core = ctx.createRadialGradient(x, y, 0, x, y, coreR);
  core.addColorStop(0, "rgba(255, 250, 222, 0.85)");
  core.addColorStop(1, "rgba(255, 238, 170, 0)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, coreR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

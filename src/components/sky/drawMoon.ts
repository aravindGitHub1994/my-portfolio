/**
 * Moon renderer — hybrid texture + procedural fallback (ADR-004; asset upgrade
 * per implementation-plan-0002).
 *
 * Draws the real near-side photo `public/celestial/moon.png` directly. The source
 * is a **transparent-background** realistic moon that is already self-lit (bright
 * upper-left → soft lower-right terminator), so it is rendered *faithfully*: no
 * circular clip, no overscan, and none of the heavy limb-darkening / cool
 * terminator overlays the previous white-background webp needed to hide its fringe.
 * Only a faint cool halo / earthshine is layered behind it so it seats in the
 * night sky.
 *
 * The image is loaded **once**, lazily, from inside the runtime (the RAF loop /
 * effect) — never at module top level — and cached. **If the asset is missing or
 * fails to load (`onerror`, or simply not ready yet), it falls back to the
 * original procedural moon** (the `MOON_MARIA` patches + body gradient migrated
 * from `Starfield.tsx`). The scene and build never break, and the `onerror`
 * handler keeps the failure from throwing.
 */

/** "Maria" patches + smaller craters (verbatim from Starfield.tsx) — fallback only. */
const MOON_MARIA = [
  { dx: -0.20, dy: -0.28, r: 0.42, a: 0.34 },
  { dx:  0.28, dy:  0.12, r: 0.36, a: 0.30 },
  { dx: -0.04, dy:  0.36, r: 0.30, a: 0.26 },
  { dx:  0.36, dy: -0.30, r: 0.20, a: 0.24 },
  { dx: -0.42, dy:  0.16, r: 0.18, a: 0.22 },
  { dx:  0.10, dy: -0.06, r: 0.14, a: 0.20 },
  { dx: -0.30, dy:  0.40, r: 0.12, a: 0.20 },
] as const;

// ---------------------------------------------------------------------------
// Lazy, cached texture load. All `Image` access is deferred to runtime so the
// static prerender never touches the DOM (ADR-001). A failed load sets
// `moonFailed` (no throw) and the renderer uses the procedural fallback.
// ---------------------------------------------------------------------------

let moonImg: HTMLImageElement | null = null;
let moonReady = false;
let moonFailed = false;

/** Kick off the one-time texture load. Safe to call every frame (idempotent). */
function ensureMoonImage(): void {
  if (moonImg || moonFailed) return;
  if (typeof window === "undefined") return; // never during SSR/prerender
  const img = new window.Image();
  img.onload = () => {
    moonReady = true;
  };
  img.onerror = () => {
    // Asset absent or undecodable → fall back procedurally. Swallow the error
    // so nothing throws; the browser may still log a benign 404 network entry.
    moonFailed = true;
    moonReady = false;
  };
  img.src = "/celestial/moon.png";
  moonImg = img;
}

/**
 * Draw the moon centred at (x, y) with radius r.
 *
 * @param ctx          The 2-D rendering context.
 * @param x            Moon centre x (CSS pixels).
 * @param y            Moon centre y (CSS pixels).
 * @param r            Moon radius (CSS pixels).
 * @param t            Current timestamp in ms (halo breathing).
 * @param reduceMotion If true, skip the breathing pulse.
 * @param alpha        Overall opacity multiplier (from `nightAlpha(progress)`).
 */
export function drawMoon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  t: number,
  reduceMotion: boolean,
  alpha: number,
): void {
  if (alpha <= 0) return;
  ensureMoonImage();

  ctx.save();
  ctx.globalAlpha = alpha;

  // --- Cool halo + earthshine (shared by texture and fallback paths) ---------
  const pulse = reduceMotion ? 1 : 1 + Math.sin(t * 0.0006) * 0.05;
  const haloR = r * 4.2 * pulse;
  const halo = ctx.createRadialGradient(x, y, r * 0.6, x, y, haloR);
  halo.addColorStop(0,   "rgba(228, 234, 244, 0.40)");
  halo.addColorStop(0.4, "rgba(198, 206, 220, 0.16)");
  halo.addColorStop(1,   "rgba(190, 200, 220, 0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, haloR, 0, Math.PI * 2);
  ctx.fill();

  if (moonReady && moonImg) {
    drawTexturedMoon(ctx, moonImg, x, y, r);
  } else {
    drawProceduralMoon(ctx, x, y, r);
  }

  ctx.restore();
}

/**
 * Real photo path — faithful blit.
 *
 * The source is transparent and already lit, so it is drawn straight into the
 * disc's bounding box with no clip and no shading overlays. A tiny overscan
 * (`1.02`) absorbs the photo's own thin transparent margin so the lit disc fills
 * the intended radius; the transparent corners cost nothing.
 */
function drawTexturedMoon(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  r: number,
): void {
  const over = r * 1.02;
  ctx.drawImage(img, x - over, y - over, over * 2, over * 2);
}

/** Procedural fallback — the original Starfield blob (maria + body gradient). */
function drawProceduralMoon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
): void {
  // Bright, near-opaque body.
  const bodyGrad = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
  bodyGrad.addColorStop(0,   "rgba(249, 248, 243, 1)");
  bodyGrad.addColorStop(0.7, "rgba(231, 233, 237, 1)");
  bodyGrad.addColorStop(1,   "rgba(206, 210, 218, 1)");
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();

  // Maria — soft grey patches for a natural mottled lunar surface.
  for (const m of MOON_MARIA) {
    const mx = x + m.dx * r;
    const my = y + m.dy * r;
    const mr = m.r * r;
    const patch = ctx.createRadialGradient(mx, my, 0, mx, my, mr);
    patch.addColorStop(0,    `rgba(116, 122, 138, ${m.a})`);
    patch.addColorStop(0.65, `rgba(132, 138, 152, ${m.a * 0.55})`);
    patch.addColorStop(1,    "rgba(132, 138, 152, 0)");
    ctx.fillStyle = patch;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Gentle terminator — slight shading on the lower-right edge for depth.
  const term = ctx.createRadialGradient(
    x - r * 0.35, y - r * 0.35, r * 0.3,
    x, y, r * 1.05,
  );
  term.addColorStop(0, "rgba(120, 128, 145, 0)");
  term.addColorStop(1, "rgba(120, 128, 145, 0.28)");
  ctx.fillStyle = term;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

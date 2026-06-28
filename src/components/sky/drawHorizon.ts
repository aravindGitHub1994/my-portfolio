/**
 * Horizon — procedural illustrated landscape + nestled observatory + scrim
 * (ADR-004; rebuilt per implementation-plan-0002, revision 2).
 *
 * The horizon is drawn **from scratch** in the flat-illustration style of
 * `docs/horizon_reference.jpg`: distant snow-capped mountains, a band of darker
 * tree-dotted foothills, and two rolling green hill layers in front. Every layer
 * colour-lerps from a dark cool night palette (`progress` 0) to the bright
 * reference palette (`progress` 1), so the terrain "comes alive" at sunrise and
 * stays legible under either sky. This replaces the earlier `mountains.png` band
 * (whose "transparency" was a baked-in checkerboard) — no terrain image is used.
 *
 * The **observatory** keeps its user-supplied silhouette (`observatory.png`,
 * black-on-white → luminance→alpha mask, tint-filled per frame). It is drawn
 * *between* the foothills and the front hills so the green hills overlap its base
 * and it reads as part of the mountainscape, placed right-of-centre and
 * **horizontally flipped** so its telescope faces up-left toward the Pisces
 * asterism (which lives in the upper-left of the sky, see `drawStars.ts`).
 *
 * All image/`document` access is deferred to runtime (ADR-001). If the
 * observatory asset fails to load the landscape simply renders without it; the
 * build and scene never break.
 */

import { lerp, clamp } from "@/components/sky/palette";

// ---------------------------------------------------------------------------
// Tree silhouettes — lazy, cached, runtime-only. The black-on-white source is
// converted once to a luminance→alpha mask (rgb zeroed) for cheap per-frame tint.
// (The observatory is drawn procedurally — see `drawObservatory`.)
// ---------------------------------------------------------------------------

let treeImg: HTMLImageElement | null = null;
let treeReady = false;
let treeFailed = false;
let treeMask: HTMLCanvasElement | null = null;

/** Reusable stamp canvas for per-frame tinted blits (avoids realloc). */
let stamp: HTMLCanvasElement | null = null;
let stampCtx: CanvasRenderingContext2D | null = null;

/** Load a silhouette-on-white PNG once and cache its luminance→alpha mask. */
function ensureMaskAsset(
  src: string,
  img: HTMLImageElement | null,
  setImg: (i: HTMLImageElement) => void,
  onMask: (m: HTMLCanvasElement | null) => void,
): void {
  if (typeof window === "undefined") return; // never during SSR/prerender
  if (img) return;
  const i = new window.Image();
  i.onload = () => onMask(buildLuminanceMask(i));
  i.onerror = () => onMask(null);
  i.src = src;
  setImg(i);
}

function ensureHorizonAssets(): void {
  if (!treeImg && !treeFailed) {
    ensureMaskAsset(
      "/celestial/trees.png",
      treeImg,
      (i) => (treeImg = i),
      (m) => {
        treeMask = m;
        if (m) treeReady = true;
        else treeFailed = true;
      },
    );
  }
}

/**
 * Luminance→alpha mask for a silhouette-on-white source: white bg → transparent,
 * black silhouette → opaque, anti-aliased edges preserved. RGB is zeroed so the
 * result can be tint-filled cheaply each frame. Built **once** on image load.
 */
function buildLuminanceMask(img: HTMLImageElement): HTMLCanvasElement | null {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const cx = c.getContext("2d");
  if (!cx) return null;
  cx.drawImage(img, 0, 0);
  let data: ImageData;
  try {
    data = cx.getImageData(0, 0, c.width, c.height);
  } catch {
    return null; // tainted/unsupported — caller falls back to triangle pines
  }
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    const a = (1 - lum / 255) * (d[i + 3] / 255);
    d[i] = 0;
    d[i + 1] = 0;
    d[i + 2] = 0;
    d[i + 3] = Math.round(a * 255);
  }
  cx.putImageData(data, 0, 0);
  return c;
}

// ---------------------------------------------------------------------------
// Palette — each terrain element lerps night (p=0) → day/reference (p=1).
// ---------------------------------------------------------------------------

type RGB = readonly [number, number, number];

interface Band {
  night: RGB;
  day: RGB;
}

const MOUNTAIN: Band = { night: [38, 46, 66], day: [122, 142, 168] };
const SNOW: Band = { night: [116, 126, 148], day: [240, 245, 250] };
const FOOTHILL: Band = { night: [20, 30, 42], day: [60, 96, 92] };
const FOOT_PINE: Band = { night: [12, 20, 28], day: [40, 66, 54] };
const MID_HILL: Band = { night: [16, 28, 26], day: [92, 140, 66] };
const MID_PINE: Band = { night: [10, 18, 20], day: [46, 80, 50] };
const FRONT_HILL: Band = { night: [22, 40, 32], day: [134, 174, 78] };
// Foreground conifers — a touch richer/nearer than the mid pines.
const FRONT_PINE: Band = { night: [12, 22, 22], day: [38, 64, 42] };
// Slightly lighter than the night hills / darker than the day hills, so the
// observatory reads as a built structure (not a black void) under either sky.
const OBSERVATORY: Band = { night: [58, 68, 92], day: [46, 58, 74] };

function mix(b: Band, p: number, alpha = 1): string {
  const r = Math.round(lerp(b.night[0], b.day[0], p));
  const g = Math.round(lerp(b.night[1], b.day[1], p));
  const bl = Math.round(lerp(b.night[2], b.day[2], p));
  return `rgba(${r}, ${g}, ${bl}, ${alpha})`;
}

// ---------------------------------------------------------------------------
// Rolling-hill silhouette: two summed sines for a natural undulating crest,
// filled down to the bottom of the viewport.
// ---------------------------------------------------------------------------

interface HillShape {
  crestY: number;
  amp: number;
  freq: number;
  phase: number;
}

/** Crest y at a given x for a hill shape (two summed sines). */
function crestAt(x: number, s: HillShape): number {
  return (
    s.crestY +
    Math.sin(x * s.freq + s.phase) * s.amp +
    Math.sin(x * s.freq * 2.3 + s.phase * 1.7) * s.amp * 0.4
  );
}

function fillHill(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  s: HillShape,
  color: string,
): void {
  const step = Math.max(6, w / 140);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, crestAt(0, s));
  for (let x = step; x <= w; x += step) ctx.lineTo(x, crestAt(x, s));
  ctx.lineTo(w, crestAt(w, s));
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

/** A simple stacked-triangle conifer with a short trunk, base at (x, baseY). */
function drawPine(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  ph: number,
  color: string,
): void {
  const halfW = ph * 0.42;
  ctx.fillStyle = color;
  // Trunk.
  ctx.fillRect(x - ph * 0.05, baseY - ph * 0.12, ph * 0.1, ph * 0.14);
  // Three stacked tiers, narrowing upward.
  for (let i = 0; i < 3; i++) {
    const tierTop = baseY - ph * (0.18 + i * 0.3);
    const tierBot = baseY - ph * (0.02 + i * 0.3);
    const hw = halfW * (1 - i * 0.26);
    ctx.beginPath();
    ctx.moveTo(x, tierTop);
    ctx.lineTo(x - hw, tierBot);
    ctx.lineTo(x + hw, tierBot);
    ctx.closePath();
    ctx.fill();
  }
}

interface Peak {
  cx: number; // centre, fraction of width
  ph: number; // height above base, fraction of viewport height
  hw: number; // half-width, fraction of width
}

const PEAKS: readonly Peak[] = [
  { cx: 0.3, ph: 0.1, hw: 0.1 },
  { cx: 0.44, ph: 0.17, hw: 0.13 },
  { cx: 0.58, ph: 0.22, hw: 0.15 }, // tallest, centre
  { cx: 0.72, ph: 0.15, hw: 0.12 },
  { cx: 0.85, ph: 0.11, hw: 0.1 },
];

function drawMountains(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  baseY: number,
  p: number,
): void {
  const body = mix(MOUNTAIN, p);
  const snow = mix(SNOW, p);

  // Bodies (overlapping triangles → a ridgeline).
  ctx.fillStyle = body;
  for (const pk of PEAKS) {
    const cx = pk.cx * w;
    const hw = pk.hw * w;
    const apexY = baseY - pk.ph * h;
    ctx.beginPath();
    ctx.moveTo(cx - hw, baseY);
    ctx.lineTo(cx, apexY);
    ctx.lineTo(cx + hw, baseY);
    ctx.closePath();
    ctx.fill();
  }

  // Snow caps — a white wedge near each apex with a jagged snowline.
  ctx.fillStyle = snow;
  for (const pk of PEAKS) {
    const cx = pk.cx * w;
    const hw = pk.hw * w;
    const peakH = pk.ph * h;
    const apexY = baseY - peakH;
    const capH = peakH * 0.34;
    const capBot = apexY + capH;
    const capHW = hw * (capH / peakH);
    ctx.beginPath();
    ctx.moveTo(cx, apexY);
    ctx.lineTo(cx - capHW, capBot);
    // Jagged snowline: dip up, down, up across the base.
    ctx.lineTo(cx - capHW * 0.4, capBot - capH * 0.28);
    ctx.lineTo(cx, capBot + capH * 0.08);
    ctx.lineTo(cx + capHW * 0.45, capBot - capH * 0.3);
    ctx.lineTo(cx + capHW, capBot);
    ctx.closePath();
    ctx.fill();
  }
}

interface SrcRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/**
 * Tint a cached alpha mask (whole, or a sub-rect) and blit it to (dx,dy,dw,dh),
 * optionally horizontally flipped. Uses one reused stamp canvas.
 */
function stampTinted(
  ctx: CanvasRenderingContext2D,
  mask: HTMLCanvasElement,
  src: SrcRect | null,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  tint: string,
  flip: boolean,
): void {
  const sw = Math.max(1, Math.round(dw));
  const sh = Math.max(1, Math.round(dh));
  if (!stamp) {
    stamp = document.createElement("canvas");
    stampCtx = stamp.getContext("2d");
  }
  if (!stampCtx || !stamp) return;
  if (stamp.width !== sw) stamp.width = sw;
  if (stamp.height !== sh) stamp.height = sh;

  const sc = stampCtx;
  sc.clearRect(0, 0, sw, sh);
  sc.globalCompositeOperation = "source-over";
  if (src) sc.drawImage(mask, src.sx, src.sy, src.sw, src.sh, 0, 0, sw, sh);
  else sc.drawImage(mask, 0, 0, sw, sh);
  sc.globalCompositeOperation = "source-in";
  sc.fillStyle = tint;
  sc.fillRect(0, 0, sw, sh);
  sc.globalCompositeOperation = "source-over";

  ctx.save();
  if (flip) {
    ctx.translate(dx + dw, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(stamp, 0, 0, dw, dh);
  } else {
    ctx.drawImage(stamp, dx, dy, dw, dh);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Conifers — three real silhouettes sliced from `trees.png` (black-on-white →
// luminance mask). Each slice is a sub-rect of the mask, in normalised [0,1]
// coords (trunk base ≈ bottom edge of the slice). They are stamped tinted at
// each ridge position, cycling through the three shapes for variety. The
// stacked-triangle `drawPine` remains as a pre-load fallback only.
// ---------------------------------------------------------------------------

const TREE_SLICES: readonly SrcRect[] = [
  { sx: 0.03, sy: 0.14, sw: 0.36, sh: 0.78 }, // left  (medium)
  { sx: 0.36, sy: 0.04, sw: 0.32, sh: 0.91 }, // centre (tallest)
  { sx: 0.65, sy: 0.15, sw: 0.33, sh: 0.77 }, // right (medium)
];

/** Draw one conifer of height `treeH`, trunk base at (cx, baseY). */
function drawTree(
  ctx: CanvasRenderingContext2D,
  mask: HTMLCanvasElement,
  slice: SrcRect,
  cx: number,
  baseY: number,
  treeH: number,
  tint: string,
  flip: boolean,
): void {
  const mw = mask.width;
  const mh = mask.height;
  const src: SrcRect = {
    sx: slice.sx * mw,
    sy: slice.sy * mh,
    sw: slice.sw * mw,
    sh: slice.sh * mh,
  };
  const aspect = (slice.sw * mw) / (slice.sh * mh);
  const dw = treeH * aspect;
  stampTinted(ctx, mask, src, cx - dw / 2, baseY - treeH, dw, treeH, tint, flip);
}

/** Place a conifer at a ridge point — real silhouette if loaded, else fallback. */
function placeConifer(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  treeH: number,
  tint: string,
  slice: number,
  flip = false,
): void {
  if (treeReady && treeMask) {
    drawTree(ctx, treeMask, TREE_SLICES[slice % TREE_SLICES.length], x, baseY, treeH, tint, flip);
  } else {
    drawPine(ctx, x, baseY, treeH, tint);
  }
}

// ---------------------------------------------------------------------------
// Tree placement — deterministic, art-directed descriptors (stable across
// frames/resizes; all positions/sizes are fractions of w/h). Three depth tiers
// drawn at the right point in the paint order so nearer hills overlap farther
// trees' bases. Sizes span small (distant foothills) → large (foreground), and
// the big foreground trees are kept to the left/right edges so they never sit
// behind the centred hero text (`max-w-4xl`, roughly x 0.15–0.85).
// ---------------------------------------------------------------------------

interface TreeDesc {
  x: number; // centre, fraction of width
  h: number; // height, fraction of viewport height
  slice: number; // index into TREE_SLICES
  flip?: boolean;
}

const FOOT_TREES: readonly TreeDesc[] = [
  { x: 0.04, h: 0.032, slice: 0 },
  { x: 0.11, h: 0.027, slice: 2, flip: true },
  { x: 0.17, h: 0.04, slice: 1 },
  { x: 0.23, h: 0.03, slice: 0, flip: true },
  { x: 0.31, h: 0.046, slice: 1 },
  { x: 0.38, h: 0.03, slice: 2 },
  { x: 0.5, h: 0.034, slice: 0, flip: true },
  { x: 0.58, h: 0.044, slice: 1 },
  { x: 0.67, h: 0.029, slice: 2 },
  { x: 0.88, h: 0.038, slice: 0 },
  { x: 0.95, h: 0.03, slice: 1, flip: true },
];

const MID_TREES: readonly TreeDesc[] = [
  { x: 0.09, h: 0.06, slice: 1 },
  { x: 0.2, h: 0.078, slice: 0, flip: true },
  { x: 0.34, h: 0.054, slice: 2 },
  { x: 0.47, h: 0.07, slice: 1, flip: true },
  { x: 0.62, h: 0.058, slice: 0 },
  { x: 0.71, h: 0.062, slice: 2, flip: true }, // left of the observatory
  { x: 0.86, h: 0.052, slice: 1 }, // right of the observatory
];

const FRONT_TREES: readonly TreeDesc[] = [
  { x: 0.05, h: 0.12, slice: 1 },
  { x: 0.13, h: 0.095, slice: 0, flip: true },
  { x: 0.9, h: 0.13, slice: 1, flip: true },
  { x: 0.97, h: 0.1, slice: 2 },
];

/** Draw a depth tier of conifers along a hill ridge. */
function drawTreeTier(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  hill: HillShape,
  trees: readonly TreeDesc[],
  tint: string,
): void {
  for (const t of trees) {
    const x = w * t.x;
    placeConifer(ctx, x, crestAt(x, hill) + 1, h * t.h, tint, t.slice, t.flip);
  }
}

/**
 * Procedural observatory — a domed cylindrical tower with a tapered telescope
 * barrel angled up-left toward Pisces. Drawn as a clean silhouette in the
 * observatory tint; nothing else is baked in, so the surrounding conifers (green
 * tree tint) and the green hills (which overlap its base) provide its setting and
 * it reads as nestled into the slope. `bw` is the tower width.
 */
function drawObservatory(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  bw: number,
  tint: string,
): void {
  ctx.save();
  ctx.fillStyle = tint;

  const half = bw / 2;
  const towerH = bw * 1.15;
  const towerTop = baseY - towerH;
  const rd = half * 1.12; // dome overhangs the tower slightly

  // Cylindrical tower base.
  ctx.fillRect(cx - half, towerTop, bw, towerH);
  // Rim band where the dome meets the tower.
  ctx.fillRect(cx - rd, towerTop - bw * 0.04, rd * 2, bw * 0.12);
  // Hemispherical dome.
  ctx.beginPath();
  ctx.arc(cx, towerTop, rd, Math.PI, 0);
  ctx.fill();

  // Telescope barrel — a tapered tube emerging from the dome, pointing up-left.
  // Pivot near the dome's upper-left and a shallow angle so a good length of
  // barrel clearly juts out past the dome rather than hiding inside it.
  const pivotX = cx - rd * 0.28;
  const pivotY = towerTop - rd * 0.62;
  const ang = (Math.PI / 180) * 207; // up-left (dx < 0, dy < 0)
  const len = rd * 2.3;
  const w0 = rd * 0.3; // mount end
  const w1 = rd * 0.46; // aperture end (wider)
  ctx.save();
  ctx.translate(pivotX, pivotY);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, -w0 / 2);
  ctx.lineTo(len, -w1 / 2);
  ctx.lineTo(len, w1 / 2);
  ctx.lineTo(0, w0 / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Per-frame draw.
// ---------------------------------------------------------------------------

export function drawHorizon(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  progress: number,
): void {
  const p = clamp(progress);
  ensureHorizonAssets();

  // Layer geometry (absolute y; smaller = higher on screen).
  const mountainBaseY = h * 0.74;
  const foothill: HillShape = { crestY: h * 0.66, amp: h * 0.018, freq: 0.006, phase: 0.6 };
  const midHill: HillShape = { crestY: h * 0.72, amp: h * 0.03, freq: 0.0045, phase: 2.1 };
  const frontHill: HillShape = { crestY: h * 0.8, amp: h * 0.04, freq: 0.0035, phase: 4.0 };

  // 0 · Contrast scrim — drawn first (over the existing sky/stars) so it darkens
  //     the lower-sky band behind body text, then gets covered by the hills
  //     below. Strength peaks at the twilight midpoint while a bright body dips
  //     low; kept subtle since the terrain already covers the lower frame.
  const peak = 1 - Math.abs(p - 0.5) * 2; // 0 at steady states, 1 at twilight
  const scrimA = 0.06 + peak * 0.26;
  const scrimTop = frontHill.crestY - h * 0.26;
  const tintR = Math.round(lerp(10, 28, p));
  const tintG = Math.round(lerp(12, 26, p));
  const tintB = Math.round(lerp(30, 40, p));
  const scrim = ctx.createLinearGradient(0, scrimTop, 0, frontHill.crestY);
  scrim.addColorStop(0, `rgba(${tintR}, ${tintG}, ${tintB}, 0)`);
  scrim.addColorStop(1, `rgba(${tintR}, ${tintG}, ${tintB}, ${scrimA.toFixed(3)})`);
  ctx.save();
  ctx.fillStyle = scrim;
  ctx.fillRect(0, scrimTop, w, frontHill.crestY - scrimTop);
  ctx.restore();

  // 1 · Distant snow-capped mountains.
  drawMountains(ctx, w, h, mountainBaseY, p);

  // 2 · Foothill band + a scatter of small distant pines on its ridge.
  fillHill(ctx, w, h, foothill, mix(FOOTHILL, p));
  drawTreeTier(ctx, w, h, foothill, FOOT_TREES, mix(FOOT_PINE, p));

  // 3 · Observatory — procedural domed tower, right-of-centre, with its base set
  //     low so the mid/front hills (drawn next) overlap it and it nestles into
  //     the slope. Telescope faces up-left toward Pisces.
  const obsBw = clamp(Math.round(w * 0.062), 56, 112);
  drawObservatory(ctx, w * 0.79, h * 0.81, obsBw, mix(OBSERVATORY, p));

  // 4 · Mid green hill (overlaps the observatory base) + medium pines.
  fillHill(ctx, w, h, midHill, mix(MID_HILL, p));
  drawTreeTier(ctx, w, h, midHill, MID_TREES, mix(MID_PINE, p));

  // 5 · Front green hill (foreground) + large edge pines (clear of the text).
  fillHill(ctx, w, h, frontHill, mix(FRONT_HILL, p));
  drawTreeTier(ctx, w, h, frontHill, FRONT_TREES, mix(FRONT_PINE, p));
}

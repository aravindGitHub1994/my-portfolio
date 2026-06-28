/**
 * Star-field renderer — realistic rebuild (ADR-004, S4 · Agent C).
 *
 * Replaces the flat per-layer ranges of the S1 migration with:
 *   - a **power-law magnitude distribution** (many faint, few bright); star
 *     size + brightness both correlate with magnitude;
 *   - subtle **4-point diffraction spikes** on the brightest stars only;
 *   - intermittent **shooting stars** (meteor pool + scheduler, module-scoped so
 *     the mount-once RAF loop drives it without re-seeding) — skipped entirely
 *     under reduced-motion;
 *   - a fixed, recognisable **Pisces** asterism (two fish + connecting cord +
 *     the Circlet ring) whose faint constellation lines **brighten as the cursor
 *     nears**, traced from `docs/pisces contellation.jpg`.
 *
 * Everything (stars, Pisces, meteors) fades to fully invisible as `progress → 1`
 * via the `nightAlpha` multiplier from `palette.ts`. Cursor/scroll parallax from
 * the S1 spine is preserved (the `px/py` offsets are still applied per layer).
 */

import { nightAlpha, clamp } from "@/components/sky/palette";

export interface Star {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  twinkleSpeed: number;
  phase: number;
  drift: number;
  hue: string;
  /** Depth layer index (0 = farthest/smallest, 2 = nearest/largest). Drives parallax. */
  layer: number;
  /** Power-law magnitude in [0,1]: ~0 = faint (most stars), ~1 = bright (few). */
  mag: number;
  /** True only for the brightest stars — they get diffraction spikes. */
  spike: boolean;
}

/** Colour palette — parchment, gold, silver, lilac (matches Starfield.tsx). */
const STAR_HUES = ["#e8ddb5", "#d4af37", "#c0c7d1", "#b8a9d9"] as const;

/** Per-layer parallax strength only, far → near (size/alpha now come from magnitude). */
const LAYER_PARALLAX = [6, 14, 26] as const;

/**
 * Power-law magnitude: `random^EXP` skews values toward 0, so the vast majority
 * of stars are faint and only a handful approach 1 (bright). EXP > 1 sharpens
 * the skew. With EXP = 2.6 roughly 6% of stars clear the spike threshold.
 */
const MAG_EXP = 2.6;
/** Stars brighter than this get diffraction spikes (top few %). */
const SPIKE_THRESHOLD = 0.86;

/**
 * Generate the star array for the given viewport. Call once on mount and on
 * resize (same density as the legacy Starfield: one star per ~5500 px²).
 */
export function seedStars(w: number, h: number): Star[] {
  const count = Math.round((w * h) / 5500);
  return Array.from({ length: count }, () => {
    const layer = Math.floor(Math.random() * LAYER_PARALLAX.length);
    const mag = Math.pow(Math.random(), MAG_EXP);
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      // Size grows with magnitude: faint stars ~0.35px, the brightest ~2.9px.
      r: 0.35 + Math.pow(mag, 1.4) * 2.55,
      // Brightness tracks magnitude too.
      baseAlpha: 0.1 + mag * 0.8,
      twinkleSpeed: Math.random() * 0.6 + 0.2,
      phase: Math.random() * Math.PI * 2,
      drift: (Math.random() * 0.08 + 0.02) * (1 + layer * 0.6),
      // Brightest stars skew white/silver; faint stars keep the warm palette.
      hue:
        mag > SPIKE_THRESHOLD
          ? "#f4f1e6"
          : STAR_HUES[Math.floor(Math.random() * STAR_HUES.length)],
      layer,
      mag,
      spike: mag > SPIKE_THRESHOLD,
    };
  });
}

// ---------------------------------------------------------------------------
// Diffraction spikes — subtle 4-point cross on the brightest stars only.
// ---------------------------------------------------------------------------

/** Draw a soft 4-point cross centred at (x,y). Gradient strokes fade at both ends. */
function drawSpikes(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  len: number,
  alpha: number,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 0.7;
  ctx.lineCap = "round";

  // Horizontal arm.
  const hg = ctx.createLinearGradient(x - len, y, x + len, y);
  hg.addColorStop(0, "rgba(244, 241, 230, 0)");
  hg.addColorStop(0.5, "rgba(255, 255, 250, 0.9)");
  hg.addColorStop(1, "rgba(244, 241, 230, 0)");
  ctx.strokeStyle = hg;
  ctx.beginPath();
  ctx.moveTo(x - len, y);
  ctx.lineTo(x + len, y);
  ctx.stroke();

  // Vertical arm.
  const vg = ctx.createLinearGradient(x, y - len, x, y + len);
  vg.addColorStop(0, "rgba(244, 241, 230, 0)");
  vg.addColorStop(0.5, "rgba(255, 255, 250, 0.9)");
  vg.addColorStop(1, "rgba(244, 241, 230, 0)");
  ctx.strokeStyle = vg;
  ctx.beginPath();
  ctx.moveTo(x, y - len);
  ctx.lineTo(x, y + len);
  ctx.stroke();

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Pisces asterism — traced (relative) from `docs/pisces contellation.jpg`.
//
// Normalised coordinates in a [0,1] box (x → right, y → down). Topology: a
// bright vertex star (Alrescha) at the bottom; a short cord rising left to the
// other fish; a long cord rising right through a bright knot into the Circlet
// ring (the western fish's head, ~6 stars in a loop). Recognisable, not
// astrometrically exact (per the brief).
// ---------------------------------------------------------------------------

interface PiscesStar {
  x: number;
  y: number;
  /** Relative brightness in [0,1] — drives dot size and spikes. */
  mag: number;
}

const PISCES_STARS: readonly PiscesStar[] = [
  { x: 0.39, y: 0.86, mag: 1.0 }, // 0  Alrescha — bright vertex (bottom)
  { x: 0.28, y: 0.64, mag: 0.45 }, // 1  left cord
  { x: 0.16, y: 0.54, mag: 0.5 }, // 2  left cord
  { x: 0.07, y: 0.56, mag: 0.9 }, // 3  left fish — bright endpoint
  { x: 0.49, y: 0.63, mag: 0.45 }, // 4  right cord
  { x: 0.58, y: 0.4, mag: 0.92 }, // 5  knot — bright bend
  { x: 0.65, y: 0.3, mag: 0.55 }, // 6  cord → ring junction
  { x: 0.7, y: 0.2, mag: 0.5 }, // 7  Circlet
  { x: 0.8, y: 0.13, mag: 0.88 }, // 8  Circlet — bright top
  { x: 0.9, y: 0.18, mag: 0.5 }, // 9  Circlet
  { x: 0.91, y: 0.3, mag: 0.55 }, // 10 Circlet
  { x: 0.79, y: 0.33, mag: 0.5 }, // 11 Circlet
  { x: 0.8, y: 0.24, mag: 0.35 }, // 12 Circlet interior (dot only, no edges)
] as const;

/** Connecting-line topology (index pairs into PISCES_STARS). */
const PISCES_EDGES: readonly (readonly [number, number])[] = [
  // Left cord (to the northern fish).
  [0, 1],
  [1, 2],
  [2, 3],
  // Long right cord (vertex → knot → ring junction).
  [0, 4],
  [4, 5],
  [5, 6],
  // The Circlet ring (closed loop).
  [6, 7],
  [7, 8],
  [8, 9],
  [9, 10],
  [10, 11],
  [11, 6],
] as const;

/** Parallax depth for the whole asterism (kept far/stable). */
const PISCES_PARALLAX = 9;

/** Draw the Pisces asterism, brightening its lines as the cursor nears. */
function drawPisces(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  px: number,
  py: number,
  batchAlpha: number,
): void {
  // Stable placement: upper-left region, clear of the moon's rest spot (0.76w).
  const boxW = clamp(w * 0.5, 320, 640);
  const boxH = boxW * 0.75;
  const originX = w * 0.05;
  const originY = h * 0.08;

  const offsetX = px * PISCES_PARALLAX;
  const offsetY = py * PISCES_PARALLAX;

  // Resolve every star to screen space once.
  const pts = PISCES_STARS.map((s) => ({
    x: originX + s.x * boxW + offsetX,
    y: originY + s.y * boxH + offsetY,
    mag: s.mag,
  }));

  // Cursor proximity → line brightness. Reconstruct the cursor position from the
  // normalised parallax offsets (centre when idle / touch / reduced-motion).
  const cursorX = ((px + 1) / 2) * w;
  const cursorY = ((py + 1) / 2) * h;
  let nearest = Infinity;
  for (const p of pts) {
    const d = Math.hypot(p.x - cursorX, p.y - cursorY);
    if (d < nearest) nearest = d;
  }
  const threshold = boxW * 0.4;
  const proximity = clamp(1 - nearest / threshold);
  // Faint by default; up to ~5x brighter right next to the asterism.
  const lineAlpha = (0.06 + proximity * 0.28) * batchAlpha;

  // Constellation lines.
  if (lineAlpha > 0.002) {
    ctx.save();
    ctx.globalAlpha = lineAlpha;
    ctx.strokeStyle = "rgba(196, 206, 226, 1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const [a, b] of PISCES_EDGES) {
      ctx.moveTo(pts[a].x, pts[a].y);
      ctx.lineTo(pts[b].x, pts[b].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Asterism stars — drawn brighter/larger than the random field so the shape
  // reads even before the lines light up.
  for (const p of pts) {
    const r = 0.8 + p.mag * 1.8;
    const dotAlpha = (0.5 + p.mag * 0.5) * batchAlpha;
    ctx.globalAlpha = dotAlpha;
    ctx.fillStyle = p.mag > 0.8 ? "#f4f1e6" : "#cdd4e2";
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    if (p.mag > 0.85) {
      drawSpikes(ctx, p.x, p.y, r * 4.5, dotAlpha * 0.8);
    }
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// Shooting stars — module-scoped meteor pool + scheduler.
//
// State lives at module scope (not in the Star array) so the mount-once RAF loop
// drives it across frames without re-seeding on resize. A meteor spawns every
// ~8–20 s while it is night enough to be visible. Skipped entirely under
// reduced-motion (the loop simply never advances the scheduler).
// ---------------------------------------------------------------------------

interface Meteor {
  x: number;
  y: number;
  vx: number; // px / ms
  vy: number; // px / ms
  len: number; // streak length in px
  life: number; // remaining lifetime in ms
  maxLife: number;
  active: boolean;
}

const METEOR_POOL_SIZE = 3;
const meteors: Meteor[] = [];
/** Next spawn timestamp (ms, RAF clock). 0 = uninitialised (armed lazily). */
let nextMeteorSpawn = 0;
/** Previous frame timestamp, for dt; -1 = uninitialised. */
let lastMeteorT = -1;

function randomMeteorDelay(): number {
  return 8000 + Math.random() * 12000; // 8–20 s
}

function spawnMeteor(w: number, h: number): void {
  let m = meteors.find((x) => !x.active);
  if (!m) {
    if (meteors.length >= METEOR_POOL_SIZE) return;
    m = {
      x: 0, y: 0, vx: 0, vy: 0, len: 0, life: 0, maxLife: 0, active: false,
    };
    meteors.push(m);
  }
  // Enter from the top band, travel diagonally down. Random direction L↔R.
  const dir = Math.random() < 0.5 ? 1 : -1;
  const angle = (Math.PI / 180) * (28 + Math.random() * 26); // 28–54° from horizontal
  const speed = 0.45 + Math.random() * 0.45; // px/ms
  m.x = dir === 1 ? Math.random() * w * 0.5 : w * 0.5 + Math.random() * w * 0.5;
  m.y = Math.random() * h * 0.35;
  m.vx = Math.cos(angle) * speed * dir;
  m.vy = Math.sin(angle) * speed;
  m.len = 80 + Math.random() * 110;
  m.maxLife = 600 + Math.random() * 700;
  m.life = m.maxLife;
  m.active = true;
}

function updateAndDrawMeteors(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  batchAlpha: number,
): void {
  // dt clamped so a backgrounded tab returning doesn't teleport meteors.
  const dt = lastMeteorT < 0 ? 16 : Math.min(50, t - lastMeteorT);
  lastMeteorT = t;

  // Schedule only while the night sky is actually visible.
  if (batchAlpha > 0.1) {
    if (nextMeteorSpawn === 0) nextMeteorSpawn = t + randomMeteorDelay();
    if (t >= nextMeteorSpawn) {
      spawnMeteor(w, h);
      nextMeteorSpawn = t + randomMeteorDelay();
    }
  } else {
    // Re-arm so meteors don't all fire the instant night returns.
    nextMeteorSpawn = 0;
  }

  for (const m of meteors) {
    if (!m.active) continue;
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    m.life -= dt;
    if (
      m.life <= 0 ||
      m.x < -m.len ||
      m.x > w + m.len ||
      m.y > h + m.len
    ) {
      m.active = false;
      continue;
    }

    // Fade in/out over the lifetime; bright at mid-life.
    const lifeT = m.life / m.maxLife; // 1 → 0
    const fade = Math.sin(lifeT * Math.PI); // 0 → 1 → 0
    const a = fade * batchAlpha;
    if (a <= 0.01) continue;

    // Streak: a fading tail trailing the head along the velocity vector.
    const speed = Math.hypot(m.vx, m.vy) || 1;
    const tailX = m.x - (m.vx / speed) * m.len;
    const tailY = m.y - (m.vy / speed) * m.len;
    const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
    grad.addColorStop(0, "rgba(255, 255, 245, 0)");
    grad.addColorStop(1, `rgba(255, 255, 245, ${a.toFixed(3)})`);

    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(m.x, m.y);
    ctx.stroke();
    // Bright head.
    ctx.globalAlpha = a;
    ctx.fillStyle = "rgba(255, 255, 250, 1)";
    ctx.beginPath();
    ctx.arc(m.x, m.y, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Per-frame draw.
// ---------------------------------------------------------------------------

/**
 * Draw the night layer for the current frame and advance star drift (unless
 * `reduceMotion`). Mutates star positions and the module-scoped meteor pool.
 *
 * @param ctx        The 2-D rendering context.
 * @param stars      Star array from `seedStars()`.
 * @param w          Logical viewport width (CSS pixels).
 * @param h          Logical viewport height (CSS pixels).
 * @param t          Current timestamp in ms (twinkle + meteor timing).
 * @param px         Parallax x offset, normalised to [-1, 1].
 * @param py         Parallax y offset, normalised to [-1, 1].
 * @param progress   Sky progress (0 = night, 1 = day). Everything fades out → 1.
 * @param reduceMotion  If true: no drift, no twinkle, no meteors (draw once).
 */
export function drawStars(
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  w: number,
  h: number,
  t: number,
  px: number,
  py: number,
  progress: number,
  reduceMotion: boolean,
): void {
  const batchAlpha = nightAlpha(progress);
  if (batchAlpha <= 0) return;

  for (const s of stars) {
    const parallax = LAYER_PARALLAX[s.layer];
    const offsetX = px * parallax;
    const offsetY = py * parallax;

    const twinkle = reduceMotion
      ? 0.5
      : 0.5 + 0.5 * Math.sin(t * 0.001 * s.twinkleSpeed + s.phase);

    // Scale by 0.6 to preserve the previous canvas-wide opacity-60 look.
    const alpha = Math.min(1, s.baseAlpha + twinkle * 0.5) * 0.6 * batchAlpha;
    const sx = s.x + offsetX;
    const sy = s.y + offsetY;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = s.hue;
    ctx.beginPath();
    ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
    ctx.fill();

    // Diffraction spikes on the brightest stars only, modulated by twinkle.
    if (s.spike) {
      drawSpikes(ctx, sx, sy, s.r * 5, alpha * (0.5 + twinkle * 0.5));
    }

    if (!reduceMotion) {
      s.y -= s.drift;
      if (s.y < -2) {
        s.y = h + 2;
        s.x = Math.random() * w;
      }
    }
  }

  ctx.globalAlpha = 1;

  // Pisces asterism (lines brighten near the cursor).
  drawPisces(ctx, w, h, px, py, batchAlpha);

  // Shooting stars — animated only (never under reduced-motion).
  if (!reduceMotion) {
    updateAndDrawMeteors(ctx, w, h, t, batchAlpha);
  }

  ctx.globalAlpha = 1;
}

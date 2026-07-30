// Desktop painter (plan-0009 §3.1): draws the Win98-pastiche shell from
// win98State into a 2D canvas that CrtScreen uploads as a CanvasTexture.
// EVENT-DRIVEN ONLY — callers repaint on state change, never per frame.
// All colors are canvas effect colors (era pastiche), not UI tokens; all
// glyphs are original pixel-art-style canvas ops — zero Microsoft assets
// (ADR-012 §10). 3.3 replaces the placeholder POST/splash beats with the
// real bootScript-paced sequences; 5.x apps enrich window content.

import {
  DESKTOP_H,
  DESKTOP_W,
  type IconGlyph,
  type Win98State,
  type Win98Window,
} from "@/lib/win98State";
import { BSOD_PROMPT, BSOD_TITLE, bsodLines } from "@/lib/bsodScript";

// Era palette (pastiche, sRGB).
const TEAL = "#2f7f78";
const CHROME = "#c0c0c0";
const CHROME_LIGHT = "#e8e8e8";
const CHROME_DARK = "#7a7a7a";
const CHROME_DARKER = "#3c3c3c";
const TITLE_A = "#1a2e6e";
const TITLE_B = "#3a6ea5";
const TITLE_INACTIVE_A = "#6e6e6e";
const TITLE_INACTIVE_B = "#9a9a9a";
const TEXT_DARK = "#111111";
const TEXT_LIGHT = "#f4f4f4";
const AMBER = "#ffb347";
const CRASH_BLUE = "#0000aa";

const TASKBAR_H = 28;
const FONT = "11px Verdana, Geneva, sans-serif";
const FONT_BOLD = "bold 11px Verdana, Geneva, sans-serif";

/** Gallery suggestion (6.5) — deliberately the **same** numbers `Gallery.tsx`
 *  lays its grid out with (`DESKTOP_GRID`, `GAP`, `PAD`), not a scaled-down
 *  echo of them: both renderers draw in DESKTOP_W×DESKTOP_H virtual units, so
 *  the suggestion and the real grid share a *pitch* — same cell size, same
 *  columns, same number of rows before the fold — and the chapter-4 cross-fade
 *  changes the content of the cells rather than their scale. It is **not**
 *  pixel registration: the DOM's origin sits a few units off this one (window
 *  padding, a taller toolbar, `w98-field`'s border), and chasing that would
 *  couple the painter to `Window.tsx`'s box model for no gain. Change them
 *  there, change them here. */
const GALLERY_COLS = 5;
const GALLERY_CELL_W = 80;
const GALLERY_CELL_H = 60; // 80 × THUMB_H/THUMB_W — the shipped 4:3 crop.
const GALLERY_GAP = 4;
const GALLERY_PAD = 8;
/** Cell tones, indexed and never random — the painter can be asked to repaint
 *  the same state twice, and a reshuffled grid would read as the window
 *  flickering. Seven of them because there are five columns: a count sharing a
 *  factor with `GALLERY_COLS` paints every column one flat colour. */
const GALLERY_TONES = [
  "#8a93a0",
  "#9aa08f",
  "#7f8794",
  "#a39a8c",
  "#8f8a94",
  "#96a09a",
  "#8b8f86",
];

/** Sunken/raised 3D bevel — the whole chrome language in one helper. */
function bevel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  raised: boolean,
) {
  ctx.fillStyle = CHROME;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = raised ? CHROME_LIGHT : CHROME_DARKER;
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y, 1, h);
  ctx.fillStyle = raised ? CHROME_DARKER : CHROME_LIGHT;
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x + w - 1, y, 1, h);
  ctx.fillStyle = raised ? CHROME_DARK : CHROME_LIGHT;
  ctx.fillRect(x + 1, y + h - 2, w - 2, 1);
  ctx.fillRect(x + w - 2, y + 1, 1, h - 2);
}

/** Original 16×16-ish glyphs drawn at (x, y), scaled to `size`. */
function drawGlyph(
  ctx: CanvasRenderingContext2D,
  glyph: IconGlyph,
  x: number,
  y: number,
  size: number,
) {
  const u = size / 16;
  ctx.save();
  ctx.translate(x, y);
  switch (glyph) {
    case "computer":
      ctx.fillStyle = "#d8d0bd";
      ctx.fillRect(1 * u, 2 * u, 14 * u, 10 * u);
      ctx.fillStyle = "#1c3f66";
      ctx.fillRect(3 * u, 4 * u, 10 * u, 6 * u);
      ctx.fillStyle = "#d8d0bd";
      ctx.fillRect(5 * u, 13 * u, 6 * u, 2 * u);
      break;
    case "folder":
      ctx.fillStyle = "#e8c25a";
      ctx.fillRect(1 * u, 5 * u, 14 * u, 9 * u);
      ctx.fillRect(1 * u, 3 * u, 6 * u, 3 * u);
      ctx.fillStyle = "#f4d67e";
      ctx.fillRect(2 * u, 6 * u, 12 * u, 2 * u);
      break;
    case "document":
      ctx.fillStyle = "#f4f4f4";
      ctx.fillRect(3 * u, 1 * u, 10 * u, 14 * u);
      ctx.fillStyle = "#7a86b8";
      for (let i = 0; i < 4; i++) ctx.fillRect(5 * u, (4 + i * 3) * u, 6 * u, u);
      break;
    case "notepad":
      ctx.fillStyle = "#f4f0da";
      ctx.fillRect(3 * u, 1 * u, 10 * u, 14 * u);
      ctx.fillStyle = "#8a8a7a";
      ctx.fillRect(3 * u, 3 * u, 10 * u, u);
      ctx.fillStyle = "#a0a0a0";
      for (let i = 0; i < 3; i++) ctx.fillRect(5 * u, (6 + i * 3) * u, 6 * u, u);
      break;
    case "envelope":
      ctx.fillStyle = "#ede7d6";
      ctx.fillRect(1 * u, 4 * u, 14 * u, 9 * u);
      ctx.strokeStyle = "#8a8272";
      ctx.lineWidth = u;
      ctx.beginPath();
      ctx.moveTo(1 * u, 4 * u);
      ctx.lineTo(8 * u, 9 * u);
      ctx.lineTo(15 * u, 4 * u);
      ctx.stroke();
      break;
    case "globe":
      ctx.fillStyle = "#3a76b8";
      ctx.beginPath();
      ctx.arc(8 * u, 8 * u, 6.5 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#bcd8ee";
      ctx.lineWidth = u;
      ctx.beginPath();
      ctx.ellipse(8 * u, 8 * u, 6.5 * u, 2.6 * u, 0, 0, Math.PI * 2);
      ctx.moveTo(8 * u, 1.5 * u);
      ctx.lineTo(8 * u, 14.5 * u);
      ctx.stroke();
      break;
    case "bin":
      ctx.fillStyle = "#9fb3ac";
      ctx.fillRect(4 * u, 4 * u, 8 * u, 11 * u);
      ctx.fillRect(3 * u, 3 * u, 10 * u, 2 * u);
      ctx.fillStyle = "#5d726b";
      for (let i = 0; i < 3; i++) ctx.fillRect((5 + i * 3) * u, 6 * u, u, 7 * u);
      break;
    case "mine":
      ctx.fillStyle = "#2a2a2a";
      ctx.beginPath();
      ctx.arc(8 * u, 8 * u, 4.5 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#2a2a2a";
      ctx.lineWidth = u;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 4;
        ctx.moveTo(8 * u - Math.cos(a) * 7 * u, 8 * u - Math.sin(a) * 7 * u);
        ctx.lineTo(8 * u + Math.cos(a) * 7 * u, 8 * u + Math.sin(a) * 7 * u);
      }
      ctx.stroke();
      ctx.fillStyle = "#e8e8e8";
      ctx.fillRect(6 * u, 6 * u, 2 * u, 2 * u);
      break;
    // 6.3 — the Gallery. **This switch is not compile-forced** (unlike
    // `pixelIcons.tsx`'s `Record<IconGlyph, …>`), so a glyph added to
    // `IconGlyph` and missed here draws nothing at all on the CRT rather than
    // failing to build. Hence the deliberate mirror below.
    //
    // The cells are byte-for-byte the ones in `pixelIcons.tsx`'s `gallery`
    // entry, in the same layer order, so the two renderers are **pixel**
    // identical at every integer scale — not merely alike, which is all
    // `globe` and `mine` manage (they use arcs here and cells there).
    // Change one, change both.
    case "gallery": {
      const CELLS: [string, [number, number, number, number][]][] = [
        ["#8a8272", [[1, 1, 14, 1], [1, 13, 14, 1], [1, 2, 1, 11], [14, 2, 1, 11]]],
        ["#ede7d6", [[2, 2, 12, 11]]],
        ["#6fb0c8", [[3, 3, 10, 9]]],
        ["#e8c25a", [[10, 4, 2, 2]]],
        ["#5d726b", [[7, 6, 1, 1], [6, 7, 3, 1], [5, 8, 5, 1], [4, 9, 7, 1], [3, 10, 10, 2]]],
      ];
      for (const [fill, cells] of CELLS) {
        ctx.fillStyle = fill;
        for (const [cx, cy, cw, ch] of cells) {
          ctx.fillRect(cx * u, cy * u, cw * u, ch * u);
        }
      }
      break;
    }
  }
  ctx.restore();
}

/** The site's own 2×2 window-frame mark (poster pastiche — not a logo). */
function drawFrameMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, size / 8);
  ctx.strokeRect(x, y, size, size);
  ctx.beginPath();
  ctx.moveTo(x + size / 2, y);
  ctx.lineTo(x + size / 2, y + size);
  ctx.moveTo(x, y + size / 2);
  ctx.lineTo(x + size, y + size / 2);
  ctx.stroke();
}

function paintPost(ctx: CanvasRenderingContext2D, state: Win98State) {
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, DESKTOP_W, DESKTOP_H);
  ctx.fillStyle = "#b8b8a8";
  ctx.font = "13px 'Courier New', monospace";
  ctx.textAlign = "left";
  // 3.3: the bootScript sequencer pushes the stats-as-hardware lines
  // into state one beat at a time; a block cursor sits on the last line.
  state.postLines.forEach((line, i) => ctx.fillText(line, 24, 40 + i * 20));
  ctx.fillRect(
    24 + ctx.measureText(state.postLines.at(-1) ?? "").width + 6,
    28 + Math.max(state.postLines.length - 1, 0) * 20,
    9,
    14,
  );
}

function paintSplash(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, 0, DESKTOP_H);
  g.addColorStop(0, "#274d72");
  g.addColorStop(1, "#79a8b8");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, DESKTOP_W, DESKTOP_H);
  // Cloud pastiche — fixed layout, no RNG (painter must be deterministic).
  ctx.fillStyle = "#ffffff";
  const clouds: [number, number, number, number][] = [
    [110, 120, 90, 24],
    [420, 90, 120, 30],
    [300, 220, 150, 34],
    [520, 300, 100, 26],
    [140, 330, 110, 28],
  ];
  for (const [cx, cy, rx, ry] of clouds) {
    ctx.globalAlpha = 0.16;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  drawFrameMark(ctx, DESKTOP_W / 2 - 32, 150, 64, "#ffffff");
  ctx.fillStyle = "#f4f8f9";
  ctx.textAlign = "center";
  ctx.font = "bold 34px Verdana, Geneva, sans-serif";
  ctx.fillText("workstation", DESKTOP_W / 2, 270);
  ctx.font = "bold 48px Verdana, Geneva, sans-serif";
  ctx.fillText("98", DESKTOP_W / 2, 322);
}

function paintShutdown(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#0a0703";
  ctx.fillRect(0, 0, DESKTOP_W, DESKTOP_H);
  ctx.fillStyle = AMBER;
  ctx.textAlign = "center";
  ctx.font = "bold 22px 'Courier New', monospace";
  ctx.fillText("It's now safe to turn off", DESKTOP_W / 2, DESKTOP_H / 2 - 14);
  ctx.fillText("your computer.", DESKTOP_W / 2, DESKTOP_H / 2 + 18);
}

/**
 * The 8.1 crash screen (undocked parity for Bsod.tsx — same copy module, so
 * the gag cannot read differently on the two renderers). The wide flat blue
 * is also what drives the CRT cast cool for the beat it's up: CrtScreen
 * downsamples whatever is painted here, so no separate lighting hook is
 * needed and the gate-2.3 luminance cap still governs.
 */
function paintBsod(ctx: CanvasRenderingContext2D, state: Win98State) {
  ctx.fillStyle = CRASH_BLUE;
  ctx.fillRect(0, 0, DESKTOP_W, DESKTOP_H);

  const lines = bsodLines(state.bsodReason ?? "");
  const font = "15px 'Courier New', monospace";

  // Inverted title band, centred like the era's.
  ctx.font = font;
  const titleW = ctx.measureText(BSOD_TITLE).width + 16;
  const titleX = (DESKTOP_W - titleW) / 2;
  ctx.fillStyle = CHROME;
  ctx.fillRect(titleX, 84, titleW, 20);
  ctx.fillStyle = CRASH_BLUE;
  ctx.textAlign = "center";
  ctx.fillText(BSOD_TITLE, DESKTOP_W / 2, 99);

  ctx.fillStyle = TEXT_LIGHT;
  ctx.textAlign = "left";
  lines.forEach((line, i) => ctx.fillText(line, 64, 146 + i * 22));

  ctx.textAlign = "center";
  ctx.fillText(BSOD_PROMPT, DESKTOP_W / 2, 400);
}

/**
 * The Gallery's window body (plan-0010 §6.5) — a *suggestion* of the thumbnail
 * grid, so the CRT shows a photo-grid-ish window instead of the word `gallery`.
 * Grey cells, an address field and a status line, all bevels and fills.
 *
 * Two properties are load-bearing, not stylistic:
 *
 *   1. **Nothing raster is loaded, here or ever.** The painter repaints on
 *      store change only; an image that decoded later would need a repaint
 *      nothing asks for, and the first frame after every state change would be
 *      a hole. That is why this is grey rectangles rather than the thumbnails
 *      themselves, and it is the criterion 6.5 is judged on.
 *   2. **This file must never import `src/lib/pictures.ts`.** The painter ships
 *      in the initial bundle; the Gallery's 23 captions live in `register54`'s
 *      chunk, and keeping them there is 6.4's acceptance criterion (ADR-012
 *      §8). Importing even the picture *count* would pull the strings across.
 *
 * Consequence of (2), and the one honest inaccuracy here: the grid fills
 * whatever height it is given rather than stopping at 23 cells, so a maximized
 * window suggests more photographs than ship. A literal 23 in this file is the
 * worse trade — it would drift silently the day the set changes, and nothing in
 * `npm run build` cross-checks the painter the way `npm run pictures` checks
 * `pictures.ts`. "Many photographs, and more below the fold" is true at every
 * window size.
 */
function paintGalleryBody(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cw: number,
  ch: number,
) {
  // The app's own background, where the DOM has window chrome behind the field.
  ctx.fillStyle = CHROME;
  ctx.fillRect(cx, cy, cw, ch);

  // Address field — a text-shaped bar rather than "C:\My Pictures", which
  // would be a second copy of a string only `Gallery.tsx` should own.
  const toolY = cy + 3;
  bevel(ctx, cx + 3, toolY, cw - 6, 14, false);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(cx + 5, toolY + 2, cw - 10, 10);
  ctx.fillStyle = "#9aa0a8";
  ctx.fillRect(cx + 8, toolY + 6, Math.min(64, cw - 20), 2);

  // Status line — caption strip and count, the two sunken cells 6.4 draws.
  const statusH = 12;
  const statusY = cy + ch - statusH - 3;
  const countW = 54;
  const captionW = Math.max(8, cw - 6 - countW - 2);
  bevel(ctx, cx + 3, statusY, captionW, statusH, false);
  bevel(ctx, cx + 3 + captionW + 2, statusY, countW, statusH, false);
  ctx.fillStyle = "#9aa0a8";
  ctx.fillRect(cx + 6, statusY + 5, Math.max(0, captionW - 20), 2);
  ctx.fillRect(cx + 3 + captionW + 6, statusY + 5, 30, 2);

  // The grid field, and the scrollbar that always belongs beside it — the
  // cells overflow it by construction (see the header), so the bar is honest.
  const gridY = toolY + 17;
  const gridH = statusY - 3 - gridY;
  if (gridH < 12) return;
  bevel(ctx, cx + 3, gridY, cw - 6, gridH, false);
  const fieldX = cx + 5;
  const fieldY = gridY + 2;
  const fieldW = cw - 10;
  const fieldH = gridH - 4;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(fieldX, fieldY, fieldW, fieldH);

  const barW = 15;
  bevel(ctx, fieldX + fieldW - barW, fieldY, barW, fieldH, false);
  bevel(ctx, fieldX + fieldW - barW, fieldY, barW, 13, true);
  bevel(ctx, fieldX + fieldW - barW, fieldY + fieldH - 13, barW, 13, true);
  bevel(ctx, fieldX + fieldW - barW, fieldY + 13, barW, Math.min(46, Math.max(12, fieldH - 26)), true);

  // Cells. Clipped rather than counted, so a partial bottom row peeks out of
  // the fold exactly as a scrollable grid of 23 does at the authored size.
  ctx.save();
  ctx.beginPath();
  ctx.rect(fieldX, fieldY, fieldW - barW, fieldH);
  ctx.clip();
  const rows = Math.ceil((fieldH - GALLERY_PAD) / (GALLERY_CELL_H + GALLERY_GAP));
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < GALLERY_COLS; col++) {
      const px = fieldX + GALLERY_PAD + col * (GALLERY_CELL_W + GALLERY_GAP);
      const py = fieldY + GALLERY_PAD + row * (GALLERY_CELL_H + GALLERY_GAP);
      if (px + GALLERY_CELL_W > fieldX + fieldW - barW) break;
      bevel(ctx, px, py, GALLERY_CELL_W, GALLERY_CELL_H, false);
      const w = GALLERY_CELL_W - 4;
      const h = GALLERY_CELL_H - 4;
      ctx.fillStyle =
        GALLERY_TONES[(row * GALLERY_COLS + col) % GALLERY_TONES.length];
      ctx.fillRect(px + 2, py + 2, w, h);
      // A lit band over a darker one: the set is mostly ridges and roads, and
      // a horizon is what makes a grey box read as a photograph rather than a
      // swatch. It is also what the 6.3 glyph draws, at 16 px.
      ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
      ctx.fillRect(px + 2, py + 2, w, Math.round(h * 0.55));
      ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
      ctx.fillRect(px + 2, py + 2 + Math.round(h * 0.62), w, h - Math.round(h * 0.62));
    }
  }
  ctx.restore();
}

function paintWindow(
  ctx: CanvasRenderingContext2D,
  win: Win98Window,
  focused: boolean,
) {
  const x = win.maximized ? 0 : win.x;
  const y = win.maximized ? 0 : win.y;
  const w = win.maximized ? DESKTOP_W : win.width;
  const h = win.maximized ? DESKTOP_H - TASKBAR_H : win.height;

  bevel(ctx, x, y, w, h, true);

  // Title bar.
  const g = ctx.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, focused ? TITLE_A : TITLE_INACTIVE_A);
  g.addColorStop(1, focused ? TITLE_B : TITLE_INACTIVE_B);
  ctx.fillStyle = g;
  ctx.fillRect(x + 3, y + 3, w - 6, 18);
  drawGlyph(ctx, win.glyph, x + 5, y + 4, 15);
  ctx.fillStyle = TEXT_LIGHT;
  ctx.font = FONT_BOLD;
  ctx.textAlign = "left";
  ctx.fillText(win.title, x + 24, y + 16, w - 90);

  // Min / max / close buttons.
  const by = y + 5;
  let bx = x + w - 21;
  for (const kind of ["close", "max", "min"] as const) {
    bevel(ctx, bx, by, 14, 13, true);
    ctx.fillStyle = TEXT_DARK;
    if (kind === "close") {
      ctx.font = "bold 10px Verdana, Geneva, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("x", bx + 7, by + 10);
    } else if (kind === "max") {
      ctx.strokeStyle = TEXT_DARK;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 3.5, by + 3.5, 7, 6);
    } else {
      ctx.fillRect(bx + 3, by + 9, 7, 2);
    }
    bx -= 16;
  }

  // Content field — plain sunken white; 5.x apps draw real content.
  const cx = x + 4;
  const cy = y + 24;
  const cw = w - 8;
  const ch = h - 28;
  if (win.appId === "gallery") {
    paintGalleryBody(ctx, cx, cy, cw, ch);
    return;
  }
  bevel(ctx, cx, cy, cw, ch, false);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(cx + 2, cy + 2, cw - 4, ch - 4);
  ctx.fillStyle = "#9aa0a8";
  ctx.font = FONT;
  ctx.textAlign = "left";
  ctx.fillText(win.appId, cx + 10, cy + 20, cw - 20);
}

function paintDesktop(ctx: CanvasRenderingContext2D, state: Win98State) {
  ctx.fillStyle = TEAL;
  ctx.fillRect(0, 0, DESKTOP_W, DESKTOP_H);

  // Icons — grid from the state, label under glyph.
  for (const icon of state.icons) {
    const x = 18 + icon.col * 84;
    const y = 14 + icon.row * 66;
    drawGlyph(ctx, icon.glyph, x + 16, y, 28);
    ctx.fillStyle = TEXT_LIGHT;
    ctx.font = FONT;
    ctx.textAlign = "center";
    ctx.fillText(icon.label, x + 30, y + 42, 82);
  }

  // Windows, bottom of z-order first; topmost gets the focused title bar.
  for (const win of state.windows) {
    if (win.minimized) continue;
    paintWindow(ctx, win, state.focusId === win.id);
  }

  // Taskbar.
  const ty = DESKTOP_H - TASKBAR_H;
  bevel(ctx, 0, ty, DESKTOP_W, TASKBAR_H, true);
  // Start button — frame mark + word, no Windows flag.
  bevel(ctx, 4, ty + 4, 58, TASKBAR_H - 8, !state.startMenuOpen);
  drawFrameMark(ctx, 10, ty + 8, 12, CHROME_DARKER);
  ctx.fillStyle = TEXT_DARK;
  ctx.font = FONT_BOLD;
  ctx.textAlign = "left";
  ctx.fillText("Start", 27, ty + 18);

  // One taskbar button per window.
  let bx = 68;
  for (const win of state.windows) {
    const active = state.focusId === win.id && !win.minimized;
    bevel(ctx, bx, ty + 4, 108, TASKBAR_H - 8, !active);
    drawGlyph(ctx, win.glyph, bx + 5, ty + 7, 13);
    ctx.fillStyle = TEXT_DARK;
    ctx.font = active ? FONT_BOLD : FONT;
    ctx.textAlign = "left";
    ctx.fillText(win.title, bx + 22, ty + 18, 82);
    bx += 112;
  }

  // Clock well — fixed dusk time (deterministic; it's set dressing).
  bevel(ctx, DESKTOP_W - 62, ty + 4, 58, TASKBAR_H - 8, false);
  ctx.fillStyle = TEXT_DARK;
  ctx.font = FONT;
  ctx.textAlign = "center";
  ctx.fillText("6:47 PM", DESKTOP_W - 33, ty + 18);

  // Start menu panel (simplified — 3.2's DOM shell carries the real one).
  if (state.startMenuOpen) {
    const mh = 180;
    bevel(ctx, 4, ty - mh, 150, mh, true);
    const gm = ctx.createLinearGradient(8, 0, 8, 1);
    gm.addColorStop(0, TITLE_A);
    gm.addColorStop(1, TITLE_B);
    ctx.fillStyle = gm;
    ctx.fillRect(8, ty - mh + 4, 22, mh - 8);
    ctx.fillStyle = TEXT_DARK;
    ctx.font = FONT;
    ctx.textAlign = "left";
    ["Programs", "Documents", "Settings", "Run...", "Shut Down..."].forEach(
      (item, i) => ctx.fillText(item, 38, ty - mh + 28 + i * 30),
    );
  }
}

/**
 * Paint the full screen for the current state. The canvas is expected to
 * be DESKTOP_W×DESKTOP_H; callers own texture upload + tone sampling.
 */
export function paintScreen(
  ctx: CanvasRenderingContext2D,
  state: Win98State,
): void {
  switch (state.phase) {
    case "off":
      ctx.fillStyle = "#020302";
      ctx.fillRect(0, 0, DESKTOP_W, DESKTOP_H);
      break;
    case "post":
      paintPost(ctx, state);
      break;
    case "splash":
      paintSplash(ctx);
      break;
    case "desktop":
      paintDesktop(ctx, state);
      break;
    case "shutdown":
      paintShutdown(ctx);
      break;
    case "bsod":
      paintBsod(ctx, state);
      break;
  }
}

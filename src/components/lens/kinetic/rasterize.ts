// Line-exact text rasterizer for the kinetic type layer (plan 0004,
// deviation 1). Rather than re-laying text out (troika / manual wrapping —
// which would drift from `text-wrap: balance`, nested spans, and responsive
// wrapping), each glyph is drawn at the position the browser already gave it:
// a per-character Range → getClientRects walk. Geist is already loaded via
// next/font, so the canvas uses the exact same font binary as the DOM.

/** CSS-px padding around the raster so shader offsets never clamp at edges. */
export const RASTER_PAD = 28;

export interface TextRaster {
  canvas: HTMLCanvasElement;
  /** CSS px, including padding on both sides. */
  width: number;
  height: number;
  pad: number;
}

function isTransparent(color: string): boolean {
  return (
    color === "transparent" ||
    /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\)$/.test(color)
  );
}

/**
 * Distance from a character Range-rect's top to the text baseline, for a
 * given computed style (plan-0006 §4.1). Canvas `fontBoundingBoxAscent` is
 * NOT that distance: browsers disagree on what a Range rect spans (font
 * content box vs line-box fragment, which shifts with line-height), so
 * deriving the baseline from canvas font metrics drifts wherever the
 * heading's line-height differs from the font's own height — the section
 * titles, while the tight-leading hero h1 happened to line up. Measure the
 * browser's actual convention instead: lay out the same font + line-height
 * off-screen with a zero-size inline-block marker (its top sits exactly on
 * the baseline) and read the offset off the same Range API the glyph walk
 * uses. Cached per style signature; probes live on document.body so the
 * layer's MutationObservers (which watch the headings) never see them.
 */
const baselineOffsetCache = new Map<string, number>();

function baselineOffset(style: CSSStyleDeclaration): number {
  const key = `${style.fontStyle}|${style.fontWeight}|${style.fontSize}|${style.fontFamily}|${style.lineHeight}`;
  const cached = baselineOffsetCache.get(key);
  if (cached !== undefined) return cached;

  const probe = document.createElement("div");
  probe.style.position = "absolute";
  probe.style.left = "-9999px";
  probe.style.top = "0";
  probe.style.visibility = "hidden";
  probe.style.whiteSpace = "pre";
  probe.style.fontStyle = style.fontStyle;
  probe.style.fontWeight = style.fontWeight;
  probe.style.fontSize = style.fontSize;
  probe.style.fontFamily = style.fontFamily;
  probe.style.lineHeight = style.lineHeight;
  probe.textContent = "Mg";
  const marker = document.createElement("span");
  marker.style.display = "inline-block";
  marker.style.width = "0";
  marker.style.height = "0";
  probe.appendChild(marker);
  document.body.appendChild(probe);

  const range = document.createRange();
  range.setStart(probe.firstChild as Node, 0);
  range.setEnd(probe.firstChild as Node, 1);
  const charRect = range.getClientRects()[0];
  // A zero-height inline-block's box edge IS the line's alphabetic baseline.
  const baseline = marker.getBoundingClientRect().top;
  document.body.removeChild(probe);

  const offset =
    charRect && baseline > charRect.top
      ? baseline - charRect.top
      : // Degenerate probe (no layout?) — old canvas-metrics estimate.
        parseFloat(style.fontSize) * 0.8;
  baselineOffsetCache.set(key, offset);
  return offset;
}

/**
 * Gradient display text (`.text-electric`) computes `color: transparent` and
 * paints via background-clip — recreate its accent ramp across the span.
 */
function electricGradient(
  ctx: CanvasRenderingContext2D,
  spanLeft: number,
  spanRight: number,
): CanvasGradient {
  const root = getComputedStyle(document.documentElement);
  const bright = root.getPropertyValue("--color-accent-bright").trim() || "#8fb3ff";
  const accent = root.getPropertyValue("--color-accent").trim() || "#3d74ff";
  const grad = ctx.createLinearGradient(spanLeft, 0, spanRight, 0);
  grad.addColorStop(0, bright);
  grad.addColorStop(0.45, accent);
  grad.addColorStop(1, bright);
  return grad;
}

/** Rasterize an element's text content at its browser-computed layout. */
export function rasterizeText(
  el: HTMLElement,
  dpr: number,
): TextRaster | null {
  const rect = el.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return null;

  const width = rect.width + RASTER_PAD * 2;
  const height = rect.height + RASTER_PAD * 2;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width * dpr);
  canvas.height = Math.ceil(height * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(dpr, dpr);
  ctx.textBaseline = "alphabetic";

  const range = document.createRange();
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? "";
    if (!text.trim()) continue;
    const parent = node.parentElement ?? el;
    const style = getComputedStyle(parent);
    ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

    if (isTransparent(style.color)) {
      const spanRect = parent.getBoundingClientRect();
      ctx.fillStyle = electricGradient(
        ctx,
        spanRect.left - rect.left + RASTER_PAD,
        spanRect.right - rect.left + RASTER_PAD,
      );
    } else {
      ctx.fillStyle = style.color;
    }

    const toBaseline = baselineOffset(style);

    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      if (!ch.trim()) continue;
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const r = range.getClientRects()[0];
      if (!r || r.width === 0) continue;
      ctx.fillText(
        ch,
        r.left - rect.left + RASTER_PAD,
        r.top - rect.top + RASTER_PAD + toBaseline,
      );
    }
  }

  return { canvas, width, height, pad: RASTER_PAD };
}

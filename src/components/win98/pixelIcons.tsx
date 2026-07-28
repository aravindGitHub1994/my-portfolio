// Original pixel-art icon set (plan-0009 §3.2): 16×16 grids drawn as SVG
// rect runs, zero Microsoft-derived art (ADR-012 §10). Shares the
// IconGlyph vocabulary with the 3.1 painter so both renderers show the
// same object language. Colors are effect colors of the diegetic shell.

import type { IconGlyph } from "@/lib/win98State";

/** One paint layer: fill color + list of [x, y, w, h] cells. */
type Layer = [string, [number, number, number, number][]];

const GLYPHS: Record<IconGlyph, Layer[]> = {
  computer: [
    ["#d8d0bd", [[1, 2, 14, 10], [5, 13, 6, 2]]],
    ["#1c3f66", [[3, 4, 10, 6]]],
    ["#6fb0c8", [[4, 5, 3, 2]]],
    ["#8a8272", [[1, 11, 14, 1]]],
  ],
  folder: [
    ["#e8c25a", [[1, 5, 14, 9], [1, 3, 6, 3]]],
    ["#f4d67e", [[2, 6, 12, 2]]],
    ["#a5822e", [[1, 13, 14, 1]]],
  ],
  document: [
    ["#f4f4f4", [[3, 1, 10, 14]]],
    ["#b8bcc6", [[3, 1, 10, 1], [3, 14, 10, 1]]],
    ["#7a86b8", [[5, 4, 6, 1], [5, 7, 6, 1], [5, 10, 6, 1], [5, 13, 4, 1]]],
  ],
  notepad: [
    ["#f4f0da", [[3, 1, 10, 14]]],
    ["#8a8a7a", [[3, 3, 10, 1]]],
    ["#a0a0a0", [[5, 6, 6, 1], [5, 9, 6, 1], [5, 12, 6, 1]]],
  ],
  envelope: [
    ["#ede7d6", [[1, 4, 14, 9]]],
    ["#8a8272", [[1, 4, 1, 9], [14, 4, 1, 9], [1, 12, 14, 1]]],
    ["#b8ae96", [[2, 5, 2, 1], [4, 6, 2, 1], [6, 7, 4, 1], [10, 6, 2, 1], [12, 5, 2, 1]]],
  ],
  globe: [
    ["#3a76b8", [[4, 1, 8, 1], [2, 2, 12, 2], [1, 4, 14, 8], [2, 12, 12, 2], [4, 14, 8, 1]]],
    ["#bcd8ee", [[1, 7, 14, 1], [7, 1, 1, 14], [3, 4, 3, 2], [10, 9, 3, 2]]],
  ],
  bin: [
    ["#9fb3ac", [[4, 4, 8, 11], [3, 3, 10, 2], [6, 1, 4, 2]]],
    ["#5d726b", [[5, 6, 1, 7], [8, 6, 1, 7], [11, 6, 1, 7]]],
  ],
  mine: [
    ["#2a2a2a", [[6, 2, 4, 1], [4, 3, 8, 2], [3, 5, 10, 6], [4, 11, 8, 2], [6, 13, 4, 1], [7, 0, 2, 2], [7, 14, 2, 2], [0, 7, 2, 2], [14, 7, 2, 2], [2, 2, 2, 2], [12, 2, 2, 2], [2, 12, 2, 2], [12, 12, 2, 2]]],
    ["#e8e8e8", [[5, 5, 2, 2]]],
  ],
};

export function PixelIcon({
  glyph,
  size = 32,
}: {
  glyph: IconGlyph;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {GLYPHS[glyph].map(([fill, cells], layer) =>
        cells.map(([x, y, w, h], i) => (
          <rect key={`${layer}-${i}`} x={x} y={y} width={w} height={h} fill={fill} />
        )),
      )}
    </svg>
  );
}

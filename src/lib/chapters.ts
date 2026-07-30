// Chapter/scroll data for the Workstation journey (ADR-012 §5) — data, not
// JSX. The runway div (WorkstationRoot) is sized from RUNWAY_LENGTH_VH and
// the choreography snaps to REST_POINTS. Spans here are placeholders that
// slice 4.1 finalizes against the ~60–90 s pacing target.

export interface Chapter {
  slug: string;
  title: string;
  /**
   * Scroll span in viewport-heights. 0 = an auto-play beat that owns no
   * scrub span. No chapter uses 0 today; the case is kept because the
   * arithmetic below and `chapterAtProgress` both have to mean something
   * if one ever does again.
   */
  lengthVh: number;
}

export const CHAPTERS: Chapter[] = [
  // Chapter 0 owns real scroll span as of ADR-013 §2. ADR-014 §1/§2 then
  // recomposed both ends of it: the film opens high and wide from behind
  // the figure's right and comes to rest on a monitor medium, so this span
  // is now the length of that whole move across the room rather than the
  // 165 mm between a button and the glass. The boot still never scrubs — `PowerOn`
  // stops Lenis for its whole duration and releases when the desktop
  // settles, so this span is only ever scrubbed *after* the boot, which is
  // what keeps ADR-012 §5's "scrubbing a boot backwards feels wrong" true.
  { slug: "power-on", title: "Power On", lengthVh: 90 },
  { slug: "the-glow", title: "The Glow", lengthVh: 120 },
  { slug: "the-man", title: "The Man", lengthVh: 140 },
  { slug: "the-room", title: "The Room", lengthVh: 140 },
  { slug: "the-dock", title: "The Dock", lengthVh: 120 },
  { slug: "sign-off", title: "Sign-off", lengthVh: 140 },
];

/** Total scrollable runway length in vh (the sticky viewport adds itself). */
export const RUNWAY_LENGTH_VH = CHAPTERS.reduce(
  (sum, chapter) => sum + chapter.lengthVh,
  0,
);

/**
 * Normalized [0..1] progress where each chapter comes to rest (its end).
 * `REST_POINTS[0]` is where the boot pan lands: a medium on the monitor
 * (ADR-014 §2). It used to be an extreme close-up on the glass, and that
 * shot is cut from the film rather than moved.
 */
export const REST_POINTS: number[] = (() => {
  let acc = 0;
  return CHAPTERS.map((chapter) => {
    acc += chapter.lengthVh;
    return acc / RUNWAY_LENGTH_VH;
  });
})();

/**
 * Index into CHAPTERS/REST_POINTS of the dock chapter. Named because three
 * modules measure against that one rest point — the camera path keyframes
 * the square-on pose there, CrtScreen flattens the glass toward it, and
 * DockSwap latches on it — and a bare `4` in three files is a rename away
 * from silently disagreeing.
 */
export const DOCK_REST_INDEX = 4;

/** Index of the chapter whose scrub span contains `progress` (0..1). */
export function chapterAtProgress(progress: number): number {
  let acc = 0;
  for (let i = 0; i < CHAPTERS.length; i++) {
    if (CHAPTERS[i].lengthVh === 0) continue;
    acc += CHAPTERS[i].lengthVh / RUNWAY_LENGTH_VH;
    if (progress <= acc) return i;
  }
  return CHAPTERS.length - 1;
}

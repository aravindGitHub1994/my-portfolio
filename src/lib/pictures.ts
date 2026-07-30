// Gallery content (plan-0010 §6.4, ADR-013 §9). Content lives in src/lib by
// project convention; `apps/Gallery.tsx` holds no strings and no numbers.
//
// **This file is the owner's, not an agent's.** Every caption below is
// transcribed from gate 6.2's record (`docs/qa/6.2-picture-review.md` §2) —
// the owner set the register (playful, always shown), corrected three drafts
// and approved the rest. That document outranks ADR-013 on what ships. Three
// rules came out of it and bind any caption added here:
//
//   1. **A caption may only joke about what is visible in its own
//      photograph** — no dates, no invented durations, no weather that is not
//      in frame, nothing about what anyone was feeling.
//   2. **Nothing is asserted about other people in frame.** `guitar-01` has
//      two identifiable faces in it; its line is built from `aboutMe.ts`
//      instead of from the photograph, deliberately.
//   3. `cat-07-both` breaks the fourth wall — the cat tree in that
//      photograph is the one 5.1 built into the room. The line only works
//      because the visitor opens the Gallery **from inside that room**.
//
// The set is 23 photographs (gate 6.2 cut six from 6.1's 29 — do not restore
// them on ADR-013's authority; see the script's header). Ids are authored in
// `scripts/build-pictures.mjs`, never derived from filenames, so two ids
// deliberately disagree with their source names (`hike-05-goa`,
// `ride-07-goa`), and the ride numbering keeps its gaps.
//
// **The dimensions are the SHIPPED sizes, copied from
// `scripts/pictures-manifest.tsv`** — not the sources', and not typed by
// hand. They exist so a thumbnail reserves its box before the file arrives.
// `npm run pictures` re-checks this file against the manifest and complains
// if the set, the ids or the sizes have drifted.

/** Grid grouping. The order below IS the grid order (gate 6.2 §3c): cats
 *  first, because it reads warmest and it puts the fourth-wall caption near
 *  the top of the grid. */
export type PictureGroup = "cats" | "journey" | "desk" | "portrait";

export interface Picture {
  /** URL-safe id: `/pictures/<id>.jpg` and `/pictures/<id>-thumb.jpg`. */
  id: string;
  group: PictureGroup;
  /** Shipped size of the VIEWER copy, from the manifest. */
  width: number;
  height: number;
  /** Always rendered — never blank. Empty falls back to `placeName`. */
  caption: string;
}

/** Section headings, in grid order. */
export const GROUP_LABELS: Record<PictureGroup, string> = {
  cats: "The cats",
  journey: "Rides and hikes",
  desk: "The desk",
  portrait: "Portraits",
};

/** Every thumbnail in the grid, already in the order it is drawn. */
export const PICTURES: Picture[] = [
  {
    id: "cat-01-nimbus",
    group: "cats",
    width: 675,
    height: 900,
    caption: "Pair programming. He insisted on driving.",
  },
  {
    id: "cat-02-nimbus",
    group: "cats",
    width: 1200,
    height: 625,
    caption: "He picked the pillow. I lost the arm.",
  },
  {
    id: "cat-03-nimbus",
    group: "cats",
    width: 1200,
    height: 900,
    caption: "Sleep mode. Do not wake.",
  },
  {
    id: "cat-05-nimbus",
    group: "cats",
    width: 675,
    height: 900,
    caption: "Grew up. Never grew out of the staring.",
  },
  {
    id: "cat-06-ivy",
    group: "cats",
    width: 675,
    height: 900,
    caption: "The whiskers arrive first.",
  },
  {
    id: "cat-07-both",
    group: "cats",
    width: 1200,
    height: 900,
    caption: "That cat tree is in this room. They had it first.",
  },
  {
    id: "cat-08-ivy",
    group: "cats",
    width: 675,
    height: 900,
    caption: "Flower collar. Dignity intact, barely.",
  },
  {
    id: "hike-01-kalga",
    group: "journey",
    width: 1200,
    height: 900,
    caption: "Walking in to Kalga, single file and in no hurry.",
  },
  {
    id: "hike-02-kheerganga",
    group: "journey",
    width: 1200,
    height: 900,
    caption: "Kheerganga: uphill, then more uphill.",
  },
  {
    id: "hike-03-kashmir",
    group: "journey",
    width: 506,
    height: 900,
    caption: "Kashmir. The mountain leaned in to check on us.",
  },
  {
    id: "hike-04-himachal",
    group: "journey",
    width: 675,
    height: 900,
    caption: "Himachal. Every trail looks like a screensaver.",
  },
  {
    id: "hike-05-goa",
    group: "journey",
    width: 1200,
    height: 675,
    caption: "Goa, doing the thing Goa does.",
  },
  {
    id: "ride-01-kerala",
    group: "journey",
    width: 1200,
    height: 675,
    caption: "Kerala. Orange bike, greener hills.",
  },
  {
    id: "ride-02-coorg",
    group: "journey",
    width: 923,
    height: 900,
    caption: "Coorg. Prayer flags, and a road that needed them.",
  },
  {
    id: "ride-03-ladakh",
    group: "journey",
    width: 1200,
    height: 675,
    caption: "Ladakh. Parked where the postcards are made.",
  },
  {
    id: "ride-07-goa",
    group: "journey",
    width: 506,
    height: 900,
    caption: "The Goa run. The rain jacket earned its keep.",
  },
  {
    id: "ride-09-tso-moriri",
    group: "journey",
    width: 1195,
    height: 896,
    caption: "Tso Moriri. The water really is that colour.",
  },
  {
    id: "ride-11-rann-of-kutch",
    group: "journey",
    width: 1200,
    height: 900,
    caption: "The Rann. Salt to the horizon, shade nowhere.",
  },
  {
    id: "ride-12-hawa-mahal",
    group: "journey",
    width: 1200,
    height: 799,
    caption: "Hawa Mahal: 953 windows, two bikes, one photo.",
  },
  {
    id: "workspace-01",
    group: "desk",
    width: 523,
    height: 900,
    caption: "The day job, caught mid-scroll.",
  },
  {
    id: "guitar-01",
    group: "desk",
    width: 450,
    height: 900,
    caption: "Carnatic training, metal instincts, acoustic compromise.",
  },
  {
    id: "portrait-01",
    group: "portrait",
    width: 457,
    height: 800,
    caption: "Cleans up occasionally.",
  },
  {
    id: "portrait-02",
    group: "portrait",
    width: 675,
    height: 900,
    caption: "Where the actual work happens.",
  },
];

/** Uniform thumbnail size shipped by the pipeline (4:3, cover-cropped). */
export const THUMB_W = 192;
export const THUMB_H = 144;

/** Place name from an id, for the status bar when a caption is struck and not
 *  replaced (gate 6.2 §1.3: captions always render, so there is no blank
 *  state). `ride-11-rann-of-kutch` → "Rann of Kutch"; `workspace-01` →
 *  "Workspace". */
const MINOR = new Set(["of", "the", "and", "in", "on"]);

export function placeName(id: string): string {
  const parts = id.split("-");
  const rest = parts.slice(1).filter((p) => !/^\d+$/.test(p));
  const words = rest.length > 0 ? rest : parts.slice(0, 1);
  return words
    .map((w, i) =>
      i > 0 && MINOR.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(" ");
}

/** What the status bar shows for a picture. */
export function pictureLabel(picture: Picture): string {
  return picture.caption.trim() || placeName(picture.id);
}

/** Shipped paths. Ids are authored and URL-safe, but encoding them costs
 *  nothing and keeps the invariant local to the one place that builds a URL. */
export function pictureSrc(id: string): string {
  return `/pictures/${encodeURIComponent(id)}.jpg`;
}

export function thumbSrc(id: string): string {
  return `/pictures/${encodeURIComponent(id)}-thumb.jpg`;
}

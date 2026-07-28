// Mutable frame-state singleton for the Workstation experience (ADR-012
// Architecture). Frame loops and choreography read/write this directly —
// never React state — mirroring the retired lensState pattern. React only
// ever writes into it (tier mirror); it never renders from it.

import type { FidelityTier } from "@/lib/gpuTier";

export const experienceState = {
  /** Normalized scrub progress 0..1 across the whole chapter runway. */
  scrollProgress: 0,
  /** Index into CHAPTERS of the chapter the scrub is currently inside. */
  chapterIndex: 1,
  /** True while chapter 4's dock is active — scroll suspended, DOM shell
   *  live (lands in slice 4.2). */
  docked: false,
  /** 0..1 across chapter 5 — the dusk-deepening lighting cue (4.1);
   *  Lighting damps the cool fill from it per frame. */
  duskDeepen: 0,
  /** Runway pixel geometry, republished by Choreography on every
   *  ScrollTrigger refresh: the scroll-y at progress 0 and the pixel span
   *  of the whole runway. The dock converts its rest point back into a
   *  scroll target with these, so it can pull the camera the last of the
   *  way square-on without re-deriving the runway's layout. */
  runwayStart: 0,
  runwaySpan: 0,
  /** Mirrored from WorkstationRoot's tier detection; "pending" pre-detect. */
  fidelityTier: "pending" as FidelityTier | "pending",
  /** Dev-only perf readout (§7.2's recorded budgets). Written by
   *  `PerfCounter` each second in development and left at zero in
   *  production, where that component never mounts. */
  perf: {
    fps: 0,
    /** renderer.info.render.calls — the draw-call budget. */
    drawCalls: 0,
    triangles: 0,
    /** renderer.info.memory.* — live GPU object counts. */
    textures: 0,
    geometries: 0,
    programs: 0,
    /** Estimated texture bytes resident on the GPU, mipmaps included. */
    textureBytes: 0,
    /** JS heap growth over the last sampling second, bytes. The
     *  per-frame-allocation check: a frame loop that allocates shows up
     *  here as a sawtooth that never settles near zero between GCs.
     *  Chromium-only (performance.memory); -1 elsewhere. */
    heapDeltaPerSec: -1,
  },
};

// Dev-only QA handle: headless agent sessions read scrub/dock state via
// window.__experienceState (plan-0009 §4.2 verification). Never in prod.
declare global {
  interface Window {
    __experienceState?: typeof experienceState;
  }
}
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  window.__experienceState = experienceState;
}

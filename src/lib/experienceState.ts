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
  /** Mirrored from WorkstationRoot's tier detection; "pending" pre-detect. */
  fidelityTier: "pending" as FidelityTier | "pending",
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

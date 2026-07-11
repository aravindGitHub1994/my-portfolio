// Shared mutable state for the Lens scene (ADR-006). Written by DOM-side
// systems (pointer listener, LensChoreography ScrollTriggers, the scroll
// velocity ticker) and read inside useFrame / postprocessing update() —
// mutation instead of React state so scroll/pointer never re-render the tree.

import { NO_TARGET } from "./projectionTargets";
import type { FidelityTier } from "@/lib/gpuTier";

export const lensState = {
  /**
   * Resolved fidelity tier, written by LensRoot once detection runs (and on
   * a confirmed watchdog downgrade, ADR-010 §2). "pending" until the
   * client-only root mounts. DOM-side effects read this to know whether the
   * beams exist (high) without threading React state out of the canvas.
   */
  fidelityTier: "pending" as FidelityTier | "pending",
  /** Normalized pointer position, -1..1 on both axes (0,0 = center, y down). */
  pointer: { x: 0, y: 0 },
  /**
   * Pointer "energy": bumped toward 1 by fast pointer sweeps, decayed each
   * frame by the render loop. Drives the refractive distortion pass.
   */
  pointerSpeed: 0,
  /** Smoothed scroll velocity in viewport-heights/second, signed. */
  scrollVelocity: 0,
  /**
   * Per-act scroll progress, each 0 → 1 as its section traverses the
   * viewport (LensChoreography owns the ScrollTriggers):
   * hero      — 0 at page top → 1 when the hero has scrolled away
   * approach  — beams organize from a chromatic fan into ordered lines
   * work      — tent curve (0→1→0) while the Work act holds the stage;
   *             high tier projects the cards (ADR-008 §2), low tier recedes
   * trajectory— return-to-center: the prism eases home, the fan re-forms
   * contact   — beams bend into the CTA underline finale (ADR-008 §3)
   */
  acts: { hero: 0, approach: 0, work: 0, trajectory: 0, contact: 0 },
  /**
   * Work-act projection (ADR-008 §2). LensChoreography's per-card triggers
   * write index/blend/side; the scene-side tracker converts the registered
   * target element to world space each frame (targetX/targetY, at
   * PROJECTION_PLANE_Z). The beams read all of it inside useFrame.
   */
  projection: {
    /** Active target: a Work-card index, CONTACT_TARGET, or NO_TARGET. */
    index: NO_TARGET,
    /** 0→1 progress across the active card's stage time. */
    blend: 0,
    /** World-space beam endpoint (written scene-side, camera required). */
    targetX: 0,
    targetY: 0,
    /**
     * World half-extents of the active window's rect — the beam endpoints
     * spread across them so the cone reads as light filling the frame.
     */
    halfW: 1.6,
    halfH: 1,
    /** Window side: +1 = preview right (even cards), -1 = left. */
    side: 1,
    /**
     * Contact CTA underline target (ADR-008 §3): world-space point just
     * beneath the CTA row, plus the row's world half-width so the beam
     * endpoints spread across it.
     */
    ctaX: 0,
    ctaY: 0,
    ctaHalfW: 1,
  },
  /** True once the WebGL canvas has created its context and drawn. */
  ready: false,
};

type ReadyListener = () => void;
const readyListeners = new Set<ReadyListener>();

/** Called by the canvas once the GL context is live (loader dismiss cue). */
export function markLensReady() {
  if (lensState.ready) return;
  lensState.ready = true;
  readyListeners.forEach((cb) => cb());
  readyListeners.clear();
}

/** Subscribe to canvas readiness; fires immediately if already ready. */
export function onLensReady(cb: ReadyListener): () => void {
  if (lensState.ready) {
    cb();
    return () => {};
  }
  readyListeners.add(cb);
  return () => readyListeners.delete(cb);
}

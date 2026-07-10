// Shared mutable state for the Lens scene (ADR-006). Written by DOM-side
// systems (pointer listener, LensChoreography ScrollTriggers, the scroll
// velocity ticker) and read inside useFrame / postprocessing update() —
// mutation instead of React state so scroll/pointer never re-render the tree.

export const lensState = {
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
   *             the Lens recedes so the image planes own it
   * trajectory— crystallization: prism → cube (the payoff beat)
   * contact   — dissolve: cube → point-globe finale
   */
  acts: { hero: 0, approach: 0, work: 0, trajectory: 0, contact: 0 },
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

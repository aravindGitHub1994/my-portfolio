// Shared mutable state for the cube scene. Written by DOM-side systems
// (pointer listener, GSAP ScrollTrigger) and read inside useFrame — mutation
// instead of React state so scroll/pointer never re-render the tree.

export const cubeState = {
  /** Normalized pointer position, -1..1 on both axes (0,0 = center). */
  pointer: { x: 0, y: 0 },
  /** 0 at page top → 1 when the hero act has fully scrolled away (P1.4). */
  heroProgress: 0,
  /** True once the WebGL canvas has created its context and drawn. */
  ready: false,
};

type ReadyListener = () => void;
const readyListeners = new Set<ReadyListener>();

/** Called by the canvas once the GL context is live (loader dismiss cue). */
export function markCubeReady() {
  if (cubeState.ready) return;
  cubeState.ready = true;
  readyListeners.forEach((cb) => cb());
  readyListeners.clear();
}

/** Subscribe to canvas readiness; fires immediately if already ready. */
export function onCubeReady(cb: ReadyListener): () => void {
  if (cubeState.ready) {
    cb();
    return () => {};
  }
  readyListeners.add(cb);
  return () => readyListeners.delete(cb);
}

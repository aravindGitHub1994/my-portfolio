// Projection-target registry (ADR-008 §2, slice 4.1): the DOM elements the
// prism's beams aim at — each Work card's preview panel, plus the contact
// CTA row for the finale (slice 5.2). Components register their element from
// an effect; the scene reads the ACTIVE element's rect once per frame (the
// same accepted cost as the kinetic layers) and converts it to world space
// via rectToWorld().

/** lensState.projection.index value when nothing is being projected. */
export const NO_TARGET = -1;
/** Registry key for the contact CTA row (slice 5.2) — not a Work card. */
export const CONTACT_TARGET = -2;

/**
 * z-plane the beam endpoints aim at. The streams live around the prism at
 * z≈0, so targets are mapped at that depth.
 */
export const PROJECTION_PLANE_Z = 0;

const targets = new Map<number, HTMLElement>();

/**
 * Register a projection target. `index` is the Work-card order (matches
 * PROJECTS order) or CONTACT_TARGET. Returns an unregister callback; a stale
 * unregister never removes a newer element registered under the same index.
 */
export function registerProjectionTarget(
  index: number,
  el: HTMLElement,
): () => void {
  targets.set(index, el);
  return () => {
    if (targets.get(index) === el) targets.delete(index);
  };
}

export function getProjectionTarget(index: number): HTMLElement | null {
  return targets.get(index) ?? null;
}

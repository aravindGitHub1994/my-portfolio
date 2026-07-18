// Mutable screen-emission state (plan-0009 §2.2 ⇄ §3.1 contract).
// Whatever renders the CRT content writes tint + luminance here each
// frame (3.1's screen feed; until then the harness test pattern); the
// Lighting rig reads it to drive the warm CRT key light. lensState
// pattern: frame loops only, never React state.

import { Color } from "three";

export const screenLight = {
  /** Dominant screen tint — written in place, never replaced. */
  tint: new Color("#3aa89b"),
  /** Average luminance 0..1 of the current screen content. */
  luminance: 0.55,
};

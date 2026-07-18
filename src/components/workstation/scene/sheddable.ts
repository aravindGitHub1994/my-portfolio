// Sheddable-effect registry (plan-0009 §2.2): garnish the 7.2 watchdog
// can drop, cheapest-first, before ever touching core fidelity. Mutable
// singleton (lensState pattern) — atmosphere/lighting loops read the
// flags per frame; 7.2 will flip them in SHED_ORDER.

export const effectsState = {
  dust: true,
  shafts: true,
  /** Screen-light flicker cast into the room (off = smoothed intensity). */
  castFlicker: true,
  /** Full-richness bloom (off = cheaper, dimmer bloom). Mount-time read —
   *  7.2 remounts postprocessing when it sheds this tier. */
  bloomRich: true,
};

export const SHED_ORDER = ["dust", "shafts", "castFlicker", "bloomRich"] as const;

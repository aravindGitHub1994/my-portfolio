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
  /** 6.2 tier-3 earbud music leak (audio "music" bus). */
  audioMusic: true,
  /** 6.2 tier-2 texture sounds — clacks, drive chatter, fan bed
   *  (audio "texture" bus). Tier-1 cues are never sheddable. */
  audioTexture: true,
};

// Cheapest-first. The audio garnish sheds before the visual tiers it is
// paired with: silence costs the visitor less than a dimmer room does.
export const SHED_ORDER = [
  "audioMusic",
  "dust",
  "shafts",
  "audioTexture",
  "castFlicker",
  "bloomRich",
] as const;

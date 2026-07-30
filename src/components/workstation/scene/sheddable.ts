// Sheddable-effect registry (plan-0009 §2.2): garnish the 7.2 watchdog
// can drop, cheapest-first, before ever touching core fidelity. Mutable
// singleton (lensState pattern) — atmosphere/lighting loops read the
// flags per frame; 7.2 will flip them in SHED_ORDER.

export const effectsState = {
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
  /** Mug steam (4.3). Sheds late, immediately before `idleDensity`.
   *
   *  ADR-013 §7 argued this against folding steam into `dust`, which would
   *  have shed it at rung 2 for free: steam is a hero detail the owner
   *  asked for by name and is what makes the desk read as occupied rather
   *  than staged, so losing it second would be shedding the wrong thing
   *  cheaply. **`dust` has since been deleted outright (ADR-014 §5)** and
   *  the ladder is nine rungs, but the conclusion is unchanged and so is
   *  steam's position — last visual rung before `idleDensity`. */
  steam: true,
  /** Full-rate idle animation (off = the figure's breath/sway/blink driver
   *  runs at half rate). Last visual rung before the resolution knobs —
   *  a stiller figure is the first thing that reads as "the scene broke",
   *  so it sheds after every atmosphere tier. */
  idleDensity: true,
};

// Cheapest-first. The audio garnish sheds before the visual tiers it is
// paired with: silence costs the visitor less than a dimmer room does.
// `fidelity.ts` is the consumer — it walks this array and then continues
// past it to the two rungs that are not flags (DRS floor, static offer).
export const SHED_ORDER = [
  "audioMusic",
  "shafts",
  "audioTexture",
  "castFlicker",
  "bloomRich",
  "steam",
  "idleDensity",
] as const;

export type SheddableEffect = (typeof SHED_ORDER)[number];

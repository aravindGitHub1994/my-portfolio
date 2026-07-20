// The shed ladder (plan-0009 §7.2, ADR-012 §8). `scene/sheddable.ts` has
// listed the garnish in shed order since 2.2 with nothing consuming it;
// this is the consumer.
//
// **Division of labour with DRS.** `dynamicResolution.ts` chases the 60 fps
// *aspiration* continuously and reversibly — it is ADR-012 §8's "first-
// response lever" and it has already moved before this file does anything.
// The ladder defends the 30 fps *floor*: it fires only when frames stay
// long despite DRS, which is the signal that pixels alone will not save
// this device. Two knobs aimed at two different targets cannot oscillate
// against each other; aiming both at 60 would guarantee they did.
//
// **The ladder is a one-way ratchet.** Nothing is ever restored within a
// session. Garnish that comes back the moment the average recovers would
// flicker on exactly the marginal hardware the ladder exists for, and
// `bloomRich` costs a postprocessing remount each way. DRS is the
// reversible knob by design; this one is not.
//
// **Only the last rung asks** (ADR-010 §2's opt-in principle, restated in
// ADR-012 §8). Shedding dust is invisible; leaving for the 2D floor is a
// different experience, and ADR-012 §9 lists "watchdog-declined" beside
// prefers-reduced-motion as a route to it. So the garnish rungs are silent
// and the terminal rung is an offer the visitor can refuse — refusing ends
// the ladder for the session rather than re-asking every few seconds.
//
// Pure: no three, no DOM, no React. `FidelityWatchdog.tsx` is the frame
// reader, `FidelityPrompt.tsx` the offer surface — the same split that
// makes `dynamicResolution.ts` testable without a GPU.

import { effectsState, SHED_ORDER } from "./scene/sheddable";

/** Every rung, cheapest-first: the garnish flags, then the two rungs that
 *  are not flags. `staticFloor` is an offer, not an action. */
export const LADDER = [...SHED_ORDER, "drsFloor", "staticFloor"] as const;
export type Rung = (typeof LADDER)[number];

/** The floor this defends — ADR-012 §8's "30 fps on mid-range mobile".
 *  Deliberately NOT `TARGET_FRAME_MS`: a machine holding a steady 50 fps
 *  is having a good time, and stripping its room bare would be the
 *  watchdog inventing a problem. */
export const FLOOR_FRAME_MS = 1000 / 30;

/** Dead band above the floor, mirroring DRS's SLOW_RATIO. Without it a
 *  device sitting at 29 fps — a hair under target, visually fine — walks
 *  the entire ladder and gets offered the 2D page. Shedding starts below
 *  ~27 fps instead, so the floor has to be genuinely missed, not grazed. */
const SLOW_RATIO = 1.1;

/** ~5 s of memory at 30 fps. Much slower than DRS's ~20 frames because a
 *  rung is permanent: the cost of reacting late is a few slow seconds,
 *  the cost of reacting early is garnish gone for the whole visit. */
const EMA_ALPHA = 0.0065;

/** Frames of quiet after each shed before judging again — long enough for
 *  the change to actually show up in the average rather than the ladder
 *  racing itself down to the floor in one bad second.
 *
 *  Counted in FRAMES, not seconds, because its job is to guarantee the
 *  average has enough samples to mean anything; a fixed time window would
 *  judge a very slow device on very few frames. The cost of that choice
 *  is that pacing stretches on slow hardware — a device pinned at 20 fps
 *  walks the whole ladder in ~64 s (measured, not estimated). That is
 *  deliberate at the top (garnish should not vanish the instant someone
 *  scrolls past a heavy beat) but it does mean the static-floor offer
 *  arrives about a minute in. Whether that is too patient is an ear-and-
 *  eyes question, i.e. **owner calibration at 9.2**, not an agent guess:
 *  this and GRACE_FRAMES are the two knobs that move it. */
const GRACE_FRAMES = 90;

/** Longer grace at mount. The journey's first seconds are shader
 *  compilation, texture bakes and the boot sequence; that is the most
 *  expensive stretch of the whole experience and the least representative
 *  of it. Shedding there would judge the device on its worst moment. */
const MOUNT_GRACE_FRAMES = 240;

/** Deltas above this are a stall, not a slow frame — a backgrounded tab,
 *  a lazy chunk landing, an alt-tab. Folding one into the average would
 *  shed a rung for something the GPU never did. Matches DRS's guard. */
const STALL_MS = 250;

export interface FidelityState {
  /** Index into LADDER of the next rung to shed. */
  next: number;
  /** EMA of frame time, ms. -1 until the first sample. */
  emaMs: number;
  grace: number;
  /** Rung "drsFloor" reached — `DynamicResolution` pins to DRS_MIN. */
  drsPinned: boolean;
  /** Rung "staticFloor" reached — the prompt is showing. */
  offering: boolean;
  /** Visitor refused the floor. The ladder is finished for the session. */
  declined: boolean;
  /** Bumped on every change — feeds useSyncExternalStore subscribers. */
  version: number;
}

export function createFidelityState(): FidelityState {
  return {
    next: 0,
    emaMs: -1,
    grace: MOUNT_GRACE_FRAMES,
    drsPinned: false,
    offering: false,
    declined: false,
    version: 0,
  };
}

/** The singleton the frame reader samples and the DOM surfaces observe.
 *  Frame loops read this, never React state (the lensState pattern). */
export const fidelityState = createFidelityState();

type Listener = () => void;
const listeners = new Set<Listener>();

/** Subscribe for `useSyncExternalStore`. Returns the detach. */
export function subscribeFidelity(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getFidelityVersion(): number {
  return fidelityState.version;
}

function notify(state: FidelityState): void {
  state.version++;
  // Only the singleton has observers; a test-owned state object just
  // bumps its counter and skips the fan-out.
  if (state === fidelityState) for (const fn of listeners) fn();
}

/** Apply one rung. Exported for the dev/QA path (`__experienceState`) and
 *  for tests — the sampler calls it too, so there is one implementation. */
export function shedRung(state: FidelityState, rung: Rung): void {
  if (rung === "drsFloor") {
    state.drsPinned = true;
  } else if (rung === "staticFloor") {
    state.offering = true;
  } else {
    effectsState[rung] = false;
  }
  notify(state);
}

/**
 * Fold one frame into the watchdog, shedding at most one rung per call.
 * Returns the rung shed, or null. The caller does not need to apply
 * anything — a rung is applied here so there is no way to observe a
 * decision that was never enacted.
 */
export function sampleFidelity(
  state: FidelityState,
  deltaMs: number,
  floorMs = FLOOR_FRAME_MS,
): Rung | null {
  // Ladder exhausted, or the visitor has already said no.
  if (state.declined || state.offering || state.next >= LADDER.length) {
    return null;
  }
  if (deltaMs <= 0 || deltaMs > STALL_MS) return null;

  // Grace DISCARDS samples rather than merely suppressing action, and
  // reseeds the average to the budget on the way out. Both halves matter,
  // and the first one is not obvious:
  //
  //   - At mount, the graced frames are compilation and texture bakes. An
  //     average that keeps folding them in is still ~200 ms when the grace
  //     expires, so the ladder sheds several rungs off a machine that was
  //     never slow — the 7.1 DRS "seed from the budget" lesson, one level
  //     up. (A simulation of exactly this case is what caught it.)
  //   - After a shed, the frames still in the average were rendered by the
  //     configuration we just changed. Judging the new one on them would
  //     shed the next rung for the previous rung's cost, every time,
  //     straight to the floor.
  //
  // Reseeding to the budget rather than to the first post-grace delta
  // keeps that single frame from deciding anything on its own.
  if (state.grace > 0) {
    state.grace--;
    if (state.grace === 0) state.emaMs = floorMs;
    return null;
  }

  if (state.emaMs < 0) state.emaMs = floorMs;
  state.emaMs += EMA_ALPHA * (deltaMs - state.emaMs);

  if (state.emaMs <= floorMs * SLOW_RATIO) return null;

  const rung = LADDER[state.next];
  state.next++;
  state.grace = GRACE_FRAMES;
  shedRung(state, rung);
  return rung;
}

/** Visitor refused the static floor: stop the ladder for the session.
 *  Everything already shed stays shed — they declined the *floor*, not
 *  the garnish, and putting it back is what the ratchet rule forbids. */
export function declineFloor(state: FidelityState = fidelityState): void {
  state.offering = false;
  state.declined = true;
  notify(state);
}

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
// ADR-012 §8). Shedding a light shaft is invisible; leaving for the 2D floor is a
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
 *  judge a very slow device on very few frames. The cost of that choice is
 *  that pacing stretches on slow hardware — and it used to mean the
 *  static-floor offer stretched with it, to 70.0 s at a pinned 20 fps and
 *  113 s at 10. **The offer no longer waits for the walk** (see
 *  OFFER_AFTER_MS); this constant now paces only the silent garnish rungs,
 *  which is the job the frame count was always the right unit for. */
const GRACE_FRAMES = 90;

/** How long a struggling visitor may be left before they are OFFERED the
 *  static floor — **the owner's number, gate 10.1 §8.3: "70 seconds is too
 *  long make it 30 seconds"** (2026-07-30).
 *
 *  It is a separate deadline rather than a faster ladder because the walk
 *  cannot be compressed to 30 s without gutting the two protections above
 *  it: MOUNT_GRACE_FRAMES is 12 s at 20 fps and the nine EMA re-crossings
 *  are another 15.75 s, so the walk costs 27.75 s with GRACE_FRAMES at ZERO.
 *  (Ten and 17.5 s before ADR-014 §5 deleted the `dust` rung. The deadline
 *  is in MILLISECONDS and does not depend on the ladder's length, so the
 *  ~30 s offer is unaffected — the walk simply got one crossing shorter.)
 *  Reaching 30 s by shrinking the mount grace and quickening EMA_ALPHA
 *  would re-introduce exactly what the reseed comment below was written
 *  for — shedding rungs off a machine that was only compiling shaders.
 *
 *  So the garnish keeps its careful pacing and the terminal rung gets a
 *  clock. Simulated against the real module after the change: the offer
 *  arrives at **32.5 s at a pinned 20 fps, 34.6 s at 10 fps and 38.4 s at
 *  27** — the first shed decision past the deadline, which is why it
 *  overshoots slightly and why it is "about 30 s", not exactly 30. **It
 *  also all but closes the slow-hardware inversion** the owner disliked (a
 *  5.9 s spread across 10–27 fps, against 57 s before), because a deadline
 *  in milliseconds does not care how many frames the device drew.
 *
 *  Note what the visitor gets on slow hardware: at 10 and 27 fps **one**
 *  garnish rung walks before the deadline and the other eight land at once
 *  (three walk at 20 fps). That is the intended trade — the owner asked to
 *  stop making people wait, and on the slowest hardware that means less
 *  gradual shedding, not more.
 *
 *  **ADR-013 §7a says "two" there, and it was already wrong when written.**
 *  Simulated against `main`'s own ten-rung module, 10 and 27 fps walk one
 *  rung, not two. Recorded rather than quietly corrected because the number
 *  that matters — the offer's arrival at 34.6 / 32.5 / 38.4 s — is
 *  bit-identical between ten rungs and nine, which is the actual proof that
 *  ADR-014 §5's deletion did not move this deadline.
 *
 *  Only ever consulted at a shed decision point, and that is load-bearing:
 *  a decision point is proof the device is slow RIGHT NOW (post-grace, EMA
 *  past the dead band). A device that recovers stops reaching them, so it
 *  can sit at a shed rung for ten minutes and never be asked. The clock
 *  alone must never trigger the offer. */
const OFFER_AFTER_MS = 30_000;

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
  /** Frame time actually spent since mount, ms — the OFFER_AFTER_MS budget.
   *  A sum of accepted deltas, NOT `performance.now()` since mount, so a
   *  backgrounded tab or an alt-tab cannot burn the visitor's patience
   *  while nothing is being drawn (the STALL_MS guard drops those deltas
   *  before they get here). */
  renderedMs: number;
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
    renderedMs: 0,
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
 * Fold one frame into the watchdog. Returns the rung shed, or null — and
 * `"staticFloor"` when the OFFER_AFTER_MS deadline fired, which is the one
 * call that applies MORE than one rung (see below). The caller does not
 * need to apply anything: a rung is applied here so there is no way to
 * observe a decision that was never enacted.
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

  // Counted for every accepted frame, graced or not: the deadline measures
  // how long the VISITOR has been sitting there, and the mount grace is
  // twelve of those seconds at 20 fps.
  state.renderedMs += deltaMs;

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

  // Out of patience. Spend every remaining cheap lever in one go, THEN
  // ask — the offer stays the last resort, exactly as the header promises,
  // it just stops being the last thing in a queue.
  //
  // Shedding the rest rather than jumping straight to the offer is what
  // makes a DECLINE safe: `declineFloor` ends the ladder for the session,
  // so a visitor who says no to the floor at 30 s would otherwise be left
  // on a struggling device with six rungs of garnish still burning frames
  // and no path left to shed them.
  if (state.renderedMs >= OFFER_AFTER_MS) {
    let rung: Rung = LADDER[state.next];
    while (state.next < LADDER.length) {
      rung = LADDER[state.next];
      state.next++;
      shedRung(state, rung);
    }
    return rung;
  }

  const rung = LADDER[state.next];
  state.next++;
  state.grace = GRACE_FRAMES;
  shedRung(state, rung);
  return rung;
}

// Dev-only QA handle, the `__experienceState` pattern. Exposed from here
// rather than added to `experienceState` because that module is pure lib
// and this one lives under components — the dependency only points one
// way. Lets a headless session drive rungs directly: the ladder's *logic*
// is verified offline by simulating frame deltas (it is pure for that
// reason), so what a browser is needed for is the WIRING — that each rung
// actually changes the scene, and that the offer's two answers work.
declare global {
  interface Window {
    __fidelity?: {
      state: FidelityState;
      shed: (rung: Rung) => void;
      ladder: readonly Rung[];
    };
  }
}
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  window.__fidelity = {
    state: fidelityState,
    shed: (rung) => shedRung(fidelityState, rung),
    ladder: LADDER,
  };
}

/** Visitor refused the static floor: stop the ladder for the session.
 *  Everything already shed stays shed — they declined the *floor*, not
 *  the garnish, and putting it back is what the ratchet rule forbids. */
export function declineFloor(state: FidelityState = fidelityState): void {
  state.offering = false;
  state.declined = true;
  notify(state);
}

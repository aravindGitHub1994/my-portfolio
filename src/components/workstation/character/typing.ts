// Typing rig + behaviour scheduler (plan-0009 §1.3, plan-0010 §4.1).
// Seeded finger-tap rhythm, wrist micro-motion, and — as of 4.1 — a
// scheduler that takes the figure off the keyboard: it reaches the mouse,
// reaches the mug, and leans back. Everything allocated at creation;
// update() allocates nothing. The tap timestamps feed 6.2's clack sync via
// typingState.
//
// Before 4.1 the figure typed without pause for the entire ride, and the
// only variation was a lean-back beat on its own timer every 60–110 s.
// That beat is now one of the scheduler's states rather than a parallel
// clock, so the torso and the arms can never disagree about whether the
// figure is leaning.
//
// The load-bearing detail is that taps suspend PER ARM. A person reaching
// for the mouse does not stop typing with the other hand, and the fingers
// carrying on tapping while the hand is halfway across the desk was the
// first thing the owner noticed at gate 1.3.

import type { Object3D } from "three";
import { mulberry32 } from "@/lib/prng";
import { powerPressHoldsArms } from "@/lib/powerPress";
import {
  EASE_IN_S,
  EASE_OUT_S,
  type ArmPose,
  type ArmPoseDriver,
  type ArmSide,
} from "./armPose";
import type { MugSip } from "./mugSip";

export interface TypingTargets {
  /** The eight named finger meshes, right hand first: fingerR0–3 then
   *  fingerL0–3. The order is what maps a finger to an arm. */
  fingers: Object3D[];
  /** Hand groups, [right, left] — wrist micro-bob. */
  hands: Object3D[];
  /** Torso group — the lean-back behaviour eases its pitch. */
  chest: Object3D;
  /** The arm rig's driver (1.2). Null when the rig is missing: the figure
   *  then types forever, which is exactly what it did before 4.1. */
  armPose: ArmPoseDriver | null;
  /** The mug sequence (4.2). Null falls back to 4.1's bare reach — the hand
   *  goes to the handle and comes back — so a scene without it still has a
   *  figure that takes its hands off the keyboard. */
  sip: MugSip | null;
}

export type TypingUpdate = (elapsed: number) => void;

/** 6.2 clack-sync hook: last tap time + running count (lensState pattern).
 *  Untouched by 4.1 on purpose — `AudioTextures` needs no change, and
 *  fewer taps simply means fewer clacks, which is correct rather than a
 *  coincidence. A hand away from the keyboard cannot tap, so it cannot
 *  clack. */
export const typingState = {
  lastTapAt: 0,
  taps: 0,
};

const TAP_DURATION = 0.11;
const TAP_DEPTH = 0.009;

/** How far the torso pitches back on the lean. Unchanged from the beat it
 *  replaces. */
const LEAN_PITCH = 0.07;

/** What the scheduler can do besides type. Weighted, because reaching the
 *  mouse is ordinary and leaning back is punctuation. */
interface Behaviour {
  pose: Exclude<ArmPose, "typing">;
  sides: readonly ArmSide[];
  minHold: number;
  maxHold: number;
  weight: number;
}
const BEHAVIOURS: readonly Behaviour[] = [
  { pose: "mouse", sides: ["R"], minHold: 3, maxHold: 8, weight: 5 },
  // The one behaviour that is not a bare reach: 4.2 hands it to `mugSip`,
  // which lifts the mug to the mouth and sets it back down. `minHold` is
  // therefore the time spent *drinking*, not the whole behaviour — the
  // sequence around it costs about 2.3 s more.
  { pose: "mug", sides: ["L"], minHold: 1.6, maxHold: 3.2, weight: 3 },
  { pose: "lean", sides: ["R", "L"], minHold: 2.5, maxHold: 5, weight: 2 },
];
const TOTAL_WEIGHT = BEHAVIOURS.reduce((sum, b) => sum + b.weight, 0);

/** Quiet typing before the first behaviour, and between behaviours after
 *  that. Wide and seeded so nothing lands on a beat. */
const FIRST_GAP = [18, 38] as const;
const GAP = [11, 30] as const;

/**
 * Typing comes in bursts (session 23). Before this the eight fingers tapped
 * without pause for the entire ride — the hands never stopped, so 6.2's
 * clacks never stopped either, and the owner heard a machine gun rather
 * than someone working.
 *
 * Nobody types continuously. They type a clause, stop, read it, type the
 * next one. So the keyboard now has two states and the pause is a real
 * pause: the fingers park on the keys and no tap is emitted, which means no
 * clack is emitted — the §6.2 contract ("clack timing comes from the rig's
 * tap events, never a parallel timer") is what makes fixing the *motion*
 * fix the *sound*, and it is why this lives here and not in `AudioTextures`.
 *
 * Seconds; seeded, and wide enough that no cycle is audible. ~64 % duty.
 */
const KEYS_BURST = [1.8, 4.5] as const;
const KEYS_PAUSE = [0.9, 2.6] as const;

const smooth = (t: number) => t * t * (3 - 2 * t);

export function createTyping(targets: TypingTargets, seed: number): TypingUpdate {
  const rnd = mulberry32(seed ^ 0x54595045);
  const { fingers, hands, chest, armPose, sip } = targets;

  const baseY = new Float64Array(fingers.length);
  const nextTap = new Float64Array(fingers.length);
  const tapStart = new Float64Array(fingers.length);
  for (let i = 0; i < fingers.length; i++) {
    baseY[i] = fingers[i].position.y;
    nextTap[i] = 0.3 + rnd() * 1.2;
    tapStart[i] = -1;
  }
  /** Per-finger interval between taps, seconds. Mean ~0.97 s across eight
   *  fingers is ~8 taps/s inside a burst — fast, legible typing. It was
   *  ~0.455 s (17.6 taps/s), roughly twice the fastest human keystroke
   *  rate, which is the other half of why the keyboard sounded machined. */
  const tapGap = () => 0.42 + rnd() * 1.1;
  const chestBaseRotX = chest.rotation.x;

  // Scheduler state.
  let nextBehaviourAt = FIRST_GAP[0] + rnd() * (FIRST_GAP[1] - FIRST_GAP[0]);
  let lastBehaviour = -1;
  // Keyboard burst state. Opens mid-burst so the desktop settles onto
  // someone already working.
  let keysActive = true;
  let keysSwitchAt = KEYS_BURST[0] + rnd() * (KEYS_BURST[1] - KEYS_BURST[0]);
  // The lean's chest envelope, run here so `chest.rotation` keeps exactly
  // one writer. -1 means "not leaning".
  let leanStart = -1;
  let leanHold = 0;
  /** Previous frame's clock, only so the schedule can be *frozen* rather
   *  than merely blocked while the entry gesture holds the figure. -1 is
   *  "first frame". */
  let lastElapsed = -1;

  /** Weighted pick that never repeats the previous behaviour — the cheapest
   *  defence against "no visible repeating cycle" that does not need a
   *  history buffer. */
  function pickBehaviour(): number {
    for (let attempt = 0; attempt < 8; attempt++) {
      let roll = rnd() * TOTAL_WEIGHT;
      for (let i = 0; i < BEHAVIOURS.length; i++) {
        roll -= BEHAVIOURS[i].weight;
        if (roll <= 0) {
          if (i !== lastBehaviour) return i;
          break;
        }
      }
    }
    return (lastBehaviour + 1) % BEHAVIOURS.length;
  }

  /** Is this finger's arm off the keyboard? Fingers 0–3 are the right
   *  hand, 4–7 the left, which is the order `Figure` collects them in. */
  function armBusy(side: ArmSide): boolean {
    return armPose?.busy(side) ?? false;
  }

  return (elapsed) => {
    const dt = lastElapsed < 0 ? 0 : elapsed - lastElapsed;
    lastElapsed = elapsed;

    // --- The entry gesture holds the whole figure (2.3). The machine is
    // off: nobody types on it, and the right arm belongs to the press. It
    // is a hold rather than a block — `nextBehaviourAt` rides the frozen
    // clock forward, so the seeded first gap is measured from the desktop
    // settling and is preserved *exactly* (no rnd() is drawn here, so 4.1's
    // simulated ride is bit-identical to before). False in every `?scene=`
    // harness, where nothing arms the press.
    //
    // `busy()` already stopped behaviours OVERLAPPING the press; only this
    // stops one starting a second BEFORE it and sending the right arm
    // across the desk exactly when the button needs it.
    const held = powerPressHoldsArms();
    if (held) {
      nextBehaviourAt += dt;
      // The burst schedule rides the frozen clock too, or the machine
      // finishes booting into the middle of a pause it never took.
      keysSwitchAt += dt;
    }

    // The sip advances whatever else is going on. It is only ever running
    // because this scheduler started it, and it has to see every frame of
    // its own sequence — including one where the entry gesture has just
    // taken hold, which would otherwise strand a mug in mid-air. (Not
    // reachable today: `PowerOn` mounts before the first behaviour ever
    // fires. Cheap enough not to depend on that staying true.)
    sip?.(elapsed);

    // --- Scheduler. Only starts something when both arms are home, so
    // behaviours never overlap and an interrupted reach is impossible.
    if (
      armPose &&
      !held &&
      elapsed >= nextBehaviourAt &&
      !armBusy("R") &&
      !armBusy("L")
    ) {
      const index = pickBehaviour();
      const behaviour = BEHAVIOURS[index];
      const hold =
        behaviour.minHold + rnd() * (behaviour.maxHold - behaviour.minHold);
      // The mug is a sequence rather than a pose, and it reports its own
      // length; everything else is one reach and costs the envelope. The
      // draw order above is untouched by that split on purpose — 4.1's
      // seeded ride is still the same ride, just with a longer mug beat.
      let duration = EASE_IN_S + hold + EASE_OUT_S;
      if (behaviour.pose === "mug" && sip) {
        duration = sip.start(elapsed, hold);
      } else {
        for (let s = 0; s < behaviour.sides.length; s++) {
          armPose.goTo(behaviour.sides[s], behaviour.pose, hold);
        }
      }
      if (behaviour.pose === "lean") {
        leanStart = elapsed;
        leanHold = hold;
      }
      lastBehaviour = index;
      // Measured from when the behaviour ENDS, not when it starts, so the
      // gap is quiet typing rather than partly the reach itself.
      nextBehaviourAt = elapsed + duration + GAP[0] + rnd() * (GAP[1] - GAP[0]);
    }

    // --- Lean: the torso rides the arms' own envelope.
    if (leanStart >= 0) {
      const t = elapsed - leanStart;
      const total = EASE_IN_S + leanHold + EASE_OUT_S;
      if (t >= total) {
        leanStart = -1;
        chest.rotation.x = chestBaseRotX;
      } else {
        const s =
          t < EASE_IN_S
            ? smooth(t / EASE_IN_S)
            : t < EASE_IN_S + leanHold
              ? 1
              : smooth((total - t) / EASE_OUT_S);
        chest.rotation.x = chestBaseRotX + LEAN_PITCH * s;
      }
    }

    // --- Keyboard bursts. Flipping between typing and reading, with the
    // whole hand parked for the pause. The restart re-arms every finger at
    // once so the burst does not open on a chord — and it is the only place
    // the pause draws from `rnd`, unlike the busy branch below, which
    // re-arms per frame.
    if (!held && elapsed >= keysSwitchAt) {
      keysActive = !keysActive;
      if (keysActive) {
        for (let i = 0; i < fingers.length; i++) {
          nextTap[i] = elapsed + 0.05 + rnd() * 0.9;
        }
      }
      const span = keysActive ? KEYS_BURST : KEYS_PAUSE;
      keysSwitchAt = elapsed + span[0] + rnd() * (span[1] - span[0]);
    }

    // --- Finger taps, seeded and staggered, suspended on the busy arm
    // only. The other hand carries on, which is what people actually do.
    // `held` suspends both hands: a dead machine gets no keystrokes, and
    // because 6.2's clacks are driven by taps this is also what keeps the
    // keyboard silent under the POST.
    const busyR = held || armBusy("R");
    const busyL = held || armBusy("L");
    for (let i = 0; i < fingers.length; i++) {
      const busy = i < 4 ? busyR : busyL;
      if (!busy && !keysActive) {
        // Between bursts: the hand rests ON the keys. `nextTap` is left
        // alone — the restart above owns re-arming it.
        if (tapStart[i] >= 0) {
          tapStart[i] = -1;
          fingers[i].position.y = baseY[i];
        }
        continue;
      }
      if (busy) {
        // Park the finger at rest and hold its next tap ahead of us, so it
        // does not fire the instant the hand lands back on the keys.
        if (tapStart[i] >= 0) {
          tapStart[i] = -1;
          fingers[i].position.y = baseY[i];
        }
        nextTap[i] = elapsed + 0.1 + rnd() * 0.5;
        continue;
      }
      if (tapStart[i] < 0 && elapsed >= nextTap[i]) {
        tapStart[i] = elapsed;
        nextTap[i] = elapsed + tapGap();
        typingState.lastTapAt = elapsed;
        typingState.taps++;
      }
      if (tapStart[i] >= 0) {
        const t = (elapsed - tapStart[i]) / TAP_DURATION;
        if (t >= 1) {
          tapStart[i] = -1;
          fingers[i].position.y = baseY[i];
        } else {
          fingers[i].position.y = baseY[i] - Math.sin(t * Math.PI) * TAP_DEPTH;
        }
      }
    }

    // --- Wrist micro-motion — tiny asymmetric bob, stilled on a busy arm.
    hands[0].position.y = busyR ? 0 : Math.sin(elapsed * 5.1) * 0.0012;
    if (hands.length > 1) {
      hands[1].position.y = busyL ? 0 : Math.sin(elapsed * 4.3 + 1.7) * 0.0012;
    }
  };
}

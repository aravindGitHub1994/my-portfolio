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
import {
  EASE_IN_S,
  EASE_OUT_S,
  type ArmPose,
  type ArmPoseDriver,
  type ArmSide,
} from "./armPose";

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
  // 4.2 makes this an actual lift and sip; for now the hand goes to the
  // handle and comes back, which is the arm half of the same motion.
  { pose: "mug", sides: ["L"], minHold: 1.6, maxHold: 3.2, weight: 3 },
  { pose: "lean", sides: ["R", "L"], minHold: 2.5, maxHold: 5, weight: 2 },
];
const TOTAL_WEIGHT = BEHAVIOURS.reduce((sum, b) => sum + b.weight, 0);

/** Quiet typing before the first behaviour, and between behaviours after
 *  that. Wide and seeded so nothing lands on a beat. */
const FIRST_GAP = [18, 38] as const;
const GAP = [11, 30] as const;

const smooth = (t: number) => t * t * (3 - 2 * t);

export function createTyping(targets: TypingTargets, seed: number): TypingUpdate {
  const rnd = mulberry32(seed ^ 0x54595045);
  const { fingers, hands, chest, armPose } = targets;

  const baseY = new Float64Array(fingers.length);
  const nextTap = new Float64Array(fingers.length);
  const tapStart = new Float64Array(fingers.length);
  for (let i = 0; i < fingers.length; i++) {
    baseY[i] = fingers[i].position.y;
    nextTap[i] = 0.3 + rnd() * 1.2;
    tapStart[i] = -1;
  }
  const chestBaseRotX = chest.rotation.x;

  // Scheduler state.
  let nextBehaviourAt = FIRST_GAP[0] + rnd() * (FIRST_GAP[1] - FIRST_GAP[0]);
  let lastBehaviour = -1;
  // The lean's chest envelope, run here so `chest.rotation` keeps exactly
  // one writer. -1 means "not leaning".
  let leanStart = -1;
  let leanHold = 0;

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
    // --- Scheduler. Only starts something when both arms are home, so
    // behaviours never overlap and an interrupted reach is impossible.
    if (
      armPose &&
      elapsed >= nextBehaviourAt &&
      !armBusy("R") &&
      !armBusy("L")
    ) {
      const index = pickBehaviour();
      const behaviour = BEHAVIOURS[index];
      const hold =
        behaviour.minHold + rnd() * (behaviour.maxHold - behaviour.minHold);
      for (let s = 0; s < behaviour.sides.length; s++) {
        armPose.goTo(behaviour.sides[s], behaviour.pose, hold);
      }
      if (behaviour.pose === "lean") {
        leanStart = elapsed;
        leanHold = hold;
      }
      lastBehaviour = index;
      // Measured from when the behaviour ENDS, not when it starts, so the
      // gap is quiet typing rather than partly the reach itself.
      nextBehaviourAt =
        elapsed +
        EASE_IN_S +
        hold +
        EASE_OUT_S +
        GAP[0] +
        rnd() * (GAP[1] - GAP[0]);
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

    // --- Finger taps, seeded and staggered, suspended on the busy arm
    // only. The other hand carries on, which is what people actually do.
    const busyR = armBusy("R");
    const busyL = armBusy("L");
    for (let i = 0; i < fingers.length; i++) {
      const busy = i < 4 ? busyR : busyL;
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
        nextTap[i] = elapsed + 0.18 + rnd() * 0.55;
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

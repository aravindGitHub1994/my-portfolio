// Typing rig (plan-0009 §1.3): seeded finger-tap rhythm + wrist
// micro-motion + an occasional "big beat" (lean back every ~60–110 s).
// Everything allocated at creation; update() allocates nothing. The tap
// timestamps feed 6.2's clack sync later via typingState.

import type { Object3D } from "three";
import { mulberry32 } from "@/lib/prng";

export interface TypingTargets {
  /** The eight named finger meshes (fingerR0–3, fingerL0–3). */
  fingers: Object3D[];
  /** Hand groups — wrist micro-bob. */
  hands: Object3D[];
  /** Torso group — the lean-back big beat eases its pitch. */
  chest: Object3D;
}

export type TypingUpdate = (elapsed: number) => void;

/** 6.2 clack-sync hook: last tap time + running count (lensState pattern). */
export const typingState = {
  lastTapAt: 0,
  taps: 0,
};

const TAP_DURATION = 0.11;
const TAP_DEPTH = 0.009;
const BEAT_DURATION = 4.5;

export function createTyping(targets: TypingTargets, seed: number): TypingUpdate {
  const rnd = mulberry32(seed ^ 0x54595045);
  const { fingers, hands, chest } = targets;

  const baseY = new Float64Array(fingers.length);
  const nextTap = new Float64Array(fingers.length);
  const tapStart = new Float64Array(fingers.length);
  for (let i = 0; i < fingers.length; i++) {
    baseY[i] = fingers[i].position.y;
    nextTap[i] = 0.3 + rnd() * 1.2;
    tapStart[i] = -1;
  }
  const chestBaseRotX = chest.rotation.x;
  let nextBeatAt = 60 + rnd() * 50;
  let beatStart = -1;

  return (elapsed) => {
    // Big beat: lean back, hold, return; typing pauses while it plays.
    let beating = false;
    if (beatStart < 0 && elapsed >= nextBeatAt) {
      beatStart = elapsed;
      nextBeatAt = elapsed + 60 + rnd() * 50;
    }
    if (beatStart >= 0) {
      const t = (elapsed - beatStart) / BEAT_DURATION;
      if (t >= 1) {
        beatStart = -1;
        chest.rotation.x = chestBaseRotX;
      } else {
        beating = true;
        // Smooth in-out envelope with a held middle.
        const env =
          t < 0.25
            ? t / 0.25
            : t > 0.75
              ? (1 - t) / 0.25
              : 1;
        const smooth = env * env * (3 - 2 * env);
        chest.rotation.x = chestBaseRotX + 0.07 * smooth;
      }
    }

    // Finger taps — seeded, staggered; skipped during the big beat.
    for (let i = 0; i < fingers.length; i++) {
      if (tapStart[i] < 0) {
        if (!beating && elapsed >= nextTap[i]) {
          tapStart[i] = elapsed;
          nextTap[i] = elapsed + 0.18 + rnd() * 0.55;
          typingState.lastTapAt = elapsed;
          typingState.taps++;
        }
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

    // Wrist micro-motion — tiny asymmetric bob, stilled during the beat.
    const bob = beating ? 0 : 1;
    hands[0].position.y = Math.sin(elapsed * 5.1) * 0.0012 * bob;
    if (hands.length > 1) {
      hands[1].position.y = Math.sin(elapsed * 4.3 + 1.7) * 0.0012 * bob;
    }
  };
}

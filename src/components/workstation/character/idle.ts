// Idle-animation driver (plan-0009 §1.1): breathing, blinks, head sway —
// sine/noise driven, written to object refs from useFrame. Everything is
// allocated here, once; update() allocates nothing.

import type { Object3D } from "three";
import { mulberry32 } from "@/lib/prng";

export interface IdleTargets {
  /** Torso group — breathing scales it slightly. */
  chest: Object3D;
  /** Head group at the neck pivot — sway rotates it. */
  head: Object3D;
  /** Eyelid plane — blinks scale it open/shut. */
  eyelids: Object3D;
}

export type IdleUpdate = (elapsed: number, delta: number) => void;

const BREATH_PERIOD = 4.2;
const BLINK_DURATION = 0.14;
/** Resting eyelid scale — a hairline crease, not a closed lid. */
const LID_REST = 0.15;

export function createIdle(targets: IdleTargets, seed: number): IdleUpdate {
  const rnd = mulberry32(seed ^ 0x49444c45);
  const { chest, head, eyelids } = targets;
  const baseRotX = head.rotation.x;
  const baseRotY = head.rotation.y;
  let nextBlinkAt = 1.5 + rnd() * 3;
  let blinkStart = -1;

  return (elapsed) => {
    // Breathing — chest scale, ~4 s period, subtler in x than y/z.
    const breath = Math.sin((elapsed / BREATH_PERIOD) * Math.PI * 2);
    const lift = 1 + breath * 0.013;
    chest.scale.set(1 + breath * 0.006, lift, lift);

    // Head sway — two incommensurate sines so it never visibly loops.
    head.rotation.y = baseRotY + Math.sin(elapsed * 0.31) * 0.045 +
      Math.sin(elapsed * 0.83) * 0.02;
    head.rotation.x = baseRotX + Math.sin(elapsed * 0.47) * 0.02;

    // Blinks — randomized 2–6 s apart (seeded), ~140 ms each.
    if (blinkStart < 0 && elapsed >= nextBlinkAt) {
      blinkStart = elapsed;
      nextBlinkAt = elapsed + 2 + rnd() * 4;
    }
    if (blinkStart >= 0) {
      const t = (elapsed - blinkStart) / BLINK_DURATION;
      if (t >= 1) {
        blinkStart = -1;
        eyelids.scale.y = LID_REST;
      } else {
        // Bell curve: closed at t=0.5.
        const bell = Math.sin(t * Math.PI);
        eyelids.scale.y = LID_REST + bell * (1 - LID_REST);
      }
    }
  };
}

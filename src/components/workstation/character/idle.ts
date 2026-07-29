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

/** Additive head rotation, in radians, owned by whoever is making the head
 *  do something deliberate — today only 4.2's sip (ADR-013 §6).
 *
 *  It exists because `head.rotation` must keep exactly **one writer**. The
 *  sip wants the head to dip toward the mug; the sway wants to keep
 *  breathing underneath it. Two writers would fight for the property and
 *  whichever ran second would win, which is how you get a head that jitters
 *  between two poses at frame rate. So the sip states an *offset* and this
 *  driver adds it to the sway it was going to write anyway — the tilt
 *  composes with the sway instead of replacing it, and letting go is just
 *  easing the offset back to zero.
 *
 *  **The setter owns the easing.** Nothing here smooths it, so a writer
 *  that snaps this from 0 to its full value snaps the head. */
export const headOffset = { pitch: 0, yaw: 0 };

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
    // `headOffset` rides on top: the sip's tilt is added here rather than
    // written by the sip, so this stays the only writer of head.rotation.
    head.rotation.y = baseRotY + Math.sin(elapsed * 0.31) * 0.045 +
      Math.sin(elapsed * 0.83) * 0.02 + headOffset.yaw;
    head.rotation.x = baseRotX + Math.sin(elapsed * 0.47) * 0.02 +
      headOffset.pitch;

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

// Cat idle driver (plan-0010 §5.2, ADR-013 §8) — the tails move, and very
// rarely an ear flicks. Built in the shape of `character/idle.ts`: everything
// is allocated here, once, and `update()` allocates nothing.
//
// **The brief was "slow".** These are two content animals on a cat tree at
// dusk, seen from across the room in chapter 3; the point is that the room
// is alive, not that anything is happening. The visible tip travel over a
// full sweep is a couple of centimetres — about twenty pixels at the
// chapter-3 framing.
//
// **Slow, but the owner asked for a smidge faster** (gate 10.1 §4.3,
// ADR-014 §8), and `WAG_RATE` below is that smidge. The fastest term in the
// driver had a ~10.3 s period at rate 1.0; at 1.2 it is ~8.6 s.
//
// **Why sines and not a scheduler.** 4.1's behaviour scheduler exists because
// a person's arm has to *commit* — it is at the keyboard or at the mug, and
// the states are mutually exclusive. A resting tail has no states; it drifts.
// Summed incommensurate sines are the honest model of that, and they cost no
// bookkeeping and cannot leave the tail parked somewhere odd if a frame is
// dropped. The ear flick is the one discrete beat here, so it is the one
// thing that gets a seeded timer.
//
// **Nothing here is periodic in practice.** Each cat's terms are irrational-
// ish multiples of each other and the second cat runs every frequency at
// 0.847× the first, so the pair drifts continuously rather than beating: the
// two tails are never in phase for long, and there is no common period to
// notice over a two-minute watch.
//
// The pivots and ears are found by name (`cat.ts` names them for this) and
// the rest rotations they were authored with are captured as the zero of
// every offset — the builder seeds those per cat, so a driver that wrote
// absolute angles would flatten the two cats into the same pose.

import type { Object3D } from "three";
import { mulberry32 } from "@/lib/prng";

export interface CatRig {
  /** `tail{n}` — the pivot at the haunch. */
  tail: Object3D;
  /** `tailTip{n}` — the second joint, inside the tail. Curls. */
  tip: Object3D;
  /** `catEar{n}{R,L}`. Flicked one at a time, rarely. */
  ears: Object3D[];
}

export type CatIdleUpdate = (elapsed: number) => void;

/** How long an ear flick takes, seconds. A real one is faster than this;
 *  faster than ~150 ms at chapter-3 distance and a few frames of a shed
 *  frame rate can miss it entirely, so this is the slowest a flick can be
 *  and still read as a twitch rather than as a turn of the head. */
const FLICK_S = 0.16;
/** Seconds between flicks, per cat. Rare by the plan's word: the flick is
 *  punctuation, and punctuation stops working if it arrives on a schedule
 *  the visitor can feel. */
const FLICK_GAP_MIN = 14;
const FLICK_GAP_SPAN = 26;

/** Second cat's frequency scale. Not 0.5 or 0.75 — a simple ratio would
 *  make the two tails beat against each other on a period you can see. */
const CAT_B_RATE = 0.847;

/** Gate 10.1 §4.3 — the owner asked for "a smidge" faster (ADR-014 §8).
 *
 *  **One multiplier, applied to `t` and nothing else.** All seven
 *  frequencies scale identically, so every ratio between them — and
 *  `CAT_B_RATE`'s 0.847 — is preserved exactly. Editing the seven literals
 *  individually risks landing two of them on a rational ratio and putting a
 *  visible beat into a driver whose whole design is that it has no period.
 *
 *  It must scale `t`, **not `elapsed`**: `elapsed` is also the ear-flick
 *  clock below, and `FLICK_GAP_MIN`/`FLICK_GAP_SPAN` are specified in real
 *  seconds.
 *
 *  A starting candidate, not a chosen value — headless renders this scene
 *  at 2–6 fps and cannot judge a cadence, so gate 6.2 is where the number
 *  is settled by the owner's eyes. */
const WAG_RATE = 1.2;

interface Bones {
  rig: CatRig;
  /** Authored rest rotations. Every write below is rest + offset, because
   *  `buildCat` seeds the hang and the curl per cat. */
  tailRestX: number;
  tailRestY: number;
  tipRestX: number;
  tipRestY: number;
  earRestX: number[];
  earRestZ: number[];
  /** Frequency scale and phase, so the two cats never agree. */
  rate: number;
  phase: number;
  nextFlickAt: number;
  flickStart: number;
  flickEar: number;
  /** +1 / −1 — an ear twitches away from the skull, and which side that is
   *  depends on which ear it is. */
  flickDir: number;
}

export function createCatIdle(rigs: CatRig[], seed: number): CatIdleUpdate {
  const rnd = mulberry32(seed ^ 0x43415453);
  const bones: Bones[] = rigs.map((rig, i) => ({
    rig,
    tailRestX: rig.tail.rotation.x,
    tailRestY: rig.tail.rotation.y,
    tipRestX: rig.tip.rotation.x,
    tipRestY: rig.tip.rotation.y,
    earRestX: rig.ears.map((e) => e.rotation.x),
    earRestZ: rig.ears.map((e) => e.rotation.z),
    rate: i === 0 ? 1 : CAT_B_RATE,
    // A whole-driver phase offset on top of the rate, so the two are apart
    // from the first frame rather than only after the rates have drifted.
    phase: rnd() * Math.PI * 2,
    nextFlickAt: FLICK_GAP_MIN * 0.4 + rnd() * FLICK_GAP_SPAN,
    flickStart: -1,
    flickEar: 0,
    flickDir: 1,
  }));

  return (elapsed) => {
    for (const b of bones) {
      const t = elapsed * b.rate * WAG_RATE + b.phase;

      // Side to side — the sweep, and the only term big enough to notice.
      b.rig.tail.rotation.y =
        b.tailRestY + Math.sin(t * 0.53) * 0.14 + Math.sin(t * 0.211) * 0.07;
      // Lift and fall. Smaller than the sweep: a tail that rises as far as
      // it swings reads as interest in something, and these two are staring
      // out of a window, not stalking.
      b.rig.tail.rotation.x =
        b.tailRestX + Math.sin(t * 0.169) * 0.055 + Math.sin(t * 0.397) * 0.028;
      // The tip carries most of the visible motion — it is at the end of the
      // lever, and it is what makes the tail read as an S rather than a
      // stick swinging from one end.
      b.rig.tip.rotation.x =
        b.tipRestX + Math.sin(t * 0.61 + 1.1) * 0.15 + Math.sin(t * 0.283) * 0.08;
      b.rig.tip.rotation.y = b.tipRestY + Math.sin(t * 0.457 + 2.3) * 0.11;

      // --- the ear flick ---------------------------------------------
      // Uses the true `elapsed`, not the rate-scaled `t`: a gap in seconds
      // should be a gap in seconds for both cats.
      if (b.flickStart < 0 && elapsed >= b.nextFlickAt) {
        b.flickStart = elapsed;
        b.nextFlickAt = elapsed + FLICK_GAP_MIN + rnd() * FLICK_GAP_SPAN;
        b.flickEar = rnd() < 0.5 ? 0 : 1;
        // Ear 0 is the +X side (`cat.ts` iterates [1, -1]), so away from the
        // skull is +z for one ear and -z for the other.
        b.flickDir = b.flickEar === 0 ? 1 : -1;
      }
      if (b.flickStart >= 0) {
        const i = b.flickEar;
        const ear = b.rig.ears[i];
        const k = (elapsed - b.flickStart) / FLICK_S;
        if (k >= 1) {
          b.flickStart = -1;
          if (ear) {
            ear.rotation.x = b.earRestX[i];
            ear.rotation.z = b.earRestZ[i];
          }
        } else if (ear) {
          // Bell curve, the blink's shape in `idle.ts`: out and back, with
          // no discontinuity at either end.
          const bell = Math.sin(k * Math.PI);
          ear.rotation.z = b.earRestZ[i] + bell * 0.34 * b.flickDir;
          ear.rotation.x = b.earRestX[i] - bell * 0.1;
        }
      }
    }
  };
}

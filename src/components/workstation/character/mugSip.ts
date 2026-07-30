// The mug sip (plan-0010 §4.2, ADR-013 §6) — the only behaviour in which
// the figure moves something that is not part of it.
//
// 4.1 left this as a reach: the hand went to the handle, waited, and came
// back, and the mug never moved. Making it an actual drink needs three
// things the reach did not:
//
//  1. **Four legs, not one.** handle → mouth → handle → home. The pose
//     driver's envelope is one ease-in / hold / ease-out, so each leg is
//     its own `goTo` with `HOLD_UNTIL_RELEASED`, and this file is the
//     little machine that decides when each one is over. Legs are advanced
//     on the driver's own `contact` report rather than on a private timer,
//     for the reason 2.3 gives: the beat belongs to where the hand actually
//     is, not to a clock running beside it.
//  2. **A prop that follows the hand.** See below — the mug is *driven*,
//     never re-parented.
//  3. **A head tilt that does not fight the idle sway.** It sets
//     `headOffset` and `idle.ts` adds it, so `head.rotation` keeps one
//     writer (ADR-013 §6).
//
// **Why the mug is driven rather than re-parented.** `Object3D.attach()`
// would be one line and is the obvious way to carry a prop. It is wrong
// here because it moves *ownership*: for the length of the sip the mug
// would be a child of the figure, and both `Figure` and `RoomScene` dispose
// their subtrees by traversing their own root. A fidelity downgrade or a
// `detail` change mid-sip — both reachable at runtime, the ladder does the
// first one by itself — would then either dispose the mug's geometry twice
// or never, depending on which tree it happened to be sitting in. Writing
// the mug's transform each frame leaves it a child of the room for its
// whole life, so no unmount order can go wrong.
//
// Drift is impossible by construction rather than by care: the carried
// transform is recomputed every frame from the hand and a fixed offset
// (it never integrates), and putting the mug down copies back the exact
// position/quaternion/scale captured when it was picked up. Ten sips or ten
// thousand, the mug lands bit-identical.

import { Matrix4, Quaternion, Vector3, type Group, type Object3D } from "three";
import { propHandles } from "../scene/propHandles";
import {
  armPoseState,
  EASE_IN_S,
  EASE_OUT_S,
  HOLD_UNTIL_RELEASED,
  type ArmPoseDriver,
} from "./armPose";
import { headOffset } from "./idle";

export interface MugSip {
  /** Advance one frame. Cheap enough to call unconditionally — it is one
   *  comparison while no sip is running. */
  (elapsed: number): void;
  /** Start a sip that holds the mug at the mouth for `sipHoldS` seconds.
   *  Returns the whole sequence's duration, so the scheduler can measure
   *  its next quiet gap from the end of the behaviour rather than from the
   *  start of it (4.1's pacing rule). */
  start(elapsed: number, sipHoldS: number): number;
  /** Put the mug back exactly where it was picked up, drop the head tilt,
   *  and abandon the sequence — now, without an envelope. Idempotent.
   *
   *  This is the teardown path, not a beat: `Figure` calls it on unmount so
   *  that a scene torn down mid-sip cannot leave a mug hanging in the air
   *  or a head tilted. It deliberately does **not** touch the arm — the
   *  caller owns that, and on unmount the rig is going away anyway. */
  release(): void;
}

/** Fingers closing on the handle before the lift, and opening after the set
 *  down. Short — this is the beat that stops the mug from appearing to be
 *  welded to a hand that merely arrived. */
const GRIP_S = 0.28;
const SET_DOWN_S = 0.22;

/** The furthest the mug is ever tipped from upright while carried, radians
 *  (~28°). **This is the one place the carry is not rigid, and it is not a
 *  preference — it is the wrist the rig does not have.**
 *
 *  The arm is two bones and no wrist (ADR-013 §1), so a mug welded to the
 *  hand is tipped by exactly however much the forearm swung between the
 *  desk and the mouth. An offline sweep of every reachable fingertip target
 *  crossed with the full ±1.6 rad of elbow swivel put that at **59–136°**,
 *  with 59° the flattest angle the rig can reach: the mug arrives at the
 *  mouth pouring, and the coffee disc inside it pokes out through the wall.
 *  A real drinker rotates their wrist to keep the cup level; this figure
 *  cannot, so the prop does the last few degrees itself.
 *
 *  What it costs: the handle turns slightly within the fingers at the top of
 *  the lift. What it buys: coffee that stays in the cup. The correction is
 *  a clamp rather than a blend, so the carry is **exactly rigid** for as
 *  long as it can be and only gives way past this angle — which also means
 *  it does nothing at all at the grab and the set-down, where the mug is
 *  upright and the hand is the only thing moving it. */
const MAX_TILT = 0.49;

/** How far the head dips toward the mug, radians. The head pivot is tilted
 *  -0.06 toward the screen at rest and the rim arrives below the mouth, so
 *  this is negative (down) and small: the sip is mostly the arm's move, and
 *  a head that swings to meet a cup reads as a puppet.
 *
 *  A touch of yaw goes with it — positive turns the face toward -X, which
 *  is the side the mug is on — so the beat reads as *looking at the cup*
 *  rather than as a nod that happens to coincide with one. */
const SIP_PITCH = -0.085;
const SIP_YAW = 0.045;

type SipPhase =
  /** Nothing running; the mug is on the desk and the head is level. */
  | "off"
  /** Empty hand on its way to the handle. */
  | "reach"
  /** Hand on the handle, fingers closing. The mug is already carried — it
   *  simply is not going anywhere yet. */
  | "grip"
  /** Carrying it up to the mouth. */
  | "lift"
  /** At the mouth, drinking. */
  | "sip"
  /** Carrying it back down to the desk. */
  | "lower"
  /** Mug released onto the desk, hand still on the handle. */
  | "setDown";

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * @param armPose the driver whose left arm this sequences.
 * @param hand    `handL` — the frame the mug is carried in. It is a group at
 *                the elbow pivot's origin, so it moves rigidly with the
 *                forearm and picks up `typing.ts`'s wrist bob for free.
 */
export function createMugSip(armPose: ArmPoseDriver, hand: Object3D): MugSip {
  // Everything the frame path touches, allocated once (the `idle.ts` rule).
  const carry = new Matrix4();
  const parentInv = new Matrix4();
  const target = new Matrix4();
  const homePosition = new Vector3();
  const homeQuaternion = new Quaternion();
  const homeScale = new Vector3();
  /** Up, expressed in the mug's parent frame — the axis the tilt clamp
   *  measures against. Captured at the grab rather than assumed to be
   *  (0,1,0): it is only that because the room root happens to sit
   *  untransformed at the origin, and this file should not be the place
   *  that quietly depends on it. */
  const parentUp = new Vector3(0, 1, 0);
  const carriedUp = new Vector3();
  const levelAxis = new Vector3();
  const levelQuaternion = new Quaternion();

  /** The mug we picked up, or null when nothing is in the hand. Held as a
   *  direct reference rather than re-read from `propHandles` each frame, so
   *  that a mug replaced mid-sip (a `detail` change rebuilds the room) is
   *  detectable rather than silently written to. */
  let carried: Group | null = null;
  let phase: SipPhase = "off";
  /** Start of the current timed phase — only `grip` and `setDown` are timed;
   *  every other leg ends when the hand arrives. */
  let phaseStart = 0;
  let sipHoldS = 0;
  /** The head tilt runs on its own ramp so it can lead and trail the legs
   *  smoothly instead of stepping between phases. */
  let tiltStart = 0;
  let tiltUp = false;

  /** Has the arm arrived at `pose` and stopped there? The driver's own
   *  report, qualified by pose exactly as `TowerPower` qualifies the
   *  press's — an arm still easing has `contact` false, and an arm at some
   *  other pose is not the one we are waiting on. */
  function arrived(pose: "mug" | "sip"): boolean {
    return armPoseState.L.contact && armPoseState.L.pose === pose;
  }

  function grab(): void {
    const mug = propHandles.mug;
    // No mug in this scene (`?scene=character`) — the sequence still runs
    // and the figure still reaches, drinks from an empty hand and returns.
    // That is 4.1's behaviour exactly, which is the right thing to degrade
    // to and the reason the handle is allowed to be null.
    if (!mug?.parent) return;

    homePosition.copy(mug.position);
    homeQuaternion.copy(mug.quaternion);
    homeScale.copy(mug.scale);

    hand.updateWorldMatrix(true, false);
    mug.updateWorldMatrix(true, false);
    // The room root does not move, so its inverse is captured once per sip
    // rather than rebuilt per frame.
    parentInv.copy(mug.parent.matrixWorld).invert();
    parentUp.set(0, 1, 0).transformDirection(parentInv);
    // Where the mug sits in the hand's frame, frozen at the moment of the
    // grab: the hand has just arrived AT the handle, so this is "hold it
    // exactly where it already is" and the pick-up introduces no snap.
    carry.copy(hand.matrixWorld).invert().multiply(mug.matrixWorld);
    carried = mug;
  }

  function putDown(): void {
    const mug = carried;
    carried = null;
    // Only ever restore onto the object we picked up. If the room remounted
    // mid-sip the mug we were carrying is disposed and a fresh one is
    // already sitting at home untouched — writing our stale transform onto
    // it would move a mug nobody lifted.
    if (mug && propHandles.mug === mug) {
      mug.position.copy(homePosition);
      mug.quaternion.copy(homeQuaternion);
      mug.scale.copy(homeScale);
    }
  }

  function carryFrame(): void {
    if (!carried) return;
    if (propHandles.mug !== carried) {
      // The room went away underneath us. Drop it without restoring: the
      // group is being disposed, and whatever replaced it is already home.
      carried = null;
      return;
    }
    // Read the hand's world matrix ourselves rather than trusting the one
    // left over from last frame's render — the pose driver moved the pivots
    // a few lines ago, and a mug one frame behind the hand it is held in
    // reads as slip.
    hand.updateWorldMatrix(true, false);
    target.multiplyMatrices(hand.matrixWorld, carry).premultiply(parentInv);
    target.decompose(carried.position, carried.quaternion, carried.scale);

    // Give the mug back the degrees the missing wrist would have held, and
    // only those: rotate its up-axis toward the parent's up by however much
    // it is tipped past MAX_TILT, about the axis that closes the angle
    // directly. Below the clamp this is a no-op and the carry is rigid.
    carriedUp.set(0, 1, 0).applyQuaternion(carried.quaternion);
    const excess = Math.acos(Math.min(1, Math.max(-1, carriedUp.dot(parentUp)))) - MAX_TILT;
    if (excess > 1e-4) {
      levelAxis.crossVectors(carriedUp, parentUp);
      // Zero-length only if the mug is exactly upright or exactly inverted,
      // and neither can be past the clamp — but a normalize() of a zero
      // vector is a silent NaN that would strand the mug, so it is checked.
      if (levelAxis.lengthSq() > 1e-12) {
        levelQuaternion.setFromAxisAngle(levelAxis.normalize(), excess);
        carried.quaternion.premultiply(levelQuaternion);
      }
    }
  }

  function tiltTo(up: boolean, elapsed: number): void {
    tiltUp = up;
    tiltStart = elapsed;
  }

  const tick = (elapsed: number): void => {
    if (phase === "off") return;

    switch (phase) {
      case "reach":
        if (arrived("mug")) {
          grab();
          phase = "grip";
          phaseStart = elapsed;
        }
        break;
      case "grip":
        if (elapsed - phaseStart >= GRIP_S) {
          armPose.goTo("L", "sip", HOLD_UNTIL_RELEASED);
          phase = "lift";
          tiltTo(true, elapsed);
        }
        break;
      case "lift":
        if (arrived("sip")) {
          phase = "sip";
          phaseStart = elapsed;
        }
        break;
      case "sip":
        if (elapsed - phaseStart >= sipHoldS) {
          armPose.goTo("L", "mug", HOLD_UNTIL_RELEASED);
          phase = "lower";
          tiltTo(false, elapsed);
        }
        break;
      case "lower":
        if (arrived("mug")) {
          putDown();
          phase = "setDown";
          phaseStart = elapsed;
        }
        break;
      case "setDown":
        if (elapsed - phaseStart >= SET_DOWN_S) {
          // The only leg that ends at rest, so the only one with a finite
          // hold: from here the driver's own ease-out brings the arm home.
          armPose.goTo("L", "typing", 0);
          phase = "off";
        }
        break;
    }

    carryFrame();

    // Head tilt, after the legs so a phase change takes effect this frame.
    const ramp = smooth(Math.min(1, Math.max(0, (elapsed - tiltStart) / EASE_IN_S)));
    const amount = tiltUp ? ramp : 1 - ramp;
    headOffset.pitch = SIP_PITCH * amount;
    headOffset.yaw = SIP_YAW * amount;
  };

  const start: MugSip["start"] = (elapsed, holdS) => {
    sipHoldS = holdS;
    phase = "reach";
    phaseStart = elapsed;
    armPose.goTo("L", "mug", HOLD_UNTIL_RELEASED);

    // What the scheduler is told the behaviour costs. Each of the three
    // carried legs is one ease-in; only the trip home is an ease-out. The
    // legs actually end on arrival rather than on this arithmetic, so this
    // is a prediction accurate to a frame per leg — which is all a
    // twenty-second quiet gap needs it to be.
    return (
      EASE_IN_S + GRIP_S + EASE_IN_S + holdS + EASE_IN_S + SET_DOWN_S + EASE_OUT_S
    );
  };

  const release: MugSip["release"] = () => {
    putDown();
    phase = "off";
    tiltUp = false;
    headOffset.pitch = 0;
    headOffset.yaw = 0;
  };

  return Object.assign(tick, { start, release });
}

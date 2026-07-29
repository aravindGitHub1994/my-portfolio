// Arm-pose driver (plan-0010 §1.2, ADR-013 §1) — the thing that actually
// moves the two-bone chains 1.1 built. Shaped like `idle.ts` and
// `typing.ts`: everything allocated at creation, `update()` allocates
// nothing and writes only to object refs from useFrame.
//
// At runtime this is four quaternions and a `slerp`. There is no IK solver
// in the frame path and no geometry is ever rebuilt (ADR-013 §1) — the
// pivots' target rotations are solved ONCE, at creation, from the pose
// targets below, and after that `update()` just interpolates between two
// fixed endpoints. Solving rather than hand-typing the quaternions is what
// makes "the hand lands ON the mouse" a property of the code instead of a
// property of how patiently somebody nudged four numbers; the targets read
// as the world coordinates they are.
//
// Because the pose endpoints are FIXED quaternions and the return leg
// finishes with an exact `copy(REST)`, poses cannot accumulate drift — ten
// round trips end bit-identical to the typing pose, which is 1.2's
// acceptance criterion and the reason the envelope interpolates between
// endpoints instead of integrating a velocity.

import { Quaternion, Vector3, type Object3D } from "three";
import { ARM_JOINTS, armPointLocal, type ArmPoint } from "./buildBody";

export type ArmPose = "typing" | "power" | "mouse" | "mug" | "lean";
export type ArmSide = "R" | "L";

export interface ArmPoseTargets {
  /** The four rig pivots, by name: shoulderPivot{R,L} / elbowPivot{R,L}. */
  shoulderR: Object3D;
  elbowR: Object3D;
  shoulderL: Object3D;
  elbowL: Object3D;
}

export interface ArmPoseDriver {
  (elapsed: number, delta: number): void;
  /** Ease the arm to `pose`, hold `holdS` seconds, ease back to typing.
   *  Calling mid-move re-targets from wherever the arm currently is. */
  goTo(side: ArmSide, pose: ArmPose, holdS: number): void;
  /** True while an arm is anywhere but its typing rest — 4.1 suspends taps
   *  on the busy arm only, so the other hand keeps working. */
  busy(side: ArmSide): boolean;
}

/** Read-only-ish frame state, the `typingState` pattern. `contact` is true
 *  only during the hold phase — the window in which the hand is actually
 *  ON its target, which is what 2.3 times the button depress, the LED and
 *  the degauss thunk against (audio lands on contact, not on click). */
export const armPoseState = {
  R: { pose: "typing" as ArmPose, contact: false },
  L: { pose: "typing" as ArmPose, contact: false },
};

// --- Pose targets -----------------------------------------------------
//
// Figure space, which is world space: `FullScene` mounts `<Figure/>` and
// `<RoomScene/>` as untransformed siblings, so the figure's root and the
// room's placements share an origin. The coordinates below are the room's
// placement literals from `RoomScene.tsx` plus the height of the thing
// being touched — they are duplicated here on purpose and deliberately
// temporarily: 4.2 replaces the mug entry with the live prop handle
// (ADR-013 §6) once the mug can move.

/** Mouse shell top (`buildMouse`: r 0.032 × 0.62 at y 0.012 over the desk),
 *  plus a millimetre so the palm rests on it rather than in it. */
export const MOUSE_GRIP = new Vector3(0.42, 0.757, -0.46);

/** The mug's handle, and specifically the upper outside of its arc — where
 *  fingers actually hook, rather than the ring's centre, which is inside
 *  the handle and 2 cm lower. Derived from `buildMug`'s half-torus (ring
 *  0.026, centred local (0.041, 0.05, 0), rolled -90° about z so the arc
 *  opens in y) through the -0.5 rad yaw the room places the mug with,
 *  which swings the handle toward the figure.
 *
 *  Chasing the ring centre instead cost 2.6 cm of reach and dragged the
 *  swing 9 mm through the desk top — this is the shortest, highest grip
 *  the handle offers, and it is also the correct one. */
export const MUG_GRIP = new Vector3(-0.566, 0.785, -0.43);

/** Tower power button, world — the constant the whole opening hangs off
 *  (`AGENTS.md` conventions; `buildTower` local (0.17, 0.057, 0.202) at the
 *  room's tower placement). Pressed with a fingertip, not a palm. */
export const POWER_BUTTON = new Vector3(-0.05, 0.777, -0.518);

/** Hands off the keys — drawn back toward the body and lifted, the shape
 *  that goes with `typing.ts`'s lean-back beat.
 *
 *  Not the lap, and not resting on the desk either, which is the one place
 *  the envelope's shape shows through. A move is a single `slerp` between
 *  two rotations: there is no arc control, so a hand travelling from over
 *  the keycaps to anywhere *below* them sags through them on the way. An
 *  offline sweep of targets and swivels put the sag at 6–16 mm for every
 *  desk-height rest tried, and at zero from here. **Any pose added later
 *  must clear keycap height (world y 0.752) along its whole path, or it
 *  needs a via-point the driver does not have.**
 *
 *  At ~64 % extension it is also the only pose with an obviously bent
 *  elbow, which makes it the useful one to watch at gate 1.3. */
export const LEAN_REST_R = new Vector3(0.32, 0.79, -0.3);
export const LEAN_REST_L = new Vector3(-0.32, 0.79, -0.3);

/** Solve the two bones so `point` lands on `target`. Every pose is a reach
 *  — even `lean`, which reaches the desk rather than an object. */
interface PoseSpec {
  target: Vector3;
  point: ArmPoint;
  /** Spin the elbow around the shoulder→target axis: the one degree of
   *  freedom the tip position leaves free. Zero is the minimal swing. */
  swivel?: number;
}

/** Per pose, per side. A side with no entry cannot strike that pose: the
 *  mouse is on the right of the desk and the mug is on the left, and no
 *  amount of driver generality changes that. */
const POSES: Record<
  Exclude<ArmPose, "typing">,
  Partial<Record<ArmSide, PoseSpec>>
> = {
  power: { R: { target: POWER_BUTTON, point: "fingertips" } },
  mouse: { R: { target: MOUSE_GRIP, point: "palm" } },
  mug: { L: { target: MUG_GRIP, point: "fingertips" } },
  lean: {
    R: { target: LEAN_REST_R, point: "palm" },
    L: { target: LEAN_REST_L, point: "palm" },
  },
};

// --- Envelope ---------------------------------------------------------

const EASE_IN_S = 0.55;
const EASE_OUT_S = 0.7;
/** Never straighten the elbow past this angle between the bones. A locked
 *  elbow reads as a mannequin (which is exactly what gate 1.3 is watching
 *  for), so a target beyond reach is approached to here and no further. */
const MIN_BEND = 0.14;
/** Nor fold it tighter than this. */
const MAX_BEND = 2.45;

/** Smoothstep — ease in and out of both ends of the envelope. */
function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

// --- The two-bone solve (creation-time only) --------------------------

/**
 * Solve the shoulder and elbow rotations that put `point` on `target`.
 *
 * The chain is: shoulder pivot at `ARM_JOINTS.shoulder`, one fixed bone to
 * the elbow pivot, one fixed offset from there to the hand point. Bone
 * lengths never change, so this is the classic planar two-bone problem:
 *
 *  1. The elbow is a hinge. Its axis is the rest pose's own bend normal
 *     (`u × v`), so the arm bends in the plane it already bends in and
 *     cannot hyperextend sideways into something that isn't an elbow.
 *  2. The angle between the bones follows from the distance to the target
 *     alone (law of cosines) — clamped, which is where an out-of-reach
 *     target stops short instead of tearing the arm straight.
 *  3. The shoulder then swings the whole (now correctly folded) chain so
 *     its tip points at the target. Minimal rotation by default; `swivel`
 *     spins the elbow around the shoulder→target axis, the one degree of
 *     freedom the tip position genuinely does not determine.
 *
 * Allocates freely — this runs four times per figure, at creation.
 */
function solveReach(
  side: 1 | -1,
  target: Vector3,
  point: ArmPoint,
  swivel: number,
  outShoulder: Quaternion,
  outElbow: Quaternion,
): void {
  const shoulder =
    side === 1
      ? ARM_JOINTS.shoulder.clone()
      : new Vector3(-ARM_JOINTS.shoulder.x, ARM_JOINTS.shoulder.y, ARM_JOINTS.shoulder.z);
  const elbow =
    side === 1
      ? ARM_JOINTS.elbow.clone()
      : new Vector3(-ARM_JOINTS.elbow.x, ARM_JOINTS.elbow.y, ARM_JOINTS.elbow.z);

  // Bone 1: shoulder → elbow, in shoulder-local space (rest = identity, so
  // shoulder-local and elbow-local axes coincide and one basis serves both).
  const bone1 = elbow.sub(shoulder);
  const l1 = bone1.length();
  const u = bone1.clone().divideScalar(l1);

  // Bone 2: elbow → the hand point, in elbow-local space.
  const bone2 = armPointLocal(side, point);
  const l2 = bone2.length();
  const v = bone2.clone().divideScalar(l2);

  const hinge = new Vector3().crossVectors(u, v).normalize();
  const restBend = Math.acos(Math.min(1, Math.max(-1, u.dot(v))));

  // Reach, clamped to the angles the elbow is allowed to hold.
  const span = (bend: number) =>
    Math.sqrt(l1 * l1 + l2 * l2 + 2 * l1 * l2 * Math.cos(bend));
  const reach = target.clone().sub(shoulder);
  const distance = Math.min(
    span(MIN_BEND),
    Math.max(span(MAX_BEND), reach.length()),
  );

  const cosBend =
    (distance * distance - l1 * l1 - l2 * l2) / (2 * l1 * l2);
  const bend = Math.acos(Math.min(1, Math.max(-1, cosBend)));
  outElbow.setFromAxisAngle(hinge, bend - restBend);

  // Where the hand point now sits relative to the shoulder, before the
  // shoulder swings — |tip| === distance, by construction.
  const tip = bone2.clone().applyQuaternion(outElbow).add(bone1).normalize();
  outShoulder.setFromUnitVectors(tip, reach.normalize());
  if (swivel !== 0) {
    outShoulder.premultiply(new Quaternion().setFromAxisAngle(reach, swivel));
  }
}

function solvePose(side: 1 | -1, spec: PoseSpec): [Quaternion, Quaternion] {
  const shoulder = new Quaternion();
  const elbow = new Quaternion();
  solveReach(side, spec.target, spec.point, spec.swivel ?? 0, shoulder, elbow);
  return [shoulder, elbow];
}

// --- Driver -----------------------------------------------------------

const REST = new Quaternion();

interface ArmState {
  shoulder: Object3D;
  elbow: Object3D;
  /** Blend endpoints — copied, so an interrupt mid-move is just a new
   *  `from`, never a discontinuity. */
  fromShoulder: Quaternion;
  fromElbow: Quaternion;
  toShoulder: Quaternion;
  toElbow: Quaternion;
  phase: "rest" | "in" | "hold" | "out";
  phaseStart: number;
  /** Length of the current ease, seconds — an interrupted move eases back
   *  over the same time it would have taken to arrive. */
  easeS: number;
  holdS: number;
}

function makeArm(shoulder: Object3D, elbow: Object3D): ArmState {
  return {
    shoulder,
    elbow,
    fromShoulder: new Quaternion(),
    fromElbow: new Quaternion(),
    toShoulder: new Quaternion(),
    toElbow: new Quaternion(),
    phase: "rest",
    phaseStart: 0,
    easeS: EASE_IN_S,
    holdS: 0,
  };
}

export function createArmPose(targets: ArmPoseTargets): ArmPoseDriver {
  // Solve every pose once, up front. Four pivots, five poses, and no
  // allocation at all after this point — the lookup is nested records
  // rather than a keyed Map so even `goTo` never builds a string.
  const solved: Record<ArmSide, Partial<Record<ArmPose, [Quaternion, Quaternion]>>> =
    { R: {}, L: {} };
  for (const pose of Object.keys(POSES) as Exclude<ArmPose, "typing">[]) {
    for (const side of ["R", "L"] as const) {
      const spec = POSES[pose][side];
      if (spec) solved[side][pose] = solvePose(side === "R" ? 1 : -1, spec);
    }
  }

  const arms: Record<ArmSide, ArmState> = {
    R: makeArm(targets.shoulderR, targets.elbowR),
    L: makeArm(targets.shoulderL, targets.elbowL),
  };

  // `goTo` is called from event handlers and schedulers, which have no
  // clock; the frame loop leaves the last time it saw here so a move
  // starts on the frame it was asked for rather than one frame late.
  let lastElapsed = 0;

  /** Blend an arm to `s` along its current endpoints. Writes two
   *  quaternions in place — `slerpQuaternions` is the allocation-free
   *  form, which is why the endpoints are stored rather than the axis and
   *  angle they came from. */
  function apply(arm: ArmState, s: number): void {
    arm.shoulder.quaternion.slerpQuaternions(arm.fromShoulder, arm.toShoulder, s);
    arm.elbow.quaternion.slerpQuaternions(arm.fromElbow, arm.toElbow, s);
  }

  function step(side: ArmSide, elapsed: number): void {
    const arm = arms[side];
    if (arm.phase === "rest") return;
    const t = elapsed - arm.phaseStart;

    if (arm.phase === "in") {
      if (t >= arm.easeS) {
        apply(arm, 1);
        arm.phase = "hold";
        arm.phaseStart = elapsed;
        armPoseState[side].contact = true;
      } else {
        apply(arm, smooth(t / arm.easeS));
      }
    } else if (arm.phase === "hold") {
      if (t >= arm.holdS) {
        // Return leg: from exactly where we are, to exactly rest.
        arm.fromShoulder.copy(arm.shoulder.quaternion);
        arm.fromElbow.copy(arm.elbow.quaternion);
        arm.toShoulder.copy(REST);
        arm.toElbow.copy(REST);
        arm.phase = "out";
        arm.phaseStart = elapsed;
        arm.easeS = EASE_OUT_S;
        armPoseState[side].contact = false;
      }
    } else if (t >= arm.easeS) {
      // Land on rest exactly rather than at 0.9999 of it — this is what
      // makes ten round trips leave no drift.
      arm.shoulder.quaternion.copy(REST);
      arm.elbow.quaternion.copy(REST);
      arm.phase = "rest";
      armPoseState[side].pose = "typing";
    } else {
      apply(arm, smooth(t / arm.easeS));
    }
  }

  // Both arms, unrolled. A `for…of` over a two-element literal would
  // allocate an array and an iterator on every frame of the ride — small,
  // but `heapDeltaPerSec` exists to catch exactly this, and an offline
  // frame-count run measured it at ~7 bytes a frame before this was
  // unrolled.
  function tick(elapsed: number): void {
    lastElapsed = elapsed;
    step("R", elapsed);
    step("L", elapsed);
  }

  const goTo: ArmPoseDriver["goTo"] = (side, pose, holdS) => {
    const arm = arms[side];
    if (pose === "typing") {
      // Explicit return: ease home from wherever we are.
      arm.fromShoulder.copy(arm.shoulder.quaternion);
      arm.fromElbow.copy(arm.elbow.quaternion);
      arm.toShoulder.copy(REST);
      arm.toElbow.copy(REST);
      arm.phase = "out";
      arm.easeS = EASE_OUT_S;
      arm.phaseStart = lastElapsed;
      armPoseState[side].contact = false;
      return;
    }
    const target = solved[side][pose];
    if (!target) {
      // A pose this arm has no spec for. Loud in dev, inert in prod — the
      // scheduler asking the left arm for the mouse is a bug in the
      // scheduler, not something to silently mime.
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[armPose] no ${pose} pose for the ${side} arm`);
      }
      return;
    }
    arm.fromShoulder.copy(arm.shoulder.quaternion);
    arm.fromElbow.copy(arm.elbow.quaternion);
    arm.toShoulder.copy(target[0]);
    arm.toElbow.copy(target[1]);
    arm.phase = "in";
    arm.phaseStart = lastElapsed;
    arm.easeS = EASE_IN_S;
    arm.holdS = holdS;
    armPoseState[side].pose = pose;
    armPoseState[side].contact = false;
  };

  const busy: ArmPoseDriver["busy"] = (side) => arms[side].phase !== "rest";

  return Object.assign(tick, { goTo, busy });
}

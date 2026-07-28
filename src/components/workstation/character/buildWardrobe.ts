// Wardrobe extras (plan-0009 §1.3): the smartwatch on the LEFT wrist
// (concept sheets). Strap wraps the forearm just above the wrist joint,
// face sits on the outer (upper) side in the typing pose.
//
// Since the arm rig (ADR-013 §1) the watch is authored in **left-elbow-local
// space** and parented onto `elbowPivotL` by `Figure.tsx`, so it rides the
// forearm through every pose instead of floating where the typing pose used
// to put it. At rest the pivots are at identity, so elbow-local coordinates
// equal the old body-space ones minus the elbow joint — the placement the
// owner signed off is unchanged.

import {
  BoxGeometry,
  Group,
  Mesh,
  Quaternion,
  TorusGeometry,
  Vector3,
} from "three";
import { ARM_JOINTS, type BuilderOptions } from "./buildBody";

const UP = new Vector3(0, 1, 0);

export function buildWardrobe({ detail, material, palette }: BuilderOptions): Group {
  const group = new Group();
  group.name = "wardrobe";
  const watchMat = palette?.watch ?? material;
  const strapMat = palette?.watchStrap ?? material;

  // Left forearm in elbow-local space: mirror the right-arm joints in x,
  // then measure from the elbow. This is the same `wristLocal` the forearm
  // capsule is built from in `buildBody`.
  const wristLocal = new Vector3(
    -(ARM_JOINTS.wrist.x - ARM_JOINTS.elbow.x),
    ARM_JOINTS.wrist.y - ARM_JOINTS.elbow.y,
    ARM_JOINTS.wrist.z - ARM_JOINTS.elbow.z,
  );
  const dir = wristLocal.clone().normalize();
  // Strap centre a touch up-arm from the wrist joint.
  const center = wristLocal.clone().addScaledVector(dir, -0.035);
  const quat = new Quaternion().setFromUnitVectors(UP, dir);

  const strap = new Mesh(
    new TorusGeometry(0.042, 0.007, 8, detail === "high" ? 22 : 12),
    strapMat,
  );
  strap.position.copy(center);
  strap.quaternion.copy(quat);
  // Torus lies in XZ after the quaternion maps Y along the arm — the ring
  // wraps the forearm.
  strap.rotateX(Math.PI / 2);
  group.add(strap);

  // Face: on the outer/upper side of the forearm. The offset is along the
  // pivot's +Y, which at rest is world up — as before the rig.
  const face = new Mesh(new BoxGeometry(0.03, 0.01, 0.026), watchMat);
  face.position.copy(center).add(new Vector3(0, 0.043, 0));
  face.quaternion.copy(quat);
  group.add(face);
  const glass = new Mesh(new BoxGeometry(0.022, 0.004, 0.018), strapMat);
  glass.position.copy(center).add(new Vector3(0, 0.049, 0));
  glass.quaternion.copy(quat);
  group.add(glass);

  return group;
}

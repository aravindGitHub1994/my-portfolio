// Seated body builder (plan-0009 §1.1): lathe/capsule construction in the
// typing pose — the pose IS the model, no T-pose/retarget machinery
// (ADR-012 §3). Pure seeded function; unit-testable without a canvas.

import {
  BoxGeometry,
  CapsuleGeometry,
  Group,
  LatheGeometry,
  Mesh,
  Quaternion,
  SphereGeometry,
  Vector2,
  Vector3,
  type Material,
} from "three";

export type DetailLevel = "low" | "high";

export interface BuilderOptions {
  seed: number;
  detail: DetailLevel;
  material: Material;
}

/** Figure-space anchor the head group attaches to (top of the neck). */
export const NECK_PIVOT = new Vector3(0, 1.15, -0.045);

const UP = new Vector3(0, 1, 0);

/** Capsule limb between two joints — the workhorse of the whole figure. */
export function capsuleBetween(
  a: Vector3,
  b: Vector3,
  radius: number,
  material: Material,
  detail: DetailLevel,
): Mesh {
  const dir = b.clone().sub(a);
  const length = dir.length();
  const radial = detail === "high" ? 12 : 7;
  const caps = detail === "high" ? 5 : 3;
  const mesh = new Mesh(
    new CapsuleGeometry(radius, length, caps, radial),
    material,
  );
  mesh.quaternion.copy(
    new Quaternion().setFromUnitVectors(UP, dir.normalize()),
  );
  mesh.position.copy(a.clone().add(b).multiplyScalar(0.5));
  return mesh;
}

function mirror(v: Vector3): Vector3 {
  return new Vector3(-v.x, v.y, v.z);
}

/**
 * Torso, arms (typing), legs (seated), sneakers, neck. The figure faces -Z;
 * the (absent) desk and screen sit in front of it at negative Z. Origin is
 * the floor under the stool's centre.
 */
export function buildBody({ detail, material }: BuilderOptions): Group {
  const group = new Group();
  group.name = "body";
  const lathe = detail === "high" ? 40 : 20;

  // Torso — lathe profile hips→waist→chest→shoulders, leaned slightly
  // toward the keyboard. The chest node is the idle rig's breathing target.
  const chest = new Group();
  chest.name = "chest";
  const profile: Vector2[] = [
    new Vector2(0.005, 0.0),
    new Vector2(0.135, 0.005),
    new Vector2(0.155, 0.06),
    new Vector2(0.162, 0.14),
    new Vector2(0.152, 0.24),
    new Vector2(0.168, 0.34),
    new Vector2(0.178, 0.42),
    new Vector2(0.155, 0.5),
    new Vector2(0.095, 0.55),
    new Vector2(0.048, 0.58),
    new Vector2(0.04, 0.63),
  ];
  const torso = new Mesh(new LatheGeometry(profile, lathe), material);
  chest.add(torso);

  // Hips filler under the lathe's open base.
  const hips = new Mesh(
    new SphereGeometry(0.13, lathe, detail === "high" ? 18 : 10),
    material,
  );
  hips.scale.set(1.25, 0.6, 1.05);
  hips.position.set(0, 0.02, 0);
  chest.add(hips);

  // Shoulder caps.
  for (const side of [1, -1]) {
    const cap = new Mesh(
      new SphereGeometry(0.055, detail === "high" ? 18 : 10, 12),
      material,
    );
    cap.position.set(0.185 * side, 0.51, 0);
    chest.add(cap);
  }

  chest.position.set(0, 0.48, 0);
  chest.rotation.x = -0.09; // lean toward the keyboard
  group.add(chest);

  // Neck — crosses the head pivot so the sway never shows a seam.
  group.add(
    capsuleBetween(
      new Vector3(0, 1.05, -0.03),
      new Vector3(0, 1.17, -0.05),
      0.046,
      material,
      detail,
    ),
  );

  // Arms — elbows ~90°, hands at keyboard height (concept sheets).
  const joints = {
    shoulder: new Vector3(0.2, 1.02, -0.06),
    elbow: new Vector3(0.26, 0.8, -0.14),
    wrist: new Vector3(0.12, 0.75, -0.4),
  };
  for (const side of [1, -1]) {
    const s = side === 1 ? joints.shoulder : mirror(joints.shoulder);
    const e = side === 1 ? joints.elbow : mirror(joints.elbow);
    const w = side === 1 ? joints.wrist : mirror(joints.wrist);
    const upper = capsuleBetween(s, e, 0.047, material, detail);
    const forearm = capsuleBetween(e, w, 0.04, material, detail);
    // 1.3 paints the tattoo albedo onto this mesh; the typing rig moves it.
    forearm.name = side === 1 ? "forearmR" : "forearmL";
    group.add(upper, forearm);

    // Hand: palm + four curled fingers + thumb, resting at keyboard height.
    const hand = new Group();
    hand.name = side === 1 ? "handR" : "handL";
    const palm = new Mesh(new BoxGeometry(0.075, 0.028, 0.085), material);
    palm.position.copy(w).add(new Vector3(-0.015 * side, -0.012, -0.045));
    palm.rotation.set(-0.25, 0, 0);
    hand.add(palm);
    for (let f = 0; f < 4; f++) {
      const root = palm.position
        .clone()
        .add(new Vector3((f - 1.5) * 0.019 * side, -0.004, -0.045));
      const tip = root.clone().add(new Vector3(0, -0.028, -0.03));
      hand.add(capsuleBetween(root, tip, 0.0095, material, detail));
    }
    const thumbRoot = palm.position
      .clone()
      .add(new Vector3(0.042 * side, -0.006, -0.01));
    const thumbTip = thumbRoot.clone().add(new Vector3(0.012 * side, -0.024, -0.03));
    hand.add(capsuleBetween(thumbRoot, thumbTip, 0.011, material, detail));
    group.add(hand);
  }

  // Legs — thighs forward under the (absent) desk, shins down, sneakers.
  const hipJ = new Vector3(0.09, 0.5, -0.02);
  const knee = new Vector3(0.105, 0.52, -0.36);
  const ankle = new Vector3(0.108, 0.1, -0.33);
  for (const side of [1, -1]) {
    const h = side === 1 ? hipJ : mirror(hipJ);
    const k = side === 1 ? knee : mirror(knee);
    const a = side === 1 ? ankle : mirror(ankle);
    group.add(capsuleBetween(h, k, 0.066, material, detail));
    group.add(capsuleBetween(k, a, 0.047, material, detail));
    const sneaker = new Mesh(
      new BoxGeometry(0.085, 0.065, 0.21),
      material,
    );
    sneaker.position.set(a.x, 0.038, a.z - 0.055);
    group.add(sneaker);
  }

  return group;
}

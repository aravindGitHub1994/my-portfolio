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

/** Color zones (1.3). When absent, builders fall back to `material` —
 *  the clay-preview path stays intact. */
export interface CharacterPalette {
  skin: Material;
  /** Right forearm — carries the tattoo albedo. */
  forearmR: Material;
  tee: Material;
  jeans: Material;
  sneaker: Material;
  watch: Material;
  watchStrap: Material;
  earring: Material;
  earbud: Material;
}

export interface BuilderOptions {
  seed: number;
  detail: DetailLevel;
  material: Material;
  palette?: CharacterPalette;
}

/** Figure-space anchor the head group attaches to (top of the neck). */
export const NECK_PIVOT = new Vector3(0, 1.15, -0.045);

/** Right-arm joints (mirror x for the left) — shared with buildWardrobe. */
export const ARM_JOINTS = {
  shoulder: new Vector3(0.2, 1.02, -0.06),
  elbow: new Vector3(0.26, 0.8, -0.14),
  wrist: new Vector3(0.12, 0.79, -0.365),
} as const;

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
export function buildBody({ detail, material, palette }: BuilderOptions): Group {
  const group = new Group();
  group.name = "body";
  const lathe = detail === "high" ? 40 : 20;
  const skin = palette?.skin ?? material;
  const tee = palette?.tee ?? material;
  const jeans = palette?.jeans ?? material;
  const sneakerMat = palette?.sneaker ?? material;

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
    new Vector2(0.162, 0.34),
    new Vector2(0.168, 0.42),
    // Shoulder→neck taper spread over many rows: the old 3-row drop
    // (0.155→0.048 in 8 cm) left a shelf that read as a shirt collar in
    // profile once the torso was flattened (gate-2.3 owner QA).
    new Vector2(0.152, 0.48),
    new Vector2(0.128, 0.52),
    new Vector2(0.1, 0.55),
    new Vector2(0.072, 0.58),
    new Vector2(0.05, 0.61),
    new Vector2(0.04, 0.63),
  ];
  const torsoGeometry = new LatheGeometry(profile, lathe);
  // Back flattening: the lathe forces back depth = chest depth, but a back
  // is near-planar — soft-clamp +Z (the figure faces -Z) so the hump goes
  // while the silhouette keeps a hint of curve (gate-2.3 owner QA).
  const torsoPos = torsoGeometry.attributes.position;
  const BACK_Z = 0.09;
  for (let i = 0; i < torsoPos.count; i++) {
    const z = torsoPos.getZ(i);
    if (z > BACK_Z) torsoPos.setZ(i, BACK_Z + (z - BACK_Z) * 0.25);
  }
  torsoGeometry.computeVertexNormals();
  const torso = new Mesh(torsoGeometry, tee);
  chest.add(torso);

  // Hips filler under the lathe's open base.
  const hips = new Mesh(
    new SphereGeometry(0.13, lathe, detail === "high" ? 18 : 10),
    jeans,
  );
  hips.scale.set(1.25, 0.6, 1.05);
  hips.position.set(0, 0.02, 0);
  chest.add(hips);

  // Shoulder caps.
  for (const side of [1, -1]) {
    const cap = new Mesh(
      new SphereGeometry(0.055, detail === "high" ? 18 : 10, 12),
      tee,
    );
    cap.position.set(0.185 * side, 0.51, 0);
    chest.add(cap);
  }

  chest.position.set(0, 0.48, 0);
  // The lathe is radially symmetric, so depth would equal width and the
  // torso balloons in profile — chest AND back (gate-2.3 defect 3).
  // Flatten front-back only; shoulder width is carried by the caps and
  // stays untouched. 0.85 was still visibly rounded at owner QA.
  chest.scale.z = 0.7;
  chest.rotation.x = -0.09; // lean toward the keyboard
  group.add(chest);

  // Neck — crosses the head pivot so the sway never shows a seam.
  group.add(
    capsuleBetween(
      new Vector3(0, 1.05, -0.03),
      new Vector3(0, 1.17, -0.05),
      0.046,
      skin,
      detail,
    ),
  );

  // Arms — elbows ~90°, hands at keyboard height (concept sheets).
  // Upper arm wears the tee (elbow-length sleeve); forearms are skin —
  // the right one carries the tattoo albedo (palette.forearmR).
  for (const side of [1, -1]) {
    const s = side === 1 ? ARM_JOINTS.shoulder : mirror(ARM_JOINTS.shoulder);
    const e = side === 1 ? ARM_JOINTS.elbow : mirror(ARM_JOINTS.elbow);
    const w = side === 1 ? ARM_JOINTS.wrist : mirror(ARM_JOINTS.wrist);
    const upper = capsuleBetween(s, e, 0.047, tee, detail);
    const forearm = capsuleBetween(
      e,
      w,
      0.04,
      side === 1 ? (palette?.forearmR ?? skin) : skin,
      detail,
    );
    forearm.name = side === 1 ? "forearmR" : "forearmL";
    group.add(upper, forearm);

    // Hand: palm + four curled fingers + thumb. Palm hovers just above the
    // keycap tops (world y ≈ 0.753–0.756 with the riser tilt) so resting
    // fingertips kiss the caps and the 1.3 tap dip reads as a key press —
    // gate-2.3 defect 1 was tips buried ~45 mm below the caps.
    // Fingers are named so the 1.3 typing rig can tap them individually.
    const hand = new Group();
    hand.name = side === 1 ? "handR" : "handL";
    const palm = new Mesh(new BoxGeometry(0.075, 0.028, 0.085), skin);
    palm.position.copy(w).add(new Vector3(-0.015 * side, -0.01, -0.04));
    palm.rotation.set(-0.25, 0, 0);
    hand.add(palm);
    for (let f = 0; f < 4; f++) {
      const root = palm.position
        .clone()
        .add(new Vector3((f - 1.5) * 0.019 * side, -0.004, -0.042));
      const tip = root.clone().add(new Vector3(0, -0.012, -0.02));
      const finger = capsuleBetween(root, tip, 0.0095, skin, detail);
      finger.name = `finger${side === 1 ? "R" : "L"}${f}`;
      hand.add(finger);
    }
    const thumbRoot = palm.position
      .clone()
      .add(new Vector3(0.042 * side, -0.006, -0.01));
    const thumbTip = thumbRoot.clone().add(new Vector3(0.012 * side, -0.012, -0.025));
    hand.add(capsuleBetween(thumbRoot, thumbTip, 0.011, skin, detail));
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
    group.add(capsuleBetween(h, k, 0.066, jeans, detail));
    group.add(capsuleBetween(k, a, 0.047, jeans, detail));
    const sneaker = new Mesh(
      new BoxGeometry(0.085, 0.065, 0.21),
      sneakerMat,
    );
    sneaker.position.set(a.x, 0.038, a.z - 0.055);
    group.add(sneaker);
  }

  return group;
}

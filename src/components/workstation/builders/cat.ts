// The cats (plan-0010 §5.1, ADR-013 §8) — Nimbus and Ivy, sitting on the
// tree looking out of the window. Local origin at the base of the haunches,
// facing -Z; `RoomScene` yaws each one toward the glass.
//
// They are built as *loaves*: a cat sitting with its legs tucked is one
// rounded mass, a head and a tail, and at chapter-3 distance that silhouette
// is the whole read. Modelling legs on a sitting cat would spend triangles
// on shapes the pose hides.
//
// **Coats are matched to the reference photographs** (`assets-src/personal/`,
// untracked and unshipped — ADR-013 §9). Nimbus is a ginger with a cream
// muzzle, chest and paws. Ivy is a dilute calico: grey body, cream underside,
// and a ginger patch over one side of her face, which is the marking that
// makes her recognisable rather than just "the grey one".
//
// The tail hangs off a named pivot per cat — `tail0` / `tail1` — with a
// second `tailTip{n}` inside it. 5.2 rotates them on slow incommensurate
// sines; nothing here animates.

import { CapsuleGeometry, ConeGeometry, Group, Mesh, SphereGeometry } from "three";
import { mulberry32 } from "@/lib/prng";
import type { RoomBuilderOptions } from "./materials";

export type CatName = "nimbus" | "ivy";

export interface CatOptions extends RoomBuilderOptions {
  cat: CatName;
  /** 0 or 1 — only used to name the tail pivots, so 5.2 has two fixed
   *  names to find rather than having to guess at traversal order. */
  index: 0 | 1;
}

/** Overall scale per cat. Nimbus is the younger, smaller one in the
 *  photographs; the size difference is most of what tells them apart in
 *  silhouette, before any colour reads at all. */
const SCALE: Record<CatName, number> = { nimbus: 0.82, ivy: 1 };

const BODY_R = 0.085;
const BODY_LEN = 0.1;
const HEAD_R = 0.062;

export function buildCat({ seed, detail, materials, cat, index }: CatOptions): Group {
  const group = new Group();
  group.name = `cat_${cat}`;
  const rnd = mulberry32(seed ^ (cat === "nimbus" ? 0x4e494d42 : 0x49565921));
  // Deliberately coarse. A cat is ten rounded lumps, and at full sphere
  // tessellation the pair outweighed the entire rest of the room — desk,
  // CRT, tower, chair and all — by more than two to one. These are
  // background animals seen from across a room at dusk; the silhouette is
  // the whole read, and the silhouette survives this.
  const segs = detail === "high" ? 12 : 6;
  const capSegs = detail === "high" ? 5 : 3;

  const coat = cat === "nimbus" ? materials.catGinger : materials.catGrey;

  // Haunches: a capsule on its side, the widest part of a sitting cat.
  const body = new Mesh(
    new CapsuleGeometry(BODY_R, BODY_LEN, capSegs, segs),
    coat,
  );
  body.rotation.z = Math.PI / 2;
  body.position.set(0, BODY_R + 0.01, 0);
  group.add(body);

  // Chest, rising toward the head and lighter on both cats.
  const chest = new Mesh(new SphereGeometry(BODY_R * 0.78, segs, segs), materials.catCream);
  chest.position.set(0, BODY_R + 0.055, -BODY_R * 0.62);
  chest.scale.set(0.85, 1.05, 0.85);
  group.add(chest);

  const headY = BODY_R + 0.135;
  const headZ = -BODY_R * 0.72;
  const head = new Mesh(new SphereGeometry(HEAD_R, segs, segs), coat);
  head.name = `catHead${index}`;
  head.position.set(0, headY, headZ);
  // Slightly flattened — both cats are Persian-ish in the photographs.
  head.scale.set(1, 0.94, 0.92);
  group.add(head);

  // Muzzle: the pale wedge that stops the head reading as a ball.
  const muzzle = new Mesh(new SphereGeometry(HEAD_R * 0.5, segs, segs), materials.catCream);
  muzzle.position.set(0, headY - HEAD_R * 0.3, headZ - HEAD_R * 0.72);
  muzzle.scale.set(1.1, 0.7, 0.8);
  group.add(muzzle);

  // Ivy's ginger cheek patch — the dilute-calico marking. Asymmetric on
  // purpose: it is on one side of her face in every photograph.
  if (cat === "ivy") {
    const patch = new Mesh(new SphereGeometry(HEAD_R * 0.52, segs, segs), materials.catGinger);
    patch.position.set(HEAD_R * 0.5, headY + HEAD_R * 0.16, headZ - HEAD_R * 0.36);
    patch.scale.set(0.7, 0.85, 0.8);
    group.add(patch);
  }

  // Ears. Cones rather than anything cleverer — at this size an ear is a
  // triangle, and a triangle is what a cone gives you from any angle.
  for (const side of [1, -1]) {
    const ear = new Mesh(new ConeGeometry(HEAD_R * 0.36, HEAD_R * 0.62, 4), coat);
    ear.position.set(
      side * HEAD_R * 0.56,
      headY + HEAD_R * 0.78,
      headZ + HEAD_R * 0.1,
    );
    ear.rotation.set(0.12, Math.PI / 4, side * 0.28);
    group.add(ear);
  }

  // Front paws, tucked forward under the chest. Two small capsules — the
  // one place a sitting cat's legs do show.
  for (const side of [1, -1]) {
    const paw = new Mesh(
      new CapsuleGeometry(BODY_R * 0.22, BODY_R * 0.34, capSegs, segs),
      materials.catCream,
    );
    paw.rotation.x = Math.PI / 2;
    paw.position.set(side * BODY_R * 0.42, BODY_R * 0.32, -BODY_R * 0.95);
    group.add(paw);
  }

  // Tail: a pivot at the haunch, a second inside it, so 5.2 can drive a
  // curve rather than a rigid stick. Seeded rest angles so the two cats do
  // not start in the same pose even before anything animates them.
  const tail = new Group();
  tail.name = `tail${index}`;
  tail.position.set(0, BODY_R * 0.85, BODY_LEN * 0.5 + BODY_R * 0.55);
  tail.rotation.x = -0.5 - rnd() * 0.35;

  const tailLen = 0.13;
  const upper = new Mesh(
    new CapsuleGeometry(BODY_R * 0.2, tailLen, capSegs, segs),
    coat,
  );
  upper.rotation.x = Math.PI / 2;
  upper.position.z = tailLen * 0.5;
  tail.add(upper);

  const tip = new Group();
  tip.name = `tailTip${index}`;
  tip.position.z = tailLen;
  tip.rotation.x = 0.35 + rnd() * 0.3;
  const lower = new Mesh(
    new CapsuleGeometry(BODY_R * 0.16, tailLen * 0.85, capSegs, segs),
    coat,
  );
  lower.rotation.x = Math.PI / 2;
  lower.position.z = tailLen * 0.42;
  tip.add(lower);
  tail.add(tip);
  group.add(tail);

  group.scale.setScalar(SCALE[cat]);
  return group;
}

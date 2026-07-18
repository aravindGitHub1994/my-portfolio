// Head builder (plan-0009 §1.1): simplified planes — brow, nose, cheekbones,
// no eyes/mouth detail (the face is never the hero, ADR-012 §2). Signature
// features that must read at mid-shot: hoop earrings (both), earbuds (both).
// Built in head-local space around the neck pivot so the idle sway rotates
// everything together. Pure seeded function; no canvas needed.

import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from "three";
import type { BuilderOptions } from "./buildBody";

/** Skull centre in head-local space (origin = neck pivot). */
export const SKULL_CENTER = new Vector3(0, 0.105, 0.005);
export const SKULL_RADIUS = 0.105;

export function buildHead({ detail, material }: BuilderOptions): Group {
  const group = new Group();
  group.name = "head";
  const segs = detail === "high" ? 32 : 16;
  const cy = SKULL_CENTER.y;

  // Skull — slightly tall, slightly deep.
  const skull = new Mesh(new SphereGeometry(SKULL_RADIUS, segs, segs), material);
  skull.scale.set(0.94, 1.06, 1.0);
  skull.position.copy(SKULL_CENTER);
  group.add(skull);

  // Brow ridge — one clean plane above the (absent) eyes.
  const brow = new Mesh(new BoxGeometry(0.105, 0.02, 0.032), material);
  brow.position.set(0, cy + 0.033, -0.088);
  brow.rotation.x = 0.25;
  group.add(brow);

  // Nose — a simple wedge, read in profile. Positive x-tilt pushes the
  // tip (bottom) outward toward -Z; negative reads as an upturned snout.
  const nose = new Mesh(new BoxGeometry(0.024, 0.055, 0.036), material);
  nose.position.set(0, cy - 0.008, -0.104);
  nose.rotation.x = 0.22;
  group.add(nose);

  // Cheekbones — flattened spheres; enough form for the key light to catch.
  for (const side of [1, -1]) {
    const cheek = new Mesh(
      new SphereGeometry(0.03, detail === "high" ? 14 : 8, 10),
      material,
    );
    cheek.scale.set(1, 0.85, 0.55);
    cheek.position.set(0.055 * side, cy - 0.012, -0.075);
    group.add(cheek);
  }

  // Eyelid plane — the blink target (idle.ts scales it open/shut).
  const eyelids = new Mesh(new BoxGeometry(0.078, 0.012, 0.012), material);
  eyelids.name = "eyelids";
  eyelids.position.set(0, cy + 0.012, -0.094);
  eyelids.scale.y = 0.15;
  group.add(eyelids);

  // Ears.
  for (const side of [1, -1]) {
    const ear = new Mesh(
      new SphereGeometry(0.027, detail === "high" ? 12 : 8, 8),
      material,
    );
    ear.scale.set(0.35, 1, 0.75);
    ear.position.set(0.098 * side, cy - 0.004, 0.008);
    group.add(ear);

    // Earbuds — both ears, sitting just inside the ear's front edge.
    const bud = new Mesh(
      new SphereGeometry(0.0125, detail === "high" ? 10 : 6, 8),
      material,
    );
    bud.position.set(0.094 * side, cy - 0.006, -0.014);
    group.add(bud);
  }

  // Hoop earrings — both ears (gate-1.2 note; -X is the figure's left).
  for (const side of [1, -1]) {
    const hoop = new Mesh(
      new TorusGeometry(0.016, 0.0032, 6, detail === "high" ? 20 : 10),
      material,
    );
    hoop.name = "earring";
    hoop.position.set(0.102 * side, cy - 0.033, 0.008);
    hoop.rotation.y = Math.PI / 2; // hang in the sagittal plane
    group.add(hoop);
  }

  // Ear-canal stems for the buds (tiny, but they read in profile).
  for (const side of [1, -1]) {
    const stem = new Mesh(
      new CylinderGeometry(0.005, 0.005, 0.014, 6),
      material,
    );
    stem.rotation.z = Math.PI / 2;
    stem.position.set(0.1 * side, cy - 0.006, -0.014);
    group.add(stem);
  }

  return group;
}

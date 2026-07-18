// Beard builder (plan-0009 §1.1): a shaped volume with surface break-up,
// not strands (ADR-012 §3). A lower-hemisphere shell wrapped around the
// jaw, vertices displaced by deterministic value noise for the broken-clay
// read; plus a mustache bar bridging to the (absent) mouth.

import { BoxGeometry, Group, Mesh, SphereGeometry } from "three";
import type { BuilderOptions } from "./buildBody";
import { SKULL_CENTER } from "./buildHead";

/** Deterministic value noise from position — seed-stable, order-free. */
function surfaceNoise(x: number, y: number, z: number, seed: number): number {
  return (
    Math.sin(x * 61.7 + seed) *
    Math.sin(y * 53.3 + seed * 0.7) *
    Math.sin(z * 47.9 + seed * 1.3)
  );
}

export function buildBeard({ seed, detail, material }: BuilderOptions): Group {
  const group = new Group();
  group.name = "beard";
  const cy = SKULL_CENTER.y;

  // Jaw shell — lower part of a sphere, full-beard coverage ear to ear,
  // rounded below the chin like the concept sheets. Radius exceeds the
  // skull's (0.105) so the beard reads as its own volume, not skin-tight;
  // the x-scale below tucks the sides back in so ears/earrings stay clear.
  const shell = new SphereGeometry(
    0.112,
    detail === "high" ? 28 : 14,
    detail === "high" ? 20 : 10,
    0,
    Math.PI * 2,
    Math.PI * 0.42,
    Math.PI * 0.58,
  );

  // Sculpt the shell radially. The raw cap is a full-azimuth dome — left
  // as-is it forms a second face 24 mm in front of the skull, swallowing
  // the nose and mustache (the gate-1.2 "malformed face"). So: full radius
  // at chin/jaw/sides, but the FACE WINDOW (front-facing AND above the
  // mouth line) tucks smoothly below the skull surface. Clump noise is
  // outward-only (signed noise dug the "caved-in" pits), tapers off toward
  // the top edge so side clumps never swallow ears/earrings, and is
  // suppressed in the tucked zone so buried geometry stays smooth.
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
  const pos = shell.attributes.position;
  const amp = 0.014;
  const topY = 0.112 * Math.cos(Math.PI * 0.42); // shell top-edge height
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const len = Math.hypot(x, y, z);
    const dirY = y / len;
    const dirZ = z / len;
    // Face window: -Z is forward; "high" rises from the under-lip line up.
    // Steep ramps + a deep pull: a soft ramp left a skin-tight dark film
    // over the mid-face once the beard got its own material.
    const front = clamp01((-dirZ - 0.1) / 0.25);
    const high = clamp01((dirY + 0.62) / 0.18);
    const tuck = front * high;
    const n = surfaceNoise(x * 1.7, y * 1.7, z * 1.7, seed % 97);
    const taper = clamp01((topY - y) / 0.08);
    const clump = (0.5 + 0.5 * n) * amp * taper * (1 - tuck);
    // Extra mass on the front-lower arc so the chin silhouette reads.
    const chinBoost = front * clamp01((-dirY - 0.3) / 0.3) * 0.015;
    const r = len * (1 - 0.4 * tuck) + clump + chinBoost;
    pos.setXYZ(i, (x / len) * r, dirY * r, dirZ * r);
  }
  shell.computeVertexNormals();

  // Dropped low and pushed forward: ~24 mm proud of the skull at the chin
  // front and below the jaw; sides hug the (0.98-scaled) skull so the
  // ears/earrings stay clear even at full clump amplitude.
  const beard = new Mesh(shell, material);
  beard.position.set(0, cy - 0.03, -0.012);
  beard.scale.set(0.9, 0.9, 1.0);
  group.add(beard);

  // Mustache — proud of the tucked shell, just behind the nose tip; the
  // stronger tilt kicks its lower edge out over the (absent) mouth.
  const mustache = new Mesh(new BoxGeometry(0.058, 0.02, 0.03), material);
  mustache.position.set(0, cy - 0.046, -0.118);
  mustache.rotation.x = 0.28;
  group.add(mustache);

  return group;
}

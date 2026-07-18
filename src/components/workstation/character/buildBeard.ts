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

  // Surface break-up: displace OUTWARD only — signed noise dug pits below
  // the skull surface (gate-1.2 "caved-in" defect). Amplitude tapers to
  // zero toward the top edge so side clumps never swallow ears/earrings;
  // full clumping stays at the chin and jawline.
  const pos = shell.attributes.position;
  const nor = shell.attributes.normal;
  const amp = 0.012;
  const topY = 0.112 * Math.cos(Math.PI * 0.42); // shell top-edge height
  for (let i = 0; i < pos.count; i++) {
    const n = surfaceNoise(pos.getX(i), pos.getY(i), pos.getZ(i), seed % 97);
    const taper = Math.min(1, Math.max(0, (topY - pos.getY(i)) / 0.08));
    const d = (0.5 + 0.5 * n) * amp * taper;
    pos.setXYZ(
      i,
      pos.getX(i) + nor.getX(i) * d,
      pos.getY(i) + nor.getY(i) * d,
      pos.getZ(i) + nor.getZ(i) * d,
    );
  }
  shell.computeVertexNormals();

  // Dropped low and pushed forward: ~24 mm proud of the skull at the chin
  // front and below the jaw; sides hug the (0.98-scaled) skull so the
  // ears/earrings stay clear even at full clump amplitude.
  const beard = new Mesh(shell, material);
  beard.position.set(0, cy - 0.03, -0.012);
  beard.scale.set(0.9, 0.9, 1.0);
  group.add(beard);

  // Mustache — proud of the beard's front face, just behind the nose tip.
  const mustache = new Mesh(new BoxGeometry(0.06, 0.02, 0.026), material);
  mustache.position.set(0, cy - 0.048, -0.114);
  mustache.rotation.x = 0.15;
  group.add(mustache);

  return group;
}

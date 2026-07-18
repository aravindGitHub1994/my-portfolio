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
  // rounded below the chin like the concept sheets.
  const shell = new SphereGeometry(
    0.102,
    detail === "high" ? 28 : 14,
    detail === "high" ? 20 : 10,
    0,
    Math.PI * 2,
    Math.PI * 0.42,
    Math.PI * 0.58,
  );

  // Surface break-up: displace along the vertex normal.
  const pos = shell.attributes.position;
  const nor = shell.attributes.normal;
  const amp = 0.0075;
  for (let i = 0; i < pos.count; i++) {
    const n = surfaceNoise(pos.getX(i), pos.getY(i), pos.getZ(i), seed % 97);
    pos.setXYZ(
      i,
      pos.getX(i) + nor.getX(i) * n * amp,
      pos.getY(i) + nor.getY(i) * n * amp,
      pos.getZ(i) + nor.getZ(i) * n * amp,
    );
  }
  shell.computeVertexNormals();

  const beard = new Mesh(shell, material);
  beard.position.set(0, cy - 0.028, -0.012);
  beard.scale.set(0.92, 0.95, 0.98);
  group.add(beard);

  // Mustache — small bar above the beard line; no mouth detail beneath.
  const mustache = new Mesh(new BoxGeometry(0.052, 0.016, 0.022), material);
  mustache.position.set(0, cy - 0.045, -0.098);
  mustache.rotation.x = 0.15;
  group.add(mustache);

  return group;
}

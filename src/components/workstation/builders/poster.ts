// Wall poster (plan-0009 §2.1): period pastiche print — canvas-drawn, no
// Microsoft marks (ADR-012 §10) — with pin dots. Local origin at the
// poster centre, facing +Z; mount proud of the back wall.

import { CylinderGeometry, Group, Mesh, PlaneGeometry } from "three";
import type { RoomBuilderOptions } from "./materials";

export function buildPoster({ detail, materials }: RoomBuilderOptions): Group {
  const group = new Group();
  group.name = "poster";

  const sheet = new Mesh(new PlaneGeometry(0.46, 0.6), materials.poster);
  group.add(sheet);

  const segs = detail === "high" ? 10 : 6;
  for (const [x, y] of [
    [-0.21, 0.28],
    [0.21, 0.28],
    [-0.21, -0.28],
    [0.21, -0.28],
  ]) {
    const pin = new Mesh(new CylinderGeometry(0.006, 0.006, 0.008, segs), materials.metal);
    pin.rotation.x = Math.PI / 2;
    pin.position.set(x, y, 0.004);
    group.add(pin);
  }

  return group;
}

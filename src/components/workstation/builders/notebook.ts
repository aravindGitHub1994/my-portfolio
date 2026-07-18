// Notebook + pen (plan-0009 §2.1): flat pad with the ruled to-do page on
// top, pen laid diagonally. Local origin at desk level under the pad.

import { BoxGeometry, ConeGeometry, CylinderGeometry, Group, Mesh } from "three";
import type { RoomBuilderOptions } from "./materials";

export function buildNotebook({ detail, materials }: RoomBuilderOptions): Group {
  const group = new Group();
  group.name = "notebook";

  // Pad: paper page on +Y, cardboard everywhere else.
  const pad = new Mesh(new BoxGeometry(0.2, 0.01, 0.15), [
    materials.cardboard,
    materials.cardboard,
    materials.paper,
    materials.cardboard,
    materials.cardboard,
    materials.cardboard,
  ]);
  pad.position.y = 0.005;
  group.add(pad);

  // Spiral binding suggestion: a thin dark bar along the top edge.
  const spine = new Mesh(new BoxGeometry(0.2, 0.012, 0.014), materials.plasticDark);
  spine.position.set(0, 0.006, -0.068);
  group.add(spine);

  const segs = detail === "high" ? 10 : 6;
  const pen = new Group();
  const barrel = new Mesh(new CylinderGeometry(0.0038, 0.0038, 0.125, segs), materials.plasticDark);
  const tip = new Mesh(new ConeGeometry(0.0038, 0.014, segs), materials.metal);
  tip.position.y = -0.0695;
  tip.rotation.x = Math.PI;
  pen.add(barrel, tip);
  pen.rotation.set(Math.PI / 2, 0, 0.9);
  pen.position.set(0.045, 0.016, 0.02);
  group.add(pen);

  return group;
}

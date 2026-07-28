// Cables (plan-0009 §2.1): lathed tubes along fixed CatmullRom curves —
// no physics. WORLD-anchored (they connect props laid out by the scene);
// endpoints follow the RoomScene layout constants.

import { CatmullRomCurve3, Group, Mesh, TubeGeometry, Vector3 } from "three";
import type { RoomBuilderOptions } from "./materials";

const RUNS: Vector3[][] = [
  // Keyboard → over the desk rear edge → tower back.
  [
    new Vector3(0.02, 0.735, -0.49),
    new Vector3(0.0, 0.73, -0.78),
    new Vector3(-0.05, 0.74, -0.95),
    new Vector3(-0.12, 0.68, -0.99),
  ],
  // Mouse → rear edge.
  [
    new Vector3(0.42, 0.725, -0.5),
    new Vector3(0.35, 0.73, -0.8),
    new Vector3(0.22, 0.74, -0.97),
    new Vector3(0.12, 0.66, -1.0),
  ],
  // CRT power → down the back to the floor.
  [
    new Vector3(-0.25, 1.0, -0.9),
    new Vector3(-0.3, 0.7, -0.99),
    new Vector3(-0.34, 0.3, -1.01),
    new Vector3(-0.42, 0.015, -0.98),
  ],
  // Speaker → tower back.
  [
    new Vector3(0.1, 0.76, -0.86),
    new Vector3(0.03, 0.72, -0.96),
    new Vector3(-0.06, 0.6, -1.0),
  ],
];

export function buildCables({ detail, materials }: RoomBuilderOptions): Group {
  const group = new Group();
  group.name = "cables";
  const tubular = detail === "high" ? 28 : 14;
  const radial = detail === "high" ? 6 : 4;

  for (const points of RUNS) {
    const curve = new CatmullRomCurve3(points);
    const tube = new Mesh(
      new TubeGeometry(curve, tubular, 0.0045, radial, false),
      materials.rubber,
    );
    group.add(tube);
  }

  return group;
}

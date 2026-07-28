// Desktop case (plan-0009 §2.1): horizontal tower the CRT sits on. Local
// origin at the bottom centre; front (drive bays) faces +Z.

import { BoxGeometry, Group, Mesh } from "three";
import type { RoomBuilderOptions } from "./materials";

export const TOWER_SIZE = { width: 0.46, height: 0.15, depth: 0.4 } as const;

export function buildTower({ materials }: RoomBuilderOptions): Group {
  const group = new Group();
  group.name = "tower";
  const { width, height, depth } = TOWER_SIZE;

  const caseBox = new Mesh(new BoxGeometry(width, height, depth), materials.plastic);
  caseBox.position.y = height / 2 + 0.008;
  group.add(caseBox);

  // Feet.
  for (const sx of [1, -1]) {
    for (const sz of [1, -1]) {
      const foot = new Mesh(new BoxGeometry(0.03, 0.016, 0.03), materials.rubber);
      foot.position.set(sx * (width / 2 - 0.05), 0.008, sz * (depth / 2 - 0.05));
      group.add(foot);
    }
  }

  const frontZ = depth / 2 + 0.002;
  // Drive bays: 3.5" floppy + a blanked 5.25" bay.
  const floppyBay = new Mesh(new BoxGeometry(0.1, 0.014, 0.006), materials.plasticDark);
  floppyBay.position.set(0.1, height * 0.72, frontZ);
  const bigBay = new Mesh(new BoxGeometry(0.15, 0.04, 0.004), materials.cardboard);
  bigBay.position.set(-0.09, height * 0.68, frontZ);
  group.add(floppyBay, bigBay);

  // Power button + badge.
  const power = new Mesh(new BoxGeometry(0.03, 0.03, 0.01), materials.plasticDark);
  power.position.set(0.17, height * 0.38, frontZ);
  const badge = new Mesh(new BoxGeometry(0.035, 0.018, 0.003), materials.metal);
  badge.position.set(-0.17, height * 0.32, frontZ);
  group.add(power, badge);

  return group;
}

// Desk (plan-0009 §2.1): chunky wooden table. Local origin at floor level
// under the desk centre; the top surface lands at DESK_TOP_Y.

import { BoxGeometry, Group, Mesh } from "three";
import type { RoomBuilderOptions } from "./materials";

export const DESK_TOP_Y = 0.72;
export const DESK_SIZE = { width: 1.7, depth: 0.75 } as const;

export function buildDesk({ materials }: RoomBuilderOptions): Group {
  const group = new Group();
  group.name = "desk";
  const { width, depth } = DESK_SIZE;
  const topThickness = 0.04;

  const top = new Mesh(
    new BoxGeometry(width, topThickness, depth),
    materials.wood,
  );
  top.position.y = DESK_TOP_Y - topThickness / 2;
  group.add(top);

  const legHeight = DESK_TOP_Y - topThickness;
  for (const sx of [1, -1]) {
    for (const sz of [1, -1]) {
      const leg = new Mesh(new BoxGeometry(0.06, legHeight, 0.06), materials.wood);
      leg.position.set(
        sx * (width / 2 - 0.08),
        legHeight / 2,
        sz * (depth / 2 - 0.07),
      );
      group.add(leg);
    }
  }

  // Modesty panel across the back.
  const panel = new Mesh(new BoxGeometry(width - 0.2, 0.34, 0.02), materials.wood);
  panel.position.set(0, DESK_TOP_Y - 0.24, -(depth / 2 - 0.09));
  group.add(panel);

  return group;
}

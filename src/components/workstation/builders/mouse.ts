// Ball mouse (plan-0009 §2.1): squashed sphere shell + button seam.
// Local origin at desk level under the mouse centre; cable exits -Z.

import { BoxGeometry, Group, Mesh, SphereGeometry } from "three";
import type { RoomBuilderOptions } from "./materials";

export function buildMouse({ detail, materials }: RoomBuilderOptions): Group {
  const group = new Group();
  group.name = "mouse";

  const shell = new Mesh(
    new SphereGeometry(0.032, detail === "high" ? 18 : 10, detail === "high" ? 14 : 8),
    materials.plastic,
  );
  shell.scale.set(1, 0.62, 1.5);
  shell.position.y = 0.012;
  group.add(shell);

  // Button seam.
  const seam = new Mesh(new BoxGeometry(0.002, 0.012, 0.032), materials.plasticDark);
  seam.position.set(0, 0.028, -0.028);
  group.add(seam);

  return group;
}

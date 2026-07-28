// "Ctrl Alt Del" mug (plan-0009 §2.1). Local origin at the bottom centre.
// The wrap texture centres the text opposite the UV seam; rotate the group
// so it faces the room.

import { CylinderGeometry, Group, Mesh, TorusGeometry } from "three";
import type { RoomBuilderOptions } from "./materials";

export function buildMug({ detail, materials }: RoomBuilderOptions): Group {
  const group = new Group();
  group.name = "mug";
  const segs = detail === "high" ? 24 : 12;

  const body = new Mesh(
    new CylinderGeometry(0.041, 0.038, 0.098, segs),
    materials.mug,
  );
  body.position.y = 0.049;
  group.add(body);

  // Inner coffee surface.
  const coffee = new Mesh(
    new CylinderGeometry(0.036, 0.036, 0.004, segs),
    materials.rubber,
  );
  coffee.position.y = 0.088;
  group.add(coffee);

  const handle = new Mesh(
    new TorusGeometry(0.026, 0.0065, 8, segs, Math.PI),
    materials.cardboard,
  );
  handle.position.set(0.041, 0.05, 0);
  handle.rotation.z = -Math.PI / 2;
  group.add(handle);

  return group;
}

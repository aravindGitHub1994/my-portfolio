// Office chair (plan-0009 §2.1): padded seat + backrest on a column with
// a four-leg base. Local origin at the floor under the column; the
// backrest sits at +Z (the figure faces -Z).

import { BoxGeometry, CylinderGeometry, Group, Mesh } from "three";
import type { RoomBuilderOptions } from "./materials";

export function buildChair({ detail, materials }: RoomBuilderOptions): Group {
  const group = new Group();
  group.name = "chair";
  const segs = detail === "high" ? 16 : 8;

  // Heights sized to the figure's seated pose (hips at ~0.48).
  const column = new Mesh(
    new CylinderGeometry(0.025, 0.03, 0.36, segs),
    materials.metal,
  );
  column.position.y = 0.21;
  group.add(column);

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const leg = new Mesh(new BoxGeometry(0.24, 0.025, 0.045), materials.metal);
    leg.rotation.y = angle;
    leg.position.set(Math.cos(angle) * 0.12, 0.03, -Math.sin(angle) * 0.12);
    group.add(leg);
  }

  const seat = new Mesh(
    new CylinderGeometry(0.21, 0.19, 0.06, detail === "high" ? 22 : 12),
    materials.rubber,
  );
  seat.position.y = 0.43;
  group.add(seat);

  const backPost = new Mesh(new BoxGeometry(0.05, 0.3, 0.02), materials.metal);
  backPost.position.set(0, 0.55, 0.2);
  backPost.rotation.x = 0.12;
  group.add(backPost);

  const backrest = new Mesh(new BoxGeometry(0.36, 0.3, 0.05), materials.rubber);
  backrest.position.set(0, 0.72, 0.23);
  backrest.rotation.x = 0.12;
  group.add(backrest);

  return group;
}

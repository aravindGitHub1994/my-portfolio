// CD jewel-case stack (plan-0009 §2.1): spines labeled with the resume's
// certifications (cheap 8.x setup). Local origin at desk level under the
// stack; spines face +Z. Seeded rotation scatter per case.

import { BoxGeometry, Group, Mesh } from "three";
import { mulberry32 } from "@/lib/prng";
import type { RoomBuilderOptions } from "./materials";

export function buildCdStack({ seed, materials }: RoomBuilderOptions): Group {
  const group = new Group();
  group.name = "cdStack";
  const rnd = mulberry32(seed ^ 0x43445354);
  const caseH = 0.0105;

  materials.cdSpines.forEach((spine, i) => {
    const jewel = new Mesh(new BoxGeometry(0.142, caseH, 0.125), [
      materials.cdCase,
      materials.cdCase,
      materials.cdCase,
      materials.cdCase,
      spine, // +Z face = labeled spine toward the room
      materials.cdCase,
    ]);
    jewel.position.set(
      (rnd() - 0.5) * 0.01,
      caseH / 2 + i * (caseH + 0.0006),
      (rnd() - 0.5) * 0.008,
    );
    jewel.rotation.y = (rnd() - 0.5) * 0.22;
    group.add(jewel);
  });

  return group;
}

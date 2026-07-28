// Keyboard (plan-0009 §2.1): beige slab + instanced keycaps with seeded
// wobble. Local origin under the slab centre; the user edge faces +Z,
// slight riser tilt at the back.

import { BoxGeometry, Group, InstancedMesh, Mesh, Object3D } from "three";
import { mulberry32 } from "@/lib/prng";
import type { RoomBuilderOptions } from "./materials";

export function buildKeyboard({ seed, materials }: RoomBuilderOptions): Group {
  const group = new Group();
  group.name = "keyboard";
  const rnd = mulberry32(seed ^ 0x4b455953);

  const slab = new Mesh(new BoxGeometry(0.37, 0.02, 0.14), materials.plastic);
  slab.position.y = 0.014;
  group.add(slab);

  // Keycaps: 5 rows; the last row leaves room for the spacebar.
  const rows = 5;
  const cols = 19;
  const capSize = 0.0155;
  const pitch = 0.0182;
  const counts = [cols, cols, cols, cols, 10];
  const total = counts.reduce((a, b) => a + b, 0);
  const caps = new InstancedMesh(
    new BoxGeometry(capSize, 0.008, capSize),
    materials.cardboard,
    total,
  );
  const dummy = new Object3D();
  let index = 0;
  for (let row = 0; row < rows; row++) {
    const z = -0.052 + row * 0.0225;
    for (let col = 0; col < counts[row]; col++) {
      const x = -((counts[row] - 1) * pitch) / 2 + col * pitch;
      dummy.position.set(
        x + (rnd() - 0.5) * 0.0012,
        0.028,
        z + (rnd() - 0.5) * 0.0012,
      );
      dummy.rotation.set(0, (rnd() - 0.5) * 0.05, 0);
      dummy.updateMatrix();
      caps.setMatrixAt(index++, dummy.matrix);
    }
  }
  caps.instanceMatrix.needsUpdate = true;
  group.add(caps);

  // Spacebar.
  const spacebar = new Mesh(
    new BoxGeometry(0.11, 0.008, capSize),
    materials.cardboard,
  );
  spacebar.position.set(0, 0.028, 0.038);
  group.add(spacebar);

  // Back riser tilt for the whole board.
  group.rotation.x = 0.07;
  return group;
}

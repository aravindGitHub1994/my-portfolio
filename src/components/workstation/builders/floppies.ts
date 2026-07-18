// Floppy disk pile (plan-0009 §2.1): three 3.5" disks, seeded scatter,
// white label patches (no text). Local origin at surface level.

import { BoxGeometry, Group, Mesh } from "three";
import { mulberry32 } from "@/lib/prng";
import type { RoomBuilderOptions } from "./materials";

export function buildFloppies({ seed, materials }: RoomBuilderOptions): Group {
  const group = new Group();
  group.name = "floppies";
  const rnd = mulberry32(seed ^ 0x464c4f50);
  const h = 0.0034;

  for (let i = 0; i < 3; i++) {
    const disk = new Group();
    const body = new Mesh(new BoxGeometry(0.09, h, 0.093), materials.plasticDark);
    const label = new Mesh(new BoxGeometry(0.06, 0.0006, 0.05), materials.cardboard);
    label.position.set(0, h / 2 + 0.0003, 0.012);
    const shutter = new Mesh(new BoxGeometry(0.028, 0.0006, 0.018), materials.metal);
    shutter.position.set(0.008, h / 2 + 0.0003, -0.032);
    disk.add(body, label, shutter);
    disk.position.set((rnd() - 0.5) * 0.02, h / 2 + i * (h + 0.0004), (rnd() - 0.5) * 0.02);
    disk.rotation.y = (rnd() - 0.5) * 0.5;
    group.add(disk);
  }

  return group;
}

// Single desk speaker (plan-0009 §2.1): box + grille circles. Local origin
// at the bottom centre; grille faces +Z.

import { BoxGeometry, CircleGeometry, Group, Mesh } from "three";
import type { RoomBuilderOptions } from "./materials";

export function buildSpeaker({ detail, materials }: RoomBuilderOptions): Group {
  const group = new Group();
  group.name = "speaker";
  const segs = detail === "high" ? 24 : 12;

  const cab = new Mesh(new BoxGeometry(0.13, 0.2, 0.13), materials.plastic);
  cab.position.y = 0.1;
  group.add(cab);

  const woofer = new Mesh(new CircleGeometry(0.045, segs), materials.rubber);
  woofer.position.set(0, 0.075, 0.0662);
  const tweeter = new Mesh(new CircleGeometry(0.018, segs), materials.rubber);
  tweeter.position.set(0, 0.155, 0.0662);
  group.add(woofer, tweeter);

  const volume = new Mesh(new BoxGeometry(0.018, 0.018, 0.008), materials.plasticDark);
  volume.position.set(0.04, 0.155, 0.0662);
  group.add(volume);

  return group;
}

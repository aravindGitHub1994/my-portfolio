// Desktop case (plan-0009 §2.1): horizontal tower the CRT sits on. Local
// origin at the bottom centre; front (drive bays) faces +Z.

import { BoxGeometry, Group, Mesh } from "three";
import type { RoomBuilderOptions } from "./materials";

export const TOWER_SIZE = { width: 0.46, height: 0.15, depth: 0.4 } as const;

/** Power button centre in tower-local space. Exported because the opening
 *  is composed around this one point (ADR-013 §2/§3): the DOM hotspot
 *  projects it and 2.3's press depresses the mesh named `towerPower`. At
 *  the room's tower placement this is world (-0.05, 0.777, -0.518), which
 *  is the figure's reach target too.
 *
 *  ADR-014 §1 retired the macro that used to frame it — chapter 0 is now a
 *  wide from behind-right, so this button reads a tenth of the size it did.
 *  What the wide added is a constraint: the sight line to it must clear the
 *  figure, because `PowerButtonAnchor` has no depth test. See
 *  `cameraPath.ts`'s `p: 0` key. */
export const POWER_BUTTON_LOCAL = {
  x: 0.17,
  y: TOWER_SIZE.height * 0.38,
  z: TOWER_SIZE.depth / 2 + 0.002,
} as const;

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
  power.name = "towerPower";
  power.position.set(
    POWER_BUTTON_LOCAL.x,
    POWER_BUTTON_LOCAL.y,
    POWER_BUTTON_LOCAL.z,
  );
  const badge = new Mesh(new BoxGeometry(0.035, 0.018, 0.003), materials.metal);
  badge.position.set(-0.17, height * 0.32, frontZ);

  // Power LED, beside the button (2.3). The tower had none at all, and the
  // dark-to-green pop is the payoff of the visitor's one gesture. ADR-014
  // §1 moved the camera a long way back, so that pop is now a few pixels
  // rather than a frame-filling event — which is exactly why it is over
  // Bloom's 0.68 threshold at full: in a dark room the bloom is what
  // carries it at this distance. Dark until `TowerPower` ramps
  // `materials.led`.
  const led = new Mesh(new BoxGeometry(0.008, 0.005, 0.004), materials.led);
  led.name = "towerLed";
  led.position.set(POWER_BUTTON_LOCAL.x - 0.035, POWER_BUTTON_LOCAL.y, frontZ);

  group.add(power, badge, led);

  return group;
}

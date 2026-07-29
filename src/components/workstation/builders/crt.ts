// CRT monitor (plan-0009 §2.1): stepped retro housing on a swivel base.
// The screen is its own mesh + material slot (named "crtScreen") — slice
// 3.1 targets it. Local origin at the bottom of the swivel base; the front
// (screen) faces +Z, toward the seated figure.

import { BoxGeometry, CylinderGeometry, Group, Mesh, PlaneGeometry } from "three";
import type { RoomBuilderOptions } from "./materials";

/** Screen mesh dimensions — 4.2's dock alignment maps the DOM shell
 *  onto exactly this quad. */
export const CRT_SCREEN_SIZE = { width: 0.305, height: 0.24 } as const;

export function buildCrt({ detail, materials }: RoomBuilderOptions): Group {
  const group = new Group();
  group.name = "crt";

  // Swivel base.
  const base = new Mesh(
    new CylinderGeometry(0.14, 0.16, 0.035, detail === "high" ? 20 : 10),
    materials.plastic,
  );
  base.position.y = 0.0175;
  group.add(base);

  const bodyY = 0.035 + 0.17; // base height + half bezel height

  // Front bezel block.
  const bezel = new Mesh(new BoxGeometry(0.4, 0.34, 0.1), materials.plastic);
  bezel.position.set(0, bodyY, 0.08);
  group.add(bezel);

  // Stepped rear housing (the classic deep CRT butt).
  const mid = new Mesh(new BoxGeometry(0.34, 0.29, 0.16), materials.plastic);
  mid.position.set(0, bodyY, -0.05);
  const tail = new Mesh(new BoxGeometry(0.26, 0.22, 0.1), materials.plastic);
  tail.position.set(0, bodyY + 0.005, -0.17);
  group.add(mid, tail);

  // Screen — distinct mesh and material slot for 3.1.
  const screen = new Mesh(
    new PlaneGeometry(CRT_SCREEN_SIZE.width, CRT_SCREEN_SIZE.height),
    materials.screen,
  );
  screen.name = "crtScreen";
  screen.position.set(0, bodyY + 0.012, 0.131);
  group.add(screen);

  // Control strip: two buttons + power LED.
  for (let i = 0; i < 2; i++) {
    const button = new Mesh(
      new BoxGeometry(0.022, 0.012, 0.008),
      materials.plasticDark,
    );
    button.position.set(-0.12 + i * 0.04, bodyY - 0.145, 0.131);
    group.add(button);
  }
  // The monitor's power LED. It was `materials.metal` and had never lit —
  // a grey dot beside a glowing tube, which chapter 1's close-up sits
  // right on. It now shares the tower LED's material and therefore its
  // state: one machine, one lamp colour, lit from win98State's phase.
  const led = new Mesh(new BoxGeometry(0.008, 0.008, 0.006), materials.led);
  led.name = "crtLed";
  led.position.set(0.15, bodyY - 0.145, 0.131);
  group.add(led);

  return group;
}

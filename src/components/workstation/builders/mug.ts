// "Ctrl Alt Del" mug (plan-0009 §2.1). Local origin at the bottom centre.
// The wrap texture centres the text opposite the UV seam; rotate the group
// so it faces the room.
//
// **The mug used to be sealed, and that was geometry, not material**
// (ADR-014 §7 — recorded because HANDOFF.md and gate 10.1 §3.6 both guessed
// otherwise, and the wrong guess sends the fix into `materials.ts`).
// `CylinderGeometry` leaves `openEnded` at `false` unless told, so the body
// carried a solid cap at local y 0.098 wearing `materials.mug` — a
// near-white `#ece8e0` disc 8 mm above a coffee surface nobody could ever
// see. The owner's "the steam comes out of a white top surface of the mug"
// was a literal description of it.
//
// So the body is open now, the material is `DoubleSide` so the far inner
// wall reads when you look in, and a thin rim gives the lip some substance
// — an open cylinder has no wall thickness, and without the rim the edge is
// infinitely sharp.
//
// **`Steam.tsx` quotes SURFACE_Y and SURFACE_R from here in a hand-written
// comment.** It is the only coupling between the two files, there is no
// test on it, and the two must move together. They are exported for that
// reason: quoting a number is what let the old ones drift into emitting
// *inside* a sealed mug.

import { CylinderGeometry, Group, Mesh, TorusGeometry } from "three";
import type { RoomBuilderOptions } from "./materials";

const BODY_BOTTOM_R = 0.038;
const BODY_TOP_R = 0.041;
const BODY_H = 0.098;

/** The body tapers, so anything sitting inside it has to know the wall's
 *  radius at its own height rather than assume one. */
const wallRadiusAt = (y: number) =>
  BODY_BOTTOM_R + (BODY_TOP_R - BODY_BOTTOM_R) * (y / BODY_H);

const COFFEE_H = 0.004;
/** Filled to 6 mm below the lip. Up from a surface at 0.090, which was set
 *  when nothing could see it. */
export const COFFEE_SURFACE_Y = 0.092;
/** Flush to the wall, less a fifth of a millimetre so the disc's edge never
 *  pokes through it. The old 0.036 left a 4.8 mm ring of gap that read as a
 *  badly fitted lid the moment the mug was opened. */
const COFFEE_R = wallRadiusAt(COFFEE_SURFACE_Y) - 0.0002;

/** Rim: a thin torus on the lip. */
const RIM_TUBE = 0.0015;

/** Where `Steam.tsx` must emit from — a hair above the liquid, and inside
 *  it, so wisps clear the surface without clipping the wall on the way up.
 *  Imported there rather than retyped (ADR-014 §7). */
export const STEAM_SURFACE_Y = COFFEE_SURFACE_Y + 0.002;
export const STEAM_SURFACE_R = COFFEE_R * 0.75;

export function buildMug({ detail, materials }: RoomBuilderOptions): Group {
  const group = new Group();
  group.name = "mug";
  const segs = detail === "high" ? 24 : 12;

  // Open-ended: the cap is what sealed it. `materials.mug` is DoubleSide,
  // so this one surface is both the outside and the inside of the wall.
  const body = new Mesh(
    new CylinderGeometry(BODY_TOP_R, BODY_BOTTOM_R, BODY_H, segs, 1, true),
    materials.mug,
  );
  body.position.y = BODY_H / 2;
  group.add(body);

  // The lip. Without it the open cylinder's edge has no thickness at all.
  const rim = new Mesh(
    new TorusGeometry(BODY_TOP_R - RIM_TUBE, RIM_TUBE, 6, segs),
    materials.mug,
  );
  rim.position.y = BODY_H;
  rim.rotation.x = Math.PI / 2;
  group.add(rim);

  // The coffee. Its own slot — `materials.rubber` at roughness 0.95 reads
  // as black rubber once it is actually visible, and it is shared with the
  // cables, the chair and the tower feet, so it cannot be retuned in place
  // (ADR-014 §7).
  const coffee = new Mesh(
    new CylinderGeometry(COFFEE_R, COFFEE_R, COFFEE_H, segs),
    materials.coffee,
  );
  coffee.name = "coffee";
  coffee.position.y = COFFEE_SURFACE_Y - COFFEE_H / 2;
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

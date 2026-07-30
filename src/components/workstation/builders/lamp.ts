// Corner lamp (plan-0011 §4.2, ADR-014 §5) — a tall floor lamp in the
// back-left corner, replacing the dust motes the owner asked to remove:
// *"need to remove dust and replace with a tall lamp in the corner"*
// (gate 10.1 §2.6).
//
// Built on `catTree.ts`'s pattern, the only other tall floor-standing
// object here: weighted base, slim post, a shade, and — new — an emissive
// bulb. Local origin at floor level under the post.
//
// **The corner decides where this stands, so the corner is imported rather
// than retyped.** Back-left is the one corner of the three built walls that
// nothing occupies, and it is the corner `Lighting`'s `bounce` directional
// exists to keep from clipping to black. Both walls carry baseboards, so
// the base has to stand off the trim while the shade — which is wider, and
// well above it — only has to clear the wall itself. `LAMP_X`/`LAMP_Z` take
// whichever of those two constraints binds, so resizing the shade or the
// base cannot silently push either through something.
//
// **The light is NOT here.** No builder in this codebase returns a light,
// and the lamp has to ride `duskDeepen` alongside `ambient`, `shaft` and
// `bounce` — which lives in `Lighting.tsx`. This module owns the shape and
// publishes where the bulb is; `Lighting` owns how bright it is.

import { CylinderGeometry, Group, Mesh, SphereGeometry } from "three";
import type { RoomBuilderOptions } from "./materials";
import { BASEBOARD, ROOM } from "./room";

const BASE_R = 0.13;
const BASE_H = 0.03;
const POST_R = 0.014;
/** Shade: a truncated cone, open at both ends so the bulb reads through it. */
const SHADE_BOTTOM_R = 0.155;
const SHADE_TOP_R = 0.1;
const SHADE_H = 0.24;
/** Top of the shade. A floor lamp, taller than the cat tree's perch
 *  (~1.05 m) and well under the 2.55 m ceiling. */
const TOP_Y = 1.55;
const SHADE_BOTTOM_Y = TOP_Y - SHADE_H;
/** The bulb sits inside the shade, a little above its mouth. */
const BULB_R = 0.035;
const BULB_Y = SHADE_BOTTOM_Y + SHADE_H * 0.45;

/** Gap between the base and the baseboard's face, and between the shade
 *  and the bare wall above it. */
const CLEARANCE = 0.02;

/** Distance the lamp's centre must stand off a wall plane: the base has a
 *  baseboard in its way, the shade only has the wall — whichever needs
 *  more, wins. */
const STANDOFF = Math.max(
  BASEBOARD.proud + CLEARANCE + BASE_R,
  CLEARANCE + SHADE_BOTTOM_R,
);

export const LAMP_X = ROOM.leftX + STANDOFF;
export const LAMP_Z = ROOM.backZ + STANDOFF;

/** The bulb in world space. Exported because `Lighting.tsx` puts the actual
 *  point light here and must not retype it — the shape and the light have
 *  to move together or the room lights from a lamp that is not there. */
export const LAMP_LIGHT_POSITION: [number, number, number] = [
  LAMP_X,
  BULB_Y,
  LAMP_Z,
];

export function buildLamp({ detail, materials }: RoomBuilderOptions): Group {
  const group = new Group();
  group.name = "lamp";
  const segs = detail === "high" ? 16 : 9;

  const base = new Mesh(
    new CylinderGeometry(BASE_R, BASE_R, BASE_H, segs),
    materials.plasticDark,
  );
  base.position.y = BASE_H / 2;
  group.add(base);

  const post = new Mesh(
    new CylinderGeometry(POST_R, POST_R, SHADE_BOTTOM_Y - BASE_H, segs),
    materials.metal,
  );
  post.position.y = BASE_H + (SHADE_BOTTOM_Y - BASE_H) / 2;
  group.add(post);

  // Open-ended, and the material is DoubleSide: a closed cone would hide
  // the bulb entirely and the lamp would read as an unlit ornament from
  // every camera in the film.
  const shade = new Mesh(
    new CylinderGeometry(SHADE_TOP_R, SHADE_BOTTOM_R, SHADE_H, segs, 1, true),
    materials.lampShade,
  );
  shade.name = "lampShade";
  shade.position.y = SHADE_BOTTOM_Y + SHADE_H / 2;
  group.add(shade);

  const bulb = new Mesh(
    new SphereGeometry(BULB_R, segs, Math.max(6, segs / 2)),
    materials.lampBulb,
  );
  bulb.name = "lampBulb";
  bulb.position.y = BULB_Y;
  group.add(bulb);

  return group;
}

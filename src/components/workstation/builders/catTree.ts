// Cat tree (plan-0010 §5.1, ADR-013 §8) — a carpeted post against the +X
// wall beside the window, its top platform at sill height so the cats on it
// are looking out of the glass rather than at a wall.
//
// Matched to the reference photograph: navy fleece platforms, a sisal-wrapped
// post, a weighted base. Local origin at floor level under the post.
//
// **The sill decides where this stands, so the sill is imported rather than
// retyped.** The top platform lands level with the window ledge and has to
// stop short of it in x — a platform reaching under the sill either
// intersects it or looks like it is growing out of the wall. Both numbers
// come from `room.ts`, so moving the window moves the tree.

import { CylinderGeometry, Group, Mesh } from "three";
import type { RoomBuilderOptions } from "./materials";
import { WINDOW } from "./room";

/** Post radius, inside the sisal wrap. */
const POST_R = 0.045;
const PLATFORM_R = 0.26;
const PLATFORM_H = 0.035;
const BASE_R = 0.3;
const BASE_H = 0.04;
/** Gap left between the top platform's edge and the sill's inner edge. */
const SILL_CLEARANCE = 0.02;

/**
 * The three platforms, offset from the post so they stagger up instead of
 * stacking concentrically — a pole with three discs centred on it is a hat
 * stand. `dx` is toward the wall, so the largest `dx` is what decides how
 * far off the wall the whole tree has to stand.
 */
const PLATFORMS = [
  { y: 0.34, dx: -0.1, dz: 0.09 },
  { y: 0.64, dx: -0.04, dz: -0.11 },
  // The perch: level with the ledge and the closest thing to the glass.
  { y: WINDOW.sillTopY, dx: 0.06, dz: 0 },
] as const;

/** How far the post stands off the +X wall. Derived from whichever platform
 *  reaches furthest toward it, so editing the table above cannot silently
 *  push a disc through the window ledge. */
export const CAT_TREE_X =
  WINDOW.sillInnerX -
  Math.max(...PLATFORMS.map((p) => p.dx)) -
  PLATFORM_R -
  SILL_CLEARANCE;

/** Where a cat sits, in world space — the surface of each platform. The
 *  tree owns this so `RoomScene` never has to know how it is built.
 *  Ordered bottom to top; the perch is last. */
export const CAT_PERCHES = PLATFORMS.map((p) => ({
  x: CAT_TREE_X + p.dx,
  y: p.y + PLATFORM_H / 2,
  z: WINDOW.z + p.dz,
}));

export function buildCatTree({ detail, materials }: RoomBuilderOptions): Group {
  const group = new Group();
  group.name = "catTree";
  const segs = detail === "high" ? 14 : 8;

  const base = new Mesh(
    new CylinderGeometry(BASE_R, BASE_R, BASE_H, segs),
    materials.fleece,
  );
  base.position.y = BASE_H / 2;
  group.add(base);

  const topY = PLATFORMS[PLATFORMS.length - 1].y;

  // The post, sisal above the base. One cylinder rather than a stack of
  // wrapped rings: at chapter-3 distance the rope reads as a colour, and
  // the rings would cost more triangles than either cat.
  const post = new Mesh(
    new CylinderGeometry(POST_R, POST_R, topY - BASE_H, segs),
    materials.sisal,
  );
  post.position.y = BASE_H + (topY - BASE_H) / 2;
  group.add(post);

  PLATFORMS.forEach((p, i) => {
    const platform = new Mesh(
      new CylinderGeometry(PLATFORM_R, PLATFORM_R, PLATFORM_H, segs),
      materials.fleece,
    );
    platform.name = `catPlatform${i}`;
    platform.position.set(p.dx, p.y, p.dz);
    group.add(platform);
  });

  return group;
}

// Room shell (plan-0009 §2.1): floor, three walls, ceiling, baseboards,
// and the window frame on the fill side (+X — CharacterScene's dusk fill
// comes from there). World-anchored: the figure sits at the origin facing
// -Z, desk against the back wall.

import { BoxGeometry, Group, Mesh, PlaneGeometry } from "three";
import type { RoomBuilderOptions } from "./materials";

export const ROOM = {
  backZ: -1.05,
  frontZ: 2.3,
  leftX: -2.1,
  rightX: 2.0,
  ceilingY: 2.55,
} as const;

/**
 * The +X window, hoisted out of the builder because 5.1's cat tree is placed
 * *against* it: its top platform sits level with the sill and has to stop
 * short of the sill's inner edge. Those are the window's numbers, not the
 * tree's, so the tree imports them and moving the window moves the tree.
 */
const GLASS_W = 0.95;
const GLASS_H = 0.85;
const SILL_DEPTH = 0.12;
const SILL_THICKNESS = 0.03;
/** How far the sill sits below the glass. */
const SILL_DROP = 0.065;
/** The sill's own offset from the window group's centre, into the room. */
const SILL_OFFSET_X = -0.03;

export const WINDOW = {
  x: ROOM.rightX - 0.012,
  y: 1.45,
  z: -0.25,
  glassW: GLASS_W,
  glassH: GLASS_H,
  sillDepth: SILL_DEPTH,
  sillThickness: SILL_THICKNESS,
  sillDrop: SILL_DROP,
  sillOffsetX: SILL_OFFSET_X,
  /** World y of the ledge's top face — perch height. */
  sillTopY: 1.45 - GLASS_H / 2 - SILL_DROP + SILL_THICKNESS / 2,
  /** World x of the ledge's room-facing edge. Anything standing against
   *  this wall has to stay below it or it intersects the ledge. */
  sillInnerX: ROOM.rightX - 0.012 + SILL_OFFSET_X - SILL_DEPTH / 2,
} as const;

export function buildRoom({ materials }: RoomBuilderOptions): Group {
  const group = new Group();
  group.name = "room";
  const width = ROOM.rightX - ROOM.leftX;
  const depth = ROOM.frontZ - ROOM.backZ;
  const centerX = (ROOM.rightX + ROOM.leftX) / 2;
  const centerZ = (ROOM.frontZ + ROOM.backZ) / 2;

  const floor = new Mesh(new PlaneGeometry(width, depth), materials.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(centerX, 0, centerZ);
  group.add(floor);

  const ceiling = new Mesh(new PlaneGeometry(width, depth), materials.wall);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(centerX, ROOM.ceilingY, centerZ);
  group.add(ceiling);

  const backWall = new Mesh(new PlaneGeometry(width, ROOM.ceilingY), materials.wall);
  backWall.position.set(centerX, ROOM.ceilingY / 2, ROOM.backZ);
  group.add(backWall);

  const leftWall = new Mesh(new PlaneGeometry(depth, ROOM.ceilingY), materials.wall);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(ROOM.leftX, ROOM.ceilingY / 2, centerZ);
  group.add(leftWall);

  const rightWall = new Mesh(new PlaneGeometry(depth, ROOM.ceilingY), materials.wall);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(ROOM.rightX, ROOM.ceilingY / 2, centerZ);
  group.add(rightWall);

  // Baseboards on the three visible walls.
  const base = (w: number) => new Mesh(new BoxGeometry(w, 0.09, 0.02), materials.wood);
  const backBase = base(width);
  backBase.position.set(centerX, 0.045, ROOM.backZ + 0.011);
  group.add(backBase);
  for (const [x, sign] of [
    [ROOM.leftX, 1],
    [ROOM.rightX, -1],
  ] as const) {
    const side = base(depth);
    side.rotation.y = Math.PI / 2;
    side.position.set(x + sign * 0.011, 0.045, centerZ);
    group.add(side);
  }

  // Window on the +X wall: dusk glass, frame, cross mullions, sill.
  const win = new Group();
  win.name = "window";
  const { glassW, glassH } = WINDOW;
  const glass = new Mesh(new PlaneGeometry(glassW, glassH), materials.windowDusk);
  glass.rotation.y = -Math.PI / 2;
  win.add(glass);

  const frameDepth = 0.06;
  const bar = (len: number, vertical: boolean, thick: number) => {
    const mesh = new Mesh(
      vertical
        ? new BoxGeometry(frameDepth, len, thick)
        : new BoxGeometry(frameDepth, thick, len),
      materials.wood,
    );
    return mesh;
  };
  const half = 0.02;
  const top = bar(glassW + 0.1, false, 0.05);
  top.position.set(half, glassH / 2 + 0.025, 0);
  const bottom = bar(glassW + 0.1, false, 0.05);
  bottom.position.set(half, -glassH / 2 - 0.025, 0);
  const left = bar(glassH + 0.1, true, 0.05);
  left.position.set(half, 0, glassW / 2 + 0.025);
  const right = bar(glassH + 0.1, true, 0.05);
  right.position.set(half, 0, -glassW / 2 - 0.025);
  const mullionV = bar(glassH, true, 0.03);
  mullionV.position.set(half, 0, 0);
  const mullionH = bar(glassW, false, 0.03);
  mullionH.position.set(half, 0, 0);
  const sill = new Mesh(
    new BoxGeometry(WINDOW.sillDepth, WINDOW.sillThickness, glassW + 0.2),
    materials.wood,
  );
  sill.position.set(WINDOW.sillOffsetX, -glassH / 2 - WINDOW.sillDrop, 0);
  win.add(top, bottom, left, right, mullionV, mullionH, sill);

  win.position.set(WINDOW.x, WINDOW.y, WINDOW.z);
  group.add(win);

  return group;
}

// Camera path (plan-0009 §4.1, ADR-012 §5): chapter-keyed poses sampled
// by normalized scrub progress. Pure function of progress — reverse
// scrubbing is artifact-free by construction. Poses lerp piecewise with
// a smoothstep ease inside each segment; rest points sit exactly on
// keyframes so snap always lands on a composed frame.

import { Vector3 } from "three";
import { DESK_TOP_Y } from "../builders/desk";
import { TOWER_SIZE, POWER_BUTTON_LOCAL } from "../builders/tower";
import { REST_POINTS } from "@/lib/chapters";

/** CRT screen centre in world space (RoomScene layout + crt.ts locals). */
export const SCREEN_WORLD = new Vector3(
  -0.22,
  DESK_TOP_Y + TOWER_SIZE.height + 0.008 + 0.217,
  -0.7 + 0.131,
);

/** Tower power button in world space — the film's first frame (ADR-013
 *  §2). Derived from the room's tower placement rather than typed, so the
 *  opening shot, the DOM hotspot and the press all move together if the
 *  desk is ever rearranged. */
export const POWER_WORLD = new Vector3(
  -0.22 + POWER_BUTTON_LOCAL.x,
  DESK_TOP_Y + POWER_BUTTON_LOCAL.y,
  -0.72 + POWER_BUTTON_LOCAL.z,
);

/** Square-on dock distance: screen height 0.24 fills a 50° fov frame. */
export const DOCK_DISTANCE = 0.26;

interface CameraKey {
  p: number;
  position: Vector3;
  target: Vector3;
}

/** The figure's head centre — ch. 2's framing target, and the point 6.2
 *  measures camera distance to for the earbud leak. Shared so the shot and
 *  the sound can never disagree about where the head is. */
export const HEAD_FOCUS = new Vector3(0, 1.22, -0.06);
const head = HEAD_FOCUS;

/** Chapter beats (ADR-012 §5 table, as amended by ADR-013 §2). REST_POINTS
 *  index: 0 power-on, 1 glow, 2 man, 3 room, 4 dock, 5 sign-off. */
const KEYS: CameraKey[] = [
  {
    // Ch. 0 opens on the tower's power button — macro, ~165 mm out, the
    // button just below frame centre and about a tenth of the frame wide.
    // The camera sits in front of the tower and BEHIND the figure's hands,
    // so the right forearm enters from frame right on the press and no
    // torso or face is ever in shot (ADR-013 §4 keeps the reveal for ch. 2).
    p: 0,
    position: new Vector3(0.03, 0.825, -0.375),
    target: new Vector3(POWER_WORLD.x + 0.005, POWER_WORLD.y + 0.013, POWER_WORLD.z),
  },
  {
    // Ch. 0 rest: pull up and left off the button onto phosphor glass —
    // the extreme close-up that used to be the film's first frame.
    p: REST_POINTS[0],
    position: new Vector3(SCREEN_WORLD.x, SCREEN_WORLD.y, SCREEN_WORLD.z + 0.21),
    target: SCREEN_WORLD,
  },
  {
    // Ch. 1 rest: pulled back, monitor in frame.
    p: REST_POINTS[1],
    position: new Vector3(-0.3, 1.18, 0.38),
    target: new Vector3(SCREEN_WORLD.x, SCREEN_WORLD.y - 0.02, SCREEN_WORLD.z),
  },
  {
    // Ch. 2 rest: orbit to the figure's profile (earbud/beard/forearm).
    p: REST_POINTS[2],
    position: new Vector3(-1.25, 1.14, 0.2),
    target: head,
  },
  {
    // Ch. 2→3 arc: crane up and pull back on the figure's own side.
    //
    // This used to swing right, across the front of the figure, because
    // ch. 3 finished on the far side of the room and a straight lerp from
    // the profile cut through the hair. Since 3.2 moved ch. 3 to the
    // FRONT-LEFT the crossing is gone — both ends are now at x ≈ -1.4 —
    // so the arc bows gently outward instead. Keep both keys on the same
    // side of the figure or the hair problem comes straight back.
    p: REST_POINTS[2] + (REST_POINTS[3] - REST_POINTS[2]) * 0.5,
    position: new Vector3(-1.55, 1.6, 0.95),
    target: new Vector3(0.1, 1.05, -0.4),
  },
  {
    // Ch. 3 rest: the wide dusk establishing shot — "this is where it
    // started" (ADR-012 §5).
    //
    // 3.2 moved this from (1.35, 1.85, 1.55). That was on the +X side,
    // i.e. the SAME wall as the window, looking away from it: the glass,
    // the light shafts, the cat tree and both cats all sat behind the
    // camera, and 5.1 would have built a tree nobody ever saw. From the
    // front-left the shot gets the two walls that matter — the desk
    // against the back wall and the window along +X — in one frame, with
    // the figure near the centre of it. The cats read off to the right of
    // frame, which is what keeps this "the room" and not "the cats".
    p: REST_POINTS[3],
    position: new Vector3(-1.45, 1.95, 1.7),
    target: new Vector3(0.45, 1.02, -0.5),
  },
  {
    // Ch. 4 approach: over-the-shoulder arc…
    p: REST_POINTS[3] + (REST_POINTS[4] - REST_POINTS[3]) * 0.55,
    position: new Vector3(0.3, 1.32, 0.28),
    target: SCREEN_WORLD,
  },
  {
    // …then push square-on until the screen fills the frame (dock pose;
    // 4.2 swaps to DOM here).
    p: REST_POINTS[4],
    position: new Vector3(
      SCREEN_WORLD.x,
      SCREEN_WORLD.y,
      SCREEN_WORLD.z + DOCK_DISTANCE,
    ),
    target: SCREEN_WORLD,
  },
  {
    // Ch. 5 rest: widest pull-back; dusk has deepened (Lighting reads
    // experienceState.duskDeepen).
    p: 1,
    position: new Vector3(1.9, 2.05, 2.1),
    target: new Vector3(-0.1, 0.9, -0.4),
  },
];

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Sample the path at `progress`, writing into the provided vectors
 * (allocation-free — called from the frame loop).
 */
export function sampleCameraPath(
  progress: number,
  outPosition: Vector3,
  outTarget: Vector3,
): void {
  const p = Math.min(Math.max(progress, 0), 1);
  let i = 0;
  while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const span = b.p - a.p;
  const t = span > 0 ? smooth((p - a.p) / span) : 1;
  outPosition.lerpVectors(a.position, b.position, t);
  outTarget.lerpVectors(a.target, b.target, t);
}

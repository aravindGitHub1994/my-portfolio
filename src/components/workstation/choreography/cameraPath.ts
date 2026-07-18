// Camera path (plan-0009 §4.1, ADR-012 §5): chapter-keyed poses sampled
// by normalized scrub progress. Pure function of progress — reverse
// scrubbing is artifact-free by construction. Poses lerp piecewise with
// a smoothstep ease inside each segment; rest points sit exactly on
// keyframes so snap always lands on a composed frame.

import { Vector3 } from "three";
import { DESK_TOP_Y } from "../builders/desk";
import { TOWER_SIZE } from "../builders/tower";
import { REST_POINTS } from "@/lib/chapters";

/** CRT screen centre in world space (RoomScene layout + crt.ts locals). */
export const SCREEN_WORLD = new Vector3(
  -0.22,
  DESK_TOP_Y + TOWER_SIZE.height + 0.008 + 0.217,
  -0.7 + 0.131,
);

/** Square-on dock distance: screen height 0.24 fills a 50° fov frame. */
export const DOCK_DISTANCE = 0.26;

interface CameraKey {
  p: number;
  position: Vector3;
  target: Vector3;
}

const head = new Vector3(0, 1.22, -0.06);

/** Chapter beats (ADR-012 §5 table). REST_POINTS index: 1 glow, 2 man,
 *  3 room, 4 dock, 5 sign-off. */
const KEYS: CameraKey[] = [
  {
    // Ch. 1 opens on phosphor glass — extreme close-up.
    p: 0,
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
    // Ch. 2→3 arc: swing behind the chair at height — a straight lerp
    // from the profile to the wide shot cuts through the figure's hair.
    p: REST_POINTS[2] + (REST_POINTS[3] - REST_POINTS[2]) * 0.5,
    position: new Vector3(-0.35, 1.6, 1.3),
    target: new Vector3(-0.05, 1.02, -0.3),
  },
  {
    // Ch. 3 rest: dolly back + crane to the wide dusk establishing shot.
    p: REST_POINTS[3],
    position: new Vector3(1.35, 1.85, 1.55),
    target: new Vector3(-0.1, 0.95, -0.45),
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

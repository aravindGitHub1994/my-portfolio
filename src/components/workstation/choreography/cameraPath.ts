// Camera path (plan-0009 §4.1, ADR-012 §5): chapter-keyed poses sampled
// by normalized scrub progress. Pure function of progress — reverse
// scrubbing is artifact-free by construction. Poses lerp piecewise with
// a smoothstep ease inside each segment; rest points sit exactly on
// keyframes so snap always lands on a composed frame.

import { Vector3 } from "three";
import { DESK_TOP_Y } from "../builders/desk";
import { TOWER_SIZE, POWER_BUTTON_LOCAL } from "../builders/tower";
import { REST_POINTS } from "@/lib/chapters";
import { dockDistance, REF_ASPECT } from "./viewport";

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

interface CameraKey {
  p: number;
  position: Vector3;
  target: Vector3;
}

/** Ch. 4's dock pose, square-on at `dockDistance(aspect)` from the glass.
 *  Held as its own binding because it is the ONE key that is not frozen at
 *  module load: `setViewportAspect` rewrites its z on resize (ADR-014 §3),
 *  so the analytic dock rect and the camera pose cannot drift apart. It
 *  starts at the reference aspect's solution — the shipped 0.26 — so a
 *  render before the first resize read is exactly what main shipped. */
const DOCK_KEY: CameraKey = {
  p: REST_POINTS[4],
  position: new Vector3(
    SCREEN_WORLD.x,
    SCREEN_WORLD.y,
    SCREEN_WORLD.z + dockDistance(REF_ASPECT),
  ),
  target: SCREEN_WORLD,
};

/**
 * Re-solve the dock keyframe for a viewport aspect. Called from the journey
 * camera's resize effect, never from a frame loop — `sampleCameraPath` stays
 * a pure function of progress and this is the only write into `KEYS` in the
 * module's life.
 */
export function setViewportAspect(aspect: number): void {
  DOCK_KEY.position.z = SCREEN_WORLD.z + dockDistance(aspect);
}

/** The figure's head centre — ch. 2's framing target, and the point 6.2
 *  measures camera distance to for the earbud leak. Shared so the shot and
 *  the sound can never disagree about where the head is. */
export const HEAD_FOCUS = new Vector3(0, 1.22, -0.06);
const head = HEAD_FOCUS;

/** Chapter beats (ADR-012 §5 table, as amended by ADR-013 §2 and then by
 *  ADR-014 §1/§2, which recomposed chapter 0 wholesale). REST_POINTS
 *  index: 0 power-on, 1 glow, 2 man, 3 room, 4 dock, 5 sign-off. */
const KEYS: CameraKey[] = [
  {
    // Ch. 0 opens high and wide from BEHIND AND TO THE RIGHT of the figure
    // (ADR-014 §1): the whole seated figure small in frame with the desk,
    // the tower, the CRT and the room around it, the machine still off.
    //
    // This replaced a macro ~165 mm off the power button. The macro's
    // mechanism was the near plane, not the hand: R3F's default near is
    // 0.1 m, the right forearm swings through that on the reach, and a
    // `FrontSide` capsule cut open at the lens shows no backface at all —
    // the visitor looked inside the figure. From here the nearest thing in
    // shot along the whole chapter is 0.199 m and the reach never comes
    // within the near plane on any of its 143 frames.
    //
    // **The constraint that does not show in these numbers is occlusion.**
    // `PowerButtonAnchor` is projection-only — it tests `v.z < 1` and a
    // screen-space margin, with no depth test — so an occluded button
    // leaves `PowerOn`'s glowing ring floating over the figure with
    // nothing behind it, and the ring is the visitor's only affordance.
    // From directly behind, the torso and the right shoulder occlude the
    // tower: 438 of 972 swept camera positions were blocked by
    // `chest` or `shoulderPivotR`. **That is why the shot is behind-RIGHT
    // and high, and the reason cannot be recovered from the coordinates.**
    // Any change here must re-check that the sight line to POWER_WORLD
    // still lands on the `towerPower` mesh first.
    //
    // Composition at 1920×1080: the figure 21 % × 63 % of frame and
    // uncropped at every viewport in the gate matrix, the desk 34 % × 48 %,
    // the ring at NDC (0.00, -0.08). Chapter 3's wide is front-LEFT at
    // dusk, so the two room shots are opposite sides of the room and
    // different moments (ADR-014 Consequences).
    p: 0,
    position: new Vector3(1.6, 2.15, 1.8),
    target: new Vector3(0, 0.95, -0.45),
  },
  {
    // Ch. 0 arc: bow out to the figure's left before turning in.
    //
    // **Required, not decorative.** `sampleCameraPath` lerps straight lines
    // between keys, and the straight run from the opening to the rest
    // passes through the figure: swept over the whole opening grid its best
    // clearance against the upper-body keep-out column is 0.082 m and its
    // median is 0.024 m. This is the same failure the ch. 2→3 arc key
    // exists for. With this key the whole chapter clears by 0.146 m.
    //
    // `p` sits at 83 % because that is the leg's share of the path length
    // (2.472 m of 2.979 m) — the two legs then run at the same speed
    // instead of the camera sprinting one and crawling the other.
    p: REST_POINTS[0] * 0.83,
    position: new Vector3(-0.3, 1.25, 0.5),
    target: new Vector3(-0.11, 1.02, -0.51),
  },
  {
    // Ch. 0 rest: a medium on the monitor — the CRT sizeable with its
    // bezel, not filling the frame (ADR-014 §2). The extreme close-up on
    // phosphor that used to sit here is cut from the film entirely.
    //
    // **The side is forced and the distance is measured.** The figure sits
    // square-on in front of the CRT, so the space a square-on medium wants
    // is the space the figure occupies; the camera can only clear it by
    // going laterally wide, over the top, or by staying inside 0.17 m of
    // the glass — which is the close-up being cut. Because the CRT sits at
    // x -0.22 while the figure sits at x 0, the left is the near side: best
    // sight-line obliquity on the glass is 10° from the left against 37°
    // from centre and 46° from the right.
    //
    // The distance answers to POST legibility, not to taste (ADR-013 §2a
    // says the lines are read, not merely heard). The painter draws 13 px
    // Courier on a 640×480 canvas, so a POST line's cap height in device px
    // follows from the screen's projected height: 7.0 px here at 1920×1080
    // against 4.5 px at chapter 1's rest, which is the floor. It clears
    // that floor at all eight gate viewports.
    p: REST_POINTS[0],
    position: new Vector3(-0.48, 1.1, 0.05),
    target: SCREEN_WORLD,
  },
  {
    // Ch. 1 rest: pulled back, monitor in frame.
    p: REST_POINTS[1],
    position: new Vector3(-0.3, 1.18, 0.38),
    target: new Vector3(SCREEN_WORLD.x, SCREEN_WORLD.y - 0.02, SCREEN_WORLD.z),
  },
  {
    // Ch. 2 rest: the face reveal (3.1, ADR-013 §4).
    //
    // Was (-1.25, 1.14, 0.2) — a hair PAST profile, about 102° off the
    // figure's own facing axis, so the shot was mostly the back of a head.
    // This is a true three-quarter: 40° off that axis, 0.95 m out, and
    // 0.22 m above the head looking down. **No head geometry changed** —
    // `buildHead.ts` still has no eyes and no mouth by decision, and the
    // reveal is done by moving the camera into the light the CRT was
    // already throwing (ADR-012 §2, ADR-013 §4).
    //
    // **The height is forced, not a taste call.** The figure sits at a desk
    // with a monitor directly in front of it, so there is no room for a
    // frontal camera at head height — every candidate below ~0.2 m of lift
    // either ends up inside the CRT or drags the CRT into frame, and the
    // plan wants it keying from OFF screen. Coming over the top is the only
    // frontal angle this desk allows. It also happens to be why the
    // tattooed right forearm still reads: from up here the camera sees
    // clean over the torso to the far arm, which a profile at head height
    // does not (verified by raycast, not by projection).
    //
    // The +X side — the tattoo's own side — was swept too and yields
    // nothing: from there the CRT sits directly behind the head.
    p: REST_POINTS[2],
    position: new Vector3(-0.61, 1.44, -0.79),
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
  // …then push square-on until the screen fills the frame (dock pose;
  // 4.2 swaps to DOM here). Distance is a function of viewport aspect —
  // see DOCK_KEY above.
  DOCK_KEY,
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

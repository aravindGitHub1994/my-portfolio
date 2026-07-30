// Prop handles (ADR-013 §6, plan-0010 §4.2) — the one place the room lets
// go of an object so something else can move it.
//
// The mug is built by `RoomScene` and the arm that lifts it is driven by
// `Figure`. They are separate component trees that share no props, and the
// dependency must stay **one-way**: the room publishes, the character
// consumes. `RoomScene` importing anything from `character/` would make
// the dressed set depend on there being a person in it, which is exactly
// what `?scene=room` exists to disprove.
//
// So: a mutable singleton, the `experienceState` / `effectsState` pattern.
// Frame loops read it directly — no React state, no context, and no prop
// drilling through a `<primitive>`. Null whenever the scene that owns the
// prop is not mounted, which is the normal case in half the harnesses.
//
// **Type-only three import.** This module stays as free of runtime
// dependencies as `win98State` does; it is a noticeboard, not a scene.

import type { Group } from "three";

export const propHandles = {
  /** The mug `Group`, in room space. Published by `RoomScene` on mount and
   *  nulled on unmount — a stale handle would keep a disposed scene's
   *  geometry alive, so the null is not optional.
   *
   *  Readers must treat null as "no mug in this scene" and simply do
   *  nothing: `?scene=character` has an arm and no mug, and the sip has to
   *  degrade to the reach it was before 4.2 rather than throw. */
  mug: null as Group | null,
};

/** Publish a prop and get its retraction back, so the caller cannot forget
 *  half of the pair. Guards against a late unmount clearing a newer
 *  scene's handle — the same identity check `attachPowerArm` uses. */
export function publishMug(group: Group): () => void {
  propHandles.mug = group;
  return () => {
    if (propHandles.mug === group) propHandles.mug = null;
  };
}

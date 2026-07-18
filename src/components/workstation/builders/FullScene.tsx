"use client";

import { Figure } from "../character/Figure";
import { RoomScene } from "./RoomScene";

/**
 * `?scene=full` harness (gate 2.3, plan-0009): the colored figure seated
 * in the dressed, lit room — idle + typing running, screen test pattern
 * cycling the light cast. Pure assembly; the figure sits at the origin on
 * the RoomScene chair, hands over the keyboard by construction (the 0.2
 * layout and the 1.1 pose share the concept-sheet coordinates).
 */
export const FULL_CAMERA = {
  position: [-1.5, 1.5, 0.85] as [number, number, number],
  target: [-0.05, 0.9, -0.5] as [number, number, number],
};

export function FullScene({ autoBoot = true }: { autoBoot?: boolean }) {
  return (
    <>
      <RoomScene autoBoot={autoBoot} />
      <Figure />
    </>
  );
}

"use client";

// Projects the tower's power button to viewport coordinates each frame
// (plan-0010 §2.2, ADR-013 §3).
//
// The entry gesture has to stay in the DOM — `unlockAudio()` must run
// synchronously inside a real user gesture, and the canvas is
// `fixed inset-0 -z-10` so clicks land on the document and never reach it.
// Raycasting the mesh would mean raising the canvas for one click and
// fighting the scroll model for the rest of the ride. So the DOM keeps the
// button, its accessible name, its focus ring and its keyboard activation,
// and this component tells it where the 3D button currently *is*.
//
// Writes into `experienceState`, not React state: the value changes every
// frame while the camera moves, and re-rendering the entry overlay sixty
// times a second to place one ring would be absurd.

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { experienceState } from "@/lib/experienceState";
import { POWER_WORLD } from "./cameraPath";

export function PowerButtonAnchor() {
  // One scratch vector for the life of the component — `project` writes in
  // place, so the frame loop allocates nothing.
  const ndc = useRef(new Vector3());

  useFrame(({ camera }) => {
    const v = ndc.current.copy(POWER_WORLD).project(camera);
    const anchor = experienceState.powerAnchor;
    anchor.x = (v.x + 1) / 2;
    anchor.y = (1 - v.y) / 2;
    // `project` divides by w, so a point behind the camera comes back
    // mirrored with z > 1 rather than obviously wrong. Check z first, then
    // allow a margin outside the frame so the ring eases off rather than
    // vanishing the instant the button touches an edge.
    anchor.onScreen = v.z < 1 && Math.abs(v.x) < 1.25 && Math.abs(v.y) < 1.25;
  });

  return null;
}

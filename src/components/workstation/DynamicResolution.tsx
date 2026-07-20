"use client";

// DRS reader (plan-0009 §7.1): the one component that pushes the
// `dynamicResolution.ts` controller's scale at the renderer. Mounted
// inside the journey Canvas; contributes nothing to the scene.

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { createDrsState, sampleDrs, DRS_MIN } from "@/lib/dynamicResolution";
import { fidelityState } from "./fidelity";

export function DynamicResolution({ maxDpr }: { maxDpr: number }) {
  const setDpr = useThree((s) => s.setDpr);
  // Mutable, never React state — this is read every frame, and a setState
  // per sample would cost more than the scaling saves.
  const drs = useRef(createDrsState());

  useFrame((_, delta) => {
    // §7.2's "DRS floor" rung: the ladder has decided this device does not
    // get the headroom back. Pin rather than letting the controller climb
    // — on hardware that marginal, every recovery it finds is the prelude
    // to the next drop, and the visitor sees the oscillation.
    if (fidelityState.drsPinned) {
      if (drs.current.scale !== DRS_MIN) {
        drs.current.scale = DRS_MIN;
        setDpr(Math.min(window.devicePixelRatio || 1, maxDpr) * DRS_MIN);
      }
      return;
    }
    if (!sampleDrs(drs.current, delta * 1000)) return;
    // Device ratio is re-read rather than captured: a window dragged to a
    // second monitor changes it, and R3F re-applies its own `dpr` prop on
    // resize anyway — so DRS re-converges after that instead of fighting
    // it, which is why the cooldown is measured in frames not seconds.
    const device = Math.min(window.devicePixelRatio || 1, maxDpr);
    setDpr(device * drs.current.scale);
  });

  return null;
}

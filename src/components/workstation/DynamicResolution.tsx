"use client";

// DRS reader (plan-0009 §7.1): the one component that pushes the
// `dynamicResolution.ts` controller's scale at the renderer. Mounted
// inside the journey Canvas; contributes nothing to the scene.

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { createDrsState, sampleDrs } from "@/lib/dynamicResolution";

export function DynamicResolution({ maxDpr }: { maxDpr: number }) {
  const setDpr = useThree((s) => s.setDpr);
  // Mutable, never React state — this is read every frame, and a setState
  // per sample would cost more than the scaling saves.
  const drs = useRef(createDrsState());

  useFrame((_, delta) => {
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

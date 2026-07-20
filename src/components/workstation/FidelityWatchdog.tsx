"use client";

// Watchdog frame reader (plan-0009 §7.2): feeds frame deltas to the
// `fidelity.ts` ladder. Mounted inside the journey Canvas; contributes
// nothing to the scene — the `DynamicResolution` pattern.
//
// Journey-only, and auto-tier-only. `?tier=` is a calibration override
// (gpuTier.ts): someone who forced a tier is measuring it, and a ladder
// quietly stripping the scene underneath them would make every reading
// they take a lie.

import { useFrame } from "@react-three/fiber";
import { fidelityState, sampleFidelity } from "./fidelity";

export function FidelityWatchdog() {
  useFrame((_, delta) => {
    const rung = sampleFidelity(fidelityState, delta * 1000);
    if (rung && process.env.NODE_ENV !== "production") {
      console.info(`[fidelity] shed rung: ${rung}`);
    }
  });
  return null;
}

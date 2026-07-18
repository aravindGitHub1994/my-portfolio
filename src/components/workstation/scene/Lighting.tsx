"use client";

// Dusk rig (plan-0009 §2.2, ADR-012 §2): cool blue-hour directional +
// soft ambient from the window side (+X), and the warm CRT key light —
// intensity AND color driven each frame from screenLight (written by the
// screen feed / harness test pattern). Refs only in the frame loop.

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { PointLight } from "three";
import { screenLight } from "./screenLight";
import { effectsState } from "./sheddable";

/** Base + luminance-scaled intensity of the CRT cast. */
const CAST_BASE = 0.5;
const CAST_SCALE = 3.4;
/** Smoothing factor per second when castFlicker is shed. */
const SMOOTH_RATE = 4;

export function Lighting({
  screenPosition = [-0.22, 1.06, -0.5] as [number, number, number],
}: {
  screenPosition?: [number, number, number];
}) {
  const cast = useRef<PointLight>(null);

  useFrame((_, delta) => {
    const light = cast.current;
    if (!light) return;
    const target = CAST_BASE + screenLight.luminance * CAST_SCALE;
    if (effectsState.castFlicker) {
      light.intensity = target;
      light.color.copy(screenLight.tint);
    } else {
      // Shed tier: ease toward the target so the room never strobes.
      const k = Math.min(1, SMOOTH_RATE * delta);
      light.intensity += (target - light.intensity) * k;
      light.color.lerp(screenLight.tint, k);
    }
  });

  return (
    <>
      <ambientLight color="#2c3d5c" intensity={0.5} />
      {/* Blue-hour shaft through the +X window. */}
      <directionalLight
        color="#7a9bd8"
        position={[2.5, 2.2, 0.6]}
        intensity={0.85}
      />
      {/* Faint bounce so the room's dark side never clips to black. */}
      <directionalLight
        color="#40465c"
        position={[-1.5, 1.2, 1.8]}
        intensity={0.25}
      />
      <pointLight
        ref={cast}
        color="#ffb066"
        position={screenPosition}
        intensity={2.2}
        distance={3.8}
        decay={1.6}
      />
    </>
  );
}

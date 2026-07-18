"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Group } from "three";
import { experienceState } from "@/lib/experienceState";
import { mulberry32 } from "@/lib/prng";
import type { FidelityTier } from "@/lib/gpuTier";

/**
 * The experience's single persistent canvas (plan-0009 §0.2). Two modes:
 *
 * - `scene === null` — the journey: a stub camera dollying down a
 *   marker-lined track, driven each frame from experienceState's scrub
 *   progress. Proves scrub + snap ahead of the real WorkstationScene
 *   (P2 replaces the stub; the wiring stays).
 * - `scene === "<name>"` — the `?scene=` harness (owner QA / P1–P2 dev):
 *   mounts an isolated scene from HARNESS_SCENES with an orbitable camera,
 *   no choreography. Unknown names fall back to the marker field.
 *
 * The wrapper is aria-hidden (ADR-012 §9): the canvas is cinematic only;
 * content always exists in the DOM.
 */

/** World-space length of the stub dolly track. */
const TRACK_LENGTH = 60;
const MARKER_COUNT = 24;
const CAMERA_START_Z = 5;

interface Marker {
  position: [number, number, number];
  scale: number;
}

/** Seeded marker scatter along the track — stable across renders/builds. */
function useMarkers(): Marker[] {
  return useMemo(() => {
    const rnd = mulberry32(0x0009_0002);
    return Array.from({ length: MARKER_COUNT }, (_, i) => ({
      position: [
        (rnd() - 0.5) * 12,
        (rnd() - 0.5) * 5,
        -(i / (MARKER_COUNT - 1)) * TRACK_LENGTH,
      ] as [number, number, number],
      scale: 0.3 + rnd() * 0.6,
    }));
  }, []);
}

function MarkerField() {
  const markers = useMarkers();
  const group = useRef<Group>(null);
  return (
    <group ref={group}>
      {markers.map((marker, i) => (
        <mesh key={i} position={marker.position} scale={marker.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            // GL effect colors, not UI tokens (accent-adjacent blue).
            color={i % 4 === 0 ? "#3d74ff" : "#6a7080"}
            roughness={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Frame loop reads the mutable singleton only — never React state. */
function JourneyRig() {
  useFrame(({ camera }) => {
    camera.position.z =
      CAMERA_START_Z - experienceState.scrollProgress * TRACK_LENGTH;
  });
  return null;
}

/** Isolated scenes the `?scene=` harness can mount (P1 adds "character"). */
const HARNESS_SCENES: Record<string, React.ComponentType> = {
  stub: MarkerField,
};

export function WorkstationCanvas({
  tier,
  scene,
}: {
  tier: FidelityTier;
  scene: string | null;
}) {
  const HarnessScene =
    scene !== null ? (HARNESS_SCENES[scene] ?? MarkerField) : null;

  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, CAMERA_START_Z], fov: 55 }}
        dpr={tier === "low" ? 1 : [1, 2]}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 6, 8]} intensity={1.2} />
        {HarnessScene ? (
          <>
            <HarnessScene />
            <OrbitControls makeDefault />
          </>
        ) : (
          <>
            <MarkerField />
            <JourneyRig />
          </>
        )}
      </Canvas>
    </div>
  );
}

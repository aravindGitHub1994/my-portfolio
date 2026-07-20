"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Vector3, type Group } from "three";
import { experienceState } from "@/lib/experienceState";
import { mulberry32 } from "@/lib/prng";
import type { FidelityTier } from "@/lib/gpuTier";
import { sampleCameraPath } from "./choreography/cameraPath";
import {
  CharacterScene,
  CHARACTER_CAMERA,
} from "./character/CharacterScene";
import { RoomScene, ROOM_CAMERA } from "./builders/RoomScene";
import { AudioTextures } from "./AudioTextures";
import { DynamicResolution } from "./DynamicResolution";
import { FidelityWatchdog } from "./FidelityWatchdog";
import { PerfCounter } from "./PerfCounter";
import { FullScene, FULL_CAMERA } from "./builders/FullScene";

/**
 * The experience's single persistent canvas (plan-0009 §0.2). Two modes:
 *
 * - `scene === null` — the journey: a stub camera dollying down a
 *   marker-lined track, driven each frame from experienceState's scrub
 *   progress. Proves scrub + snap ahead of the real WorkstationScene
 *   (P2 replaces the stub; the wiring stays).
 * - `scene === "<name>"` — the `?scene=` harness (owner QA / P1–P2 dev):
 *   mounts an isolated scene from HARNESS_SCENES with an orbitable camera,
 *   no choreography. Unknown names fall back to the stub field.
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

/** Journey camera (4.1): samples the chapter path from the mutable
 *  singleton each frame — allocation-free, never React state. */
function JourneyCamera() {
  const target = useRef(new Vector3());
  useFrame(({ camera }) => {
    sampleCameraPath(
      experienceState.scrollProgress,
      camera.position,
      target.current,
    );
    camera.lookAt(target.current);
  });
  return null;
}

function StubScene() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 8]} intensity={1.2} />
      <MarkerField />
    </>
  );
}

interface HarnessSceneDef {
  Component: React.ComponentType;
  /** Initial camera pose — the character preset is 1.2's "chapter 2 frame". */
  position: [number, number, number];
  target: [number, number, number];
}

/** Isolated scenes the `?scene=` harness can mount. */
const HARNESS_SCENES: Record<string, HarnessSceneDef> = {
  stub: {
    Component: StubScene,
    position: [0, 0, CAMERA_START_Z],
    target: [0, 0, 0],
  },
  character: {
    Component: CharacterScene,
    position: CHARACTER_CAMERA.position,
    target: CHARACTER_CAMERA.target,
  },
  room: {
    Component: RoomScene,
    position: ROOM_CAMERA.position,
    target: ROOM_CAMERA.target,
  },
  full: {
    Component: FullScene,
    position: FULL_CAMERA.position,
    target: FULL_CAMERA.target,
  },
};

export function WorkstationCanvas({
  tier,
  auto = true,
  scene,
  onContextLost,
}: {
  tier: FidelityTier;
  /** False when `?tier=` forced the choice — suppresses the §7.2 watchdog.
   *  Someone who pinned a tier is measuring it, and a ladder stripping the
   *  scene underneath them would make every reading they take a lie. */
  auto?: boolean;
  scene: string | null;
  /** Fired when the GL context dies (§7.1 in-app-browser path) so the host
   *  can hand the visitor back the static floor instead of a blank page. */
  onContextLost?: () => void;
}) {
  const harness =
    scene !== null ? (HARNESS_SCENES[scene] ?? HARNESS_SCENES.stub) : null;

  // Attached in onCreated rather than an effect: the canvas element does
  // not exist until R3F builds the renderer, and a context can be lost
  // before the first commit on a memory-starved webview.
  const watchContext = ({ gl }: { gl: { domElement: HTMLCanvasElement } }) => {
    gl.domElement.addEventListener(
      "webglcontextlost",
      (e) => {
        // Default-prevented would mean "we intend to restore"; the scene
        // has no restore path, so let it stand and fall back instead.
        console.warn("[experience] WebGL context lost", e);
        onContextLost?.();
      },
      { once: true },
    );
  };

  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10">
      {harness ? (
        <Canvas
          camera={{ position: harness.position, fov: 50 }}
          dpr={tier === "low" ? 1 : [1, 2]}
        >
          <harness.Component />
          <OrbitControls makeDefault target={harness.target} />
        </Canvas>
      ) : (
        // The journey (4.1): the full dressed scene; boot waits for the
        // PowerOn press (WorkstationExperience layer), camera rides the
        // chapter path.
        <Canvas
          camera={{ fov: 50 }}
          dpr={tier === "low" ? 1 : [1, 2]}
          onCreated={watchContext}
        >
          {/* §7.2's low-tier pass: the builders have taken a `detail`
              param since P1, but nothing was threading the actual tier
              into it — the "low" geometry existed and never shipped. */}
          <FullScene autoBoot={false} detail={tier === "low" ? "low" : "high"} />
          <JourneyCamera />
          {/* Tier-2/3 texture audio (6.2) — frame reader only, no scene
              contribution; silent until the power press builds a context. */}
          <AudioTextures />
          {/* DRS (7.1) — journey only. The harnesses are orbit rigs for
              inspecting geometry, where a shifting render scale would
              just make them lie about what they are showing. */}
          <DynamicResolution maxDpr={tier === "low" ? 1 : 2} />
          {/* Shed ladder (7.2) — journey only, auto-tier only. Mounted
              after DRS so the resolution lever has already reacted by the
              time the ladder's slower average has anything to say. */}
          {auto && <FidelityWatchdog />}
          {/* Dev-only perf readout (7.2) — tree-shaken from production. */}
          {process.env.NODE_ENV !== "production" && <PerfCounter />}
        </Canvas>
      )}
    </div>
  );
}

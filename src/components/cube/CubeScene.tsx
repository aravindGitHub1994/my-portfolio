"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  MeshTransmissionMaterial,
  RoundedBox,
} from "@react-three/drei";
import { cubeState, markCubeReady } from "./cubeState";
import { detectTier, type FidelityTier } from "@/lib/gpuTier";

const ACCENT = "#3d74ff";
const ACCENT_BRIGHT = "#8fb3ff";

/** Pauses the render loop while the tab is hidden (SkyScene pattern). */
function VisibilityPause() {
  const setFrameloop = useThree((s) => s.setFrameloop);
  useEffect(() => {
    const onVisibility = () =>
      setFrameloop(document.hidden ? "never" : "always");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [setFrameloop]);
  return null;
}

/** Writes normalized pointer coords into cubeState (no re-renders). */
function PointerTracker() {
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      cubeState.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      cubeState.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return null;
}

/**
 * Faux-glass for the low/static tiers: clearcoat + env reflections sell the
 * material without MeshTransmissionMaterial's per-frame scene capture.
 */
function FauxGlassMaterial() {
  return (
    <meshPhysicalMaterial
      transparent
      opacity={0.24}
      roughness={0.08}
      metalness={0}
      clearcoat={1}
      clearcoatRoughness={0.06}
      envMapIntensity={1.7}
      color="#bcd0ff"
      depthWrite={false}
    />
  );
}

/**
 * The glass data cube: refractive shell around an electric wireframe core.
 * Outer group = pointer tilt + float (and scroll-morph from P1.4);
 * inner meshes = slow idle spin. Choreography lives here so every fidelity
 * tier shares it (ADR-005 §3) — the static tier holds the same silhouette
 * at a fixed pose.
 */
function GlassCube({ tier }: { tier: FidelityTier }) {
  const group = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const animated = tier !== "static";

  useFrame((state, delta) => {
    if (!animated) return;
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;

    // Gentle float + pointer-follow tilt, critically damped.
    g.position.y = Math.sin(t * 0.5) * 0.08;
    g.rotation.x = THREE.MathUtils.damp(
      g.rotation.x,
      cubeState.pointer.y * 0.14,
      2.5,
      delta,
    );
    g.rotation.y = THREE.MathUtils.damp(
      g.rotation.y,
      cubeState.pointer.x * 0.22,
      2.5,
      delta,
    );

    // Slow idle spin on the shell; core counter-rotates and breathes.
    if (shell.current) {
      shell.current.rotation.y = t * 0.14;
      shell.current.rotation.x = Math.sin(t * 0.2) * 0.1;
    }
    if (core.current) {
      core.current.rotation.y = -t * 0.3;
      core.current.rotation.z = t * 0.12;
      const pulse = 1 + Math.sin(t * 1.4) * 0.05;
      core.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={group}>
      <RoundedBox
        ref={shell}
        args={[1.9, 1.9, 1.9]}
        radius={0.09}
        smoothness={8}
        rotation={animated ? undefined : [0.35, 0.65, 0]}
      >
        {tier === "high" ? (
          <MeshTransmissionMaterial
            transmission={1}
            thickness={1.1}
            roughness={0.07}
            ior={1.5}
            chromaticAberration={0.05}
            anisotropicBlur={0.25}
            distortion={0.12}
            distortionScale={0.25}
            temporalDistortion={0.08}
            samples={6}
            resolution={768}
            backside
            backsideThickness={0.25}
            attenuationColor={ACCENT_BRIGHT}
            attenuationDistance={2.5}
          />
        ) : (
          <FauxGlassMaterial />
        )}
      </RoundedBox>

      {/* Electric data core, refracted through the shell */}
      <mesh ref={core}>
        <icosahedronGeometry args={[0.52, 1]} />
        <meshBasicMaterial color={ACCENT} wireframe transparent opacity={0.9} />
      </mesh>

      {/* Blue kernel glow bleeding through the glass */}
      <pointLight color={ACCENT} intensity={4} distance={5} decay={2} />
    </group>
  );
}

/**
 * The persistent scene behind the page. Local Lightformers only — drei's
 * Environment *presets* fetch HDRs from a CDN, which the CSP
 * (connect-src 'self') forbids.
 */
export default function CubeScene() {
  // This component only ever renders client-side (dynamic ssr:false), so
  // tier detection can run in the state initializer — once, before first draw.
  const [tier] = useState<FidelityTier>(detectTier);

  useEffect(() => {
    console.info(`[cube] fidelity tier: ${tier} (override with ?tier=)`);
    // Without WebGL there is no canvas — unblock the loader (P1.5) anyway.
    if (tier === "none") markCubeReady();
  }, [tier]);

  if (tier === "none") return null;

  const animated = tier !== "static";
  return (
    <Canvas
      camera={{ position: [0, 0.2, 6], fov: 42 }}
      dpr={tier === "high" ? [1, 2] : [1, 1.5]}
      frameloop={animated ? "always" : "demand"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={markCubeReady}
    >
      {animated && <VisibilityPause />}
      {animated && <PointerTracker />}

      <GlassCube tier={tier} />

      <Environment resolution={256} frames={1}>
        {/* Cool key strips + one electric accent, arranged for a dark studio */}
        <Lightformer
          intensity={2.2}
          position={[0, 5, -9]}
          scale={[10, 10, 1]}
          color="#dfe6f2"
        />
        <Lightformer
          intensity={1.6}
          position={[-5, 1, -1]}
          rotation-y={Math.PI / 2}
          scale={[16, 0.6, 1]}
          color="#c8d4ea"
        />
        <Lightformer
          intensity={2.4}
          position={[5, -1, -1]}
          rotation-y={-Math.PI / 2}
          scale={[16, 1, 1]}
          color={ACCENT}
        />
        <Lightformer
          form="ring"
          intensity={3}
          position={[0, 3, 5]}
          scale={2.2}
          color={ACCENT_BRIGHT}
        />
      </Environment>
    </Canvas>
  );
}

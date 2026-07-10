"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { lensState, markLensReady } from "./lensState";
import { TheLens } from "./TheLens";
import { DataStreams } from "./DataStreams";
import { RefractionPass } from "./RefractionPass";
import { KineticTextLayer } from "./kinetic/KineticTextLayer";
import { GlassImageLayer } from "./kinetic/GlassImageLayer";
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

/**
 * Writes normalized pointer coords into lensState and bumps pointerSpeed on
 * fast sweeps (no re-renders; the distortion pass decays the energy).
 */
function PointerTracker() {
  useEffect(() => {
    let lastX = 0;
    let lastY = 0;
    let lastT = 0;
    let primed = false;
    const onMove = (e: PointerEvent) => {
      lensState.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      lensState.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      if (primed) {
        const dt = e.timeStamp - lastT;
        if (dt > 0) {
          const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
          const speed = Math.min(1, dist / dt / 1.6); // ~1.6 px/ms = fast
          lensState.pointerSpeed = Math.max(lensState.pointerSpeed, speed);
        }
      }
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = e.timeStamp;
      primed = true;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return null;
}

/**
 * Position/scale choreography shared by the Lens solid and its streams:
 * drifts right as the hero scrolls away, recedes while the Work act's image
 * planes own the stage, and returns to center for the point-globe finale.
 */
function LensRig({
  animated,
  children,
}: {
  animated: boolean;
  children: ReactNode;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!animated) return;
    const g = group.current;
    if (!g) return;
    const { hero, approach, work, trajectory, contact } = lensState.acts;
    const vw = state.viewport.width;

    const globe = THREE.MathUtils.smoothstep(contact, 0, 1);
    // Approach beat: the prism "tightens" — sinks under the stat band and
    // shrinks a touch so the figures own the row; released again once the
    // Work recede (and later the Trajectory crystallization) takes over.
    const sink = approach * (1 - work) * (1 - trajectory);
    const targetX = (hero * vw * 0.16 + work * vw * 0.14) * (1 - globe);
    const targetY = (-hero * 0.2 - sink * 0.8 + work * 0.5) * (1 - globe);
    const targetS = THREE.MathUtils.lerp(
      (1 - hero * 0.26) * (1 - 0.14 * sink) * (1 - work * 0.5),
      1,
      globe,
    );

    g.position.x = THREE.MathUtils.damp(g.position.x, targetX, 3, delta);
    g.position.y = THREE.MathUtils.damp(g.position.y, targetY, 3, delta);
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, targetS, 3, delta));
  });

  return <group ref={group}>{children}</group>;
}

/**
 * The persistent scene behind the page (ADR-006). Local Lightformers only —
 * drei's Environment *presets* fetch HDRs from a CDN, which the CSP
 * (connect-src 'self') forbids.
 */
export default function LensScene() {
  // Client-only (dynamic ssr:false) — tier detection runs once, pre-draw.
  const [tier] = useState<FidelityTier>(detectTier);
  const [finePointer] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: fine)").matches,
  );

  useEffect(() => {
    console.info(`[lens] fidelity tier: ${tier} (override with ?tier=)`);
    // Without WebGL there is no canvas — unblock the loader anyway.
    if (tier === "none") markLensReady();
  }, [tier]);

  if (tier === "none") return null;

  const animated = tier !== "static";
  return (
    <Canvas
      camera={{ position: [0, 0.15, 7], fov: 40 }}
      dpr={tier === "high" ? [1, 2] : [1, 1.5]}
      frameloop={animated ? "always" : "demand"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={markLensReady}
    >
      {animated && <VisibilityPause />}
      {animated && <PointerTracker />}

      <LensRig animated={animated}>
        <TheLens tier={tier} />
        <DataStreams tier={tier} />
      </LensRig>

      {/* WebGL twins of DOM headings/imagery — high tier only; lower tiers
          keep the crisp DOM originals (ADR-006 §8). */}
      {tier === "high" && <KineticTextLayer />}
      {tier === "high" && <GlassImageLayer />}

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

      {/* The global refractive pass — pointer + scroll-velocity distortion
          with chromatic aberration (ADR-006 §4). Desktop high tier only. */}
      {tier === "high" && finePointer && <RefractionPass />}
    </Canvas>
  );
}

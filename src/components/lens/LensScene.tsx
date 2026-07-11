"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { lensState, markLensReady } from "./lensState";
import {
  CONTACT_TARGET,
  getProjectionTarget,
  NO_TARGET,
  PROJECTION_PLANE_Z,
} from "./projectionTargets";
import { rectToWorld } from "./rectToWorld";
import { BakeExcluded } from "./bakeExclusions";
import { TheLens } from "./TheLens";
import { DataStreams } from "./DataStreams";
import { RefractionPass } from "./RefractionPass";
import { KineticTextLayer } from "./kinetic/KineticTextLayer";
import { GlassImageLayer } from "./kinetic/GlassImageLayer";
import { type FidelityTier } from "@/lib/gpuTier";

const ACCENT = "#3d74ff";
const ACCENT_BRIGHT = "#8fb3ff";

/**
 * Runtime performance gate (ADR-009 §3): the tier is high by default, so the
 * first seconds of real frames are the benchmark the old device heuristic
 * only guessed at. Skips a ~1s warmup and any delta > 0.1s (tab pauses,
 * shader-compile hitches), then averages ~2s windows; a window under 40fps
 * calls onSlow once. Good windows reset the accumulator and it keeps
 * watching, so later sustained degradation still triggers.
 */
function FpsWatchdog({ onSlow }: { onSlow: () => void }) {
  const acc = useRef({ warmup: 0, time: 0, frames: 0, fired: false });
  useFrame((_, delta) => {
    const a = acc.current;
    if (a.fired || delta > 0.1) return;
    if (a.warmup < 1) {
      a.warmup += delta;
      return;
    }
    a.time += delta;
    a.frames += 1;
    if (a.time < 2) return;
    if (a.frames / a.time < 40) {
      a.fired = true;
      onSlow();
      return;
    }
    a.time = 0;
    a.frames = 0;
  });
  return null;
}

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
 * Converts the active projection target's DOM rect to world space once per
 * frame (ADR-008 §2, slice 4.1) — the choreography writes index/blend/side
 * from scroll, but only the scene has the camera. The per-frame
 * getBoundingClientRect on one element is the same accepted cost as the
 * kinetic layers. `?debugProjection` logs the spine's output at ~2Hz.
 */
function ProjectionTracker() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("debugProjection")) {
      return;
    }
    // QA hook: lets browser automation read the spine's output directly.
    (window as Window & { __lensProjection?: object }).__lensProjection =
      lensState.projection;
    const id = window.setInterval(() => {
      const p = lensState.projection;
      console.info(
        `[lens] projection index=${p.index} blend=${p.blend.toFixed(2)} ` +
          `side=${p.side} target=(${p.targetX.toFixed(2)}, ${p.targetY.toFixed(2)})`,
      );
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  useFrame(() => {
    const p = lensState.projection;
    if (p.index !== NO_TARGET) {
      const el = getProjectionTarget(p.index);
      if (el) {
        const rect = el.getBoundingClientRect();
        const w = rectToWorld(
          rect,
          camera as THREE.PerspectiveCamera,
          size,
          PROJECTION_PLANE_Z,
        );
        p.targetX = w.x;
        p.targetY = w.y;
        p.halfW = (rect.width / 2) * w.worldPerPx;
        p.halfH = (rect.height / 2) * w.worldPerPx;
      }
    }
    // Contact finale target (ADR-008 §3): a point just beneath the CTA row,
    // plus the row's half-width so the underline spans it.
    if (lensState.acts.contact > 0) {
      const cta = getProjectionTarget(CONTACT_TARGET);
      if (cta) {
        const rect = cta.getBoundingClientRect();
        const w = rectToWorld(
          rect,
          camera as THREE.PerspectiveCamera,
          size,
          PROJECTION_PLANE_Z,
        );
        p.ctaX = w.x;
        p.ctaY = w.y - (rect.height / 2 + 18) * w.worldPerPx;
        p.ctaHalfW = (rect.width / 2) * w.worldPerPx;
      }
    }
  });
  return null;
}

/**
 * Position/scale choreography shared by the Lens solid and its streams:
 * drifts right as the hero scrolls away, and eases home through Trajectory
 * (ADR-008 §3 — a calm return, not a metamorphosis). The Trajectory return
 * settles a calm recap pose right-of-center at reduced scale so the prism
 * never sits over the timeline copy; only Contact completes the move to true
 * center behind the CTA. During Work the behaviour splits by tier
 * (ADR-008 §2): the high tier at lg+ keeps the prism bright and GLIDES it to
 * the corner opposite the active card's window (the projector pose) — the
 * side value is damped before the position is, so the crossing starts and
 * ends with zero velocity instead of snapping; lower tiers keep the ADR-006
 * recede so the image planes own the stage.
 */
function LensRig({
  animated,
  tier,
  children,
}: {
  animated: boolean;
  tier: FidelityTier;
  children: ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const projectV = useRef(0);
  const sideV = useRef(1);

  useFrame((state, delta) => {
    if (!animated) return;
    const g = group.current;
    if (!g) return;
    const { hero, approach, work, trajectory, contact } = lensState.acts;
    const vw = state.viewport.width;
    const vh = state.viewport.height;
    const proj = lensState.projection;

    // Same gate as DataStreams: high tier + the lg pinned layout (1024px).
    const projecting =
      tier === "high" && proj.index >= 0 && state.size.width >= 1024;
    projectV.current = THREE.MathUtils.damp(
      projectV.current,
      projecting ? 1 : 0,
      2.5,
      delta,
    );
    const pj = projectV.current;
    // Damped side — keep the rate in sync with DataStreams' v.side so the
    // prism and its beam bulge cross together.
    sideV.current = THREE.MathUtils.damp(sideV.current, proj.side, 2, delta);
    const side = sideV.current;

    // Trajectory eases the prism to the recap pose; Contact centers it.
    const home = THREE.MathUtils.smoothstep(trajectory, 0, 1);
    const finale = THREE.MathUtils.smoothstep(contact, 0, 1);
    // Approach beat: the prism "tightens" — sinks under the stat band and
    // shrinks a touch so the figures own the row; released again once the
    // Work beat (and later the Trajectory return) takes over.
    const sink = approach * (1 - work) * (1 - home);
    let targetX = THREE.MathUtils.lerp(
      hero * vw * 0.16 + work * vw * 0.14,
      vw * 0.17,
      home,
    );
    let targetY = THREE.MathUtils.lerp(
      -hero * 0.2 - sink * 0.8 + work * 0.5,
      -0.35,
      home,
    );
    let targetS = THREE.MathUtils.lerp(
      (1 - hero * 0.26) * (1 - 0.14 * sink) * (1 - work * 0.5),
      0.82,
      home,
    );
    // Contact finale: complete the return to true center behind the CTA.
    targetX = THREE.MathUtils.lerp(targetX, 0, finale);
    targetY = THREE.MathUtils.lerp(targetY, 0, finale);
    targetS = THREE.MathUtils.lerp(targetS, 0.92, finale);

    // Projector pose: lower corner opposite the active window. `sweep` peaks
    // as the damped side crosses zero — the prism lifts and tucks slightly
    // mid-crossing, an arc instead of a floor drag.
    const sweep = (1 - side * side) * pj;
    targetX = THREE.MathUtils.lerp(targetX, -side * vw * 0.3, pj);
    targetY = THREE.MathUtils.lerp(targetY, -vh * 0.22 + sweep * vh * 0.05, pj);
    targetS = THREE.MathUtils.lerp(targetS, 0.8 - sweep * 0.06, pj);

    g.position.x = THREE.MathUtils.damp(g.position.x, targetX, 2.5, delta);
    g.position.y = THREE.MathUtils.damp(g.position.y, targetY, 2.5, delta);
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, targetS, 2.5, delta));
  });

  return <group ref={group}>{children}</group>;
}

/**
 * The persistent scene behind the page (ADR-006). Local Lightformers only —
 * drei's Environment *presets* fetch HDRs from a CDN, which the CSP
 * (connect-src 'self') forbids.
 *
 * The tier arrives as a prop — LensRoot owns detection and can hot-swap
 * high→low (FPS watchdog) or back (ADR-009 §3). The Canvas must NOT be
 * keyed on it: dpr/frameloop react to prop changes in place, and a remount
 * would re-run onCreated and drop scene continuity mid-scroll. onSlow is
 * only passed on an auto-selected high tier.
 */
export default function LensScene({
  tier,
  onSlow,
}: {
  tier: FidelityTier;
  onSlow?: () => void;
}) {
  const [finePointer] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: fine)").matches,
  );

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
      {tier === "high" && <ProjectionTracker />}
      {tier === "high" && onSlow && <FpsWatchdog onSlow={onSlow} />}

      <LensRig animated={animated} tier={tier}>
        <TheLens tier={tier} />
        <DataStreams tier={tier} />
      </LensRig>

      {/* WebGL twins of DOM headings/imagery — high tier only; lower tiers
          keep the crisp DOM originals (ADR-006 §8). BakeExcluded keeps the
          near-white twins out of the prism's transmission bake — refracted
          copies of the type inside the glass were half the blow-out
          (ADR-011 Amendment A). */}
      {tier === "high" && (
        <BakeExcluded>
          <KineticTextLayer />
          <GlassImageLayer />
        </BakeExcluded>
      )}

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

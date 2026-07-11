"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial } from "@react-three/drei";
import { lensState } from "./lensState";
import type { FidelityTier } from "@/lib/gpuTier";
import { readLensTuning, type LensTuning } from "@/lib/lensTuning";

const ACCENT = "#3d74ff";
const ACCENT_BRIGHT = "#8fb3ff";
/** Data-core wireframe — the spectrum's cyan end (see SPECTRUM in DataStreams). */
const CORE_CYAN = "#46e3ff";

/**
 * Faux-glass for the low/static tiers: clearcoat + env reflections sell the
 * material without MeshTransmissionMaterial's per-frame scene capture.
 * Toned per ADR-011 §2 — near-mirror clearcoat over full-strength env
 * reflections was the high tier's blow-out by another route.
 */
function FauxGlassMaterial({ tuning }: { tuning: LensTuning }) {
  return (
    <meshPhysicalMaterial
      transparent
      opacity={0.24}
      roughness={0.08}
      metalness={0}
      clearcoat={0.4}
      clearcoatRoughness={0.5}
      envMapIntensity={tuning.fauxEnv}
      color="#bcd0ff"
      depthWrite={false}
    />
  );
}

function LensMaterial({
  tier,
  tuning,
}: {
  tier: FidelityTier;
  tuning: LensTuning;
}) {
  if (tier !== "high") return <FauxGlassMaterial tuning={tuning} />;
  return (
    // Glass, not chrome (ADR-009 §1): env reflections near zero — they were
    // the metallic shimmer that washed out the core and the text in front —
    // with a faint blue body from short-distance accent attenuation. Low
    // roughness/blur keep the refracted image of the data core sharp through
    // the transmission buffer; the dispersion story lives in the beams, so
    // chromatic fringe on the prism itself stays subtle.
    <MeshTransmissionMaterial
      transmission={1}
      thickness={1.15}
      roughness={0.06}
      envMapIntensity={0.03}
      // NOT redundant with envMapIntensity — do not "clean up" (ADR-011 §2).
      // While baking the backside transmission buffer, drei overwrites
      // envMapIntensity with THIS prop (default 1) and bakes with tone
      // mapping off, then restores envMapIntensity for the front draw only.
      // Omitting it re-bakes the buffer we look through at full strength —
      // the white blow-out ADR-009 §1 thought it had fixed.
      backsideEnvMapIntensity={tuning.backsideEnv}
      // Blue, not three.js's default white — highlights resolve mid-blue so
      // near-white DOM text keeps contrast over the glass (ADR-011 §2).
      specularColor={ACCENT_BRIGHT}
      specularIntensity={tuning.specular}
      ior={1.45}
      chromaticAberration={0.05}
      anisotropicBlur={0.12}
      distortion={0.05}
      distortionScale={0.3}
      temporalDistortion={0.02}
      samples={6}
      resolution={768}
      backside
      backsideThickness={0.25}
      attenuationColor={ACCENT_BRIGHT}
      attenuationDistance={2.5}
    />
  );
}

/**
 * The Lens (ADR-006 §1, amended by ADR-008 §3): a dispersion prism that
 * refracts data packets into insight-beams. The prism is the site's constant
 * object — it never transforms. It drifts idly and tilts toward the pointer
 * while LensRig moves it between acts: projector pose during Work, a calm
 * return to center through Trajectory, and the CTA-underline finale at
 * Contact.
 *
 * Static tier renders the same prism at a fixed pose (ADR-006 §8 — no
 * morph, no motion).
 */
export function TheLens({ tier }: { tier: FidelityTier }) {
  const group = useRef<THREE.Group>(null);
  const solid = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const animated = tier !== "static";

  // Temporary calibration knobs (plan-0008 slice 2.2; deleted in 2.3).
  // Reading window here is safe: LensRoot mounts this ssr:false, so it
  // never prerenders.
  const tuning = useMemo(() => readLensTuning(), []);

  // Triangular prism: a 3-segment cylinder turned to face the camera —
  // the classic dispersion silhouette, one long edge up.
  const prismGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(1.32, 1.32, 1.3, 3, 1);
    geo.rotateX(Math.PI / 2);
    geo.rotateZ(Math.PI / 6);
    return geo;
  }, []);

  useFrame((state, delta) => {
    if (!animated) return;
    const g = group.current;
    const s = solid.current;
    if (!g || !s) return;
    const t = state.clock.elapsedTime;

    // Idle drift — constant; there is no beat that interrupts it.
    s.rotation.y += delta * 0.14;
    s.rotation.x = Math.sin(t * 0.2) * 0.12;

    // Pointer-follow tilt on the outer group, critically damped.
    g.rotation.x = THREE.MathUtils.damp(
      g.rotation.x,
      lensState.pointer.y * 0.13,
      2.5,
      delta,
    );
    g.rotation.y = THREE.MathUtils.damp(
      g.rotation.y,
      lensState.pointer.x * 0.2,
      2.5,
      delta,
    );
    g.position.y = Math.sin(t * 0.5) * 0.07;

    // The data core pulses steadily inside the glass.
    if (core.current) {
      core.current.rotation.y = -t * 0.3;
      core.current.rotation.z = t * 0.12;
      core.current.scale.setScalar(1 + Math.sin(t * 1.4) * 0.05);
    }
  });

  return (
    <group ref={group}>
      <group ref={solid} rotation={animated ? undefined : [0.16, 0.55, 0]}>
        <mesh geometry={prismGeo}>
          <LensMaterial tier={tier} tuning={tuning} />
        </mesh>

        {/* Electric data core, refracted through the glass. toneMapped off
            so the wireframe stays hot through the transmission buffer's
            blur + tone mapping instead of washing out. */}
        <mesh ref={core}>
          <icosahedronGeometry args={[0.56, 1]} />
          <meshBasicMaterial
            color={CORE_CYAN}
            wireframe
            transparent
            opacity={1}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Blue kernel glow bleeding through the glass. Deliberately
          position-less — it sits at the prism's core as its internal
          luminance (ADR-011 §2); with env reflections near zero it is the
          main thing keeping the glass from going dark and formless. */}
      <pointLight
        color={ACCENT}
        intensity={tuning.kernelLight}
        distance={5}
        decay={2}
      />
    </group>
  );
}

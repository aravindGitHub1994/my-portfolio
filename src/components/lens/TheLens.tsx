"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial } from "@react-three/drei";
import { lensState } from "./lensState";
import type { FidelityTier } from "@/lib/gpuTier";

const ACCENT = "#3d74ff";
const ACCENT_BRIGHT = "#8fb3ff";
/** Data-core wireframe — the spectrum's cyan end (see SPECTRUM in DataStreams). */
const CORE_CYAN = "#46e3ff";

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

function LensMaterial({ tier }: { tier: FidelityTier }) {
  if (tier !== "high") return <FauxGlassMaterial />;
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
          <LensMaterial tier={tier} />
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

      {/* Blue kernel glow bleeding through the glass */}
      <pointLight color={ACCENT} intensity={2.5} distance={5} decay={2} />
    </group>
  );
}

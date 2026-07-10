"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial, RoundedBox } from "@react-three/drei";
import { lensState } from "./lensState";
import type { FidelityTier } from "@/lib/gpuTier";

const ACCENT = "#3d74ff";
const ACCENT_BRIGHT = "#8fb3ff";

/** Triangle tent around x=c with half-width w — the crystallization beat. */
function tent(x: number, c: number, w: number) {
  return Math.max(0, 1 - Math.abs(x - c) / w);
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

function LensMaterial({ tier }: { tier: FidelityTier }) {
  if (tier !== "high") return <FauxGlassMaterial />;
  return (
    <MeshTransmissionMaterial
      transmission={1}
      thickness={1.4}
      roughness={0.12}
      envMapIntensity={0.7}
      ior={1.45}
      chromaticAberration={0.38}
      anisotropicBlur={0.3}
      distortion={0.14}
      distortionScale={0.3}
      temporalDistortion={0.08}
      samples={6}
      resolution={768}
      backside
      backsideThickness={0.25}
      attenuationColor={ACCENT_BRIGHT}
      attenuationDistance={2.6}
    />
  );
}

/**
 * The Lens (ADR-006 §1): a dispersion prism that refracts data packets into
 * insight-beams. The solid reshapes across the acts — prism through
 * Hero/Approach/Work, **crystallizes into the cube** as Trajectory enters
 * (the payoff beat), then hands off to the particle point-globe at Contact.
 * The swap happens at the bottom of a scale dip, so geometry never pops.
 *
 * Static tier renders the resolved end-state: the crystallized cube at a
 * fixed pose (ADR-006 §8 — no morph, no motion).
 */
export function TheLens({ tier }: { tier: FidelityTier }) {
  const group = useRef<THREE.Group>(null);
  const shapeGroup = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const kernel = useRef<THREE.PointLight>(null);
  const animated = tier !== "static";
  // Which solid is mounted. Only one lives at a time so only one
  // transmission buffer is ever captured per frame.
  const [shape, setShape] = useState<"prism" | "cube">(
    animated ? "prism" : "cube",
  );
  const crystalV = useRef(0);

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
    const sg = shapeGroup.current;
    if (!g || !sg) return;
    const t = state.clock.elapsedTime;
    const { trajectory, contact } = lensState.acts;

    // Damped choreography inputs (raw ScrollTrigger progress is steppy).
    crystalV.current = THREE.MathUtils.damp(
      crystalV.current,
      trajectory,
      4,
      delta,
    );
    const crystal = crystalV.current;
    const beat = tent(crystal, 0.5, 0.24); // 1 at the swap point

    const want = crystal > 0.5 ? "cube" : "prism";
    if (want !== shape) setShape(want);

    // Scale dips to near-zero through the swap; the globe dissolve shrinks
    // the shell away entirely while the particles take over.
    const globeFade = 1 - THREE.MathUtils.smoothstep(contact, 0.12, 0.7);
    const dip = 1 - 0.88 * beat;
    sg.scale.setScalar(Math.max(0.001, dip * globeFade));

    // Idle drift + a spin surge through the crystallization beat.
    sg.rotation.y += delta * (0.14 + beat * 2.2);
    sg.rotation.x = Math.sin(t * 0.2) * 0.12;

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

    // The data core pulses; the kernel light flashes at crystallization.
    if (core.current) {
      core.current.rotation.y = -t * 0.3;
      core.current.rotation.z = t * 0.12;
      core.current.scale.setScalar((1 + Math.sin(t * 1.4) * 0.05) * globeFade);
    }
    if (kernel.current) {
      kernel.current.intensity = (4 + beat * 9) * globeFade;
    }
  });

  return (
    <group ref={group}>
      <group ref={shapeGroup}>
        {shape === "prism" ? (
          <mesh geometry={prismGeo}>
            <LensMaterial tier={tier} />
          </mesh>
        ) : (
          <RoundedBox
            args={[1.8, 1.8, 1.8]}
            radius={0.09}
            smoothness={8}
            rotation={animated ? undefined : [0.35, 0.65, 0]}
          >
            <LensMaterial tier={tier} />
          </RoundedBox>
        )}

        {/* Electric data core, refracted through the glass */}
        <mesh ref={core}>
          <icosahedronGeometry args={[0.46, 1]} />
          <meshBasicMaterial
            color={ACCENT}
            wireframe
            transparent
            opacity={0.9}
          />
        </mesh>
      </group>

      {/* Blue kernel glow bleeding through the glass */}
      <pointLight
        ref={kernel}
        color={ACCENT}
        intensity={4}
        distance={5}
        decay={2}
      />
    </group>
  );
}

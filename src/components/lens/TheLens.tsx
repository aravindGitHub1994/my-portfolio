"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial, useFBO } from "@react-three/drei";
import { lensState } from "./lensState";
import { hideBakeExclusions, restoreBakeExclusions } from "./bakeExclusions";
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

/** Shared by the JSX props and the bake's per-pass overrides below. */
const GLASS_THICKNESS = 1.15;
const BACKSIDE_THICKNESS = 0.25;
/** Front-draw env reflections — near zero per ADR-009 §1. */
const FRONT_ENV_INTENSITY = 0.03;
const BAKE_RESOLUTION = 768;

/** drei types the forwarded ref as the element props type; the runtime
 *  instance is the material impl — a MeshPhysicalMaterial subclass whose
 *  `buffer` is uniform-backed. */
type TransmissionImpl = THREE.MeshPhysicalMaterial & {
  buffer: THREE.Texture;
};

/**
 * High-tier glass with an OWNED transmission bake (ADR-011 Amendment A).
 *
 * drei's built-in bake captures the whole scene into the buffer the glass
 * refracts — including the kinetic text twins in front of the prism and the
 * additive beam/blade convergence at its mouth — with tone mapping off, and
 * transmitted content has no intensity knob anywhere in the material. That
 * baked content, not env reflections, was the blow-out that survived every
 * calibration value. Passing `buffer` disables drei's internal bake; the
 * frame loop below repeats its exact pass order
 * (MeshTransmissionMaterial.js:348–375) with everything in the
 * bakeExclusions registry hidden, so the glass refracts only the data core,
 * the environment and the page darkness — streams and type still draw over
 * the glass on screen, they just never appear inside it.
 */
function HighGlass({
  geometry,
  tuning,
}: {
  geometry: THREE.BufferGeometry;
  tuning: LensTuning;
}) {
  // The mesh is owned HERE, not by TheLens — the bake swaps its material
  // every frame, and the React compiler only sanctions frame-loop mutation
  // of locally-owned refs (never props).
  const prism = useRef<THREE.Mesh>(null);
  const material = useRef<TransmissionImpl | null>(null);
  const fboBack = useFBO(BAKE_RESOLUTION);
  const fboMain = useFBO(BAKE_RESOLUTION);
  // Degenerate vertices — the prism rasterizes nothing in pass 1.
  const discardMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: "void main() { gl_Position = vec4(0.0); }",
        fragmentShader: "void main() { discard; }",
      }),
    [],
  );
  useEffect(() => () => discardMat.dispose(), [discardMat]);

  useFrame((state) => {
    const m = prism.current;
    const mat = material.current;
    if (!m || !mat) return;
    const gl = state.gl;
    const oldTone = gl.toneMapping;
    // Bake unmapped, like drei — only the final draw tone maps.
    gl.toneMapping = THREE.NoToneMapping;
    hideBakeExclusions();
    // Pass 1: the scene minus the prism.
    m.material = discardMat;
    gl.setRenderTarget(fboBack);
    gl.render(state.scene, state.camera);
    // Pass 2: the prism's back faces transmitting pass 1. envMapIntensity
    // HERE is the drei trap that defeated ADR-009 §1 — its internal bake
    // overwrote the authored near-zero with a default 1 (ADR-011 §2).
    // Owning the pass makes the backside intensity an explicit knob.
    m.material = mat;
    mat.buffer = fboBack.texture;
    mat.thickness = BACKSIDE_THICKNESS;
    mat.side = THREE.BackSide;
    mat.envMapIntensity = tuning.backsideEnv;
    gl.setRenderTarget(fboMain);
    gl.render(state.scene, state.camera);
    // Final on-screen draw: front faces transmitting pass 2.
    mat.buffer = fboMain.texture;
    mat.thickness = GLASS_THICKNESS;
    mat.side = THREE.FrontSide;
    mat.envMapIntensity = FRONT_ENV_INTENSITY;
    restoreBakeExclusions();
    gl.setRenderTarget(null);
    gl.toneMapping = oldTone;
  });

  return (
    <mesh ref={prism} geometry={geometry}>
      {/* Glass, not chrome (ADR-009 §1): env reflections near zero — they
          were the metallic shimmer that washed out the core and the text in
          front — with a faint blue body from short-distance accent
          attenuation. Low roughness/blur keep the refracted image of the
          data core sharp through the transmission buffer; the dispersion
          story lives in the beams, so chromatic fringe on the prism itself
          stays subtle. */}
      <MeshTransmissionMaterial
        ref={(m: unknown) => {
          material.current = m as TransmissionImpl | null;
        }}
        // Our buffer — its presence is what disables drei's internal bake.
        buffer={fboMain.texture}
        transmission={1}
        thickness={GLASS_THICKNESS}
        roughness={0.06}
        envMapIntensity={FRONT_ENV_INTENSITY}
        // Blue, not three.js's default white — highlights resolve mid-blue
        // so near-white DOM text keeps contrast over the glass (ADR-011 §2).
        specularColor={ACCENT_BRIGHT}
        specularIntensity={tuning.specular}
        ior={1.45}
        chromaticAberration={0.05}
        anisotropicBlur={0.12}
        distortion={0.05}
        distortionScale={0.3}
        temporalDistortion={0.02}
        samples={6}
        // Only sizes drei's internal FBOs, which the `buffer` prop idles —
        // kept tiny so they hold no VRAM. Ours are BAKE_RESOLUTION.
        resolution={2}
        attenuationColor={ACCENT_BRIGHT}
        attenuationDistance={2.5}
      />
    </mesh>
  );
}

/** The prism solid — each tier's material owns its mesh so the high tier's
 *  bake can swap materials on a locally-owned ref. */
function PrismSolid({
  tier,
  tuning,
  geometry,
}: {
  tier: FidelityTier;
  tuning: LensTuning;
  geometry: THREE.BufferGeometry;
}) {
  if (tier !== "high") {
    return (
      <mesh geometry={geometry}>
        <FauxGlassMaterial tuning={tuning} />
      </mesh>
    );
  }
  return <HighGlass geometry={geometry} tuning={tuning} />;
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
        <PrismSolid tier={tier} tuning={tuning} geometry={prismGeo} />

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

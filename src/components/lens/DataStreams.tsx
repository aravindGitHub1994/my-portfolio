"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { lensState } from "./lensState";
import type { FidelityTier } from "@/lib/gpuTier";

/**
 * Particle streams around the Lens (ADR-006 §1): dim raw **data packets**
 * flow in from the upper-left, and ordered, spectrum-colored **insight-beams**
 * fan out the far side. Deliberately stateless — every particle's position is
 * a pure function of (time, seed) evaluated in the vertex shader, so there is
 * no GPGPU ping-pong to pay for and the low tier just lowers the counts
 * (plan 0004, deviation 2).
 *
 * Choreography (all damped):
 *   approach — the chromatic fan straightens into ordered parallel beams
 *   work     — everything dims/recedes so the image planes own the stage
 *   traject. — beams retract into the crystallizing cube
 *   contact  — beam particles dissolve onto a turning point-globe (finale)
 */

/** Dispersion ramp: cyan → electric blue → violet (design-system accents). */
const SPECTRUM = ["#46e3ff", "#5c8aff", "#3d74ff", "#6f6bff", "#8b5cf6"];
const BEAMS = SPECTRUM.length;

/** Beam k fan/ordered angles — keep in sync with the GLSL in beamVertex. */
const beamAngle = (k: number, organized: number) =>
  THREE.MathUtils.lerp(-0.15 - 0.24 * (k - 2), -0.1 - 0.06 * (k - 2), organized);

const inflowVertex = /* glsl */ `
  uniform float uTime;
  uniform float uRecede;
  uniform float uGlobe;
  uniform float uDpr;
  attribute float aSeed;
  attribute vec3 aJitter;
  varying float vFade;

  void main() {
    float speed = mix(0.09, 0.2, fract(aSeed * 7.31));
    float t = fract(uTime * speed + aSeed);
    // Quadratic bezier: scattered upper-left field -> the lens mouth.
    vec3 p0 = vec3(-7.5 + aJitter.x * 2.4, 2.4 + aJitter.y * 1.8, aJitter.z * 1.4);
    vec3 c  = vec3(-2.8, 0.6 + aJitter.y * 0.5, aJitter.z * 0.7);
    vec3 p1 = vec3(-0.4, 0.0, 0.0);
    vec3 pos = mix(mix(p0, c, t), mix(c, p1, t), t);
    pos += aJitter * 0.22 * (1.0 - t) * sin(uTime * 2.0 + aSeed * 40.0);
    vFade = smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.85, 1.0, t));
    vFade *= (1.0 - uGlobe) * mix(1.0, 0.35, uRecede);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    // Pixel-sized packets: 7.0 = camera distance, so the factor is 1 at the
    // lens plane and only mildly attenuates with depth.
    gl_PointSize = (2.2 + fract(aSeed * 3.7) * 2.4) * uDpr * (7.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const beamVertex = /* glsl */ `
  uniform float uTime;
  uniform float uApproach;
  uniform float uRecede;
  uniform float uCrystal;
  uniform float uGlobe;
  uniform float uDpr;
  attribute float aSeed;
  attribute float aBeam;
  attribute vec3 aSphere;
  attribute vec3 aColor;
  varying float vFade;
  varying vec3 vColor;

  void main() {
    float k = aBeam - 2.0;
    // Fan -> ordered lines; keep in sync with beamAngle() in DataStreams.tsx.
    float ang = mix(-0.15 - 0.24 * k, -0.10 - 0.06 * k, uApproach);
    vec2 dir = vec2(cos(ang), sin(ang));
    float speed = mix(0.14, 0.28, fract(aSeed * 5.13));
    float t = fract(uTime * speed + aSeed);
    // Crystallization retracts the beams into the solid.
    float travel = mix(6.2, 1.3, uCrystal);
    vec3 pos = vec3(0.4, 0.0, 0.0) + vec3(dir * (0.25 + t * travel), 0.0);
    pos.z += (fract(aSeed * 9.7) - 0.5) * 0.4;
    float spread = mix(0.34, 0.1, uApproach);
    pos.xy += vec2(-dir.y, dir.x) * (fract(aSeed * 3.3) - 0.5) * spread;
    // Contact finale: beams dissolve onto a slowly turning point-globe.
    float g = smoothstep(0.0, 1.0, uGlobe);
    float ca = cos(uTime * 0.22);
    float sa = sin(uTime * 0.22);
    vec3 sp = aSphere * 1.7;
    sp.xz = mat2(ca, -sa, sa, ca) * sp.xz;
    pos = mix(pos, sp, g);
    float beamFade = smoothstep(0.0, 0.06, t) * (1.0 - smoothstep(0.72, 1.0, t));
    vFade = mix(beamFade * mix(1.0, 0.3, uRecede), 0.85, g);
    vColor = mix(aColor, vec3(0.24, 0.455, 1.0), max(uCrystal * 0.6, g * 0.4));
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    // Pixel-sized (see inflowVertex) — beams read as streams, not fog.
    gl_PointSize = (2.4 + fract(aSeed * 4.1) * 2.6) * uDpr * (7.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const pointFragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float disc = smoothstep(0.5, 0.12, d);
    gl_FragColor = vec4(uColor, disc * vFade);
  }
`;

const beamPointFragment = /* glsl */ `
  varying float vFade;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float disc = smoothstep(0.5, 0.12, d);
    gl_FragColor = vec4(vColor, disc * vFade);
  }
`;

const bladeFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAlpha;
  varying vec2 vUv;
  void main() {
    float along = pow(1.0 - vUv.x, 1.7);
    float across = pow(max(0.0, 1.0 - abs(vUv.y - 0.5) * 2.0), 1.6);
    gl_FragColor = vec4(uColor, along * across * uAlpha);
  }
`;

const bladeVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Deterministic PRNG (mulberry32) — geometry attributes must be a pure
 * function of their seed so re-renders are idempotent (react-hooks/purity).
 */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeSeeds(count: number, seed: number) {
  const rand = mulberry32(seed);
  const out = new Float32Array(count);
  for (let i = 0; i < count; i += 1) out[i] = rand();
  return out;
}

export function DataStreams({ tier }: { tier: FidelityTier }) {
  const animated = tier !== "static";
  const inflowCount = tier === "high" ? 800 : 260;
  const beamCount = tier === "high" ? 1500 : 480;

  const dpr = Math.min(
    typeof window === "undefined" ? 1 : window.devicePixelRatio,
    2,
  );

  const inflowGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const rand = mulberry32(1013904223);
    const jitter = new Float32Array(inflowCount * 3);
    for (let i = 0; i < inflowCount * 3; i += 1) jitter[i] = rand() * 2 - 1;
    geo.setAttribute(
      "aSeed",
      new THREE.BufferAttribute(makeSeeds(inflowCount, 7411), 1),
    );
    geo.setAttribute("aJitter", new THREE.BufferAttribute(jitter, 3));
    // Positions come entirely from the vertex shader; the attribute only
    // sizes the draw call. Huge static bounding sphere avoids culling.
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(inflowCount * 3), 3),
    );
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);
    return geo;
  }, [inflowCount]);

  const beamGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const beam = new Float32Array(beamCount);
    const color = new Float32Array(beamCount * 3);
    const sphere = new Float32Array(beamCount * 3);
    const c = new THREE.Color();
    // Fibonacci sphere so the point-globe reads evenly at any count.
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < beamCount; i += 1) {
      const k = i % BEAMS;
      beam[i] = k;
      c.set(SPECTRUM[k]);
      color[i * 3] = c.r;
      color[i * 3 + 1] = c.g;
      color[i * 3 + 2] = c.b;
      const y = 1 - (i / (beamCount - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const th = golden * i;
      sphere[i * 3] = Math.cos(th) * r;
      sphere[i * 3 + 1] = y;
      sphere[i * 3 + 2] = Math.sin(th) * r;
    }
    geo.setAttribute(
      "aSeed",
      new THREE.BufferAttribute(makeSeeds(beamCount, 90210), 1),
    );
    geo.setAttribute("aBeam", new THREE.BufferAttribute(beam, 1));
    geo.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
    geo.setAttribute("aSphere", new THREE.BufferAttribute(sphere, 3));
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(beamCount * 3), 3),
    );
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);
    return geo;
  }, [beamCount]);

  useEffect(
    () => () => {
      inflowGeo.dispose();
      beamGeo.dispose();
    },
    [inflowGeo, beamGeo],
  );

  const inflowUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRecede: { value: 0 },
      uGlobe: { value: 0 },
      uDpr: { value: dpr },
      uColor: { value: new THREE.Color("#93a7cd") },
    }),
    [dpr],
  );

  const beamUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uApproach: { value: 0 },
      uRecede: { value: 0 },
      uCrystal: { value: 0 },
      uGlobe: { value: 0 },
      uDpr: { value: dpr },
    }),
    [dpr],
  );

  // One thin additive gradient plane per beam — the visible light blades.
  const bladeGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.translate(0.5, 0, 0); // origin at the blade root
    return geo;
  }, []);
  const bladeMats = useMemo(
    () =>
      SPECTRUM.map(
        (hex) =>
          new THREE.ShaderMaterial({
            uniforms: {
              uColor: { value: new THREE.Color(hex) },
              uAlpha: { value: tier === "high" ? 0.2 : 0.14 },
            },
            vertexShader: bladeVertex,
            fragmentShader: bladeFragment,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }),
      ),
    [tier],
  );
  useEffect(
    () => () => {
      bladeGeo.dispose();
      bladeMats.forEach((m) => m.dispose());
    },
    [bladeGeo, bladeMats],
  );
  const bladeRefs = useRef<(THREE.Mesh | null)[]>([]);
  // Frame-time uniform writes go through material refs, never through the
  // memoized uniform objects (react-hooks/immutability).
  const inflowMat = useRef<THREE.ShaderMaterial>(null);
  const beamMat = useRef<THREE.ShaderMaterial>(null);

  // Damped choreography values shared by uniforms + blade transforms.
  const visual = useRef({ approach: 0, recede: 0, crystal: 0, globe: 0 });

  // Static tier: settle the composition once — cube + ordered beams, no loop.
  useEffect(() => {
    if (animated) return;
    bladeRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.rotation.z = beamAngle(i, 1);
      mesh.scale.set(5.2, 0.26, 1);
      (mesh.material as THREE.ShaderMaterial).uniforms.uAlpha.value = 0.12;
    });
  }, [animated]);

  useFrame((state, delta) => {
    if (!animated) return;
    const t = state.clock.elapsedTime;
    const v = visual.current;
    const acts = lensState.acts;
    v.approach = THREE.MathUtils.damp(v.approach, acts.approach, 3.5, delta);
    v.recede = THREE.MathUtils.damp(v.recede, acts.work, 3.5, delta);
    v.crystal = THREE.MathUtils.damp(v.crystal, acts.trajectory, 4, delta);
    v.globe = THREE.MathUtils.damp(v.globe, acts.contact, 3.5, delta);

    const iu = inflowMat.current?.uniforms;
    if (iu) {
      iu.uTime.value = t;
      iu.uRecede.value = v.recede;
      iu.uGlobe.value = v.globe;
    }
    const bu = beamMat.current?.uniforms;
    if (bu) {
      bu.uTime.value = t;
      bu.uApproach.value = v.approach;
      bu.uRecede.value = v.recede;
      bu.uCrystal.value = v.crystal;
      bu.uGlobe.value = v.globe;
    }

    const len = 5.6 * (1 - 0.72 * v.crystal);
    const alpha =
      (tier === "high" ? 0.2 : 0.14) *
      (1 - 0.65 * v.recede) *
      (1 - v.globe);
    bladeRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.rotation.z = beamAngle(i, v.approach);
      mesh.scale.set(len, 0.26, 1);
      (mesh.material as THREE.ShaderMaterial).uniforms.uAlpha.value = alpha;
    });
  });

  return (
    <group>
      {animated && (
        <points geometry={inflowGeo} frustumCulled={false}>
          <shaderMaterial
            ref={inflowMat}
            uniforms={inflowUniforms}
            vertexShader={inflowVertex}
            fragmentShader={pointFragment}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}
      {animated && (
        <points geometry={beamGeo} frustumCulled={false}>
          <shaderMaterial
            ref={beamMat}
            uniforms={beamUniforms}
            vertexShader={beamVertex}
            fragmentShader={beamPointFragment}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}
      <group position={[0.4, 0, 0]}>
        {SPECTRUM.map((hex, i) => (
          <mesh
            key={hex}
            ref={(m) => {
              bladeRefs.current[i] = m;
            }}
            geometry={bladeGeo}
            material={bladeMats[i]}
            rotation-z={beamAngle(i, animated ? 0 : 1)}
            scale={[5.6, 0.26, 1]}
          />
        ))}
      </group>
    </group>
  );
}

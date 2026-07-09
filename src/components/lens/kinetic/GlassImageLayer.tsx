"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import {
  claimKineticLayer,
  getKineticTargets,
  subscribeKinetic,
  type KineticTarget,
} from "./registry";
import { layoutPlaneToRect } from "./layout";
import { lensState } from "../lensState";

/** Behind the type layer, still in front of the Lens solid. */
const PLANE_Z = 2.3;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Image planes distort subtly (idle refraction wave + velocity aberration)
// and SNAP CRISP when their project is centered (ADR-006 §5 — uCrisp → 1
// zeroes every offset, resolving distortion vs. legibility).
const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uCrisp;
  uniform float uShear;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    float d = 1.0 - uCrisp;
    uv.x += (uv.y - 0.5) * uShear * 0.05 * d;
    uv += vec2(
      sin(uv.y * 9.0 + uTime * 1.3),
      sin(uv.x * 7.0 + uTime * 1.05)
    ) * 0.008 * d;
    vec2 ca = vec2(0.006 * d + abs(uShear) * 0.005, 0.0);
    vec4 cr = texture2D(uMap, uv + ca);
    vec4 cg = texture2D(uMap, uv);
    vec4 cb = texture2D(uMap, uv - ca);
    gl_FragColor = vec4(cr.r, cg.g, cb.b, cg.a);
  }
`;

function GlassPlane({ target }: { target: KineticTarget }) {
  const { camera, size } = useThree();
  const mesh = useRef<THREE.Mesh>(null);
  // Frame-time uniform writes go through the material ref, never through
  // the memoized uniforms object (react-hooks/immutability).
  const material = useRef<THREE.ShaderMaterial>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const crisp = useRef({ value: 0 });
  const shear = useRef(0);

  useEffect(() => {
    const img = target.el as HTMLImageElement;
    let disposed = false;
    let tex: THREE.Texture | null = null;
    const loader = new THREE.TextureLoader();
    loader.load(img.currentSrc || img.src, (t) => {
      if (disposed) {
        t.dispose();
        return;
      }
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      tex = t;
      setTexture(t);
    });
    return () => {
      disposed = true;
      tex?.dispose();
    };
  }, [target]);

  // Centered/active → snap crisp; drifting off-center → melt back.
  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => {
        gsap.to(crisp.current, {
          value: entry.isIntersecting ? 1 : 0,
          duration: entry.isIntersecting ? 0.7 : 1.1,
          ease: "power2.out",
          overwrite: true,
        });
      },
      { rootMargin: "-32% 0px -32% 0px" },
    );
    io.observe(target.el);
    return () => io.disconnect();
  }, [target]);

  const uniforms = useMemo(
    () => ({
      uMap: { value: null as THREE.Texture | null },
      uTime: { value: 0 },
      uCrisp: { value: 0 },
      uShear: { value: 0 },
    }),
    [],
  );

  useFrame((state, delta) => {
    const m = mesh.current;
    const u = material.current?.uniforms;
    if (!m || !u || !texture) return;
    u.uMap.value = texture;
    u.uTime.value = state.clock.elapsedTime;
    u.uCrisp.value = crisp.current.value;
    shear.current = THREE.MathUtils.damp(
      shear.current,
      lensState.scrollVelocity,
      6,
      delta,
    );
    u.uShear.value = THREE.MathUtils.clamp(shear.current * 0.4, -1, 1);
    layoutPlaneToRect(
      m,
      target.el.getBoundingClientRect(),
      0,
      camera as THREE.PerspectiveCamera,
      size,
      PLANE_Z,
    );
  });

  if (!texture) return null;
  return (
    <mesh ref={mesh}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

/** GL side of GlassImage. High tier only — low tiers keep the crisp <img>. */
export function GlassImageLayer() {
  const [targets, setTargets] = useState<KineticTarget[]>(() =>
    getKineticTargets("image"),
  );

  useEffect(() => {
    // Subscribe first — the claim below notifies straight back through it.
    const unsubscribe = subscribeKinetic(() =>
      setTargets(getKineticTargets("image")),
    );
    const release = claimKineticLayer("image");
    return () => {
      release();
      unsubscribe();
    };
  }, []);

  return (
    <>
      {targets.map((t) => (
        <GlassPlane key={t.id} target={t} />
      ))}
    </>
  );
}

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
import { rasterizeText, type TextRaster } from "./rasterize";
import { layoutPlaneToRect } from "./layout";
import { lensState } from "../lensState";

/** In front of the Lens solid (max radius ~1.5) so glass never occludes type. */
const PLANE_Z = 2.6;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Refract-in assembly (ADR-006 §3): the glyph field starts as displaced
// chromatic shards (blocky RGB-split offsets), each shard gating in on its
// own threshold as progress rises, settling to the crisp letterform.
// Scroll velocity shears/aberrates the settled text.
const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uProgress;
  uniform float uShear;
  uniform float uSeed;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv;
    float p = uProgress;
    float shard = 1.0 - p;

    // Velocity shear: skew along x by vertical position.
    uv.x += (uv.y - 0.5) * uShear * 0.10;

    vec2 cell = floor(vUv * vec2(12.0, 3.0) + uSeed);
    vec2 rnd = vec2(hash(cell), hash(cell + 7.3)) - 0.5;
    vec2 off = rnd * shard * shard * vec2(0.30, 0.45);
    float gateT = hash(cell + 3.1) * 0.6;
    float gate = smoothstep(gateT, gateT + 0.35, p);

    vec2 suv = uv + off;
    vec2 ca = vec2(0.014 * shard + abs(uShear) * 0.010, 0.0);
    vec4 cr = texture2D(uMap, suv + ca);
    vec4 cg = texture2D(uMap, suv);
    vec4 cb = texture2D(uMap, suv - ca);
    float a = max(cr.a, max(cg.a, cb.a)) * gate;
    if (a < 0.004) discard;
    gl_FragColor = vec4(cr.r, cg.g, cb.b, a);
  }
`;

function KineticPlane({ target }: { target: KineticTarget }) {
  const { camera, size } = useThree();
  const mesh = useRef<THREE.Mesh>(null);
  // Frame-time uniform writes go through the material ref, never through
  // the memoized uniforms object (react-hooks/immutability).
  const material = useRef<THREE.ShaderMaterial>(null);
  const [raster, setRaster] = useState<TextRaster | null>(null);
  const progress = useRef({ value: 0 });
  const shear = useRef(0);

  const texture = useMemo(() => {
    if (!raster) return null;
    const tex = new THREE.CanvasTexture(raster.canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.anisotropy = 4;
    return tex;
  }, [raster]);
  useEffect(() => () => texture?.dispose(), [texture]);

  // Rasterize on mount + whenever the element resizes or its text mutates
  // (count-up stats change digits without resizing — the DOM stays the
  // source of truth). Observer bursts coalesce to one raster per frame.
  useEffect(() => {
    const el = target.el;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    const build = () => setRaster(rasterizeText(el, dpr));
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        build();
      });
    };
    build();
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    const mo = new MutationObserver(schedule);
    mo.observe(el, { characterData: true, childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
    };
  }, [target]);

  // Refract-in once, on entry.
  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        gsap.to(progress.current, {
          value: 1,
          duration: 1.2,
          ease: "power3.out",
        });
        io.disconnect();
      },
      { threshold: 0.3 },
    );
    io.observe(target.el);
    return () => io.disconnect();
  }, [target]);

  const uniforms = useMemo(
    () => ({
      uMap: { value: null as THREE.Texture | null },
      uProgress: { value: 0 },
      uShear: { value: 0 },
      uSeed: { value: (target.id % 17) * 3.7 },
    }),
    [target.id],
  );

  useFrame((_, delta) => {
    const m = mesh.current;
    const u = material.current?.uniforms;
    if (!m || !u || !raster || !texture) return;
    u.uMap.value = texture;
    u.uProgress.value = progress.current.value;
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
      raster.pad,
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

/**
 * GL side of the kinetic type system. Mounts on the high tier only; claims
 * the "text" kind (hiding the DOM originals) strictly AFTER document.fonts
 * resolves, so rasters never use a fallback font.
 */
export function KineticTextLayer() {
  const [targets, setTargets] = useState<KineticTarget[]>([]);
  const fontsReady = useRef(false);

  useEffect(() => {
    let mounted = true;
    let release: (() => void) | null = null;
    const sync = () => {
      if (fontsReady.current) setTargets(getKineticTargets("text"));
    };
    // Subscribe first — the claim below notifies straight back through sync.
    const unsubscribe = subscribeKinetic(sync);
    document.fonts.ready.then(() => {
      if (!mounted) return;
      fontsReady.current = true;
      release = claimKineticLayer("text");
    });
    return () => {
      mounted = false;
      release?.();
      unsubscribe();
    };
  }, []);

  return (
    <>
      {targets.map((t) => (
        <KineticPlane key={t.id} target={t} />
      ))}
    </>
  );
}

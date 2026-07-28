"use client";

// Atmosphere garnish (plan-0009 §2.2): dust motes drifting in the window
// shaft + faked light-shaft billboards. No fog, no true volumetrics
// (ADR-012 §2). Everything sits behind the sheddable flags and the detail
// level; the drift loop reuses preallocated arrays — zero per-frame
// allocation.

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Group,
  MeshBasicMaterial,
  PlaneGeometry,
  Points,
  PointsMaterial,
  SRGBColorSpace,
} from "three";
import { mulberry32 } from "@/lib/prng";
import { effectsState } from "./sheddable";

/** Drift volume: the window shaft, not the whole room. */
const BOUNDS = {
  minX: 0.65,
  maxX: 1.95,
  minY: 0.35,
  maxY: 1.85,
  minZ: -0.8,
  maxZ: 0.35,
} as const;

function moteTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.5, "rgba(255,255,255,0.4)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
  }
  return new CanvasTexture(canvas);
}

function shaftTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 128, 0);
    g.addColorStop(0, "rgba(190,205,255,0.55)");
    g.addColorStop(0.7, "rgba(190,205,255,0.16)");
    g.addColorStop(1, "rgba(190,205,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function Atmosphere({ detail = "high" }: { detail?: "low" | "high" }) {
  const points = useRef<Points>(null);
  const shafts = useRef<Group>(null);

  const dust = useMemo(() => {
    const count = detail === "high" ? 260 : 90;
    const rnd = mulberry32(0x44555354);
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = BOUNDS.minX + rnd() * (BOUNDS.maxX - BOUNDS.minX);
      positions[i * 3 + 1] = BOUNDS.minY + rnd() * (BOUNDS.maxY - BOUNDS.minY);
      positions[i * 3 + 2] = BOUNDS.minZ + rnd() * (BOUNDS.maxZ - BOUNDS.minZ);
      velocities[i * 3] = -0.008 - rnd() * 0.02;
      velocities[i * 3 + 1] = (rnd() - 0.5) * 0.012;
      velocities[i * 3 + 2] = (rnd() - 0.5) * 0.012;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    const map = moteTexture();
    const material = new PointsMaterial({
      color: "#cdd7f5",
      size: 0.0045,
      map,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: AdditiveBlending,
      sizeAttenuation: true,
    });
    return { geometry, material, map, velocities, count };
  }, [detail]);

  const shaftAssets = useMemo(() => {
    const texture = shaftTexture();
    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.07,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    });
    const geometry = new PlaneGeometry(1.4, 0.55);
    return { texture, material, geometry };
  }, []);

  useEffect(() => {
    const { geometry, material, map } = dust;
    const assets = shaftAssets;
    return () => {
      geometry.dispose();
      material.dispose();
      map.dispose();
      assets.geometry.dispose();
      assets.material.dispose();
      assets.texture.dispose();
    };
  }, [dust, shaftAssets]);

  useFrame((_, delta) => {
    const mesh = points.current;
    if (mesh) {
      mesh.visible = effectsState.dust;
      if (mesh.visible) {
        const attribute = mesh.geometry.getAttribute(
          "position",
        ) as BufferAttribute;
        const positions = attribute.array as Float32Array;
        const { velocities, count } = dust;
        for (let i = 0; i < count; i++) {
          let x = positions[i * 3] + velocities[i * 3] * delta;
          let y = positions[i * 3 + 1] + velocities[i * 3 + 1] * delta;
          let z = positions[i * 3 + 2] + velocities[i * 3 + 2] * delta;
          if (x < BOUNDS.minX) x = BOUNDS.maxX;
          if (y < BOUNDS.minY) y = BOUNDS.maxY;
          else if (y > BOUNDS.maxY) y = BOUNDS.minY;
          if (z < BOUNDS.minZ) z = BOUNDS.maxZ;
          else if (z > BOUNDS.maxZ) z = BOUNDS.minZ;
          positions[i * 3] = x;
          positions[i * 3 + 1] = y;
          positions[i * 3 + 2] = z;
        }
        attribute.needsUpdate = true;
      }
    }
    if (shafts.current) shafts.current.visible = effectsState.shafts;
  });

  return (
    <>
      <points ref={points} geometry={dust.geometry} material={dust.material} />
      {/* Two crossed billboards angling down-room from the window. */}
      <group ref={shafts} position={[1.5, 1.2, -0.25]} rotation={[0, 0.25, -0.4]}>
        <mesh geometry={shaftAssets.geometry} material={shaftAssets.material} />
        <mesh
          geometry={shaftAssets.geometry}
          material={shaftAssets.material}
          rotation={[Math.PI / 2.6, 0, 0]}
        />
      </group>
    </>
  );
}

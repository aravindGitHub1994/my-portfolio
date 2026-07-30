"use client";

// Atmosphere garnish (plan-0009 §2.2): faked light-shaft billboards from
// the window. No fog, no true volumetrics (ADR-012 §2). Sits behind the
// sheddable flags.
//
// **The dust motes are gone (ADR-014 §5).** The owner's words at gate 10.1
// §2.6 were "need to remove dust and replace with a tall lamp in the
// corner": a drifting mote cloud in a dusk room read as noise rather than
// as air. The lamp is a separate object — `builders/lamp.ts` for the shape
// and `Lighting.tsx` for the light, because no builder in this codebase
// returns a light and the lamp has to ride `duskDeepen` with the others.
//
// The `detail` prop went with the motes: it only ever chose between 260
// and 90 of them, and a prop that does nothing is worse than no prop.
// **The shed ladder is nine rungs now**, not ten — `dust` was rung 2 and
// its subject no longer exists.

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  CanvasTexture,
  DoubleSide,
  Group,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
} from "three";
import { effectsState } from "./sheddable";

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

export function Atmosphere() {
  const shafts = useRef<Group>(null);

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
    const assets = shaftAssets;
    return () => {
      assets.geometry.dispose();
      assets.material.dispose();
      assets.texture.dispose();
    };
  }, [shaftAssets]);

  useFrame(() => {
    if (shafts.current) shafts.current.visible = effectsState.shafts;
  });

  return (
    /* Two crossed billboards angling down-room from the window. */
    <group ref={shafts} position={[1.5, 1.2, -0.25]} rotation={[0, 0.25, -0.4]}>
      <mesh geometry={shaftAssets.geometry} material={shaftAssets.material} />
      <mesh
        geometry={shaftAssets.geometry}
        material={shaftAssets.material}
        rotation={[Math.PI / 2.6, 0, 0]}
      />
    </group>
  );
}

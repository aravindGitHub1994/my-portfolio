// Skin albedo bakes (plan-0009 §1.3): warm brown base with subtle
// mottle, generated ONCE at figure build — no per-frame canvas work.
// The right forearm gets its own canvas with the tattoo art composited
// (tattoos.ts). Client-only; call inside the ssr:false tree.

import { CanvasTexture, MeshStandardMaterial, SRGBColorSpace } from "three";
import { mulberry32 } from "@/lib/prng";
import { drawTattoos } from "./tattoos";

const SKIN_BASE = "#8a5a3c";
const SKIN_ROUGHNESS = 0.82;

function skinCanvas(size: number, seed: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const rnd = mulberry32(seed ^ 0x534b494e);
    ctx.fillStyle = SKIN_BASE;
    ctx.fillRect(0, 0, size, size);
    // Mottle: soft darker/lighter blots.
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = rnd() > 0.5 ? "#815336" : "#936143";
      ctx.globalAlpha = 0.12;
      ctx.beginPath();
      ctx.arc(rnd() * size, rnd() * size, 4 + rnd() * 14, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  return canvas;
}

export function createSkinMaterial(seed: number): MeshStandardMaterial {
  const texture = new CanvasTexture(skinCanvas(256, seed));
  texture.colorSpace = SRGBColorSpace;
  return new MeshStandardMaterial({ map: texture, roughness: SKIN_ROUGHNESS });
}

/** Right-forearm albedo: skin base + the tattoo sleeve composited in. */
export function createForearmMaterial(seed: number): MeshStandardMaterial {
  const canvas = skinCanvas(512, seed ^ 0x54415454);
  const ctx = canvas.getContext("2d");
  if (ctx) drawTattoos(ctx, 512);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return new MeshStandardMaterial({ map: texture, roughness: SKIN_ROUGHNESS });
}

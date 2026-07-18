"use client";

// The real CRT screen feed (plan-0009 §3.1) — replaces the 2.2 harness
// ScreenTestPattern. Owns the painter canvas + CanvasTexture + CRT shader
// on the room's "crtScreen" mesh, repaints ON STATE CHANGE ONLY
// (win98State subscription — no painter work in useFrame), and writes the
// screenLight singleton each frame so the 2.2 Lighting rig keeps casting.
// Brightness contract (gate 2.3): luminance written here is capped at
// 0.7 — the Lighting CAST_MAX clamp is the second belt.

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CanvasTexture,
  LinearFilter,
  SRGBColorSpace,
  type Group,
  type Material,
  type Mesh,
} from "three";
import {
  DESKTOP_H,
  DESKTOP_W,
  subscribeWin98,
  win98State,
} from "@/lib/win98State";
import { startBoot, type BootController } from "@/lib/bootSequencer";
import { paintScreen } from "@/components/win98/painter";
import { screenLight } from "../scene/screenLight";
import { createCrtMaterial, type CrtUniforms } from "./crtShader";

/** Luminance ceiling — the gate-2.3 boot-flash cap, now global law. */
const LUMINANCE_CAP = 0.7;
/** Downsample size for the average-tone read (event-driven, tiny). */
const TONE_W = 8;
const TONE_H = 6;

interface Tone {
  r: number;
  g: number;
  b: number;
  lum: number;
}

export function CrtScreen({
  root,
  autoBoot = true,
}: {
  root: Group;
  autoBoot?: boolean;
}) {
  const uniformsRef = useRef<CrtUniforms | null>(null);
  const toneRef = useRef<Tone>({ r: 0.01, g: 0.02, b: 0.015, lum: 0.02 });

  useEffect(() => {
    const mesh = root.getObjectByName("crtScreen") as Mesh | null;
    if (!mesh) return;

    const canvas = document.createElement("canvas");
    canvas.width = DESKTOP_W;
    canvas.height = DESKTOP_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const toneCanvas = document.createElement("canvas");
    toneCanvas.width = TONE_W;
    toneCanvas.height = TONE_H;
    const toneCtx = toneCanvas.getContext("2d", { willReadFrequently: true });

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;

    const { material, uniforms } = createCrtMaterial(texture);
    uniformsRef.current = uniforms;
    const previous: Material | Material[] = mesh.material;
    mesh.material = material;

    const repaint = () => {
      paintScreen(ctx, win98State);
      texture.needsUpdate = true;
      if (!toneCtx) return;
      // Average tint/luminance via an 8×6 downsample — runs per repaint,
      // never per frame.
      toneCtx.drawImage(canvas, 0, 0, TONE_W, TONE_H);
      const data = toneCtx.getImageData(0, 0, TONE_W, TONE_H).data;
      let r = 0;
      let g = 0;
      let b = 0;
      const count = TONE_W * TONE_H;
      for (let i = 0; i < count; i++) {
        r += data[i * 4];
        g += data[i * 4 + 1];
        b += data[i * 4 + 2];
      }
      r /= count * 255;
      g /= count * 255;
      b /= count * 255;
      const tone = toneRef.current;
      tone.r = r;
      tone.g = g;
      tone.b = b;
      tone.lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const unsubscribe = subscribeWin98(repaint);
    repaint();

    // Auto-boot through the 3.3 sequencer (POST lines paced from
    // bootScript; 4.1's power press will own this in the journey).
    let boot: BootController | null = null;
    if (autoBoot && win98State.phase === "off") {
      boot = startBoot();
    }

    return () => {
      boot?.cancel();
      unsubscribe();
      mesh.material = previous;
      material.dispose();
      texture.dispose();
      uniformsRef.current = null;
    };
  }, [root, autoBoot]);

  useFrame(({ clock }, delta) => {
    const uniforms = uniformsRef.current;
    if (!uniforms) return;
    uniforms.uTime.value += delta;

    // Screen-light write: painter average tint, gently wobbled so the
    // room cast keeps the phosphor life the test pattern had.
    const tone = toneRef.current;
    const wobble =
      1 + 0.03 * Math.sin(clock.elapsedTime * 11.3) * Math.sin(clock.elapsedTime * 3.1);
    screenLight.tint.setRGB(tone.r, tone.g, tone.b, SRGBColorSpace);
    screenLight.luminance = Math.min(tone.lum * wobble, LUMINANCE_CAP);
  });

  return null;
}

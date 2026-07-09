"use client";

import { useEffect, useMemo } from "react";
import { Uniform, Vector2 } from "three";
import { BlendFunction, Effect } from "postprocessing";
import { EffectComposer } from "@react-three/postprocessing";
import { lensState } from "./lensState";

/**
 * ADR-006 §4 — the global refractive pass: a screen-space displacement +
 * chromatic-aberration field around the pointer whose strength is keyed to
 * pointer speed and scroll velocity ("everything around the pointer distorts
 * and goes achromatic"). Applies to the whole WebGL layer — prism, streams,
 * kinetic type, image planes. Mounted on the high tier only; low/touch tiers
 * and prefers-reduced-motion never construct the composer.
 */

const fragmentShader = /* glsl */ `
  uniform vec2 uPointer;     // uv space, y-up
  uniform float uStrength;   // warp energy 0..1
  uniform float uShear;      // signed scroll-velocity term
  uniform float uAspect;

  void mainUv(inout vec2 uv) {
    vec2 d = uv - uPointer;
    d.x *= uAspect;
    float dist = length(d);
    float f = exp(-dist * dist * 9.0) * uStrength;
    // Pull pixels toward the pointer — a moving lens bulge.
    uv -= normalize(d + 1e-6) * f * 0.035 * vec2(1.0 / uAspect, 1.0);
    // Scroll shear: the frame skews with scroll velocity.
    uv.x += (uv.y - 0.5) * uShear * 0.018;
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 d = uv - uPointer;
    d.x *= uAspect;
    float dist = length(d);
    float f = exp(-dist * dist * 7.0) * uStrength;
    vec2 dir = normalize(d + 1e-6) * vec2(1.0 / uAspect, 1.0);
    vec2 off = dir * f * 0.012 + vec2(0.0, uShear * 0.005);
    float r = texture2D(inputBuffer, uv + off).r;
    float b = texture2D(inputBuffer, uv - off).b;
    vec3 col = vec3(r, inputColor.g, b);
    // "Goes achromatic": desaturate inside the warp field.
    float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = mix(col, vec3(l), clamp(f * 1.4, 0.0, 0.85));
    outputColor = vec4(col, inputColor.a);
  }
`;

class RefractiveDistortionEffect extends Effect {
  private energy = 0;

  constructor() {
    super("RefractiveDistortion", fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        ["uPointer", new Uniform(new Vector2(0.5, 0.5))],
        ["uStrength", new Uniform(0)],
        ["uShear", new Uniform(0)],
        ["uAspect", new Uniform(1)],
      ]),
    });
  }

  override setSize(width: number, height: number) {
    this.uniforms.get("uAspect")!.value = width / Math.max(1, height);
  }

  override update(
    _renderer: unknown,
    _inputBuffer: unknown,
    deltaTime = 1 / 60,
  ) {
    const dt = Math.min(deltaTime, 0.05);

    // Pointer energy: bumped by the pointermove listener, decayed here.
    lensState.pointerSpeed *= Math.exp(-2.6 * dt);
    const target = Math.min(
      1,
      lensState.pointerSpeed * 1.2 + Math.abs(lensState.scrollVelocity) * 0.45,
    );
    // Fast attack, slow release — flicks register, then melt away.
    const rate = target > this.energy ? 9 : 3;
    this.energy += (target - this.energy) * Math.min(1, rate * dt);

    const pointer = this.uniforms.get("uPointer")!.value as Vector2;
    pointer.set(
      (lensState.pointer.x + 1) / 2,
      1 - (lensState.pointer.y + 1) / 2, // uv is y-up; pointer.y is y-down
    );
    // A small idle strength keeps hover alive; motion ramps it.
    this.uniforms.get("uStrength")!.value = 0.16 + 0.84 * this.energy;
    this.uniforms.get("uShear")!.value = Math.max(
      -1,
      Math.min(1, lensState.scrollVelocity * 0.5),
    );
  }
}

export function RefractionPass() {
  const effect = useMemo(() => new RefractiveDistortionEffect(), []);
  useEffect(() => () => effect.dispose(), [effect]);
  return (
    <EffectComposer>
      <primitive object={effect} />
    </EffectComposer>
  );
}

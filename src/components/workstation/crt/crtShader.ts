// CRT shader (plan-0009 §3.1): barrel curvature, scanlines, phosphor
// triad mask, vignette, subtle time flicker over the painter's
// CanvasTexture. Uniforms are written per frame via refs (React-compiler
// rule) by CrtScreen; brightness stays inside the gate-2.3 contract —
// uBrightness is the ceiling, matched to the retired test pattern's
// tamed emissive so the 2.2 bloom threshold (0.68) only catches
// hotspots, never the whole face.

import { ShaderMaterial, type IUniform, type Texture } from "three";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uBrightness;
  uniform float uCurvature;
  uniform float uScanline;
  varying vec2 vUv;

  void main() {
    // Barrel curvature: displace UVs toward the corners.
    vec2 uv = vUv * 2.0 - 1.0;
    uv *= 1.0 + dot(uv, uv) * uCurvature;
    uv = uv * 0.5 + 0.5;

    // Outside the curved face: dark glass border.
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      gl_FragColor = vec4(0.008, 0.012, 0.01, 1.0);
      return;
    }

    vec3 color = texture2D(uMap, uv).rgb;

    // Scanlines — resolution-locked to the painter's 480 rows.
    float line = sin(uv.y * 480.0 * 3.14159);
    color *= 1.0 - uScanline * 0.5 * (1.0 - line * line);

    // Phosphor triad mask (cheap: 3-column repeat, low contrast — high
    // contrast aliases into moiré rings under minification).
    float band = mod(floor(uv.x * 640.0 * 3.0), 3.0);
    vec3 mask = vec3(
      band < 0.5 ? 1.0 : 0.92,
      band >= 0.5 && band < 1.5 ? 1.0 : 0.92,
      band >= 1.5 ? 1.0 : 0.92
    );
    color *= mask;

    // Vignette toward the glass corners.
    vec2 v = uv * (1.0 - uv);
    color *= 0.55 + 0.45 * clamp(v.x * v.y * 22.0, 0.0, 1.0);

    // Subtle phosphor flicker (uTime-driven; amplitude stays gentle).
    color *= 1.0 + 0.02 * sin(uTime * 73.0) + 0.012 * sin(uTime * 19.7);

    gl_FragColor = vec4(color * uBrightness, 1.0);
  }
`;

export interface CrtUniforms {
  [uniform: string]: IUniform;
  uMap: { value: Texture };
  uTime: { value: number };
  uBrightness: { value: number };
  uCurvature: { value: number };
  uScanline: { value: number };
}

export function createCrtMaterial(map: Texture): {
  material: ShaderMaterial;
  uniforms: CrtUniforms;
} {
  const uniforms: CrtUniforms = {
    uMap: { value: map },
    uTime: { value: 0 },
    uBrightness: { value: 1.15 },
    uCurvature: { value: 0.11 },
    uScanline: { value: 0.22 },
  };
  const material = new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
  });
  return { material, uniforms };
}

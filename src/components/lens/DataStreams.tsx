"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { lensState } from "./lensState";
import { PROJECTION_PLANE_Z } from "./projectionTargets";
import type { FidelityTier } from "@/lib/gpuTier";
import { mulberry32 } from "@/lib/prng";

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
 *   work     — high tier at lg+: the beams enter PROJECTED mode (ADR-008 §2)
 *              and curve into the active card's window, endpoint sweeping
 *              between cards; lower tiers keep the ADR-006 dim/recede
 *   traject. — the prism returns home and the ordered fan re-forms (recap)
 *   contact  — high tier: beams bend down into a soft underline beneath the
 *              CTA row (ADR-008 §3); low/static end on the resolved fan
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
  uniform float uInSide;
  uniform float uDpr;
  attribute float aSeed;
  attribute vec3 aJitter;
  varying float vFade;

  void main() {
    float speed = mix(0.09, 0.2, fract(aSeed * 7.31));
    float t = fract(uTime * speed + aSeed);
    // Quadratic bezier: scattered upper field -> the lens mouth. uInSide
    // mirrors the source x (ADR-009 §2): while projecting, packets enter
    // the OUTER face — the one away from the window — so entry and exit
    // sit on opposite faces. It is damped with the rig, so the entry
    // sweeps with the prism instead of snapping.
    vec3 p0 = vec3(uInSide * (-7.5 + aJitter.x * 2.4), 2.4 + aJitter.y * 1.8, aJitter.z * 1.4);
    vec3 c  = vec3(uInSide * -2.8, 0.6 + aJitter.y * 0.5, aJitter.z * 0.7);
    vec3 p1 = vec3(uInSide * -0.4, 0.0, 0.0);
    vec3 pos = mix(mix(p0, c, t), mix(c, p1, t), t);
    pos += aJitter * 0.22 * (1.0 - t) * sin(uTime * 2.0 + aSeed * 40.0);
    vFade = smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.85, 1.0, t));
    vFade *= mix(1.0, 0.35, uRecede);
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
  uniform float uProject;
  uniform vec3 uTarget;
  uniform float uHalfW;
  uniform float uHalfH;
  uniform float uSide;
  uniform float uUnderline;
  uniform vec3 uCta;
  uniform float uCtaHalfW;
  uniform float uDpr;
  attribute float aSeed;
  attribute float aBeam;
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
    vec3 pos = vec3(0.4, 0.0, 0.0) + vec3(dir * (0.25 + t * 6.2), 0.0);
    pos.z += (fract(aSeed * 9.7) - 0.5) * 0.4;
    float spread = mix(0.34, 0.1, uApproach);
    float lane = fract(aSeed * 3.3) - 0.5;
    pos.xy += vec2(-dir.y, dir.x) * lane * spread;

    // Projected mode (ADR-008 §2, refraction per ADR-009 §2): a quadratic
    // bezier from the prism exit to the active window (uTarget, group-local).
    // The origin sits on the face TOWARD the window (0.4 * uSide while
    // projecting) — packets entered the mirrored outer face, so light
    // crosses the glass. Endpoints land across the window's actual world
    // rect (uHalfW/uHalfH): each spectrum band owns a vertical strip with
    // per-particle scatter, so the cone converges at the prism and opens to
    // fill the frame — a projector throw, not a wire. The arc bulges
    // perpendicular to the throw, flipping with uSide.
    vec3 p0 = vec3(mix(0.4, 0.4 * uSide, uProject), 0.0, 0.0);
    float row = fract(aSeed * 6.19) - 0.5;
    float sx = clamp(k * 0.33 + lane * 0.6, -1.0, 1.0);
    vec3 pEnd = uTarget + vec3(sx * uHalfW * 0.92, row * 2.0 * uHalfH * 0.85, 0.0);
    pEnd.z += (fract(aSeed * 9.7) - 0.5) * 0.3;
    vec3 d02 = pEnd - p0;
    vec3 perp = normalize(vec3(-d02.y, d02.x, 0.0) + 1e-5);
    // Refraction kink: leave the exit face along its outward normal with a
    // small per-color angular spread (violet bends hardest) before curving
    // to the window. uSide/uProject are damped, so the kink sweeps through
    // zero mid-crossing instead of snapping.
    vec3 kinkDir = vec3(uSide, 0.08 * k, 0.0);
    vec3 p1 = p0 + d02 * 0.5 + perp * (uSide * 0.9 + lane * 0.3)
            + kinkDir * 0.6 * uProject;
    vec3 bez = mix(mix(p0, p1, t), mix(p1, pEnd, t), t);
    pos = mix(pos, bez, uProject);

    // Contact finale (ADR-008 §3): beams bend down and converge into a soft
    // underline beneath the CTA row — the refracted output points at the
    // invitation. Endpoints spread across the row width (uCtaHalfW).
    vec3 uEnd = uCta + vec3(
      (k * 0.18 + lane * 0.4) * 2.0 * uCtaHalfW,
      0.0,
      (fract(aSeed * 9.7) - 0.5) * 0.2
    );
    vec3 uC = p0 + vec3(1.5 + k * 0.25, -0.1, 0.0);
    vec3 ubez = mix(mix(p0, uC, t), mix(uC, uEnd, t), t);
    pos = mix(pos, ubez, uUnderline);

    float beamFade = smoothstep(0.0, 0.06, t) * (1.0 - smoothstep(0.72, 1.0, t));
    // Curved particles survive the whole throw and land at the target.
    float throwFade = smoothstep(0.0, 0.05, t) * (1.0 - smoothstep(0.9, 1.0, t));
    float straight = beamFade * mix(1.0, 0.3, uRecede);
    float curveMode = max(uProject, uUnderline);
    vFade = mix(straight, throwFade * 0.9, curveMode);
    vColor = aColor;
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
    const c = new THREE.Color();
    for (let i = 0; i < beamCount; i += 1) {
      const k = i % BEAMS;
      beam[i] = k;
      c.set(SPECTRUM[k]);
      color[i * 3] = c.r;
      color[i * 3 + 1] = c.g;
      color[i * 3 + 2] = c.b;
    }
    geo.setAttribute(
      "aSeed",
      new THREE.BufferAttribute(makeSeeds(beamCount, 90210), 1),
    );
    geo.setAttribute("aBeam", new THREE.BufferAttribute(beam, 1));
    geo.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
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
      uInSide: { value: 1 },
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
      uProject: { value: 0 },
      uTarget: { value: new THREE.Vector3() },
      uHalfW: { value: 1.6 },
      uHalfH: { value: 1 },
      uSide: { value: 1 },
      uUnderline: { value: 0 },
      uCta: { value: new THREE.Vector3() },
      uCtaHalfW: { value: 1 },
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
  const visual = useRef({
    approach: 0,
    recede: 0,
    contact: 0,
    project: 0,
    side: 1,
  });
  // Group-local scratch for the projection targets (world → LensRig space).
  const root = useRef<THREE.Group>(null);
  const targetScratch = useRef(new THREE.Vector3());
  const scaleScratch = useRef(new THREE.Vector3());

  // Static tier: settle the composition once — prism + ordered beams, no loop.
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
    const proj = lensState.projection;
    // Projection runs on the high tier with the lg+ pinned layout only
    // (ADR-008 §2 tier policy; Tailwind lg = 1024px). Everything else keeps
    // the ADR-006 recede, which the projection cancels while active.
    const projecting =
      tier === "high" && proj.index >= 0 && state.size.width >= 1024;
    // 2.5/2 match LensRig's position/side damps so the bulge, the endpoint
    // sweep, and the prism's glide all cross to the other window together.
    v.project = THREE.MathUtils.damp(v.project, projecting ? 1 : 0, 2.5, delta);
    v.side = THREE.MathUtils.damp(v.side, proj.side, 2, delta);
    v.approach = THREE.MathUtils.damp(v.approach, acts.approach, 3.5, delta);
    v.recede = THREE.MathUtils.damp(
      v.recede,
      acts.work * (1 - v.project),
      3.5,
      delta,
    );
    // CTA underline is high-tier only (ADR-008 §3); low/static keep the fan.
    v.contact = THREE.MathUtils.damp(
      v.contact,
      tier === "high" ? acts.contact : 0,
      3.5,
      delta,
    );
    const underline = THREE.MathUtils.smoothstep(v.contact, 0.25, 0.8);

    const iu = inflowMat.current?.uniforms;
    if (iu) {
      iu.uTime.value = t;
      iu.uRecede.value = v.recede;
      // Entry face mirrors toward the outer side while projecting
      // (ADR-009 §2). v.side/v.project are damped above, so this sweeps.
      iu.uInSide.value = THREE.MathUtils.lerp(1, v.side, v.project);
    }
    const bu = beamMat.current?.uniforms;
    if (bu) {
      bu.uTime.value = t;
      bu.uApproach.value = v.approach;
      bu.uRecede.value = v.recede;
      bu.uProject.value = v.project;
      bu.uSide.value = v.side;
      bu.uUnderline.value = underline;
      if (root.current && (v.project > 0.001 || underline > 0.001)) {
        root.current.updateWorldMatrix(true, false);
        if (v.project > 0.001) {
          // The tracker writes world coords; the shader works in
          // LensRig-local space (the rig translates/scales, no rotation).
          // Damping the uniform itself IS the endpoint sweep between cards —
          // 2.5 matches the rig's position damp so beams land in step.
          const local = targetScratch.current.set(
            proj.targetX,
            proj.targetY,
            PROJECTION_PLANE_Z,
          );
          root.current.worldToLocal(local);
          const ut = bu.uTarget.value as THREE.Vector3;
          ut.x = THREE.MathUtils.damp(ut.x, local.x, 2.5, delta);
          ut.y = THREE.MathUtils.damp(ut.y, local.y, 2.5, delta);
          ut.z = THREE.MathUtils.damp(ut.z, local.z, 2.5, delta);
          // Window half-extents, world → rig-local like ctaHalfW below.
          const rigScale = Math.max(
            0.001,
            root.current.getWorldScale(scaleScratch.current).x,
          );
          bu.uHalfW.value = THREE.MathUtils.damp(
            bu.uHalfW.value,
            proj.halfW / rigScale,
            3,
            delta,
          );
          bu.uHalfH.value = THREE.MathUtils.damp(
            bu.uHalfH.value,
            proj.halfH / rigScale,
            3,
            delta,
          );
        }
        if (underline > 0.001) {
          const local = targetScratch.current.set(
            proj.ctaX,
            proj.ctaY,
            PROJECTION_PLANE_Z,
          );
          root.current.worldToLocal(local);
          (bu.uCta.value as THREE.Vector3).copy(local);
          const worldScale = root.current.getWorldScale(
            scaleScratch.current,
          ).x;
          bu.uCtaHalfW.value = proj.ctaHalfW / Math.max(0.001, worldScale);
        }
      }
    }

    const len = 5.6;
    // Straight blades hand off to the curved streams (ADR-008 §2/§3).
    const alpha =
      (tier === "high" ? 0.2 : 0.14) *
      (1 - 0.65 * v.recede) *
      (1 - Math.max(v.project, underline));
    bladeRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.rotation.z = beamAngle(i, v.approach);
      mesh.scale.set(len, 0.26, 1);
      (mesh.material as THREE.ShaderMaterial).uniforms.uAlpha.value = alpha;
    });
  });

  return (
    <group ref={root}>
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

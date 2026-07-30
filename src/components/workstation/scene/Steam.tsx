"use client";

// Mug steam (plan-0010 §4.3, ADR-013 §7) — the detail that makes the desk
// read as occupied rather than staged. Built on `Atmosphere.tsx`'s dust
// pattern: preallocated arrays, seeded `mulberry32`, zero per-frame
// allocation, and a `Points` cloud that recycles rather than respawning
// objects.
//
// **The emitter follows the mug; the steam does not.** Particles are born
// on the coffee surface — read through the mug's world matrix, so they come
// off the liquid even while the mug is tilted 28° at someone's mouth — and
// from that moment they live in WORLD space and simply rise. Parenting the
// cloud to the mug would drag every wisp along with the lift and read as a
// solid object; leaving them behind is both what steam does and what makes
// the sip look like a sip. It also keeps this component out of the mug's
// subtree, which `RoomScene` disposes by traversal.
//
// **Fading is done with vertex colours, not opacity.** `PointsMaterial` has
// one opacity for the whole cloud, and per-particle alpha would need a
// custom shader. Under additive blending, though, a colour multiplied
// toward black IS a fade — so a per-vertex colour attribute buys the same
// result with a stock material and no shader to maintain.
//
// It is additive geometry, so like the LED it **adds no light to the room**
// and the gate-2.3 brightness contract is untouched. The peak stays well
// under Bloom's 0.68 threshold on purpose: steam that blooms reads as smoke.

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Points,
  PointsMaterial,
  Vector3,
} from "three";
import { mulberry32 } from "@/lib/prng";
import { effectsState } from "./sheddable";
import { propHandles } from "./propHandles";

/** `buildMug`: the coffee disc sits at local y 0.088 with radius 0.036.
 *  Emit a hair above it and just inside it, so wisps clear the liquid
 *  without clipping the mug wall on the way out. */
const SURFACE_Y = 0.092;
const SURFACE_R = 0.03;

/** Seconds a wisp lives. Long enough to climb clear of the mug, short
 *  enough that a lift leaves a trail rather than a rope. */
const LIFE_MIN = 1.6;
const LIFE_MAX = 3.1;

/** Rise and wander, m/s. Steam off a mug is slow — this is the number most
 *  likely to want owner eyes, because too fast reads as smoke. */
const RISE_MIN = 0.045;
const RISE_MAX = 0.085;
const DRIFT = 0.018;
/** Sideways acceleration, so a wisp curls instead of travelling straight. */
const CURL = 0.012;

/** Peak additive contribution. Under Bloom's 0.68 threshold by design. */
const PEAK = 0.3;
/** Faintly cool against a warm dusk room. */
const TINT = [0.86, 0.91, 1.0] as const;

/** Fraction of life spent ramping in. The rest is the fade. */
const RAMP = 0.18;

function puffTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    // Softer than `Atmosphere`'s mote: a dust speck has an edge, a wisp of
    // steam does not.
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(255,255,255,0.85)");
    g.addColorStop(0.35, "rgba(255,255,255,0.32)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
  }
  return new CanvasTexture(canvas);
}

/** Per-particle state the frame loop integrates. Deliberately NOT part of
 *  the `useMemo` below: the React compiler treats everything reachable from
 *  a memo as frozen, and it is right to — a frame loop mutating render
 *  memo state is how you get a component that silently stops re-deriving.
 *  Mutable simulation state belongs in a ref, and the arrays the GPU reads
 *  are reached through the mesh ref instead, which is the same route
 *  `Atmosphere` takes to its dust positions. */
interface Sim {
  velocities: Float32Array;
  age: Float32Array;
  life: Float32Array;
  rnd: () => number;
}

function makeSim(count: number): Sim {
  const rnd = mulberry32(0x53544d21);
  const velocities = new Float32Array(count * 3);
  const age = new Float32Array(count);
  const life = new Float32Array(count);
  // Stagger the first breath: negative age with a zero life means
  // `age >= life` stays false until the clock catches up, so each wisp
  // spawns at its own moment without a second piece of state to track.
  for (let i = 0; i < count; i++) {
    age[i] = -rnd() * LIFE_MAX;
    life[i] = 0;
  }
  return { velocities, age, life, rnd };
}

export function Steam({ detail = "high" }: { detail?: "low" | "high" }) {
  const points = useRef<Points>(null);
  const sim = useRef<Sim | null>(null);
  // One scratch vector for the whole component — the spawn point is the
  // only thing that needs transforming, and only once per birth.
  const spawnPoint = useRef(new Vector3());

  const steam = useMemo(() => {
    const count = detail === "high" ? 56 : 20;
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(count * 3), 3));
    geometry.setAttribute("color", new BufferAttribute(new Float32Array(count * 3), 3));
    const map = puffTexture();
    const material = new PointsMaterial({
      size: 0.026,
      map,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      sizeAttenuation: true,
    });
    return { geometry, material, map, count };
  }, [detail]);

  useEffect(() => {
    const { geometry, material, map, count } = steam;
    sim.current = makeSim(count);
    return () => {
      sim.current = null;
      geometry.dispose();
      material.dispose();
      map.dispose();
    };
  }, [steam]);

  useFrame((_, delta) => {
    const mesh = points.current;
    const state = sim.current;
    if (!mesh || !state) return;
    const mug = propHandles.mug;
    // No mug in this scene means no steam, and it is not an error: the
    // handle is null in every harness that does not dress the desk.
    mesh.visible = effectsState.steam && mug !== null;
    if (!mesh.visible || !mug) return;

    // The sip moved the mug a few lines ago in another frame loop; read the
    // matrix rather than last frame's leftovers, so wisps are born on the
    // liquid and not where the liquid used to be.
    mug.updateWorldMatrix(true, false);

    const { count } = steam;
    const { velocities, age, life, rnd } = state;
    const positionAttribute = mesh.geometry.getAttribute("position") as BufferAttribute;
    const colorAttribute = mesh.geometry.getAttribute("color") as BufferAttribute;
    const positions = positionAttribute.array as Float32Array;
    const colors = colorAttribute.array as Float32Array;
    const spawn = spawnPoint.current;
    for (let i = 0; i < count; i++) {
      const o = i * 3;
      age[i] += delta;

      if (age[i] < 0) {
        // Staggered in, not yet born. Checked before anything divides by
        // `life`, which is still zero for a wisp that has never spawned.
        // Black under additive blending is invisible, so it costs a point
        // in the draw and shows nothing.
        colors[o] = 0;
        colors[o + 1] = 0;
        colors[o + 2] = 0;
        continue;
      }

      if (age[i] >= life[i]) {
        // Birth: a point on the coffee surface, pushed through the mug's
        // world matrix so a tilted mug still steams off its liquid.
        const angle = rnd() * Math.PI * 2;
        // sqrt keeps the sample uniform over the disc rather than clustered
        // at the centre.
        const radius = Math.sqrt(rnd()) * SURFACE_R;
        spawn
          .set(Math.cos(angle) * radius, SURFACE_Y, Math.sin(angle) * radius)
          .applyMatrix4(mug.matrixWorld);
        positions[o] = spawn.x;
        positions[o + 1] = spawn.y;
        positions[o + 2] = spawn.z;
        velocities[o] = (rnd() - 0.5) * DRIFT;
        velocities[o + 1] = RISE_MIN + rnd() * (RISE_MAX - RISE_MIN);
        velocities[o + 2] = (rnd() - 0.5) * DRIFT;
        age[i] = 0;
        life[i] = LIFE_MIN + rnd() * (LIFE_MAX - LIFE_MIN);
      }

      const t = age[i] / life[i];

      // Curl: nudge the horizontal velocity as it climbs so the column
      // wanders instead of standing straight up.
      velocities[o] += (rnd() - 0.5) * CURL * delta;
      velocities[o + 2] += (rnd() - 0.5) * CURL * delta;
      positions[o] += velocities[o] * delta;
      positions[o + 1] += velocities[o + 1] * delta;
      positions[o + 2] += velocities[o + 2] * delta;

      // Squared fade — a long thin tail rather than a linear dimming, which
      // is what stops the cloud reading as a band of dots switching off.
      const ramp = t < RAMP ? t / RAMP : 1 - (t - RAMP) / (1 - RAMP);
      const k = PEAK * ramp * ramp;
      colors[o] = TINT[0] * k;
      colors[o + 1] = TINT[1] * k;
      colors[o + 2] = TINT[2] * k;
    }

    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
  });

  // `frustumCulled={false}` is load-bearing, and the reason is not obvious.
  //
  // three computes a geometry's bounding sphere ONCE, lazily, from whatever
  // is in the position buffer at that moment — and at first render this
  // buffer is all zeros, because a wisp cannot be placed until there is a
  // mug to place it on. That yields a zero-radius sphere at the world
  // origin, so the cloud is culled the moment the middle of the room leaves
  // the frustum: the steam vanishes as you zoom IN on the mug and comes
  // back when you zoom out. (`Atmosphere`'s dust avoids this only by
  // accident — it seeds real positions in its memo, so its sphere is
  // computed from a populated buffer.)
  //
  // Recomputing the sphere every frame would fix it and cost a second pass
  // over every particle. Not culling costs one draw call of 56 points that
  // are, by construction, sitting on the thing the camera is looking at.
  return (
    <points
      ref={points}
      geometry={steam.geometry}
      material={steam.material}
      frustumCulled={false}
    />
  );
}

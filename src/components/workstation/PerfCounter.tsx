"use client";

// Dev-only perf readout (plan-0009 §7.2): the instrument behind the
// slice's recorded draw-call / texture / allocation budgets, and the way
// a headless QA session reads them (`window.__experienceState.perf`).
//
// Dev-only by construction, not by discipline — `WorkstationCanvas` mounts
// it behind a NODE_ENV check so the whole component tree-shakes out of the
// production bundle. Measuring the renderer costs nothing, but shipping a
// counter that samples `performance.memory` every second to visitors who
// cannot see it is pure waste.
//
// Texture bytes are ESTIMATED, and the estimate is the honest kind: three
// does not expose per-texture GPU residency, so this walks the SCENE GRAPH
// and sums w*h*4 (RGBA8) with the standard +33% for a full mip chain.
//
// Two limits, both deliberate and both worth knowing before trusting the
// number. It counts scene textures only — the post stack's internal render
// targets are not in the graph, so shedding `bloomRich` frees real GPU
// memory that this figure does not move (watch `textures` instead, which
// comes from the renderer and does include them). And it assumes RGBA8:
// compressed or half-float sources would read wrong. The scene has
// neither, and this is a budget check, not billing.

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Texture } from "three";
import { experienceState } from "@/lib/experienceState";

/** Mip chain adds ~1/3 again over the base level. */
const MIP_FACTOR = 4 / 3;

type WithMemory = Performance & { memory?: { usedJSHeapSize: number } };

export function PerfCounter() {
  const frames = useRef(0);
  const since = useRef(0);
  const lastHeap = useRef(-1);
  const owned = useRef(false);

  // `gl`/`scene` come from useFrame's state argument rather than useThree
  // because this component MUTATES the renderer's info flag below, and the
  // React-compiler lint rules (correctly) forbid modifying a value a hook
  // returned. The frame argument is not that value.
  useFrame(({ gl, scene }, delta) => {
    // `renderer.info` auto-resets on every `render()` call, and the post
    // stack renders several passes per frame — so sampling it from a frame
    // callback reads a counter that was just cleared, and reports ~1 draw
    // call for the whole scene. (It did exactly that on this file's first
    // run; 37 is the real number.) Taking the reset over instead
    // accumulates every pass across the sampling window.
    //
    // Never restored: the flag lives on a renderer that dies with the
    // canvas this component is mounted inside, and nothing else reads it.
    if (!owned.current) {
      gl.info.autoReset = false;
      owned.current = true;
    }

    frames.current++;
    since.current += delta;
    if (since.current < 1) return;

    const perf = experienceState.perf;
    perf.fps = Math.round(frames.current / since.current);
    // Per-frame averages: the counters accumulated across every pass of
    // every frame in the window, so divide by the frames that produced them.
    perf.drawCalls = Math.round(gl.info.render.calls / frames.current);
    perf.triangles = Math.round(gl.info.render.triangles / frames.current);
    perf.textures = gl.info.memory.textures;
    perf.geometries = gl.info.memory.geometries;
    perf.programs = gl.info.programs?.length ?? 0;

    // Walk the graph rather than the renderer's cache: three's texture
    // count is a number, not a list, so the only place the dimensions
    // still exist is on the materials.
    let bytes = 0;
    const counted = new Set<Texture>();
    scene.traverse((object) => {
      const material = (object as { material?: unknown }).material;
      const list = Array.isArray(material) ? material : [material];
      for (const entry of list) {
        if (!entry || typeof entry !== "object") continue;
        for (const value of Object.values(entry)) {
          if (!(value instanceof Texture) || counted.has(value)) continue;
          counted.add(value);
          const image = value.image as { width?: number; height?: number } | null;
          if (image?.width && image?.height) {
            bytes += image.width * image.height * 4 *
              (value.generateMipmaps ? MIP_FACTOR : 1);
          }
        }
      }
    });
    perf.textureBytes = Math.round(bytes);

    // Heap growth per second. Not a leak detector — GC makes any single
    // reading noisy — but a frame loop allocating per frame cannot get
    // this near zero, and a clean one settles there between collections.
    const memory = (performance as WithMemory).memory;
    if (memory) {
      const used = memory.usedJSHeapSize;
      if (lastHeap.current >= 0) {
        perf.heapDeltaPerSec = Math.round((used - lastHeap.current) / since.current);
      }
      lastHeap.current = used;
    }

    gl.info.reset();
    frames.current = 0;
    since.current = 0;
  });

  return null;
}

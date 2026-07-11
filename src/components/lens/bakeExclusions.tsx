"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type * as THREE from "three";

/**
 * Registry of scene objects the prism's transmission bake must NOT capture
 * (ADR-011 Amendment A). The glass refracts a baked image of the scene, and
 * transmitted content has no intensity knob in the material — anything
 * bright that bakes in (the additive beam/blade convergence at the mouth,
 * the near-white kinetic text twins in front of the glass) IS the blow-out.
 * Registered objects are hidden for exactly the two bake renders in TheLens
 * and appear only in the direct on-screen draw.
 *
 * projectionTargets pattern: module scope, frame loops read it, React never
 * does.
 */

const excluded = new Set<THREE.Object3D>();
/** Reused across frames — no per-frame allocation in the bake loop. */
const prior = new Map<THREE.Object3D, boolean>();

export function registerBakeExclusion(obj: THREE.Object3D): () => void {
  excluded.add(obj);
  return () => {
    excluded.delete(obj);
  };
}

/** Frame-loop only. Hide the registry, remembering each object's own
 *  visibility (kinetic planes toggle theirs per frame). */
export function hideBakeExclusions(): void {
  prior.clear();
  excluded.forEach((obj) => {
    prior.set(obj, obj.visible);
    obj.visible = false;
  });
}

/** Frame-loop only. Undo hideBakeExclusions() after the bake renders. */
export function restoreBakeExclusions(): void {
  prior.forEach((visible, obj) => {
    obj.visible = visible;
  });
  prior.clear();
}

/** Wraps scene content that must never appear inside the glass. */
export function BakeExcluded({ children }: { children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useEffect(() => {
    const g = group.current;
    if (!g) return;
    return registerBakeExclusion(g);
  }, []);
  return <group ref={group}>{children}</group>;
}

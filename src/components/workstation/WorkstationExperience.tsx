"use client";

import { useEffect, useRef, useState } from "react";
import { detectTier } from "@/lib/gpuTier";
import { experienceState } from "@/lib/experienceState";
import { RUNWAY_LENGTH_VH } from "@/lib/chapters";
import { Choreography } from "./choreography/Choreography";
import { WorkstationCanvas } from "./WorkstationCanvas";

/**
 * Tier router for the Workstation experience (plan-0009 §0.2). Reached only
 * via WorkstationRoot's ssr:false dynamic import, so tier detection (which
 * probes a GL context) runs in the lazy useState initializer on the client
 * only, never in the prerender — the retired LensRoot's pattern.
 *
 * Routing (ADR-012 §9): `?tier=` override, prefers-reduced-motion (tier
 * "static"), and WebGL failure ("none") all return null — the canvas never
 * mounts and the visitor keeps the 0.1 static floor, which the prerender
 * always ships. Only high/low tiers mount the experience; the floor then
 * leaves the flow (html[data-experience] in globals.css) so the runway owns
 * the page's scroll height.
 *
 * `?scene=<name>` mounts the isolated dev/QA harness (orbitable camera, no
 * choreography) instead of the journey — URL-gated, not build-gated, so the
 * owner can QA production builds.
 */
export default function WorkstationExperience() {
  const [detection] = useState(detectTier);
  const [scene] = useState(
    () => new URLSearchParams(window.location.search).get("scene"),
  );
  const runway = useRef<HTMLDivElement>(null);

  const mounts = detection.tier === "high" || detection.tier === "low";

  // Mirror the tier for frame-side readers (frame loops read the mutable
  // singleton, never React state).
  useEffect(() => {
    experienceState.fidelityTier = detection.tier;
  }, [detection]);

  // While the experience is mounted the floor + footer leave the flow; the
  // attribute (not unmounting) keeps the prerendered floor markup intact.
  useEffect(() => {
    if (!mounts) return;
    document.documentElement.dataset.experience = "on";
    return () => {
      delete document.documentElement.dataset.experience;
    };
  }, [mounts]);

  if (!mounts) return null;

  if (scene !== null) {
    return (
      <>
        <WorkstationCanvas tier={detection.tier} scene={scene} />
        <p className="pointer-events-none fixed top-4 left-4 z-50 font-mono text-xs tracking-wide text-ink-subtle">
          harness · scene: {scene} · tier: {detection.tier}
        </p>
      </>
    );
  }

  return (
    <>
      <WorkstationCanvas tier={detection.tier} scene={null} />
      <Choreography runway={runway} />
      {/* Scroll runway — invisible height the journey scrubs against. */}
      <div
        ref={runway}
        aria-hidden="true"
        style={{ height: `${RUNWAY_LENGTH_VH}vh` }}
      />
    </>
  );
}

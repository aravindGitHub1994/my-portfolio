"use client";

import { useEffect, useRef, useState } from "react";
import { detectTier } from "@/lib/gpuTier";
import { experienceState } from "@/lib/experienceState";
import { RUNWAY_LENGTH_VH } from "@/lib/chapters";
import { Choreography } from "./choreography/Choreography";
import { WorkstationCanvas } from "./WorkstationCanvas";
import { ExperienceBoundary } from "./ExperienceBoundary";
import { PowerOn } from "./PowerOn";
import { ScrollHint } from "./ScrollHint";
import { SignOff } from "./SignOff";
import { DockSwap } from "./crt/DockSwap";
import { MuteToggle } from "./MuteToggle";
import { FidelityPrompt } from "./FidelityPrompt";
import { attachShellCues, disposeAudio, loadMutePreference } from "@/lib/audio";
import { ShellHarness } from "@/components/win98/shell/Desktop";

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
  // §7.1 in-app-browser path: a scene throw or a lost GL context demotes
  // the visitor to the static floor. Folded into `mounts` so the
  // data-experience effect below runs its cleanup and puts the floor back
  // in the flow — the failure and the recovery are the same switch.
  //
  // §7.2 reuses it for the watchdog's ACCEPTED offer. Not a failure, but
  // mechanically identical — unmount the canvas, return the floor to the
  // flow — and one switch with two callers cannot drift the way two
  // parallel demotion paths would.
  const [failed, setFailed] = useState(false);
  const runway = useRef<HTMLDivElement>(null);

  const mounts =
    (detection.tier === "high" || detection.tier === "low") && !failed;

  // Mirror the tier for frame-side readers (frame loops read the mutable
  // singleton, never React state).
  useEffect(() => {
    experienceState.fidelityTier = detection.tier;
  }, [detection]);

  // Audio (6.1). Living here — inside the tier gate — is what gives the
  // spec's "static-floor visitors get no engine at all" for free: this
  // component returns null for tier "static"/"none", so nothing below ever
  // mounts and no AudioContext is ever constructed. The cues only observe
  // win98State; the context itself waits for PowerOn's gesture.
  useEffect(() => {
    if (!mounts) return;
    loadMutePreference();
    const detach = attachShellCues();
    return () => {
      detach();
      disposeAudio();
    };
  }, [mounts]);

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
        {/* "shell" is the 3.2 DOM harness (no canvas, real semantics);
            every other name mounts an isolated canvas scene. */}
        {scene === "shell" ? (
          <ShellHarness />
        ) : (
          <WorkstationCanvas tier={detection.tier} scene={scene} />
        )}
        <p className="pointer-events-none fixed top-4 left-4 z-50 font-mono text-xs tracking-wide text-ink-subtle">
          harness · scene: {scene} · tier: {detection.tier}
        </p>
      </>
    );
  }

  return (
    <ExperienceBoundary onFail={() => setFailed(true)}>
      <WorkstationCanvas
        tier={detection.tier}
        auto={detection.auto}
        scene={null}
        onContextLost={() => setFailed(true)}
      />
      <Choreography runway={runway} />
      {/* Ch. 0 entry gesture, and — since ADR-014 §9 — the title card
          that used to be `TitleBeats` playing across chapter 1. Chapter 1
          now has no DOM overlay at all; its job is the glow. */}
      <PowerOn />
      {/* Says "scroll" wherever the journey has come to a stop (9.2). */}
      <ScrollHint />
      {/* Ch. 4 painter→DOM swap at the dock rest point (4.2). */}
      <DockSwap />
      {/* Ch. 5 contact layer — the journey's final rest point (5.3). */}
      <SignOff />
      {/* Master mute (6.1) — always reachable, including during boot. */}
      <MuteToggle />
      {/* The ladder's terminal rung (7.2): renders only once the watchdog
          has exhausted every silent shed and still cannot hold the floor. */}
      <FidelityPrompt onAccept={() => setFailed(true)} />
      {/* Scroll runway — invisible height the journey scrubs against. */}
      <div
        ref={runway}
        aria-hidden="true"
        style={{ height: `${RUNWAY_LENGTH_VH}vh` }}
      />
    </ExperienceBoundary>
  );
}

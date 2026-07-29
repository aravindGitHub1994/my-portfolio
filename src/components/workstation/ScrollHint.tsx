"use client";

// The journey's scroll affordance (gate 9.2 fix). The film gives the
// visitor exactly one instruction — the power button — and then expects
// them to know that scrolling is the transport. QA asked for a cue at the
// start and again "whenever scroll stalls", which is the honest trigger:
// wherever the journey has come to rest and nothing is happening, say so;
// the moment it moves again, get out of the frame.
//
// Visual language is the static floor's own scroll cue (acts/Hero.tsx) —
// a label over a hairline with a light pulse running down it. The floor is
// display:none while the experience is mounted, so the journey needs its
// own instance; sharing the mark is the point.
//
// It is the same mark, but not the same *values* (ADR-013 §10). The floor's
// tokens were chosen against its flat --color-bg; here the camera opens
// inside the CRT's glow, where a 12 %-alpha hairline over blooming phosphor
// is simply not there. This instance adds a scrim, brightens the rail and
// label, and runs its own pulse timing — see the journey cue block in
// globals.css. The floor keeps its own values untouched.
//
// Frame path follows TitleBeats: one rAF writes opacity straight to the
// element from experienceState. No React state per frame, so nothing here
// re-renders during the ride.

import { useEffect, useRef, useState } from "react";
import { experienceState } from "@/lib/experienceState";
import { win98State } from "@/lib/win98State";
import { coarsePointer } from "@/lib/shellLayout";
import { SIGNOFF_START_P } from "./SignOff";

/** Progress movement below this reads as "stopped" — smaller than a
 *  single wheel notch, larger than Lenis' settle jitter. */
const MOVE_EPS = 0.0005;
/** Stall before the cue appears at a chapter rest point. */
const STALL_MS = 2000;
/** …and at the journey's start, where the visitor has just watched a
 *  machine boot and has been given nothing to do next. */
const START_STALL_MS = 900;
/** Progress past which the ride is over and SignOff owns the frame.
 *
 *  Was 0.995 — effectively "the very end" — which put the cue's label ~30 px
 *  under the contact links for the last stretch of chapter 5. That overlap
 *  predates P7 by a long way; making the cue visible is simply what
 *  revealed it. The owner's call (session 18) was to stop the cue where the
 *  card starts rather than give the cue a SignOff term, so this is
 *  SignOff's own derived start: by the time the contact card is fading in
 *  there is nothing further to scroll to and the instruction is spent. */
const END_P = SIGNOFF_START_P;
/** Opacity fade, ms — slow enough that the cue never pops into a shot. */
const FADE_MS = 450;

export function ScrollHint() {
  const el = useRef<HTMLDivElement>(null);
  // Pointer class is read once: a device does not change mid-ride, and
  // this is a label, not a layout.
  const [coarse] = useState(coarsePointer);

  useEffect(() => {
    let raf = 0;
    let opacity = 0;
    let previous = experienceState.scrollProgress;
    let stillSince = performance.now();
    let last = stillSince;

    const tick = (now: number) => {
      const node = el.current;
      const delta = Math.min(now - last, 100);
      last = now;

      const progress = experienceState.scrollProgress;
      if (Math.abs(progress - previous) > MOVE_EPS) stillSince = now;
      previous = progress;

      // The desktop phase gate keeps the cue off the boot sequence and off
      // the 8.1 crash screen — both are moments where "scroll" is the
      // wrong thing to be told.
      const wanted =
        !experienceState.docked &&
        win98State.phase === "desktop" &&
        progress < END_P &&
        now - stillSince >
          (progress < 0.002 ? START_STALL_MS : STALL_MS);

      // Linear ramp, not an exponential ease. `opacity += (target - opacity)
      // * k` asymptotes toward its target and never arrives, so the cue
      // spent its first seconds faint by construction — one of the three
      // reasons it read as invisible (ADR-013 §10). This reaches full in
      // exactly FADE_MS and then stops.
      const target = wanted ? 1 : 0;
      const step = delta / FADE_MS;
      opacity =
        target > opacity
          ? Math.min(target, opacity + step)
          : Math.max(target, opacity - step);
      if (node) node.style.opacity = opacity.toFixed(3);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={el}
      aria-hidden="true"
      className="pointer-events-none fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-3"
      style={{ opacity: 0 }}
    >
      {/* Scrim first, so it sits behind the mark it protects. */}
      <span className="scroll-cue-scrim" />
      <span className="scroll-cue-label font-mono text-[10px] tracking-[0.3em] uppercase">
        {coarse ? "Swipe" : "Scroll"}
      </span>
      <span className="scroll-cue-rail relative block h-12 w-px overflow-hidden">
        <span className="animate-scroll-cue-journey absolute inset-x-0 top-0 h-full bg-gradient-to-b from-transparent via-accent-bright to-transparent" />
      </span>
    </div>
  );
}

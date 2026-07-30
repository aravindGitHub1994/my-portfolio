"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Snap from "lenis/snap";
import { useLenisRef } from "@/components/LenisProvider";
import {
  DOCK_REST_INDEX,
  REST_POINTS,
  chapterAtProgress,
} from "@/lib/chapters";
import { experienceState } from "@/lib/experienceState";

/**
 * Sole owner of the journey's scroll inputs (ADR-012 Architecture): one
 * ScrollTrigger over the runway writes normalized progress + chapter index
 * into experienceState — frame loops read the singleton, never React state.
 *
 * Soft snap at chapter rest points (ADR-012 §5) goes through `lenis/snap`,
 * not ScrollTrigger's `snap`: ScrollTrigger tweens window scroll directly,
 * which Lenis overwrites every raf — snapping through Lenis is the only
 * side that wins that fight. Reduced-motion visitors never reach this
 * component (they get the static floor), so Lenis always exists here; if it
 * somehow doesn't, scrub still works and only snap is lost.
 */
export function Choreography({
  runway,
}: {
  runway: RefObject<HTMLDivElement | null>;
}) {
  const lenisRef = useLenisRef();

  useEffect(() => {
    const el = runway.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        experienceState.scrollProgress = self.progress;
        experienceState.chapterIndex = chapterAtProgress(self.progress);
        // Dusk deepens across chapter 5 (4.1 lighting cue) — rides the
        // same scrub, so it reverses cleanly too.
        const signOffStart = REST_POINTS[4];
        experienceState.duskDeepen = Math.min(
          Math.max((self.progress - signOffStart) / (1 - signOffStart), 0),
          1,
        );
      },
    });

    const lenis = lenisRef?.current;
    let snap: Snap | null = null;
    let removeSnaps: (() => void)[] = [];

    // One function for both jobs, because both are the same fact — where
    // the runway sits in page pixels. Publishing it lets the dock convert
    // its rest point back to a scroll target (4.2) without re-deriving the
    // runway's layout, and the two can never disagree about the mapping.
    const publishRunway = () => {
      const span = trigger.end - trigger.start;
      experienceState.runwayStart = trigger.start;
      experienceState.runwaySpan = span;
      if (!snap) return;
      removeSnaps.forEach((remove) => remove());
      // Chapter 4 is deliberately NOT a snap point: the dock owns its own
      // landing now (DockSwap latches on crossing, then eases the camera
      // exactly square-on). Two mechanisms competing for one rest point is
      // what made that approach feel twitchy — and left the proximity snap
      // tugging a visitor back the moment they undocked.
      removeSnaps = REST_POINTS.filter((_, i) => i !== DOCK_REST_INDEX).map(
        (p) => snap!.add(trigger.start + p * span),
      );
    };

    if (lenis) {
      snap = new Snap(lenis, {
        type: "proximity",
        duration: 0.6,
        distanceThreshold: "20%",
      });
    }
    publishRunway();

    // Rest-point pixel positions depend on trigger.start/end — recompute
    // whenever ScrollTrigger refreshes (resize, font load, etc.).
    ScrollTrigger.addEventListener("refresh", publishRunway);

    // Keyboard stepping (ADR-012 §5/§9): arrows/space/page keys drive the
    // SAME timeline by scrolling to the neighbouring rest point via Lenis.
    const onKeyDown = (e: KeyboardEvent) => {
      if (experienceState.docked) return; // 4.2: dock owns input
      const forward = ["ArrowDown", "ArrowRight", "PageDown", " "].includes(
        e.key,
      );
      const back = ["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key);
      if (!forward && !back) return;
      e.preventDefault();
      const points = [0, ...REST_POINTS];
      const current = trigger.progress;
      const next = forward
        ? points.find((p) => p > current + 0.005)
        : [...points].reverse().find((p) => p < current - 0.005);
      if (next === undefined) return;
      const span = trigger.end - trigger.start;
      const px = trigger.start + next * span;
      if (lenis) lenis.scrollTo(px, { duration: 1.1 });
      else window.scrollTo({ top: px, behavior: "smooth" });
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      ScrollTrigger.removeEventListener("refresh", publishRunway);
      removeSnaps.forEach((remove) => remove());
      snap?.destroy();
      trigger.kill();
      experienceState.scrollProgress = 0;
      experienceState.chapterIndex = 0;
      experienceState.runwayStart = 0;
      experienceState.runwaySpan = 0;
    };
  }, [runway, lenisRef]);

  return null;
}

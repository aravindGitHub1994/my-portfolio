"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Snap from "lenis/snap";
import { useLenisRef } from "@/components/LenisProvider";
import { REST_POINTS, chapterAtProgress } from "@/lib/chapters";
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
      },
    });

    const lenis = lenisRef?.current;
    let snap: Snap | null = null;
    let removeSnaps: (() => void)[] = [];

    const addSnaps = () => {
      if (!snap) return;
      removeSnaps.forEach((remove) => remove());
      const span = trigger.end - trigger.start;
      removeSnaps = REST_POINTS.map((p) =>
        snap!.add(trigger.start + p * span),
      );
    };

    if (lenis) {
      snap = new Snap(lenis, {
        type: "proximity",
        duration: 0.6,
        distanceThreshold: "20%",
      });
      addSnaps();
    }

    // Rest-point pixel positions depend on trigger.start/end — recompute
    // whenever ScrollTrigger refreshes (resize, font load, etc.).
    ScrollTrigger.addEventListener("refresh", addSnaps);

    return () => {
      ScrollTrigger.removeEventListener("refresh", addSnaps);
      removeSnaps.forEach((remove) => remove());
      snap?.destroy();
      trigger.kill();
      experienceState.scrollProgress = 0;
      experienceState.chapterIndex = 1;
    };
  }, [runway, lenisRef]);

  return null;
}

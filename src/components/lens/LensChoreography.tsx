"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { lensState } from "./lensState";

/**
 * Single owner of the Lens's scroll inputs (ADR-006 act choreography).
 * One ScrollTrigger per act writes normalized progress into lensState —
 * the scene's frame loops read and damp them, so nothing here re-renders
 * React. Also tracks smoothed scroll velocity (viewport-heights/second)
 * for the distortion pass and kinetic-type shear.
 *
 * Reduced-motion: nothing registers — acts stay 0 and the static tier
 * renders its resolved end-state.
 */
export function LensChoreography() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const triggers: ScrollTrigger[] = [];
    const track = (
      id: string,
      vars: ScrollTrigger.Vars,
      write: (p: number) => void,
    ) => {
      const el = document.getElementById(id);
      if (!el) return;
      const apply = (self: ScrollTrigger) => write(self.progress);
      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          ...vars,
          onUpdate: apply,
          onRefresh: apply,
        }),
      );
    };

    // Hero exit — drift + shrink.
    track("hero", { start: "top top", end: "bottom top" }, (p) => {
      lensState.acts.hero = p;
    });
    // Approach — the chromatic fan organizes into ordered beams.
    track("approach", { start: "top 75%", end: "bottom 55%" }, (p) => {
      lensState.acts.approach = p;
    });
    // Work — tent (0→1→0): the Lens recedes while projects hold the stage.
    track("work", { start: "top bottom", end: "bottom top" }, (p) => {
      lensState.acts.work =
        smooth(0, 0.15, p) * (1 - smooth(0.85, 1, p));
    });
    // Trajectory — crystallization beat: prism → cube.
    track("trajectory", { start: "top 80%", end: "top 25%" }, (p) => {
      lensState.acts.trajectory = p;
    });
    // Contact — dissolve: cube → point-globe.
    track("contact", { start: "top 95%", end: "bottom bottom" }, (p) => {
      lensState.acts.contact = p;
    });

    // Scroll velocity in viewport-heights/second, smoothed.
    let lastY = window.scrollY;
    let lastT = performance.now();
    const tick = () => {
      const y = window.scrollY;
      const t = performance.now();
      const dt = Math.max(1, t - lastT) / 1000;
      const v = (y - lastY) / window.innerHeight / dt;
      const clamped = Math.max(-3, Math.min(3, v));
      lensState.scrollVelocity +=
        (clamped - lensState.scrollVelocity) * Math.min(1, dt * 8);
      lastY = y;
      lastT = t;
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      triggers.forEach((t) => t.kill());
      lensState.acts.hero = 0;
      lensState.acts.approach = 0;
      lensState.acts.work = 0;
      lensState.acts.trajectory = 0;
      lensState.acts.contact = 0;
      lensState.scrollVelocity = 0;
    };
  }, []);

  return null;
}

function smooth(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

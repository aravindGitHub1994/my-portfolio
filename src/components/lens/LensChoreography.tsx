"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { lensState } from "./lensState";
import { NO_TARGET } from "./projectionTargets";

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
    // Work projection (ADR-008 §2): one trigger per pinned card writes which
    // window the prism projects into (index + side) and the card's stage
    // progress (blend). World coords are the scene tracker's job — only it
    // has the camera. Card DOM order matches PROJECTS order; adjacent
    // 150vh runways make exactly one card active at the 55% line, and the
    // `index ===` guard keeps an out-of-order deactivate from clobbering the
    // neighbour that just took over.
    const cards = gsap.utils.toArray<HTMLElement>(
      "#work article[data-project]",
    );
    cards.forEach((card, index) => {
      const apply = (self: ScrollTrigger) => {
        if (self.isActive) {
          lensState.projection.index = index;
          lensState.projection.side = index % 2 === 0 ? 1 : -1;
          lensState.projection.blend = self.progress;
        } else if (lensState.projection.index === index) {
          lensState.projection.index = NO_TARGET;
          lensState.projection.blend = 0;
        }
      };
      triggers.push(
        ScrollTrigger.create({
          trigger: card,
          start: "top 55%",
          end: "bottom 55%",
          onUpdate: apply,
          onToggle: apply,
          onRefresh: apply,
        }),
      );
    });

    // Trajectory — the prism eases home and the ordered fan re-forms.
    track("trajectory", { start: "top 80%", end: "top 25%" }, (p) => {
      lensState.acts.trajectory = p;
    });
    // Contact — beams bend into the CTA underline finale (ADR-008 §3).
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
      lensState.projection.index = NO_TARGET;
      lensState.projection.blend = 0;
      lensState.scrollVelocity = 0;
    };
  }, []);

  return null;
}

function smooth(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

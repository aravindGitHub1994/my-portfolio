// Runtime side of the project-card curtain reveal (ADR-007). A blue squiggle
// band sweeps across a preview and, in its wake, an SVG <mask> uncovers the
// architecture diagram beneath the product screenshot. This module owns only
// the GSAP timeline; the geometry + markup live in ProjectRevealCurtain.tsx.
//
// The whole effect is transform-only: one paused, reversible timeline
// translates the squiggle <g> and the mask-front <g> in lockstep along x.
// Nothing rewrites path data per frame (ADR-006's transform-first rule holds),
// so hover-out is a true reverse() at the exact forward rate.

import { gsap } from "gsap";

export interface CurtainRevealOptions {
  /**
   * Elements translated together across the preview — the visible squiggle
   * band and the white mask-front fill. Both are authored in the same viewBox
   * units so a single x tween keeps them in sync.
   */
  sweep: SVGGraphicsElement[];
  /** The squiggle band, faded out entirely under reduced motion. */
  squiggles: SVGGraphicsElement | null;
  /** translateX (viewBox units) with the curtain parked off-screen left — diagram fully hidden. */
  fromX: number;
  /** translateX with the curtain swept clear of the right edge — diagram fully shown. */
  toX: number;
  /** Forward sweep seconds; reverse() replays the hide at the same rate. */
  duration?: number;
  ease?: string;
  /** When true, open/close snap instantly and the blue band never shows (a11y). */
  reducedMotion?: boolean;
}

export interface CurtainRevealController {
  /** Reveal the diagram (pointer-enter / focus). Safe to call repeatedly. */
  open(): void;
  /** Re-hide the diagram (pointer-leave / blur) — the reverse of open. */
  close(): void;
  /** Kill the timeline and drop tweens (component unmount). */
  destroy(): void;
}

export function createCurtainReveal({
  sweep,
  squiggles,
  fromX,
  toX,
  duration = 1.05,
  ease = "power3.inOut",
  reducedMotion = false,
}: CurtainRevealOptions): CurtainRevealController {
  // Resting state: curtain off-screen left, mask fully black → diagram hidden,
  // screenshot showing. Set explicitly so JS and the SSR transform agree.
  gsap.set(sweep, { x: fromX });

  if (reducedMotion) {
    // No sweep: the images swap instantly and the blue band stays hidden so a
    // reduced-motion user never catches a half-drawn frame.
    if (squiggles) gsap.set(squiggles, { autoAlpha: 0 });
    return {
      open: () => gsap.set(sweep, { x: toX }),
      close: () => gsap.set(sweep, { x: fromX }),
      destroy: () => gsap.killTweensOf(sweep),
    };
  }

  const tl = gsap
    .timeline({ paused: true, defaults: { duration, ease } })
    .fromTo(sweep, { x: fromX }, { x: toX }, 0);

  return {
    open: () => tl.play(),
    close: () => tl.reverse(),
    destroy: () => {
      tl.kill();
      gsap.killTweensOf(sweep);
    },
  };
}

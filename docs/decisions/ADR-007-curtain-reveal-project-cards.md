# ADR-007 — Curtain-reveal project cards

**Status:** Accepted · Supersedes the project-card portion of [ADR-006](ADR-006-lens-refractive-redesign.md) §5–§6 · Amended by [ADR-008](ADR-008-projection-work-act-and-prism-finale.md) (the preview now renders inside a Safari-style browser frame; the reveal itself is unchanged) · Amended by [ADR-009](ADR-009-lens-refinement-glass-refraction-and-high-default-fidelity.md) (a hover/focus discovery affordance — hint pill + cursor "Reveal" label — added; the reveal mechanism unchanged)
**Date:** 2026-07-09

## Context

ADR-006 (The Lens) renders each Work-act project as two **separately visible**
beats stacked in a panel: Beat 1, the recreated dummy-data screenshot (distorted
on the WebGL layer by `GlassImage`); Beat 2, the architecture diagram below it,
resolving **once on scroll entry** via `buildDrawTimeline` + `spawnPackets`.

A new brief asked for a hover-driven reveal instead: on hover/focus, a band of
thick blue hand-drawn squiggles sweeps left→right across the preview and reveals
the diagram in its wake, with the screenshot hidden in the revealed area and a
smooth reverse on leave. The pasted spec targeted SvelteKit + GSAP; this project
is **Next.js 16 / React 19** static export, and already depends on GSAP.

This reveal model **conflicts** with ADR-006: it overlays the two beats (rather
than showing both), gates the diagram behind the screenshot (rather than showing
it on scroll), and is hover/focus-driven (rather than scroll-driven). The choice
to override was made explicitly by the maintainer.

## Decision

For project cards **that have a recreated screenshot**, replace the stacked
two-beat panel with a single **curtain reveal** (`ProjectRevealCurtain`):

- One inline `<svg>` holds all three layers as siblings — screenshot `<image>`,
  the diagram `<image>` gated by an SVG `<mask>`, and the visible squiggle band.
  Masking is **SVG-internal**, not a CSS mask over HTML, so it is reliable across
  browsers.
- The reveal is **transform-only**: a single paused, reversible GSAP timeline
  (`src/lib/curtainReveal.ts`, `power3.inOut`, ~1.05s) translates the squiggle
  `<g>` and the white mask-front `<g>` together along x. Path data is authored
  once (deterministic two-harmonic sine wave, no `Math.random`) and never
  rewritten per frame. Hover-out is `timeline.reverse()` at the same rate.
- The mask-front's wavy edge trails the leading squiggle by ~24u, so the diagram
  is revealed in the band's wake.
- Per-instance ids via `useId()` isolate each card's mask.
- Pointer (`pointerenter`/`leave`) **and** keyboard (`focus`/`blur`, the preview
  is a focusable `role="img"`) both drive it. `prefers-reduced-motion` snaps the
  images instantly and never shows the band. The squiggle layer is
  `pointer-events: none`, so the overlay never traps clicks.

Cards **without a screenshot** (currently only `personas`, in progress) have
nothing to reveal from and **keep ADR-006 §6** unchanged: the inline diagram
resolves on scroll entry with the draw-on + packet pass.

## Consequences

**Gained:** a tactile, on-brand reveal that ties the product UI and its
architecture together in one gesture; keyboard-accessible; reduced-motion-safe;
SSR/static-export-safe; reusable for any future `{screenshot, diagram}` pair.

**Given up (accepted trade-offs), for the three screenshot-backed cards:**

- The `GlassImage` WebGL distortion of the screenshot. `GlassImage` is no longer
  instantiated, so its kinetic "image" twin lies dormant (the component and the
  `GlassImageLayer` pipeline remain in the tree, harmless and revertible).
- The diagram's **draw-on animation and data-packet pass**. Under the curtain the
  diagram is a static `<image>` of the authored SVG (revealed, not drawn). The
  draw-on/packet code (`diagramAnimation.ts`) still ships and still runs for the
  screenshot-less card.
- A slight inconsistency: one card scroll-draws its diagram while three
  curtain-reveal. Acceptable while `personas` is the lone screenshot-less,
  in-progress project.

**Follow-up (not done here):** keeping the diagram animated *under* the curtain
would require masking live inline-SVG/HTML with a CSS mask referencing an SVG
`<mask>` — browser-fragile with responsive sizing — so it was deliberately
deferred in favour of the robust all-in-one-SVG approach.

The imagery constraint from ADR-006 §7/§7a still holds: screenshots under
`public/screens/` must be fabricated dummy-data recreations, never raw client
captures.

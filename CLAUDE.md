# Portfolio (Claude guide)

Static-export **Next.js 16** portfolio. Start with `README.md` for the overview;
full agent rules and conventions live in `@AGENTS.md` (imported below). Quick facts:
`npm run dev` runs on **port 3004**, `npm run build` produces a static export in
`out/`, and site content is edited in `src/lib/*.ts` — not in JSX.

The background is one persistent WebGL `<canvas>` in `src/components/lens/` —
**The Lens** ([ADR-006](docs/decisions/ADR-006-lens-refractive-redesign.md),
amended by [ADR-008](docs/decisions/ADR-008-projection-work-act-and-prism-finale.md)
and [ADR-009](docs/decisions/ADR-009-lens-refinement-glass-refraction-and-high-default-fidelity.md)):
a dispersion prism refracting data-packet particles into insight-beams. The prism
is the site's **constant object** — during Work it turns projector (beams curve
into each card's Safari-framed window; `projectionTargets.ts`), and at Contact
its beams underline the CTA. A pointer-keyed refractive postprocessing pass and
canvas-raster kinetic headings ride on top (`lens/kinetic/` — the DOM element
stays semantic; its GL twin renders on the high tier only). Scroll inputs
live in `LensChoreography` + `lensState`; fidelity is **high by default**
with a runtime FPS-watchdog fallback to `low` (`src/lib/gpuTier.ts`,
`?tier=high|low|static` override; ADR-009). It replaced the ADR-005 glass cube
(`src/components/cube/`, retired). Never commit raw client screenshots — imagery
under `public/screens/` must be dummy-data recreations (ADR-006 §7a).

**Confidentiality.** Client names and client financial figures must not appear
anywhere in this repo — not in code, docs, commit messages, or ADRs, *including*
prose describing this rule. Refer to parties by role ("a named client", "real spend
figures"). ADR-006 §7a's account of which files leaked is inaccurate and its
remediation is not being pursued; treat the rule above as authoritative and the §7a
narrative as unreliable.

@AGENTS.md

# Portfolio (Claude guide)

Static-export **Next.js 16** portfolio. Start with `README.md` for the overview;
full agent rules and conventions live in `@AGENTS.md` (imported below). Quick facts:
`npm run dev` runs on **port 3004**, `npm run build` produces a static export in
`out/`, and site content is edited in `src/lib/*.ts` — not in JSX.

The background is one persistent WebGL `<canvas>` in `src/components/lens/` —
**The Lens** ([ADR-006](docs/decisions/ADR-006-lens-refractive-redesign.md)): a
dispersion prism refracting data-packet particles into insight-beams, reshaping
prism → cube → point-globe across the five acts, with a pointer-keyed refractive
postprocessing pass and canvas-raster kinetic headings (`lens/kinetic/` — the DOM
element stays semantic; its GL twin renders on the high tier only). Scroll inputs
live in `LensChoreography` + `lensState`; fidelity tiers in `src/lib/gpuTier.ts`
(`?tier=high|low|static` override). It replaced the ADR-005 glass cube
(`src/components/cube/`, retired). Never commit raw client screenshots — imagery
under `public/screens/` must be dummy-data recreations (ADR-006 §7a).

**Confidentiality.** Client names and client financial figures must not appear
anywhere in this repo — not in code, docs, commit messages, or ADRs, *including*
prose describing this rule. Refer to parties by role ("a named client", "real spend
figures"). ADR-006 §7a's account of which files leaked is inaccurate and its
remediation is not being pursued; treat the rule above as authoritative and the §7a
narrative as unreliable.

@AGENTS.md

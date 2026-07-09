# ADR-006: "The Lens" — a Refractive, Data→Insight WebGL Portfolio

## Status
Accepted — **partially supersedes ADR-005** (the cube is no longer the always-on
spine (§2), mobile is no longer identical choreography (§3), and diagram animation is
no longer scroll-scrubbed (§5)); **reverses ADR-002** (recreated, dummy-data product
screenshots are now used); **retains ADR-001** (static export). ADR-003/004 remain
superseded by ADR-005. See Related Decisions.

## Date
2026-07-07

## Context
The `threeJS-redesign` build (ADR-005) shipped P1–P3 partial: a persistent glass cube
behind DOM content, five acts, scroll-scrubbed architecture diagrams. In review the
owner found the result directionally right but under-powered against the target
reference, **ryanritzenthaler.com** (React/Next/**Three.js**, Firebase, Prismic —
"a flat, 2D website with the mouse interactivity of 3D shaders on plane geometries":
scroll-velocity + pointer distortion with chromatic aberration, a custom loading-
provider intro, image-forward WebGL planes, kinetic type). Refined in a
`/grill-with-docs` session (2026-07-07). The decisions below resolve the branches that
emerged; the tensions worth recording:

- **The reference is image-forward and text-sparse; this site is text-dense.** Ryan
  renders headings *and* body copy as WebGL so the whole field warps around the
  pointer. This portfolio's differentiator is depth — `problem`/`approach`/`outcome`/
  `howAI`, a timeline, tiered skills — and its *purpose* is to be read by recruiters,
  parsed by ATS, and indexed by Google. Rendering dense body copy as WebGL text would
  blur at size, be costly to lay out (esp. mobile), and require a parallel semantic
  DOM to remain discoverable.
- **"The cube is good but not impressive."** The owner wanted a stronger central idea
  than "a glass cube," specifically *something that shows data transitioning into
  meaning and insight* — which also happens to be the literal value proposition.
- **Confidential client data resurfaced.** Three project screenshots were added to
  `docs/`. All three carry confidential content: **LG Electronics Portugal** + real
  SKUs (GMC), **$35M / $118M** real MMM figures + identifying channels (Budget), and
  **APM Monaco** (Taxonomy). Two are **already committed to a public GitHub repo**
  (`aravindGitHub1994/my-portfolio`, verified reachable on `raw.githubusercontent.com`
  at `origin/main`). This is exactly the leak ADR-002 chose Mermaid diagrams to avoid.
- **The distortion effect can only touch what is rendered in WebGL.** A shader cannot
  warp crisp DOM text/images; to distort them they must become WebGL planes. So "where
  the distortion lives" is the architectural fork that reshapes everything.
- **The heavier the WebGL, the harder ADR-005's "mobile equally polished, identical
  choreography" promise becomes.** Dispersion + GPGPU particles + a full-screen
  distortion pass + WebGL text is far costlier than one cube.

## Decision

### 1. Central metaphor — "The Lens" (data → meaning → insight)
The visual spine is a **dispersion prism ("The Lens")** that refracts streams of raw
**data packets** into ordered, colored **insight-beams** — enacting *data → meaning →
insight* across the scroll. The prism **reshapes act to act (prism → cube → globe)**;
the **cube returns as the payoff** (a crystallized-insight beat), not the premise. This
replaces ADR-005's "one morphing glass cube is the constant object" (§2): the constant
is now the refraction *process*, and the cube is one state within it.

### 2. Rendering model — hybrid (WebGL visuals distort; DOM body stays crisp)
- **WebGL layer (warps with pointer + scroll velocity, chromatic aberration):** all
  headings, big stat numbers, and **all imagery** — recreated screenshots, re-authored
  diagrams, and the prism/particles.
- **DOM layer (crisp, selectable, accessible):** dense body copy, the "Read the build"
  disclosure, and the timeline.
- WebGL headings carry a **hidden semantic DOM mirror** (real `<h1>…<p>`,
  `aria-hidden` on the canvas) so ATS/search/screen-readers still see the content.
- Rejected: full-WebGL-surface incl. body text (accessibility/SEO/text-density cost);
  living-background-only (distortion never touches the visuals — off-brand to the ref).

### 3. Kinetic type — "refract-in assembly"
WebGL headings and numbers **coalesce out of chromatic shards** (RGB-split light
gathers, then settles to a crisp letterform) and **shear/aberrate with scroll
velocity**. Big figures (44 sub-accounts, 19-site architecture, 200+ consultants,
4 projects, 5 areas) count up as they resolve. Reduced-motion/mobile: a plain fade.

### 4. Pointer distortion — a global refractive pass
A screen-space **chromatic-aberration + displacement postprocessing pass** over the
WebGL layer, keyed to **pointer position + scroll velocity** ("everything around the
pointer distorts and goes achromatic"). Disabled under `prefers-reduced-motion` and on
touch/low tiers.

### 5. Work act — two-beat refraction per project
Each project refracts through the Lens in two beats: **Beat 1 — the recreated
screenshot** (the product is real), then **Beat 2 — the re-authored architecture
diagram** resolves crisp, with **data packets flowing the edges once, on entry** (no
scroll-scrub). Image planes distort subtly but **snap crisp when the project is
centered/active** (resolving the distortion-vs-legibility tension). Full
`problem/approach/outcome/howAI/stack` stays behind the DOM "Read the build" disclosure.

### 6. Diagrams — re-authored for legibility, single-play
The four architecture diagrams are re-authored for **legibility** (larger labels,
fewer/denser nodes, sized to fill their frame) and animate **once on entry** — a draw-
on + packet-flow that plays through and settles. This **reverses ADR-005 §5's** scroll-
scrubbed 1:1 draw-on (found unintuitive — it read as "loading") and retires the cube-
face `DiagramFace` projection.

### 7. Screenshots — recreated with dummy data (reverses ADR-002)
Clean "hero" versions of the three product UIs (Taxonomy, Budget/MMM, GMC) are
**recreated with fabricated-but-realistic data** — fictional client/brand names,
invented SKUs/Offer IDs, plausible dummy $ figures — safe to publish and to distort as
WebGL planes. Personas (exploratory) keeps its diagram only. This **reverses ADR-002's
"no screenshots"** decision; ADR-002's *reasoning* (never ship confidential data) is
**retained and reaffirmed** — see §7a.

### 7a. Confidentiality remediation (OPEN ACTION — not yet done)
The two already-public originals (Budget `$35M/$118M`; Taxonomy `APM Monaco`) and the
untracked GMC/`LG Electronics Portugal` screenshot must be removed from the repo and
its **public git history** (`git filter-repo`/BFG + force-push across `main` and
`feat/*`), `docs/**/Screenshot*.png` git-ignored, and NDA/contract terms checked before
any client work — even sanitized — is shown. Deleting the files in a new commit is
**insufficient**; they remain fetchable at prior SHAs. This is independent of the
redesign and outstanding as of this ADR.

### 8. Mobile — graceful reduction (reverses ADR-005 §3)
Mid-range mobile gets a **calmer, honestly non-identical** Lens: static/low-particle
prism, screenshots as **crisp DOM `<img>`** (not distorting planes), light-or-no
postprocessing, type fades instead of refract-in, diagrams crisp with a single packet
pass. `prefers-reduced-motion`: **static resolved "insight" end-states**, no morph, no
distortion. This **reverses ADR-005 §3's** "identical choreography across all devices"
— that promise was affordable for one cube, not for dispersion + GPGPU + full-screen
postprocessing + WebGL text.

### 9. Stack & constraints
- **New runtime dep:** `@react-three/postprocessing` (+ `postprocessing`) for the
  distortion pass. Kinetic WebGL text uses drei `<Text>` (bundles `troika-three-text`;
  font **self-hosted** per CSP `font-src 'self'`). GPGPU packets/point-clouds use
  three's built-in `GPUComputationRenderer` (no new dep).
- **Static export (ADR-001) retained.** All WebGL/DOM access stays inside effects/
  mounted guards; the prerendered HTML must still carry the semantic DOM (§2) so the
  page is not an empty canvas to crawlers/no-JS.
- **CSP unchanged** (`connect-src 'self'` / `font-src 'self'`): no CDN HDRs, fonts, or
  GPU-benchmark fetches — all local/procedural.
- The five acts (Hero · Approach · Work · Trajectory · Contact) are retained.

### 10. Glossary (canonical terms)
**The Lens** — the dispersion prism that is the site's central object. **Data packets**
— particles flowing in as raw data. **Insight-beams** — the ordered, refracted output.
**Refract-in** — the kinetic-type entrance (§3). **Graceful reduction** — the mobile
tier philosophy (§8). (This repo records terms in ADRs + `AGENTS.md`, not a root
`CONTEXT.md`.)

## Alternatives Considered

- **Full WebGL surface, body copy included** — closest to the reference; rejected: a
  text-dense job-seeking portfolio can't afford WebGL body copy (a11y/SEO/mobile-layout
  cost, blur at size, ~2× content maintenance for the DOM mirror).
- **Living-background-only distortion** (cube + particles distort, everything else DOM)
  — rejected: the distortion never touches the actual visuals, losing the reference's
  signature.
- **Keep the cube as the always-on spine** (ADR-005 §2) — rejected: "not impressive,"
  and it competes with the image-plane Work act.
- **"Condensation" and "Signal-from-Noise" metaphors** — rejected in favour of **The
  Lens**, which best marries the owner's data-packet and chromatic-dispersion loves to
  the literal *data → insight* value proposition.
- **Identical mobile choreography** (ADR-005 §3) — rejected on GPU/thermal reality.
- **Sanitize the real screenshots** (paint-over) vs. **recreate with dummy data** —
  recreate chosen; sanitizing risks a missed value and reversible blur.
- **Use the screenshots as-is / abstract-blur only** — rejected on confidentiality.

## Consequences

### Positive
- A single, legible concept — *the analyst refracts raw data into insight* — that ties
  the owner's loves (data packets, chromatic dispersion, the cube) to the actual
  positioning; more distinctive than "a glass cube."
- The reference's "everything warps around the pointer" is honored where it counts
  (all visuals + headings) without sacrificing the readability that gets the owner
  hired.
- Recreated dummy-data screenshots give the image-forward aesthetic real material while
  removing the confidentiality risk that ADR-002 correctly feared.
- Mobile and reduced-motion are handled honestly rather than over-promised.

### Negative
- **Materially heavier** than ADR-005: dispersion, GPGPU particles, a postprocessing
  distortion pass, and WebGL text — a larger bundle and a real cross-device perf/QA
  surface; `@react-three/postprocessing` added.
- The **hidden semantic DOM mirror** for WebGL headings is ongoing maintenance and a
  correctness risk (drift between WebGL text and its DOM twin).
- Reverses two prior promises (ADR-005 §3 identical-mobile; ADR-002 no-screenshots) and
  retires shipped work (`DiagramFace`, scroll-scrubbed draw-on).
- **True per-wavelength dispersion** and refract-in glyph choreography are non-trivial
  to tune; a fallback (drei transmission `chromaticAberration` / simple fade) may be
  needed on lower tiers.
- The confidentiality remediation (§7a) is a **required, still-outstanding** action on
  a public repo; the redesign must not proceed to shipping client visuals until it and
  the NDA check are done.

## Related Decisions
- **ADR-001** (static export) — **retained**. Semantic DOM must survive prerender.
- **ADR-002** (Mermaid, no screenshots) — **reversed** on the artifact (recreated
  dummy-data screenshots now used) but its confidentiality *principle* is reaffirmed
  (§7, §7a).
- **ADR-005** (cube-spine redesign) — **partially superseded**: §2 (cube as constant
  spine → the Lens/refraction is the constant, cube is a payoff state), §3 (identical
  mobile → graceful reduction), §5 (scroll-scrubbed diagrams → single-play, `DiagramFace`
  retired). Its positioning (honest, real numbers only), five-act structure, dark +
  electric-blue + Geist system, and direct-link contact are **retained**.
- **ADR-003 / ADR-004** — remain superseded by ADR-005.
- Implementation plan (`implementation-plan-0004.md`) — to be written; will re-slice the
  phases around the prism/particle spine, the distortion pass, refract-in type, the
  Work refractor, and the mobile graceful-reduction + a11y mirror.

## References
- [ryanritzenthaler.com](https://www.ryanritzenthaler.com/) — reference (Three.js/WebGL, plane-geometry shader distortion, kinetic type)
- [drei — MeshTransmissionMaterial / Text](https://github.com/pmndrs/drei)
- [@react-three/postprocessing](https://github.com/pmndrs/react-postprocessing)
- [three GPUComputationRenderer](https://threejs.org/examples/?q=gpgpu)
- [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) · [Lenis](https://github.com/darkroomengineering/lenis)
- ADR-001 / ADR-002 / ADR-005 (this repo) — the records this decision retains, reverses, and supersedes.

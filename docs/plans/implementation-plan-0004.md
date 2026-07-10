# Implementation Plan 0004 — "The Lens" Refractive Redesign

> Source decision: **ADR-006**
> (`docs/decisions/ADR-006-lens-refractive-redesign.md`), which partially
> supersedes ADR-005 and reverses ADR-002. Re-slices the remaining work around
> the prism/particle spine, the global distortion pass, refract-in type, the
> Work refractor, and mobile graceful reduction. Supersedes the unfinished
> slices of `implementation-plan-0003.md` (its shipped foundations — dark
> shell, Lenis, tiering, diagrams-as-structured-SVG, ReadTheBuild, Trajectory —
> are kept).

## Context / Why

ADR-005's cube shipped P1–P3 partial and reviewed as "good but not
impressive." ADR-006 replaces the cube-as-spine with **The Lens**: a
dispersion prism refracting **data packets** into **insight-beams** — *data →
meaning → insight* enacted across the scroll. WebGL owns all visuals +
headings (and warps them around the pointer); dense body copy stays crisp DOM.
Mobile gets **graceful reduction**, not identical choreography.

**Constraints (unchanged):** static export (ADR-001); CSP `connect-src
'self'` / `font-src 'self'` (no CDN HDRs/fonts/benchmarks); all WebGL/DOM
access inside effects/`ssr:false`; prerendered HTML must carry the full
semantic DOM.

## Engineering deviations from ADR-006 §9 (recorded, vetoable)

1. **Kinetic WebGL type = canvas-raster planes, not drei `<Text>`/troika.**
   `next/font` emits hashed **woff2**, which troika's parser cannot consume —
   drei `<Text>` would force vendoring a second Geist artifact (ttf/woff) and
   risks SDF softness at display sizes. Instead each heading rasterizes its
   *own DOM node's* computed style to a 2D canvas (Geist is already loaded via
   `document.fonts`) and renders as a texture plane — pixel-parity with the
   DOM mirror by construction, crisper at size, zero new deps. The refract-in
   shard/RGB-split choreography lives in the plane's fragment shader. drei
   `<Text>` remains the fallback if raster resolution proves insufficient.
2. **Packets/beams = stateless vertex-shader advection, not
   `GPUComputationRenderer`.** Streams follow parametric flow paths evaluated
   per-frame in the vertex shader from per-particle seeds — deterministic,
   no FBO ping-pong, cheap enough to keep a reduced form on mobile. GPGPU is
   the recorded upgrade path if pointer-interactive scatter is later wanted.

## Act choreography (the Lens's scroll story)

| Act | Lens state | Beat |
|---|---|---|
| 1 Hero | **Prism**, center-right; raw packets stream in, spectrum beams fan out | thesis stated |
| 2 Approach | Prism tightens; beams **organize** into parallel ordered lines | method |
| 3 Work | Lens **recedes** small + dim (image planes own the stage); per-project pulse | evidence |
| 4 Trajectory | Beams converge — prism **crystallizes into the cube** (the payoff beat) | accumulation |
| 5 Contact | Cube **dissolves into a point-globe**; beams become its graticule | invitation |

## Slice overview

| # | Slice | Type | Blocked by |
|---|---|---|---|
| **P0** | **Confidentiality (§7a)** | | |
| 0.1 | Ignore + untrack `docs/**/Screenshot*.png` (files stay local) | AFK | — |
| 0.2 | Public **history rewrite** (`git filter-repo`/BFG) + force-push `main`/`feat/*`; NDA check | **HITL — owner authorizes** | 0.1 |
| **P1** | **Lens spine** | | |
| 1.1 | `lensState` (pointer, pointer speed, scroll velocity, per-act progress) + `LensCanvas`; retire `cube/*` incl. `DiagramFace` | AFK | — |
| 1.2 | The Lens solid: prism w/ transmission dispersion (high) / faux-glass (low); pointer tilt | AFK | 1.1 |
| 1.3 | Data streams: packet inflow + refracted insight-beams (shader points + beam blades) | AFK | 1.2 |
| 1.4 | Act choreography: scroll-driven prism→cube→globe per the table above | AFK | 1.3 |
| **P2** | **Distortion pass** | | |
| 2.1 | Custom postprocessing effect: pointer-radial displacement + chromatic aberration, keyed to pointer speed + scroll velocity; high tier only | AFK | 1.1 |
| **P3** | **Kinetic type** | | |
| 3.1 | `KineticText`: DOM node stays semantic (hidden on high tier), canvas-raster GL twin, refract-in shards, velocity shear; fade fallback | AFK | 1.1 |
| 3.2 | Apply to Hero `h1` + `SectionHeader` titles | AFK | 3.1 |
| 3.3 | Approach act with count-up stat figures (44 / 19 / 200+ / 4 / 5) as kinetic numbers | AFK | 3.1 |
| **P4** | **Work refractor** | | |
| 4.1 | Single-play diagrams: draw-on + one packet pass **on entry** (retire scroll-scrub) | AFK | — |
| 4.2 | `screenshot?` on `Project` + Beat-1 image slot (`GlassImage`: distorting GL plane on high tier, crisp `<img>` otherwise; snaps crisp when centered) | AFK | 1.1 |
| 4.3 | **Recreate 3 hero screenshots with dummy data** (Taxonomy, Budget, GMC — fictional brands/SKUs/$) | HITL | 0.2 |
| 4.4 | Re-author 4 diagrams for legibility (larger labels, denser fill) | HITL | — |
| **P5** | **Graceful reduction + docs** | | |
| 5.1 | Tier audit: low = static prism, DOM imgs, no post, type fades; static = resolved end-states | AFK | P1–P4 |
| 5.2 | Docs: `design-system.md` Lens contract, README/CLAUDE/AGENTS | AFK | 5.1 |

**Session note (2026-07-07):** 0.1 done; 1.1–1.4, 2.1, 3.1–3.2, 4.1, 4.2
implemented this session. 0.2 awaits owner authorization. 3.3, 4.3, 4.4,
5.1-full, 5.2 remain.

**Session note (2026-07-07, second session):** 3.3 done — `Approach.tsx` act
with five count-up stat figures from `src/lib/stats.ts` (44/19/200+ traced to
`resume.ts` bullets; 4/5 derived from `PROJECTS.length`/`CAPABILITY_LIST.length`);
`KineticTextLayer` now re-rasters on text mutation (rAF-coalesced) so the GL
twin follows the count; prerender ships resolved values, reduced-motion never
zeroes them. Visual QA still blocked (Chrome extension not connected). 0.2
still awaits owner authorization. 4.3, 4.4, 5.1-full, 5.2 remain.

**Session note (2026-07-07, third session):** Visual QA done via the
`agent-browser` CLI — found and fixed the stream point-size bug (300→7 depth
scale; particles were 43× oversized, additively blowing every act to white),
tuned MTM glass (roughness 0.12, envMapIntensity 0.7), added the Approach
"tighten" sink to `LensRig`. All tiers + reduced-motion verified by
screenshot. **0.2 done with owner authorization**: filter-repo mirror rewrite,
force-push `main`+`feat/*`, local branches re-pointed and `threeJS-redesign`
rebased onto the rewritten base — zero screenshot objects reachable from any
ref; **GitHub cached views + PR #1 refs still serve old SHAs → owner support
ticket outstanding; NDA check outstanding**. 4.4 done (all four diagrams
re-authored; budget now vertical 440×492; panel widths/padding tuned). 5.1
audit done (+ §3 plain-fade added to `KineticText`; low tier recorded as
calm-animated rather than the table's "static prism" shorthand). 5.2 done
(design-system/README/AGENTS/diagram-authoring rewritten). **Remaining: 4.3
(post-NDA), commits.**

**Session note (2026-07-09, fourth session):** 4.3 done, owner-directed —
three fully fictional recreations (Veyra Electronics GMC dashboard, Solstice
Beverages taxonomy builder, fictional Meridian optimization report; every
brand/SKU/person/€ figure invented) authored as self-contained HTML
(`docs/projects/recreations/`, tracked, regen instructions in its README),
screenshotted at 1440×900 via agent-browser → `public/screens/`, and
`Project.screenshot` wired on taxonomy/budget/gmc. Beat-1 `GlassImage`
verified on high (GL twin) and low (crisp `<img>`) tiers; lint + build green;
all three paths present in prerendered HTML. Owner waived pre-commit
/code-review. **Remaining: commits.**

## Acceptance criteria (S-gate)

- [ ] `npm run lint` + `npm run build` green; static export intact; CSP
      untouched (no request beyond `'self'`).
- [ ] Prerendered HTML contains every heading/body string (semantic mirror) —
      view-source shows real `<h1>…<p>`, canvas is `aria-hidden`.
- [ ] High tier: prism dispersion + streams ≥ ~60fps desktop; pointer warps
      visuals + headings (chromatic aberration follows the pointer); headings
      refract-in on entry and shear with scroll velocity.
- [ ] Low tier: calm prism, crisp DOM imagery, no postprocessing, type fades.
      Static (`prefers-reduced-motion`): resolved end-states, no morph/loop.
- [ ] Diagrams play draw-on + one packet pass on entry, then settle. No
      scroll-scrub anywhere; `DiagramFace` gone.
- [ ] No confidential pixel ships: only recreated dummy-data screenshots in
      `public/`, raw captures ignored, history rewrite (0.2) done before any
      client visual goes live.
- [ ] Every number/claim still traces to `resume.ts`/`projects.ts`.

## Out of scope / deferred

- Real career dates (schema ready); contact form (static export — links only).
- GPGPU pointer-scatter for packets; per-glyph 3D shard meshes (v2 polish).
- OG image + favicon refresh to the Lens brand.

# Implementation Plan 0006 — Glass prism, physical beam refraction, high-by-default fidelity, reveal affordance, extended aberration

> Source decision: **ADR-009**
> (`docs/decisions/ADR-009-lens-refinement-glass-refraction-and-high-default-fidelity.md`),
> which supersedes ADR-005 §3 / ADR-006 §8 (tier heuristic → high-by-default +
> runtime watchdog), refines ADR-006 §1/§4 and ADR-008 §2, and amends ADR-007
> (reveal affordance). Decisions were resolved branch-by-branch across two
> `/grill-with-docs` sessions (2026-07-10/11). Plan-0005 is complete apart from
> its open bugs and commit hygiene; its **open bug 1** (kinetic-twin baseline
> offset) and **6.1 tail** (CONTEXT.md scrub) are folded in here.
>
> **Status — COMPLETE (2026-07-11).** All slices landed; owner completed the
> 5.3 visual QA and signed off. plan-0005 + plan-0006 committed and pushed to
> `ui-refinement`.

## Context / Why

Owner review of the shipped high tier found the prism reading as **metallic
shimmer** (env reflections wash out the data-core and drop contrast for text in
front of it), the projector **beams entering/exiting the same face** on
left-window cards (physically wrong), the **high tier not served by default**
(even the owner's own machine detects `low`), the curtain reveal carrying **no
visible affordance**, and the cursor aberration reaching **too little** of the
page. ADR-009 resolves all five.

**Constraints (unchanged):** static export (ADR-001); CSP `'self'`-only; DOM
access inside effects/frame loops; semantic DOM survives prerender; React-compiler
purity (seeded `mulberry32`, frame-time uniform writes via material refs); honest,
traceable numbers (ADR-005); imagery is fabricated dummy-data only (ADR-006 §7/§7a).

**QA note:** per owner request the agent runs **no browser QA** for this plan.
Every AFK slice's gate is `npm run lint` + `npm run build` green and code-level
correctness; all *visual* acceptance is deferred to the single HITL slice (5.3).

## Slice overview

| # | Slice | Type | Blocked by |
|---|---|---|---|
| **P1** | **Prism & beams** | | |
| 1.1 | Prism glass retune — de-metalize + faint blue + visible core | AFK | — |
| 1.2 | Physical beam refraction — side-mirrored entry/exit faces + kink | AFK | — |
| **P2** | **Fidelity** | | |
| 2.1 | `gpuTier` → high-by-default + software-renderer floor + header reconcile | AFK | — |
| 2.2 | Stateful tier lift + hot-swap + FPS watchdog + downgrade popup | AFK | 2.1 |
| **P3** | **Reveal affordance** | | |
| 3.1 | Hint pill + custom-cursor "Reveal" label | AFK | — |
| **P4** | **Kinetic baseline + extended aberration** | | |
| 4.1 | Fix kinetic-twin vertical offset (open bug 1) | AFK | — |
| 4.2 | Twin eyebrow + `01/05` labels; CTA RGB-split | AFK | 4.1 |
| **P5** | **Docs + close-out** | | |
| 5.1 | ADR-009 + doc reconciliations | AFK | — *(done this session)* |
| 5.2 | Confidentiality tail: CONTEXT.md scrub + shape greps + prerender grep | AFK | 1–4 |
| 5.3 | Owner visual QA + sign-off (all tiers) | **HITL** | 5.2 *(done 2026-07-11)* |

## Slice details

### 1.1 — Prism glass retune
**What:** `src/components/lens/TheLens.tsx`, high-tier `LensMaterial` — supersedes
HANDOFF tuning-pass #2 values. `envMapIntensity 0.16 → ~0.03` (kills the chrome —
primary fix), `roughness → ~0.06`, `chromaticAberration → ~0.05`, lower
`distortion`/`temporalDistortion`; keep `transmission:1`, `ior ~1.4`;
`attenuationColor = ACCENT_BRIGHT`, `attenuationDistance ~2.5` (faint blue body);
kernel `pointLight 4 → ~2.5`. Brighten the core icosahedron (opacity ~1, brighter
cyan/blue, keep `toneMapped={false}`), rendered after the glass. Rewrite the
now-false tuning comment at `TheLens.tsx:37`. `FauxGlassMaterial` unchanged.
**Accept:** lint/build green; no material params reference raw hex outside the
accent constants; low/static render unchanged. *(Visual: 5.3.)*

### 1.2 — Physical beam refraction (side-mirrored faces + kink)
**What:** `src/components/lens/DataStreams.tsx`. Inflow (`inflowVertex`): add
`uInSide` uniform, mirror source x of `p0`/`c`/`p1`; drive `uInSide = mix(1, v.side,
v.project)` each frame so packets enter the outer face (local `-0.4*side`),
sweeping with the prism (no snap — same damping as the rig). Beam exit
(`beamVertex`): bezier origin `p0.x = mix(0.4, 0.4*uSide, uProject)` so the
spectrum leaves the face toward the window; keep the `uSide` bulge. Add a subtle
kink (leave the exit face along its normal before curving to `uTarget`) + small
per-color angular spread; magnitudes small/damped. Hero fan, Contact underline,
static settle unaffected (`uProject≈0`). Keep GLSL in sync with `beamAngle()`.
**Accept:** lint/build green; purity rules hold (uniform writes via `beamMat`/
`inflowMat` refs); no `Math.random`. *(Visual — Taxonomy enter/exit, smooth
crossing, dispersion: 5.3.)*

### 2.1 — High-by-default tier + software floor
**What:** `src/lib/gpuTier.ts`. Default `→ high`. Keep `?tier=` override,
`prefers-reduced-motion → static`, no-WebGL → `none`. Remove the
`coarsePointer||lowMemory||classifyRenderer!=="capable"` downgrade; keep one
pre-emptive floor: software renderer (SwiftShader/llvmpipe) → `low`. Return/expose
"was auto-selected" (no `?tier`) so 2.2's watchdog runs only then. **Rewrite the
file header comment** (currently documents mobile→low) to match ADR-009.
**Accept:** lint/build green; `?tier=` overrides still resolve; reduced-motion →
static; software renderer → low; everything else → high.

### 2.2 — Stateful tier + hot-swap + watchdog + popup
**What:**
- `src/components/lens/LensCanvas.tsx` — lift tier to state (`useState`, detect in
  an effect); render `<LensScene tier onSlow/>` inside the existing
  `pointer-events-none -z-10` div and the popup as a **sibling** (`pointer-events-
  auto`). `onSlow` → `setTier("low")` + `droppedByWatchdog`; "Back to full" →
  `setTier("high")`; module-level `probed` guard stops re-firing.
- `src/components/lens/LensScene.tsx` — accept `tier`+`onSlow` props; drop internal
  `useState(detectTier)` and the `none` early return (wrapper owns them); keep
  `markLensReady`, `finePointer`, and the `tier==="high"` gates.
- New `FpsWatchdog` (child of `<Canvas>`, high + auto-selected only): `useFrame`
  accumulates deltas, skips ~1s warmup and any delta > ~0.1s (tab-pause/compile
  outliers), averages ~2s; sustained < ~40fps → `onSlow()` once.
- New `FidelityNotice` (DOM): fixed `role="dialog"` card, semantic tokens, copy
  "Switched to the basic version for smoothness.", **Back to full** + **×**. No
  `localStorage`.
**Accept:** lint/build green; hot-swap high→low disposes the high-only layers
cleanly (no leaked composer/kinetic claims); `?tier=low` shows **no** popup;
reduced-motion still static.

### 3.1 — Reveal affordance
**What:** `src/components/acts/ProjectRevealCurtain.tsx` — add an aria-hidden hint
pill (squiggle glyph + "Hover to reveal architecture") bottom-left inside the
viewport; toggle `data-revealing` on `.project-preview` inside the existing
`open()`/`close()` so CSS fades it out while revealing (static under reduced-
motion). Mark the preview `[data-cursor][data-cursor-label="Reveal"]`.
`src/components/ui/Cursor.tsx` — render a small label by the ring populated from
`data-cursor-label`, shown over `[data-cursor]` targets (reuse the existing
`onOver` swell). Styles/tokens in `globals.css`.
**Accept:** lint/build green; pill is `aria-hidden`, keyboard focus still opens the
reveal, `aria-label` unchanged; cursor path stays fine-pointer + no-reduced-motion.
*(Visual: 5.3.)*

### 4.1 — Fix kinetic-twin vertical offset (open bug 1)
**What:** `src/components/lens/kinetic/rasterize.ts` + `kinetic/layout.ts`. Section-
title twins paint ~`RASTER_PAD` (28px) too high while the hero `h1` is correct —
diff those two baseline cases (`fontBoundingBoxAscent` fallback vs Range-rect top;
pad symmetry vs `layoutPlaneToRect`). Fix in the raster/layout pair, not per-
component CSS.
**Accept:** lint/build green; the kinetic twin's box aligns with the DOM element's
`getBoundingClientRect()` for h1/h2/h3 (marker-line technique, owner-verified in
5.3). Prereq for 4.2 so the new small labels align.

### 4.2 — Extended aberration
**What:** Wrap the `SectionHeader` eyebrow (`SectionHeader.tsx`) and the ProjectPin
`01 / 05` counter (`ProjectPin.tsx`) in `KineticText` (`as="p"`) — twin on high,
crisp DOM on low/static. Add a subtle DOM RGB-split on the Contact CTA labels
(`ButtonLink`s in `page.tsx`, via `Magnetic` or a `globals.css` utility) — CSS
text-shadow split, subtle, gated fine-pointer + no-reduced-motion. **Do not** twin
body copy, taglines, or capability chips.
**Accept:** lint/build green; eyebrow/counter render resolved text on low/static
and in the prerender; CTA labels stay legible; chips/body unchanged.
**Blocked by:** 4.1.

### 5.1 — ADR-009 + doc reconciliations *(done this session)*
**What:** `docs/decisions/ADR-009-*.md` written; ADR-005/006/007/008 Status
cross-linked; `docs/design-system.md` fidelity table + kinetic scope, `README.md`,
`CLAUDE.md`, `AGENTS.md` reconciled. The `gpuTier.ts` header reconcile lives in 2.1
(changes with the code). **Accept:** met.

### 5.2 — Confidentiality tail + close-out
**What:** Scrub the remaining "Data Path" in
`docs/projects/taxonomy-builder/CONTEXT.md:17` (fictional retired brand; ADR-008/
plan-0005 mentions may stay). Re-run shape greps (`GTM-[A-Z0-9]{6,}`,
`\bG-[A-Z0-9]{9,}`, `user@host`) — expect only fabricated Veyra values + licence
emails + the owner's gmail. Final `npm run lint` + `npm run build`; prerender grep
of `out/` for the same shapes. Confidentiality rule per project `CLAUDE.md`
(authoritative; ADR-006 §7a narrative unreliable — do not restate identifiers).
**Accept:** greps clean; lint/build green; no confidential shapes in `out/`.
**Blocked by:** 1–4.

### 5.3 — Owner visual QA + sign-off  *(HITL — done, owner sign-off 2026-07-11)*
**What:** Owner drives `?tier=high&debugProjection` (and low/static/reduced-motion):
prism reads as faint-blue glass, core visible, text legible; Taxonomy beams enter
outer face / exit toward the window with a smooth crossing + dispersion; watchdog
auto-drops + popup + Back-to-full on a throttled machine; reveal pill + cursor
label invite the hover, fade on open, keyboard focus opens; eyebrow/counter labels
align and aberrate; CTA split subtle; Trajectory recap pose clears the timeline
copy (open bug 2), Contact underline centered. Adjust damp λs / material values /
threshold / split magnitude if the feel is off, then commit on the owner's say-so
(`git commit -F`, Windows shell note).
**Accept:** owner sign-off — **met (2026-07-11).** **Blocked by:** 5.2.

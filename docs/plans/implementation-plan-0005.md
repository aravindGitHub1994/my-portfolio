# Implementation Plan 0005 — Projection Work Act, Safari Frames, Prism Finale, Tagging Card

> Source decision: **ADR-008**
> (`docs/decisions/ADR-008-projection-work-act-and-prism-finale.md`), which
> partially supersedes ADR-006 (§1 cube payoff, Work-act recede) and amends
> ADR-007 (curtain unchanged, now inside a Safari-style frame). Decisions were
> resolved branch-by-branch in a `/grill-with-docs` session (2026-07-10);
> implementation-plan-0004 is complete apart from its commit hygiene and is
> not re-sliced here.

## Context / Why

The Lens goes dormant exactly where dwell time peaks: during Work it dims and
recedes while the project cards hold the stage. ADR-008 flips that — the prism
becomes the **projector** whose beams curve into each project's preview, the
previews become **Safari-framed windows** with a pointer-tracked 3D tilt, the
cube/point-globe finale is retired in favour of a **prism-constant** ending
(beams underline the contact CTA), and the owner's core craft finally gets the
lead card: **Tagging & Measurement** (600+ client accounts since March 2021,
9+ platforms, dataLayer/GTM implementation, governance, vanilla-JS DOM work).

**Constraints (unchanged):** static export (ADR-001); CSP `'self'`-only; DOM
access inside effects/frame loops; semantic DOM survives prerender; imagery
under `public/screens/` is fabricated dummy-data only (ADR-006 §7/§7a); honest,
traceable numbers (ADR-005).

## Act choreography (revised — replaces 0004's table rows 3–5)

| Act | Lens state | Beat |
|---|---|---|
| 1 Hero | Prism center-right; packets in, spectrum beams fan out *(unchanged)* | thesis |
| 2 Approach | Prism tightens; beams organize into ordered lines *(unchanged)* | method |
| 3 Work | **Projector**: prism hops to the corner opposite the active window; beams curve diagonally into it, flowing continuously; endpoint sweeps to the next card on scroll | evidence |
| 4 Trajectory | Prism returns calmly to center; the ordered fan re-forms — recap, **no cube** | accumulation |
| 5 Contact | Beams bend down into a soft **underline/halo beneath the CTA buttons** — **no globe** | invitation |

## Slice overview

| # | Slice | Type | Blocked by |
|---|---|---|---|
| **P1** | **Content spine** | | |
| 1.1 | Optional `howAI` + conditional ReadTheBuild + `measurement`/`governance` capability keys | AFK | — |
| 1.2 | Tagging & Measurement card (first) + Work header rewrite + 600+ stat + panel width | AFK | 1.1, 2.1, 2.2 |
| **P2** | **Assets** | | |
| 2.1 | Author `public/diagrams/tagging.svg` | AFK | — |
| 2.2 | GTM recreation → `public/screens/tagging.png`; delete raw capture | AFK | — |
| 2.3 | Taxonomy rebrand + regenerate `taxonomy.png` | AFK | — |
| **P3** | **Safari frame** | | |
| 3.1 | `SafariWindow` chrome + `domain?` + pointer-tracked tilt around the curtain | AFK | — |
| **P4** | **Projection streams** | | |
| 4.1 | Projection-target registry + `lensState.projection` + per-card triggers + `rectToWorld` refactor | AFK | — |
| 4.2 | Beam projected mode + prism opposite-corner hop + un-dim + window materialize | AFK | 4.1 |
| 4.3 | Tier audit for the Work act | AFK | 4.2 |
| **P5** | **Prism-constant finale** | | |
| 5.1 | Remove the cube; Trajectory = return-to-center; static pose → prism | AFK | — |
| 5.2 | Contact CTA underline/halo; remove the globe | AFK | 4.1, 5.1 |
| **P6** | **Docs + QA gate** | | |
| 6.1 | Docs sweep + confidentiality grep + lint/build/all-tier QA | AFK | all |
| 6.2 | Owner visual sign-off | **HITL** | 6.1 |

## Slice details

### 1.1 — Optional `howAI`, conditional dialog, new capability keys
**What:** `Project.howAI` → `howAI?: string` (`src/lib/projects.ts`);
`ReadTheBuild.tsx` filters `SECTIONS` whose value is `undefined`; add
`measurement` ("Measurement") and `governance` ("Governance") to
`src/lib/capabilities.ts` (CHIP treatment — single-accent rule).
**Accept:** lint/build green; existing four cards render identically; the
"capability areas" stat reads 7.

### 1.2 — Tagging & Measurement card, header, stat
**What:** New **first** `PROJECTS` entry — slug `tagging`, title
"Tagging & Measurement", capabilities `["measurement", "governance"]`, no
`howAI`, `domain` set, `screenshot: "/screens/tagging.png"`,
`diagram: "/diagrams/tagging.svg"`. Copy covers: auditing client sites and
fixing existing tagging architectures or authoring new multi-platform tag
plans (GA4, Meta, Criteo, Google Ads, CM360, DV360, Kakao, StackAdapt, The
Trade Desk, and more); dataLayer/GTM implementation; post-launch governance
and troubleshooting; deep vanilla-JS DOM work for scraping pages to set tag
parameters; **600+ client accounts since March 2021**. Rewrite the Work
`SectionHeader` (the "Four systems…" line) to cover craft + systems; add
`DIAGRAM_PANEL_WIDTH.tagging`; add the 600+ `StatFigure` with a trace comment
to the project entry.
**Accept:** card renders first with curtain + diagram + dialog (three
sections + stack, no AI heading); stat band shows 600+; header copy has no
stale count.

### 2.1 — Tagging lifecycle diagram
**What:** `public/diagrams/tagging.svg` per `docs/diagram-authoring.md` —
id prefix `tag-`, groups/edges/arrows/steps per convention, hardcoded dark
palette. Pipeline: Audit → Tag Plan → Implement (dataLayer + GTM) → QA →
Publish → Govern, **loop-back edge Govern → Audit**, platform rail node
(GA4 · Meta · Google Ads · CM360 · DV360 · Criteo · Kakao · StackAdapt · TTD);
`data-key` on Tag Plan + Govern; titles ≥ ~12px at panel width.
**Accept:** standalone `<img>` looks complete; draw-on + packet pass play when
inlined; prefix collides with nothing.

### 2.2 — GTM screenshot recreation + raw deletion
**What:** `docs/projects/recreations/gtm-recreation.html` — GTM container
overview under **Veyra Electronics** (container `www.veyra-electronics.com`,
fabricated GTM-/G- IDs, fictional editor email, fictional trigger/tag names,
pending-changes counts); screenshot at 1440×900 → `public/screens/tagging.png`;
update recreations `README.md`; **delete** `docs/projects/core-skills/GTM.png`
(untracked) and the empty dir.
**Accept:** no real container/measurement ID, no work email, no employer
domain anywhere in the repo; raw file gone.

### 2.3 — Taxonomy rebrand
**What:** `taxonomy-recreation.html` `<title>` + brand block → "Taxonomy
Builder" (drop "Data Path"); regenerate `public/screens/taxonomy.png`
(1440×900); drop the brand from recreations `README.md`.
**Accept:** regenerated PNG shows only "Taxonomy Builder"; no "Data Path"
match in the repo.

### 3.1 — SafariWindow frame + tilt
**What:** `src/components/acts/SafariWindow.tsx` — macOS chrome (traffic
lights, URL pill with the card's fictional `domain`), always-on raised shadow,
pointer-tracked `rotateX/rotateY` (GSAP `quickTo`, perspective parent, springs
flat on leave; skipped without `(pointer: fine)` or with reduced motion).
`Project.domain?` added and set for the four screenshot cards.
`ProjectPin.tsx` wraps `ProjectRevealCurtain` in it; Personas keeps its plain
diagram panel.
**Accept:** tilt + curtain coexist on hover; keyboard focus still opens the
curtain; touch/reduced-motion get the static framed window; chrome is DOM
(selectable-free, `aria-hidden` decor) and ships on all tiers.

### 4.1 — Projection targeting spine
**What:** `src/components/lens/projectionTargets.ts` (register `{el, index}`
per card preview + the contact CTA row); extract the world-per-pixel math from
`kinetic/layout.ts` into a shared `rectToWorld()` used by both;
`lensState.projection = { index, blend, targetX, targetY, side }`;
`LensChoreography` per-card ScrollTriggers write the active card + entry
progress.
**Accept:** with a debug log, scrolling the Work act reports the correct
active index/target world coords per card; `GlassImageLayer` behavior
unchanged after the refactor.

### 4.2 — Projected beams + prism hop
**What:** `DataStreams` beam vertex shader gains a projected mode (`uProject`,
`uTarget`, `uSide`): quadratic-bezier from prism exit to the active window,
continuous flow, endpoint damped between targets (the sweep); straight blades
fade while projecting; inflow packets keep feeding the prism. `LensRig` hops
the prism to the corner **opposite** the active window (`index % 2`), removes
the Work dim on the high tier. Card preview materializes (fade/rise) on first
entry, synced to the stream's arrival; curtain + Personas draw-on untouched.
**Accept:** on the high tier at `lg`+, every card (incl. Personas) receives a
visible curved stream that retargets as you scroll; prism never dims during
Work; no React re-render per frame (mutable `lensState` only, uniform writes
via material refs).

### 4.3 — Work-act tier audit
**What:** gate projection to high tier + `lg` (matches the pinned layout);
low tier keeps today's recede/dim; static/reduced-motion resolved states
unchanged; stacked mobile has no stream.
**Accept:** `?tier=low`, `?tier=static`, reduced-motion emulation, and a
narrow viewport all behave; no console errors.

### 5.1 — Prism constant (cube removed)
**What:** `TheLens.tsx` — delete the `shape` state machine, `RoundedBox`,
crystallization beat/dip/spin surge; prism persists with idle drift + pointer
tilt; static tier's fixed pose becomes the prism. `DataStreams`: remove
`uCrystal`. `lensState`/`LensChoreography`: `trajectory` re-documented as
return-to-center (LensRig eases the prism home, fan re-forms).
**Accept:** no cube at any scroll position on any tier; Trajectory reads as a
calm return; stale crystallization comments gone from touched files.

### 5.2 — CTA underline finale (globe removed)
**What:** Contact CTA row registers as a projection target (4.1); `contact`
act bends beams downward to converge in a soft underline/halo beneath the
buttons; remove `uGlobe` + `aSphere` (Fibonacci sphere) from `DataStreams`.
**Accept:** no globe; beams visibly point at/underline the CTA at page end on
the high tier; low/static tiers end on a calm resolved prism + fan.

### 6.1 — Docs sweep + QA
**What:** update every stale "prism → cube → point-globe" line
(`AGENTS.md`, `CLAUDE.md`, `README.md`, `src/app/page.tsx`, lens component
docblocks, `design-system.md` if it names the finale); `diagram-authoring.md`
prefix list + counts; recreations README. Confidentiality grep (raw IDs, work
email, employer domain, "Data Path") must return nothing tracked. `npm run
lint`, `npm run build`, browser pass across tiers.
**Accept:** greps clean; lint/build green; prerendered HTML carries the new
card's semantic copy.

### 6.2 — Owner visual sign-off (HITL)
**What:** owner reviews tilt feel, stream feel/speed, finale, and the new
card's copy in the running site; tuning notes get session-noted here.
**Accept:** owner approves or lists concrete tuning deltas.

## Acceptance criteria (S-gate)

- [ ] `npm run lint` + `npm run build` green; static export intact; CSP
      untouched.
- [ ] Prerendered HTML carries the Tagging & Measurement copy (semantic DOM).
- [ ] High tier `lg`+: prism projects every card with a continuous curved
      stream, hops opposite corners, never dims during Work; ~60fps desktop.
- [ ] No cube, no globe, anywhere, on any tier; contact beams underline the
      CTA.
- [ ] Safari frames on all four screenshot cards: fictional domain, tilt on
      fine pointers only, curtain reveal + keyboard access unchanged.
- [ ] Only fabricated imagery ships: raw GTM capture deleted; no real
      container/measurement IDs, work email, or employer domain in the repo;
      "Data Path" gone.
- [ ] Every number/claim traces (600+ → tagging card copy; stats comments
      updated); no stale "four systems/projects" phrasing.

## Out of scope / deferred

- GPGPU pointer-scatter; per-glyph shard meshes (unchanged from 0004).
- Any history remediation — the raw GTM capture was never committed.
- OG image / favicon refresh.

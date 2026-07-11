# Implementation Plan 0007 — Universal display-text refraction, opt-in fidelity, projector-assembled windows, tool-icon inflow

> Source decision: **ADR-010**
> (`docs/decisions/ADR-010-universal-refraction-opt-in-fidelity-projector-assembly-and-tool-inflow.md`),
> which **reverses ADR-009 §3** (auto-downgrade → opt-in prompt) **and ADR-009 §5 /
> ADR-006 §2** ("body copy stays crisp" → distortion-only twins for all display text),
> **amends ADR-008 §2** (window fade/rise → chromatic-shard assembly) and **§4** (Tagging
> card copy/diagram), and **extends ADR-006 §1** (inflow gains tool-icon coins). Decisions
> were resolved branch-by-branch in a third `/grill-with-docs` session (2026-07-11).
>
> **Status — NOT STARTED.**

## Context / Why

Owner review of the shipped Lens (ADR-006 → ADR-009) produced five asks: the cursor
refraction should reach **all display text** (not just headings/labels), the FPS
watchdog should **ask before** downgrading rather than swap silently, the Work-act
window should **assemble from the projected beams** instead of fading in, the anonymous
input stream should carry the **owner's real stack** as recognizable objects that
dissolve into insight, and the lead **Tagging & Measurement** card should name three
more signature skills (DOM-built GTM variables/triggers, Chrome DevTools, server-side
GTM). ADR-010 records the decisions; this plan slices them.

**Constraints (unchanged):** static export (ADR-001); CSP `'self'`-only, assets
local/procedural; DOM access inside effects/frame loops; semantic DOM survives prerender
(twins only set `opacity:0`, staying in the a11y tree); React-compiler purity (seeded
`mulberry32`, no `Math.random` in render/memo, frame-time uniform writes via material
refs, subscribe-before-claim in the kinetic registry); honest, traceable numbers
(ADR-005); imagery is fabricated dummy-data only (ADR-006 §7/§7a); **confidentiality** —
no client names or financial figures anywhere (CLAUDE.md), all tech/platform names only.

**QA note:** per standing owner preference the agent runs **no browser QA**. Every AFK
slice's gate is `npm run lint` + `npm run build` green and code-level correctness; all
*visual* acceptance is deferred to the single HITL slice (6.2). The opt-in-downgrade and
twin-cost feel, the coin density/legibility, and the window-assembly timing are
explicitly owner-verified there.

## Slice overview

| # | Slice | Type | Blocked by |
|---|---|---|---|
| **P1** | **Universal display-text refraction** (ADR-010 §1) | | |
| 1.1 | Distortion-only entrance variant in the kinetic system | AFK | — |
| 1.2 | Visible-only measurement guard (cost containment) | AFK | 1.1 |
| 1.3 | Wrap all display text in the distortion-only twin | AFK | 1.1 |
| **P2** | **Opt-in fidelity downgrade** (ADR-010 §2) | | |
| 2.1 | Invert the watchdog → confirm/decline prompt | AFK | — |
| **P3** | **Projector-assembled window** (ADR-010 §3) | | |
| 3.1 | Chromatic-shard window assembly synced to first beam-lock | AFK | — |
| **P4** | **Tool-icon inflow** (ADR-010 §4) | | |
| 4.1 | Icon data/atlas (glyphs + text-token + JS chips + cookie) | AFK | — |
| 4.2 | Glass-coin inflow render + consume-at-prism | AFK | 4.1 |
| **P5** | **Tagging & Measurement card** (ADR-010 §5) | | |
| 5.1 | `projects.ts` copy: approach + tagline + stack | AFK | — |
| 5.2 | `tagging.svg` server-side container node | AFK | — |
| **P6** | **Docs + close-out** | | |
| 6.1 | Reconcile living docs (CLAUDE/AGENTS/README/design-system) | AFK | — |
| 6.2 | Owner visual QA + sign-off (all tiers) | **HITL** | 1–5 |

---

## Slice details

### 1.1 — Distortion-only entrance variant
**Parent:** ADR-010 §1

**What to build:** A second kinetic-twin behaviour that renders crisp on entry and only
aberrates near the pointer/scroll — no refract-in shard animation — so display text can
join the WebGL layer without a full-page entrance shimmer. Headings/labels/counters keep
today's refract-in.

**How (pointers):** Extend `KineticTarget` in `src/components/lens/kinetic/registry.ts`
with an `entrance: "refract" | "plain"` field (default `"refract"`); thread a `variant`
prop through `KineticText.tsx`. In `KineticTextLayer.tsx`'s `KineticPlane`, for `"plain"`
targets initialize `progress.current.value = 1` and skip the IntersectionObserver GSAP
refract-in (velocity shear may stay). The global `RefractionPass` (unchanged) supplies
the actual pointer distortion once the plane exists in GL.

**Acceptance criteria:**
- [ ] `KineticText variant="plain"` renders no shard entrance; its twin is crisp on first paint and distorts near the pointer on the high tier.
- [ ] `variant="refract"` (default) is byte-for-byte the current behaviour for existing headings/labels/counters.
- [ ] Lower tiers / reduced-motion still keep crisp DOM (no claim); DOM stays `opacity:0` only while claimed, in the a11y tree.
- [ ] `npm run lint` + `npm run build` green; no `Math.random` in render/memo.

**Blocked by:** None

---

### 1.2 — Visible-only measurement guard
**Parent:** ADR-010 §1

**What to build:** With the twin count about to rise sharply (and the auto safety net
now opt-in, 2.1), offscreen twins must not tax the frame. Skip the per-frame
`getBoundingClientRect` + rasterization for planes outside the viewport.

**How (pointers):** In `KineticPlane` (`KineticTextLayer.tsx`), gate the per-frame
`layoutPlaneToRect`/rect read on a cheap visibility check (reuse the offscreen margin
`layout.ts` already applies via `mesh.visible`); defer/skip `rasterizeText` until the
element is near-viewport. Keep the `ResizeObserver`/`MutationObserver` re-raster path
intact for count-up digits.

**Acceptance criteria:**
- [ ] Offscreen twins perform no `getBoundingClientRect` and hold no live raster.
- [ ] A twin entering the viewport rasterizes and lays out correctly (no missing/blank frame).
- [ ] Count-up stat re-rasters still fire when the element is visible.
- [ ] `npm run lint` + `npm run build` green.

**Blocked by:** 1.1

---

### 1.3 — Wrap all display text
**Parent:** ADR-010 §1

**What to build:** Apply the distortion-only twin to every *display* text element, while
leaving the interactive-exclusion set as crisp DOM. One repetitive wrap pattern across
the act components.

**How (pointers):** Wrap in `KineticText variant="plain"` (or register via the same
path): taglines and body/intro paragraphs, the `Tag`/`CapabilityTag` chips
(`src/components/Tag.tsx`), stat figures + labels, and the "Read the build" dialog copy.
Representative files: `src/components/acts/Approach.tsx`, `Work.tsx`, `ProjectPin.tsx`,
`ReadTheBuild.tsx`, `Trajectory.tsx`, `Contact` section (in `src/app/page.tsx`),
`Hero.tsx` subhead, `src/lib/stats.ts` consumers. **Exclusions kept crisp:** buttons
(`Button`), the `SafariWindow` frame, nav links (`nav.ts` consumers), contact/social
links, and the `ProjectRevealCurtain` preview.

**Acceptance criteria:**
- [ ] On the high tier every non-excluded display text element distorts near the pointer; none plays a shard entrance (headings excepted).
- [ ] Buttons, Safari window, nav links, contact/social links, and the reveal preview stay crisp and keep their `:hover`/`:focus` states.
- [ ] All wrapped text remains real semantic DOM in the prerendered HTML (grep `out/` after build); reduced-motion/low/static render crisp.
- [ ] `npm run lint` + `npm run build` green.

**Blocked by:** 1.1

---

### 2.1 — Invert the watchdog to an opt-in prompt
**Parent:** ADR-010 §2 (reverses ADR-009 §3)

**What to build:** On a sustained sub-40fps window the site **asks** before downgrading
and switches to `low` only on confirmation; declining keeps `high`.

**How (pointers):** In `src/components/lens/LensRoot.tsx`, change `handleSlow` to set the
notice visible **without** `setTier("low")` (keep the `watchdogFired` one-shot guard).
Rework `FidelityNotice` copy to a question with two actions: **Switch to basic** (→
`setTier("low")` + dismiss) and **Keep full quality** (→ dismiss, stay `high`). Retain
non-modal placement, session-only (no persistence), and the `detection.auto` gate.
`FpsWatchdog` in `LensScene.tsx` is unchanged. Floors (reduced-motion/none/software-`low`/
`?tier=`) unchanged.

**Acceptance criteria:**
- [ ] Sub-40fps triggers the prompt once per load; no tier change until the user confirms.
- [ ] "Switch to basic" hot-swaps to `low` in place (no reload/scroll jump); "Keep full quality" leaves `high` and does not re-prompt this session.
- [ ] `?tier=` override still suppresses the watchdog; reduced-motion → `static` unaffected.
- [ ] `npm run lint` + `npm run build` green.

**Blocked by:** None

---

### 3.1 — Chromatic-shard window assembly
**Parent:** ADR-010 §3 (amends ADR-008 §2)

**What to build:** Replace the Work-card window's plain fade/rise with a chromatic-shard
assembly (the kinetic refract-in vocabulary) that plays **once on first entry**, its
timeline synced to the beams first locking onto the card. The ADR-007 curtain reveal
works normally afterward.

**How (pointers):** In `src/components/acts/ProjectPin.tsx`, replace the `rise` `gsap.fromTo`
with a shard/RGB-split reveal overlay on the `preview` element, driven on a timeline
paced to the projection lock (read `lensState.projection` blend/index for the card via
`projectionTargets`). Once-only via the existing `once: true` entry trigger. The window
is **not** a persistent GL twin (ADR-010 §1 exclusion) — the effect is a DOM/CSS/SVG
overlay. Reduced-motion / low / static (no beams) → the current simple fade.

**Acceptance criteria:**
- [ ] The window resolves from chromatic shards on first pin, timed to the beam arrival; re-scrolling does not rebuild it.
- [ ] After assembly the curtain reveal (hover/focus) behaves exactly as ADR-007.
- [ ] Reduced-motion/low/static fall back to a plain fade (no shards, no beams).
- [ ] `npm run lint` + `npm run build` green.

**Blocked by:** None

---

### 4.1 — Icon data / atlas
**Parent:** ADR-010 §4

**What to build:** The data layer for the inflow coins: a monochrome glyph or token per
tool, ready to texture onto a coin face.

**How (pointers):** Extend/replace `src/lib/techIcons.ts` (its current "orbiting the hero
portrait" header is stale — orphaned since the ADR-005 cube). Source single-path
`simple-icons` glyphs (24×24, nonzero, verbatim) for: Claude Code, GTM, GA4, Python,
React, Postgres, Excel, Looker Studio, CM360, Google Ads, Facebook, Criteo, Kakao,
Naver. For marks without a clean glyph (expected: **CM360**, possibly **Looker Studio**)
use a monospace **text-token chip**. Add the **JavaScript cluster** as code-token chips —
`addEventListener`, `querySelector`, `window.dataLayer` — plus a drawn chocolate-chip
**cookie** glyph. Provide a typed export the render slice consumes (glyph path *or* token
string + kind).

**Acceptance criteria:**
- [ ] Every set member resolves to either a verbatim single-path glyph or a text-token chip; no hand-edited path data.
- [ ] JS is represented by the three code tokens + cookie glyph, not a JS logo.
- [ ] Data is pure/deterministic (no runtime randomness); typed and lint-clean.
- [ ] `npm run lint` + `npm run build` green.

**Blocked by:** None

---

### 4.2 — Glass-coin inflow render + consume-at-prism
**Parent:** ADR-010 §4

**What to build:** A sparse, slow procession of tumbling glass-coin icons riding the
inflow bezier, monochrome spectrum-tinted, dissolving into the beams at the prism mouth;
thinning during Work.

**How (pointers):** In `src/components/lens/DataStreams.tsx`, add an instanced coin layer
along the existing `inflowVertex` bezier path. Deterministic per-instance seeds/tumble
(`mulberry32`, matching the streams); frame-time writes via refs. Low density (~1 per
~2s, ≤3–4 concurrent). Fade/refract each coin as it reaches the mouth (couple to the
inflow `t`), and reduce spawn rate as `lensState.acts.work` rises. Tier gating: high on,
low at reduced count, **off on static and reduced-motion**. Coins are decorative
(`aria-hidden`, WebGL — nothing in DOM).

**Acceptance criteria:**
- [ ] Coins ride the inflow among the particles at low density and dissolve at the prism mouth; they thin during Work.
- [ ] Monochrome spectrum-tinted; legible at rest, never a swarm.
- [ ] Off on static + reduced-motion; low tier reduced count; no `Math.random` in render/memo.
- [ ] `npm run lint` + `npm run build` green.

**Blocked by:** 4.1

---

### 5.1 — Tagging card copy
**Parent:** ADR-010 §5 (amends ADR-008 §4)

**What to build:** Add three honest skills to the lead card: DOM-built custom GTM
variables/triggers, Chrome DevTools, and server-side GTM.

**How (pointers):** In `src/lib/projects.ts`, `slug: "tagging"` — weave the three into
`approach`, extend the `tagline`, and add `Server-side GTM` + `Chrome DevTools` to
`stack`. Platform/tool names only; **no client names or figures** (CLAUDE.md).

**Acceptance criteria:**
- [ ] `approach` names Chrome DevTools, vanilla-JS DOM-built custom variables/triggers, and server-side GTM without keyword-stuffing.
- [ ] `tagline` references the added craft; `stack` includes the two new chips.
- [ ] No client identifiers or financial figures introduced.
- [ ] `npm run lint` + `npm run build` green.

**Blocked by:** None

---

### 5.2 — Tagging diagram server-side node
**Parent:** ADR-010 §5

**What to build:** Add a server-side GTM container node to the lifecycle diagram so
server-side tagging is visible on the card itself.

**How (pointers):** In `public/diagrams/tagging.svg`, add a node off **Implement** (client
GTM + server GTM), following the authoring convention (`docs/diagram-authoring.md`):
`tag-` id prefix, `data-step` after Implement's incoming edge, `dg-node` structure,
hardcoded dark-system colors, single-accent (differentiate by stroke, not hue), resting
state fully drawn. Keep titles ≥ ~12px at the panel width; mind the 900×560 viewBox.

**Acceptance criteria:**
- [ ] A server-side container node renders off Implement with a correctly-stepped edge/arrow; standalone `<img>` looks complete.
- [ ] Draw-on + single packet pass still run in order when inlined; reduced-motion shows the finished diagram.
- [ ] Follows every `diagram-authoring.md` rule (ids, steps, colors, legibility).
- [ ] `npm run lint` + `npm run build` green.

**Blocked by:** None

---

### 6.1 — Reconcile living docs
**Parent:** ADR-010 Consequences

**What to build:** Update the living docs that now contradict ADR-010 so they don't lie.

**How (pointers):** `CLAUDE.md`, `AGENTS.md`, `README.md`, `docs/design-system.md` —
change "body copy stays crisp" to the distortion-only display-twin reality, and the
"FPS-watchdog fallback to `low`" (auto) lines to the opt-in prompt. Update the
`src/lib/techIcons.ts` header to its real new use (inflow coins, not the retired hero
portrait). ADR-010 itself was authored in this session.

**Acceptance criteria:**
- [ ] No living doc still asserts crisp body copy or automatic downgrade.
- [ ] `techIcons.ts` header describes the inflow-coin use.
- [ ] Confidentiality prose (CLAUDE.md) untouched in substance.
- [ ] `npm run lint` + `npm run build` green.

**Blocked by:** None

---

### 6.2 — Owner visual QA + sign-off
**Parent:** plan close-out

**What to build:** The single human visual-acceptance gate across all fidelity tiers.

**Acceptance criteria (owner-verified):**
- [ ] **High:** all display text distorts near the pointer, buttons/links/window stay crisp; framerate acceptable, and the opt-in prompt appears (not an auto-swap) if frames drop — confirm/decline both behave.
- [ ] **High:** each Work card's window assembles from shards on first entry, synced to the beams; curtain reveal works after.
- [ ] **High:** the tool-coin procession reads as recognizable tools at low density, dissolving into the beams; not cluttered.
- [ ] **Low / static / reduced-motion:** graceful — crisp DOM, plain window fade, no coins; no console errors.
- [ ] Tagging card copy + diagram read well and contain no confidential material.

**Blocked by:** 1–5

---

## Publish order
1.1 → (1.2, 1.3) · 2.1 · 3.1 · 4.1 → 4.2 · 5.1 · 5.2 · 6.1, then 6.2 last (blocked by all).

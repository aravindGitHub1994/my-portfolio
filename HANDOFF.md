# Handoff — Lens refinement round 3 (ADR-010) — implementation COMPLETE, awaiting owner QA

_Branch: `ui-refinement`. Refreshed 2026-07-11. All AFK slices of
implementation-plan-0007 (1.1 → 6.1) are implemented, gated (lint + build
green per slice), and committed. Only **6.2 owner visual QA** remains._

## Current Status
- **Done and committed, one commit per slice:**
  - 1.1 `a2d33f7` — distortion-only `variant="plain"` entrance (registry +
    KineticText + KineticTextLayer); also lands ADR-010 + plan-0007 docs.
  - 1.2 `7753172` — near-viewport gate (300px IO margin): offscreen twins hold
    no raster, do no per-frame `getBoundingClientRect`.
  - 1.3 `a0fa4dc` — display text wrapped in plain twins (Hero eyebrow/subhead/
    scroll cue, SectionHeader descriptions, stat labels, project taglines).
    **Deviations — stayed crisp, see below.**
  - 2.1 `aa63585` — watchdog now asks ("Switch to basic" / "Keep full
    quality"); no tier change until confirmed; one prompt per load.
  - 3.1 `49a6343` — chromatic-shard window assembly synced to beam-lock via
    new `lensState.fidelityTier` + `gsap.ticker` wait; plain-fade fallback
    (non-high / 1.2s lock timeout); `mulberry32` extracted to `src/lib/prng.ts`.
  - 4.1 `a85d8b4` — `TOOL_ICONS` (glyph | token | code): 10 verbatim
    simple-icons glyphs, 4 brand tokens (Excel/Looker Studio/CM360/Criteo have
    no simple-icons glyph), 3 JS code tokens + drawn cookie.
  - 4.2 `f37ddb8` — coin procession in DataStreams: 4 slot meshes high / 2 low
    / none static, runtime canvas atlas, same inflow bezier, dissolve at the
    mouth, respawn cooldown stretches with `acts.work`.
  - 5.1 `beed00a` — Tagging card copy (DevTools, DOM-built GTM variables/
    triggers, server-side GTM; stack +2 chips).
  - 5.2 `b32b011` — `tagging.svg` Server GTM node off Implement (steps
    renumbered +2 after step 4).
  - 6.1 `ba282bc` — living docs reconciled; ADR-010 §1 gained an
    implementation note for the 1.3 deviations.
- Working tree clean apart from this file. Task tracker #1–#10 completed;
  #11 (6.2 HITL) pending.

## 1.3 Deviations (owner must rule at 6.2 — also in ADR-010 §1 note)
The kinetic canvas is `fixed -z-10`: GL twins paint UNDER every DOM
background, so three ADR-010 §1 scope items stayed crisp DOM:
- **`Tag`/`CapabilityTag` chips** — they paint their own surface (opaque /
  60% `bg-surface`); a twin behind it is invisible/washed out.
- **"Read the build" dialog copy** — native `<dialog>` top layer always
  paints above the canvas; twinning is physically impossible there.
- **Trajectory** — interactive hover rows + `overflow-hidden` collapse panels
  a twin can't clip to (collapsed copy would paint over the page).

## Unresolved Threads (all owner-facing, at 6.2)
- **Icon lifecycle default** (coins thin during Work via spawn cooldown) was
  implemented per plan default — owner-vetoable.
- **Coin legibility/density** (0.52 world-unit faces, token chips like
  `addEventListener` are small) — owner judges on real hardware.
- **Shard assembly timing** (lock threshold blend > 0.05, 1.2s give-up,
  250ms non-high beat) — tunable constants in `ProjectPin.tsx`.
- **Performance**: agent ran no browser QA (standing preference). Watch the
  watchdog prompt on mid hardware now that twins multiplied — if it fires,
  that's the opt-in flow working, not a bug.

## 6.2 Owner QA checklist (plan-0007 acceptance)
- [ ] **High:** display text distorts near pointer; buttons/links/window/chips
      crisp; opt-in prompt (never auto-swap) on frame drops — confirm AND
      decline paths behave; no re-prompt after decline.
- [ ] **High:** each Work window assembles from shards once, synced to beams;
      curtain reveal normal afterwards; re-scroll does not rebuild.
- [ ] **High:** coins read as recognizable tools, sparse, dissolve at mouth,
      thin during Work.
- [ ] **Low / static / reduced-motion:** crisp DOM, plain window fade, no
      coins, no console errors. (`?tier=low|static` to force.)
- [ ] Tagging card copy + diagram read well; nothing confidential.

## Key References
- ADR: `docs/decisions/ADR-010-universal-refraction-opt-in-fidelity-projector-assembly-and-tool-inflow.md`
  (now carries the §1 implementation note)
- Plan: `docs/plans/implementation-plan-0007.md`
- New/changed load-bearing bits: `lensState.fidelityTier` (LensRoot mirrors
  the tier for DOM-side effects), `src/lib/prng.ts` (shared mulberry32),
  `TOOL_ICONS` in `src/lib/techIcons.ts`, coin block in `DataStreams.tsx`,
  shard overlay + lock-wait in `ProjectPin.tsx`.

## Recommended Next Steps
- [ ] Owner: run 6.2 checklist above (`npm run dev`, port 3004).
- [ ] After sign-off: merge `ui-refinement` → `main` (PR #2 pattern);
      `code-review-and-quality` before merge if desired.
- [ ] Confidentiality rule (CLAUDE.md) held: no client names/figures added.

## Recommended Skills
- `code-review-and-quality` before merge; `git-workflow-and-versioning` for
  the merge/PR.

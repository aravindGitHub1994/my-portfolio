# Handoff — Lens legibility round (ADR-011 + Amendment A) — implementation COMPLETE, awaiting owner sign-off

_Branch: `ui-refinement`. Refreshed 2026-07-11. All AFK slices of
implementation-plan-0008 (1.1 → 3.1, including mid-plan 2.1b) are implemented,
gated (lint + build green per slice), and committed. The owner calibration
sweep (2.2) ran **twice** — see the falsification note below. Only **3.2 owner
re-QA + sign-off** remains, then merge to `main`._

## Current Status
- **Done and committed, one commit per slice:**
  - docs `7d0f877` — ADR-011 + plan-0008 land.
  - 1.1 `9cf0fc2` — coin inflow excised from `DataStreams.tsx` (atlas, coin
    shaders, slot machinery, dead `quadBez`); `techIcons.ts` deleted; inflow
    back to ADR-006 §1 anonymous packets. Particle counts unchanged.
  - 2.1 `d2ef9e0` — `backsideEnvMapIntensity` passed explicitly (the drei
    trap that defeated ADR-009 §1), blue `specularColor`, kernel light kept
    at core, FauxGlass clearcoat toned; all four magnitudes behind a
    temporary `lensTuning.ts` URL-param tuner.
  - **Falsification + Amendment A** `29a18bb` — the first 2.2 sweep found
    the blow-out immune to every knob. Root cause: **transmitted scene
    content has no intensity knob** — the additive blade/beam convergence at
    the prism mouth and the near-white kinetic text twins baked into the
    transmission buffer unclamped (plus, desktop-only, `EffectComposer`
    removes ACES from the prism, the scene's only tone-mapped material).
  - 2.1b `631a318` — the owned bake: MTM's `buffer` prop disables drei's
    whole-scene bake; `HighGlass` runs the same two passes with the new
    `bakeExclusions` registry hidden (`DataStreams` root + kinetic text /
    glass image layers). Glass now refracts only the data core, environment
    and page darkness; streams/type still draw over it on screen.
  - 2.3 — owner's re-sweep values baked as literals, tuner deleted:
    **backside env 0.4 · specular 0.5 · kernel light 2.5 · faux env 1.2**.
  - 3.1 — living docs reconciled (this commit).

## Unresolved Threads (owner-facing, at 3.2)
- **Contact is the acceptance hinge** — the rig centres the prism behind the
  CTA heading; text readability there is the whole point of the round.
- **Prism-too-dark risk** (ADR-011 Consequences) — calibrated values came
  from the owner's own re-sweep, so this should be settled; flag at 3.2 if
  any act still reads formless.
- **Low tier** faux glass (`?tier=low`) was calibrated (`1.2`) but the
  clearcoat drop (1 → 0.4, roughness 0.06 → 0.5) is agent-chosen — judge it.

## 3.2 Owner QA checklist (plan-0008 acceptance)
- [ ] **High:** no white blow-out anywhere; text readable over the prism in
      *every* act, especially Contact; prism reads as lit blue glass,
      data-core visible; beams and packets unchanged; **no coins**.
- [ ] **Low** (`?tier=low`): faux glass no longer mirrors the Lightformers;
      text readable.
- [ ] **Static** (`?tier=static`) / reduced-motion: crisp, no motion, no
      console errors.
- [ ] No `?env=`/`?spec=`/`?light=`/`?faux=` param has any effect (tuner gone).
- [ ] ADR-010 §1/§2/§3/§5 features still behave (twins, opt-in prompt, shard
      assembly, Tagging card).

## Key References
- ADR: `docs/decisions/ADR-011-lens-legibility-and-inflow-simplification.md`
  (**including Amendment A** — the owned-bake decision and the drei/composer
  trace live there).
- Plan: `docs/plans/implementation-plan-0008.md` (slice 2.1b added mid-plan).
- New/changed load-bearing bits: `bakeExclusions.tsx` (registry +
  `<BakeExcluded>`), `HighGlass` in `TheLens.tsx` (owns the prism mesh and
  the two-pass bake — the mesh must stay locally owned, react-compiler),
  `DataStreams.tsx` root registration, `LensScene.tsx` kinetic-layer wrap.
- **Do not "clean up":** the `resolution={2}` on MTM (idles drei's internal
  FBOs), the per-pass `envMapIntensity` writes in the bake, and the
  `BACKSIDE_ENV_INTENSITY ≠ FRONT_ENV_INTENSITY` pair are all load-bearing
  and commented in place.

## Recommended Next Steps
- [ ] Owner: run the 3.2 checklist above (`npm run dev`, port 3004).
- [ ] After sign-off: merge `ui-refinement` → `main`;
      `code-review-and-quality` before merge if desired.
- [ ] Confidentiality rule (CLAUDE.md) held: no client names/figures added.

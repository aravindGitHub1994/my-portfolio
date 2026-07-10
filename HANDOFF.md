# Handoff — ADR-009 implementation (plan-0006)

Branch `ui-refinement`. Executing
`docs/plans/implementation-plan-0006.md` (slice specs live THERE — read it
first; this file only records progress + gotchas).

> ✅ **Plan-0006 complete** (2026-07-11). All AFK slices coded with
> `npm run lint` + `npm run build` green after every slice (final pass green
> at commit time). Owner drove the 5.3 visual QA across all tiers and signed
> off; plan-0005 + plan-0006 committed and pushed to `ui-refinement`.

## Current Status

Plan-0005 is fully implemented (see git-diffable working tree + plan-0005).
Its leftovers were folded into plan-0006: open bug 1 → slice 4.1,
CONTEXT.md scrub → 5.2, all visual verification → 5.3 (HITL).
**Per owner request there is NO agent browser QA this plan** — every AFK
slice gates on `npm run lint` + `npm run build` only.

### Plan-0006 slices

| Slice | State | Notes |
|---|---|---|
| 1.1 prism glass retune | **coded (lint+build green; visual at 5.3)** | `TheLens.tsx`: env 0.16→0.03, roughness→0.06, CA→0.05, distortion→0.05, temporal→0.02, attenuation 4.5→2.5, pointLight 4→2.5; core → new `CORE_CYAN` (#46e3ff, = SPECTRUM cyan), opacity 1; comment rewritten. Kept `ior 1.45` + `anisotropicBlur 0.12` (plan said "keep ~"). |
| 1.2 physical refraction | **coded (lint+build green; visual at 5.3)** | `DataStreams.tsx`: `uInSide` mirrors inflow p0/c/p1 x (enter outer face), driven `lerp(1, v.side, v.project)`; beam origin `p0.x = mix(0.4, 0.4*uSide, uProject)`; kink = `vec3(uSide, 0.08*k, 0) * 0.6 * uProject` added to the bezier control point (per-color spread, sweeps through zero mid-crossing). Hero/underline/static unaffected (uProject≈0 paths checked by inspection). |
| 2.1 gpuTier rewrite | **coded (lint+build green; visual at 5.3)** | Full rewrite: default **high**; only floors = reduced-motion→static, no-WebGL→none, software renderer→low; `?tier=` sets `auto:false`; header comment rewritten. Old mobile/Intel/memory heuristic deleted. |
| 2.2 stateful tier + watchdog + popup | **done (lint+build green)** | One deviation from the design notes: the repo's `react-hooks/set-state-in-effect` rule forbids detect-in-an-effect, so detection lives in a lazy `useState(detectTier)` initializer inside a NEW client-only `LensRoot.tsx` (reached via the existing ssr:false dynamic boundary; `LensCanvas` is now a thin prerendered shell). `FidelityNotice` + module-level `watchdogFired` guard live in LensRoot; `FpsWatchdog` in LensScene. GlassImageLayer unmount audit passed (registry release + texture dispose + IO disconnect; lingering ≤1.1s gsap tween on a plain ref object is harmless). |
| 3.1 reveal affordance | **done (lint+build green)** | Pill (`.reveal-hint`, globals.css) + `data-revealing` via React state in `ProjectRevealCurtain`; `data-cursor-label="Reveal"` read by a new label div in `Cursor.tsx` (own quickTo pair at the ring's lag; text only rewritten when non-empty so fade-out keeps its shape). Pill fade relies on the global reduced-motion transition-zeroing block — no extra media gate. |
| 4.1 kinetic-twin offset (ex-bug 1) | **coded (lint+build green)** | Root cause pinned to the baseline math: `r.top + fontBoundingBoxAscent` assumes a Range rect starts one font-ascent above the baseline — untrue across line-height models, which is exactly what separates the tight-leading hero from section titles. `rasterize.ts` now measures the browser's real Range-top→baseline offset with an offscreen probe (zero-size inline-block marker = baseline; same font + line-height; cached per style key; probe on `document.body` so heading MutationObservers never fire). Pad symmetry vs `layoutPlaneToRect` was audited clean — no layout.ts change. Marker-line verification is owner's at 5.3. |
| 4.2 extended aberration | **done (lint+build green)** | Eyebrow (`SectionHeader`) + `01 / 05` counter (`ProjectPin`) wrapped in `KineticText as="p"`, same classes. `.cta-split` utility (globals.css, fine-pointer + no-reduced-motion gate) on the three Contact `ButtonLink`s — 1px red/blue text-shadow channel literals (not tokens, like the shader CA). Chips/body/taglines untouched. |
| 5.1 ADR-009 + docs | **done** (previous session) | |
| 5.2 confidentiality tail | **done** | CONTEXT.md:17 brand scrubbed to just the current fictional name. Shape greps (GTM/GA4/email) over repo AND `out/` prerender: only fabricated recreation values + owner's gmail. Final lint+build green 2026-07-11. |
| 5.3 owner visual QA | **done — owner sign-off (2026-07-11)** | all tiers + reduced-motion + `?tier=high&debugProjection`; incl. plan-0005 trajectory-pose check (ex-bug 2) |

### 2.2 design notes (historical — implemented with one deviation, see table)

- **`LensCanvas.tsx`** — `useState<FidelityTier|null>(null)` + `auto` state;
  detect in an effect; `null` → render nothing; `"none"` → `markLensReady()`
  + no canvas (the tier console.info moves here from LensScene). Render
  `<LensScene tier={tier} onSlow={...}/>` inside the existing
  `pointer-events-none -z-10` div; `FidelityNotice` as a **sibling** with
  `pointer-events-auto`. `onSlow` → `setTier("low")` + show notice; **Back to
  full** → `setTier("high")`, hide notice; **×** → hide, stay low.
  Watchdog must fire once per page load: module-level boolean, but **read/set
  it only inside the onSlow callback** (never during render — react-compiler
  purity). Pass `onSlow` only when `tier==="high" && auto`.
- **`LensScene.tsx`** — take `tier`/`onSlow` props; delete `detectTier`
  import, the internal `useState`, the tier-log effect, and the `none` early
  return; keep `markLensReady` onCreated, `finePointer`, high-tier gates.
  Mount `{tier==="high" && onSlow && <FpsWatchdog onSlow={onSlow}/>}`.
- **`FpsWatchdog`** (in LensScene, child of Canvas): `useFrame` accumulator
  in a ref — skip deltas >0.1s (tab pause/compile), ~1s warmup, then 2s
  windows; window avg <40fps → `onSlow()` once (set ref `fired`). Keep
  watching across good windows (fire on later sustained degradation).
- **`FidelityNotice`** (DOM, in LensCanvas file): fixed card, `role="dialog"`
  + aria-label, copy **"Switched to the basic version for smoothness."**,
  buttons "Back to full" + ×. Semantic tokens only (`bg-surface`, `text-ink`,
  `border-line`, `text-accent-bright`… — see `globals.css` @theme). No
  localStorage.
- **Hot-swap cleanup audit (done):** `RefractionPass` disposes its Effect on
  unmount and `KineticTextLayer` releases its registry claim + per-plane
  textures — high→low swap is safe. `GlassImageLayer` audit ~~was NOT done~~
  → done next session, passed (see 2.2 table row).
- R3F `Canvas` `dpr`/`frameloop` props react to tier change in place; no
  `key=` remount (would re-run onCreated and drop scene continuity).

## Close-out (resolved)

- **Committed & pushed** to `ui-refinement` (2026-07-11) — plan-0005 +
  plan-0006 landed together after owner sign-off (`git commit -F <file>`,
  Windows shell memory note).
- Slices 1.1/1.2/2.1/2.2 lint + build green (2026-07-11); visual acceptance
  completed by the owner at 5.3.
- 1.2's kink magnitudes (0.6, 0.08·k) were the owner's to retune at 5.3; the
  committed values reflect that review.
- Owner's machine previously detected `low`; 2.1 makes it high by default —
  covered by the 5.3 watchdog check.

## Key References

- Plan (slice specs, acceptance gates): `docs/plans/implementation-plan-0006.md`
- Decision record: `docs/decisions/ADR-009-lens-refinement-glass-refraction-and-high-default-fidelity.md`
- Prior act: `docs/decisions/ADR-008-projection-work-act-and-prism-finale.md`, `docs/plans/implementation-plan-0005.md`
- Conventions: `AGENTS.md`, `docs/design-system.md`
- Confidentiality rule: project `CLAUDE.md` (authoritative; ADR-006 §7a narrative unreliable)

### Tooling notes

- `npm run dev` on port 3004; **no browser QA this plan** (owner request) —
  gates are `npm run lint` + `npm run build` only.
- Windows: don't round-trip UTF-8 files through PowerShell cmdlets; commit
  messages via `-F` file.

## Recommended Next Steps

**Plan-0006 complete (2026-07-11).** Owner finished the 5.3 visual QA and
signed off; work is committed and pushed to `ui-refinement`.

- [x] Owner 5.3 visual QA + sign-off (all tiers + reduced-motion +
      `?tier=high&debugProjection`): watchdog auto-drop + "Back to full",
      `?tier=low` shows no notice, 4.1 marker-line alignment (incl. the new
      eyebrow / `01 / 05` twins), reveal pill + "Reveal" cursor label, CTA
      RGB-split legibility, 1.2 kink magnitudes.
- [x] Commit (plan-0005 + plan-0006) and push to `ui-refinement`
      (`git commit -F <file>`, Windows note).

No open agent work remains on this plan.

## Recommended Skills

- `fullstack-guardian` — completed the post-5.3 commit + push (this session).
  No further agent work outstanding.

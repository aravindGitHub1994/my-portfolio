# Handoff — ADR-005 redesign · P1 + P2 + 3.1/3.3 done, next 3.2

_Branch `threeJS-redesign`. All of P2 (Work act) plus P3 slices 3.1 and 3.3 are
**committed**; working tree is clean. Next: **3.2 Approach act** — but read the
QA note first, it interacts with unverified cube work._

## Current Status
- **P1 committed** (`0bf80c2`…`70de8a9`): dark shell + Geist + Lenis
  (`LenisProvider`), glass-cube canvas (`src/components/cube/`), tier system
  (`src/lib/gpuTier.ts`, `?tier=` override), Hero act + scroll-morph
  (`cubeState.heroProgress`), loader/cursor/magnetic (`src/components/ui/`).
- **P2 committed** (`3ecf8f3`…`f7db2f7`):
  - 2.1/2.2: all four diagrams re-authored to `docs/diagram-authoring.md`
    (prefixes `tax-/bud-/gmc-/per-`); runtime in `src/lib/diagramAnimation.ts`,
    inlining in `src/components/InlineDiagram.tsx`.
  - 2.3: `acts/Work.tsx` + `acts/ProjectPin.tsx` — CSS-sticky pins in 200vh
    runways (no pin below `lg`), alternating sides, per-slug diagram panel
    widths; `capabilities.ts` recolored to single-accent chips.
  - 2.4: draw-on timeline scrubbed across each pin (`top 70%`→`bottom bottom`),
    packets visibility-gated, `cubeState.workProject` written by an exclusive
    55%-line trigger; `DiagramFace` in `CubeScene.tsx` projects the active
    diagram inside the glass (TextureLoader on the SVGs, crossfade at trough,
    counter-rotates the hero quarter-turn; animated tiers only).
  - 2.5: `acts/ReadTheBuild.tsx` — native `<dialog>` overlay (no layout shift
    in pins), Esc/focus-trap/restore native, stops Lenis + native scroll,
    parks the custom cursor (it can't render above the top layer),
    `@starting-style` entry.
- **P3 partial:** 3.1 `resume.ts` schema (`location` + optional
  `period?: {start?, end?}` — no dates invented); 3.3 `acts/Trajectory.tsx`
  timeline (disclosures, order-only, auto-dates when `period` lands).
- Every slice: lint + static-export build green; committed per slice.

## Unresolved Threads
- **In-browser QA still zero.** Chrome extension connect was attempted this
  session and failed ("extension not connected") — needs user to install/
  connect claude.ai/chrome, then verify: cube fps + `?tier=` paths, hero
  morph, diagram draw-on scrub direction/feel, DiagramFace opacity/placement
  (esp. vs. low-tier faux glass and on mobile), dialog focus/cursor behavior,
  gmc panel height on small laptops. A dev server (not ours) already holds
  port 3004.
- **3.2 design tension:** Approach act wants `SKILL_TIERS` on the cube's
  faces, but `DiagramFace` (2.4) occupies the cube during Work; Approach act
  sits *before* Work in page order. Decide the face choreography after seeing
  2.4 live.
- **P1.3 HITL calibration** (real phone) and **2.1 convention review** with
  user still pending; career dates for `resume.ts` still missing (user data).
- PowerShell 5.1 gotchas hit twice: `git commit -m` with embedded `"` breaks
  arg quoting (use `-F <file>`), and `Get-Content`/`Set-Content` round-trips
  mojibake UTF-8 em-dashes (use the agent Write tool).

## Key References
- ADR: `docs/decisions/ADR-005-threejs-scroll-experience.md`
- Plan/tracker: `docs/plans/implementation-plan-0003.md` (16 slices, S-gate)
- Diagram contract: `docs/diagram-authoring.md`
- Constraints: static export (ADR-001); CSP `font-src/connect-src 'self'` — no
  runtime cross-origin fetches ever (fonts, HDRs, GPU benchmarks are local).

## Recommended Next Steps
- [ ] 3.2 Approach act: skill tiers on cube faces + inline real stats (44
      sub-accounts, 19 sites, 200+ consultants…) — after the QA pass if at
      all possible (see design tension above).
- [ ] P4.1 contact point-globe dissolve; 4.2 polish/perf QA (scroll-progress
      indicator, inter-act reveals, fps pass); 4.3 docs rewrite (README/ADR
      touch-ups for retired celestial system).
- [ ] HITL: browser QA session (extension), phone calibration, real career
      dates into `resume.ts`.

## Recommended Skills
- `webgpu-threejs-tsl`, `frontend-ui-engineering`, `tailwind-patterns`;
  `verify`/`run` + Chrome extension for the 3004 visual pass.

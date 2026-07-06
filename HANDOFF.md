# Handoff — ADR-005 redesign · P1 done, mid-P2.2

_Branch `threeJS-redesign`. P1 (Hero spine, slices 1.1–1.5) and P2.1 are
**committed**; slice **2.2 is half-done in the working tree** — finish it first._

## Current Status
- **P1 committed** (`0bf80c2`…`70de8a9`): dark shell + Geist + Lenis
  (`LenisProvider`), glass-cube canvas (`src/components/cube/`), tier system
  (`src/lib/gpuTier.ts`, `?tier=` override), Hero act + scroll-morph
  (`cubeState.heroProgress`), loader/cursor/magnetic (`src/components/ui/`).
  Lint + static-export build green; dev on port 3004.
- **P2.1 committed:** diagram convention (**`docs/diagram-authoring.md`** — read
  it first), hand-authored `public/diagrams/taxonomy.svg`,
  `src/lib/diagramAnimation.ts` (draw timeline + packets),
  `src/components/InlineDiagram.tsx` (fetch-inline, `<img>` fallback).
- **P2.2 in progress (uncommitted):** old `budget/gmc/personas` `.svg/.mmd/.light.svg`
  are `git rm`'d; new `budget.svg` is written. **`gmc.svg` and `personas.svg` do
  not exist yet.** Planned geometry (follow taxonomy/budget as reference):
  - `gmc.svg` — TD chain of 6, viewBox 420×580, nodes x=90 w=240 h=58 at
    y=20,116,212,308(SQLite cylinder),404,500; straight edges x=210; key node
    (accent + `data-key`) = "44 GMC sub-accounts"; last node frontend-stroke
    `#8fb3ff`; steps 0–10 alternating; prefix `gmc-`.
  - `personas.svg` — TD branch, viewBox 560×470: data(cyl-top, y=24) → select
    (y=140) → sim (y=256, `data-key`, dashed rect) → branches to mkt (x=40) &
    qa (x=300) at y=380, both dashed; curved e3/e4 with rotated arrows; `per-`.
- Tasks: 2.2 (#7) in progress → 2.3 layout+capabilities recolor (#8) → 2.4
  scroll-sync + cube-face texture (#9) → 2.5 disclosure (#10). Then P3/P4.

## Unresolved Threads
- **No in-browser QA yet** (Chrome extension never connected): verify cube fps,
  `?tier=` paths, loader, cursor, hero morph, diagram render.
- **P1.3 HITL calibration** (real phone) and **2.1 convention review** with user.
- **Career dates missing** (`resume.ts` — slice 3.1); capability palette recolor
  pending (slice 2.3); docs rewrite pending (4.3).

## Key References
- ADR: `docs/decisions/ADR-005-threejs-scroll-experience.md`
- Plan/tracker: `docs/plans/implementation-plan-0003.md` (16 slices, S-gate)
- Diagram contract: `docs/diagram-authoring.md`
- Constraints: static export (ADR-001); CSP `font-src/connect-src 'self'` — no
  runtime cross-origin fetches ever (fonts, HDRs, GPU benchmarks are local).

## Recommended Next Steps
- [ ] Write `gmc.svg` + `personas.svg` (specs above), commit 2.2.
- [ ] 2.3: Work act pinned layouts from `PROJECTS` + recolor `capabilities.ts`.
- [ ] 2.4: scrub `buildDrawTimeline` per pin; packets on visibility; cube face
      textures via `THREE.TextureLoader` on the diagram SVGs.
- [ ] 2.5: accessible "Read the build" overlay (no layout shift in pins).
- [ ] Lint + build + commit per slice; then P3 (3.1 schema first), P4.

## Recommended Skills
- `executing-plans`, `webgpu-threejs-tsl`, `frontend-ui-engineering`,
  `tailwind-patterns`; `verify`/`run` for the 3004 visual pass.

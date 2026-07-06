# Handoff — Three.js Scroll-Driven Redesign (ADR-005)

_For the next session. Focus: **begin executing** the redesign, starting at slice
**P1.1**. This is a **planning-complete, code-not-started** state — two docs are
written, no source code touched, nothing committed._

> Supersedes the previous ADR-004 celestial-sky handoff (that work is retired by this
> redesign; it lives in git history and on branch `feat/animated-celestial-sky`).

## Current Status
- On branch **`threeJS-redesign`** (cut from `feat/animated-celestial-sky`).
- A `/grill-with-docs` session resolved **11 design branches**; a `/to-issues` session
  produced a **16-slice, 4-phase** implementation plan. Both are written and saved.
- **No source code changed. Nothing committed.** Only two new docs + this handoff
  exist in the working tree (plus untracked `docs/gif_rec.gif` from the prior branch).
- The redesign: single **dark, scroll-driven** page around **one morphing glass data
  cube**; honest-but-bold tone with **real numbers only**; five acts
  (Hero → Approach → Work → Trajectory → Contact); **electric-blue** accent + **Geist**;
  content in `src/lib/*.ts` reused, current layout/theme/celestial all retired.

## Unresolved Threads
- **Career dates still missing.** `resume.ts` `period` holds a *city*, not years.
  Timeline ships **order-only**; schema (slice 3.1) is built date-ready. Ask the user
  for real start/end years to light up the dated timeline + any "X+ years" figure.
- **Two HITL slices need a human call:** 1.3 (fidelity/perf tier calibration) and 2.1
  (the animatable-SVG diagram authoring contract — decide the id/class/edge convention
  before re-authoring the other three diagrams).
- **Capability tag palette** (`src/lib/capabilities.ts`) still uses celestial colors
  (`gold/moss/lilac/plum/silver`) — must be recolored for the dark + electric-blue
  system (slice 2.3).
- **Diagrams** (`public/diagrams/*.svg`) are Mermaid-rendered and **not** structured
  for animation yet — slices 2.1/2.2 re-author them; `.mmd` sources may be retired.
- **Tracker is local** — `gh` is not installed, so the 16 slices live in the plan file,
  not as GitHub issues. Offer to create real issues if `gh` gets set up.
- **Big-build risk / new deps.** Adds `three` + R3F + drei + `gsap` + `lenis` +
  `framer-motion` (a conscious reversal of ADR-004's "no runtime deps"). Static export
  (ADR-001) is retained — keep all WebGL/DOM access inside effects/mounted guards.

## Key References
- **ADR:** [ADR-005](docs/decisions/ADR-005-threejs-scroll-experience.md) — supersedes
  ADR-003 & ADR-004, extends ADR-002, retains ADR-001. Full context, the 11 decisions,
  and 8 rejected alternatives are there — don't re-litigate them.
- **Plan / tracker:** [implementation-plan-0003.md](docs/plans/implementation-plan-0003.md)
  — 16 tracer-bullet slices, each with acceptance criteria + `Blocked by` edges, a
  files map, and the S-gate verification checklist.
- **Constraints:** [ADR-001](docs/decisions/ADR-001-next-js-static-export.md) (static
  export). CSP in `vercel.json` is `font-src 'self'` / `connect-src 'self'` → Geist
  self-hosted, no third-party form.

## Recommended Next Steps
- [ ] Start **P1.1** (dark shell: add deps, self-host Geist, dark+electric-blue tokens,
      wire Lenis, strip the theme/celestial systems, collapse to one scroll page).
      Verify `npm run lint` + `npm run build` stay green (static export intact).
- [ ] Then **P1.2 → P1.5** to complete the Hero spine before scaling (proves refraction
      + tiering + scroll-morph look award-grade first).
- [ ] At **1.3**, sit with the user to calibrate mobile faux-glass fidelity on a real
      device / emulation.
- [ ] Get real career **dates** from the user (unblocks the dated timeline).
- [ ] Commit per phase — each slice/phase is designed to be independently deployable.

## Recommended Skills
- **`webgpu-threejs-tsl`** / **`react-patterns`** — building the cube canvas + R3F acts.
- **`tailwind-patterns`** — the dark token system + electric-blue accent in Tailwind v4.
- **`frontend-ui-engineering`** — the scroll choreography, loader, cursor, micro-interactions.
- **`executing-plans`** — drive the slices in dependency order with review checkpoints.
- **`verify`** / **`run`** — drive the dev server (port 3004) for per-phase visual/perf checks.

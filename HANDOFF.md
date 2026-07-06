# Handoff — Three.js Scroll-Driven Redesign (ADR-005)

_For the next session. **Phase P1 (Hero spine) is implemented and committed**
(slices 1.1–1.5, one commit each, on branch `threeJS-redesign`). Next up: the
**P1.3 human calibration pass**, then **P2 (Work act)** starting at slice 2.1._

## Current Status
- On branch **`threeJS-redesign`**. `npm run lint` + `npm run build` green;
  static export (`out/`, ~2.7 MB) intact at every commit. Dev server: port 3004.
- **P1.1** Dark shell: three/R3F/drei/gsap/lenis/framer-motion added; Geist
  self-hosted via `next/font` (CSP `font-src 'self'` safe); dark + electric-blue
  tokens (`#3d74ff` accent family) in `globals.css`; GSAP-synced Lenis at the
  layout root (`LenisProvider`, `anchors: true`); site collapsed to one scroll
  page with five act anchors; theme/celestial systems deleted.
- **P1.2** `src/components/cube/` — one persistent R3F canvas (DPR≤2, pauses on
  `visibilitychange`), glass cube = `MeshTransmissionMaterial` shell + electric
  wireframe core, lit by **local Lightformers only** (Environment presets fetch
  CDN HDRs → CSP violation). Loaded `dynamic(ssr:false)` → prerender-safe,
  code-split (the ~950 KB three chunk streams in behind the loader).
- **P1.3** `src/lib/gpuTier.ts` — heuristic tiers high/low/static/none (no
  detect-gpu: it fetches CDN benchmarks). Faux-glass = clearcoat physical
  material, no transmission buffer, DPR≤1.5. **`?tier=` URL override for
  calibration.** Tier logged to console.
- **P1.4** `src/components/acts/Hero.tsx` — real hero copy + scroll cue;
  ScrollTrigger writes `heroProgress` into `cubeState` (shared mutable module,
  no re-renders); cube drifts right / shrinks / quarter-turns out of the hero.
- **P1.5** `src/components/ui/` — `Loader` (in prerendered HTML, dismisses on
  cube-ready, 4 s failsafe), `Cursor` (dot + trailing ring), `Magnetic` CTA
  wrapper. All no-op on touch / reduced-motion.

## Unresolved Threads
- **Visual QA not done in-browser** — the Chrome extension wasn't connected this
  session. Verify: cube renders + ~60 fps on desktop, faux-glass via
  `?tier=low`, static via `?tier=static`, loader dismiss, cursor, magnetic CTAs,
  hero morph on scroll.
- **P1.3 is HITL:** calibrate faux-glass fidelity on a real mid-range phone
  (and the Intel-integrated-GPU heuristic in `gpuTier.ts`) with the user.
- **Career dates still missing** (`resume.ts` `period` holds a city). Slice 3.1
  splits the schema; ask the user for real years.
- **Capability tag palette** (`capabilities.ts`) still references deleted
  celestial tokens (`gold/moss/lilac/plum/silver`) — currently unrendered;
  recolor in slice 2.3.
- **Acts 2–5 are placeholders** in `src/app/page.tsx` (real content, minimal
  layout) — built out in P2 (Work), P3 (Approach/Trajectory), P4 (Contact).
- **Diagrams** not yet re-authored (slices 2.1/2.2). 2.1 is HITL: agree the
  animatable-SVG id/class/edge convention before authoring the other three.
- **Tracker is local** — the 16 slices live in
  `docs/plans/implementation-plan-0003.md` (gh not installed).
- Docs (`README`, `CLAUDE.md`, `AGENTS.md`, `design-system.md`) still describe
  the celestial site — rewrite is slice 4.3.

## Key References
- **ADR:** [ADR-005](docs/decisions/ADR-005-threejs-scroll-experience.md) — the
  11 decisions + 8 rejected alternatives. Don't re-litigate.
- **Plan / tracker:** [implementation-plan-0003.md](docs/plans/implementation-plan-0003.md)
  — 16 slices with acceptance criteria and `Blocked by` edges; S-gate checklist.
- **Constraints:** static export (ADR-001); CSP in `vercel.json` is
  `font-src 'self'` / `connect-src 'self'` — nothing may fetch cross-origin at
  runtime (fonts, HDRs, GPU benchmarks all self-hosted/local).

## Recommended Next Steps
- [ ] In-browser QA of P1 (desktop + `?tier=low` + `?tier=static` + reduced
      motion), and the P1.3 calibration sit-down with the user.
- [ ] **P2.1 (HITL):** re-author one diagram (`taxonomy`) as a structured
      animatable SVG; write down the convention for 2.2.
- [ ] Then 2.2 → 2.5 (Work act), 3.1–3.3, 4.1–4.3 per the plan's edges.
- [ ] Get real career **dates** (unblocks the dated timeline).
- [ ] Commit per slice/phase; each phase stays deployable.

# Implementation Plan 0001 — Animated Celestial Day↔Night Transition

> Source decision: **ADR-004** (`docs/decisions/ADR-004-animated-celestial-transition.md`),
> which partially supersedes ADR-003. Source plan: `docs/decisions/your plan.md`.
> Tracker: local (gh not installed) — issues live in this file.

## Build status — updated 2026-06-28

**S1–S7 are code-complete; `npm run lint` + `npm run build` are green** (static
export, 9 routes, ADR-001 intact), independently re-verified after each agent. The
legacy `Starfield.tsx` / `Cloudfield.tsx` / `BackgroundScene.tsx` are deleted and
`SkyScene` is the sole background. **Nothing is committed yet** — all changes sit in
the working tree.

**Remaining: S8 (verification gate).** The code/build half passes; the *visual*
matrix (2.2 s arc, mid-arc reversal, no-FOUC settle, reduced-motion snap, mobile
legibility, moon fallback, Pisces hover) still needs an eyes-on pass. Browser
automation via the Claude Chrome extension was attempted, but the **extension is not
connected**, so GIF/screenshot capture is blocked pending that connection — a manual
`npm run dev` pass (port 3004) is the fallback.

Per-slice status is marked ✅ / ⏳ on each heading below; the original acceptance
checkboxes are retained for reference.

## How this is organised
The work is split into **vertical-slice issues** (tracer bullets) and assigned to
**six subagents** that run in dependency order. Each agent is given the project
skills relevant to its slice (the orchestrator must pass these to the agent on
spin-up). Every agent inherits the project's non-negotiables:

- **Static export only** (ADR-001): no SSR/dynamic, no `next/image`, no route
  handlers, no new runtime dependencies. Plain `<canvas>`; all `document`/DOM
  access inside effects or mounted guards.
- **Reduced-motion floor** (ADR-003): reduced-motion always snaps — draw once, no
  arc, no shooting stars.
- Content/tokens stay in `src/lib/*.ts` and `globals.css` `@theme`; use semantic
  classes, not raw hex. `techIcons.ts` path data is off-limits.
- Run `npm run lint` and `npm run build` (static export to `out/`) before handoff.

## Subagent roster & skill assignment

| Agent | Role | Slices | Skills to pass on spin-up |
|-------|------|--------|---------------------------|
| **A — Scene Architect** | Unified canvas spine, progress + arc model, palette | S1 | `architecture-designer`, `frontend-ui-engineering`, `react-patterns`, `typescript-pro`, `tailwind-patterns`, `code-simplification` |
| **B — Animation/State Engineer** | Transition driver + mid-arc token cross-fade | S2, S3 | `frontend-ui-engineering`, `react-patterns`, `typescript-pro`, `tailwind-patterns`, `debugging-and-error-recovery` |
| **C — Generative-Art / Canvas Engineer** | Realistic star field + realistic sun/moon + horizon | S4, S5 | `frontend-ui-engineering`, `typescript-pro`, `code-simplification`, `debugging-and-error-recovery` |
| **D — Integration & Toggle** | Header glyph morph, wire-up, migrate-then-delete, asset resilience | S6 | `frontend-ui-engineering`, `react-patterns`, `tailwind-patterns`, `security-and-hardening`, `code-simplification` |
| **E — Docs** | design-system.md update (ADR-004 already authored) | S7 | `documentation-and-adrs`, `architecture-designer`, `mermaid-skill` |
| **F — QA / Verification** | Full verification matrix, lint/build, a11y, pre-mortem | S8 | `test-master`, `testing-qa`, `e2e-testing`, `javascript-testing-patterns`, `code-review-and-quality`, `debugging-and-error-recovery`, `security-reviewer`, `the-fool`, `verify` |

**Dependency order:** A → B → C → D → (E ∥ F). E may start immediately (docs only);
F runs after D and re-runs as a final gate.

## Dependency graph
```
S1 (A) ──┬─> S2 (B) ──> S3 (B) ──┐
         └─> S4 (C) ──> S5 (C) ──┴─> S6 (D) ──> S8 (F, final gate)
S7 (E) — independent (docs), can run in parallel from the start
```

---

## S1 — Unified SkyScene canvas spine (static progress) · AFK · Agent A — ✅ DONE & build-verified
**Blocked by:** None

### What to build
Create `src/components/sky/SkyScene.tsx`: one fixed full-viewport `-z-10`
`<canvas>` owning a single RAF loop, drawing everything as a function of a
`progress` value (`0` = deep night, `1` = full day). For this slice `progress` is
**static** per resolved theme (night = 0, day = 1) — no animation yet. Migrate the
existing draw logic into helpers and reach **visual parity** with today's two
canvases before any realism/animation work.

- Helpers: `palette.ts` (night→twilight→day colour lerp), `drawSun.ts` (reuse
  `SUN_CELLS` + gradients from `Cloudfield.tsx`), `drawMoon.ts` (reuse `MOON_MARIA`
  + body gradient from `Starfield.tsx:159-224`), `drawStars.ts`, `drawClouds.ts`
  (reuse cloud shape `Cloudfield.tsx:32-53` + night-cloud gradient
  `Starfield.tsx:130-144`), `drawHorizon.ts` (stub silhouette for now).
- Shared `bodyPosition(t)` arc model: `t ∈ [0,1]` → point on an arc
  (rest-high → setting → below horizon). Sun at `t = progress`, moon at
  `t = 1 − progress`. At steady states both rest high (parity with today's fixed
  `x=0.76w, y=0.16h`).
- Reuse the DPR-cap, `seed()`, resize, and fixed-viewport patterns from
  `Starfield.tsx`. Keep cursor/scroll parallax for stars.
- Wire `SkyScene` into `layout.tsx` behind the existing mounted guard; keep
  `BackgroundScene` in place but make `SkyScene` the renderer (do **not** delete
  the old files yet — that is S6).

### Acceptance criteria
- [ ] `src/components/sky/SkyScene.tsx` + the six helper modules exist and typecheck.
- [ ] Night (progress 0) and day (progress 1) render with parity to the current
      `Starfield`/`Cloudfield` (stars/moon vs. sky/sun/clouds).
- [ ] Exactly one RAF loop; pauses on `visibilitychange` (hidden).
- [ ] Cursor/scroll parallax on stars preserved.
- [ ] `prefers-reduced-motion`: draws once, no continuous animation.
- [ ] `npm run lint` and `npm run build` clean.

---

## S2 — Animated transition driver (cinematic arc) · AFK · Agent B — ✅ DONE & build-verified
**Blocked by:** S1

### What to build
Make the theme change cinematic. Tween `progress` 0↔1 over ~2.2 s ease-in-out on
an explicit toggle; snap on every other trigger.

- Export `THEME_TRANSITION_MS = 2200` from `src/lib/theme.ts` (single source of truth).
- Extend `ThemeProvider` context with `transition: { animate: boolean; id: number }`:
  `setMode` (toggle click) → `animate: true`; the refocus/visibility re-resolve
  path (`ThemeProvider.tsx:75-91`) → `animate: false`.
- `SkyScene` keys an effect on `transition.id`: on `animate` it tweens `progress`
  over `THEME_TRANSITION_MS` (ease-in-out); else it jumps. Re-trigger mid-arc
  **reverses smoothly** from current progress toward the new target.
- During the transition, sun (`t = progress`) and moon (`t = 1 − progress`) travel
  crossing arcs and dip toward the horizon at the twilight midpoint; steady states
  pin them high.
- First mount → **gentle settle** (stars/clouds ease in; no arc, no token cross-fade
  — tokens already correct from the pre-paint script). Reduced-motion / refocus →
  snap (no arc, no shooting stars).

### Acceptance criteria
- [ ] Toggling the header sun/moon plays a ~2.2 s sunrise (night→day) and sunset
      (day→night) with crossing arcs through twilight.
- [ ] Re-clicking mid-arc reverses smoothly (no jump/restart).
- [ ] First load shows a gentle settle, not a full arc, with no FOUC.
- [ ] Auto refocus-flip and `prefers-reduced-motion` snap instantly.
- [ ] RAF still pauses when the tab is hidden.
- [ ] `npm run lint` / `npm run build` clean.

---

## S3 — Mid-arc page-token cross-fade · AFK · Agent B — ✅ DONE & build-verified
**Blocked by:** S2

### What to build
Defer the visual `data-theme` flip to the twilight midpoint so the page and sky
never visibly disagree.

- On an animated change keep `data-theme` = old until ~`progress` 0.5, then flip it
  (and `color-scheme`, persist `localStorage`, update `ThemeMetaColor`).
- Add a scoped `globals.css` rule: while `html.theme-animating` is present, apply a
  ~400 ms transition on `background-color` / `color` / `border-color` so the flip
  reads as one cross-fade. Add the class just before the flip, remove it after.
- The snap path flips `data-theme` immediately (no class). The existing
  reduced-motion block (`globals.css:200-210`) already zeroes these transitions —
  verify it still wins.

### Acceptance criteria
- [ ] Page tokens (bg/ink/borders) cross-fade at mid-arc; no end-of-arc state where
      the page is one theme while the sky is the other.
- [ ] `ThemeMetaColor` (mobile chrome) and `localStorage["theme-mode"]` update at
      the mid-arc flip, consistent with the sky.
- [ ] Snap path flips tokens instantly; reduced-motion shows no cross-fade.
- [ ] `npm run lint` / `npm run build` clean.

---

## S4 — Realistic star field rebuild · AFK · Agent C — ✅ DONE & build-verified
**Blocked by:** S1

### What to build
Rebuild the night layer in `drawStars.ts`.

- **Magnitude distribution:** many faint stars, few bright — a power-law rather
  than today's flat per-layer ranges (`Starfield.tsx:44-49`).
- **Diffraction spikes:** a subtle 4-point cross on the brightest stars only.
- **Shooting stars:** a scheduler spawns a meteor every ~8–20 s (randomized) — a
  fast fading streak across the sky. **Skipped under reduced-motion.**
- **Pisces:** a fixed asterism (two fish + connecting "cord") drawn from real
  relative star positions, joined by faint constellation lines that **brighten when
  the cursor passes near** (reuse the pointer-parallax tracking already in
  `Starfield.tsx:278-289`).
- Keep cursor/scroll parallax. Stars fade out as `progress → 1`.

### Acceptance criteria
- [ ] Star brightness/size follows a power-law (visibly more faint than bright stars).
- [ ] Bright stars show subtle diffraction spikes; faint stars do not.
- [ ] Shooting stars appear intermittently at night; none under reduced-motion.
- [ ] Pisces is recognisable; its lines brighten as the cursor nears.
- [ ] Stars fade smoothly to invisible by full day.
- [ ] `npm run lint` / `npm run build` clean.

---

## S5 — Realistic sun, moon & horizon · AFK · Agent C — ✅ DONE & build-verified
**Blocked by:** S4

### What to build
Upgrade the celestial bodies and ground the scene.

- **Moon (`drawMoon.ts`):** draw from `public/celestial/moon.webp` (load once,
  cache) with procedural limb darkening + a faint cool halo / earthshine.
  **If the asset is absent or fails to load, fall back to the existing procedural
  moon** — build/scene must never break. Image load happens inside the effect
  (no top-level/SSR fetch).
- **Sun (`drawSun.ts`):** extend the corona/plasma look with limb darkening, finer
  granulation, a layered multi-stop corona, and gentle limb flicker. Stays
  procedural/themeable; tint lerps with `progress` via `palette.ts`.
- **Horizon (`drawHorizon.ts`):** observatory-dome silhouette near the bottom edge,
  drawn from `progress`, with a soft scrim above it to protect text contrast while
  a bright body dips low.

### Acceptance criteria
- [ ] Moon renders from `moon.webp` with limb darkening + cool halo; visibly more
      realistic than the procedural blobs.
- [ ] Removing/blocking `moon.webp` falls back to the procedural moon with **no**
      console errors and no broken build.
- [ ] Sun shows limb darkening, granulation, layered corona, and subtle limb flicker.
- [ ] Observatory horizon + scrim keep body text legible while a body is near the
      horizon, across breakpoints.
- [ ] `npm run lint` / `npm run build` clean.

---

## S6 — Header toggle morph, wire-up & cleanup · AFK · Agent D — ✅ DONE & build-verified
**Blocked by:** S3, S5

### What to build
Finish integration and retire the old scene.

- `ThemeToggle.tsx`: keep the clean Heroicons glyphs; add a small CSS sun↔moon
  **morph on click** (background bodies carry the realism — the glyph stays clean).
- `layout.tsx`: ensure `<SkyScene />` is the only background scene.
- **Migrate-then-delete:** once their draw logic is confirmed migrated, remove
  `BackgroundScene.tsx`, `Cloudfield.tsx`, `Starfield.tsx` (and any dead imports).
- Confirm `CursorSpotlight` stays night-only (no change expected).
- Final asset-resilience pass: place `public/celestial/moon.webp` if provided;
  verify the absent-asset path still builds and renders.

### Acceptance criteria
- [ ] Header toggle morphs sun↔moon on click; reduced-motion shows an instant swap.
- [ ] `Starfield.tsx`, `Cloudfield.tsx`, `BackgroundScene.tsx` deleted; no dangling
      imports; nothing else references them.
- [ ] `CursorSpotlight` unchanged and night-only.
- [ ] App builds and runs with **and** without `moon.webp` present.
- [ ] `npm run lint` / `npm run build` clean.

---

## S7 — Documentation update · HITL · Agent E — ✅ DONE
**Blocked by:** None (ADR-004 already authored)

### What to build
- ADR-004 is already written (`docs/decisions/ADR-004-*.md`) and ADR-003 marked
  partially superseded — **no further ADR work**.
- Update `docs/design-system.md` celestial/background section: replace the
  two-canvas description (`Starfield` night-only / `Cloudfield` day-only /
  `BackgroundScene` gate, lines ~94-116) with the single `SkyScene`, the unified
  progress model, the rebuilt star field (magnitude/spikes/shooting stars/Pisces),
  and the hybrid moon (texture + procedural fallback). No root `CONTEXT.md` change.

### Acceptance criteria
- [ ] design-system.md no longer claims two gated canvases; it describes `SkyScene`,
      the progress model, and the new star field.
- [ ] Component table reflects `SkyScene` replacing `Starfield`/`Cloudfield`/`BackgroundScene`.
- [ ] Cross-links to ADR-004 are present and correct.

---

## S8 — Verification matrix & quality gate · HITL · Agent F — ⏳ PENDING (visual pass)
**Blocked by:** S6

### What to build
Run the full ADR-004 verification matrix and a pre-mortem; report defects back to
the owning agent.

- `npm run dev` (port 3004): toggle night→day and day→night — each plays a ~2.2 s
  arc; sky journeys through twilight; stars fade; clouds recolour; tokens cross-fade
  at mid-arc with no mismatch. Re-click mid-arc → smooth reversal.
- First load → gentle settle, no FOUC.
- Auto refocus across 06:00/18:00 (or temporarily shift `DAY_*_HOUR`) → snaps.
- DevTools "Emulate prefers-reduced-motion" → instant change, static sky, no
  shooting stars / arc.
- Narrow mobile width → bodies stay framed; horizon scrim active; text legible.
- Remove `moon.webp` → procedural fallback, no errors.
- Shooting stars appear intermittently; Pisces lines brighten near cursor.
- `npm run lint` clean; `npm run build` produces a static export (no SSR/dynamic
  features introduced — ADR-001 intact).
- Accessibility: toggle remains keyboard-operable with correct ARIA (per ADR-003);
  reduced-motion honored end-to-end.

### Acceptance criteria
- [ ] All eight ADR-004 verification steps pass and are recorded.
- [ ] Lint + static build clean; no new dynamic/SSR features.
- [ ] Keyboard + reduced-motion accessibility verified.
- [ ] Any defects filed back to the owning agent with repro steps.

---

## Open questions / HITL checkpoints
1. **Asset delivery** — ✅ RESOLVED. `moon.webp` was provided (`docs/moon.webp`) and
   staged at `public/celestial/moon.webp`; the texture path is live, procedural
   fallback retained. (Still confirm the image license permits use before shipping.)
2. **Pisces star coordinates** — ✅ RESOLVED. Agent C traced a 13-star / 12-edge
   asterism from the user-provided reference (`docs/pisces contellation.jpg`) and
   inlined the normalized constants in `drawStars.ts`.
3. **Twilight palette stops** — ⏳ OPEN (visual). The night→twilight→day gradient
   stops in `palette.ts` are a design decision; review the first render with the
   user during the S8 visual pass.

## S8 visual pass — how to run it
The code/build half of S8 is green. The remaining eyes-on checks (per ADR-004):
- **Manual:** a dev server is already running on **port 3004** — toggle night↔day
  (watch the ~2.2 s arc + mid-arc token cross-fade), re-click mid-arc (smooth
  reversal), reload (gentle settle, no FOUC), DevTools → emulate
  `prefers-reduced-motion` (instant snap, no shooting stars), narrow to mobile width
  (bodies framed, scrim keeps text legible), rename `public/celestial/moon.webp`
  away (procedural fallback, no console errors), and hover near Pisces (lines brighten).
- **Browser-automated (GIF capture):** possible via the Claude Chrome extension, but
  it is **not currently connected**. To enable it: install/enable the extension
  (https://claude.ai/chrome), sign into claude.ai with the same account, restart
  Chrome if first-time, then Claude can navigate to `localhost:3004`, drive the
  toggle, and export an animated GIF of the transition for review.

# Handoff — Animated Celestial Day↔Night Transition (ADR-004)

_For the next session. Focus: run the S8 **visual verification pass**, eyeball the
HITL items, then commit. All slice CODE is implemented; `npm run lint` + `npm run
build` are green. Nothing is committed yet._

> Supersedes the previous tri-mode (ADR-003) handoff. The tri-mode theme shipped; this
> feature replaces its two-canvas background with one animated `SkyScene`.

## Current status
- **Slices S1–S7 are code-complete and pass `npm run lint` + `npm run build`**
  (static export, 9 routes, zero errors/warnings) — independently re-verified after
  each agent. **S8 (verification gate) is the only slice left**, and its remaining
  part is the *visual* pass (the code/build half already passes).
- **Plan / tracker:** [docs/plans/implementation-plan-0001.md](docs/plans/implementation-plan-0001.md)
  (per-slice ✅/⏳ status + the S8 run-book live there).
- **Decision:** [ADR-004](docs/decisions/ADR-004-animated-celestial-transition.md)
  (partially supersedes [ADR-003](docs/decisions/ADR-003-tri-mode-theme.md); inherits
  [ADR-001](docs/decisions/ADR-001-next-js-static-export.md) static-export constraints).

## What shipped (by slice)
- **S1 — unified canvas spine.** `src/components/sky/SkyScene.tsx`: one fixed `-z-10`
  `<canvas>`, single RAF loop, draws everything as a function of one `progress` value
  (0 = deep night → 1 = full day). `bodyPosition(t,w,h)` is the shared arc (sun at
  `t=progress`, moon at `t=1−progress`). Helpers: `palette.ts`, `drawStars.ts`,
  `drawMoon.ts`, `drawSun.ts`, `drawClouds.ts`, `drawHorizon.ts`.
- **S2 — cinematic transition.** `THEME_TRANSITION_MS = 2200` exported from
  `src/lib/theme.ts`. `ThemeProvider` context gained `transition: { animate, id }`;
  `SkyScene` tweens `progress` (ease-in-out) on an explicit toggle, snaps otherwise.
  Mid-arc re-click reverses smoothly; first mount is a gentle settle (no arc).
- **S3 — mid-arc token cross-fade.** `ThemeProvider` now splits **`resolved`**
  (target, updates immediately) from **`committed`** (painted/DOM theme). On an
  animated toggle the `data-theme`/`color-scheme`/`localStorage`/`theme-color` flip is
  **deferred to the twilight midpoint** (`THEME_TRANSITION_MS / 2`), wrapped in a
  `html.theme-animating` class that runs a ~400 ms token cross-fade (`globals.css`).
  Snap paths flip instantly. `ThemeMetaColor`, `CursorSpotlight`, `ProjectModal` read
  `committed`.
- **S4 — rebuilt star field** (`drawStars.ts`). Power-law magnitudes (many faint, few
  bright), 4-point diffraction spikes on the brightest only, intermittent shooting
  stars (every ~8–20 s, **skipped under reduced-motion**), and a traced **Pisces**
  asterism (13 stars / 12 edges) whose lines brighten near the cursor. Stars fade out
  by full day.
- **S5 — realistic bodies + horizon.** `drawMoon.ts` draws `public/celestial/moon.webp`
  inside a circular clip (the source has a white background) + limb darkening + cool
  halo, with a **procedural fallback** (`MOON_MARIA`) if the asset is missing/fails —
  load is lazy/cached and guarded (`typeof window`), `onerror` swallowed.
  `drawSun.ts` stays procedural (limb darkening, granulation, layered corona, gentle
  flicker). `drawHorizon.ts` adds an observatory-dome silhouette + a contrast scrim
  that peaks at the twilight midpoint to protect text while a body dips low.
- **S6 — toggle morph + cleanup.** `ThemeToggle.tsx` keeps clean Heroicons glyphs +
  a small CSS sun↔moon morph on click (instant under reduced-motion). The
  `useMounted` hydration gate was folded into `SkyScene` (inner `SkyCanvas`), so
  `layout.tsx` renders `<SkyScene />` directly. **`Starfield.tsx` / `Cloudfield.tsx` /
  `BackgroundScene.tsx` deleted** (`git rm`); no live imports remain. `CursorSpotlight`
  unchanged (night-only).
- **S7 — docs.** `docs/design-system.md` updated: single `SkyScene` + progress model +
  cinematic transition + rebuilt star field + hybrid moon; component table and ADR-004
  cross-links corrected.

## Unresolved threads
- **S8 visual pass (NOT yet run).** The run-book is in the plan file. Quick version on
  **port 3004** (a dev server is already running): toggle night↔day (watch the ~2.2 s
  arc + mid-arc cross-fade), re-click mid-arc (smooth reversal), reload (gentle
  settle, **no FOUC**), DevTools → emulate `prefers-reduced-motion` (instant snap, no
  shooting stars/arc), narrow to mobile width (bodies framed, scrim keeps text
  legible), rename `public/celestial/moon.webp` away (procedural fallback, no console
  errors — restore after), hover near Pisces (lines brighten).
- **Browser-automated GIF capture is blocked.** The Claude Chrome extension is **not
  connected**, so Claude can't drive the browser to record the transition. To enable:
  install/enable the extension (https://claude.ai/chrome), sign into claude.ai with the
  same account, restart Chrome if first-time — then Claude can navigate to
  `localhost:3004`, drive the toggle, and export a GIF.
- **HITL items to eyeball / tune** (build-verified, but need eyes): ease-curve feel &
  first-mount settle duration; toggle morph strength; moon overscan/limb fringe;
  Pisces placement & scale at mobile width; meteor frequency & star density; horizon
  dome shape + scrim strength; twilight palette stops (`palette.ts`); the header glyph
  flips instantly while the sky takes 2.2 s (intended).
- **Mixed git staging.** The three deleted files are *staged* (`git rm`) while the rest
  of the changes are unstaged — harmless; it all goes in one commit.
- **Moon image license** — confirm the provided `moon.webp` is licensed for use before
  shipping.
- **Lint gotcha (still applies):** this repo's `react-hooks` config errors on
  `setState` called synchronously in a `useEffect` body — do state updates in
  event-handler/listener callbacks, keep effect bodies to DOM/subscription side-effects.

## Recommended next steps
- [ ] Run the S8 visual pass (manual on 3004, or connect the Chrome extension for a GIF).
- [ ] Tune any HITL items flagged above against what you see.
- [ ] Review the `palette.ts` twilight stops on first render with the user.
- [ ] Commit the feature once visually verified.

## Recommended skills
- **`verify`** / **`run`** — drive the dev server for the visual/a11y checks.
- **`frontend-ui-engineering`** — any visual polish from the browser pass.
- **`the-fool`** — pre-mortem the transition timing/interruption edge cases (S8).

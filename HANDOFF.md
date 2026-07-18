# HANDOFF — Win98 Workstation redesign (2026-07-18, session 5 wrap)

> For the next agent session. **Gates 1.2, 2.3 and 4.3 PASSED**
> (owner, 2026-07-18). P3 committed (3.1 `e7a106b` · 3.2 `89670dc` ·
> 3.3 `d816bda`), 4.1 committed (`ad493db`), 4.2 committed
> (`e66cd75`) — full dock/undock/re-dock cycle verified headless, a
> stuck-dock defect found and fixed during QA (see Current Status).
> **Gate 4.3 passed on a served production build of `e66cd75`** —
> owner docked fine, no defects reported. **5.1 committed
> (`95bbf76`)** — Explorer + project windows + IE frame, lazy-chunk
> loading live (`lazyApps.ts` → `register51.ts`, hourglass
> placeholder, verified split in the export). Next: **5.2 / 5.3**,
> then P6 audio / P7 mobile-perf / P8 eggs / 9.1 docs → final gate
> 9.2. New 5.2 hooks already in place: Explorer's `C:\Career` item
> currently deadpans "Disk 2" — replace with the career tree; WordPad/
> Notepad appIds have no loader yet (add them to `lazyApps.ts`).

## Current Status

- Branch **`redesign-attempt2`** (off `main` @ `7969e26`). Ledger since
  session 3: `cafb98c` gate-2.3 defect fixes (owner-verified) ·
  `e7a106b` 3.1 win98State + painter + CRT shader · `89670dc` 3.2 DOM
  shell + pixel icons + OFL fonts · `d816bda` 3.3 boot/shutdown
  sequences · `ad493db` 4.1 choreography + PowerOn entry · `bc1fa45`
  handoff. Earlier ledger (P0–P2, gate-1.2 iterations) is in git log —
  don't re-derive.
- **4.2 committed (this session):** `dockAlignment.ts` (analytic dock
  rect from `CRT_SCREEN_SIZE` + `DOCK_DISTANCE` + fov 50),
  `DockSwap.tsx` (engage/hysteresis rAF watcher, ≤150 ms cross-fade,
  CSS scanline/vignette CRT layer, "keep scrolling" hint),
  `uCurvature` → 0 ease near the dock rest (`CrtScreen.tsx`,
  `CRT_BASE_CURVATURE` export), dev-only `window.__experienceState`
  QA handle. **QA found and fixed a stuck-dock defect:** the original
  mount/fade design relied on a one-shot rAF to flip the fade in and a
  safety timer that unmounted the overlay without releasing the dock —
  a stalled rAF at the engage moment (throttled tab; also any slow
  frame) left `docked=true` + Lenis stopped + no listeners, freezing
  the journey permanently. Now a phase machine
  (`idle → in → shown → out`) with a 100 ms timeout fallback on the
  fade-in; `docked` is released on undock *intent* (entering "out"),
  never by a timer, so no unmount path can strand scroll. Also added
  **keyboard undock** (Choreography's stepping keys + Escape, idle-only,
  ignored when the event target is inside the shell) — keyboard
  visitors previously had no exit. Verified headless: dock at rest 4,
  fade to opacity 1, wheel/key undock, hysteresis (no instant re-dock),
  re-dock, windows-open wheel guard, minimized-window persistence
  across dock cycles, a11y tree exposes real shell buttons while
  docked, zero page errors.
- Architecture contracts now live (all committed):
  - `src/lib/win98State.ts` — ONE store for both renderers (painter +
    DOM shell); version counter feeds `useWin98Version`
    (useSyncExternalStore). Pure, no DOM/three imports.
  - `win98/painter.ts` event-driven only; `crt/CrtScreen.tsx` owns
    canvas→CanvasTexture→CRT shader on the `crtScreen` mesh, writes
    `screenLight` per frame. **Brightness contract (gate 2.3): screen
    luminance cap 0.7 in CrtScreen + `CAST_MAX 2.6` in Lighting —
    preserve both in every future screen change.**
  - Shell (`win98/shell/`) renders in a **640×480 virtual space**
    (`DESKTOP_W/H`); `Window.tsx` drag/resize divides client px by a
    `scale` prop. Taskbar must stay a `<div>` (globals.css hides all
    `<footer>`s while the experience mounts). Apps register content via
    `appDefs.ts` `registerApp(appId, C)`; unregistered → deadpan
    "Insert Disk 2" placeholder. `?scene=shell` is the DOM harness.
  - Boot: `bootScript.ts` (POST lines interpolate `stats.ts` — no
    hardcoded figures) + `bootSequencer.ts` (`startBoot()` → controller
    `{cancel, skip, done}`; per-line work promises are the
    boot-as-loader hook for heavy bakes).
  - 4.1: `choreography/cameraPath.ts` — keyframes with rest points ON
    keys; ch2→3 arc key prevents hair clipping; dock key square-on at
    `DOCK_DISTANCE 0.26`, fov 50. `PowerOn.tsx` (entry gesture, Lenis
    parked till desktop, `w98-intro-seen` localStorage skip),
    `TitleBeats.tsx` (rAF-driven opacity, no React state), keyboard
    stepping + `duskDeepen` in `Choreography.tsx`, dusk damping in
    `Lighting.tsx`.
- Conventions: figure faces **-Z**; desk/screen at negative Z;
  `DESK_TOP_Y` 0.72; `NECK_PIVOT`/`ARM_JOINTS` in buildBody;
  `assets-src/` stays untracked (ADR-012 §3).
- QA: isolated headless agent-browser sessions
  (`--session <name>`) verify without touching the owner's headed tab;
  owner sets angles on request in their session. HMR re-runs useMemo
  (Fast Refresh) — confirm geometry reloads via the
  `[character]/[room] ~N tris` console log. Dev server usually already
  runs on port 3004 — reuse it.

## Unresolved Threads

- **Gate 4.3 PASSED** (owner, 2026-07-18, served production build of
  `e66cd75` — docked fine, no defects flagged). The two review notes
  survive as accepted behavior: single-`scale` Window drag ~5 %
  x error (screen ~5:4 vs desktop 4:3), and keyboard undock can leave
  progress a few thousandths past the rest point (snap settles it).
- Self-noted nits (owner has NOT flagged — mention, don't gold-plate):
  shaft billboard pale edge-on; chair backrest plain boxes; ch2 rest
  framing may want calibration; faint CRT moiré at some distances
  (already softened once: mask contrast 0.92, scanline 0.22).
- `src/lib/aboutMe.ts` (slice 5.2) copy needs owner review at 9.2.
- P5/P8 apps all render through `<Win98Window>` content registry —
  lazy-load each app chunk on first open (ADR-012 §8).

## Key References

- **ADR:** `docs/decisions/ADR-012-win98-workstation-cinematic-redesign.md`
  — ten locked decisions; do not re-litigate. §4 is the dock contract,
  §10 the zero-Microsoft IP rule (fonts are OFL: `public/fonts/LICENSES.md`).
- **Plan:** `docs/plans/implementation-plan-0009.md` — slice specs +
  acceptance. Gates: 1.2 ✅ · 2.3 ✅ · 4.3 open · 9.2 open. AFK gate is
  always lint + build green.
- **Reference assets:** `assets-src/workstation/` (concept sheets,
  tattoo photos — never ship, never commit).
- **Standing rules:** root `CLAUDE.md` / `AGENTS.md` (confidentiality,
  static export, React-compiler purity, port 3004). Agent memory:
  `noise-signal-redesign-state.md`, `owner-motif-privacy.md`,
  `client-name-leak-accepted.md`, `windows-shell-gotchas.md`.

## Recommended Next Steps

- [x] **HITL gate 4.3** — PASSED (owner, 2026-07-18).
- [x] 5.1 Explorer/project windows/IE frame — committed `95bbf76`.
- [ ] 5.2 WordPad resume + C:\Career\ + Add/Remove + ABOUT_ME.txt ·
      5.3 Outlook/dial-up/sign-off (extend `lazyApps.ts` LOADERS with
      each new chunk; pattern established in 5.1).
- [ ] Then P6 audio (6.1 unlock rides the PowerOn press), P7
      mobile/perf, P8 eggs (cuttable), 9.1 docs, 9.2 final gate.

## Recommended Skills

- `agent-browser` — isolated `--session` QA for everything visual; the
  owner's headed session for owner-angle checks (ask before reloads).
- None otherwise (plain implementation; the plan is the spec).
- `/grill-with-docs` — only for a genuine decision gap not covered by
  ADR-012.

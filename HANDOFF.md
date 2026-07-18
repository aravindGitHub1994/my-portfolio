# HANDOFF — Win98 Workstation redesign (2026-07-18, session 4)

> For the next agent session. **Gates 1.2 and 2.3 PASSED** (owner,
> 2026-07-18). P3 is COMMITTED (3.1 `e7a106b`, 3.2 `89670dc`,
> 3.3 `d816bda`) and 4.1 is COMMITTED (`ad493db`, ride-through verified
> headlessly). **Next slice: 4.2 (dock swap — precision slice), then
> HITL gate 4.3 (owner full ride-through on a production build). Do not
> pass gates autonomously.** P5 (apps) can run in parallel now that 3.2
> is in. Read the two Key References before writing anything.

## Current Status

- Branch **`redesign-attempt2`** (off `main` @ `7969e26`). Commit ledger:
  - `9ea8f96` docs (ADR-012 + plan-0009) · `064a225` slice 0.1 (Lens
    deleted, static floor) · `6d31dac` slice 0.2 (experience scaffold,
    `experienceState`, lenis/snap choreography).
  - `cc494e7`→`2d1293f` slice 1.1 + gate-1.2 iterations (procedural
    character; final form: sculpted jaw-wrap beard, two-tone clay, no
    cheek mounds). **Gate 1.2 PASSED** (owner, 2026-07-18).
  - `f25e047` slice 2.1: `builders/` — 14 seeded prop modules +
    canvas-baked `materials.ts` (≤1024², no Microsoft marks — poster/mug/
    CD text is pastiche; CD spines pull resume `EDUCATION`) +
    `RoomScene.tsx` (`?scene=room`; the prop layout constants live there;
    cables are world-anchored to that layout).
  - `6da2bca` slice 2.2: `scene/` — `Lighting.tsx` (CRT key light driven
    per frame from the `screenLight` singleton — the **2.2⇄3.1 contract**),
    `Atmosphere.tsx` (dust + shaft billboards), `postprocessing.tsx`
    (bloom threshold 0.68 + vignette), `sheddable.ts` (SHED_ORDER for
    7.2). RoomScene runs a `ScreenTestPattern` stand-in cycling
    boot-white flicker → desktop teal → BSOD blue → shutdown amber (10 s).
  - `8340430` slice 1.3: palette color zones (skin canvas albedo, tee,
    jeans, sneakers), tattoo vector art on `forearmR` (koi verified red),
    smartwatch, gold hoops, typing rig (`typingState` feeds 6.2).
  - `81c52a2` gate-2.3 prep: `?scene=full` (RoomScene + Figure), chair
    raised to the seated pose.
- Conventions: figure faces **-Z**, desk/screen at negative Z, figure's
  left = -X; desk surface `DESK_TOP_Y` 0.72; head pivots at `NECK_PIVOT`;
  right-arm joints exported as `ARM_JOINTS` (buildBody).
- `assets-src/` stays **untracked deliberately** (tattoo photos never
  enter git or the bundle — ADR-012 §3).
- Owner runs a **headed agent-browser session** on the harness and has
  explicitly offered browser QA — drive verification through it. A reload
  resets their orbit camera; warn them before reloading.

## Unresolved Threads

- **P3 + 4.1 state (all committed, lint+build green each):**
  - `win98State` (src/lib) is the both-renderers store: boot machine
    (off/post/splash/desktop/shutdown), postLines, icons, z-ordered
    windows, focus, Start menu, version counter (useSyncExternalStore
    key). Pure, no DOM/three imports.
  - Painter (`win98/painter.ts`) is EVENT-DRIVEN only; CrtScreen owns
    canvas→CanvasTexture→CRT shader on the `crtScreen` mesh, samples
    average tone per repaint (8×6 downsample) and writes `screenLight`
    per frame **capped at luminance 0.7** (gate-2.3 brightness
    contract; `CAST_MAX 2.6` in Lighting is the second belt — preserve
    both in all future screen work).
  - Shell (`win98/shell/`): 640×480 virtual space; `Window.tsx` drag/
    resize divides client px by `scale` — 4.2 must pass the CRT-quad
    scale the same way. Taskbar is a div (a `<footer>` is hidden by the
    floor-hiding CSS rule — don't regress). Apps register content
    components via `appDefs.ts` registry (`registerApp`); unregistered
    apps show a deadpan "Insert Disk 2" placeholder.
  - Boot: `bootScript.ts` (stats.ts-interpolated POST lines, no
    hardcoded numbers) + `bootSequencer.ts` (`startBoot()` → controller
    with cancel/skip; per-line work promises = boot-as-loader hook).
  - 4.1: `cameraPath.ts` keyframes (rest points ON keyframes; ch2→3 arc
    key prevents hair clip; dock key = square-on, `DOCK_DISTANCE`
    0.26). `PowerOn.tsx` (entry gesture, Lenis parked till desktop,
    localStorage `w98-intro-seen` skip), `TitleBeats.tsx` (rAF opacity,
    no React state), keyboard stepping + `duskDeepen` in Choreography,
    dusk damping refs in Lighting.
- Self-noted nits (owner has NOT flagged these — mention, don't
  gold-plate): shaft billboard reads pale edge-on; chair backrest plain
  boxes; ch2 rest framing may want owner calibration at 4.3; faint CRT
  moiré rings at some distances (scanline×minification, already
  softened once).
- NEXT: slice 4.2 (dock swap: `DockSwap.tsx` + `dockAlignment.ts`,
  matrix3d the 640×480 shell onto the screen quad, painter→DOM
  cross-fade ≤150 ms, Lenis stop while docked, undock on scroll after
  all windows idle — `allWindowsIdle()` exists) → **HITL gate 4.3**.
  P5 apps (5.1/5.2/5.3) unblocked in parallel; 8.x eggs cuttable.
- `src/lib/aboutMe.ts` copy (slice 5.2) needs owner review at gate 9.2.

## Key References

- **ADR:** `docs/decisions/ADR-012-win98-workstation-cinematic-redesign.md`
  — all ten locked decisions; do not re-litigate.
- **Plan:** `docs/plans/implementation-plan-0009.md` — 24 slices, HITL
  gates 1.2 ✅ / 2.3 (in progress) / 4.3 / 9.2. AFK gate is always lint +
  build green.
- **Owner QA screenshots** (untracked — never commit assets-src):
  `assets-src/workstation/QA.png` (flicker blow-out, fingers),
  `QA-chest-reshape.png` (red line = target torso profile),
  `QA-beard-moustache-gap.png` (red circle = mustache/beard gap).
- **Reference assets:** `assets-src/workstation/` (3 concept sheets —
  their "model stats" panels are fictional; `tattoo01–04.jpg` — never
  ship; `prompt-redesign.txt`).
- **Standing rules:** root `CLAUDE.md` / `AGENTS.md` (confidentiality,
  static export, React-compiler purity, port 3004). Agent memory:
  `noise-signal-redesign-state.md`, `owner-motif-privacy.md`,
  `client-name-leak-accepted.md`, `windows-shell-gotchas.md`.

## Recommended Next Steps

- [ ] Slice 4.2: dock swap (DockSwap.tsx + dockAlignment.ts; ≤1 px
      alignment at 1×/1.5×/2× DPR, painter→DOM fade ≤150 ms, scroll
      contract via Lenis stop/start + `allWindowsIdle()` hint).
- [ ] **HITL gate 4.3:** owner full ride-through on a served
      production build. Do not pass autonomously.
- [ ] P5 (5.1 Explorer/projects/IE, 5.2 resume/career/skills/about,
      5.3 Outlook/dial-up/sign-off) — register via `registerApp`,
      lazy chunks.
- [ ] Then P6 audio, P7 mobile/perf, P8 eggs (cuttable), 9.1 docs,
      9.2 final gate.

## Recommended Skills

- `agent-browser` — owner keeps a headed session open and has offered it;
  use it for all visual verification.
- None otherwise (plain implementation; the plan is the spec).
- `/grill-with-docs` — only for a genuine decision gap not covered by
  ADR-012 (expected: none before P4).

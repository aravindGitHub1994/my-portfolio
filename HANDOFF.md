# HANDOFF — Win98 Workstation redesign (2026-07-28, session 13 wrap)

> For the next agent session. **Every gate is PASSED (owner): 1.2, 2.3,
> 4.3 and — this session — 9.2.** Every build slice is complete (P3–P8,
> 9.1 docs). **`redesign-attempt2` is merged to `main`.**
>
> Gate 9.2 came back PASS WITH FIXES; the two blocking items were closed
> this session and the owner re-QA'd and authorized the merge. The full
> record, including what was *not* verifiable headless, is in
> `docs/qa/9.2-desktop-checklist.md` §17.
>
> **The plan is done. What is left is the open-threads list below — none
> of it is blocking, all of it needs owner senses or an owner call.**

## 9.2 fixes (closed this session)

- **The dock could be scrolled past.** Proximity-only engagement
  (`|progress − rest| < 0.004`, ~25 px of a 5040 px runway, sampled per
  rAF) was jumped over by any wheel flick. Now it also tests for
  *crossing* the rest point either way, band widened to 0.012 / re-arm
  0.05, and on latch Lenis glides to the exact square-on pose (0.3 s,
  `force: true` — Lenis' raf advances even while stopped) before the
  cross-fade. `DOCK_REST_INDEX` in `chapters.ts` now names that rest
  point for the three modules that measure against it.
- **Chapter 4 is no longer a Lenis snap point** (`Choreography.tsx`).
  The snap and the dock were competing for one landing; the dock owns it
  now. **Do not put it back** without removing the dock's own latch.
- **Momentum was ejecting the dock.** The subtler half: with the above
  fixed the dock latched correctly and the *tail of the same flick*
  undocked it ~1.7 s later, which reads exactly like "docking was
  skipped". Undock now requires the 800 ms grace **and** a 350 ms pause
  in scrolling; `e.repeat` keydowns are ignored. Reproduced and confirmed
  before and after — see §17 of the checklist.
- **Scroll cue** (`workstation/ScrollHint.tsx`) — the static floor's own
  cue markup from `acts/Hero.tsx`, shown wherever the journey has stood
  still. **Untested claim to re-check:** the 350 ms pause threshold has
  only ~6× margin over real momentum gaps, and headless renders this
  scene at 2–6 fps, so it was confirmed on owner hardware, not by an
  agent.
- **`DockHint.tsx`** — the docked desktop's "Getting Started" dialog.
  DOM-only and outside `win98State` on purpose: it exists only in the
  docked view, so it never reaches the painter and §4 parity is intact.
  Same precedent as the "keep scrolling" hint.

## Current Status

- Branch **`redesign-attempt2`** (off `main` @ `7969e26`). Ledger:
  P0–P2 + gate-1.2/2.3 iterations in git log (don't re-derive) ·
  P3 `e7a106b`/`89670dc`/`d816bda` · 4.1 `ad493db` · 4.2 `e66cd75` ·
  **gate 4.3 PASSED** on a served production build of `e66cd75` ·
  5.1 `95bbf76` · 5.2 `493d4ea` · 5.3 `2f22f6e` · 6.1 `2cb71f8` ·
  6.2 `8aed018` · 7.1a `f7aead3` · 7.1b `0085af6` · 7.2a `a126b9f` ·
  7.2b `e7ae176` · **8.1 `13086ab`** · **8.2 `3cec489`** · **9.1 `bbf85c7`**.
- Per-slice reasoning lives in the commit messages; they are long on
  purpose. What follows is only what a future session would otherwise
  get wrong.

## P8 (closed this session)

- **8.1 `13086ab` — Recycle Bin + BSOD.** The bin holds the redesigns
  this repo really shipped and replaced (`lens.exe`, `glass_cube.scn`,
  `noise_signal.tmp`); the list is honest, which is why the joke works.
  Restore is always refused.
  - **BSOD is a boot PHASE, not an overlay.** `"bsod"` is in `BootPhase`
    but deliberately **not** in `BOOT_ORDER` — `nextBootPhase` therefore
    refuses to walk into or out of it, exactly as with `"shutdown"`. The
    phase choice pays for itself three times: the painter gets a case and
    cinematic parity is free; `CrtScreen` already downsamples whatever is
    painted, so the crash cools the room light with no lighting hook and
    the gate-2.3 cap still governs; and the open windows are simply left
    in the store, so `rebootFromCrash` lands on the exact desktop the
    visitor crashed — which is what the screen claims.
  - Copy is in `src/lib/bsodScript.ts` because **both** renderers draw
    it. A gag that reads differently docked vs. undocked is the drift the
    ADR-012 §4 parity rule exists to prevent.
  - **Both triggers warn first and crash on the repeat** (empty the bin;
    open `System32` after being asked not to). One-click crashing would
    fire on a stray double-click, and the warning line is half the joke.
  - Recovery is over-served on purpose: window-level `keydown` (any key)
    **and** `pointerdown`, because touch has no key to press.
  - `playEggStinger` fires on **recovery, never the crash** — it is a
    bright ascending bell, a reward figure; on the way in it would read
    as celebrating the visitor's misfortune.
- **8.2 `3cec489` — Minesweeper.** Rules live in pure
  `src/lib/minesweeper.ts`; the component holds none.
  - **Two era details that look like bugs:** first-click safety excludes
    **only the clicked cell** (clearing its neighbours too is a later
    convention and gives away more of the board); and **winning needs no
    flags**, so a won board can still show a hidden square and a non-zero
    counter — the counter tracks the visitor's reckoning, not the truth.
  - Board is **9×9 with 16 mines per plan §8.2**. The era's beginner
    board is **ten**. 16 is a materially harder game (20 % density);
    `MINE_COUNT` is one constant. **Raise this at 9.2** — it is a
    playability call, not an implementation one.
  - The grid is **one tab stop**; 81 tabbable cells would bury the rest
    of the shell for a keyboard visitor.
  - Touch: 30-unit cells and long-press to flag; press/release are
    tracked so a long press that already flagged does not also reveal.

## 9.1 (closed this session, `bbf85c7`)

- CLAUDE.md / AGENTS.md / README rewritten around ADR-012. The
  **confidentiality block in CLAUDE.md is verbatim and untouched.**
- `docs/design-system.md` restructured around **two token sets kept
  deliberately separate** — Electric Dark (the site's own UI) and the
  Win98 chrome (a *diegetic effect* palette). It now carries the full
  **nine-rung ladder table** the plan asked for, the chapter table, the
  dock and brightness contracts, and the two period faces.
- ADR-005…011 each gained a **superseded pointer naming what
  specifically survives** in that ADR. **Files not renamed, content not
  rewritten** — they are immutable records.
- Note for future doc edits: the painter mirrors the Win98 CSS tokens as
  canvas constants. **Change one, change both**, or the renderers drift.

## Verification patterns worth reusing

- **Pure-module + simulation** (used for `fidelity.ts` in 7.2 and
  `minesweeper.ts` here): compile the module standalone with `npx tsc`
  to a scratch dir and play thousands of cases in node. It caught
  nothing this time *because* the rules were written against it — which
  is the point. Far stronger than clicking squares.
- **When a state is unreachable by scripted clicks, drive a solver.**
  Minesweeper's win could not be reached by random clicking, so a
  constraint solver was run through the real DOM (deduce, guess when
  stuck, reset on loss) until it won legitimately on game 27 —
  exercising reveal, flood, right-click flagging, reset and the win
  presentation end to end.
- **React updates are NOT synchronous here.** A programmatic `.click()`
  does not flush before the next statement, so multi-step DOM assertions
  in one `eval` silently read stale state. Either wait between steps, or
  run the whole interaction as an in-page async IIFE that writes its
  result to `window.__something` and poll it.

## Unresolved Threads — all of these are 9.2 material

- **P6 audio has never been heard by a human.** Verified structurally
  only. Levels, `MIN_CLACK_GAP_S`, and the leak falloff are the obvious
  owner-adjustment candidates.
- **The mobile shell has never run on a real phone**, only headless
  Chromium at 360×640 / 390×844. Untested by construction: real
  touch-drag on swipe-to-close, iOS Safari's dynamic viewport, the
  LinkedIn in-app webview.
- **The ladder has never been paced by a human.** A device pinned at
  20 fps walks all nine rungs in ~64 s. `GRACE_FRAMES` and `EMA_ALPHA`
  are the knobs, both documented in-file.
- **The low tier optimizes the wrong axis** — triangles drop 77 %, but
  textures/geometries/texture bytes are identical (bakes aren't
  detail-dependent). On a phone texture upload is often the tighter
  constraint. Halving bake sizes changes how the room *looks*, so it is
  an owner call.
- **Minesweeper mine count** (16 vs. the era's 10), per above.
- `src/lib/aboutMe.ts` copy — owner review (draft is interview-approved
  facts only; motif stays subtext per memory).
- **7.1 items deliberately not done** (app-internal, not shell):
  Explorer/tree panes collapsing to stacked lists, touch scrub through
  Lenis, app-internal type still at the desktop's 9px. Doing these blind
  would be guessing at content never seen on a phone — bundle with 9.2.
- Accepted behaviors (documented, don't "fix" without owner ask):
  single-`scale` Window drag ~5 % x error; keyboard undock can leave
  progress a few thousandths past the rest point (snap settles it).
- Self-noted nits (owner has NOT flagged — mention, don't gold-plate):
  shaft billboard pale edge-on; chair backrest plain boxes; ch2 rest
  framing may want calibration; faint CRT moiré at some distances.
- Committer identity auto-resolves to the owner's work email; owner has
  been told twice and not acted — **leave it**, keep it consistent with
  the rest of the branch rather than amending.

## Architecture contracts (all committed, all still binding)

- `src/lib/win98State.ts` — ONE store for both renderers; version
  counter feeds `useWin98Version`. Pure, no DOM/three imports.
- `win98/painter.ts` event-driven only; `crt/CrtScreen.tsx` owns
  canvas→CanvasTexture→CRT shader, writes `screenLight` per frame.
  **Brightness contract (gate 2.3): luminance cap 0.7 in CrtScreen +
  `CAST_MAX 2.6` in Lighting — preserve in every screen change.**
- Shell renders in **640×480 virtual space** (`DESKTOP_W/H`);
  `Window.tsx` divides client px by a `scale` prop. Taskbar must stay a
  `<div>`. `?scene=shell` is the DOM harness; `?scene=full` etc. are
  orbit harnesses — **no choreography by design** (owner asked once).
- Boot: `bootScript.ts` (POST interpolates `stats.ts`) +
  `bootSequencer.ts`. Crash: `bsodScript.ts` + `crashWorkstation()` /
  `rebootFromCrash()`.
- Journey: `choreography/cameraPath.ts` keyframes (dock square-on at
  `DOCK_DISTANCE 0.26`, fov 50 — `dockAlignment.ts` must match);
  **`HEAD_FOCUS` is the single head point the ch. 2 shot and the 6.2
  leak both measure against**; `DockSwap.tsx` phase machine — **`docked`
  is released on undock intent, never by a timer**; dev-only
  `window.__experienceState` and `window.__fidelity` QA handles.
- Lazy apps: `lazyApps.ts` → `registerNN.ts` chunks. Every chunk has
  been verified split out of the initial bundle in `out/`.
- Conventions: figure faces **-Z**; `DESK_TOP_Y` 0.72; `assets-src/`
  stays untracked (ADR-012 §3).

## QA gotchas (accumulated — all still true)

- Floor-page DOM coexists under the shell: **scope selectors to the
  window `section[aria-label=...]`** (bare `find text` collides).
- Direct `click <ref>` on in-window controls can hang on actionability;
  eval-driven clicks are the reliable path, then wait ~400 ms.
- **On touch, a single tap opens an icon** (`Icon.tsx`) — dispatching
  only `dblclick` does nothing there.
- `agent-browser` viewport is `set viewport <w> <h>`, not `viewport`.
- In `agent-browser eval`, PowerShell strips inner double quotes from
  native-exe args — write JS with **single** quotes, or use a bash
  heredoc into a variable.
- Quote refs as `'@e1'` in PowerShell; commit via `-F <file>` written by
  the Write tool (PS `Out-File` adds a BOM).
- The full journey needs the power button *clicked* and ~15 s of boot
  before PageDown stepping moves progress.

## Key References

- **ADR:** `docs/decisions/ADR-012-win98-workstation-cinematic-redesign.md`
  — ten locked decisions; do not re-litigate.
- **Plan:** `docs/plans/implementation-plan-0009.md` — gates 1.2 ✅ ·
  2.3 ✅ · 4.3 ✅ · **9.2 open**. AFK gate is always lint + build green.
- **Standing rules:** root `CLAUDE.md` / `AGENTS.md` (now Workstation-
  accurate). Agent memory: `noise-signal-redesign-state.md`,
  `owner-motif-privacy.md`, `client-name-leak-accepted.md`,
  `windows-shell-gotchas.md`.

## Recommended Next Steps

- [x] ~~**P8 eggs**~~ — done (`13086ab` + `3cec489`).
- [x] ~~**9.1 docs reconcile**~~ — done (`bbf85c7`).
- [x] ~~**HITL gate 9.2**~~ — PASSED by the owner this session after the
      two blocking fixes; `redesign-attempt2` merged to `main`.
- [ ] **Nothing is blocking.** Next work comes off "Unresolved Threads"
      above; the three that most need human senses are still **audio**,
      **a real phone**, and **ladder pacing**. The owner's §15 ask —
      open on the tower's power button with the figure's arm pressing it,
      then move to the desktop — was explicitly deferred out of 9.2 and
      is the largest outstanding piece of work.

## Recommended Skills

- `agent-browser` — isolated `--session` QA for anything visual, and the
  only practical way to exercise the mobile viewports; the owner's
  headed session only for owner-angle checks (ask before reloads).
- None otherwise (the plan is the spec).

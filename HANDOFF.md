# HANDOFF — `scene-refinement` (2026-07-28, session 14 wrap)

> For the next agent session. **ADR-012's plan is finished and merged.**
> `redesign-attempt2` → `main` @ `dac6de4`; every gate (1.2, 2.3, 4.3, 9.2)
> is owner-PASSED. The 9.2 record is `docs/qa/9.2-desktop-checklist.md`.
>
> **This session opened a new branch and did design work only.** No slice
> is complete. See "Current Status" for the one thing that will bite you
> in the first thirty seconds.

## Current Status

- Branch **`scene-refinement`**, cut from `main` @ `dac6de4`. Working tree
  is dirty and **the branch does not compile**.
- Produced this session, both committed to disk, neither committed to git:
  - `docs/decisions/ADR-013-scene-refinement-rigged-arms-and-the-power-press-opening.md`
  - `docs/plans/implementation-plan-0010.md`
- **Slice 1.1 is half-written and broken.** `character/buildBody.ts` has
  been converted to the two-bone pivot hierarchy, but:
  - it references an **`ORIGIN` constant that was never defined** — add
    `const ORIGIN = new Vector3(0, 0, 0)` near `UP`;
  - `character/buildWardrobe.ts` still derives the smartwatch from
    `ARM_JOINTS` in body space and has **not** been reparented onto
    `elbowPivotL`, so the watch will float where the forearm used to be;
  - `character/Figure.tsx` has not been updated to parent the wardrobe
    into the left elbow pivot.
  Finish those three or `git checkout -- src/components/workstation/character/`
  and restart 1.1 clean. Either is fine; do not leave it half-done.
- **The breakdown in plan-0010 has not been approved by the owner.** It was
  presented at the end of this session and the reply had not landed. Confirm
  before building past 1.1.

## What this branch is for

The owner's gate-9.2 §15 answer — deferred out of that gate and named in
the previous handoff as "the largest outstanding piece of work" — plus six
requests raised alongside it. All of it is specified in **ADR-013**; the
slice breakdown, acceptance criteria and dependency graph are in
**plan-0010**. Not repeated here.

The one structural fact worth carrying in your head: **three of the seven
requests are one missing capability.** `buildBody.ts` bakes the typing pose
into static capsule geometry — `capsuleBetween` derives length, orientation
and midpoint from two joint coordinates and returns a finished `Mesh`. There
is no shoulder pivot and no elbow pivot. Pressing the power button, using the
mouse and lifting the mug all need the same rig, which is why P1 gates
everything and why the acceptance criterion for 1.1 is *visually identical
to `main`*.

## Decisions already made — do not re-litigate

Resolved with the owner this session (ADR-013 records the reasoning):

- **The face is revealed by lighting, not geometry.** `buildHead.ts` has no
  eyes and no mouth by design (ADR-012 §2; gate 1.2 cut cheek mounds because
  they "read as eyeballs"). Chapter 2 orbits to a three-quarter rim-lit angle
  with the eye zone in shadow. **No head geometry is added.**
- **The mug is lifted and sipped**, not merely touched — the owner chose the
  more expensive option knowingly. That is what forces the prop-handle
  singleton across the `RoomScene` → `Figure` boundary.
- **The opening frame is a macro on the tower's power button with no person
  in it.** The forearm enters on click. Chapter 2 keeps its reveal.
- **All 29 photographs ship** — cats, rides/hikes, workspace, guitar, and the
  two existing portraits.
- **The entry gesture stays a DOM button**, pinned over the projected 3D
  button. `unlockAudio()` must run synchronously in a real user gesture, and
  the canvas is `fixed inset-0 -z-10` so clicks never reach it.

## Unresolved Threads

**New, from this branch:**

- Plan-0010's breakdown awaits owner approval (above).
- Two HITL gates should be pulled forward because they are cheap and they
  gate expensive work: **1.3** (one look at the rig before four behaviours
  are built on it) and **6.2** (the 29 photos, before they enter `public/`).
- **The dock is this branch's biggest regression risk.** Giving chapter 0
  scroll span moves `RUNWAY_LENGTH_VH` 660 → 750, which changes what
  `DockSwap`'s `ENGAGE_EPS` of 0.012 means in pixels — and the dock is
  precisely what the owner signed off in session 13. Slice 8.1 re-runs
  checklist §4/§17a in full.
- Steam adds a **tenth rung** to the fidelity ladder, pushing the
  static-floor offer from ~64 s to roughly ~69 s at a pinned 20 fps. Slice
  4.3 measures the real number. Folding steam into the existing `dust` flag
  was considered and rejected — `dust` sheds at rung 2.

**Carried forward from 9.2, still open, none blocking:**

- **P6 audio has never been heard by a human.** Levels, `MIN_CLACK_GAP_S`,
  leak falloff are the owner-adjustment candidates.
- **The mobile shell has never run on a real phone** — only headless
  Chromium at 360×640 / 390×844. Untested by construction: real touch-drag
  swipe-to-close, iOS Safari dynamic viewport, the LinkedIn in-app webview.
- **The ladder has never been paced by a human** (`GRACE_FRAMES`,
  `EMA_ALPHA`). This branch makes the question sharper, not softer.
- **The low tier optimizes the wrong axis** — triangles −77 %, but textures /
  geometries / texture bytes identical, because the bakes aren't
  detail-dependent. Owner call; halving bake sizes changes how the room looks.
- `src/lib/aboutMe.ts` copy — owner review.
- **7.1 items deliberately not done** (app-internal, not shell): Explorer/tree
  panes → stacked lists, touch scrub through Lenis, app-internal 9 px type.
- Minesweeper mine count — **owner answered at 9.2: keep 16.** Closed.
- Accepted behaviours, don't "fix" without an ask: single-`scale` Window drag
  ~5 % x error; keyboard undock can leave progress a few thousandths past the
  rest point.
- Self-noted nits the owner has *not* flagged — mention, don't gold-plate:
  shaft billboard pale edge-on; chair backrest plain boxes; faint CRT moiré.
  (Chapter-2 rest framing is no longer a nit — slice 3.1 recomposes it.)
- Committer identity resolves to the owner's work email. Told twice, not
  acted on — **leave it.**

## Architecture contracts (all still binding)

Unchanged from session 13 except where ADR-013 amends them.

- `src/lib/win98State.ts` — ONE store, both renderers; pure, no DOM/three.
- `win98/painter.ts` **event-driven only**; `crt/CrtScreen.tsx` owns
  canvas→CanvasTexture→CRT shader. **Brightness contract (gate 2.3):
  luminance cap 0.7 + `CAST_MAX 2.6` in `Lighting` — preserve in every
  screen change.**
- Shell renders in **640×480 virtual space**; `Window.tsx` divides client px
  by `scale`. Taskbar stays a `<div>`.
- `?scene=shell` is the DOM harness; `?scene=full|room|character` are orbit
  harnesses with **no choreography by design** (owner asked once).
- Journey: `choreography/` is the sole owner of scroll; frame loops read
  mutable module state, never React state. `HEAD_FOCUS` is the single head
  point the ch-2 shot and the 6.2 earbud leak both measure against.
  `DockSwap`'s `docked` is released on undock intent, **never by a timer**.
  Chapter 4 is **not** a Lenis snap point — do not put it back.
- Lazy apps: `lazyApps.ts` → `registerNN.ts` chunks, each **verified split
  out of the initial bundle in `out/`**. The Gallery must clear the same bar.
- Conventions: figure faces **-Z**; `DESK_TOP_Y` 0.72; tower power button at
  world `(-0.05, 0.777, -0.518)`; `assets-src/` stays untracked and unshipped.
- The painter mirrors the Win98 CSS tokens as canvas constants. **Change one,
  change both.**

## Verification patterns worth reusing

- **Pure-module + simulation** (`fidelity.ts`, `minesweeper.ts`): compile
  standalone with `npx tsc` to a scratch dir, play thousands of cases in node.
  `armPose.ts` is the next natural candidate — it is pure maths over
  quaternions and should not need a GPU to prove.
- **When a state is unreachable by scripted clicks, drive a solver** (a
  constraint solver won Minesweeper on game 27 through the real DOM).
- **React updates are NOT synchronous here.** A programmatic `.click()` does
  not flush before the next statement. Wait between steps, or run the whole
  interaction as an in-page async IIFE writing to `window.__something`.
- **Headless renders this scene at 2–6 fps on software GL.** It cannot
  produce input at a real 60 fps cadence, so anything timing-sensitive —
  the dock's 350 ms pause, the behaviour scheduler's pacing, the tail wag's
  "is it slow enough" — is owner-verified only. Say so rather than claiming it.

## QA gotchas (accumulated, all still true)

- Floor-page DOM coexists under the shell: **scope selectors to the window
  `section[aria-label=...]`** — bare `find text` collides.
- Direct `click <ref>` on in-window controls can hang on actionability;
  eval-driven clicks then a ~400 ms wait is the reliable path.
- **On touch a single tap opens an icon** (`Icon.tsx`) — dispatching only
  `dblclick` does nothing there.
- `agent-browser` viewport is `set viewport <w> <h>`, not `viewport`.
- In `agent-browser eval`, PowerShell strips inner double quotes from
  native-exe args — write JS with **single** quotes, or heredoc via bash.
- Quote refs as `'@e1'` in PowerShell; commit via `-F <file>` written by the
  Write tool (PS `Out-File` adds a BOM).
- The full journey needs the power button *clicked* and ~15 s of boot before
  stepping moves progress. **This changes in slice 2.3** — update the QA
  scripts when it does.
- Reset before any first-run test: `w98-intro-seen`, `w98-muted`,
  `w98-fidelity-floor`.

## Key References

- **ADRs:** `docs/decisions/ADR-013-…md` (this branch — ten decisions, made
  with the owner, don't re-litigate) · `ADR-012-…md` (the experience layer;
  ADR-013 amends only its §5 chapter table and §2 rig).
- **Plan:** `docs/plans/implementation-plan-0010.md` — 25 slices, dependency
  graph, per-slice acceptance criteria, risk table. AFK gate is always lint +
  build green.
- **Prior gate record:** `docs/qa/9.2-desktop-checklist.md`, especially §17
  (session-13 fixes) and §17d (what an agent could not verify).
- **Standing rules:** root `CLAUDE.md` / `AGENTS.md`. Agent memory:
  `noise-signal-redesign-state.md`, `owner-motif-privacy.md`,
  `client-name-leak-accepted.md`, `windows-shell-gotchas.md`.

## Recommended Next Steps

- [ ] **Fix or revert the broken 1.1 edit** (`ORIGIN` undefined,
      `buildWardrobe`/`Figure` not reparented). Nothing else can be verified
      until `npm run lint` and `npm run build` are green again.
- [ ] **Confirm the plan-0010 breakdown with the owner** before building past
      1.1.
- [ ] Finish **1.1**, then hold at **gate 1.3** — one owner look at the rig
      before four behaviours are built on top of it.
- [ ] In parallel, land **P7** (scroll cue contrast) and **P6.1** (picture
      pipeline). Both are independent of the rig and P6.1 unblocks the other
      cheap owner gate.
- [ ] Commit ADR-013 and plan-0010 — they are on disk but not in git.

## Recommended Skills

- `test-driven-development` or the pure-module + `npx tsc` simulation pattern
  for `armPose.ts` — the pose maths is the part most worth proving offline,
  and the part a browser proves worst.
- `agent-browser` — isolated `--session` QA for anything visual. The owner's
  headed session only for owner-angle checks; ask before reloads.
- `documentation-and-adrs` at close-out for slice 8.2.

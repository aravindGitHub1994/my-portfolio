# HANDOFF — `scene-refinement` (2026-07-28, session 15 wrap)

> For the next agent session. **ADR-012's plan is finished and merged.**
> `redesign-attempt2` → `main` @ `dac6de4`; every gate (1.2, 2.3, 4.3, 9.2)
> is owner-PASSED. The 9.2 record is `docs/qa/9.2-desktop-checklist.md`.
>
> **The branch compiles and two slices are landed.** Unlike the last
> handoff, there is nothing broken on disk waiting to bite you.

## Current Status

- Branch **`scene-refinement`**, cut from `main` @ `dac6de4`. Working tree
  clean apart from untracked `assets-src/` (which stays untracked).
- **Plan-0010's breakdown is APPROVED by the owner as written** (session 15).
  Build to it — dependency graph, slice boundaries, acceptance criteria as
  committed. This unblocks everything past 1.1.
- Commits on the branch, newest first:
  - `7f1722c` — **P7 complete** (7.1 scroll-cue contrast + 7.2 QA-record fix)
  - `0784e3d` — **slice 1.1 complete** (two-bone arm rig)
  - `28410fc` — ADR-013 + plan-0010
- The previous handoff said ADR-013 and plan-0010 were "on disk but not in
  git." That was **wrong** — they were already committed at `28410fc`. Don't
  go looking for uncommitted docs.
- A dev server may still be running on **3004** from session 15; it was left
  up deliberately for the owner to look at the cue. `EADDRINUSE` → use theirs.

### What 1.1 actually did

`buildBody.ts` now emits, per side: `shoulderPivot{R,L}` (at
`ARM_JOINTS.shoulder`) → upper-arm capsule → `elbowPivot{R,L}` → forearm +
`hand{R,L}`. Bone lengths are fixed from `ARM_JOINTS` and never change; only
the two pivots' rotations will animate, so no IK solver and no per-frame
geometry rebuild. Geometry is authored in **pivot-local space**, which is what
makes the rest pose byte-identical.

`buildWardrobe.ts` returns **elbow-local** geometry (it no longer derives world
coordinates from `ARM_JOINTS`) and `Figure.tsx` parents it onto `elbowPivotL`,
so the watch rides the forearm. A missing pivot **throws** rather than falling
back to `root` — body-space placement is only correct at rest, and
`ExperienceBoundary` converts the throw into the static floor plus a named
console error, so the failure is loud instead of silently-correct-at-rest.

`typing.ts` and `idle.ts` needed **no change**: every write they make
(`fingers[i].position.y`, `hands[i].position.y`, `chest.rotation.x`) is
local-space, so reparenting is transparent to them.

### What P7 actually did

Gating logic in `ScrollHint.tsx` is **byte-for-byte unchanged** — it was never
wrong, the cue was merely invisible. Only the three cosmetic causes moved:
own scrim + rail at 48 % (was `--color-line`'s 12 %) + `--color-ink` with a
shadow + `--color-accent-bright` pulse; its own `scroll-cue-journey` keyframes
(linear, parked 20 % of cycle instead of the floor's ~40 %); and a **linear**
fade that reaches full in `FADE_MS` instead of an exponential that asymptotes.
`acts/Hero.tsx` and `@keyframes scroll-cue` are deliberately untouched — the
floor works fine against its own flat `--color-bg`.

## What this branch is for

The owner's gate-9.2 §15 answer plus six requests raised alongside it. All of
it is specified in **ADR-013**; the slice breakdown, acceptance criteria and
dependency graph are in **plan-0010**. Not repeated here.

The structural fact worth carrying: **three of the seven requests are one
missing capability** — the arm rig. That is why P1 gates everything. **P1 is
now half-done:** 1.1 (the rig) is in; 1.2 (the driver that moves it) is not.

## Decisions already made — do not re-litigate

Resolved with the owner (ADR-013 records the reasoning):

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
- **Plan-0010's 25-slice breakdown** — approved as written, session 15.

## Unresolved Threads

**Awaiting the owner, asked and not yet answered:**

- **Start 1.2, or take gate 1.3 first?** The question was put at the end of
  session 15 and the reply had not landed. 1.2 is AFK and provable offline, so
  starting it is low-risk; but 1.3 exists precisely to catch "does the arm bend
  like an arm" *before* four behaviours are built on the rig.
- **The scroll cue now overlaps the SignOff card.** Newly *exposed* by P7, not
  caused by it: at p ≈ 0.94 the "Scroll" label sits ~30 px below the contact
  links and competes with them. The cue has always run to `END_P` (0.995) and
  SignOff has always started at `REST_POINTS[4]`; the overlap was invisible
  before because the cue was. Closing it means moving the gate, which ADR-013
  §10 explicitly puts out of scope for a contrast pass. Options recorded in
  checklist §17b: drop `END_P` below SignOff's start, or add a SignOff term to
  `wanted`. **Owner's call — do not just fix it.**

**New, from this branch:**

- **Gate 1.3 and gate 6.2 should still be pulled forward** — both are cheap and
  both gate expensive work.
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
  *(Note: "7.1" here means plan-0009's 7.1, not plan-0010's.)*
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
- **The arm rig (new, ADR-013 §1):** geometry under the pivots is authored in
  pivot-local space and bone lengths are fixed at build time. `armPose.ts`
  (1.2) must move the figure by **rotating the four pivots only** — never by
  rebuilding geometry and never by writing world positions.
- Lazy apps: `lazyApps.ts` → `registerNN.ts` chunks, each **verified split
  out of the initial bundle in `out/`**. The Gallery must clear the same bar.
- Conventions: figure faces **-Z**; `DESK_TOP_Y` 0.72; tower power button at
  world `(-0.05, 0.777, -0.518)`; `assets-src/` stays untracked and unshipped.
- The painter mirrors the Win98 CSS tokens as canvas constants. **Change one,
  change both.**
- **The static floor's cue is a separate instance** (`acts/Hero.tsx`,
  `@keyframes scroll-cue`, `--color-line`/`--color-ink-subtle`/`--color-accent`).
  The journey's values live in the journey cue block in `globals.css`. Retune
  one, leave the other alone — they face very different backdrops.

## Verification patterns worth reusing

- **Pure-module + simulation** (`fidelity.ts`, `minesweeper.ts`): compile
  standalone with `npx tsc` to a scratch dir, play thousands of cases in node.
  **`armPose.ts` is the next natural candidate** — pure maths over quaternions,
  and the part a browser proves worst.
- **Headless geometry diffing — new in session 15, and how 1.1's "visually
  identical to `main`" criterion was actually met.** The builders are pure, so
  both versions can be assembled in node and compared *numerically* instead of
  by screenshot. Result: 5121/5121 vertices identical at detail high,
  2267/2267 at low, zero moved at 1e-6 precision, triangle counts identical.
  The recipe, because the setup has three Windows/ESM traps:
  1. Put the scratch project **inside the repo** (e.g. `.rigcheck/`, deleted
     after) — node resolves `three` from the importing file's location, so an
     outside-the-repo scratch dir cannot find `node_modules`.
  2. `git show main:<path> > old/…` beside a copy of the current file; rewrite
     the relative import to `"./buildBody.js"` (node ESM needs the extension;
     tsc accepts `.js` pointing at `.ts`).
  3. tsconfig `module: ESNext`, `moduleResolution: bundler`; then write
     `{"type":"module"}` into the outDir, since the repo's package.json is
     CommonJS.
  Compare by transforming every mesh's vertices through `matrixWorld` and
  sorting the resulting strings — that survives the traversal-order change a
  reparent causes. Also assert the *rig works*: rotate a pivot and check the
  hand and watch actually move with it.
- **When a state is unreachable by scripted clicks, drive a solver** (a
  constraint solver won Minesweeper on game 27 through the real DOM).
- **React updates are NOT synchronous here.** A programmatic `.click()` does
  not flush before the next statement. Wait between steps, or run the whole
  interaction as an in-page async IIFE writing to `window.__something`.
- **Headless renders this scene at 2–6 fps on software GL.** It cannot
  produce input at a real 60 fps cadence, so anything timing-sensitive —
  the dock's 350 ms pause, the behaviour scheduler's pacing, the tail wag's
  "is it slow enough" — is owner-verified only. Say so rather than claiming it.
  **Static appearance, however, is fair game** — contrast and legibility
  screenshots are valid at 2 fps, which is how P7 was verified.

## QA gotchas (accumulated, all still true)

- Floor-page DOM coexists under the shell: **scope selectors to the window
  `section[aria-label=...]`** — bare `find text` collides. The floor is
  `display:none` but still in the accessibility tree, so `snapshot -i` shows
  floor links and **not** the experience — that is not evidence the experience
  failed to mount. Check `document.documentElement.dataset.experience` instead.
- Direct `click <ref>` on in-window controls can hang on actionability;
  eval-driven clicks then a ~400 ms wait is the reliable path.
- **On touch a single tap opens an icon** (`Icon.tsx`) — dispatching only
  `dblclick` does nothing there.
- `agent-browser` viewport is `set viewport <w> <h>`, not `viewport`.
- In `agent-browser eval`, PowerShell strips inner double quotes from
  native-exe args — write JS with **single** quotes, or heredoc via bash.
- Quote refs as `'@e1'` in PowerShell; commit via `-F <file>` written by the
  Write tool (PS `Out-File` adds a BOM).
- **The daemon is usually already running.** `node dist/daemon.js` returning
  `EADDRINUSE` on 127.0.0.1:50838 means it is up, not broken.
- **`open` on this page can exceed 3 minutes on a cold session** and will blow
  a foreground tool timeout. Launch every agent-browser call with
  `run_in_background` and gate on an `EXIT=` sentinel; opening `about:blank`
  first warms the session and makes the real open fast.
- Useful state without any UI driving: `window.__experienceState` exposes
  `scrollProgress`, `chapterIndex`, `docked`, `duskDeepen`, `runwayStart`,
  `runwaySpan`, `fidelityTier`, `perf`.
- **`window.scrollTo(0, y)` moves the journey** — Lenis picks it up, so you can
  jump to any chapter instead of wheeling there. At 1440×900 the runway is
  5040 px, so `p ≈ y / 5040`. **Jumping past chapter 4 engages the dock**
  (`docked: true`, progress clamps to the dock rest); wheel a few notches to
  undock before continuing.
- The entry control is an **unlabeled 96×96 `<button>` at viewport centre** —
  find it by size, not by text.
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
  graph, per-slice acceptance criteria, risk table. **Owner-approved as
  written.** AFK gate is always lint + build green.
- **Prior gate record:** `docs/qa/9.2-desktop-checklist.md`, especially §17
  (session-13 fixes), §17b (rewritten in session 15 — the P7 record and the
  SignOff-overlap thread) and §17d (what an agent could not verify).
- **Standing rules:** root `CLAUDE.md` / `AGENTS.md`. Agent memory:
  `noise-signal-redesign-state.md`, `owner-motif-privacy.md`,
  `client-name-leak-accepted.md`, `windows-shell-gotchas.md`.

## Recommended Next Steps

- [ ] **Ask the owner: 1.2 now, or gate 1.3 first?** (see Unresolved Threads).
      Don't build 2.x or 4.x behaviours until 1.3 has passed either way.
- [ ] **Slice 1.2 — `character/armPose.ts`.** Shaped like `idle.ts`/`typing.ts`:
      allocated once, `update()` allocates nothing; quaternion `slerp` with an
      ease-in / hold / ease-out envelope; `goTo(side, pose, holdS)` and
      `busy(side)` so `typing.ts` can suspend taps on the working arm only.
      Prove the maths offline first (see the geometry-diffing recipe above)
      before spending a slow headless session on it.
- [ ] **Raise the SignOff/scroll-cue overlap with the owner** and act on their
      answer — it is a one-line change either way, but it is a gate change.
- [ ] **P6.1 (picture pipeline)** is still the other independent track and
      still unblocks the cheap 6.2 owner gate. Nothing in P1 blocks it.
- [ ] Stop the session-15 dev server on 3004 if the owner is done with it.

## Recommended Skills

- `test-driven-development`, or better the **pure-module + `npx tsc`
  simulation** pattern for `armPose.ts` — the pose maths is the part most
  worth proving offline, and the part a browser proves worst. The session-15
  geometry-diff harness is the closest working example of the setup.
- `agent-browser` — isolated `--session` QA for anything visual. Always
  `run_in_background`. The owner's headed session only for owner-angle checks;
  ask before reloads.
- `documentation-and-adrs` at close-out for slice 8.2.

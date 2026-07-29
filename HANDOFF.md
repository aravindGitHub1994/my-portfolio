# HANDOFF — `scene-refinement` (2026-07-29, session 17 wrap)

> For the next agent session. **ADR-012's plan is finished and merged.**
> `redesign-attempt2` → `main` @ `dac6de4`; every gate (1.2, 2.3, 4.3, 9.2)
> is owner-PASSED. The 9.2 record is `docs/qa/9.2-desktop-checklist.md`.
>
> **Everything is committed and green.** Working tree clean apart from
> untracked `assets-src/`. P1, P4.1 and P7 are done; P2 needs only 2.3.

## Current Status

- Branch **`scene-refinement`**, cut from `main` @ `dac6de4`.
- **Plan-0010's breakdown is APPROVED by the owner as written** (session 15).
  Build to it — dependency graph, slice boundaries, acceptance criteria as
  committed. This unblocks everything past 1.1.
- **Gate 1.3 PASSED** (owner, 2026-07-29) — P1 is closed. **P7 is
  owner-closed** (confirmed on the dev server; recorded in checklist §17b).
- **Working tree is clean.** Everything below is committed; lint, `tsc` and
  `npm run build` are green at HEAD. Untracked `assets-src/` stays untracked.
- Commits on the branch, newest first:
  - `53776f6` — docs: 4.1 + the P7 confirmation session 16 left loose
  - `dc3c6bb` — **slice 4.1** (behaviour scheduler; taps suspend per arm)
  - `3b87f43` — docs: session-17 handoff
  - `e02de5c` — **slice 2.2** (power hotspot pinned over the 3D button)
  - `f6cd25b` — **slice 2.1** (chapter 0 gains scroll span; opening frame)
  - `d10aac6` — **slice 1.2** (`armPose.ts`, the driver that moves the rig)
  - `cd9abc5` — docs: session-16 handoff refresh
  - `7f1722c` — **P7 complete** (7.1 scroll-cue contrast + 7.2 QA-record fix)
  - `0784e3d` — **slice 1.1** (two-bone arm rig)
  - `28410fc` — ADR-013 + plan-0010
- A dev server is running on **3004** and was used for session-17 QA.
  `EADDRINUSE` → use theirs. Ask before stopping it.

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

`typing.ts` and `idle.ts` needed **no change for the reparent**: every write
they make (`fingers[i].position.y`, `hands[i].position.y`,
`chest.rotation.x`) is local-space, so reparenting is transparent to them.
(`typing.ts` was later rewritten by 4.1 for a different reason — the
scheduler — but the local-space property is why 1.1 could land alone.)

### What 1.2 actually did

`character/armPose.ts` — `createArmPose({shoulderR, shoulderL, elbowR,
elbowL})` returns the callable driver plan-0010 §1.2 specifies, with
`goTo(side, pose, holdS)` and `busy(side)` hung off it. Ease-in 0.55 s /
hold / ease-out 0.7 s, smoothstep, `slerpQuaternions` between two fixed
endpoints. `Figure.tsx` builds it, ticks it at full rate (a reach is not
garnish, so it does **not** halve with `idleDensity`), and publishes
`window.__armPose` in dev so 1.2's "call `goTo` from the console" acceptance
is literally executable.

Two things it does that the plan text does not say, both deliberate:

- **The pose rotations are solved, not hand-typed.** Plan §1.2 says "authored
  as constants… hand-tuned against the harness", but hand-tuning needs owner
  eyes and this slice is AFK, so what is authored is the *world target* and a
  closed-form two-bone solve turns it into the two quaternions **once, at
  driver creation**. Runtime is still "two quaternions per arm, `slerp`ed" —
  ADR-013 §1's "no IK solver" rejects a per-frame solve to preserve bone
  length, and nothing per-frame solves anything. Effect: every reach lands on
  its target to **0.00 mm** rather than to however patiently someone nudged.
  If the owner wants the literal reading of the plan, the fix is to paste the
  four solved quaternions in and delete `solveReach` — say so at 1.3.
- **`armPoseState`** (`{R,L}: {pose, contact}`), the `typingState` pattern.
  `contact` is true only during the hold, which is the window 2.3 needs to
  land the button depress, the LED and the thunk on *contact* rather than on
  click.

`ArmPose` is the five names the plan specifies. Targets: `MOUSE_GRIP`,
`MUG_GRIP`, `POWER_BUTTON`, `LEAN_REST_{R,L}` — all exported, because 2.2/2.3
want `POWER_BUTTON` too.

`buildBody.ts` changed only to stop the duplication that would have made the
solve aim at numbers the mesh no longer used: the palm/finger offsets are
hoisted into constants and an exported `armPointLocal(side, "palm" |
"fingertips")` returns the elbow-local hand points. **Verified moving zero
vertices** (below). `Figure.tsx` also now `console.error`s if the four pivots
are missing, matching 1.1's loud-failure treatment of `elbowPivotL`.

### What 2.1 and 2.2 actually did

**2.1 — chapter 0 gains scroll span.** `chapters.ts`: `power-on` 0 → **90 vh**,
so `RUNWAY_LENGTH_VH` is **750** and `REST_POINTS[0]` is **0.12**.
`cameraPath.ts` gains a `p: 0` macro on the power button (camera
`(0.03, 0.825, -0.375)`, ~171 mm out) and the old extreme-CRT-close-up moves
verbatim to `REST_POINTS[0]`. `builders/tower.ts` now exports
`POWER_BUTTON_LOCAL` and names the mesh `towerPower`; `cameraPath` derives
`POWER_WORLD` from it rather than typing the coordinate a third time.

**Two downstream things were NOT merely "derived and fine"** — the plan said
verify rather than change, and verifying found them:

- `TitleBeats` normalised progress as `scrollProgress / REST_POINTS[1]`,
  which was only correct because `REST_POINTS[0]` was 0. Unfixed, the name
  card fades in over the power-button macro. It now normalises across
  chapter 1's own span.
- `experienceState.chapterIndex` and `Choreography`'s cleanup both defaulted
  to `1`. Progress 0 is genuinely inside chapter 0 now, so both are `0`.

Everything else really is derived and was confirmed rather than touched:
`REST_POINTS`, `DOCK_REST_INDEX`, `signOffStart`, the `lengthVh === 0` skip
in `chapterAtProgress`, and `LEAK_CHAPTER = 2`.

**2.2 — the power hotspot.** `choreography/PowerButtonAnchor.tsx` projects
`POWER_WORLD` to normalized viewport coords into
`experienceState.powerAnchor` each frame (one scratch `Vector3`, allocates
nothing), mounted in the journey Canvas after `JourneyCamera` so it projects
this frame's pose. `PowerOn.tsx` **drops the full-screen `bg-bg/95` scrim**
— the shot is "a dark room and one glowing button", and the scrim was
composition from when the film opened on the glass — and pins its `<button>`
to the anchor with a rAF writing `transform` (the TitleBeats pattern, no
React state in the frame path). The mark is a thin accent ring with a slow
breathe, `.power-ring` in `globals.css`. Instruction copy and the
returning-visitor skip stay parked at the bottom of the frame; letting text
ride the projected anchor would jitter it against the scene.

The button is still a DOM button for the reason ADR-013 §3 gives, and the
press handler is **byte-identical** — `unlockAudio()` first, synchronously.

### What 4.1 actually did — including the owner's 1.3 note

Taken **out of plan order, on purpose**: plan-0010 puts 4.1 after P2, but
the owner's gate-1.3 note (*the fingers keep tapping while the hand is away*)
becomes a defect in the first twenty seconds the moment 2.3's arm reaches
for the power button — and gate 2.4 is exactly those twenty seconds.

`typing.ts` gains the seeded scheduler over `typing | mouse | mug | lean`.
Taps suspend **per arm**: fingers 0–3 are the right hand and 4–7 the left,
which is the order `Figure` collects them in, so one hand keeps working
while the other is out. The wrist bob stills on the busy arm too, and a
finger caught mid-tap is parked at rest rather than frozen mid-dip.

The old lean-back beat was a **parallel clock** — its own 60–110 s timer
that moved the chest while the arms stayed on the keys. It is now one of
the scheduler's states, and the chest rides `armPose`'s own `EASE_IN_S` /
`EASE_OUT_S` (exported for this) so the torso and the arms cannot disagree
about whether the figure is leaning. `chest.rotation` still has exactly one
writer.

`typingState` is untouched, so `AudioTextures` needed no change: a hand off
the keyboard cannot tap, so it cannot clack.

**The mug is a reach, not yet a sip** — 4.2 makes the mug follow the hand
and adds the head tilt. The arm half of the motion is here.

Verified by simulating a **one-hour ride at 60 fps** against the real
modules (the scheduler is pure over a seeded PRNG, so an hour costs
seconds): 141 behaviours — mouse 57, mug 48, lean 36 — gaps mean 20.0 s
(sd 5.5, range 11–30), holds mean 5.4 s (sd 1.7, range 3.0–9.2), zero
finger dips on a busy arm, zero clacks with both hands away, zero frames of
chest lean without the arms in the lean pose, no behaviour ever repeating
back to back, and 10 of 12 three-minute windows containing all three
behaviours. Different seeds give different rides. Still ~zero retained
bytes over 108 000 frames.

Two things that harness got wrong first, worth knowing if you extend it:
a finger returning **to** rest when its arm leaves the keyboard is a
position change but is not a tap (assert a dip below rest, not any
movement); and `lean` drives both arms, so it opens two episodes at the
same instant and the sequence looks like it repeats every single lean
unless you merge them.

Measured and accepted, not a defect: with only three behaviours the *pose
sequence* does coincide with an earlier stretch up to about 9 episodes
long. That is ~3.7 minutes, longer than the observation window, and the
holds and gaps differ throughout even where the sequence matches — so
there is no visible cycle, only an unavoidable alphabet.

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
closed** (1.1 rig, 1.2 driver, gate 1.3 passed). **P2 is two thirds built**
(2.1 the scroll span and the opening frame, 2.2 the hotspot) and **4.1 is in
early**, out of plan order, because the owner's 1.3 note lands inside gate
2.4's twenty seconds. What is left of the opening is 2.3, the press itself.

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

**Gate 1.3 — CLOSED, but it left constraints.** The owner drove all five
poses from the console in `?scene=full` and said "all good". Their one note
— *the fingers keep tapping while the hand is away from the keyboard* — was
not a rig defect and is **fixed by 4.1**.

The three questions they did not have to answer, because the poses read
fine. **Keep them: they bind anything built on the rig from here.**
  1. **Three of the four reaches run at 94–96 % of full extension** (power
     95.1 %, mouse 95.9 %, mug 94.3 %; `lean` is the relaxed one at 64 %).
     The arm is nearly straight at the far end of every reach that matters.
     That is what the desk layout costs: the shoulder is a fixed point —
     `shoulderPivot` is a sibling of `chest`, not a child, so no torso lean
     or twist moves it, and the rig is rotation-only by contract. If it
     reads as a mannequin, the levers are (a) move the mug and the mouse a
     few cm closer, (b) let the shoulder pivot *translate* a couple of cm
     for far reaches, which is what a real scapula does but **is a change to
     the "rotations only" contract and needs the owner's word**, or (c)
     accept it. Don't pick one without asking.
  2. **`lean` had to be authored above keycap height.** A move is one
     `slerp` between two rotations, so there is no arc control: a hand
     going from over the keycaps to anywhere *below* them sags through
     them. A sweep of targets × swivels measured 6–16 mm of keycap
     penetration for every desk-height hand rest tried, and 0 mm from where
     `LEAN_REST_{R,L}` now sits — hands lifted and drawn back, not resting
     on the desk. **Any pose added in 2.x or 4.x must clear world y 0.752
     along its whole path**, or the driver needs a via-point it does not
     have. This is the one place the envelope's simplicity shows.
  3. **`MUG_GRIP` aims at the top-outside of the handle arc**, not the
     ring's centre. Chasing the centre cost 2.6 cm of reach and dragged the
     swing 9 mm through the desk top. 4.2 replaces this constant with the
     live prop handle anyway (ADR-013 §6) — but it should replace it with
     the same *point on* the mug, not with the mug's origin.
**Awaiting the owner, asked and not yet answered:**

- **The scroll cue now overlaps the SignOff card.** Newly *exposed* by P7, not
  caused by it: at p ≈ 0.94 the "Scroll" label sits ~30 px below the contact
  links and competes with them. The cue has always run to `END_P` (0.995) and
  SignOff has always started at `REST_POINTS[4]`; the overlap was invisible
  before because the cue was. Closing it means moving the gate, which ADR-013
  §10 explicitly puts out of scope for a contrast pass. Options recorded in
  checklist §17b: drop `END_P` below SignOff's start, or add a SignOff term to
  `wanted`. **Owner's call — do not just fix it.**

**New, from 2.1 — put this to the owner at gate 2.4:**

- **The POST plays where the visitor cannot see it.** ADR-013 §2 is explicit
  that the boot never scrubs and chapter 0's span is scrolled only *after*
  the desktop settles. Taken literally that means the camera holds the
  power-button macro for the whole boot — and the CRT is out of frame there,
  so the POST lines, the drive chatter listing and the Win98 splash all
  happen off-camera. What the visitor gets is the LED, the sound, and the
  screen's light washing the tower face. That may well be the better film
  (a machine waking up in the dark, heard not read), but it was not an
  explicit decision, and it throws away a beat P3 built. **Built as
  specified; flag it at 2.4.** The alternatives if the owner wants the POST
  seen: an auto-play camera move during boot (contradicts "chapter 0 never
  scrubs during the boot"), or a shorter hold before scroll releases.

**New, from this branch:**

- **Gate 6.2 should still be pulled forward** — it is cheap and it gates
  expensive work (6.4, the Gallery app). Nothing blocks 6.1 today.
- **The dock is this branch's biggest regression risk, and 2.1 has now
  triggered it.** `RUNWAY_LENGTH_VH` is 660 → **750**, so `DockSwap`'s
  `ENGAGE_EPS` of 0.012 now covers **~70 px instead of ~60 px** at
  1440×900 — and the dock is precisely what the owner signed off in
  session 13. **Not yet re-tested at all.** Slice 8.1 re-runs checklist
  §4/§17a in full; do not leave it to the end if anything feels off sooner.
- **Nothing gates the scheduler during boot.** 4.1's `busy()` stops
  behaviours overlapping once a pose has started, but a mouse reach can
  still fire a second *before* 2.3's press. 2.3 has to close that.
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
- **The arm rig (ADR-013 §1):** geometry under the pivots is authored in
  pivot-local space and bone lengths are fixed at build time. `armPose.ts`
  moves the figure by **rotating the four pivots only** — never by rebuilding
  geometry, never by writing world positions, and (a live question at gate
  1.3) never by translating a pivot either. The pose quaternions are solved
  at driver creation and are constants from then on; nothing in the frame
  path solves anything. `armPointLocal` in `buildBody.ts` is the single
  source of truth for where the hand's palm and fingertips are — the solve
  and the mesh must never carry separate copies of those offsets.
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
  **This is how 1.2 was proved**, and it earned its keep — it found three real
  defects a browser would not have shown: a `for…of` over a two-element array
  literal allocating on every frame of the ride, the mug reach dragging 9 mm
  through the desk top, and `lean` sagging 15 mm through the keycaps. The
  harness (`check.ts` + its tsconfig) is in this session's scratchpad; it
  builds the real body with `buildBody`, drives the real `createArmPose` at a
  simulated 60 fps, and asserts, in one run:
  1. **rest geometry byte-identical to `HEAD`** (the 1.1 property, re-proved
     after the hand-offset hoist) — 4866 vertices at high, 2102 at low;
  2. every reach lands within 2 mm of its target (all landed at 0.00 mm);
  3. ten round trips leave the four pivots at **exact** identity;
  4. the elbow, palm and fingertips clear the desk slab, tower, CRT bezel,
     keyboard and speaker at every frame of every path;
  5. `heapUsed` across 108 000 interpolating frames, `global.gc()` on both
     sides. **Measure retained bytes, not `heapUsed` deltas** — an unforced
     reading showed "+2.9 MB" that was uncollected garbage, and the real
     figure does not scale with frame count (27 k frames → 18 KB, 432 k
     frames → 1.5 KB, i.e. noise).
  Same three Windows/ESM traps as the session-15 recipe below.
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
  jump to any chapter instead of wheeling there. **The scrollable span is
  `RUNWAY_LENGTH_VH − 100vh`**, not the runway height: the trigger runs
  top-top to bottom-bottom, so the sticky viewport is not scrolled past. As
  of 2.1 that is 650 vh = **5850 px at 1440×900**, so `p ≈ y / 5850` (it was
  5040 px before 2.1 — any script carrying the old number is now ~16 % off).
  Rest points land at p = 0.12, 0.28, 0.467, 0.653, 0.813, 1.0.
  **Jumping past chapter 4 engages the dock** (`docked: true`, progress
  clamps to the dock rest); wheel a few notches to undock before continuing.
- The entry control is an **unlabeled 96×96 `<button>`** — find it by size,
  not by text. **As of 2.2 it is no longer at viewport centre**: it pins
  itself over the projected 3D power button, which at 1440×900 lands at
  ≈ (695, 519). Read `window.__experienceState.powerAnchor` (`{x, y}`,
  fractions of the viewport) rather than assuming a position.
- **The container around it is `pointer-events-none`** with
  `pointer-events-auto` on the button itself. A programmatic `.click()`
  ignores that, so it is not evidence a real pointer lands — hit-test with
  `document.elementFromPoint(x, y)` and check it resolves to the button.
- The full journey needs the power button *clicked* before stepping moves
  progress. Budget **~30–40 s** for the boot in a headless session, not the
  ~15 s it takes on real hardware — the sequencer is wall-clock driven but
  the page runs at 2–6 fps on software GL. A 25 s wait is not enough and
  looks exactly like a hang. **The press changes again in slice 2.3** —
  update the QA scripts when it does.
- **Scroll is parked (Lenis stopped) for the whole boot**, so `scrollTo`
  does nothing until the desktop settles. Check
  `document.querySelector('.power-ring')` is gone before scrubbing.
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

- [ ] **Slice 2.3 — the press.** Everything it needs is in place:
      `armPose.goTo("R", "power")`, `armPoseState.R.contact` for the timing
      (true only during the hold, so the depress, the LED and the thunk all
      land on contact rather than on click), the `towerPower` mesh to
      depress, and `POWER_BUTTON_LOCAL` to place the new emissive LED beside
      it. Note the existing LED is on the **CRT** (`builders/crt.ts:57`,
      `materials.metal`) and has never lit; the tower has none at all.
      One thing to decide while building it: the scheduler must not fire a
      behaviour during the boot, or the figure will reach for the mouse
      mid-press. `busy()` already stops overlap once the press has started,
      but nothing stops a mouse reach a second *before* it.
- [ ] **Slice 4.2 — prop handle + the mug sip.** 4.1 left the mug behaviour
      as a reach; 4.2 makes the mug follow the hand and adds the head tilt
      via `idle.ts`'s additive offset.
- [ ] **Gate 2.4** once 2.3 lands — and put the POST-visibility thread
      (above) to the owner in the same pass.
- [ ] **Raise the SignOff/scroll-cue overlap with the owner** and act on their
      answer — it is a one-line change either way, but it is a gate change.
- [ ] **P6.1 (picture pipeline)** is still the other independent track and
      still unblocks the cheap 6.2 owner gate. Nothing blocks it.
- [ ] **Spot-check the dock early**, ahead of 8.1. 2.1 lengthened the runway
      and nothing has re-tested the latch since. See Unresolved Threads.

## Recommended Skills

- **The pure-module + `npx tsc` simulation pattern, before anything else.**
  It has now paid for itself three sessions running: it proved 1.1's
  "identical to `main`", found three real defects in 1.2, caught two wrong
  "derived and fine" claims in 2.1, and replaced 4.1's three-minute
  observation with an hour of simulated ride. **2.3's press is the next
  natural candidate** — the ordering of click → reach → contact → depress →
  LED → thunk is a state machine, and a browser at 2–6 fps is the worst
  available instrument for judging it. Two harnesses from this session are
  in the scratchpad as working examples (`armcheck-check.ts`,
  `schedcheck-check.ts`).
- `agent-browser` — isolated `--session` QA for anything visual, and the
  only way to prove *wiring* (that a driver is actually mounted and running
  in the app). Always `run_in_background` with an `EXIT=` sentinel. The
  owner's headed session only for owner-angle checks; ask before reloads.
- `documentation-and-adrs` at close-out for slice 8.2.

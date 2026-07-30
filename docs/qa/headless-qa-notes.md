# Headless QA notes — how to verify this scene without eyes

**Extracted from `HANDOFF.md` at session 23**, when that file was trimmed to a
pointer. Everything else in it was a session-by-session narrative that git
history already holds; these two sections are not written down anywhere else,
were expensive to learn, and are the reason several verdicts on this branch are
numbers instead of opinions.

Two things to read this with in mind:

- **The traps below produced a wrong answer first.** They are recorded because
  something reported a false pass or a false regression until the trap was
  found — not as general advice.
- **Say which half you are in.** Static appearance and pure-module geometry are
  fair game headless; anything that depends on a real input cadence or a real
  frame rate is owner-verified only, and claiming otherwise is how a gate gets
  a tick it did not earn. The dock's momentum guard is the standing example:
  it was proved mechanically, passed on that basis, and still had a hole the
  owner found on their own hardware in one pass (gate 10.1 §0a.3).

## Verification patterns worth reusing

- **Pure-module + simulation** (`fidelity.ts`, `minesweeper.ts`): compile
  standalone with `npx tsc` to a scratch dir, play thousands of cases in node.
  **This is how 1.2 was proved**, and it earned its keep — it found three real
  defects a browser would not have shown: a `for…of` over a two-element array
  literal allocating on every frame of the ride, the mug reach dragging 9 mm
  through the desk top, and `lean` sagging 15 mm through the keycaps.
  **No harness is committed and the scratchpads do not survive the session —
  every one of these has been rebuilt from this recipe, and doing so takes
  about twenty minutes.** The shape: a scratch project inside the repo
  (`.rigcheck/`, `.sipcheck/`, deleted after) that copies the real modules
  in, flattens them into one directory and rewrites `@/lib/…` and `../scene/…`
  imports to `./x.js`. The 1.2 build asserts, in one run:
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
- **Sweeping a constant that is baked at driver creation** (4.2). `SIP_GRIP`
  is an exported `Vector3` and `POSES` holds a *reference* to it, so a sweep
  can `SIP_GRIP.set(...)` and re-call `createArmPose` to drive the **real**
  solve — no recompile, thousands of candidates in one process. The elbow
  swivel is a private const and cannot be reached that way; there, rewrite
  the literal in the **compiled** `dist/src/armPose.js` and re-spawn node,
  which is far cheaper than a tsc per candidate. **Score by where the prop
  ends up, not where the hand does** — the hand landing perfectly is the
  easy half, and it was a 196 mm rim error that the hand-only reading hid.
  Two modelling traps that cost real time: a **skull sphere includes the
  face**, so "the mug stays outside it" forbids ever reaching the lips
  (shrink it and test for driving *through* the head instead), and a
  **minimum-clearance metric at lift-off is dominated by frame granularity**
  — the mug is already millimetres up on its first carried frame, so that
  number rules out scrapes but ranks nothing.
  The 4.2 harness needed exactly these modules copied in: `prng`,
  `powerPress`, `propHandles`, `mug`, `desk`, `keyboard`, `buildBody`,
  `buildHead`, `buildBeard`, `armPose`, `idle`, `mugSip`, `typing` — plus a
  three-field stub for `builders/materials` (the real one bakes canvases and
  imports site content, and `buildMug` only type-imports it). Feed builders a
  `Proxy` that returns one `MeshStandardMaterial` for any slot; the harness
  cares about geometry. **Assemble the world from `RoomScene`'s placement
  literals, quoted not approximated** — the harness is only as honest as
  those.
- **Measuring "slow" and "does it loop"** (5.2, `.catcheck/`, deleted after).
  The wag's acceptance criteria look unmeasurable — *slow*, *out of phase*,
  *no visible loop* — but three of the four are numbers once you pick the
  right one. Build the real `buildCat` rig (materials `Proxy`, as 4.2 did),
  parent a probe `Object3D` at the tail's far end, tick the real driver at a
  simulated 60 fps and read: **peak tip speed in mm/s** through
  `matrixWorld` (that is what the eye tracks, not radians), **Pearson r**
  between the two tails plus the share of frames they move opposite ways, and
  for the loop an **autocorrelation over lags 2–120 s** on the pose vector.
  Two traps, both of which produced a wrong verdict first:
  1. **Scale the autocorrelation by per-channel amplitude, not by the spread
     of the flattened pose vector.** Each channel has its own rest angle and
     Ivy's tail hangs 0.17 rad off Nimbus's, so a flat sd measures the spread
     *between* channels, swamps the motion, and made a perfectly aperiodic
     driver report an 18 % near-repeat. Per-channel it is 81.6 %.
  2. **A tail returning to rest is not an ear flick** — the same shape of
     mistake as 4.1's "a finger returning to rest is not a tap". Detect the
     flick by an ear's offset from its *authored* angle, and assert the
     return is bit-exact rather than close.
  The half-rate claim is worth asserting directly too: run one driver at full
  rate and a second at every other frame, and check the poses are
  **bit-identical on the frames both ran**. That is what proves shedding
  `idleDensity` skips the call rather than slowing the clock.
- **Project the real geometry through a real camera** (3.2). "Legible at
  1920×1080" is a pixel measurement, so measure pixels: build the room,
  point a `PerspectiveCamera` with the journey's own fov (**50**, from
  `WorkstationCanvas.tsx`) at `sampleCameraPath(REST_POINTS[n], …)`, and
  project each object's bounding-box corners. That turns "is the shot
  right" into numbers — subject sizes in px, how far off centre each thing
  sits — and catches a frame composed away from its subject, which is
  exactly what 3.2 was fixing. **Reject any corner with view-space z > 0
  rather than projecting it**: a point behind the lens projects to a
  mirrored position on screen and silently reports as "in frame". Sample
  the arc between two rest points densely and check the camera against a
  keep-out cylinder round the figure, which is the checkable form of "does
  not cut through the hair".
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
- **Running the real modules in node with no scratch project at all — new in
  session 23, and it replaces most of the ceremony above.** `jiti` is already
  in `node_modules` (Next depends on it) and resolves TypeScript, `@/…`
  aliases and extensionless relative imports in one step, so a probe script can
  drive the **live source** instead of a copy that can drift from it:

  ```js
  const ROOT = "C:/Users/.../my-portfolio";
  // Import jiti by absolute file: URL — a scratchpad script outside the repo
  // cannot resolve it by bare name.
  const { createJiti } = await import(`file:///${ROOT}/node_modules/jiti/lib/jiti.mjs`);
  const jiti = createJiti(ROOT + "/x.mjs", { alias: { "@": ROOT + "/src" } });
  const { createTyping, typingState } = await jiti.import(
    "./src/components/workstation/character/typing.ts",
  );
  ```

  No `tsc`, no flattening, no import rewriting, no `.rigcheck/` to delete —
  both of session 23's measurements were standing up inside five minutes. The
  limit is that it runs the *real* module, so everything it imports must
  survive node: `three` does, the DOM does not (assign a `globalThis.window`
  stub with just the properties the module reaches for), and React components
  are out of reach. Pass fake targets — `{ position: { y: 0 }, rotation: { x: 0 } }`
  is enough of an `Object3D` for a rig driver — and tick it at a simulated
  60 fps. It costs nothing to try this before reaching for the tsc recipe.
- **Measuring a synthesized audio mix with a recording stub.** "Can you hear
  it" sounds like ears-only and half of it is not: build a fake
  `AudioContext` whose nodes record their connections and every gain write,
  drive the real cues through it, then multiply the gain peaks along each
  source's path to the destination. That gives every cue's amplitude *at the
  output*, which makes cues comparable to each other — exactly what a mix
  question needs. Absolute loudness still needs ears; "this cue is 2.5×
  quieter than one you can hear, and its whole fundamental is under 100 Hz"
  does not. Two traps, both of which reported every cue at 1.0 or worse:
  1. **A direct `param.value = x` assignment is a write.** The bus trims are
     set that way, not through the automation methods, so a stub that only
     records `setValueAtTime`/`linearRampToValueAtTime` misses every trim in
     the graph. Track "first write wins, then max" so the constructor default
     only counts when nothing ever writes.
  2. **An oscillator feeding another node's `frequency` param is not on the
     audible path** — score it 0 rather than following it, or the FM bells'
     modulators read as voices at full level.
  Session 23 used this to find that the entire POST sat under the one cue the
  owner *could* hear; the fix was three numbers. Worth rebuilding before
  touching any level, since the mix is still the largest unheard surface here.

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
  `runwaySpan`, `fidelityTier`, `perf`. **DEV SERVER ONLY** —
  `experienceState.ts` guards the assignment with a NODE_ENV literal ("Never in
  prod"), exactly like `__armPose` and `__sipNow`, so on a production export
  every read of it throws `Cannot read properties of undefined`. Found the hard
  way at 6.4. On the export, `window.scrollY` and the DOM are what you have.
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
  `document.elementFromPoint(x, y)`. As of 2.2 it resolves to the ring
  `<span>` *inside* the button, not the button: that is still correct (the
  span inherits `pointer-events-auto` and the click bubbles), so assert on
  it being inside the button rather than on it being the button.
- The full journey needs the power button *clicked* before stepping moves
  progress. Budget **~30–40 s** for the boot in a headless session, not the
  ~15 s it takes on real hardware — the sequencer is wall-clock driven but
  the main thread is saturated at 2–6 fps, so every chained boot timer
  overruns. Measured in session 18: a `setInterval(250)` fired at ~1.2 s
  intervals and `.power-ring` was still up at 15.6 s. A 25 s wait is not
  enough and looks exactly like a hang.
- **As of 2.3 the click does not boot the machine** — it starts a reach,
  and the boot lands on contact ~0.55 s later. A script that clicks and
  immediately asserts on `win98State` will see "off". The cheapest single
  probe that the whole press is wired is
  `window.__armPose.busy('R')` going true ~0.6–1.3 s after the click: it
  exercises PowerOn → `powerPress` → `TowerPower`'s `attachPowerArm` →
  `armPoseRef` → `Figure` in one read.
- **Scroll is parked (Lenis stopped) for the whole boot, but the page still
  moves** (ADR-013 §2a): the boot pan drives scroll to `REST_POINTS[0]`
  with Lenis' `force`. So progress running 0 → 0.12 during the boot is
  correct, not a stray scrub, and a first-run session ends parked at
  **y = 702 px** at 1440×900 rather than at 0. Check
  `document.querySelector('.power-ring')` is gone before scrubbing further.
- **Any key skips the intro, and as of 4.3 that is true BEFORE the click
  too.** A QA script that presses a key on the *entry frame* — not just during
  the boot — now skips the opening instead of doing nothing, and lands the
  page at `REST_POINTS[0]` (702 px at 1440×900). Excluded, and therefore safe
  to send: **Tab**, the modifier keys, **F1–F12** (so DevTools and reload are
  safe), and **Enter/Space while the power button holds focus** — which it
  does on load, so those two press power rather than skipping. **Clicking
  empty space still only skips during the boot**, never at idle.
- **The entry frame has three lines of copy for a returning visitor** and two
  for a first-timer: `press power`, `any key skips the intro` (4.3), and the
  older underlined `skip intro` link. A script matching on entry text should
  not assume one line.
- Reset before any first-run test: `w98-intro-seen`, `w98-muted`,
  `w98-fidelity-floor`.
- **The Gallery (6.4) answers a single click, not a double-click**, and its
  thumbnails are **not** tab stops — the grid is one `[tabindex="0"]` and the
  cursor is an inline `outline` on a cell, so a script looking for
  `document.activeElement` to move will see nothing. Find the cursor with
  `[...cells].findIndex(b => b.style.outline)`. **Escape in the viewer returns
  to the grid rather than closing the window**; it takes a second Escape, from
  the grid, to close. And dispatching several `keydown`s in one JS turn moves
  the cursor **once** — the handler closes over `cursor` and React does not
  flush between statements (the same trap as every other keyboard surface here),
  so put a wait between presses.


## Which tool to reach for

- **The pure-module + `npx tsc` simulation pattern, before anything else.**
  Five sessions running now: it proved 1.1's "identical to `main`", found
  three real defects in 1.2, caught two wrong "derived and fine" claims in
  2.1, replaced 4.1's three-minute observation with an hour of simulated
  ride, timed 2.3's press to the frame, caught an inherited constant whose
  doc comment was wrong by 172 mm in 4.2, measured 4.3's ladder to the
  tenth of a second, and in 5.1 caught two cats outweighing the whole room.
  **At 5.2 the earlier handoffs called it the wrong tool** — and they were
  half right. "Is the wag slow enough" is still owner's eyes, but three of the
  four acceptance criteria (out of phase, no loop, sheds with the figure)
  turned out to be plain measurements, and the harness caught its own metric
  being wrong before it could report a false verdict. **Reach for it even when
  the criterion sounds subjective; scope it to the measurable part.** See
  "Verification patterns".
- `agent-browser` — isolated `--session` QA for anything visual, and the
  only way to prove *wiring* (that a driver is actually mounted and running
  in the app). Always `run_in_background` with an `EXIT=` sentinel. The
  owner's headed session only for owner-angle checks; ask before reloads.

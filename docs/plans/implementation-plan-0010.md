# Implementation plan 0010 — Scene refinement (`scene-refinement`)

Implements [ADR-013](../decisions/ADR-013-scene-refinement-rigged-arms-and-the-power-press-opening.md).
Closes the one gate-9.2 item deferred out of that gate (checklist §15 / §17d — "the
largest outstanding piece of work" per `HANDOFF.md`) plus six owner requests raised
alongside it.

**Branch:** `scene-refinement`, cut from `main` at `dac6de4`.

## Slice shape

Every slice is a **tracer bullet**: a thin vertical cut that is demoable on its own,
through whatever layers it touches (builder → driver → frame loop → camera → DOM).
No slice leaves the scene in a state the owner cannot look at.

- **AFK** — self-contained, implementable without the owner present.
- **HITL** — needs the owner's eyes or a decision. These are gates: work does not
  continue past them on the affected track.

**Verification harnesses that already exist and should be used, not rebuilt:**
`?scene=full` (figure in the dressed room, orbitable), `?scene=room`, `?scene=character`,
`?scene=shell` (DOM shell, no canvas), `?tier=high|low|static`, and in dev builds
`window.__experienceState` and `window.__fidelity`.

---

## Dependency graph

```
P1 rig ─┬─────────────────────────────► P2 opening ──► gate 2.4
        ├─────────────────────────────► P4 behaviours ──┐
        └─► gate 1.3                                    │
                                                        ▼
P5 cats ──────────────────────────────► P3 camera route ──► gate 3.3
                                                        ▲
P6 gallery (independent) ──► gate 6.2 ──────────────────┤
P7 scroll cue (independent) ────────────────────────────┘
                                                        │
                                                        ▼
                                                  P8 close ──► gate 8.3
```

P6 and P7 are independent of everything else and can land at any time. **P3.2 is
blocked by P5** — the chapter-3 reframe has to be composed against a cat tree that
actually exists, or it is guesswork.

---

# P1 · The arm rig — the enabling dependency

ADR-013 §1. Nothing in P2 or P4 works without this, and it is the only slice that
touches geometry every other slice depends on.

### 1.1 · Two-bone rotational chains — **AFK**

**What to build.** Replace `buildBody.ts`'s body-space arm construction with nested
pivot groups. Geometry authored in pivot-local space so the rest pose is unchanged.

```
shoulderPivot{R,L}   Group at ARM_JOINTS.shoulder
  ├── upper arm      capsule ORIGIN → elbowLocal   (tee material)
  └── elbowPivot{R,L} Group at elbowLocal
        ├── forearm  capsule ORIGIN → wristLocal   (skin; R carries the tattoo albedo)
        └── hand{R,L} Group at local origin
              ├── palm + fingerR0–3 / fingerL0–3 + thumb
```

`buildWardrobe.ts` stops deriving world-space coordinates from `ARM_JOINTS` and
returns elbow-local geometry; `Figure.tsx` parents it into `elbowPivotL` so the
smartwatch rides the forearm.

Files: `character/buildBody.ts`, `character/buildWardrobe.ts`, `character/Figure.tsx`.

**Acceptance criteria**
- [ ] At rest rotations the figure is **visually identical to `main`** in `?scene=full`
      and `?scene=character` — same pose, same hand height over the keycaps, same
      watch placement. This is the whole point of the slice.
- [ ] `Figure.tsx`'s existing `getObjectByName` lookups (`handR`, `handL`,
      `fingerR0–3`, `fingerL0–3`, `chest`, `headPivot`, `eyelids`) all still resolve.
- [ ] Typing rig and idle rig run unchanged — fingers tap, wrists bob, chest breathes.
- [ ] `[character] ~N tris` console line is within ±2 % of `main`'s figure.
- [ ] `npm run lint` clean; no `Math.random` in render/memo; no new per-frame allocation.

**Blocked by:** none. *(Started — the `buildBody.ts` half is written.)*

### 1.2 · Arm-pose driver — **AFK**

**What to build.** `character/armPose.ts`, in the shape of `idle.ts` and `typing.ts`:
allocated once, `update()` allocates nothing. It owns the four pivots and eases
between named poses with a quaternion `slerp` and an ease-in / hold / ease-out
envelope.

```ts
export type ArmPose = "typing" | "power" | "mouse" | "mug" | "lean";
export interface ArmPoseDriver {
  (elapsed: number, delta: number): void;
  goTo(side: "R" | "L", pose: ArmPose, holdS: number): void;
  busy(side: "R" | "L"): boolean;
}
```

Pose rotations are authored as constants per arm, hand-tuned against the harness.
`busy()` is what lets `typing.ts` suspend taps on the working arm only.

**Acceptance criteria**
- [ ] In `?scene=full`, calling `goTo` from the console moves the correct arm smoothly
      and returns it exactly to the typing pose — no drift after ten round trips.
- [ ] Hand lands **on** its target: the mouse at `(0.42, 0.72, -0.46)`, the mug at
      `(-0.62, 0.72, -0.46)`, the tower's power button at world `(-0.05, 0.777, -0.518)`.
- [ ] The reach clears the CRT bezel and the keyboard — no interpenetration at any
      point on the path, checked by scrubbing the envelope slowly.
- [ ] `heapDeltaPerSec` in the dev perf counter stays flat while poses run.

**Blocked by:** 1.1

### 1.3 · **HITL — rig look gate**

Owner opens `?scene=full`, watches the rest pose and one reach of each arm.

**The question:** does the arm bend like an arm? Two-bone chains with no shoulder
roll can read as a mannequin at certain angles, and that is cheaper to catch here
than after four behaviours are built on top.

**Blocked by:** 1.2

---

# P2 · The opening — power button, press, and release to scroll

ADR-013 §2 and §3. This is checklist §15.

### 2.1 · Chapter 0 gains scroll span — **AFK**

**What to build.** `chapters.ts`: `power-on` gets `lengthVh: 90` (was `0`).
`cameraPath.ts`: new `p: 0` key = macro on the tower's power button; the existing
extreme-CRT-close-up moves to `REST_POINTS[0]`.

Everything downstream is derived and needs no edit — verify rather than change:
`REST_POINTS`, `DOCK_REST_INDEX`, `Choreography`'s `signOffStart = REST_POINTS[4]`,
`chapterAtProgress` (its `lengthVh === 0` skip no longer fires for chapter 0), and
`AudioTextures`' `LEAK_CHAPTER = 2`.

**Acceptance criteria**
- [ ] Scrubbing from 0 to 1 passes through: button macro → CRT close-up → pull-back →
      the man → the room → the dock → sign-off. No jerk at the new segment boundary.
- [ ] Scrubbing **backwards** is equally clean (the path is a pure function of
      progress, so this should be free — confirm it is).
- [ ] The earbud leak still fires in chapter 2 and only chapter 2.
- [ ] Dusk deepen still starts exactly at the dock rest point.
- [ ] `RUNWAY_LENGTH_VH` 660 → 750 recorded, and the dock still latches (see 8.1).

**Blocked by:** none *(but is only meaningful once 2.3 lands)*

### 2.2 · The power hotspot — **AFK**

**What to build.** A `PowerButtonAnchor` component inside the Canvas projects the
tower power-button world position to normalized screen coordinates each frame into
`experienceState`. `PowerOn.tsx` drops its full-screen `bg-bg/95` scrim and pins its
`<button>` to that projected point as a glowing ring.

The button stays in the DOM: `unlockAudio()` must run synchronously inside a real
user gesture, and the canvas is `fixed inset-0 -z-10` so clicks never reach it
(ADR-013 §3).

**Acceptance criteria**
- [ ] The ring sits **over the 3D power button** at 1280×720, 1920×1080, 2560×1440 and
      a narrow window — it tracks, it is not a fixed offset.
- [ ] Audio still unlocks on the press (this is the regression risk — checklist §1).
- [ ] The returning-visitor `skip intro` path still works and still unlocks audio.
- [ ] Keyboard: the button is still focusable, has its accessible name, activates on
      Enter/Space, and shows a visible focus ring.
- [ ] The scene behind it is visible — this is the "dark room, one glowing button"
      frame, not a scrim.

**Blocked by:** none

### 2.3 · The press — **AFK**

**What to build.** On press: right arm `goTo("R", "power")`, the tower's power button
mesh depresses ~2 mm, a **new emissive LED** on the tower front lights, and the boot
sequencer starts. The arm returns to typing while the POST runs.

Note the existing LED is on the **CRT** (`builders/crt.ts:57`) and is
`materials.metal` — it has never actually lit. The tower has no LED at all. Add an
emissive one to `builders/tower.ts`, since in the new opening the dark-to-green
transition is the payoff of the whole gesture.

**Acceptance criteria**
- [ ] Click → arm swings in → contact → button depresses → LED lights → degauss thunk,
      in that order, with the audio landing on contact rather than on click.
- [ ] Only the forearm and hand are in frame at the moment of contact — no face, no
      torso. Chapter 2 still owns the reveal (ADR-013 §4).
- [ ] Scroll stays parked for the whole boot and releases when the desktop settles.
- [ ] Skip path (key/click during boot) still jumps cleanly to the desktop with the
      arm back at the keyboard, not stranded mid-reach.
- [ ] Second visit (`w98-intro-seen`) skips the intro and leaves the arm at rest.

**Blocked by:** 1.2, 2.2

### 2.4 · **HITL — the first twenty seconds**

Owner runs a production build with all three localStorage keys cleared and watches
the opening only.

**The questions:** is the button findable without instruction? Does the arm sell the
press? Is 90vh the right amount of scroll between the button and the glass, or does
it drag?

**Blocked by:** 2.3

---

# P3 · The rest of the camera route

ADR-013 §4 and §8. The owner's note: *"i like the smooth camera shifts on scroll,
just need to change the route the camera takes."* So the mechanism is untouched —
only `KEYS` in `cameraPath.ts` moves.

### 3.1 · Chapter 2 face reveal — **AFK**

**What to build.** Extend chapter 2's orbit past profile to a three-quarter front
angle, key-lit by the CRT from off-screen, eye zone in shadow. No head geometry
changes — `buildHead.ts` is not touched (ADR-013 §4).

**Acceptance criteria**
- [ ] At the chapter-2 rest point you read beard, nose, hoop, earbud and curls, and
      the missing eyes are not conspicuous.
- [ ] The brightness contract holds — luminance cap 0.7 in `CrtScreen`, `CAST_MAX 2.6`
      in `Lighting` (gate 2.3, unchanged in every screen change).
- [ ] The tattooed right forearm still reads in the shot.
- [ ] `HEAD_FOCUS` stays the single source of truth for where the head is — the
      earbud-leak distance in `AudioTextures` measures against it.

**Blocked by:** none

### 3.2 · Chapter 3 reframe for the window wall — **AFK**

**What to build.** Move the chapter-3 wide shot so the window, the cat tree and the
cats are in the establishing frame. Currently the shot is composed away from the +X
wall, so the tree would be built and never seen.

**Acceptance criteria**
- [ ] Both cats are legible at the chapter-3 rest point at 1920×1080.
- [ ] The shot still reads as "the room", not "the cats" — it is an establishing wide,
      and ADR-012 §5's beat for it is *this is where it started*.
- [ ] Light shafts and dust still read (they are anchored to this window).
- [ ] The chapter 2→3 arc still swings behind the chair without cutting through hair.

**Blocked by:** 5.1

### 3.3 · **HITL — whole-ride camera gate**

One uninterrupted pass, forwards then backwards.

**Blocked by:** 3.1, 3.2, 2.4

---

# P4 · Behaviours — the figure stops typing forever

ADR-013 §5, §6, §7.

### 4.1 · Behaviour scheduler + mouse reach — **AFK**

**What to build.** `typing.ts` gains a seeded scheduler over `typing | mouse | mug |
lean`, typing as default. Taps suspend on the busy arm only; the other hand keeps
working. Right arm reaches the mouse, rests on it, returns.

`typingState.lastTapAt` / `.taps` keep their contract — `AudioTextures` needs no
change, and fewer taps correctly means fewer clacks.

**Acceptance criteria**
- [ ] Over a 3-minute observation the figure types, uses the mouse, drinks and leans
      back, with no visible repeating cycle.
- [ ] The left hand keeps typing while the right is on the mouse.
- [ ] Key clacks track the taps that actually happen — no clack while both hands are
      away from the keyboard.
- [ ] Under `effectsState.idleDensity === false` the scheduler still runs (it is the
      *idle* driver that halves, not the behaviours).

**Blocked by:** 1.2

### 4.2 · Prop handle + the mug sip — **AFK**

**What to build.** `scene/propHandles.ts` — a mutable singleton in the
`experienceState` / `effectsState` pattern. `RoomScene` publishes the mug `Group` on
mount, nulls it on unmount; the scheduler and the steam emitter read it.

Left arm lifts the mug, tilts it toward the head, returns it to the desk. `idle.ts`
gains an **additive head-rotation offset** the scheduler sets, so `idle.ts` remains
the single writer of `head.rotation`.

**Acceptance criteria**
- [ ] The mug returns to its exact starting transform every time — no accumulated
      drift over ten sips.
- [ ] Head tilt composes with idle sway instead of fighting it; no snap when the sip
      starts or ends.
- [ ] Unmounting the scene nulls the handle; no retained reference, no leak.
- [ ] `RoomScene` still works standalone in `?scene=room` with no figure present —
      the handle is published to nobody and nothing breaks.
- [ ] The dependency stays one-way: Room publishes, Figure consumes. `RoomScene` must
      not import from `character/`.

**Blocked by:** 1.2

### 4.3 · Mug steam — **AFK**

**What to build.** A small additive `Points` system anchored to the mug handle,
reusing `Atmosphere.tsx`'s dust pattern (preallocated arrays, seeded `mulberry32`,
zero per-frame allocation). Rises, drifts, fades, recycles.

`sheddable.ts`: new `steam` flag, placed in `SHED_ORDER` **immediately before
`idleDensity`** — the last rung before the resolution knobs (ADR-013 §7).

**Acceptance criteria**
- [ ] Steam follows the mug through a sip (it reads the same handle).
- [ ] `window.__fidelity.shed("steam")` removes it and nothing else.
- [ ] `LADDER` is 10 rungs; the static-floor offer still arrives, and the new timing at
      a pinned 20 fps is **measured and recorded** here for the owner's §11c call.
- [ ] Reads at dusk without blowing out — it is additive over a warm room.

**Blocked by:** 4.2

---

# P5 · The cats

ADR-013 §8. Nimbus and Ivy, matched to `assets-src/personal/cat-*.jpg`.

### 5.1 · Cat tree + two cats — **AFK**

**What to build.** `builders/catTree.ts` (post, platforms, sisal wrap, top platform at
window-sill height ≈ y 0.96) and `builders/cat.ts` (capsule body, sphere head, ears,
legs, named `tail{0,1}` pivots). Both follow the `RoomBuilderOptions` pattern with
`detail`-driven segment counts. Placed in `RoomScene`'s `placements` array against the
+X wall beside the window (`ROOM.rightX - …`, window centre z `-0.25`).

**Acceptance criteria**
- [ ] Both cats face the glass and read as cats in silhouette at chapter-3 distance.
- [ ] They differ — coat colour and seed — and match the reference photographs.
- [ ] The room's tri budget stays under the 2.1 acceptance ceiling (150 k at high);
      the `[room] ~N tris` line is recorded before and after.
- [ ] `detail: "low"` variants exist and the tree still reads.
- [ ] Nothing intersects the window frame, the sill, or the wall.

**Blocked by:** none

### 5.2 · Tail wag — **AFK**

**What to build.** `builders/catIdle.ts`, in the shape of `idle.ts`: allocated once,
`update()` allocates nothing. Slow incommensurate sines on the tail pivots so the loop
is never visible, plus a rare ear flick. Driven from a thin component rather than
giving the whole static `RoomScene` a frame loop. Rides `effectsState.idleDensity`.

**Acceptance criteria**
- [ ] The wag is *slow* — the owner asked for slow. It should read as content, not agitated.
- [ ] The two tails are visibly out of phase.
- [ ] No visible loop over a 2-minute watch.
- [ ] Shedding `idleDensity` stills the tails and the figure together.

**Blocked by:** 5.1

---

# P6 · The Gallery app

ADR-013 §9. Independent of every other package.

### 6.1 · Picture pipeline — **AFK**

**What to build.** `scripts/build-pictures.mjs` with `sharp` as a **devDependency**
(never in the runtime bundle). Reads an **explicit allow-list** — never a directory
glob — and emits a bounded-width JPEG plus a thumbnail per photograph into
`public/pictures/`. Both script and output are committed, so `npm run build` stays a
plain static export with no new build step.

29 photographs: 8 cats, 17 rides/hikes, `workspace-01`, `guitar-01`, and the two
existing `public/aravind*.jpg` portraits.

**Acceptance criteria**
- [ ] **No tattoo photography under `public/`** — plan-0009's §1.3 acceptance criterion,
      restated in ADR-013 §9. The allow-list is the mechanism; verify by inspection.
- [ ] No AI concept sheets, no client material, no `docs/projects/**` screenshots.
- [ ] `public/pictures/` total is recorded and lands in the 4–5 MB range.
- [ ] Re-running the script is idempotent.
- [ ] `assets-src/` remains untracked and unshipped.

### 6.2 · **HITL — photo and caption review**

Owner reviews the 29 selected photographs and writes or approves the captions.

**The questions:** is anything in this set private? Is the ride/hike naming right
(`ride-06-tamila nadu.jpg` has a typo and a space; `ride-08` does not exist)? Do the
captions sound like him?

**Blocked by:** 6.1

### 6.3 · Gallery icon glyph — **AFK**

**What to build.** `"gallery"` added to `IconGlyph` in `win98State.ts`, original
pixel-art in `pixelIcons.tsx` GLYPHS (compile-forced — the record is exhaustive), and
a matching `case "gallery":` in `painter.ts`'s `drawGlyph` (**not** compile-forced —
that switch is non-exhaustive and will silently draw nothing if missed).

**Acceptance criteria**
- [ ] The two implementations match at 16, 24, 32 and 40 px.
- [ ] Original art, period-appropriate, palette-matched to the existing set
      (ADR-012 §10 — zero Microsoft-derived art).
- [ ] The glyph renders on the CRT **and** in the docked DOM.

### 6.4 · The Gallery app — **AFK**

**What to build.** `src/lib/pictures.ts` (content, per project convention — content
lives in `src/lib`, not JSX), a desktop icon in `DEFAULT_ICONS` (free grid cells:
col 0 row 5, col 1 rows 3–4), an `APP_DEFS` entry, `apps/Gallery.tsx`, a new
`register54.ts` chunk, and its `lazyApps.ts` loader. Thumbnail grid → click to view →
next/previous → caption and count in a period status bar.

Reuse rather than reinvent: `IEFrame.tsx` already frames an image in period chrome,
and `Explorer.tsx` already does an item grid with a `w98-sunken` status line.

**Acceptance criteria**
- [ ] **The chunk actually splits** — verify in `out/` that the Gallery is not in the
      initial bundle (ADR-012 §8; this is the acceptance criterion that has caught
      regressions before).
- [ ] Images are `loading="lazy"` and nothing is fetched until the window opens.
- [ ] Keyboard: arrows navigate, Escape closes, the grid is a sensible number of tab
      stops (Minesweeper's "one tab stop, not 81" is the precedent).
- [ ] Works docked at desktop and touch sizes; nothing renders outside the CRT bezel.
- [ ] Plain `<img>` with the existing eslint disable comment — `next/image` is
      unavailable under static export (ADR-001).

**Blocked by:** 6.2, 6.3

### 6.5 · Painter suggestion — **AFK**

**What to build.** A thumbnail-grid suggestion for the Gallery's window in
`paintWindow` — grey rectangles, no raster loading. The painter draws zero raster
assets today and must stay event-driven; this keeps that true.

**Acceptance criteria**
- [ ] The CRT shows a photo-grid-ish window rather than the word `gallery`.
- [ ] The painter still repaints **only** on store change, never per frame.

**Blocked by:** 6.4

---

# P7 · Scroll cue legibility

ADR-013 §10. Checklist §15 and §17b. Independent.

### 7.1 · Contrast pass — **AFK**

**What to build.** `ScrollHint.tsx` keeps its gating logic **entirely unchanged** —
it is correct, and the phase gate does reach `"desktop"`. Fix only the three cosmetic
causes: tokens chosen against the flat static floor rather than a lit scene, a pulse
parked off-screen ~40 % of each cycle (`@keyframes scroll-cue` in `globals.css`), and
an exponential fade that asymptotes without arriving.

Add a soft scrim so the mark survives a bright backdrop. Keep it bottom-centre,
pointer-inert and `aria-hidden` — the owner asked for *subtle* and *not obstructing
the scene*.

**Acceptance criteria**
- [ ] Legible over the chapter-1 CRT close-up — the bright backdrop that made it
      invisible in the first place.
- [ ] Still legible at the chapter-3 dusk wide shot and the chapter-5 pull-back.
- [ ] Still hidden while docked, during boot, on the BSOD, and past `END_P`.
- [ ] Static floor's own cue (`acts/Hero.tsx`) is unaffected — it is a separate
      instance and it works fine against `#050507`.
- [ ] Still no React state in the frame path.

### 7.2 · QA-record drift — **AFK**

Checklist §17b claims the cue "fades in ~0.9 s after the desktop settles". It does
not: `stillSince` is initialised at mount and boot never moves `scrollProgress`, so it
ramps from the first `"desktop"` frame. Correct the record, not the code.

---

# P8 · Close-out

### 8.1 · Regression sweep — **AFK**

**What to build.** Nothing — verification only.

**Acceptance criteria**
- [ ] `npm run lint` and `npm run build` clean.
- [ ] **Dock re-verified against the longer runway.** `RUNWAY_LENGTH_VH` 660 → 750
      changes what `DockSwap`'s `ENGAGE_EPS` (0.012) means in pixels. Latch, undock,
      re-dock; windows survive; nothing gets stuck. This is the highest-risk
      regression in the branch — checklist §4 and §17a is the script.
- [ ] Brightness contract intact (luminance cap 0.7, `CAST_MAX 2.6`).
- [ ] `?tier=low` and `?tier=static` both still presentable.
- [ ] Prerendered HTML still carries the content (14 headings, checklist §14).
- [ ] `public/audio/` still contains only `LICENSES.md`.
- [ ] FPS recorded at the four checklist §12 moments, before and after.

### 8.2 · Docs reconcile — **AFK**

- [ ] `CLAUDE.md` and `AGENTS.md`: the rig, the prop-handle contract, the new shed
      rung, and the Gallery's raster assets under `public/pictures/`.
- [ ] `docs/design-system.md`: the ladder is 10 rungs.
- [ ] New `docs/qa/10.1-scene-refinement-checklist.md` for gate 8.3.
- [ ] `HANDOFF.md` refreshed; the §15 thread it calls "the largest outstanding piece
      of work" is closed.
- [ ] ADR-012 gains a pointer to ADR-013 for §5 and §2, without rewriting its content
      (the 9.1 convention for superseded sections).

### 8.3 · **HITL — gate 10.1**

Owner runs the new checklist on a production static export on real hardware.

**Still open from 9.2 and explicitly *not* closed by this branch:** audio levels
(no human has heard the mix), a real phone, fidelity-ladder pacing, the low tier's
texture budget, and `src/lib/aboutMe.ts` copy approval.

---

## Risks

| Risk | Mitigation |
|---|---|
| The rig changes the typing pose subtly and nobody notices until it's built on | 1.1's acceptance is *visually identical to `main`*, gated by owner eyes at 1.3 before any behaviour lands |
| Longer runway breaks the dock the owner just signed off | 8.1 re-runs checklist §4/§17a in full; called out in ADR-013 §2 as a known consequence |
| The face reveal shows a blank face | Resolved by decision, not by hope — ADR-013 §4 reveals by lighting; no frontal shot is ever composed |
| A tattoo photo reaches `public/` | Explicit allow-list, never a glob; 6.1 acceptance criterion; owner review at 6.2 |
| Two-bone arms read as a mannequin | Gate 1.3 exists specifically to catch this early |
| The extra shed rung makes the static-floor offer arrive even later | 4.3 **measures** the new timing rather than estimating it; owner calls it at 8.3 |

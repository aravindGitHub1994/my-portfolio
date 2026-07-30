# Implementation plan 0011 — The opening and the fit (`opening-and-fit`)

Implements [ADR-014](../decisions/ADR-014-chapter-zero-recomposition-and-viewport-adaptation.md).
Closes the owner's chapter-0 clipping report plus the five items carried out of gate
10.1 on `HANDOFF.md`'s worklist (items 1–5; item 6 shipped as `ladder-pacing`).

**Branch:** `opening-and-fit`, cut from `main` at `b341735`.

## Slice shape

Every slice is a **tracer bullet**: a thin vertical cut, demoable on its own, through
whatever layers it touches (builder → driver → frame loop → camera → DOM → docs).
No slice leaves the scene in a state the owner cannot look at.

- **AFK** — self-contained. The AFK gate is always **lint + build green**.
- **HITL** — needs the owner's eyes or a decision. These are gates: work does not
  continue past them on the affected track.

**Harnesses that already exist and should be used, not rebuilt:** `?scene=full`,
`?scene=room`, `?scene=character`, `?scene=shell`, `?tier=high|low|static`, and in dev
builds `window.__experienceState`, `window.__fidelity`, `window.__armPose`.

**Read `docs/qa/headless-qa-notes.md` before writing any probe.** The `jiti` recipe
(no scratch project, no `tsc`) is the cheapest way to drive the real modules in node,
and the "project the real geometry through a real camera" pattern is the tool P2 is
built on.

---

## Dependency graph

```
P1 viewport ──┬───────────────────► gate 1.4 (iPad, owner's device)
              │                          │
              └──► P2 chapter 0 ─────────┴──► gate 2.4
                                              (first twenty seconds)
P3 entry frame                                     ▲
  3.1 skip ──► 3.2 title card ─────────────────────┘

P4 lamp ──► gate 4.3 ─┐
P5 mug    (independent)├──► P7 close-out ──► gate 7.3
P6 wag  ──► gate 6.2 ─┘
```

**P4, P5 and P6 are independent of everything else** and can land in any order. **P2
is blocked by P1** — the new opening has to be composed knowing the lens is a function
of aspect, or it gets composed twice. **P3 is not blocked by P2**, but both touch
`PowerOn.tsx`, so land 3.1 then 3.2 and keep the diffs apart. **Gate 2.4 judges P2 and
P3 together**: the title card sits over chapter 0's opening frame, and neither can be
signed off without the other behind it.

---

# P1 · Viewport adaptation — the iPad defect

ADR-014 §3 and §4. The only item on the worklist that is a defect rather than a
preference, and `HANDOFF.md:88` calls it the highest value of the six.

### 1.1 · The viewport module — **AFK**

**What to build.** A new module (suggested: `src/components/workstation/choreography/viewport.ts`)
that is the single source of truth for the viewport's effect on the camera. Pure — no
DOM reads, no three.js beyond types — so both consumers can call it and can never
disagree, the same shape as `shellLayout.ts`.

```ts
/** Vertical fov in degrees. 50 at and above REF_ASPECT — no desktop
 *  viewport sees any change. Below it, widen so horizontal fov holds
 *  roughly constant, clamped so portrait is not a fisheye. */
export function journeyFov(aspect: number): number;

/** Camera distance from the CRT screen plane at the dock pose. The screen
 *  must fit in BOTH axes:
 *    max(H, W / aspect) * FILL / (2 * tan(fov / 2))
 *  Reproduces today's 0.26 at aspect 1.2578 — that constant already WAS
 *  the aspect-1.2578 solution (ADR-014 §3). */
export function dockDistance(aspect: number): number;
```

**Acceptance criteria**
- [ ] `journeyFov(a) === 50` for every `a >= REF_ASPECT`; monotonically increasing as
      `a` falls; clamped at the ceiling.
- [ ] `dockDistance(1.2578)` reproduces **0.26** to within 1 mm — proved in node
      against the real module (`jiti` recipe), not by hand.
- [ ] For a sweep of real viewports — 360×640, 390×844, 768×1024, 810×1080, 820×1180,
      **1024×1366**, 1024×768, 1180×820, 1366×1024, 1440×900, 1920×1080 and their
      rotations — the projected CRT screen rect fits **inside** the viewport in both
      axes with a non-negative `left` and `top`.
- [ ] Doc comment states why the rect stays analytic (the cross-fade, ADR-014 §3) so
      the next reader does not "simplify" it to a `Math.min` fit.

**Blocked by** — None.

### 1.2 · Wire the journey camera and the dock keyframe — **AFK**

**What to build.** `JourneyCamera` writes `camera.fov = journeyFov(aspect)` and calls
`updateProjectionMatrix()` **only when the value changes** (it is a frame loop; an
unconditional write every frame is a projection-matrix rebuild sixty times a second).
`cameraPath.ts` exports a setter that repositions the dock keyframe's `z` from
`dockDistance(aspect)` on resize. `dockAlignment.ts`'s `DOCK_FOV_DEG` literal and its
`DOCK_DISTANCE` import both become calls into the module.

**Acceptance criteria**
- [ ] `sampleCameraPath` is still a pure function of progress; only the dock key's
      stored `position.z` is written, and only on resize.
- [ ] At 1440×900 the camera pose at every rest point is **bit-identical to `main`** —
      the desktop ride does not move at all. Prove it in node over a dense progress
      sweep, not by eye.
- [ ] `dockAlignment.ts` contains no `50` literal and no `0.26` literal.
- [ ] The dev `[dock] rect …` log shows `left`/`top` ≥ 0 at every viewport in 1.1's
      sweep.
- [ ] Resize while docked re-aligns without the shell drifting off the CRT quad.

**Blocked by** — 1.1.

### 1.3 · Shell routing by orientation — **AFK**

**What to build.** `isTouchShell` takes the viewport height. On a coarse pointer,
portrait (`width < height`) always returns the touch shell; landscape keeps the
existing width rule. Fine pointers unchanged. Update both call sites
(`computeShellLayout`, `computeDockRect`) and `Desktop.tsx`'s viewport read.

**Acceptance criteria**
- [ ] `isTouchShell(1024, 1366, true) === true` — the exactly-1024 boundary trap is
      gone (`shellLayout.ts:41,59`).
- [ ] `isTouchShell(1366, 1024, true) === false`; `isTouchShell(844, 390, true) === true`
      (a phone in landscape must not get the desktop shell).
- [ ] Fine-pointer results are unchanged for every width.
- [ ] Rotating between portrait and landscape swaps the shell live, through the resize
      listeners that already exist (`Desktop.tsx:54-72`, `DockSwap.tsx:332-337`) — no
      reload, no stuck scale.
- [ ] Touch-shell chrome still clears `TOUCH_TARGET_PX` (44 css px) at every tablet
      portrait size.

**Blocked by** — None (independent of 1.1/1.2, but gated with them at 1.4).

### 1.4 · **HITL — the iPad gate**

The owner's own iPad, both orientations, and a rotation mid-ride. `HANDOFF.md:87`
asked to reproduce before changing anything; ADR-014 makes reproduction the acceptance
step instead, so this gate is where that debt is actually paid.

**Ask the owner:** does the scene fit, in both orientations? Does the dock land on the
screen? Does rotating mid-ride do anything ugly? Is the portrait lens too wide?

**Also worth checking here, because no headless run can:** iOS Safari's dynamic
toolbar. The runway is `750vh` while ScrollTrigger measures `innerHeight`
(`WorkstationExperience.tsx:131-135`, `Choreography.tsx:39-42`), and nothing in the
repo uses `dvh`/`svh` or `visualViewport`. If progress jumps when the toolbar
collapses, **that is a new finding, not this slice's failure** — record it and decide
separately.

**Blocked by** — 1.2, 1.3.

---

# P2 · Chapter 0 recomposition

ADR-014 §1 and §2. The owner's headline item.

### 2.1 · The opening's measurement harness — **AFK**

**What to build.** Extend the gate-3.2 pattern from `headless-qa-notes.md` ("project
the real geometry through a real camera") with the one test it never needed before:
**occlusion**. `PowerButtonAnchor.tsx:38` is projection-only with no depth test, so a
button hidden behind the figure still reports `onScreen` and the ring floats over the
torso with nothing behind it.

Assemble the room from `RoomScene.tsx`'s placement literals **quoted, not
approximated**, plus the figure, and for a candidate camera pose report:

1. Is `POWER_WORLD` unoccluded? Raycast camera → button against the figure and the
   room; the first hit must be the `towerPower` mesh.
2. Subject sizes in px at 1920×1080 and at the tablet aspects from 1.1 — figure,
   tower, button, CRT screen — and how far off centre each sits.
3. Does the segment from the ch.0 start key to the ch.0 rest key clear a keep-out
   cylinder round the figure, sampled densely?
4. Nothing crosses the camera's near plane (0.1 m) at any point of the segment,
   **including the right arm at every frame of the power reach** — that is the defect
   being fixed and it is the one number that must be proved, not eyeballed.

Reject any corner with view-space `z > 0` rather than projecting it (a point behind
the lens projects mirrored and silently reads as "in frame").

**Acceptance criteria**
- [ ] Reports all four measures for an arbitrary `(position, target)` pair.
- [ ] Re-run against **today's** ch.0 macro key and it *fails* test 4 — if the harness
      cannot detect the bug the owner reported, it cannot certify the fix.
- [ ] Driven by `jiti` against live source; no copied modules, nothing to delete.

**Blocked by** — 1.1 (the harness must take fov from `journeyFov`, not a literal 50).

### 2.2 · The new chapter-0 keys — **AFK**

**What to build.** Replace `cameraPath.ts`'s two chapter-0 keys.

- **`p: 0`** — high and wide from **behind and to the right** of the figure. The whole
  seated figure reads small in frame with the desk, tower, CRT and room around it.
  Behind-*right*, not behind: from a centred behind-camera the torso occludes the
  tower (ADR-014 §1). Starting candidates to sweep, not to trust: position around
  `(1.1–1.4, 1.75–2.05, 1.2–1.6)`, target around `(0.0–0.2, 0.95–1.05, -0.45)`.
- **`p: REST_POINTS[0]`** — a **medium on the monitor**: the CRT sizeable with its
  bezel, not filling the frame. The distance is set by POST legibility (2.3), not by
  taste.
- Add an intermediate arc key **only if** 2.1's test 3 fails on the straight segment.
  Do not add one pre-emptively.

Rewrite the doc comments. The retired promise at `cameraPath.ts:50-52` ("no torso or
face is ever in shot") must not survive as a stale contract; the replacement should
state the occlusion constraint, because it is invisible in the numbers.

**Acceptance criteria**
- [ ] 2.1's four tests all pass on the shipped keys, at desktop **and** tablet aspects.
- [ ] `experienceState.powerAnchor.onScreen` is true for the whole entry frame, and
      `document.elementFromPoint` at the anchor resolves inside the power button
      (the hit-test gotcha in `headless-qa-notes.md` — a programmatic `.click()` is
      not evidence).
- [ ] Chapters 1–5 keys are **untouched**, and their sampled poses are bit-identical
      to `main`.
- [ ] The extreme close-up on phosphor appears nowhere in `KEYS`.

**Blocked by** — 2.1.

### 2.3 · POST legibility at the rest point — **AFK**

**What to build.** Nothing new — a measurement that constrains 2.2. ADR-013 §2a
records an explicit owner decision that the POST lines are *read*, not merely heard,
and that is what bounds how far out the new rest point may sit.

Project the `crtScreen` mesh at `REST_POINTS[0]` and report the screen's height in
device px, then convert to a painted-text height: the painter renders 640×480, so a
POST line's cap height in screen px is a straight ratio.

**Acceptance criteria**
- [ ] Screen height at the ch.0 rest is measured, not asserted, at 1920×1080, 1440×900
      and the tablet aspects.
- [ ] A POST line's rendered cap height is **at least** what it is today at chapter 1's
      rest — chapter 1 is where the lines used to still be legible after the pan, so it
      is the floor, and it is a floor derived from shipped behaviour rather than
      invented.
- [ ] If the floor and "still a medium, not a close-up" conflict, **stop and ask** —
      that is a shot decision and ADR-014 §2 says explicitly it is not one this plan
      can make.

**Blocked by** — 2.2 (iterates with it).

### 2.4 · **HITL — the first twenty seconds, again**

Gate 2.4 and gate 3.3 §4.2 both signed off the boot pan's `PAN_HOLD_MS` and
`PAN_DURATION_S` as settled. **They are not retuned here** — but they were tuned
against a move that no longer exists, so ADR-014 §2 requires a fresh ask rather than
an agent's judgement.

**Ask the owner:** watch the opening end to end, first-run (clear `w98-intro-seen`,
`w98-muted`, `w98-fidelity-floor`).

1. Is the hand still clipping? Can you see inside the figure at any point?
2. Is the wide opening the right shot, or does it want to be closer / higher / lower?
3. The hold on the lit LED and the travel time onto the monitor — still right against
   the new move, or do they want re-timing?
4. Does the POST read?
5. Chapter 0 and chapter 3 now both show the room. Does the film read as repetitive?
   (ADR-014's Consequences names chapter 0's height and distance as the knobs.)
6. The title card over the new opening frame: right size, right place, readable over
   the room? Does the name hold long enough now, and is it gone by the splash?
7. Chapter 1 now has no text at all. Does the ride feel bare between the entry fading
   and `ScrollHint`?

**Blocked by** — 2.2, 2.3, 3.2, 1.4.

---

# P3 · The entry frame

ADR-014 §6 and §9. Worklist item 1, plus the title card the owner asked for after the
grilling session.

### 3.1 · Pointer-class-aware skip — **AFK**

**What to build.** Delete the `returning && (…)` link at `PowerOn.tsx:338-347` and the
now-unused `returning` state. On a **coarse** pointer, the announced copy becomes
`tap anywhere to skip` and the pointer-skip effect (`PowerOn.tsx:278-289`) arms at the
`idle` stage as well as `booting`. Fine pointers keep today's behaviour byte for byte,
including the deliberate refusal to arm the pointer at `idle`.

Use `coarsePointer()` from `shellLayout.ts` — the same branch `ScrollHint.tsx:57`
already makes. Read it in an effect, not during render (`ssr:false` tree or not,
`matchMedia` in render is a hydration hazard and the file's own comment at `:93-94`
records the pattern this repo uses).

Rewrite the comment block at `PowerOn.tsx:273-277`: its reasoning is still correct and
is now explicitly scoped to fine pointers.

**Acceptance criteria**
- [ ] No `skip intro` link in the DOM for any visitor or pointer class.
- [ ] Coarse: tapping the ring presses power; tapping the backdrop at `idle` skips and
      lands the page at `REST_POINTS[0]`; tapping the mute toggle does **not** skip
      (the `closest("button, a, [role='button']")` guard).
- [ ] Fine: clicking the backdrop at `idle` still does nothing; every key exclusion
      (Tab, modifiers, F1–F12, Enter/Space on the focused power button) still holds.
- [ ] The entry frame now has **two** lines of copy for every visitor, not three for a
      returning one — `headless-qa-notes.md`'s "three lines of copy" gotcha is stale
      and is updated in 7.1.

**Blocked by** — None. Land before 3.2, and before P2's `PowerOn.tsx` work if any, to
keep the diffs apart.

### 3.2 · The title card — **AFK**

**What to build.** Delete `TitleBeats.tsx` and its mount at
`WorkstationExperience.tsx:118`. Render `SITE.name` and `SITE.role` at the **top of the
entry frame** inside `PowerOn`'s overlay, `aria-hidden="true"` (following
`TitleBeats`' own precedent and ADR-012 §9).

**The fade has to split.** `PowerOn`'s root currently carries
`transition-opacity duration-700` and drives the whole overlay from one `opacity-0`
(`PowerOn.tsx:296-299`). A single transition on a common ancestor cannot give two
children different durations, so the root sheds its transition and two inner wrappers
carry their own: the **controls** (ring + bottom copy) keep 700 ms; the **title** holds
a beat and then dissolves.

Express both title durations as **fractions of `POST_MS`**, matching `PAN_HOLD_MS` and
`PAN_DURATION_S` (`PowerOn.tsx:83-88`), so the card keeps its proportions if
`bootScript` grows a line. The budget, measured from the press:

```
press          t=0
contact        t≈0.55 s   EASE_IN_S — boot starts, POST begins
pan starts     t≈0.85 s   PAN_HOLD_MS after contact
pan ends       t≈2.06 s   PAN_DURATION_S
splash begins  t≈3.29 s   contact + POST_MS (2740 ms)
```

The title must be **fully gone before the splash at ~3.29 s**. That is the hard
constraint — ADR-014 §9 narrows ADR-013 §3a to "a dissolve over the first POST lines",
and it stops being a narrowing the moment the splash is covered.

Note the skip path unmounts the component outright (`stage === "done"` returns `null`,
`PowerOn.tsx:291`), so a skip takes the title instantly with no fade. That is correct
and consistent with the ring's existing behaviour — don't add a fade to it.

**Acceptance criteria**
- [ ] `TitleBeats.tsx` is deleted; nothing imports it; chapter 1 renders no overlay.
- [ ] The card is fully transparent **before** `win98State.phase` becomes `splash`.
      Measure it — the splash must be uncovered, and that is §3a's actual line.
- [ ] The controls still finish their fade at 700 ms; the title is still visible then.
- [ ] The card never overlaps the power ring at any entry framing, checked at every
      viewport in 1.1's sweep — the ring tracks the projected button and does not sit
      still between framings.
- [ ] `SITE.role` (`"Data Analytics Manager · Builds with AI"`, 44 chars at
      `tracking-widest uppercase`) does not wrap badly at 360 px, and the block clears
      the iOS Safari toolbar area in portrait.
- [ ] Contrast of both lines over the **actual** chapter-0 backdrop is measured, not
      assumed (ADR-014 §9) — the window shaft and P4's lamp are both behind this text.
      Screenshots at 2 fps are valid for this; `headless-qa-notes.md` says static
      appearance is fair game.
- [ ] Skipping from the entry frame takes the card instantly, with no orphaned fade.

**Blocked by** — 3.1 (same file). Composition is checked again at gate 2.4, once the
new chapter-0 framing exists behind it.

---

# P4 · The room — dust out, a lamp in

ADR-014 §5, worklist item 2.

### 4.1 · Dust out; the ladder becomes nine rungs — **AFK**

**What to build.** Remove the mote cloud from `Atmosphere.tsx` — the `BOUNDS` const,
`moteTexture()`, the `dust` memo, the `points` ref and element, the dust branch of
`useFrame`, and the geometry/material/map disposal. **Keep the light shafts.** The
`detail` prop only ever controlled mote count (260 vs 90) and becomes unused: remove
it and update `RoomScene.tsx:149`.

Remove `dust` from `effectsState` and `SHED_ORDER`. Note `shedRung`'s `else` branch is
typed by `effectsState[rung]` (`fidelity.ts:173-182`), so deleting the key without the
`SHED_ORDER` entry will not compile — that is a feature.

**Acceptance criteria**
- [ ] `LADDER.length === 9`; `window.__fidelity.ladder` reports nine rungs.
- [ ] Shafts still shed on their rung and still render at every tier.
- [ ] `fidelity.ts`'s `OFFER_AFTER_MS` comment (`:74-75`, "the ten EMA re-crossings are
      another 17.5 s") is corrected to nine, and the offer still lands at ~30 s —
      re-run the 20-assertion simulation from `ladder-pacing` and confirm ADR-013 §7a's
      three properties survive.
- [ ] `sheddable.ts`'s `steam` comment (`:19-25`), which argues against a nine-rung
      ladder by name, is rewritten rather than left contradicting the code.

**Blocked by** — None.

### 4.2 · The corner lamp — **AFK**

**What to build.** A `builders/lamp.ts` following `catTree.ts`'s pattern (the only
existing tall floor-standing object): base, post, shade, and an emissive bulb mesh.
Placed in the **back-left corner** — `ROOM.leftX -2.1`, `ROOM.backZ -1.05` — the one
corner of the three built walls that nothing occupies, allowing ~0.02 m standoff for
the baseboards (`room.ts:81-94`). Add to the `placements` table at `RoomScene.tsx:64-101`
and to `materials.ts`'s hand-maintained `dispose()` array if it needs a new material.

The light itself goes in `Lighting.tsx`, not the builder — no builder in this codebase
has ever returned a light, and the lamp must participate in the `duskDeepen` scaling
that lives there:

```ts
const dusk = 1 - 0.55 * experienceState.duskDeepen;
if (ambient.current) ambient.current.intensity = 0.5 * dusk;
if (shaft.current)   shaft.current.intensity   = 0.85 * dusk;
if (bounce.current)  bounce.current.intensity  = 0.25 * dusk;
if (lamp.current)    lamp.current.intensity    = LAMP_BASE * dusk;   // new
```

**Acceptance criteria**
- [ ] `LUMINANCE_CAP 0.7` (`CrtScreen.tsx:39`) and `CAST_MAX 2.6` (`Lighting.tsx:20`)
      are **unchanged**, and neither expression gains a lamp term. Assert it.
- [ ] The lamp sinks with `duskDeepen`; at chapter 5 the CRT cast is the brightest
      source in the room. Measure it — sample both intensities at `duskDeepen === 1`.
- [ ] The bulb mesh's emissive is above Bloom's `luminanceThreshold` of 0.68
      (`postprocessing.tsx:27`) so it blooms.
- [ ] The lamp is **not** a shed rung (ADR-014 §5) and does not appear in
      `effectsState`.
- [ ] No geometry intersects the walls, the baseboards or the cat tree.

**Blocked by** — 4.1 (same files; land in order).

### 4.3 · **HITL — lamp look and the dusk gate**

**Ask the owner:** is it the lamp you meant — height, warmth, brightness? Does the room
still go properly dark at chapter 5, with the screen as the last light? Does the shed
of the shafts (now rung 2) read worse now that the motes are not shed first?

**Blocked by** — 4.2.

---

# P5 · The desk — coffee in the mug

ADR-014 §7, worklist item 3.

### 5.1 · Open the mug and give coffee a material — **AFK**

**What to build.** The root cause is geometric: `mug.ts:14`'s
`new CylinderGeometry(0.041, 0.038, 0.098, segs)` leaves `openEnded` at its `false`
default, so a solid near-white cap sits at local y 0.098 and seals the coffee disc
(top face y 0.090) inside. **Not a material bug and not the chapter-3 angle** — both
`HANDOFF.md:71-76` and gate 10.1 §3.6 guessed otherwise.

Open the body (`openEnded: true`) and give it an inner wall — either `side: DoubleSide`
on `materials.mug` or a separate inner mesh — plus a rim so the lip still reads solid.
Lift the coffee disc to sit just under the rim. Add a `coffee` slot to `RoomMaterials`:
a dark warm brown (`#2a1a10`–`#3a2416`) at roughness ~0.25–0.35 so it catches the CRT
cast. **Do not retune `materials.rubber`** — it is shared with cables, feet and the
mouse pad.

`Steam.tsx:43-47` quotes `buildMug`'s numbers in a hand-written comment
(`SURFACE_Y = 0.092`, `SURFACE_R = 0.03`) and today emits *between* the disc and the
cap — inside a sealed mug. It is the only coupling between the two files, there is no
test on it, and it must move with the disc.

**Acceptance criteria**
- [ ] The coffee surface is visible from the chapter-2 and chapter-3 camera poses —
      raycast from each to the disc and confirm it is the first hit.
- [ ] Steam originates **above** the liquid and clears the rim without clipping the
      wall, at rest and at `mugSip.ts`'s `MAX_TILT = 0.49` rad.
- [ ] `Steam.tsx`'s doc comment matches `mug.ts`'s shipped numbers exactly.
- [ ] No new material leaks: the `coffee` slot is in `materials.ts`'s `dispose()` array.
- [ ] The sip still works — 4.2's prop-handle path is untouched and `RoomScene` still
      does not import from `character/`.

**Blocked by** — None.

---

# P6 · The cats — a faster wag

ADR-014 §8, worklist item 4.

### 6.1 · Wag rate multiplier — **AFK**

**What to build.** One module constant in `catIdle.ts`, applied to `t` and nothing
else:

```ts
/** Gate 10.1 §4.3 — the owner asked for "a smidge" faster. One multiplier
 *  so all seven frequencies scale identically and every ratio between them
 *  (and CAT_B_RATE's 0.847) is preserved exactly. Editing the literals
 *  individually risks landing on a rational ratio and a visible beat. */
const WAG_RATE = 1.2;   // starting candidate
...
const t = elapsed * b.rate * WAG_RATE + b.phase;
```

It must scale `t`, **not `elapsed`** — `elapsed` is also the ear-flick clock
(`catIdle.ts:119-129`) and `FLICK_GAP_MIN`/`FLICK_GAP_SPAN` are specified in real
seconds. The header's "the fastest term in the whole driver has a ~12 s period"
sentence becomes false and is part of the change.

**Acceptance criteria**
- [ ] Rebuild the `.catcheck/` measurements from `headless-qa-notes.md` and confirm the
      three measurable properties survive: the two tails stay out of phase (Pearson r,
      plus share of frames moving opposite ways), autocorrelation over lags 2–120 s
      shows no near-repeat (**scale per-channel by amplitude, not by the flattened pose
      vector's spread** — the trap that reported a false 18 %), and peak tip speed in
      mm/s is reported before and after.
- [ ] `idleDensity` shedding still halves the wag (`CatMotion.tsx:83-90`) — poses
      bit-identical on the frames both a full-rate and a half-rate driver run.
- [ ] The header comment's period claim matches the shipped rate.

**Blocked by** — None.

### 6.2 · **HITL — is it the right speed?**

`headless-qa-notes.md` is explicit that "is the wag slow enough" is owner's-eyes-only:
headless renders this scene at 2–6 fps and cannot judge a cadence. The multiplier is a
starting candidate and this gate is where it is chosen.

**Ask the owner:** at chapter 3, is that the smidge? Faster, slower, or right?

**Blocked by** — 6.1.

---

# P7 · Close-out

### 7.1 · Docs reconcile — **AFK**

**What to build.** The nine-rung change contradicts prose in six places, and none of
them has an automated guard — no test file references `SHED_ORDER` or `LADDER`, so this
slice is the only thing keeping the record honest.

- [ ] `CLAUDE.md` — "ten rungs", and the `steam`-before-`idleDensity` sentence.
- [ ] `AGENTS.md` — "**ten rungs** since ADR-013 §7 added `steam`".
- [ ] `docs/design-system.md` — the ladder table and the `ladder-pacing` before/after.
- [ ] `src/components/workstation/fidelity.ts` — the `OFFER_AFTER_MS` comment's "ten
      EMA re-crossings … 17.5 s" (done in 4.1; re-check here).
- [ ] `src/components/workstation/scene/sheddable.ts` — the `steam` comment (done in
      4.1; re-check here).
- [ ] `docs/qa/headless-qa-notes.md` — the "three lines of copy on the entry frame"
      gotcha (now **four**: name, role, `press power`, skip line — P3), the
      `powerAnchor` position at 1440×900 (chapter 0 moved, P2), the note that
      `PowerOn`'s root opacity no longer governs the whole overlay (3.2), and add the
      tablet viewports to the matrix so the §8.2 hole is closed at the source.
- [ ] `docs/plans/implementation-plan-0009.md` §4.1 — its title-beat slice describes a
      component that no longer exists. Leave the record, but this plan is the successor
      and ADR-014 §9 says so; do not restore `TitleBeats` to satisfy the citation.
- [ ] `HANDOFF.md` — worklist items 1–5 struck, this branch's state recorded.
- [ ] `README.md` — only if it names the chapter table or the ladder.

**Blocked by** — 4.1, and whichever of P2/P3/P6 have landed.

### 7.2 · Regression sweep — **AFK**

Re-run the invariants gate 10.1 §0 verified at merge, because this branch touches the
lens, the room's lighting and the shed ladder:

- [ ] `npm run lint` and `npm run build` clean.
- [ ] `public/audio` and `out/audio` are `LICENSES.md` only.
- [ ] `public/pictures` is **46 files**.
- [ ] `LUMINANCE_CAP 0.7` and `CAST_MAX 2.6` intact.
- [ ] `painter.ts` still free of any `pictures.ts` import.
- [ ] The Gallery caption chunk still absent from `out/index.html`.
- [ ] The dock still latches and releases — `DockSwap`'s `ENGAGE_EPS` is a fraction of
      the runway and the runway is unchanged, but the **dock distance now moves with
      aspect** (1.2), so re-check the latch at a tablet aspect as well as at 1440×900.
- [ ] Zero Microsoft IP: the lamp is original geometry, no new sample files.

**Blocked by** — every AFK slice.

### 7.3 · **HITL — gate 11.1**

Full ride, owner's hardware, first-run state, **plus the iPad**. New checklist at
`docs/qa/11.1-opening-and-fit-checklist.md` following gate 10.1's shape — §0 for what
was proved offline, numbered sections per package, and an honest ledger of deliberate
non-fixes at the end.

**Blocked by** — 7.1, 7.2, and gates 1.4, 2.4, 4.3, 6.2.

---

## Risks

1. **The opening is a shot, and no agent can judge a shot.** 2.1 turns four of its
   properties into numbers — occlusion, near-plane crossing, keep-out clearance,
   subject sizes — and every one of those can pass on a frame that is simply bad. Gate
   2.4 is the real acceptance and the candidate poses in 2.2 are explicitly starting
   points. Budget for a second pass.
2. **The iPad fix is verified by arithmetic until 1.4.** Both root causes were found by
   reading, and the sweep in 1.1 proves the rect fits — but `headless-qa-notes.md`'s
   own standing lesson is that a viewport matrix is only as wide as its widest entry.
   iOS Safari's dynamic toolbar is *not* covered by any of this and may surface a
   second, separate defect at the gate.
3. **`PAN_HOLD_MS` / `PAN_DURATION_S` are settled numbers against a dead shot.** The
   temptation to "just retune them" while composing 2.2 is the exact failure ADR-014 §2
   forbids. They change only if the owner says so at 2.4.
4. **Nine rungs has no test.** The count lives in five prose locations and one array.
   7.1 is the guard, and if it is skipped the next agent inherits a codebase whose
   `CLAUDE.md` and `AGENTS.md` both lie about the ladder.
5. **Rotating a tablet swaps the shell mid-session** (1.3). Window positions are held
   in virtual units, so a window placed in landscape lands elsewhere in portrait. The
   touch shell solo-maximizes so it should be invisible — but it is a real behaviour
   change and 1.4 is where anyone finds out.
6. **The title card's dwell is bounded by the splash, not by taste.** 3.2's fade budget
   has ~2.7 s between the press and the splash, and roughly a second of that is gone
   before contact. If the owner wants the name to hold *longer* at gate 2.4, the only
   honest levers are the card's fade curve or covering the splash — and covering the
   splash is the thing ADR-013 §3a was written to prevent. Say so rather than
   quietly stretching it.
7. **Two of P3.2's criteria can only be met against P2's framing**, which lands later:
   whether the card collides with the ring, and whether it reads over the backdrop.
   3.2 can ship and be green against today's chapter 0 and still be wrong at gate 2.4.
   That is why 2.4 judges both packages together.

## Findings recorded, not fixed

- **No `<h1>` in the accessibility tree while the experience is mounted.**
  `Hero.tsx:51` holds the page's only `<h1>` and it sits inside `[data-floor]`, which
  `globals.css:182-190` sets to `display: none` for capable clients. The prerendered
  HTML still ships it, so SEO and the no-JS floor are fine (ADR-012 §9's actual
  claim) — but a screen-reader user riding the experience gets no page heading at all.
  Pre-existing, unrelated to this branch's changes, and **deliberately not fixed by
  3.2**: a heading that unmounts when the boot ends would be worse than none. Raise it
  at gate 7.3 as its own decision.
- **iOS Safari's dynamic viewport is unhandled.** The runway is `750vh` while
  ScrollTrigger measures `innerHeight`, and nothing in the repo uses `dvh`/`svh` or
  `visualViewport`; every overlay is pinned in `vh` (`PowerOn.tsx:323`,
  `TitleBeats`→3.2, `SignOff.tsx:71`, `DockSwap.tsx:429`). If gate 1.4 finds progress
  jumping when the toolbar collapses, that is a second defect and wants its own slice.

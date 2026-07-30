# ADR-013: Scene refinement — rigged arms, the power-press opening, and a lived-in room

## Status
Accepted — **amends ADR-012 §5 (chapter table) and §2 (character rig)**. Everything
else in ADR-012 stands unchanged: one store / two renderers (§4), zero Microsoft IP
(§10), the fidelity contract (§8), the confidentiality rules (§10), and the content
model in `src/lib/`. This is a refinement of the experience ADR-012 specified, not a
replacement for it.

## Date
2026-07-28

## Context

Gate 9.2 (`docs/qa/9.2-desktop-checklist.md`) passed with fixes and
`redesign-attempt2` merged to `main`. Two blockers were closed in session 13 (dock
sensitivity, scroll cue), but the owner's §15 answer to *"where did you get bored?"*
was deferred out of that gate and named in `HANDOFF.md` as **"the largest outstanding
piece of work"**:

> the beginning needs to change, the actual CPU on the table needs to be the first
> thing shown focused on the power button on the CPU, and the 3d model of myself needs
> to press the button with my arm and then camera should shift smoothly to the desktop
> and the rest of the animation, subtle scroll notification somewhere not obstructing
> the scene is needed i feel.

A follow-up review added five more items: the scroll cue is present but unreadable;
the figure types relentlessly and does nothing else; the mug is cold; there is a
gallery of personal photographs sitting unused in `assets-src/`; and the room has two
cats in the owner's life and none in the scene.

Reading the code turned that list into **one dependency and six leaves**. Three of the
requests — press the power button, use the mouse, drink from the mug — are the same
missing capability wearing three hats. `buildBody.ts` bakes the typing pose into
static capsule geometry computed from fixed joint coordinates at build time:

```ts
const upper = capsuleBetween(s, e, 0.047, tee, detail);
const forearm = capsuleBetween(e, w, 0.04, /* … */);
```

`capsuleBetween` derives length, orientation and midpoint from the two joints and
returns a finished `Mesh`. There is no shoulder pivot, no elbow pivot, and no way to
move a hand without rebuilding geometry. **The arm rig is the enabling dependency for
half of this branch**, and it is the reason these changes ship together rather than as
six independent fixes.

Two constraints from the existing design shaped the rest:

- **`buildHead.ts` models no eyes and no mouth**, deliberately — ADR-012 §2's "the
  face is never the hero", reinforced by gate 1.2 rejecting cheek geometry because it
  "read as eyeballs/modules at every size tried". The owner's request to reveal the
  face had to be honoured without contradicting that.
- **`assets-src/` is never shipped** (ADR-012 §3). A gallery of photographs that live
  only in `assets-src/` needs an explicit, reviewable path into `public/`.

## Decision

### 1. Both arms become two-bone rotational chains

`buildBody.ts` stops baking arm geometry in world space. Each arm becomes a nested
hierarchy of `Group` pivots:

```
shoulderPivot{R,L}        (at ARM_JOINTS.shoulder)
  └── upper arm mesh      (fixed length, built once along -Y)
      └── elbowPivot{R,L} (at the upper arm's far end)
          └── forearm mesh + hand{R,L}
```

Bone **lengths are fixed at build time** from the existing `ARM_JOINTS` coordinates,
so the typing pose is bit-identical to today's when both pivots are at their rest
rotations. Only rotations animate. This is what makes the rig cheap: no per-frame
geometry rebuild, no IK solver, no skinning, no morph targets — two quaternions per
arm, `slerp`ed.

**Why not the alternatives:**

- *Rebuild capsule geometry per frame from interpolated joints.* Capsule length is a
  function of joint distance, so moving a hand changes the bone's length unless you
  add an IK solver to preserve it. Rebuilding geometry every frame also violates the
  project's zero-per-frame-allocation rule (`experienceState.perf.heapDeltaPerSec`
  exists specifically to catch that).
- *Swap between two prebuilt arm subtrees with a cross-fade.* No in-between poses, so
  the hand teleports; and it doubles the arm's triangle count for the whole session.
- *Skinned mesh with bones.* Correct, general, and far more machinery than four
  rotations need. It would also mean rewriting `buildWardrobe.ts`, which currently
  derives the smartwatch transform from `ARM_JOINTS` directly.

`buildWardrobe.ts` reparents the smartwatch onto `elbowPivotL` so it rides the left
forearm instead of floating at a world-space coordinate the arm has left.

### 2. Chapter 0 gains scroll span; the boot still never scrubs

`chapters.ts` gives `power-on` a real `lengthVh` (was `0`). The camera path gains a
new keyframe at `p: 0` — a macro on the tower's power button — and the existing
extreme-CRT-close-up moves from `p: 0` to `REST_POINTS[0]`.

This looks like it contradicts ADR-012 §5's "scrubbing a boot backwards feels wrong
(owner-confirmed)". It does not, because **`PowerOn` already stops Lenis for the whole
boot** and releases it when the desktop settles. Chapter 0's span is therefore
scrubbed *after* the boot has finished, never during it. The visitor's experience is:
click → arm presses → LED → POST → desktop settles → *now* scroll carries the camera
off the button and onto the glass. The boot is still an unscrubbable auto-play beat;
it simply no longer sits at a scroll position with nowhere to go.

Everything downstream is derived, so nothing else needs editing: `REST_POINTS` is
computed from `lengthVh`, `cameraPath.ts` expresses every key except `p: 0` in terms
of `REST_POINTS`, `DOCK_REST_INDEX` is an index not a value, and
`Choreography`'s `signOffStart = REST_POINTS[4]` stays correct.

**Consequence to re-verify:** the runway gets longer, so `DockSwap`'s `ENGAGE_EPS`
(0.012 of the runway) covers a different pixel distance than the one the owner
signed off in session 13. The dock's latch needs a fresh pass at gate re-QA.

#### 2a. Amended (session 18): the camera *does* move during the boot

Built as written above, 2.1 and 2.3 exposed what the paragraph actually costs: with
the camera pinned to the button macro for the whole boot, the CRT is out of frame,
so the POST lines, the drive-chatter listing and the Win98 splash all play where the
visitor cannot see them. What is left is the LED, the sounds, and the screen's light
washing the tower face. That may be the better film — but it was never an explicit
decision, and it throws away a beat P3 built.

**Put to the owner at 2.3; they chose to see the POST.** So the camera now holds a
beat on the lit LED and then pans off the button onto the glass while the lines run.

This narrows §2's claim rather than reversing it. **The boot still never *scrubs*** —
Lenis is stopped for its whole duration and the visitor cannot drive. What moves is
an auto-play: `PowerOn` calls `lenis.scrollTo(REST_POINTS[0]px, { force: true })`,
which by design bypasses the stop guard, and ScrollTrigger then publishes progress
through the ordinary path. No new mechanism, and scroll is handed back with the page
genuinely parked at chapter 0's rest point rather than at a position the camera has
been faking away from.

**What this does cost:** the pan consumes chapter 0's 90 vh. The visitor's first
wheel notch now begins chapter 1. Gate 2.4's question changes shape with it — from
"is 90 vh the right amount of *scroll* between the button and the glass" to "is it
the right amount of *camera move*". The hold and the travel are expressed as
fractions of the POST phase so the shot keeps its proportions if `bootScript` grows,
but they are a shot, and they want the owner's eye.

### 3. The entry gesture stays in the DOM, but as a hotspot over the 3D button

The visitor must still click something: `unlockAudio()` has to run synchronously
inside a real user gesture or the autoplay policy refuses the AudioContext, and
`PowerOn.tsx`'s comment already records that hard-won detail.

So `PowerOn` keeps its `<button>` and loses its full-screen scrim. A small component
inside the Canvas projects the tower's power-button world position to screen
coordinates each frame; the DOM button pins itself there as a glowing ring.

**Why not raycast the 3D mesh directly:** the canvas wrapper is
`fixed inset-0 -z-10`, deliberately — it sits behind the page so the runway owns
scroll. Clicks land on the document, not the canvas. Raising the canvas to catch one
click would mean lowering it again afterwards and fighting the scroll model for the
rest of the ride. Keeping the affordance in the DOM also keeps its accessible name,
its focus ring, and its keyboard activation for free.

#### 3a. Amended (gate 3.3, session 21): the skip announces itself

The any-key/any-click boot skip shipped at 2.3 as a deliberately *undiscoverable*
escape hatch — the reasoning being that "press any key to skip" laid over "a dark
room and one glowing button" would undo the composition §3 had just bought. That
left the discoverability half unresolved through two gates (2.4 and 3.3 §4.3).

**The owner answered it at gate 3.3: announce it, on the entry frame.** So the copy
sits under `press power` at the bottom of the shot — muted and lower-case, the way
out rather than the invitation — and there is still **nothing over the boot**, which
is what the original objection was actually about. The POST and the splash play
uncovered.

That placement has one consequence worth stating, because it is a behaviour change
and not just copy: **the key path is now live at the `idle` stage as well**, not only
while the boot runs. Copy that promises a skip has to be true where it is read. It
routes through the same `skip()` the returning visitor's link calls, so the
never-pressed case was already an exercised path — including `unlockAudio()`, which
a `keydown` satisfies as a user gesture just as a click does.

Two exclusions the announcement makes necessary, both narrowing "any key":

- **Enter and Space on a focused control are that control's.** The power button is
  `autoFocus`ed, so those keys are how a keyboard visitor presses power; reading them
  as "skip" would take the opening away from the one visitor who asked to see it.
- **F1–F12 belong to the browser.** The 3.3 checklist itself opens DevTools on the
  entry frame, so F12 discarding the opening is a trap rather than an intent.

**The pointer half stays boot-only and stays unannounced.** Before the press the ring
is the only thing in the frame that answers a pointer, and a stray click on the
backdrop costing the whole opening would be a worse trade than the one §4.3 asked
for.

### 4. The face is revealed by lighting, not by geometry

Chapter 2's orbit continues past profile to a **three-quarter front angle, key-lit by
the CRT from off-screen**, with the eye zone falling into shadow. The visitor reads a
face — beard, nose, hoop, earbud, curls, the shape of a person — without ever being
shown the eyes that were never modelled.

ADR-012 §2's "the face is never the hero" **stands unamended**. No eye, mouth, or
cheek geometry is added. This was the owner's explicit choice over building a real
face, which would have reopened gate 1.2's look-dev loop and risked exactly the
uncanny result that got cheek mounds cut the first time.

### 5. Idle behaviour becomes a scheduler, not a single loop

`typing.ts` currently runs eight independent finger timers plus a lean-back every
60–110 s, and nothing else — the figure types without pause for the entire ride.

It gains a **behaviour scheduler**: a seeded state machine over `typing`, `mouse`,
`mug`, and `lean`, with typing as the default state and the others firing at
intervals. Each non-typing behaviour targets its arm's two pivots with an
ease-in/hold/ease-out envelope, and typing suspends on the arm that is busy — the
other hand keeps working, which is what people actually do.

The tap timestamps that feed `AudioTextures`' clack sync go on writing to
`typingState`, so the audio layer needs no changes: fewer taps simply means fewer
clacks, which is the correct behaviour and not a coincidence.

### 6. The mug is lifted, which needs a prop handle across the module boundary

The owner chose lift-and-sip over reach-and-touch. The mug is built by `RoomScene`
and the arm is driven by `Figure`; these are separate component trees that share no
props today.

They get a **mutable prop-handle singleton** (`scene/propHandles.ts`) following the
established `experienceState`/`effectsState` pattern: `RoomScene` publishes the mug
`Group` on mount and nulls it on unmount; the behaviour scheduler and the steam
emitter both read it. Frame loops read a singleton; no React state, no context, no
prop drilling through a `<primitive>`.

Every writer to a given transform must be single. `idle.ts` owns head rotation, so
the sip's head tilt is **not** written directly — `idle.ts` gains an additive offset
field the scheduler sets, keeping one writer for `head.rotation`.

### 7. Mug steam is a new shed rung, placed late

Steam is a small additive `Points` system anchored to the mug handle, reusing
`Atmosphere.tsx`'s dust pattern (preallocated arrays, zero per-frame allocation,
seeded from `prng.ts`).

It registers in `sheddable.ts` as its own flag placed **immediately before
`idleDensity`** — the last rung before the resolution knobs.

**Why not fold it into the existing `dust` flag** (which would have kept the ladder at
nine rungs and changed no pacing): `dust` sheds at rung 2, very early. Steam is a
hero detail the owner asked for by name, and it is what makes the desk read as
occupied rather than staged. Losing it on the second rung would be shedding the wrong
thing cheaply.

**Consequence:** `LADDER` grows from 9 rungs to 10. At a sustained 20 fps the full
walk-down to the static-floor offer moves from ~64 s to roughly ~69 s. Checklist
§11c already asks whether 64 s is too patient; this makes that question slightly more
pressing rather than less, and it is an owner call at re-QA, not an agent guess.

### 8. Two cats on a cat tree, animated by the room's own idle driver

A procedural cat tree (`builders/catTree.ts`) stands against the +X wall beside the
window, its top platform at sill height. Two procedural cats (`builders/cat.ts`) sit
on it facing the glass. Tails wag on slow, incommensurate sines so the loop is never
visible — the same technique `idle.ts` uses for head sway.

The cats are **Nimbus and Ivy**, the owner's actual cats; they differ by seed and
coat colour, matched to the reference photographs in `assets-src/personal/`.

`RoomScene` has no frame loop today. Rather than give the whole static room one, the
tails are driven by a small `catIdle.ts` driver in the shape of `idle.ts` and
`typing.ts` — allocated once, `update()` allocates nothing — called from a thin
component. The wag rides `effectsState.idleDensity`, the same flag that halves the
figure's idle rate, because a room that goes still should go still all at once.

**Camera consequence:** placing the tree is not enough to make it seen. Chapter 3's
wide shot is composed away from the window wall, so its keyframe shifts to bring the
window, the tree and the cats into the establishing frame. That is the shot ADR-012
§5 describes as "*this is where it started*", and a pair of cats watching the dusk is
squarely on that beat.

### 9. The Gallery ships downscaled copies into `public/`, never `assets-src/` itself

A `Gallery` desktop icon opens a photo browser: thumbnail grid, click to view,
next/previous, caption and count in a period status bar. It follows ADR-012 §8's
lazy-app contract exactly — its own `registerNN.ts` chunk behind
`lazyApps.ts`, so it stays out of the initial bundle.

> **AMENDED 2026-07-30 by gate 6.2 — the set is 23, not 29, and the size band
> below is superseded.** The owner reviewed the selection at the gate written for
> exactly that purpose and pulled six: `cat-04-nimbus`, `ride-04-maharashtra`,
> `ride-05-hogenakkal`, `ride-06-tamil-nadu`, `ride-10-west-coast`,
> `ride-13-kashmir`. Two ids were corrected (`hike-04-goa` → `hike-05-goa` for a
> duplicate number, `ride-07-pondicherry` → `ride-07-goa` for the wrong place),
> the sources being untouched because ids are authored in the allow-list rather
> than derived from filenames. **23 photographs ship, at 3.39 MB across 46
> files** — see §9a. `docs/qa/6.2-picture-review.md` is the authority on the set,
> the ids and the captions; this section is not. **The six pulls are the owner's
> call at a gate and must not be restored on this ADR's authority.**

29 photographs ship: 8 cats, 17 rides and hikes, workspace, guitar, and the two
existing portraits. Originals run 200 KB – 3.3 MB, which is not shippable, and the
repo has no image pipeline (`scripts/` holds only `diagrams-light.js`). So a one-off
`scripts/build-pictures.mjs` (using `sharp` as a **devDependency** — it never enters
the runtime bundle) produces a bounded-width JPEG plus a thumbnail per photograph
into `public/pictures/`. The script is committed so the set is reproducible; its
output is committed so the build stays a plain static export with no new build step.

**Boundaries that are not negotiable here:**

- **No tattoo reference photography.** `assets-src/workstation/tattoo01–04.jpg` are
  ADR-012 §3 source material. The build script enumerates an explicit allow-list
  and never globs a directory. **The boundary is the four close-ups, not the word
  "tattoo"** — plan-0009 §1.3's acceptance criterion reads "no image file under
  `public/` contains tattoo photography", and taken literally that has been false
  since long before this branch: `aravind-2.jpg` has always shipped showing the
  owner's tattooed forearms. Three of the 23 (`guitar-01`, `workspace-01`,
  `cat-02-nimbus`) show them too, each consciously cleared by the owner at gate
  6.2. **This has been re-flagged as a breach in three separate sessions; it is
  not one.** The criterion means *reference* photography, which is what this
  heading says and what plan-0009's own preamble says.
- **No client material.** These are personal photographs — cats, motorcycles, hills,
  a desk, a guitar. No client names, no client data, no client screenshots
  (ADR-012 §10).
- **No AI concept sheets.** `assets-src/workstation/ChatGPT Image *.png` stay source.

The painter draws windows as chrome plus the appId in grey and has no per-app content
renderer; the Gallery does not change that. Its window on the CRT gets a generic
thumbnail-grid suggestion in `paintWindow`, and the real photographs exist only in
the docked DOM view. **This is consistent with ADR-012 §4, not a violation of it** —
§4's parity is a *store* parity ("the swap is a view change, not a state handoff"),
and the store knows the window is open in both renderers. It was never a pixel parity;
no app has one.

### 9a. What actually shipped (2026-07-30, gates 6.2 and 8.1)

Recorded here because §9 above was written before the pipeline was built and the
set was reviewed, and three of its numbers moved.

- **23 photographs, 46 files, 3.39 MB** in `public/pictures/` — replacing §9's
  "roughly 4–5 MB" and the §11 consequence line that quotes it. The band was
  budgeted for 29; at 23 the same encode spends less, and the owner chose to
  **keep the quality where it is rather than spend the spare budget** (*"quality
  is also fine"*, 2026-07-30). So `q84` stands and the band moves down to match
  what ships. Re-measure only if the set changes; the measurement behind `q84` is
  specific to 1200×900 viewers and 192×144 thumbnails.
- **`src/lib/pictures.ts` is the single source** for ids, groups, shipped
  dimensions and captions, and it is answerable to `docs/qa/6.2-picture-review.md`
  §2 — not to this ADR. Dimensions come from `scripts/pictures-manifest.tsv`;
  `npm run pictures` cross-checks the two and names any drift.
- **The pipeline does not redact number plates.** Every plate visible in the
  shipped set (`ride-09`, `ride-11`, and the KTM in `ride-12`) was blacked out by
  hand *in the source*. A photograph added later needs the same hand — this is a
  standing constraint on adding to the allow-list and it is written down nowhere
  else.
- **Captions are the owner's voice, with two rules from the gate**: a caption may
  only joke about what is visible in its own photograph, and nothing is asserted
  about other people in frame. An agent adding a photograph adds a caption *slot*,
  not a caption.
- **ADR-012 §10 and the confidentiality rule are intact and this was checked, not
  assumed:** no client material, no readable client name, no watermark and no
  personal name in the 23 (the one watermarked photograph carrying a third party's
  name was among the six pulls), and 0 of 46 shipped files carry EXIF/XMP/ICC.
- **The painter's suggestion is unreachable, and that is accepted.** 6.5 built the
  thumbnail-grid suggestion the paragraph above specifies, and verification then
  found no visitor can see it: undocking requires every window closed or minimized
  (`DockSwap`), the painter skips minimized windows, and every window-opening path
  lives in the docked DOM shell. So the CRT never has a window body on it — which
  also means the grey-appId fallback was never visible either. The owner chose to
  **keep the code** (2026-07-30). Do not plan a future slice around painting a
  window body, and do not "fix" it by painting minimized windows.

### 10. The scroll cue gets contrast, not new logic

The cue is not broken. `ScrollHint.tsx`'s gates are correct and its boot-phase gate
does reach `"desktop"`. It is *invisible*, which is a different defect: it reuses the
static floor's mark, and those tokens were chosen against the floor's flat `#050507`
background. `bg-line` is `rgba(162, 168, 180, 0.12)` on a 1 px hairline and the label
is `text-ink-subtle` `#6a7080` at 10 px. At journey start the camera is inside the
CRT's glow, so a 12 %-alpha hairline over blooming phosphor is simply not there.

Three compounding causes, all cosmetic:

1. Token contrast, as above.
2. `@keyframes scroll-cue` parks its gradient off-screen for ~40 % of each 2.2 s
   cycle, so the only real signal is absent for nearly a second at a time.
3. The fade is exponential (`opacity += (target − opacity) * delta/450`), so it
   asymptotes toward 1 and never arrives — the first ~1.5 s are faint by construction.

The fix is a legibility pass — a scrim behind the mark so it survives a bright
backdrop, brighter values chosen against the *scene* rather than the floor, and a
pulse that is visible for more of its cycle. The gating logic is untouched.

#### 10a. Amended (session 18): one gate change, made deliberately

"Contrast, not new logic" held for P7 itself — `ScrollHint`'s gating is still
byte-for-byte what it was. But P7 made the cue visible and thereby exposed a
long-standing overlap: at p ≈ 0.94 the "Scroll" label sits ~30 px under the SignOff
card's contact links and competes with them. The cue has always run to `END_P`
0.995; the overlap was simply invisible before.

Closing it means moving a gate, which is what §10 put out of scope. **Put to the
owner at 2.3; they chose to drop `END_P` below SignOff's start** rather than teach
the cue a SignOff term. `END_P` is now `SIGNOFF_START_P`, exported from `SignOff.tsx`
and derived from the same two constants that place its fade — so retuning
`FADE_START` moves both and they cannot drift. By the time the contact card is
fading in there is nothing further to scroll to and the instruction is spent.

While here, one doc/code drift is corrected in the QA record rather than the code:
checklist §17b says the cue "fades in ~0.9 s after the desktop settles", but
`stillSince` is initialised at component mount and the boot never moves
`scrollProgress`, so it begins ramping on the first `"desktop"` frame. Harmless, but
the two should not disagree.

## Consequences

- **The rig is load-bearing.** Power press, mouse use and mug sip all fail together if
  the two-bone chain is wrong. It ships first and is verified against the existing
  typing pose before anything is animated: at rest rotations the figure must be
  pixel-identical to `main`.
- **Gate 9.2's signed-off dock needs re-QA.** §2 changes the runway length, which
  changes what `ENGAGE_EPS` means in pixels. §17d already flagged the 350 ms pause
  threshold as owner-verified-only; that verification is now stale.
- **The fidelity ladder gains a rung** and its pacing question gets sharper (§7).
- **`RoomScene` and `Figure` are no longer fully independent.** They share one mutable
  handle, in one direction (Room publishes, Figure consumes). Keeping that direction
  one-way is what stops it from becoming a general coupling.
- **`public/` grows by ~~roughly 4–5 MB~~ 3.39 MB** of photographs (46 files, 23
  photographs — see §9a; the 4–5 MB estimate was for the 29-photograph set gate 6.2
  cut down). They are static files fetched only when the Gallery window opens, so
  the initial bundle and the journey are unaffected — but the repo is meaningfully
  larger and the Gallery is the first app that ships raster assets at all.
- **Chapter 2's beat gets stronger, not weaker.** Opening on the button with only a
  forearm in frame means the tattoo is the first thing the visitor ever sees, and the
  person attached to it is still a reveal.

## Alternatives considered for the branch as a whole

**Ship the six leaves independently and skip the rig**, faking the power press with a
camera cut and dropping the mouse/mug interactions. Rejected: it delivers the
cheapest interpretation of the owner's clearest request, and the "types relentlessly"
note would go unanswered. The rig is a day of work that unlocks three items.

**Author the character in a DCC tool now that animation is needed.** Rejected on
ADR-012's founding constraint — no Blender, everything runtime-procedural. Four
animated rotations do not justify reversing that.

**Put the Gallery photographs on an external host** to keep the repo small. Rejected:
ADR-001 ships a static export with no external dependencies, and hotlinking personal
photographs from a third party adds a privacy surface for no benefit.

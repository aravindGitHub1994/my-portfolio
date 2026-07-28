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

29 photographs ship: 8 cats, 17 rides and hikes, workspace, guitar, and the two
existing portraits. Originals run 200 KB – 3.3 MB, which is not shippable, and the
repo has no image pipeline (`scripts/` holds only `diagrams-light.js`). So a one-off
`scripts/build-pictures.mjs` (using `sharp` as a **devDependency** — it never enters
the runtime bundle) produces a bounded-width JPEG plus a thumbnail per photograph
into `public/pictures/`. The script is committed so the set is reproducible; its
output is committed so the build stays a plain static export with no new build step.

**Boundaries that are not negotiable here:**

- **No tattoo reference photography.** `assets-src/workstation/tattoo01–04.jpg` are
  ADR-012 §3 source material; plan-0009's acceptance criterion is literally "no image
  file under `public/` contains tattoo photography". The build script enumerates an
  explicit allow-list and never globs a directory.
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
- **`public/` grows by roughly 4–5 MB** of photographs. They are static files fetched
  only when the Gallery window opens, so the initial bundle and the journey are
  unaffected — but the repo is meaningfully larger and the Gallery is the first app
  that ships raster assets at all.
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

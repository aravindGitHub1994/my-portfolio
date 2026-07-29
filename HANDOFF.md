# HANDOFF — `scene-refinement` (2026-07-30, session 21 wrap)

> For the next agent session. **ADR-012's plan is finished and merged.**
> `redesign-attempt2` → `main` @ `dac6de4`; every gate (1.2, 2.3, 4.3, 9.2)
> is owner-PASSED. The 9.2 record is `docs/qa/9.2-desktop-checklist.md`.
>
> **GATE 3.3 IS PASSED.** The owner ran the whole-ride camera gate and
> ticked every item in §1, §2, §3 and §5 — the record, including their
> answers to the five §4 questions, is
> **`docs/qa/3.3-camera-ride-checklist.md`**. **P3 is closed.**
>
> **Everything is committed and green.** `assets-src/` is now **gitignored**
> rather than merely untracked, so the working tree is genuinely clean.
> **P1, P2, P3, P4, P5 and P7 are all done**, gates 1.3, 2.4 and 3.3 are
> owner-PASSED, and **P6 is most of the way** — 6.1 (the picture pipeline),
> 6.3 (the Gallery glyph) and now **6.2 (the owner's picture-and-caption
> review) are all landed.**
>
> **GATE 6.2 IS ANSWERED, and it changed the set: 29 photographs → 23.** The
> owner pulled six, renamed two ids and set the caption register; all 23
> captions are drafted and in the gate document. **`6a56d7f` carries it.**
> `docs/qa/6.2-picture-review.md` is the record — read §2 for the caption
> strings, §3c for grid order, §3a/§3b for what the pulls and renames did.
> **6.4 is unblocked** apart from the owner ticking the verdict box.
>
> **THE ONE THING TO KNOW BEFORE TOUCHING P6: "all 29 photographs ship" is
> DEAD.** It is recorded as settled in ADR-013, in this file's own
> "do not re-litigate" list, and in the §9 budget — and the gate that existed
> to review it cut six. **Do not restore them on the ADR's authority.**
> Correcting those documents is now the first item in **8.2**.
>
> **Four of the five 3.3 §4 answers were "leave it",** which promotes a set of
> numbers from open threads to settled ones — see "Settled by gate 3.3"
> under Unresolved Threads before retuning anything in the opening.
>
> **Owner-closed since:** 5.2's tail wag (*"the tail wag is fine"*). **Still
> owner-unseen:** 4.3's announced boot skip, built after their ride, so the
> entry frame they passed is not quite the one that ships. Everything else
> recorded here from sessions 20–21 was either owner-approved in the browser
> or proved offline; say which is which when you report.
>
> **The dock's recorded risk was overstated** and is now spot-checked — see
> Unresolved Threads before treating 8.1 as the big job three handoffs called
> it.

## Current Status

- Branch **`scene-refinement`**, cut from `main` @ `dac6de4`.
- **Plan-0010's breakdown is APPROVED by the owner as written** (session 15).
  Build to it — dependency graph, slice boundaries, acceptance criteria as
  committed. This unblocks everything past 1.1.
- **Gate 3.3 PASSED** (owner, 2026-07-30, on the production static export) —
  **P3 is closed**, and with it the last camera question on this branch.
  Record and §4 answers: `docs/qa/3.3-camera-ride-checklist.md`.
- **Gate 1.3 PASSED** (owner, 2026-07-29) — P1 is closed. **P7 is
  owner-closed** (confirmed on the dev server; recorded in checklist §17b).
- **Gate 2.4 PASSED** (owner, 2026-07-29, checked in the browser) — P2 is
  closed. **Read the caveat under "Unresolved Threads": the gate was passed
  as a whole, and the three specific questions this branch raised inside it
  were not answered one by one.** Do not treat them as decided.
- **Working tree is clean.** Everything below is committed; lint, `tsc` and
  `npm run build` are green at HEAD. Untracked `assets-src/` stays untracked.
- **Gate 6.2 ANSWERED** (owner, 2026-07-30) — the set is **23 photographs at
  3.39 MB**, two ids corrected, 23 captions drafted and three of them rewritten
  to the owner's corrections. Record: `docs/qa/6.2-picture-review.md`. **The
  verdict box is still unticked** — everything it asks is answered, but the mark
  itself is the owner's.
- Commits on the branch, newest first:
  - `6a56d7f` — **gate 6.2** (six photographs pulled, two ids renamed, 23
    captions; supersedes "all 29 ship")
  - `5e7facc` — docs (the dock spot-check)
  - `c1e9e2e` — **slice 6.3** (the Gallery glyph, in both renderers)
  - `5e16fb5` — **slice 6.1** (the picture pipeline; 29 photographs, 4.34 MB)
  - `d0b6e28` — **slice 5.2** (the tail wag and the ear flick)
  - `0320d32` — **gate 3.3 PASSED + slice 4.3's answer** (the announced skip)
  - `1c47a59` — docs (the 3.3 checklist, HANDOFF pointing at it)
  - `ad48a47` — **slice 3.1** (chapter 2 becomes a face reveal)
  - `e7d7a91` — docs (the session-20 wrap)
  - `fc8a413` — **slice 3.2** (chapter 3 reframed onto the window wall)
  - `612371b` — **slice 5.1** (cat tree, Nimbus and Ivy)
  - `a98f694` — **slice 4.3** (mug steam; the ladder is ten rungs)
  - `5deadce` — docs (handoff refresh)
  - `358e2bd` — docs (gate 2.4 + the 4.2 wrap)
  - `16199d1` — **slice 4.2** (prop handle, the sip, the head tilt)
  - `657f22c` — docs (ADR-013 §2a and §10a)
  - `edab2bc` — **the three owner calls on 2.3** (boot pan, cue/SignOff
    gate, boot skip)
  - `d075597` — **slice 2.3** (the press)
  - `bd95003` / `53776f6` / `3b87f43` / `cd9abc5` — docs
  - `dc3c6bb` — **slice 4.1** (behaviour scheduler; taps suspend per arm)
    *(4.1 predates 2.3 in the log — it was taken out of plan order)*
  - `e02de5c` — **slice 2.2** (power hotspot pinned over the 3D button)
  - `f6cd25b` — **slice 2.1** (chapter 0 gains scroll span; opening frame)
  - `d10aac6` — **slice 1.2** (`armPose.ts`, the driver that moves the rig)
  - `7f1722c` — **P7 complete** (7.1 scroll-cue contrast + 7.2 QA-record fix)
  - `0784e3d` — **slice 1.1** (two-bone arm rig)
  - `28410fc` — ADR-013 + plan-0010
- A dev server may still be running on **3004** from session 18. Sessions
  19–21 did not use it: session 21 verified against a **production static
  export served by `npx serve out -l 3005`**, which is what gate 3.3 asks for
  and the only way to see what actually ships (`__armPose`, `__sipNow`,
  `__fidelity` and the perf counter are all stripped from a production
  build). `EADDRINUSE` on either port → use theirs. **Ask before stopping
  anything.** A `serve` on 3005 was left running by session 21.

### What 2.3 actually did — the press

`src/lib/powerPress.ts` is the ordering, and it is **pure**: no DOM, no
three.js, no timer of its own. It is ticked with a delta and the rig's
contact flag and reaches the world through two hooks — one from the
in-Canvas rig (how to move an arm it cannot see), one from `PowerOn`
(what to do when the finger lands, i.e. start the boot). That split puts
click → reach → contact → depress → LED → thunk in one readable file
while leaving the boot controller's lifetime with the component that
mounts it.

**The load-bearing beat: nothing happens on the click except the arm
starting to move.** The boot sequencer — and with it the degauss thunk,
the POST and the LED, all of which hang off `win98State`'s phase — starts
on CONTACT, ~0.55 s later. Sound landing on the click instead of on the
fingertip is the one thing that would make this read as a UI button
rather than as a hand pressing a switch.

`builders/TowerPower.tsx` is the scene half **and the machine's only
ticker**. Two signals, deliberately separate:

- **The button** follows `powerPressState.depress` — the fingertip. 2 mm.
- **The LED** follows `win98State.phase` — the machine, not the finger.
  That is the honest source, and it means the lamp and the thunk cannot
  drift apart, because `attachShellCues` already hangs the thunk off the
  same phase change. There is no second timeline to keep in sync, and an
  auto-booting harness lights its LED for free.

The tower had no LED at all; the CRT's was `materials.metal` and had
**never lit** — a grey dot beside a glowing tube that chapter 1's close-up
sits right on. Both now share one `materials.led` instance, emissive only,
above Bloom's 0.68 threshold so the dark-to-green pop reads in a dark
room. **Emissive adds no light to the room**, so the gate-2.3 brightness
contract is untouched. Split the instance if the two lamps ever need to
disagree.

`armPoseRef` (in `armPose.ts`, published by `Figure`) is how a component
in the RoomScene subtree moves an arm the character owns — the
`experienceState` pattern, read **lazily** so mount order does not matter.

`typing.ts` gained the gate the last handoff asked for. `busy()` stopped
behaviours *overlapping* the press; nothing stopped one starting a second
*before* it. The entry gesture now holds the whole figure from `PowerOn`
mounting until the desktop settles — no behaviours, **and no keystrokes**,
because nobody types on a machine that is off (and since 6.2's clacks ride
taps, that is also what keeps the keyboard silent under the POST). It is a
*hold*, not a block: `nextBehaviourAt` rides the frozen clock, so the
seeded first gap is measured from the desktop settling rather than burned
on the entry screen.

`PowerOn` keeps a 3 s watchdog on `forcePowerContact`. The machine ticks
from inside the Canvas, so a room that failed to mount would leave a click
doing nothing at all — the worst failure this page has.

### The three calls the owner made at 2.3

**1. The POST is seen, not just heard** (amends ADR-013 §2 — written up as
the new §2a). The camera holds a beat on the lit LED, then pans off the
button onto the glass while the lines run. **The boot still never
*scrubs***: Lenis is stopped throughout and the visitor cannot drive. What
moves is an auto-play — `lenis.scrollTo(REST_POINTS[0]px, { force: true })`,
which bypasses the stop guard by design; ScrollTrigger then publishes
progress through the ordinary path. **No new mechanism.** Verified in the
Lenis source rather than its type docs: the guard is
`(isStopped || isLocked) && !force`, and `raf()` advances the animation
with no `isStopped` check at all.

**This consumes chapter 0's 90 vh.** The visitor's first wheel notch now
begins chapter 1, so 2.4's question changes shape: not "is 90 vh the right
amount of *scroll* between the button and the glass" but "…the right
amount of *camera move*". The hold and travel are fractions of the POST
phase so the shot keeps its proportions if `bootScript` grows — **but they
are a shot, and they are the first thing to retune at 2.4.**

**2. The scroll cue stops where SignOff starts.** `END_P` was 0.995; it is
now `SIGNOFF_START_P`, exported from `SignOff.tsx` and derived from the
same two constants that place its fade, so retuning `FADE_START` moves
both and they cannot drift. Closes the overlap P7 exposed. (ADR-013 §10a.)

**3. Any key or click skips the boot.** Plan-0010 §2.3 lists this path but
it had never existed — the only skip was the returning visitor's link, and
that is disabled the moment the overlay fades. Now global while the boot
runs, first-time visitors included, landing the page at `REST_POINTS[0]`
so a mid-pan skip does not hand scroll back at a frame nobody composed.
Tab and the modifier keys are excluded (orientation, not intent), as is a
pointerdown on any button or link (the mute toggle is reachable throughout
the boot by design).

**It is an undiscoverable escape hatch.** "Press any key to skip" sitting
over "a dark room and one glowing button" would undo what 2.2 bought.
**Whether it should announce itself is a 2.4 question** — the owner picked
the behaviour without resolving the discoverability half.

### How 2.3 was verified

**Offline first** (the 1.2/4.1 pattern — a browser at 2–6 fps is the worst
instrument for beats 70–550 ms apart). The real machine, the real
`createArmPose` on the real `buildBody` rig and the real scheduler, at a
simulated 60 fps:

- the click alone does nothing but start the arm; boot is **+0.567 s**
  (one ease-in plus one frame), never 0;
- contact and boot are the **same frame**, and the fingertip is **0.00 mm**
  from `POWER_BUTTON` when they fire;
- the button never sinks before the machine wakes; full travel at
  +0.083 s; springs back at +0.550 s, after the 0.45 s hold;
- 30 s parked on the entry screen — past the scheduler's 18–38 s first gap
  — produces **zero taps and zero behaviours**; the first behaviour after
  release lands at +30.7 s;
- skip mid-reach returns the arm to **bit-exact** rest and releases the
  figure;
- with **no figure at all** the press still boots the machine, at the 1.4 s
  reach timeout;
- a **mouse** reach's `contact` cannot trip the press (the flag is
  qualified by pose);
- nothing retained over 200 k frames.

**Then wiring, headless at 1440×900** — the one thing a pure harness cannot
prove, namely that the parts are mounted and talking:

- `busy("R")` goes true **1.28 s after the click**, which exercises the
  whole chain end to end: PowerOn → `requestPowerPress` → `attachPowerArm`
  (so `TowerPower` is mounted) → `armPoseRef` (so `Figure` published it) →
  `goTo`;
- progress runs 0 → **0.12** and scrollY 0 → **702 px** during the boot —
  the pan landed exactly on `REST_POINTS[0]` (0.12 × 5850);
- the entry unmounts and scroll is released with the page parked there.

**Two harness notes worth carrying.** (a) The `heapUsed` trap bit again:
the allocation check read **−457 KB** and failed a `Math.abs` assertion —
memory *freed*, not leaked. Assert growth only. (b) The 4.1 ride figures
recorded above (141 — mouse 57, mug 48, lean 36) are **session 17's
counting method**. A pose-transition-edge counter gives 138 / 56 / 47 / 35.
Running the same script against `HEAD`'s `typing.ts` and the new one gave
**identical** numbers and 54 436 taps both ways — which is the check that
actually matters. **Compare old-vs-new; do not chase the absolute.**

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

### What 4.2 actually did — the mug is drunk from

`scene/propHandles.ts` is the noticeboard ADR-013 §6 asks for. `RoomScene`
publishes the mug `Group` and retracts on unmount; **`RoomScene` imports
nothing from `character/`**, which is the acceptance criterion and the
reason `?scene=room` is still a set that does not need a person in it.

`character/mugSip.ts` is the sequence, the carry and the head tilt. Four
legs — handle, mouth, handle, home — each its own `goTo`, advanced on the
driver's `contact` report rather than a private timer (2.3's rule: the beat
belongs to where the hand is, not to a clock beside it). `armPose.ts` gains
**`HOLD_UNTIL_RELEASED`** (Infinity, so the `t >= holdS` test needs no new
branch) because an arm that fell home between legs would set the mug down
halfway through drinking from it. Whoever passes it owns bringing the arm
back.

**Three decisions worth not re-litigating:**

1. **The mug is driven, never re-parented.** `attach()` is one line and is
   wrong: it moves *ownership*, and `Figure` and `RoomScene` each dispose
   their subtree by traversing their own root. A `detail` change mid-sip —
   **which the fidelity ladder can trigger by itself** — would then dispose
   the mug's geometry twice or never, depending on which tree it was in.
   Driving the transform leaves the mug a child of the room for its whole
   life, so no unmount order can go wrong. Drift is impossible by
   construction rather than by care: the carry never integrates, and the
   set-down copies back the exact TRS captured at the pick-up.
2. **The tilt clamp is the wrist the rig does not have.** A mug welded to
   the hand is tipped by however far the forearm swung. Measured across
   every reachable target × the full ±1.6 rad of swivel: **59–136°**, with
   59° the flattest the rig can reach — the mug arrives at the mouth
   pouring and the coffee disc pokes out through the wall. So the prop
   holds the last few degrees: past 28° the carry gives way, below it stays
   **exactly rigid**, which means it does nothing at all at the grab and
   the set-down. It costs a handle that turns slightly in the fingers at
   the top of the lift. **Do not "fix" the tilt by moving `SIP_GRIP` — it
   is not reachable from there.**
3. **`MUG_GRIP` is still an authored constant, not derived from the live
   handle.** The previous handoff expected 4.2 to replace it. It should
   not: poses are solved **once, at driver creation** (ADR-013 §1), and
   deriving the grip from a `Group` that mounts on its own schedule would
   make the solve depend on mount order and re-run per room mount. The mug
   never moves at rest, so the constant is exact. The handle earns its keep
   by moving the mug, which is the thing a constant genuinely cannot do.

**`SIP_GRIP` was solved, and the inherited one was wrong.** The working
tree carried an unverified `SIP_GRIP` from an interrupted session whose
doc comment asserted "rim 24 mm from the mouth, 34° tilt". Measured, that
constant put the rim **196 mm** from the mouth at **68.6°** and dipped
1.8 mm through the desk. The replacement comes from a sweep of 3 366
fingertip targets × 17 swivels scored by where the **mug** ends up, not the
hand: rim **24.8 mm** from the lips, **54.5 mm** clear of the skull,
**305 mm** clear of the keyboard. Two things that sweep settled —
**the lips are the front face of `buildBeard`'s mustache box** (aiming at
the head's centre drives the rim 22 mm into the beard), and the swivel is
nonzero here alone because the sip is the only pose whose *hand
orientation* matters.

`idle.ts` gains `headOffset` (additive pitch + yaw). The sip states an
offset and the sway adds it, so `head.rotation` keeps exactly one writer.
**The setter owns the easing** — nothing in `idle.ts` smooths it.

Verified offline against the real modules at a simulated 60 fps, 22
assertions, all passing: ten sips leave the mug **bit-identical** (max
component drift 0) and the four pivots at exact identity; rim 24.7 mm at
the hold; nothing enters the desk, the head or the keyboard; the carried
legs never dip below the resting hand, so **gate 1.3's no-arc constraint
holds without a via-point**; no snap into or out of the tilt (max
0.0038 rad/frame) and the offset lands on exactly zero; the sequence still
completes with **no mug published** and the arm still comes home exactly;
the room unmounting mid-sip orphans the mug without further writes and
leaves a replacement alone; `release()` from `Figure`'s cleanup restores it
exactly; a simulated hour through the real scheduler gives **54 sips**,
zero taps with both hands away, and the mug home at the end; 0.38 B/frame
retained over 10 599 frames.

**One number moved by design:** 4.1's ride had 48 mug behaviours an hour,
this has 54 lifts. The seeded draw order is untouched — the mug beat is
simply ~2.3 s longer now, so the schedule after it shifts. Compare the
draw order, not the count.

### What 4.3, 5.1 and 3.2 actually did — session 20

**4.3 — mug steam, and the tenth rung.** `scene/Steam.tsx`, on
`Atmosphere`'s dust pattern. **The emitter follows the mug; the steam does
not** — wisps are born on the coffee surface through the mug's world matrix
(so they come off the liquid even at 28° of tilt) and from then on live in
world space and rise, which is why a lift leaves a trail rather than
dragging a rope. **Per-particle fade is done with vertex colours**: a
`PointsMaterial` has one opacity for the whole cloud, but under additive
blending a colour multiplied toward black IS a fade, so no custom shader.
Peak sits under Bloom's 0.68 threshold on purpose — steam that blooms reads
as smoke — and additive geometry adds no light, so the brightness contract
is untouched.

**`frustumCulled={false}` on that `Points` is load-bearing.** three computes
a geometry's bounding sphere once, lazily, from whatever is in the position
buffer at that moment — and this one is all zeros at first render, because
a wisp cannot be placed until there is a mug to place it on. Result: a
zero-radius sphere at the world origin, and the whole cloud culled the
instant the middle of the room left the frustum. **The symptom was steam
vanishing as you zoomed IN and returning when you zoomed out**, reported by
the owner. `Atmosphere`'s dust escapes this only by accident — it seeds real
positions in its memo.

`sheddable.ts` gains `steam` immediately before `idleDensity`; **`LADDER` is
now ten rungs**. Not folded into `dust`, which sheds at rung 2 (ADR-013 §7).

**The §11c number, measured:** at a pinned 20 fps the static-floor offer
arrives at **70.0 s**, up from 63.75 s at nine rungs. ADR-013 §7 estimated
~69 s. **And a finding that sharpens §11c rather than settling it: the offer
arrives LATER on slower hardware** — 113 s at 10 fps, 170 s at 27 fps. Grace
is counted in FRAMES by deliberate design, so the device most in need of the
static floor waits longest for it. That inversion is an owner call.

**5.1 — the cat tree, Nimbus and Ivy.** Navy fleece platforms on a
sisal-wrapped post against the +X wall, three of them staggered so it reads
as a climb. Ivy on the perch, Nimbus a platform down, both facing the glass.
Coats matched to the untracked reference photographs: Nimbus is the ginger
with a cream muzzle; Ivy is a dilute calico — grey body, cream underside,
ginger patch over one side of her face — and a fifth larger, which is most
of what separates them in silhouette before any colour reads.

**Placement is derived.** The window's sill numbers were locals inside
`buildRoom` and are now an exported `WINDOW`, because the tree stands
*against* the sill. The standoff is computed from whichever platform reaches
furthest toward the wall, so editing the platform table cannot push a disc
through the ledge. Moving the window moves the tree.

**The room's real triangle budget is much smaller than the handoff implied.**
The 56.6 k figure recorded in session 11 is room PLUS character; the room
alone is **4,632** at high. The first cut of the cats came in at 10,836 —
two background animals outweighing the desk, CRT, tower, chair and keyboard
together by more than two to one. Coarsened to **4,800**, no change to the
silhouette. `[room] ~N tris` is now **4,632 → 9,432** at high (ceiling
150 k), 2,896 → 4,348 at low. **A harness counting triangles must weight
`InstancedMesh` by `count` the way `RoomScene` does** — counting instances
once undercounts the keyboard by two orders of magnitude.

Tails hang off `tail0` / `tail1`, each with a `tailTip{n}` inside, so 5.2
has fixed names and a second joint to curve with.

**3.2 — chapter 3 onto the window wall.** The establishing wide was at
(1.35, 1.85, 1.55): the +X side, the same wall as the window, looking away
from it, with the glass, the shafts, the tree and both cats behind the
camera. It is now front-left at **(-1.45, 1.95, 1.7)**, which gets the desk's
back wall and the +X window into one frame.

**The ch2→3 arc changed with it and had to.** Its mid key existed to swing
around the figure, because ch. 3 used to finish on the far side of the room
and a straight lerp from the ch-2 profile cut through the hair. Both ends are
now at x ≈ -1.4, so there is no crossing left; the arc is a gentle outward
bow instead, closest approach 1.26 m against a 0.55 m keep-out. **Keep both
keys on the same side of the figure or the hair problem returns.**

Measured by projecting the real geometry through a real `PerspectiveCamera`
at fov 50 and 1920×1080 rather than reasoning about angles: Ivy 174×132 px,
Nimbus 141×115 px, both fully inside frame; the figure 1.3 % off centre; the
cats 16.7 % off centre to the right; CRT, window, shafts and dust all in
frame. That distribution is the "reads as the room, not the cats" criterion
made checkable — but it is a proxy, and the judgement was the owner's.

### What gate 3.3 and 4.3 actually did — session 21

**The gate passed as a whole**, and unlike 2.4 the §4 questions were each
answered individually. Four were "leave it" — see "Settled by gate 3.3"
below, because that is now a list of numbers nobody should retune casually.

**4.3 was the one that needed code: the boot skip announces itself.** The
owner chose the **entry frame** for it, so the copy sits under `press power`
at the bottom of the shot — muted and lower-case, the way out rather than the
invitation — and there is still **nothing over the boot**, which is what the
original objection was actually about. The POST and the splash play
uncovered. (ADR-013 **§3a**.)

**That placement forced a behaviour change, and it is the part to know
about: the key path is now live at the `idle` stage, not only while the boot
runs.** Copy that promises a skip has to be true where it is read. It routes
through the same `skip()` the returning visitor's link already called, so the
never-pressed case was an exercised path — `unlockAudio()` included, which a
`keydown` satisfies as a user gesture just as a click does.

Two exclusions the announcement makes necessary, both narrowing "any key":

- **Enter and Space on a focused control are that control's.** The power
  button is `autoFocus`ed — verified: it holds focus on load — so those keys
  are how a keyboard visitor presses power. Reading them as "skip" would take
  the opening away from the one visitor who asked to see it.
- **F1–F12 belong to the browser.** The 3.3 checklist itself opens DevTools
  on the entry frame, so F12 discarding the opening is a trap, not an intent.

**The pointer half stays boot-only and stays unannounced.** Before the press
the ring is the only thing in frame that answers a pointer, and a stray click
on the backdrop costing the whole opening is a worse trade than the one §4.3
asked for.

Proved on the production export at 1440×900, headless: the hint renders; Tab,
F12, F5, Shift, Enter-on-the-button, Space-on-the-button and a backdrop
pointerdown each leave the entry standing; an ordinary key skips and lands
the page at **y = 702 px** — `REST_POINTS[0] × 5850`, so `chapterZeroPx`
resolved and the skip parks at chapter 0's rest rather than an uncomposed
frame.

**One thing to look at rather than fix blind:** a *returning* visitor now
reads three lines — `press power`, `any key skips the intro`, and the older
underlined `skip intro` link. The last two overlap. The link predates this
change and was owner-approved long ago, so it was left alone; if the owner
wants two lines instead of three, dropping the link is the smaller cut.

### What 5.2 actually did — the tails move

`builders/catIdle.ts` in the shape of `character/idle.ts`: allocated once,
`update()` allocates nothing, ticked from a thin leaf
(`builders/CatMotion.tsx`) rather than by giving the static `RoomScene` a
frame loop. Rides `effectsState.idleDensity` at half rate, exactly as
`Figure` does.

**Why sines and not a scheduler.** 4.1's behaviour scheduler exists because
an arm has to *commit* — it is at the keyboard or at the mug, and the states
are exclusive. A resting tail has no states; it drifts. Summed incommensurate
sines are the honest model, they cost no bookkeeping, and they cannot leave a
tail parked somewhere odd if frames are dropped. **The ear flick is the one
discrete beat, so it is the one thing with a seeded timer.**

**Everything is written as rest + offset.** `buildCat` seeds each cat's hang
and curl (measured: −0.542 vs −0.716 rad), so a driver writing absolute
angles would have flattened the two cats into one pose. The second cat also
runs every frequency at **0.847×** the first — not 0.5 or 0.75, because a
simple ratio makes the two tails beat on a period you can see.

**The file is `CatMotion.tsx`, not `CatIdle.tsx`, and has to be.** The
driver's name is fixed by the plan, and `CatIdle.tsx` beside `catIdle.ts`
differs only in casing: fine on Linux, ambiguous on Windows and macOS, and
**tsc rejects it outright (TS1149)**. Worth remembering the next time a
driver and its component want the same name.

`cat.ts` changed only to **name the ears** (`catEar{n}{R,L}`), the same
reason the tail pivots were named in 5.1 — the flick needs to find one ear,
not guess at traversal order. No geometry moved.

Measured offline against the real `buildCat` rig at a simulated 60 fps (ten
minutes of ride for the speeds, an hour for the flicks):

- **peak tip speed 27.5 mm/s**, peak tail yaw rate **5.1 °/s**, max offset
  **12°** from rest — at the chapter-3 framing that is roughly 19 px/s;
- the two tails: correlation **r = −0.137** over 120 s, and they swing
  **opposite ways 52.8 %** of frames;
- **no loop**: the closest the pose comes to repeating within 120 s is
  **81.6 %** of the motion's own amplitude, at a lag of 83 s;
- **133 / 135 flicks an hour**, gaps 14.0–39.6 s, never two ears at once on
  one cat, and an ear returns to its authored angle **bit-exactly**;
- half-rate ticking is **bit-identical** on the frames it runs — the proof
  that shedding `idleDensity` skips the *call* and does not slow the *clock*,
  so a shed room stays in phase with the figure in it;
- nothing retained over 300 000 frames.

**Wiring proved separately, on the production export:** the room mounts at
chapter 3 logging `[room] ~4,348 tris` with **no `[cats]` error**, so
`CatMotion`'s effect ran and found both tails, both tips and all four ears by
name. **Whether the wag is slow enough is still owner-only** — 27.5 mm/s is a
number, not a judgement, and headless renders this scene at 2–6 fps.

### What 6.1 and 6.3 actually did — the Gallery's foundations

**6.1 — the picture pipeline.** `scripts/build-pictures.mjs`, `sharp` as a
devDependency imported only there. 29 photographs in, 58 files out at
**4.34 MB** into `public/pictures/`; script and output both committed, so
`npm run build` is still a plain static export. Run by hand:
**`npm run pictures`** (and `npm run pictures -- --dry` reports without
writing).

**The sizes were measured, not chosen.** 1200×900 viewer copies and
cover-cropped 192×144 thumbnails are what the Gallery needs in a 640×480
virtual shell; that landed the directory at 3.27 MB, *under* ADR-013 §9's own
4–5 MB band, so the spare megabyte went on quality — q80 → 3.82 MB, q84 →
4.31 MB, q88 → 5.03 MB and over. Hence **q84**. Re-measure if the set changes.

Four properties in that script are load-bearing, not incidental:

- **The allow-list is explicit and never globs.** That is the *mechanism*
  behind §9's boundary — `assets-src/workstation/` holds the four tattoo
  reference close-ups and three AI concept sheets, and a glob would ship them
  the day a file lands in the wrong folder. `assertAllowed` refuses to run at
  all if any entry matches reference material, the concept sheets, the
  character-QA screenshots, `docs/projects/**` or anything named "client".
  **Proved by poisoning the list with `tattoo01.jpg`: exit 1, nothing written.**
- **Metadata is stripped** — 0 of 29 shipped files carry EXIF/XMP/ICC.
  Honest footnote: **0 of 29 sources carried EXIF either**, so no GPS was ever
  actually at risk. The guarantee matters the moment a photo is added straight
  off a phone; do not repeat it as "we prevented a GPS leak".
- **`.rotate()` before the resize.** Stripping EXIF also strips the
  orientation flag, so a portrait photograph would otherwise ship sideways.
- **Deterministic encoding is what makes re-running idempotent** — verified
  byte-identical on a second run. The script re-encodes every time rather than
  checking timestamps; 29 photographs cost seconds and a cache can be wrong.

**Ids are authored in the allow-list, not derived from filenames**, so
renaming a source cannot change a shipped URL. `scripts/pictures-manifest.tsv`
carries id/group/width/height for 6.4 — deliberately **not** under `public/`,
because everything there ships.

**`assets-src/` is now gitignored, not merely untracked.** 6.1's own
acceptance criterion is that it stays unshipped and it was one `git add -A`
from committing 27 MB including the tattoo references. **The memory note
claiming it was already gitignored was wrong** — it never was.

**What inspection actually found, and it is the reason 6.2 matters** *(and where
it was incomplete — 6.2 found a third such photograph, `cat-02-nimbus`; the
account below says "two" and that number is wrong)***:**
`guitar-01` and `workspace-01` **show the owner's tattooed forearms**, which
breaches plan-0009's literal wording ("no image file under `public/` contains
tattoo photography"). They ship, on three grounds, with the call put back to
the owner in `docs/qa/6.2-picture-review.md`: ADR-013 §9's own heading is "No
tattoo **reference** photography" and names the four close-ups; the owner
decided all 29 ship, naming these two; and **`aravind-2.jpg` has shipped all
along showing the same forearms**, so the criterion cannot ever have meant
"no photo containing a tattoo". Also flagged there: `guitar-01` shows two
other identifiable people close up, and `workspace-01` has a work laptop in
frame (upscaled from the original the screen is thoroughly illegible — no
client material, but it deserves a conscious yes).

**Captions were deliberately unwritten at 6.1** — the owner's voice about his own
life, where a plausible-sounding fabrication is worse than a blank. **Settled at
6.2:** the owner took §1.3's option 2 (name the register, get 29 drafts to
correct) and chose *playful, always shown*. See "What gate 6.2 actually did".

**6.3 — the Gallery glyph.** `"gallery"` in `IconGlyph`, original 16×16 art in
`pixelIcons.tsx` GLYPHS, and a mirrored `case "gallery":` in `painter.ts`'s
`drawGlyph`. A framed photograph of a ridge under a sun — the set is mostly
hills and roads, so the icon says what is inside it, and the 1 px cream mat is
what stops it reading as `computer` at 16 px. Every colour was already in the
palette; nothing new entered it.

**This glyph pair is pixel-identical, which the others are not.** Both sides
are plain axis-aligned fills of the same cells in the same layer order, so
they rasterize the same at every integer scale — `globe` and `mine` only
*approximate* each other because the painter draws those with arcs. Verified
by parsing both files and comparing the colour and rectangle lists
programmatically rather than by eye: 5 colours, 12 rectangles, identical.
**Keep it exact; it is cheaper to preserve than to restore.**

Remember which of the two is compile-forced: `pixelIcons.tsx` is a
`Record<IconGlyph, …>` so a missing glyph fails the build, while the painter's
`switch` is non-exhaustive and will **silently draw nothing** on the CRT.

### What gate 6.2 actually did — the set shrank, and the words exist

**The owner answered every question in the checklist, and the answers cost six
photographs.** `!` in the keep column meant *don't include* — so `cat-04-nimbus`,
`ride-04-maharashtra`, `ride-05-hogenakkal`, `ride-06-tamil-nadu`,
`ride-10-west-coast` and `ride-13-kashmir` are out of the allow-list and out of
`public/pictures/`. **29 → 23, 4.34 MB → 3.39 MB.** The script removed all 16
stale files itself across the two runs; `--dry` was run first both times and
matched.

**Two ids were corrected, and neither source moved:**

- `hike-04-goa` → **`hike-05-goa`**, resolving the duplicate `hike-04` on the
  owner's "make anyone 05".
- `ride-07-pondicherry` → **`ride-07-goa`**, because the owner identified the
  photograph as a Goa run. The frame agrees — a wet ghat road under tree cover,
  nothing coastal in it.

Their **source filenames still read `hike-04-goa.jpg` and
`ride-07-pondicherry.jpg`**, which is the allow-list working as designed rather
than an oversight: ids are authored, never derived, so renaming a source cannot
change a URL and correcting a URL cannot require touching `assets-src/`. Git
recorded both as 100 % renames — which is 6.1's deterministic encoding quietly
proving itself again.

**Captions: 23, playful, always shown**, with the id's place name as the fallback
where a line is struck. Two rules held even after the owner loosened the register
from description to wit, and they are the reusable part:

- **A caption may only joke about what is visible in its own photograph** — no
  dates, no invented durations, no weather that isn't in frame, nothing about what
  anyone was feeling. Wit comes from framing what is there, not from adding
  events.
- **Nothing is asserted about other people in frame.** `guitar-01` has two
  identifiable faces in it, and the owner's instruction was explicit: don't talk
  about them. Its caption is therefore built from **`src/lib/aboutMe.ts`**
  ("somewhere between Carnatic and metal") rather than from the photograph — the
  one line in the set sourced from copy instead of from the image. Side effect
  worth knowing: **the site now says "Carnatic and metal" in two places.**

**Four drafts asserted something unverifiable and all four are resolved** — the
owner approved one (`cat-07-both`), corrected two (there was no dog on the Kalga
trek; `ride-07` is Goa) and redirected one (`guitar-01`). **No caption carries an
unverified claim now.** `cat-07-both`'s is the only one that breaks the fourth
wall — *"That cat tree is in this room. They had it first."* — and it is
owner-approved, which puts a constraint on 6.4: **the visitor must reach the
Gallery from inside the room, or the line stops making sense.**

**What captioning found that the pipeline's own inspection had not.** 6.1 flagged
three things by inspecting the three photographs it suspected; opening all 29
turned up three more, all now owner-cleared:

- **`cat-02-nimbus` is a third tattoo photograph** — face and both forearms,
  asleep, at arm's length. 6.1's "these are the two to pull" was an incomplete
  list, so the tattoo decision actually stands at three photographs.
- **Two more laptop screens are in frame.** `cat-01-nimbus` has a **Google Tag
  Manager console** open. Its container-name dropdown **does not resolve into
  letters at 10× with sharpening** — nor do the tabs or the URL bar — and
  `cat-05-nimbus`'s chat client is illegible at 8×. Nothing readable ships. The
  owner cleared both **knowing what that container was called**, which is the
  part no agent can decide.
- **Every visible number plate was already blacked out by hand in the sources.**
  `ride-09`, `ride-11` and the KTM in `ride-12` carry manual redactions.
  **The pipeline does not redact plates** — a photograph added later needs the
  same hand.

**One correction to the checklist itself, worth carrying because it is the kind
of error that survives review:** §1.2 attributed a "Shot on OnePlus" watermark to
`ride-01-kerala`, which has none. The watermarked photograph was
**`ride-06-tamil-nadu`**, and the mark was two lines — "Shot on OnePlus" over
**"By Chisty"**, a personal name, legible at the shipped size. The owner's
"leave it" had therefore been given about a photograph that did not contain the
thing. It is moot now — `ride-06` was one of the six pulls, so **nothing shipped
carries a watermark or that name.**

**One number the cut reopened, deliberately left open:** quality is `q84`, chosen
by measurement because it put *29* photographs at 4.31 MB inside ADR-013 §9's
4–5 MB band. At 23 the same setting spends **3.39 MB, under the band**. `q88`
measured 5.03 MB for 29, so it would now land mid-band and every survivor would
look slightly better. **Not changed** — it re-encodes all 23 files and it is
taste, not a defect. It is the only open call on the gate.

**Grid order, for 6.4: `cats` → `journey` → `desk` → `portrait`** (owner). Cats
first reads warmest, and it puts the fourth-wall caption near the top.

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
closed** (1.1 rig, 1.2 driver, gate 1.3 passed). **P2 is closed** (2.1 the
scroll span and the opening frame, 2.2 the hotspot, 2.3 the press, gate 2.4
passed) and **4.1 came in early**, out of plan order, because the owner's 1.3
note lands inside gate 2.4's twenty seconds. **P3 is closed** (3.1 the face
reveal, 3.2 the room wide, gate 3.3 passed). **P4 is complete** (4.1
scheduler, 4.2 the sip, 4.3 steam). **P5 is complete** (5.1 the cat tree and
the cats, 5.2 the tail wag).

**What is left is the back half of P6, and P8.** 6.1 (the picture pipeline), 6.3
(the glyph) and **6.2 (the owner's review — answered, `6a56d7f`)** are done, which
leaves **6.4 (the Gallery app)** and 6.5 (the painter's thumbnail-grid
suggestion). P8 is 8.1 (the dock sweep — **spot-checked in session 21 and smaller
than three handoffs implied**) and 8.2 (close-out docs, and **now carrying a real
punch list** — see "Slice 8.2 has content now").

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
- ~~**All 29 photographs ship**~~ — **SUPERSEDED by gate 6.2 (2026-07-30).**
  The owner pulled six at the review: `cat-04-nimbus`, `ride-04-maharashtra`,
  `ride-05-hogenakkal`, `ride-06-tamil-nadu`, `ride-10-west-coast`,
  `ride-13-kashmir`. **23 ship** — cats, rides/hikes, workspace, guitar and the
  two existing portraits. This entry is left visible rather than deleted because
  three documents still assert the old number; **8.2 fixes them.** Sources are
  untouched under `assets-src/`, so a pull is one allow-list line to reverse —
  but reversing one needs the owner, not an agent reading ADR-013.
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
     swing 9 mm through the desk top. **4.2 deliberately kept it a
     constant** rather than deriving it from the live handle — see "What 4.2
     actually did", decision 3.

**Nothing is blocking. No item is awaiting the owner.**

The three threads parked here before (the SignOff/cue overlap, the POST
playing off-camera, and the missing boot-skip path) were **all put to the
owner at 2.3 and all answered.** Built to the answers; see "The three calls
the owner made at 2.3" above and ADR-013 §2a/§10a. Do not reopen them.

**SETTLED BY GATE 3.3 — do not retune these without a fresh ask.** The three
questions gate 2.4 left hanging were re-put at 3.3 §4 and answered
individually this time, along with two more. Four of the five were "leave
it", which turns them from "passing shot around an open number" into decided:

- **`PAN_HOLD_MS` and `PAN_DURATION_S`** (the boot pan's hold on the LED and
  its travel to the glass) — *"the current config is good."* This closes the
  thread 2.4 left open. The code comment calling them "the first thing to
  retune at gate 2.4" is now stale; the numbers are chosen.
- **Chapter 0's 90 vh of camera move** — *"its good."*
- **The chapter-2 earbud leak mix.** 3.1 brought the camera to 0.98 m and the
  falloff saturates at 1.0 m, so the leak plays at **full** at the ch-2 rest.
  The owner heard it: *"the current config is good."* Closest approach =
  loudest glimpse inside his head, as intended.
- **The fidelity ladder's slow-hardware inversion** (70 s to the static-floor
  offer at 20 fps but **113 s at 10 fps**, because grace counts frames):
  *"leave it."* Frame-counted grace stays; the inversion is accepted.
- **4.3, the announced boot skip** — the one answer that needed code. Built
  this session; see above.

Also settled earlier and still standing: `MAX_TILT`, `SIP_PITCH`, `SIP_YAW`
(session 20), and the 4.3 steam's rise speed — which **the 3.3 gate ticked
explicitly**, so it is no longer the open tuning question the last handoff
listed it as.

**CLOSED in session 20 — both 4.2 gaps.** The sip has now run in a browser
and the owner called the tilt clamp and the head dip "perfect". `MAX_TILT`,
`SIP_PITCH` and `SIP_YAW` are **settled numbers**, not placeholders — do not
retune them without a fresh ask.

`window.__sipNow(holdS?)` was added for that review and is worth keeping in
mind: the scheduler starts a sip on an 11–30 s seeded gap with a 3-in-10
weight, so waiting for one in a harness is a poor use of a session. It parks
a hold time for the frame loop to consume, because `start` must be handed
the same clock the ticks read. Dev only — behind a NODE_ENV literal, so it
does not exist in a production build.

**CLOSED at gate 3.3 — the steam's rise speed.** The last handoff listed it
as the constant most likely to want tuning. §3.2 of the checklist asked about
it by name and the owner ticked it. Settled.

**CLOSED by the owner (2026-07-30) — 5.2's wag.** *"The tail wag is fine."*
That was the one acceptance criterion no harness could answer, so **P5 is
fully owner-closed**. The amplitudes in `catIdle.ts` (0.14 / 0.07 on
`tail.rotation.y`, 0.15 / 0.08 on the tip) are **settled numbers** — do not
retune them without a fresh ask. The **ear flick** was not commented on
either way; at 14–40 s apart it is unlikely to have been seen, so treat it as
untested rather than approved.

**OPEN, and owner-eyes work rather than a defect:**

- **4.3's announced skip has never been seen** — it landed after the owner's
  ride, so the entry frame they passed is not quite the one that ships. One
  muted line; wants a glance, not a sitting. The three-lines-for-returning-
  visitors overlap noted above is the specific thing to look at.

**New, from earlier in this branch:**

**SLICE 8.2 HAS CONTENT NOW — it is no longer just "close-out docs".** Gate 6.2
falsified a decision three documents record as settled, and documentation that
contradicts the shipped set is worse than none. In rough order of how badly each
one misleads a reader:

1. **ADR-013 §9 says all 29 ship and budgets 4–5 MB.** Both are now wrong: 23
   ship, and the directory is 3.39 MB, *under* the band. Record the pull and the
   six ids, and decide whether the band moves down or the quality moves up (the
   `q84`/`q88` call — the owner has not answered it).
2. **This file's "Decisions already made" carried "all 29 photographs ship."**
   Already struck through in place, with the reason left visible on purpose.
   Whoever writes 8.2 should decide whether the strikethrough stays as history or
   the entry is rewritten outright.
3. **Plan-0009's acceptance criterion — "no image file under `public/` contains
   tattoo photography" — is still literally false and always was.** `aravind-2.jpg`
   has shipped since long before this branch, and the owner has now approved
   **three** photographs showing tattooed forearms (`guitar-01`, `workspace-01`
   and `cat-02-nimbus`; 6.1's write-up said two). The criterion means *no tattoo
   **reference** photography*, which is what ADR-013 §9's heading actually says.
   **Fix the wording so the next agent does not re-flag it as a breach** — this is
   the third session in a row it has come up.
4. **The pipeline does not redact number plates**, and every plate currently
   shipping was redacted by hand in the source. That is a standing constraint on
   adding photographs, and it is written down nowhere but the 6.2 record.
5. **ADR-012 §10 / the confidentiality rule are unaffected** — no client material,
   no readable client name, no watermark, no metadata in the 23. Say so
   explicitly at close-out rather than leaving it inferred.

**One thing 8.2 should NOT do: reopen the six pulls.** They are the owner's call
at a gate written for exactly that purpose.

- **Gate 6.2 is answered** (2026-07-30) — pulled forward as this thread kept
  recommending, and it earned it: it cut six photographs and rewrote three
  captions before 6.4 could hard-code any of them. **P6 is still the only package
  left with build work in it — and 6.4 is now that work.** The one thing the gate
  did not settle is `q84` vs `q88`; the one thing it did not *ask* is the owner's
  tick in the verdict box.
- **The dock: spot-checked in session 21, and the recorded risk was
  overstated.** Three handoffs have called 2.1's runway change (660 →
  **750 vh**) this branch's biggest regression risk, because `ENGAGE_EPS`
  0.012 covers ~70 px instead of ~60 px at 1440×900. **That framing had the
  direction wrong.** Every dock constant is expressed in *progress* units, and
  both engage tests are scale-invariant: `DockSwap.tsx:214` fires on
  `away < ENGAGE_EPS` **or** a sign change of `progress − rest`, so no scroll
  speed and no runway length can carry the visitor past the latch. The
  `REARM_EPS` (0.05) : `ENGAGE_EPS` (0.012) relationship is likewise in
  progress space and unchanged. The band being ~16 % wider in *pixels* means
  the dock engages a little more readily on a slow approach — the opposite of
  the feared failure, which was the dock being *missed*.

  **Verified on the production export at 1440×900**, four checks, all passing:
  parked at p = 0.70 not docked; **one 1462 px jump to p = 0.95 latched** and
  clamped progress to 0.813 (the crossing test, at the new runway length);
  `ArrowUp` after a pause undocked; and — the adversarial one — left parked
  with `away = 0`, i.e. dead on the rest point and deep inside the engage
  band, it **stayed undocked for 6 s**, so the hysteresis holds in the worst
  case the keyboard-undock path can produce.

  **What that does NOT cover, and 8.1 still owns:** the momentum case. A hard
  flick is a burst of events, and headless renders this scene at 2–6 fps so it
  cannot produce that cadence — `UNDOCK_GRACE_MS` 800 and `SCROLL_QUIET_MS`
  350 remain owner-hardware-verified only, exactly as they were at 9.2. The
  *mechanics* are re-proved at 750 vh; the *feel* is not. Downgrade the risk,
  do not close it.
- ~~Steam adds a tenth rung…~~ **Done and measured at 4.3: 70.0 s, and it
  is slower on slower hardware.** See "What 4.3, 5.1 and 3.2 actually did".

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
- **The press (ADR-013 §2/§3, slice 2.3):** `src/lib/powerPress.ts` is
  **pure** — no DOM, no three.js, no timer of its own — and is ticked from
  exactly one place, `TowerPower`. Keep both properties. The click starts a
  reach and **nothing else**; the boot, and therefore the thunk, the POST
  and the LED, start on **contact**. The LED is driven by `win98State.phase`
  and never by the press machine, so the lamp and the thunk cannot drift —
  do not give the LED its own timeline. `materials.led` is one instance
  shared by `towerLed` and `crtLed` and is **emissive only**: it adds no
  light, which is why it does not touch the brightness contract.
- **Props and the sip (ADR-013 §6, slice 4.2):** `scene/propHandles.ts` is a
  noticeboard, not a scene — **type-only three import**, and the dependency
  is one-way: the room publishes, the character consumes. **`RoomScene` must
  never import from `character/`.** A carried prop is **driven, never
  re-parented**, so ownership never changes hands and no unmount order can
  dispose it twice or never; putting it down restores the exact TRS captured
  at the pick-up, so drift is impossible rather than merely unlikely.
  `HOLD_UNTIL_RELEASED` means **the caller owns bringing the arm home** —
  nothing else will. `headOffset` in `idle.ts` is additive and `idle.ts`
  stays the **only** writer of `head.rotation`; **the setter owns the
  easing**, since nothing there smooths it.
- **The cats (ADR-013 §8, slice 5.2):** `builders/catIdle.ts` is the driver and
  `builders/CatMotion.tsx` is its only ticker — a leaf, so `RoomScene` keeps
  its static memo and the tails ride the shed ladder without the room knowing
  the ladder exists. Every write is **rest + offset**, because `buildCat`
  seeds each cat's hang and curl; a driver writing absolute angles flattens
  the two cats into one pose. The tails are **sines, not a scheduler** — a
  resting tail has no states to commit to — and the ear flick is the only
  discrete beat, so it is the only thing with a timer. `idleDensity` halves
  the **call**, never the clock: the driver is a pure function of elapsed, so
  a shed room stays in phase with the figure in it (proved bit-exactly).
- **A driver and its component cannot share a name.** `CatIdle.tsx` beside
  `catIdle.ts` differs only in casing — fine on Linux, ambiguous on Windows
  and macOS, and tsc refuses it (TS1149). Hence `CatMotion.tsx`.
- Lazy apps: `lazyApps.ts` → `registerNN.ts` chunks, each **verified split
  out of the initial bundle in `out/`**. The Gallery must clear the same bar.
- Conventions: figure faces **-Z**; `DESK_TOP_Y` 0.72; tower power button at
  world `(-0.05, 0.777, -0.518)`; `assets-src/` stays untracked and unshipped.
- **The room's own triangle budget is small — 4,632 at high before the cats,
  9,432 after.** The 56.6 k recorded in session 11 is room *plus* character
  (the figure is ~52 k). Judge a new prop against the room's number, not the
  scene's: the first cut of two cats came in at 10,836 and outweighed every
  other object in the room put together. The 2.1 ceiling is 150 k.
- **A CPU-driven `Points` cloud whose particles are placed at runtime needs
  `frustumCulled={false}`.** three computes the bounding sphere once and
  lazily, so a buffer that is still zeroed at first render yields a
  zero-radius sphere at the world origin and the object vanishes whenever
  the origin leaves frame. `Atmosphere` avoids this only because it seeds
  real positions in its memo; `Steam` cannot, because it has no mug yet.
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

## Key References

- **ADRs:** `docs/decisions/ADR-013-…md` (this branch — ten decisions, made
  with the owner, don't re-litigate; amendments so far are **§2a**, **§3a**
  and **§10a**) · `ADR-012-…md` (the experience layer; ADR-013 amends only its
  §5 chapter table and §2 rig).
- **Plan:** `docs/plans/implementation-plan-0010.md` — 25 slices, dependency
  graph, per-slice acceptance criteria, risk table. **Owner-approved as
  written.** AFK gate is always lint + build green.
- **The 3.3 gate record:** `docs/qa/3.3-camera-ride-checklist.md` — **filled
  in and PASSED** (2026-07-30). Its §4 "Answers" block is the authoritative
  transcription of the owner's five calls, and §7 carries the verdict and the
  one thing the pass did not cover. **Read it before planning anything that
  touches the opening or the camera.**
- **The 6.2 gate record:** `docs/qa/6.2-picture-review.md` — **answered, and the
  authoritative source for the picture set.** **Read it before planning anything
  in P6.** §2 is the 23 ids and their caption strings (6.4 transcribes from here);
  §3a/§3b record the six pulls and the two id renames; §3c fixes grid order;
  §1.1a carries three privacy findings the pipeline's own inspection missed, all
  owner-cleared; §4 has the record and the one open call (`q84`/`q88`). The
  verdict box is unticked — that is the owner's mark, not a missing answer.
- **Prior gate record:** `docs/qa/9.2-desktop-checklist.md`, especially §17
  (session-13 fixes), §17b (rewritten in session 15 — the P7 record and the
  SignOff-overlap thread) and §17d (what an agent could not verify).
- **Standing rules:** root `CLAUDE.md` / `AGENTS.md`. Agent memory:
  `noise-signal-redesign-state.md`, `owner-motif-privacy.md`,
  `client-name-leak-accepted.md`, `windows-shell-gotchas.md`.

## Recommended Next Steps

- [x] ~~**GATE 3.3 is with the owner.**~~ **PASSED** (2026-07-30). Read
      `docs/qa/3.3-camera-ride-checklist.md` for the record; the five §4
      answers are transcribed there under "Answers". Four were "leave it" —
      **do not reopen them**, and see "Settled by gate 3.3" above before
      touching any number in the opening. The fifth (4.3) is built.
- [x] ~~**Slice 5.2 — tail wag.**~~ **Done, and owner-closed** — *"the tail wag
      is fine"* (2026-07-30). P5 is complete.
- [x] ~~**P6.1 (picture pipeline)**~~ and ~~**6.3 (the glyph)**~~ **both done**
      this session. See "What 6.1 and 6.3 actually did".
- [x] ~~**GATE 6.2 IS THE ONLY THING BLOCKING ANYTHING.**~~ **ANSWERED**
      (2026-07-30, `6a56d7f`). It cost six photographs — **29 → 23** — plus two
      id corrections and three rewritten captions. See "What gate 6.2 actually
      did". **The set and the caption strings now live in
      `docs/qa/6.2-picture-review.md` §2, and that document outranks ADR-013 on
      what ships.** One call left open (`q84` → `q88`?) and the verdict box
      itself still wants the owner's tick.
- [ ] **SLICE 6.4 IS THE WORK — nothing blocks it.** The Gallery app itself.
      **Transcribe the 23 ids and captions from the 6.2 record's §2**, order the
      groups `cats → journey → desk → portrait` (§3c), and note that
      `cat-07-both`'s approved caption breaks the fourth wall — *"That cat tree
      is in this room. They had it first."* — so **the Gallery must be something
      the visitor opens from inside the room**, or the line stops making sense.
      `src/lib/pictures.ts` for content (dimensions are
      in `scripts/pictures-manifest.tsv` — do not transcribe them by hand),
      a `DEFAULT_ICONS` entry at **col 0 row 5** (free, and the glyph was
      already proved rendering there in both renderers), an `APP_DEFS` entry,
      `apps/Gallery.tsx`, a `register54.ts` chunk and its `lazyApps.ts` loader.
      **Verify the chunk actually splits out of the initial bundle in `out/`** —
      that criterion has caught regressions before. Reuse `IEFrame.tsx`'s
      period image chrome and `Explorer.tsx`'s grid + `w98-sunken` status line
      rather than reinventing either.
- [x] ~~**Spot-check the dock early**~~ **Done, session 21 — and the risk was
      overstated.** The latch mechanics are re-proved at 750 vh and the
      constants are scale-invariant by construction; see Unresolved Threads for
      the four checks and for the one thing still owner-only (the momentum
      case). **8.1 is now a smaller job than the handoffs implied**, but it is
      not closed.
- [ ] **Fold two cheap owner glances into the next browser session** rather
      than opening one for either alone: **4.3's announced skip** on the entry
      frame (one muted line, and the three-lines-for-returning-visitors
      overlap), and **the sip in `?scene=full`**. Both are "look once", not
      sittings. *(5.2's wag is closed — the owner called it fine. Its **ear
      flick** was never commented on and at 14–40 s apart was probably never
      seen; treat as untested, not approved.)* See Unresolved Threads.

## Recommended Skills

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
- `documentation-and-adrs` at close-out for slice 8.2 — **and it now has a
  concrete punch list rather than a vague brief.** Gate 6.2 falsified "all 29
  photographs ship" in three documents; see "SLICE 8.2 HAS CONTENT NOW" under
  Unresolved Threads before writing anything.

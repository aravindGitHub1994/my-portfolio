# ADR-014: Chapter 0 recomposition, viewport adaptation, and the room's last light

## Status
Accepted — **amends ADR-013 §2/§2a (chapter 0's framing), §3a (the skip's copy, and
its "nothing over the boot"), and §7 (the shed ladder's length); ADR-012 §5 (the first
two beats of the chapter table); and plan-0009 §4.1 (the chapter-1 title beats)**.
Everything else in ADR-012 and ADR-013 stands unchanged: one store / two
renderers (ADR-012 §4), the brightness contract (gate 2.3), the arm rig and its four
pivots (ADR-013 §1), props are driven never re-parented (ADR-013 §6), zero Microsoft
IP (ADR-012 §10), and the confidentiality rules.

## Date
2026-07-30

## Context

`scene-refinement` merged to `main` on 2026-07-30 with gate 10.1 owner-PASSED, and
six items were deliberately carried forward rather than fixed on that branch
(`HANDOFF.md` "The next branch's worklist"). Item 6 shipped as `ladder-pacing`. Five
remained, of which only item 5 — "the scene does not fit an iPad screen" — was a
defect rather than a preference.

The owner then reported a sixth, and it is the largest:

> the opening chapter right now zooms onto the power button and my 3D character
> presses the power button. the problem is since the frame is so zoomed in the hand
> and finger get clipped and i can see the "insides". instead chapter 0 could be a
> frame over the 3d characters right shoulder and when the user starts the chapter
> the character presses the power button and then the camera pans into the desktop
> screen as it boots.

**The mechanism is the near plane, not the hand.** ADR-013 §2 put the film's first
frame at a macro ~165 mm from the tower's power button
(`cameraPath.ts:53-56`, position `(0.03, 0.825, -0.375)`). The journey camera uses
R3F's default near plane of 0.1 m. The right forearm swings through that frame on its
way to the button, and any capsule that crosses 100 mm of the lens is cut open — the
arm meshes are `FrontSide`, so a cut capsule shows no backface at all and the visitor
looks straight through into the figure. Nothing is wrong with the geometry; the
camera is simply inside it for part of the reach.

Pushing the near plane in was rejected without being built: near plane governs depth
precision for the entire ride, and trading that against one shot — a shot the owner
is asking to replace anyway — is paying a global cost for a local problem.

The iPad report has two independent causes, both found by reading rather than by
reproducing (no run in this project's history has ever loaded a tablet viewport —
`docs/qa/headless-qa-notes.md` records that every "mobile" claim on this scene was
made at 360×640 and 390×844 and nothing else):

1. **The journey camera has no aspect term at all.** `fov: 50` is set once
   (`WorkstationCanvas.tsx:188`) and never touched; `sampleCameraPath` is a pure
   function of progress. Vertical fov fixed means horizontal fov collapses as the
   viewport narrows — 73° at 1440×900, 67° at iPad landscape, **36° at iPad
   portrait**. The wide shots are cropped to a slot.
2. **The dock quad overflows.** `computeDockRect` is analytic: it derives the CRT
   screen's projected rectangle from the known dock pose, so `width` works out to
   `1.2578 × viewportHeight` and depends on viewport *height* alone
   (`dockAlignment.ts:55-69`). It therefore only fits when aspect ≥ 1.258. A 12.9"
   iPad Pro in portrait (1024×1366) gets a **1718 px-wide dock on a 1024 px
   viewport** — 694 px clipped — because `isTouchShell`'s strict `<` against
   `COARSE_MAX_W = 1024` sends exactly-1024 down the desktop branch
   (`shellLayout.ts:41,59`).

The four remaining worklist items (the `skip intro` link, the dust and the lamp, the
coffee, the tail wag) are carried here because two of them turn out to have
consequences that outlive a tweak: the lamp changes the shed ladder's length, and the
skip link cannot be deleted without deciding what a touch visitor gets instead.

## Decision

### 1. Chapter 0 opens wide, from behind and to the right of the figure

The macro is retired. The film's first frame is a high, wide shot from behind the
figure's right side: the whole seated figure reads small in frame, with the desk, the
tower, the CRT and the room around it. The press is a gesture at a distance instead of
a macro of a hand, and no geometry comes anywhere near the near plane.

**ADR-013 §4 stands unamended.** "The face is revealed by lighting, not by geometry"
reserves the reveal for chapter 2 — and from behind there is no face to reveal, so
chapter 2's three-quarter front is still the first time the visitor sees one.
ADR-012 §2's "the face is never the hero" is likewise untouched. What *is* retired is
the promise in `cameraPath.ts:50-52` that "no torso or face is ever in shot"; that was
a description of the macro's composition, not a contract, and the owner has replaced
the composition.

Two constraints bind the framing, and both are non-obvious enough to be worth writing
down, because a shot that satisfies neither will still look plausible in a still:

- **The power button has to be genuinely visible, not merely projectable.**
  `PowerButtonAnchor.tsx:38` tests `v.z < 1` and a screen-space margin. There is no
  depth test and there is no cheap way to add one, so an occluded button leaves
  `PowerOn`'s glowing 96 px ring floating over the figure with nothing behind it —
  the worst failure this page has, since the ring is the visitor's only affordance.
  From directly behind, the figure's torso occludes the tower: the sight-line from a
  centred behind-camera to `POWER_WORLD (-0.05, 0.777, -0.518)` passes through the
  neck and upper chest. **This is why the shot is behind-*right* and high**, and why
  "over the right shoulder" is the right instinct even though the frame is wide.
- **The camera must clear the figure on the way in.** `sampleCameraPath` lerps
  straight lines between keys (`cameraPath.ts:170`), which is why the ch.2→3 arc key
  exists at all — `cameraPath.ts:100-105` records that a straight lerp there "cut
  through the hair". The same check applies to chapter 0's single segment, and if it
  fails the fix is an intermediate key, not a moved endpoint. The established test is
  a keep-out cylinder round the figure, sampled densely along the segment.

**Why not the alternatives.** A classic over-the-shoulder with the back of the head in
the near corner was offered and declined; so was a tighter shoulder-and-arm frame with
the head cropped out. Both fix the clipping equally well. The wide was chosen for what
it shows — the room, at the moment the machine is still off — and its cost is stated
in §9 below.

### 2. Chapter 0 rests on a monitor medium; the phosphor extreme close-up is cut

Chapter 0's rest moves from the extreme close-up on phosphor
(`cameraPath.ts:57-63`, 0.21 m off the glass) to a **medium on the monitor**: the CRT
sizeable in frame with its bezel, not filling it. Chapter 1 keeps its pull-back and
its job becomes what its name always said — **THE GLOW**, the screen's light spilling
into a dark room, read as an effect on the room rather than as a texture.

**The distance is set by legibility, not by taste.** ADR-013 §2a records an explicit
owner decision — put to them at 2.3 — that the POST lines should be *seen* and not
merely heard, and that decision is what the boot pan exists to serve. So the rest
point is however close it needs to be for the POST to read, measured in pixels at the
gate viewport, and it is bounded below by that and above by the frame staying a
medium. It is not a number this ADR can choose.

**The extreme close-up on phosphor is cut from the film.** It appears nowhere else.
This was put to the owner against the alternative of moving it to chapter 1, and the
cut was chosen: three screen-facing beats in the first two chapters is one too many.

The boot pan's mechanism is unchanged — `PowerOn.tsx:170-178` still drives Lenis to
`REST_POINTS[0]` with `force` after a hold, and ScrollTrigger still publishes progress
through the ordinary path. `PAN_HOLD_MS` and `PAN_DURATION_S` are **settled numbers**
(gate 3.3 §4.2: "the current config is good") and are not retuned here. But they were
tuned against a move that no longer exists, so they get a fresh owner eye at the gate.
That is a re-ask, not a retune, and the distinction matters: an agent may not change
them on its own judgement.

### 3. The camera adapts to viewport aspect — one function, two consumers

A new module owns the viewport's effect on the camera, and both the journey and the
dock read it:

- `journeyFov(aspect)` — vertical fov. Above a reference aspect it is the existing
  **50°**, unchanged, so no desktop viewport sees any difference. Below it the
  vertical fov widens to hold horizontal fov roughly constant (a "hor+" adaptation),
  clamped at a ceiling so portrait does not turn into a fisheye. `JourneyCamera`
  writes `camera.fov` and calls `updateProjectionMatrix()` only when the value
  actually changes.
- `dockDistance(aspect)` — replaces the `DOCK_DISTANCE = 0.26` constant. The screen
  must fit in **both** axes: `max(height, width / aspect) / (2·tan(fov/2))`. That
  expression reproduces 0.26 exactly at aspect 1.2578, which is the point —
  **0.26 was already the aspect-1.2578 solution, hard-coded**. Making it a function
  recovers an intent rather than inventing one.

`dockAlignment.ts`'s `DOCK_FOV_DEG = 50` stops being a hand-maintained mirror of the
Canvas prop and becomes a call into the same function. The dock keyframe in
`cameraPath.ts` is repositioned on resize from the same value, so the analytic rect
and the camera pose cannot drift apart.

**Why not the alternatives:**

- *Fit the dock rect to the viewport with a `Math.min` scale.* Rejected, and this is
  the important one: the DOM shell **cross-fades** with the CRT's canvas texture at
  the dock (ADR-012 §4). A rect fitted to the viewport instead of derived from the
  camera would not sit where the 3D screen is, and the swap — the one moment the two
  renderers have to agree pixel-for-pixel — would become a visible jump. The rect has
  to stay analytic; the *camera* is what must move.
- *Letterbox the canvas at narrow aspects.* Rejected: the canvas is
  `fixed inset-0 -z-10` by design (ADR-013 §3) so the runway owns scroll, and bars
  over a full-bleed cinematic frame are a worse answer than a wider lens.
- *Per-keyframe fov on `CameraKey`.* Rejected: two knobs aimed at one target is the
  oscillation failure ADR-013 §7 already named for DRS versus the shed ladder. One
  function of aspect, applied uniformly, cannot fight the path.

### 4. Shell routing goes by orientation, not by width alone

`isTouchShell` gains the viewport height. On a coarse pointer, **portrait always gets
the touch shell**; landscape keeps today's width rule. Fine pointers are untouched.

This fixes the exactly-1024 boundary trap as a side effect, and it is the right rule
rather than a patched threshold: a tablet held landscape has the room for overlapping
windows, a taskbar and a real desktop metaphor; held portrait it does not.

Rotating an iPad therefore swaps the shell mid-session. That is intended, and the
resize path that carries it already exists (`Desktop.tsx:54-72`,
`DockSwap.tsx:332-337`).

**Why not the desktop shell on every tablet.** WCAG 2.5.5 forbids it: 640×480 chrome
at iPad-portrait scale gives title bars around 28 css px against the 44 px floor that
`TOUCH_TARGET_PX` exists to honour (`shellLayout.ts:20-21`). **Why not the touch shell
on every tablet.** A 12.9" screen in landscape showing solo-maximized phone windows
throws away both the room and the metaphor.

### 5. The dust goes, a lit corner lamp arrives, and the ladder drops to nine rungs

The owner's words (gate 10.1 §2.6): *"need to remove dust and replace with a tall lamp
in the corner."* `Atmosphere.tsx` keeps its light shafts and loses its mote cloud; a
new builder puts a tall lamp in the back-left corner — the one corner of the three
built walls that nothing occupies, and the corner the `bounce` directional exists to
keep from clipping to black.

**The lamp is a real light, and it sinks with dusk.** Its intensity is scaled by
`experienceState.duskDeepen` alongside `ambient`, `shaft` and `bounce`
(`Lighting.tsx:51-56`). The CRT cast is *not* dusk-scaled and stays capped at
`CAST_MAX 2.6`, so the screen is still the last light standing at chapter 5 — which
is the entire reason `duskDeepen` exists. A practical that stayed lit through the
dusk was offered and declined for exactly that reason.

**The brightness contract is untouched.** `LUMINANCE_CAP 0.7` in `CrtScreen` and
`CAST_MAX 2.6` in `Lighting` govern the CRT's cast into the room; the lamp is a
separate source with its own ceiling and does not enter either expression. Its bulb
mesh is expected to sit above Bloom's `luminanceThreshold` of 0.68
(`postprocessing.tsx:27`) — unlike the steam and the LEDs, a lamp that blooms is the
point.

**The shed ladder becomes nine rungs.** `dust` is rung 2 and its subject is being
deleted, so the flag, its `SHED_ORDER` entry and its `effectsState` key all go.

*Why the lamp does not simply take the slot and keep the count at ten:* no light in
`Lighting.tsx` is a rung today — `castFlicker` sheds the *flicker*, not the light —
and a corner going dark at rung **2** is a conspicuous pop, where vanishing motes were
put at rung 2 precisely because they are not. A garnish rung has to shed a real cost
*invisibly*; the lamp can manage one of those two and not the other. Keeping a
ten-rung ladder by pretending would be the ladder lying about what it costs.

ADR-013 §7a's `OFFER_AFTER_MS` is a **millisecond deadline** and does not depend on
the ladder's length, so the 30 s offer is unaffected: the walk simply gets one EMA
re-crossing shorter (about 1.75 s at a pinned 20 fps). All three of §7a's properties
survive. What does not survive is the prose: every "ten rungs" in `CLAUDE.md`,
`AGENTS.md`, `docs/design-system.md`, `fidelity.ts`'s `OFFER_AFTER_MS` comment and
`sheddable.ts`'s own `steam` comment is now wrong, and correcting them is part of this
change rather than follow-up tidying.

### 6. The skip affordance becomes pointer-class aware

The `skip intro` link is deleted for every visitor, as the owner asked (gate 10.1 §1).
On a **coarse pointer** the announced copy changes from `any key skips the intro` to
`tap anywhere to skip`, and the pointer skip is armed at the `idle` stage as well as
during the boot. Fine pointers keep today's behaviour exactly, including the
deliberate refusal to arm the pointer at `idle`.

ADR-013 §3a decided that the skip announces itself on the entry frame, and reasoned
that the pointer half should stay boot-only because "a stray click on the backdrop
costing the whole opening would be a worse trade". **That reasoning was written about a
mouse.** On a touch device it inverts: there is no key, so the announced copy promises
something the visitor cannot do, and the returning visitor's link — the element the
owner is asking to delete — is their only way out of the entry frame. §3a's own
principle, *copy that promises a skip has to be true where it is read*, is what forces
this.

So §3a is preserved where it was aimed and narrowed where it does not apply. The
branch reuses `coarsePointer()` from `shellLayout.ts`, which is the same split
`ScrollHint.tsx:57` already makes for "Swipe" versus "Scroll".

### 7. The mug's white top is a solid cylinder cap — a diagnosis, not a decision

Recorded because `HANDOFF.md:71-76` and gate 10.1 §3.6 both guessed wrong, and the
wrong guess would have sent the fix into `materials.ts`.

`buildMug` builds the body as `new CylinderGeometry(0.041, 0.038, 0.098, segs)`
(`mug.ts:13-16`). `openEnded` is not passed and **defaults to `false`**, so there is a
solid cap at local y 0.098 carrying `materials.mug`, whose bake fills `#ece8e0`
(`materials.ts:188-197`) — a near-white disc. The coffee disc's top face is at
y 0.090: 8 mm below that cap and 5 mm narrower. The mug is sealed and the coffee has
never been visible from any camera in the film. It is not a material problem and it is
not the chapter-3 angle.

`Steam.tsx:43-47` compounds it: `SURFACE_Y = 0.092` is *above* the coffee disc and
*below* the cap, so the wisps are born inside a sealed mug and climb out through the
lid. That is exactly what the owner described — "the steam comes out of a white top
surface of the mug."

The fix opens the vessel and gives coffee its own material (a dark warm brown with
enough specular to catch the CRT cast; `materials.rubber` at roughness 0.95 reads as
black rubber even once visible, and is shared with cables and the mouse pad so it
cannot be retuned in place). `Steam.tsx`'s constants quote `buildMug`'s numbers **in a
hand-written comment** — that is the only coupling between the two files, there is no
test on it, and the two must move together.

### 8. The tail wags faster by one rate multiplier, not by seven edited literals

`catIdle.ts` sums seven sines whose frequencies are chosen to be mutually
incommensurate, and the second cat runs every one of them at `CAT_B_RATE = 0.847`. The
header states the property this buys: the two tails never sit in phase and there is no
common period to notice over a two-minute watch.

Editing the literals individually risks landing on a rational ratio and producing a
visible beat, so the change is a **single multiplier on `t`** — which scales all seven
identically and preserves every ratio exactly.

It must scale `t`, **not `elapsed`**. `elapsed` is also the ear-flick clock
(`catIdle.ts:119-129`), and `FLICK_GAP_MIN`/`FLICK_GAP_SPAN` are specified in real
seconds — the file says so in a comment. The header's "the fastest term in the whole
driver has a ~12 s period" sentence becomes false at the same moment and is part of
the change.

Note that `CatMotion.tsx:83-90` already halves the wag when `idleDensity` is shed, so
the multiplier is chosen against the full-rate case and inherited by the half-rate one.

### 9. The title beat moves to the entry frame and becomes a title card

`TitleBeats` currently plays across **chapter 1** — `TitleBeats.tsx:3` says so and
`:26-28` normalizes across chapter 1's own span — fading in 12 % in, holding, and
fading after 80 %. The owner asked for it at the very beginning instead, beside the
power button and the skip copy, fading once the scene starts. (The request described
it as chapter 0; the beat is in chapter 1. The description of *where it appears* — over
the pulled-back monitor shot — was right, and that is the thing being moved.)

`TitleBeats.tsx` is deleted. `SITE.name` and `SITE.role` are rendered **at the top of
the entry frame** by `PowerOn`, with the ring floating wherever the power button
projects and `press power` / the skip copy staying at `bottom-[12vh]`. Top of frame is
chosen because the ring's position is not fixed — it tracks the projected 3D button
(`PowerButtonAnchor`), and after §1's recomposition it lands mid-frame — so a title
anywhere but the top could collide with it at a framing nobody has composed yet.

**The name outlives the controls.** The ring and the copy fade with the overlay's
existing 700 ms transition; the name holds a beat longer and dissolves during the LED
hold and the first POST lines. The durations are expressed as **fractions of the POST
phase**, matching `PAN_HOLD_MS` and `PAN_DURATION_S` (`PowerOn.tsx:83-88`), so the
title keeps its proportions if `bootScript` ever grows a line.

This requires the overlay's fade to split: `PowerOn`'s root stops carrying the
`transition-opacity` and two inner wrappers carry their own, because a single
transition on a common ancestor cannot give two children different durations.

**This narrows ADR-013 §3a rather than reversing it.** §3a's objection was to text
sitting "on top of the POST and the splash for fifteen seconds"; what ships here is a
dissolving title over the first POST lines for a couple of seconds, and **the splash is
still uncovered**. The alternative — fading the name with everything else at 700 ms —
was offered and declined: on the entry frame the beat's dwell is no longer a chapter of
scroll but "however long the visitor looks before clicking", and an eager visitor would
have got about a second.

**No scrim.** ADR-013 §3's "there is no scrim any more — a dark room and one glowing
button is the shot" stands. The title carries its own `text-shadow` for contrast,
exactly as `press power` already does. That is a legibility claim over an
uncontrolled backdrop and it is **measured at the gate, not assumed** — the dusk room
is dark, but the window shaft and the lit lamp from §5 are both behind this text.

The card is `aria-hidden="true"`, following `TitleBeats`' own precedent and ADR-012
§9: the canvas is cinematic and the content surface is the DOM floor. **Separately
noted, not fixed here:** `Hero.tsx:51` holds the page's only `<h1>` and it sits inside
`[data-floor]`, which `globals.css:182-190` sets to `display: none` while the
experience is mounted — so a capable client has **no `<h1>` in the accessibility tree
for the whole ride**. That is pre-existing and predates this ADR; making a title card
that unmounts at the end of the boot into the page's heading would be a worse fix than
none. It wants its own decision.

## Consequences

- **`cameraPath.ts` gains a runtime input.** It has been a pure function of progress
  since plan-0009 §4.1 and stays one for `sampleCameraPath`; what changes is that the
  dock keyframe's position is now written on resize. Anything that assumed `KEYS` is
  frozen after module load is now wrong.
- **`DOCK_DISTANCE` stops being importable as a constant.** `dockAlignment.ts` is its
  only consumer today; that import becomes a call.
- **The shed ladder is nine rungs.** `window.__fidelity.ladder` reports nine, and any
  QA script or note carrying "ten" is stale. There is no automated guard on the
  ladder's length — no test file references `SHED_ORDER` or `LADDER` — so the doc
  sweep is the only thing that keeps this honest.
- **Rotating a tablet swaps the shell**, and with it the virtual space and the scale.
  Window positions are held in virtual units, so a window placed in landscape lands
  somewhere else in portrait. Acceptable — the touch shell solo-maximizes anyway
  (`Desktop.tsx:76-78`) — but it is a real behaviour change and wants a look at the
  gate.
- **The gate's viewport matrix has to grow.** `headless-qa-notes.md` already records
  that every mobile claim on this scene was made at two phone portraits; a fix aimed
  at tablets that is verified at the same two sizes would repeat the exact mistake
  that produced this item. Tablet portrait and landscape both belong in the set, and
  the 1024-exactly case belongs in it by name.
- **Chapter 0 and chapter 3 now both show the room.** Chapter 0 is high, from
  behind-right, with the machine off; chapter 3 is front-left, at dusk, with the
  window, the shafts and the cats. They are different angles of different moments and
  the owner chose the wide knowing this — but if the film reads as repetitive at the
  gate, chapter 0's height and distance are the knobs, and this is the paragraph that
  says so.
- **Chapter 1 loses its only DOM overlay.** With `TitleBeats` deleted the chapter has
  the camera and the room and nothing else. That is the intent — its job is the glow
  (§2) — but it means chapters 0 and 1 now run back to back with no text at all after
  the entry fades, and `ScrollHint` is the only overlay left before the dock.
- **The entry frame gains two more lines of copy.** It is now name, role,
  `press power` and the skip line — four text elements where the QA notes record
  "three lines for a returning visitor and two for a first-timer". Any script matching
  on entry text is stale.
- **`PowerOn`'s root stops being a single fading unit.** The `transition-opacity` moves
  off the root onto two inner wrappers so the title can outlive the controls. Anything
  that assumed one opacity governs the whole overlay — including a QA probe reading the
  root's computed opacity to decide whether the entry is up — is now wrong.
- **`Atmosphere.tsx`'s `detail` prop becomes unused** once the motes go: it only ever
  controlled mote count (260 versus 90). It should be removed rather than left as a
  prop that does nothing, which means touching `RoomScene.tsx:149`.

## Alternatives considered for the branch as a whole

- **Fix the clipping and keep the macro** — pull the near plane in, or push the camera
  out 50 mm. Rejected: the near plane is global and the depth-precision cost is paid
  across the whole ride for one shot, while pushing the camera out does not fix a
  forearm that swings *between* the lens and the button. The owner also asked for a
  different shot, not a repaired one.
- **Ship the five worklist items and defer chapter 0.** Rejected: chapter 0 is the
  first thing every visitor sees, and item 5's fix lands in `cameraPath.ts` and
  `dockAlignment.ts` — the same files chapter 0 needs — so splitting them would mean
  composing the new opening twice, once per aspect regime.
- **Reproduce the iPad defect before deciding anything.** Partly rejected: the two
  root causes are arithmetic and were found by reading, and `HANDOFF.md:84-88`'s
  "start by reproducing at iPad viewports before changing anything" is honoured by
  making reproduction the *acceptance* step rather than the discovery step. The
  numbers say what is broken; the device says whether it is fixed.

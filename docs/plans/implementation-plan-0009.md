# Implementation Plan 0009 — The Workstation: Win98 cinematic origin-story experience

> Source decision: **ADR-012**
> (`docs/decisions/ADR-012-win98-workstation-cinematic-redesign.md`), which
> **supersedes ADR-005…ADR-011 as the experience layer** (the Lens retires) and
> retains ADR-001 (static export), ADR-002 (SVG diagrams), the ADR-006 §7/§7a
> imagery/confidentiality rules, and the entire `src/lib/` content model.
> Decisions were resolved branch-by-branch in a `/grill-with-docs` session
> (2026-07-18, ten questions); the locked transcript is summarised in ADR-012.
>
> **Status — IN PROGRESS.** Branch `redesign-attempt2`, from `main` @ `7969e26`.
> An earlier plan-0009 existed only on the deleted `complete-redesign` branch and
> never reached `main`; this file reuses the number cleanly.

## Context / Why

Full redesign around one autobiographical image: the owner at his literal first
computer — a Windows 98 machine — with the portfolio living *inside* it, the CRT as
the site's UI. Origin story leading, the machine's playful personality as the voice
(ADR-012 §1). Semi-stylized clay-first character, dusk scene, CRT as warm key light
(§2). 100 % runtime-procedural three.js — no DCC, no GLB (§3). Hybrid screen:
CRT-shader render-target in cinematic mode, pixel-aligned live DOM when docked;
scroll suspends while docked (§4). Six chapters (§5), six diegetic apps (§6),
gesture-unlocked three-tier sound (§7), 60/30 fps targets with opt-in downgrade
(§8), adapted mobile + static floor (§9), zero Microsoft assets (§10).

**Constraints (standing):** static export (ADR-001) — no SSR/API anywhere;
DOM/`window` access inside effects or `ssr:false` components only; React-compiler
purity (seeded `mulberry32` via `src/lib/prng.ts`, no `Math.random` in render/memo,
frame-time uniform writes via material refs); frame loops read mutable state, never
React state; design tokens in `globals.css` — the Win98-era token set is *added*,
raw hex stays out of components; **confidentiality** — no client names or figures
anywhere (CLAUDE.md); **imagery** — `public/screens/` recreations only; **IP** —
no Microsoft icons/sounds/fonts/logos ship (ADR-012 §10); tattoo reference photos
(`assets-src/workstation/tattoo0*.jpg`) never enter `public/` or the bundle.

**QA note:** per standing owner preference the agent runs **no browser QA**. Every
AFK slice's gate is `npm run lint` + `npm run build` green plus code-level
correctness. All *visual/audio* acceptance is owner-run at the four HITL gates
(1.2, 2.3, 4.3, 9.2). Gate 1.2 carries this plan's falsification clause: if the
procedural figure cannot reach an ownable silhouette, we return to ADR-012's
alternatives (deeper stylization) **before** any dependent slice starts.

## Slice overview

| # | Slice | Type | Blocked by |
|---|---|---|---|
| **P0** | **Clean slate + always-shippable floor** | | |
| 0.1 | Remove the Lens; homepage becomes the static floor | AFK | — |
| 0.2 | Experience scaffold: canvas, scrub skeleton, tier routing | AFK | 0.1 |
| **P1** | **The figure** | | |
| 1.1 | Character prototype in a test harness | AFK | 0.2 |
| 1.2 | **Owner QA gate: silhouette & likeness** | **HITL** | 1.1 |
| 1.3 | Color, wardrobe, tattoos, typing rig | AFK | 1.2 |
| **P2** | **Room & machine** | | |
| 2.1 | Procedural props + room | AFK | 0.2 |
| 2.2 | Lighting rig + atmosphere | AFK | 2.1 |
| 2.3 | **Owner QA gate: the scene** | **HITL** | 1.3, 2.2 |
| **P3** | **Windows 98 inside** | | |
| 3.1 | `Win98State` + boot machine + desktop painter + CRT shader | AFK | 0.2 |
| 3.2 | Shell chrome (DOM): windows, taskbar, Start, icons | AFK | 3.1 |
| 3.3 | Boot & shutdown sequences (both renderers) | AFK | 3.1 |
| **P4** | **The journey & the dock** | | |
| 4.1 | Chapter choreography 0–3 + 5, press-power entry | AFK | 2.2, 3.3 |
| 4.2 | The dock swap (precision slice) | AFK | 3.2, 4.1 |
| 4.3 | **Owner QA gate: full ride-through** | **HITL** | 4.2 |
| **P5** | **The six apps** | | |
| 5.1 | Explorer + project windows + IE frame + diagrams | AFK | 3.2 |
| 5.2 | resume.doc + `C:\Career\` + Add/Remove Programs + ABOUT_ME.txt | AFK | 3.2 |
| 5.3 | Outlook compose + dial-up shortcuts + ch. 5 contact layer | AFK | 3.2, 4.1 |
| **P6** | **Sound** | | |
| 6.1 | Audio engine + Tier-1 palette + mute persistence | AFK | 4.1 |
| 6.2 | Tier-2/3 texture sounds *(cuttable)* | AFK | 6.1 |
| **P7** | **Mobile, a11y, performance** | | |
| 7.1 | Mobile adaptation: maximized windows, touch, DRS | AFK | 4.2, 5.1–5.3 |
| 7.2 | Watchdog + tier shedding + 60/30 hardening | AFK | 7.1 |
| **P8** | **Easter eggs (entirely cuttable)** | | |
| 8.1 | Recycle Bin "old designs" + BSOD gag | AFK | 3.2 |
| 8.2 | Minesweeper (original implementation/art) | AFK | 3.2 |
| **P9** | **Close-out** | | |
| 9.1 | Docs reconcile (CLAUDE.md, AGENTS.md, README, design-system) | AFK | 4.3 |
| 9.2 | **Owner final QA, all tiers + mobile → merge** | **HITL** | all |

P5 runs in parallel with P4 once 3.2 lands. P8 is cuttable/deferrable with zero
structural damage.

---

## 0.1 — Remove the Lens; homepage becomes the static floor · AFK

**Files:** delete `src/components/lens/` wholesale (prism, refraction pass, kinetic
registry, choreography, `lensState`); rewrite `src/app/page.tsx` and touched
components to render the **static floor**: a clean, fast, 2D single page composed
from `src/lib/` — hero (name/role from `nav.ts`), projects (cards with diagrams via
`InlineDiagram` or `<img>`), skills tiers, experience timeline, stats, contact +
resume download. Remove Lens-only imports from layout; keep design tokens working.

This is deliberate sequencing: the floor is ADR-012 §9's accessibility/SEO surface
*and* it means the deployed site is never broken mid-build — every later slice adds
the experience on top of a complete page.

**Acceptance:** lint + build green; `src/components/lens/` gone; no import of it
anywhere; the exported page contains all content sections with semantic headings;
no `<canvas>` yet; `public/diagrams`, `public/screens`, `public/resume.pdf` intact.

---

## 0.2 — Experience scaffold · AFK

**Files (new):** `src/components/workstation/WorkstationRoot.tsx` (`dynamic`,
`ssr:false`), `WorkstationCanvas.tsx`, `choreography/Choreography.tsx`,
`src/lib/chapters.ts`, `src/lib/experienceState.ts`; edits to `page.tsx` and
`src/lib/gpuTier.ts` reuse.

- Persistent full-viewport canvas behind a scroll-height div sized by
  `chapters.ts` (chapter list, scroll spans, rest points — data, not JSX).
- Lenis + GSAP ScrollTrigger wired to a stub camera (dolly on a line) proving
  scrub + soft snap; `experienceState` is the mutable frame-state singleton
  (chapter index, scroll progress, docked flag, fidelity tier) mirroring the old
  `lensState` pattern.
- Routing: `gpuTier` detection + `?tier=high|low|static` override + WebGL-fail +
  `prefers-reduced-motion` all route to the 0.1 floor (canvas never mounts);
  otherwise the experience mounts over the floor's hidden-but-present content.
- Test-harness param `?scene=` (e.g. `?scene=character`) mounts isolated scenes
  for P1/P2 development; harness code is dev-only but URL-gated, not build-gated
  (owner QAs production builds).

**Acceptance:** lint + build green; scrub + snap demonstrable on the stub; static
floor unreachable-canvas paths verified by code inspection; no React state read in
frame loops.

---

## 1.1 — Character prototype · AFK

**Files (new):** `src/components/workstation/character/` — `Figure.tsx`,
`buildBody.ts`, `buildHead.ts`, `buildHair.ts`, `buildBeard.ts`, `idle.ts`.

Seeded, parametric, clay-first (single matte clay material, ADR-012 §2/§3):

- **Body:** lathe/capsule construction in seated typing pose — the pose *is* the
  model; no T-pose/retarget machinery. Proportions from the concept sheets.
- **Head:** simplified planes — brow, nose, cheekbones; no eyes/mouth detail (the
  face is never the hero). Hoop earring (left), earbud shapes in both ears.
- **Hair:** instanced tube-curls (seeded scatter over the scalp cap, 2–3 curl
  archetypes); **beard:** shaped volume with surface break-up, not strands.
- **Idle:** `idle.ts` drives breathing (chest scale ~4 s), blinks (lid plane,
  randomized 2–6 s via seeded PRNG), subtle head sway — all sine/noise driven,
  written to object refs in `useFrame`.
- Harness `?scene=character`: figure on a stool proxy, dusk-blue fill + warm
  key light from screen direction, orbitable camera for owner inspection.

Detail parameter (`low|high`) on every builder from day one — LOD is parametric,
not retrofitted (ADR-012 §8).

**Acceptance:** lint + build green; all geometry from seeded builders (no
`Math.random`); silhouette readable as *a person with curly hair and a beard at a
keyboard* in the harness; idle running; poly budget recorded in the slice notes
(target < 60 k for the figure).

---

## 1.2 — Owner QA gate: silhouette & likeness · **HITL**

`npm run dev` (port 3004), `localhost:3004/?scene=character`. Judge at the
distances the experience will actually use (chapter 2's mid-shot orbit — the
harness camera has a "chapter 2 frame" preset):

- [ ] Silhouette instantly reads: curly hair, full beard, seated typing posture.
- [ ] Nothing uncanny — the face's *absence of detail* reads as style, not defect.
- [ ] Hair curls read as curls at mid-shot (not blobs, not noise).
- [ ] Earring + earbuds visible in profile.

**Output:** approve, or a defect list for another 1.1 iteration. **Falsification
clause:** if after two iterations the form still fails, stop — reopen ADR-012's
stylization alternatives (flat-shaded figure, silhouette-only treatment) rather
than polishing toward the uncanny valley. Nothing in P1.3+ starts until this gate
passes.

---

## 1.3 — Color, wardrobe, tattoos, typing rig · AFK · blocked by 1.2

**Files:** `character/` additions — `skinTexture.ts` (canvas albedo bake),
`tattoos.ts`, `buildWardrobe.ts`, `typing.ts`.

- Color zones on the clay forms: skin, black tee, jeans, sneakers; smartwatch on
  the left wrist (per concept sheets).
- **Tattoos** (ADR-012 §3): painted simplified recreations composited into the
  right-forearm albedo canvas — inner-wrist glyph stack, ninja-star, molecule,
  pocket-watch + roses, outer feather/wing, and the **red-and-black koi + lotus**
  oriented so the red catches the CRT light pool in the typing pose. Drawn as
  canvas vector ops (paths, not embedded images); reference photos stay in
  `assets-src/`.
- **Typing:** `typing.ts` — finger-tap cycle on seeded rhythm (drives 6.2's clack
  sync later), wrist micro-motion; occasional "big beat" (lean back / mug sip
  reach every ~90 s) as a timeline of pose targets.

**Acceptance:** lint + build green; albedo generated once at startup (no per-frame
canvas work); no image file under `public/` contains tattoo **reference**
photography (see the clarification below); koi visibly red in the harness's key
light; typing loop runs without allocation churn in `useFrame`.

> **Clarified 2026-07-30 (ADR-013 §9, gate 6.2).** This criterion originally read
> "no image file under `public/` contains tattoo photography", and read literally
> it was **never true** — `public/aravind-2.jpg` has shipped since before this plan
> and shows the owner's tattooed forearms. The boundary always meant the four
> **reference close-ups** (`assets-src/workstation/tattoo01–04.jpg`), which is what
> this plan's own preamble says and what ADR-013 §9's heading says. Three of the 23
> Gallery photographs show tattooed forearms incidentally and were each cleared by
> the owner at gate 6.2. **Three separate sessions have re-flagged the literal
> wording as a breach; it is not one — do not re-open it.**

---

## 2.1 — Procedural props + room · AFK

**Files (new):** `src/components/workstation/builders/` — one module per prop:
`crt.ts`, `tower.ts`, `keyboard.ts`, `mouse.ts`, `speaker.ts`, `mug.ts`,
`notebook.ts`, `cdStack.ts`, `floppies.ts`, `cables.ts`, `desk.ts`, `chair.ts`,
`poster.ts`, `room.ts`; `materials.ts` (shared canvas-baked PBR: wood grain, aged
plastic with subtle yellowing, paper, rubber, painted metal).

Layout per the concept sheets: CRT on tower, keyboard front-center, mouse right,
single speaker right of tower, CD stack (spines labeled with `resume.ts`
certifications — cheap 8.x setup), mug "Ctrl Alt Del" left, notebook + pen
front-left, Win98-*style* poster on the wall (period pastiche, **no Microsoft
logo/wordmark** — ADR-012 §10), window frame on the fill side, cables lathed
along fixed curves (no physics). CRT screen is a distinct mesh with its own
material slot — 3.1 targets it. Every builder seeded + detail-parameterized.

**Acceptance:** lint + build green; `?scene=room` harness shows the dressed set;
no texture > 1024²; poster/mug/CD text drawn by canvas ops, no Microsoft marks;
total scene (props, no figure) < 150 k tris at high detail.

---

## 2.2 — Lighting rig + atmosphere · AFK · blocked by 2.1

**Files (new):** `workstation/scene/Lighting.tsx`, `Atmosphere.tsx`,
`postprocessing.tsx`.

- **Dusk rig (ADR-012 §2):** cool blue-hour directional + soft ambient through
  the window side; warm **CRT key light** — a point/rect light at the screen whose
  intensity *and* color are driven each frame from the current screen content's
  average luminance/tint (boot white flicker, desktop teal, BSOD blue, shutdown
  amber). Frame-driven via refs, never React state.
- **Atmosphere:** dust motes (instanced points drifting in the window shaft),
  faked light-shaft billboards. No fog, no true volumetrics (ADR-012 §2).
- **Post:** bloom (threshold tuned so only the screen and its hotspots bloom),
  ACES tone mapping, vignette. Effects registered in a **sheddable-tier list**
  (dust/shafts → cast flicker → bloom richness) that 7.2 will drive.

**Acceptance:** lint + build green; screen-light color demonstrably follows a test
pattern cycling in the harness; all garnish behind tier flags; no per-frame
allocations in atmosphere loops.

---

## 2.3 — Owner QA gate: the scene · **HITL** · blocked by 1.3, 2.2

`?scene=full` — figure seated in the dressed, lit room, idle + typing running,
orbitable camera.

- [ ] Dusk mood lands: cool fill vs. warm screen key, figure separated from room.
- [ ] Tattooed forearm reads in the light pool; koi red visible.
- [ ] Props read as *his* desk (mug text, notebook, CD spines legible-ish close).
- [ ] Nothing blows out; nothing murky. (The Lens's ADR-011 lesson: judge on real
      hardware, report specifics, don't let the agent guess magnitudes.)

**Output:** approve or defect list. Lighting magnitudes may get a temporary
URL-param tuner *only if* iteration stalls — and it is deleted the same slice it
lands, per the plan-0008 precedent.

---

## 3.1 — `Win98State` + boot machine + desktop painter + CRT shader · AFK

**Files (new):** `src/lib/win98State.ts`, `src/components/win98/painter.ts`,
`src/components/workstation/crt/CrtScreen.tsx`, `crtShader.ts`.

- **`win98State.ts`:** one store (module singleton + subscribe, `lensState`
  pattern) holding boot phase (`off → post → splash → desktop → shutdown`),
  desktop icons, z-ordered window list, focus, Start-menu open state. Consumed by
  *both* renderers (ADR-012 Architecture) — the painter and the 3.2 DOM read the
  same state; the dock swap is a view change.
- **Painter:** draws the desktop (teal field, icons, taskbar, open windows as
  simplified chrome) into a canvas → `CanvasTexture` on the CRT screen mesh.
  Redraws **on state change only**, not per frame.
- **CRT shader:** barrel curvature, scanlines, phosphor mask, subtle flicker +
  glow on the screen mesh; exposes average-luminance/tint uniforms that 2.2's
  screen-light reads.

**Acceptance:** lint + build green; painter redraw is event-driven (verified: no
painter work in `useFrame`); shader curvature/scanlines visible in harness;
state transitions pure and unit-testable without a canvas.

---

## 3.2 — Shell chrome (DOM) · AFK · blocked by 3.1

**Files (new):** `src/components/win98/shell/` — `Desktop.tsx`, `Window.tsx`
(drag/resize/z-order/focus/min/max/close), `Taskbar.tsx`, `StartMenu.tsx`,
`Icon.tsx`, `ContextMenu.tsx`, `chrome.css` (bevels, title bars); `pixelIcons.ts`
(**original pixel-art icon set** drawn as canvas/SVG data — folder, computer,
recycle bin, envelope, document, globe-ish browser, mine); Win98-era token block
in `globals.css` (chrome greys, teal, bevel shadows, title-bar gradient); an
openly-licensed period-style bitmap font added under `public/fonts/` with license
file.

Windows are plain divs against `win98State`; keyboard: tab/focus order, Esc
closes, Alt-Tab-like cycling optional. Everything the six apps will render
through — apps get a `<Win98Window>` contract (title, icon, content, min size).

**Acceptance:** lint + build green; drag/resize/z-order/focus work with mouse,
touch pointer events, and keyboard; zero Microsoft-derived assets (icon set +
font license verifiable in-repo); chrome uses tokens, no raw hex.

---

## 3.3 — Boot & shutdown sequences · AFK · blocked by 3.1

**Files (new):** `src/components/win98/apps/Boot.tsx` + painter equivalents;
content module `src/lib/bootScript.ts`.

- **POST (ADR-012 §5/§6):** text-mode screen counting the owner's stats as
  hardware — `Memory: 600+ client accounts OK`, `Detecting drives: 44 GMC
  sub-accounts found`, `19 websites on one tagging bus`, `200+ consultants
  supported` — sourced from `stats.ts` (single source of truth; the gag lines
  live in `bootScript.ts` and interpolate the numbers).
- **Splash:** original period-*style* boot screen (clouds-and-gradient pastiche,
  site's own wordmark — no Windows logo). **Shutdown:** amber "It's now safe to
  turn off your computer" glow.
- Boot doubles as the loader (ADR-012 §8): POST lines pace real async work
  (texture bakes, character build) — a line completes when its work does, with a
  minimum-time floor so fast machines still get the beat. Skippable.

**Acceptance:** lint + build green; boot phases render in painter (and DOM parity
for docked replay); stats interpolate from `stats.ts` (no hardcoded numbers);
skip works; total auto-play ≈ 5 s on a warm cache.

---

## 4.1 — Chapter choreography 0–3 + 5 · AFK · blocked by 2.2, 3.3

**Files:** `choreography/Choreography.tsx` (real now), `cameraPath.ts`,
`src/lib/chapters.ts` (final spans); entry overlay `PowerOn.tsx`.

- **Entry:** dark frame, glowing power button (DOM overlay targeting the tower's
  screen-space position); click = audio unlock (6.1 hooks here) + boot start;
  skip/resume affordance for returning visitors (`localStorage`).
- **Camera:** one GSAP timeline scrubbed by Lenis — ch. 1 CRT close-up pull-back,
  ch. 2 orbit to profile, ch. 3 dolly-back + crane to wide, ch. 5 widest + dusk
  deepens + shutdown + contact layer. Soft snap at rest points; arrow/space
  step chapters; chapter-keyed lighting cues (dusk deepening) ride the same
  timeline. Title beats (name/role in ch. 1) as DOM overlays keyed to progress.
- Ch. 4's dock is stubbed (camera reaches the dock pose; swap lands in 4.2).

**Acceptance:** lint + build green; scrub, snap, and keyboard stepping all drive
the same timeline; no React state in the frame path; reverse-scrubbing any
chapter is artifact-free; ch. 0 auto-plays and never scrubs.

---

## 4.2 — The dock swap (precision slice) · AFK · blocked by 3.2, 4.1

**Files (new):** `workstation/crt/DockSwap.tsx`, `dockAlignment.ts`.

The ADR-012 §4 contract, treated as a precision problem:

- At the dock pose the camera locks square-on; `dockAlignment.ts` computes the
  screen mesh's exact screen-space quad and sizes/positions the DOM shell
  (`transform: matrix3d`) to it; cross-fade painter→DOM ≤ 150 ms.
- **Color/tone match:** the DOM side carries the CRT look via CSS (scanline
  overlay, vignette, faint edge curvature mask) calibrated against the shader so
  the fade is invisible; tone-mapped GL vs. sRGB CSS is the known trap — the
  painter's palette is authored in sRGB and the screen material is excluded from
  scene tone mapping so both sides share one color space.
- **Scroll contract:** docked ⇒ Lenis stopped, wheel/touch events go to the
  shell; closing/minimizing all windows surfaces the "keep scrolling" hint;
  scroll input then undocks (reverse fade) and resumes the journey.
- Resize/devicePixelRatio changes re-run alignment.

**Acceptance:** lint + build green; alignment error ≤ 1 px at 1×/1.5×/2× DPR
(computed, logged in dev); no input dead zones across the swap; undock returns
scroll without jump; state persists across dock cycles (open windows stay open).

---

## 4.3 — Owner QA gate: full ride-through · **HITL** · blocked by 4.2

Production build (`npm run build` + serve `out/`), real hardware:

- [ ] Power press → boot → glow → man → room → dock → sign-off: one continuous
      cinematic whole; no seam at the dock swap (the acceptance bar: *you can't
      point at the frame where it happens*).
- [ ] Scrub feel: pacing ~60–90 s to dock, snap points land where the eye rests.
- [ ] Docked: windows crisp, draggable; suspend/resume contract feels natural.
- [ ] Reverse-scrub anywhere: no artifacts.

**Output:** approve or defect list (pacing numbers welcome — "ch. 2 too slow" is
actionable; magnitudes stay owner-calibrated).

---

## 5.1 — Explorer + project windows + IE frame + diagrams · AFK · blocked by 3.2

**Files (new):** `win98/apps/Explorer.tsx`, `ProjectWindow.tsx`, `IEFrame.tsx`.

`My Projects` desktop folder → Explorer listing the 5 `projects.ts` entries →
each opens a `ProjectWindow`: title bar with pixel icon, problem/approach/outcome
copy, stack + capability chips restyled as Win98 property rows, `howAI` callout
(omitted when absent — the ADR-005 honesty rule), the animated SVG diagram
(ADR-002 one-shot draw-on, replayable via a period "refresh" button), and — when
a screenshot exists — an **IE-style frame** with the fictional `domain` in the
address bar rendering the `public/screens/` recreation. `personas`
(`status: "in-progress"`) opens with an "unfinished copy" dialog first.

**Acceptance:** lint + build green; all five render from `projects.ts` with zero
content duplication; diagrams animate inside windows; IE chrome is original
pastiche (no `e` logo); windows usable at 800×600-ish minimum sizes.

---

## 5.2 — resume.doc + `C:\Career\` + Add/Remove Programs + ABOUT_ME.txt · AFK · blocked by 3.2

**Files (new):** `win98/apps/WordPad.tsx`, `CareerTree.tsx`,
`AddRemovePrograms.tsx`, `Notepad.tsx`; content `src/lib/aboutMe.ts` (**new copy,
owner-reviewed at 9.2**).

- `resume.doc` in a WordPad-style viewer composed from `resume.ts`; `Download…`
  button serves `public/resume.pdf`.
- `C:\Career\` in Explorer's tree pane: one folder per employer, oldest nested
  deepest (Sutherland → Dell → Regalix → Flatworld → Assembly), each folder's
  "files" the role's bullet points.
- **Add/Remove Programs:** the three `SKILL_TIERS` as install categories, each
  skill a program row with a playful install date; blurbs as descriptions.
- `ABOUT_ME.txt` in Notepad — short, sincere, machine-voice-free (the one
  deadpan-sincere surface, ADR-012 §1).

**Acceptance:** lint + build green; all content from `resume.ts`/`aboutMe.ts`;
PDF download works from static export; tree keyboard-navigable.

---

## 5.3 — Outlook compose + dial-up shortcuts + ch. 5 contact layer · AFK · blocked by 3.2, 4.1

**Files (new):** `win98/apps/Outlook.tsx`, `DialUp.tsx`; `workstation/SignOff.tsx`.

- Outlook-style compose pre-addressed to `SITE.email` (`nav.ts`); Send opens
  `mailto:` with typed subject/body (no backend — ADR-001).
- LinkedIn/GitHub desktop shortcuts play a brief dial-up/connect gag
  (`DialUp.tsx`), then open the real profile in a new tab (`rel="noopener"`).
- **Ch. 5 contact layer:** after the shutdown beat, `SignOff.tsx` DOM overlay —
  email, LinkedIn, GitHub, resume download — unmissable, keyboard-focusable, the
  journey's final rest point.

**Acceptance:** lint + build green; `mailto:` correctness; external links
new-tab + noopener; sign-off layer reachable by keyboard scrub alone.

---

## 6.1 — Audio engine + Tier-1 palette + mute persistence · AFK · blocked by 4.1

**Files (new):** `src/lib/audio.ts`; assets under `public/audio/` with a
`LICENSES.md` beside them.

- WebAudio engine: unlock on the 4.1 power press; buses (UI / machine / room)
  with a master mute toggle (persistent tiny control, state in `localStorage`);
  static-floor visitors get no engine at all.
- **Tier-1 sounds (ADR-012 §7):** degauss thunk, BIOS beep, startup chime,
  click, window open/close, error ding, shutdown, low CRT hum bed. **Every clip
  original or verifiably openly-licensed** (CC0/CC-BY with attribution in
  `LICENSES.md`) — evocations, not Microsoft samples; the chime is an original
  composition in the era's spirit. Where sourcing stalls, synthesize (the thunk,
  beep, ding, and hum are all synthesizable in WebAudio) rather than risk IP.
- Hum ducks while docked (reading music, not cinema).

**Acceptance:** lint + build green; no audio before the gesture; mute persists
across reloads; every file in `public/audio/` has a `LICENSES.md` entry; total
audio payload < 1.5 MB.

---

## 6.2 — Tier-2/3 texture sounds · AFK · blocked by 6.1 · *cuttable*

Keyboard clacks synced to `typing.ts`'s tap events, HDD seek chatter paced by
3.3's boot lines, hum shift with screen brightness, egg stingers (8.x), dusk room
tone + fan bed, earbud music leak gated by camera-to-head distance (ch. 2 orbit).
Same licensing regime.

**Acceptance:** lint + build green; clack timing driven by the typing rig's
events (not a parallel timer); all Tier-2/3 sounds sit on sheddable buses.

---

## 7.1 — Mobile adaptation · AFK · blocked by 4.2, 5.1–5.3

**Files:** shell + apps responsive pass; `dockAlignment.ts` touch branch;
`src/lib/dynamicResolution.ts` (**new**).

- Docked on small screens: windows open **maximized, one at a time** (ADR-012
  §9); title-bar controls ≥ 44 px; swipe-down closes; Explorer/tree panes
  collapse to stacked lists; taskbar becomes a bottom app bar.
- Cinematic on mobile: DRS (render-scale 0.6–1.0 driven by frame-time EMA),
  Tier-2 garnish off by default, touch scrub through Lenis.
- LinkedIn in-app browser smoke path: experience boots or routes to floor —
  never a blank canvas.

**Acceptance:** lint + build green; maximized-window mode verified at 360×640
and 390×844 viewports; DRS scales without layout thrash; no hover-only
affordances remain in the shell.

---

## 7.2 — Watchdog + tier shedding + 60/30 hardening · AFK · blocked by 7.1

**Files:** `src/lib/gpuTier.ts` (extend, keep the ADR-010 §2 opt-in prompt),
`workstation/fidelity.ts` (**new** — the shed ladder).

- Watchdog on sustained slow frames **asks before** downgrading (principle
  carried from the Lens, restated in ADR-012 §8); `?tier=` override retained.
- Shed ladder wired: dust/shafts → cast flicker → bloom richness → idle
  density → DRS floor → offer static floor. Builder detail params get a
  low-tier pass.
- Perf sweep: instancing audit (curls, dust, keycaps), texture budget ≤ 1024²
  each / ≤ 24 MB total GPU upload, draw-call budget recorded, no per-frame
  allocations (verified with a dev counter), lazy-load boundaries confirmed
  (each 5.x app + 8.x egg its own chunk with hourglass loading state).

**Acceptance:** lint + build green; bundle report in slice notes (initial JS,
per-chunk sizes); 60 fps on the owner's desktop and 30 fps floor on a mid phone
*measured at 9.2*, with the ladder demonstrably shedding in dev throttling.

---

## 8.1 — Recycle Bin + BSOD gag · AFK · blocked by 3.2 · *cuttable*

Recycle Bin opens to "old portfolio designs" — deadpan entries for the retired
experiments ("lens.exe — a prism that refracted everything", "noise_signal.tmp")
with restore disabled ("These files cannot be restored."). BSOD triggers on
forbidden actions (deleting `System32`, emptying the bin twice): full-screen
blue text in period style, any key "reboots" to a fast desktop restore with a
wink line. BSOD text is original copy; no real crash strings.

**Acceptance:** lint + build green; BSOD recoverable via keyboard and touch;
gag text contains no client names (CLAUDE.md rule applies to jokes too).

---

## 8.2 — Minesweeper · AFK · blocked by 3.2 · *cuttable*

Original implementation, original pixel art, classic rules (9×9/16 mines
default), timer + counter, in a standard `<Win98Window>`. Keyboard playable
(arrows + space/enter, F for flag).

**Acceptance:** lint + build green; win/lose states correct (first-click safe);
its chunk lazy-loads on first open.

---

## 9.1 — Docs reconcile · AFK · blocked by 4.3

- **`CLAUDE.md` / `AGENTS.md`:** rewrite the experience paragraphs for the
  Workstation (ADR-012): canvas location, choreography owner, `win98State`,
  dock contract, fidelity ladder, IP rule. The confidentiality block stays
  verbatim. Lens-specific rules (kinetic registry, projection targets) go.
- **`README.md`:** overview + decisions list gains ADR-012; Lens description
  replaced.
- **`docs/design-system.md`:** Win98 token set, pixel font, fidelity ladder
  table for the new effects; Lens tables removed.
- **ADR-005…ADR-011:** one-line status pointer atop each — superseded as
  experience layer by ADR-012; process principles that survive are named where
  they're restated. **Files not renamed, content not rewritten** — ADRs are
  immutable records.
- Historical plans 0001–0008: **left untouched** (closed records).

**Acceptance:** no living doc describes the Lens as shipped; every pointer
resolves; lint + build green.

---

## 9.2 — Owner final QA + sign-off · **HITL** · blocked by all

Production static export on real hardware + a real phone:

- [ ] Full ride-through (desktop): cinematic whole, dock seamless, all six apps
      correct against `src/lib` content; `ABOUT_ME.txt` copy approved.
- [ ] Eggs: Recycle Bin, BSOD recovery, Minesweeper (if not cut).
- [ ] Sound: unlock, palette, mute persistence, docked hum duck.
- [ ] Mobile: chapters at 30 fps+, maximized windows usable with thumbs,
      LinkedIn in-app browser path.
- [ ] Tiers: watchdog prompt appears under throttling and downgrades only on
      consent; `?tier=low` presentable; `?tier=static` + reduced-motion floor
      complete and crawlable (view-source check).
- [ ] IP sweep: no Microsoft marks/sounds/fonts anywhere (`public/` audit +
      `LICENSES.md` review).
- [ ] 60 fps desktop / 30 fps mobile floor measured.

**Then:** merge `redesign-attempt2` → `main`.

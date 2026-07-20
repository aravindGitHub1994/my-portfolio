# HANDOFF — Win98 Workstation redesign (2026-07-20, session 10 wrap)

> For the next agent session. **Gates 1.2, 2.3 and 4.3 PASSED** (owner).
> P3 + P4 complete and owner-verified. **P5 CLOSED** at 5.3 (`2f22f6e`).
> **P6 CLOSED**: 6.1 (`2cb71f8`), 6.2 (`8aed018`).
> **7.1 CLOSED this session**: `f7aead3` (touch shell) + `0085af6`
> (dock/DRS/fallback). Next: **7.2 watchdog + shed ladder** /
> P8 eggs (cuttable) / 9.1 docs → final HITL gate 9.2.
> Never pass gates autonomously.

## Current Status

- Branch **`redesign-attempt2`** (off `main` @ `7969e26`). Ledger:
  P0–P2 + gate-1.2/2.3 iterations in git log (don't re-derive) ·
  P3 `e7a106b`/`89670dc`/`d816bda` · 4.1 `ad493db` · 4.2 `e66cd75`
  (dock swap; stuck-dock defect + phase-machine fix and keyboard undock
  documented in that commit message) · **gate 4.3 PASSED** on a served
  production build of `e66cd75` · 5.1 `95bbf76` · 5.2 `493d4ea` ·
  5.3 `2f22f6e` · 6.1 `2cb71f8` · 6.2 `8aed018` · 7.1a `f7aead3` ·
  **7.1b `0085af6`**.
- **Session 10 (this one) was interrupted three times mid-slice** and
  recovered each time by the recipe below. It holds: the working tree
  survives session death, so the cut point is always "what is on disk vs
  what the last message claimed". Twice the narration was ahead of the
  disk. **Typecheck first, then diff the claim against `git status`.**
  Committing verified halves (7.1a) rather than carrying one large
  uncommitted tree is what made the third interruption cost nothing.
- **P7 (7.1 closed, 7.2 open):**
  - **7.1a `f7aead3`** — `shellLayout.ts` is the ONE answer to "is this a
    thumb-driven shell, and what virtual space does it get?", pure so the
    DOM shell and the dock aligner cannot disagree. On touch the shell
    does **not** shrink the 640×480 space to fit (scale 0.56 renders 8px
    chrome type at ~4.5 css px — illegible); it holds the scale near 1
    and makes the VIRTUAL SPACE portrait (~340 units wide). `DESKTOP_W/H`
    are untouched — they are the painter's CRT texture size and mean
    something different. Layout travels by **context** (a view fact);
    **solo** lives in the store (so every open path obeys it).
  - **7.1b `0085af6`** — dock touch branch (touch never docks to the CRT
    quad; `DockRect` carries `virtualW/H`), DRS, and the in-app-browser
    fallback. See both commit messages for the reasoning; they are long
    on purpose.
- **Two 7.1 details that will look wrong and are not:**
  - Touch controls are the **full** `touchUnit` and the *bar grows* to
    hold one — not controls inset inside an era-sized bar. That inset is
    exactly what measured 38.1 px against a 44 px requirement mid-session.
  - DRS seeds its EMA from the frame **budget**, not the first delta.
    The first frame carries shader compilation; seeding from it starts
    the average ~10× high and spends a visible dip-and-recover.
- **Session 9 was also a recovery**, not a fresh slice: session 8
  died mid-6.2 with the work ~95 % written. Sole damage was one
  unresolved identifier — `AudioTextures.tsx` called `NECK_PIVOT` where
  the `HEAD_FOCUS` export added in the same diff was meant. Intent was
  confirmed by recomputation rather than guess: the four camera
  distances quoted in the leak-falloff comment (0.53 / 1.28 / 1.46 /
  2.19) reproduce exactly against `HEAD_FOCUS` and match nothing against
  `NECK_PIVOT`. Typecheck, lint and build green; committed unchanged in
  substance. **If a slice looks half-finished, typecheck first — the cut
  point is usually one identifier, not a design gap.**
- **P6 audio (closed):**
  - **6.1 `2cb71f8`** — `src/lib/audio.ts`. ALL Tier-1 sounds
    synthesized in WebAudio; **zero sample files ship** (0-byte audio
    payload). Owner chose full synthesis over CC0 sourcing so ADR-012
    §10's IP question is unanswerable rather than merely answered;
    `public/audio/LICENSES.md` records that posture and the synthesis
    recipe for every cue. Chime is an original F–A–C–G′ FM-bell figure.
    `unlockAudio()` rides PowerOn's press **and** skip, *before*
    `startBoot()` — the sequencer sets phase `post` synchronously and
    that fires the cues. Cues **observe** `win98State` via
    `subscribeWin98` + diff, so the store's no-DOM purity holds and no
    app component imports audio. `MuteToggle` sits at the experience
    root, **not** the Win98 tray, because boot audio precedes the ch. 4
    dock. Hum ducks on the `docked` flag at all three DockSwap writes.
  - **6.2 `8aed018`** — `AudioTextures.tsx`, one frame reader mounted in
    the journey Canvas. **Every sound rides an existing rig's state
    rather than a clock of its own** (the §6.2 acceptance demands it for
    clacks; the same discipline is applied throughout, since a parallel
    timer drifts the moment a frame stalls): clacks off
    `typingState.taps`, drive chatter off the POST-line diff, hum tone
    off `screenLight.luminance`, fan bed off `duskDeepen`, earbud leak
    off camera distance to `HEAD_FOCUS`. Leak is scheduled by frame-loop
    lookahead, never `setInterval`, so a throttled tab can't
    burst-schedule on return. New `texture`/`music` buses are the
    **sheddable pair** (`setBusShed`, typed `SheddableBus`); tier-1 is
    never optional by construction. `playEggStinger` is synthesized and
    exported but **uncalled until 8.x**.
- **Two 6.2 details that read as redundant and are not** — don't
  "simplify" either without re-reading the reasoning in-file:
  - The earbud leak's `chapterIndex === 2` gate is load-bearing, not
    belt-and-braces: **ch. 1's rest pose sits 0.53 from the head, closer
    than ch. 2's 1.28**, so on distance alone the leak would be loudest
    during the opening beat where the earbud isn't the subject.
  - `MIN_CLACK_GAP_S` thins eight-finger typing (~17.6 taps/s) to
    ~11 clacks/s. It does **not** reintroduce a timer — no clack fires
    without an observed tap, some taps just go unvoiced. Owner's ear
    decides at 9.2; `0` restores 1:1.
- **P5 (closed)** — per-slice detail lives in the commit messages; what
  stays binding here is the **lazy-app pattern (ADR-012 §8)**, which all
  remaining app work depends on: `win98/apps/lazyApps.ts` maps appIds →
  dynamic import of a `register5x.ts` chunk whose top level calls
  `registerApp`; `Window.tsx` triggers `ensureAppLoaded` on first open
  and shows an hourglass (unregistered appIds without a loader keep the
  deadpan "Insert Disk 2" line); `touchWin98()` re-renders when the
  chunk lands. Every `register5x` chunk has been verified split out of
  the initial bundle in `out/`.
- Architecture contracts (all committed, all still binding):
  - `src/lib/win98State.ts` — ONE store for both renderers; version
    counter feeds `useWin98Version` (useSyncExternalStore). Pure, no
    DOM/three imports.
  - `win98/painter.ts` event-driven only; `crt/CrtScreen.tsx` owns
    canvas→CanvasTexture→CRT shader, writes `screenLight` per frame.
    **Brightness contract (gate 2.3): luminance cap 0.7 in CrtScreen +
    `CAST_MAX 2.6` in Lighting — preserve in every screen change.**
  - Shell renders in **640×480 virtual space** (`DESKTOP_W/H`);
    `Window.tsx` divides client px by a `scale` prop. Taskbar must stay
    a `<div>` (globals.css hides `<footer>`s while the experience
    mounts). `?scene=shell` is the DOM harness; `?scene=full` etc. are
    orbit harnesses — **no choreography by design** (owner asked once).
  - Boot: `bootScript.ts` (POST interpolates `stats.ts`) +
    `bootSequencer.ts` (`startBoot()` → `{cancel, skip, done}`).
  - Journey: `choreography/cameraPath.ts` keyframes (dock square-on at
    `DOCK_DISTANCE 0.26`, fov 50 — `dockAlignment.ts` must match);
    **`HEAD_FOCUS` is exported from there as the single head point the
    ch. 2 shot and the 6.2 leak both measure against — keep them
    sharing it**; `DockSwap.tsx` phase machine (`idle→in→shown→out`) —
    **`docked` is released on undock intent, never by a timer**;
    `PowerOn.tsx` entry (`w98-intro-seen` localStorage skip); dev-only
    `window.__experienceState` QA handle.
  - Audio: `src/lib/audio.ts` is the only WebAudio surface; buses are
    built from `BUS_GAIN`'s keys, so adding one is a one-line change
    that cannot leave a node uncreated.
- Conventions: figure faces **-Z**; `DESK_TOP_Y` 0.72; `assets-src/`
  stays untracked (ADR-012 §3).
- QA practices: isolated headless `--session <name>` agent-browser
  sessions; dev server usually already on 3004. Accumulated gotchas:
  floor-page DOM coexists under the shell, so scope selectors to the
  window `section[aria-label=...]` (bare `find text` collides); after
  eval-driven clicks wait ~400 ms before reading React output; quote
  refs as `'@e1'` in PowerShell (splatting eats `@e1`); commit via
  `-F <file>` written by the Write tool (PS `Out-File` adds a BOM); in
  `agent-browser eval` PowerShell strips inner double quotes from
  native-exe args — write the JS with **single** quotes inside a
  double-quoted PS string or you get bogus `a is not defined`; an open
  window covering a desktop icon makes `dblclick` hang on actionability
  (close it, or `find role button click --name X` then `press Enter`);
  the full journey needs the power button *clicked* and ~15 s of boot
  before PageDown stepping moves progress at all.

## Unresolved Threads

- **The mobile shell has never been touched by a human**, and never run
  on a real phone — only headless Chromium at 360×640 / 390×844 with a
  *fine* pointer (`NARROW_MAX_W` is what makes that reachable). Untested
  by construction: real touch-drag on the swipe-to-close, iOS Safari's
  dynamic viewport (`innerHeight` changes as the URL bar hides — the
  resize listener will re-layout, but whether that reads as jarring is an
  eyes question), and the LinkedIn webview itself. Carry into 9.2.
- **7.1 items deliberately not done** (plan §7.1 lists them; they are
  app-internal, not shell): Explorer/tree panes collapsing to stacked
  lists, touch scrub through Lenis, and app-internal type still at the
  desktop's 9px. Doing these blind would be guessing at content that has
  never been seen on a phone — better bundled with 9.2's owner pass.
- **P6 audio has never been heard by a human.** Everything shipped is
  verified structurally (typecheck/lint/build, event wiring) — no
  headless check can confirm the palette actually *sounds* right.
  Levels, the clack gap, and the leak falloff are the obvious
  candidates for owner adjustment at 9.2.
- `src/lib/aboutMe.ts` copy — **owner review at gate 9.2** (draft is
  interview-approved facts only; motif stays subtext per memory).
- Accepted behaviors (documented, don't "fix" without owner ask):
  single-`scale` Window drag ~5 % x error (screen ~5:4 vs desktop
  4:3); keyboard undock can leave progress a few thousandths past the
  rest point (snap settles it).
- Self-noted nits (owner has NOT flagged — mention, don't gold-plate):
  shaft billboard pale edge-on; chair backrest plain boxes; ch2 rest
  framing may want calibration; faint CRT moiré at some distances
  (already softened once: mask contrast 0.92, scanline 0.22).
- Committer identity on this machine auto-resolves to the owner's work
  email; owner has been told twice how to fix it
  (`git config user.email`) and has not acted — **leave it**, and keep
  it consistent with the rest of the branch rather than amending.
- **P7.2 pointers:** `scene/sheddable.ts`'s `SHED_ORDER` already lists
  `audioMusic` / `audioTexture` (audio garnish sheds *before* the
  visual tiers it pairs with — silence costs the visitor less than a
  dimmer room), but **7.2's `workstation/fidelity.ts` ladder does not
  exist yet**, so nothing consumes that order; `AudioTextures` only
  mirrors the flags onto the buses. Wiring the consumer is 7.2's job,
  not a loose end from P6. `src/lib/gpuTier.ts` keeps the ADR-010 §2
  opt-in prompt — the watchdog **asks before** downgrading.

## Key References

- **ADR:** `docs/decisions/ADR-012-win98-workstation-cinematic-redesign.md`
  — ten locked decisions; do not re-litigate. §4 dock contract, §6
  metaphor map, §8 lazy-chunk rule, §10 zero-Microsoft IP (fonts OFL:
  `public/fonts/LICENSES.md`; audio: `public/audio/LICENSES.md`).
- **Plan:** `docs/plans/implementation-plan-0009.md` — slice specs +
  acceptance. Gates: 1.2 ✅ · 2.3 ✅ · 4.3 ✅ · 9.2 open. AFK gate is
  always lint + build green.
- **Reference assets:** `assets-src/workstation/` (never ship, never
  commit).
- **Standing rules:** root `CLAUDE.md` / `AGENTS.md` (confidentiality,
  static export, React-compiler purity, port 3004). Agent memory:
  `noise-signal-redesign-state.md`, `owner-motif-privacy.md`,
  `client-name-leak-accepted.md`, `windows-shell-gotchas.md`.

## Recommended Next Steps

- [x] ~~**7.1 mobile adaptation**~~ — done (`f7aead3` + `0085af6`);
      both acceptance viewports measured, desktop unregressed. The three
      app-internal leftovers are listed under Unresolved Threads.
- [ ] **7.2 watchdog + shed ladder + perf sweep** — build
      `workstation/fidelity.ts` and make it the consumer of the
      existing `SHED_ORDER`; instancing/texture/draw-call audit.
      **DRS is already built and is the ladder's last rung before the
      static floor** (`dynamicResolution.ts`, mounted journey-only in
      `WorkstationCanvas`): 7.2 wires the ladder *to* it rather than
      inventing its own render-scale knob. Its `DRS_MIN` is the "DRS
      floor" rung named in the plan.
- [ ] P8 eggs (cuttable — `playEggStinger` is waiting), then 9.1 docs
      reconcile.
- [ ] **HITL gate 9.2** — owner final QA, all tiers + mobile → merge.
      Never pass autonomously. Carry the audio-never-heard thread into
      it.

## Recommended Skills

- `agent-browser` — isolated `--session` QA for everything visual, and
  the only practical way to exercise 7.1's mobile viewports; the
  owner's headed session only for owner-angle checks (ask before
  reloads).
- None otherwise (plain implementation; the plan is the spec).
- `/grill-with-docs` — only for a genuine decision gap not covered by
  ADR-012.

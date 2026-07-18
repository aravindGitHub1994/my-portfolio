# HANDOFF — Win98 Workstation redesign (2026-07-19, session 6 wrap)

> For the next agent session. **Gates 1.2, 2.3 and 4.3 PASSED** (owner).
> P3 + P4 complete and owner-verified; **5.1 (`95bbf76`) and 5.2
> (`493d4ea`) committed this session** — Explorer/project windows/IE
> frame, WordPad resume, C:\Career tree, Add/Remove Programs,
> ABOUT_ME.txt, all through the lazy-chunk registry. Next: **5.3**
> (Outlook compose + dial-up shortcuts + ch. 5 contact layer) closes
> P5, then P6 audio / P7 mobile-perf / P8 eggs / 9.1 docs → final HITL
> gate 9.2. Never pass gates autonomously.

## Current Status

- Branch **`redesign-attempt2`** (off `main` @ `7969e26`). Ledger:
  P0–P2 + gate-1.2/2.3 iterations in git log (don't re-derive) ·
  P3 `e7a106b`/`89670dc`/`d816bda` · 4.1 `ad493db` · 4.2 `e66cd75`
  (dock swap; the stuck-dock defect + phase-machine fix and keyboard
  undock are documented in that commit message) · **gate 4.3 PASSED**
  on a served production build of `e66cd75` · 5.1 `95bbf76` ·
  5.2 `493d4ea`.
- **P5 so far (this session):**
  - **Lazy-app pattern (ADR-012 §8), load-bearing for all remaining
    apps:** `win98/apps/lazyApps.ts` maps appIds → dynamic import of a
    `register5x.ts` chunk whose top level calls `registerApp`;
    `Window.tsx` triggers `ensureAppLoaded` on first open and shows an
    hourglass (unregistered appIds without a loader keep the deadpan
    "Insert Disk 2" line); `touchWin98()` (new win98State action)
    re-renders when the chunk lands. Both chunks verified split out of
    the initial bundle in `out/`.
  - **5.1:** `Explorer.tsx` (My Computer drives + C:\ + My Projects;
    view table `VIEWS`, Back/Up, address bar, deadpan status lines),
    `ProjectWindow.tsx` (property rows, problem/approach/outcome,
    honest `howAI` callout, one-shot diagram draw-on + packets with a
    period Refresh replay, personas "unfinished copy" alertdialog),
    `IEFrame.tsx` (original pastiche, fictional `domain` address bar,
    recreated screenshot, no Microsoft art).
  - **5.2:** `WordPad.tsx` (resume.doc from `resume.ts`, working
    `Download...` → `/resume.pdf`), `CareerTree.tsx` (in Explorer's
    C:\Career view: employers nested oldest-deepest, bullet points as
    `highlight_NN.txt` files, roving-tabindex arrows/Enter/collapse —
    keyboard-verified), `AddRemovePrograms.tsx` (SKILL_TIERS as
    categories, deterministic playful install dates, "load-bearing"
    Remove gag; **Start-menu-only** surface via new APP_DEFS entry),
    `Notepad.tsx` + `src/lib/aboutMe.ts` (**draft copy, owner reviews
    at 9.2**). StartMenu now resolves glyphs from APP_DEFS.
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
    `DockSwap.tsx` phase machine (`idle→in→shown→out`) — **`docked` is
    released on undock intent, never by a timer**; `PowerOn.tsx` entry
    (`w98-intro-seen` localStorage skip); dev-only
    `window.__experienceState` QA handle.
- Conventions: figure faces **-Z**; `DESK_TOP_Y` 0.72; `assets-src/`
  stays untracked (ADR-012 §3).
- QA practices: isolated headless `--session <name>` agent-browser
  sessions; dev server usually already on 3004. Gotchas learned this
  session: floor-page DOM coexists under the shell, so scope selectors
  to the window `section[aria-label=...]` (bare `find text` collides);
  after eval-driven clicks wait ~400 ms before reading React output;
  quote refs as `'@e1'` in PowerShell (splatting eats `@e1`); commit
  via `-F <file>` written by the Write tool (PS `Out-File` adds a BOM).

## Unresolved Threads

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
- Committer identity on this machine auto-resolved to the owner's work
  email; owner was told how to fix (`git config user.email`) and has
  not acted — leave unless asked.
- 5.3 pointers: `dialup-linkedin`/`dialup-github` appIds already exist
  in APP_DEFS (currently "Insert Disk 2"); Outlook pre-addresses
  `SITE.email` from `nav.ts`; the ch. 5 contact layer rides
  Choreography's chapter 5 span (see `TitleBeats.tsx` for the
  rAF-opacity overlay pattern); extend `lazyApps.ts` LOADERS with a
  `register53` chunk.

## Key References

- **ADR:** `docs/decisions/ADR-012-win98-workstation-cinematic-redesign.md`
  — ten locked decisions; do not re-litigate. §4 dock contract, §6
  metaphor map, §8 lazy-chunk rule, §10 zero-Microsoft IP (fonts OFL:
  `public/fonts/LICENSES.md`).
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

- [ ] **5.3** Outlook compose + dial-up shortcuts + ch. 5 contact
      layer → closes P5 (plan §5.3 for the spec).
- [ ] P6 audio (6.1 unlock rides the PowerOn press — the gesture hook
      is already there), P7 mobile/perf, P8 eggs (cuttable), 9.1 docs.
- [ ] **HITL gate 9.2** — owner final QA, all tiers + mobile → merge.
      Never pass autonomously.

## Recommended Skills

- `agent-browser` — isolated `--session` QA for everything visual; the
  owner's headed session only for owner-angle checks (ask before
  reloads).
- None otherwise (plain implementation; the plan is the spec).
- `/grill-with-docs` — only for a genuine decision gap not covered by
  ADR-012.

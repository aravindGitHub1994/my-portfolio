# Portfolio (Claude guide)

Static-export **Next.js 16** portfolio. Start with `README.md` for the overview;
full agent rules and conventions live in `@AGENTS.md` (imported below). Quick facts:
`npm run dev` runs on **port 3004**, `npm run build` produces a static export in
`out/`, and site content is edited in `src/lib/*.ts` — not in JSX.

The experience is **The Workstation**
([ADR-012](docs/decisions/ADR-012-win98-workstation-cinematic-redesign.md)):
a cinematic, 100 % runtime-procedural three.js scene of the owner's first
computer — a Windows 98 machine at dusk — with the portfolio living *inside*
it. Scroll scrubs a six-chapter camera journey (POWER ON · THE GLOW · THE MAN ·
THE ROOM · THE DOCK · SIGN-OFF; ADR-012 §5) around one constant object, the CRT.
It **supersedes ADR-005…ADR-011 as the experience layer** — the Lens
(`src/components/lens/`, prism, refraction pass, kinetic text) is retired
wholesale; git history is its archive.

Two renderers, one store — the load-bearing idea (ADR-012 §4):

- `src/lib/win98State.ts` is the single Win98 store (boot phase, icons,
  z-ordered windows, focus). Pure — no DOM or three.js imports.
- **Cinematic mode:** `src/components/win98/painter.ts` paints that store into a
  2D canvas, uploaded as a `CanvasTexture` onto the CRT glass by
  `workstation/crt/CrtScreen.tsx` (barrel curvature, scanlines, phosphor mask).
  Event-driven only — **never** repaint per frame.
- **Docked mode:** at chapter 4 the CRT cross-fades to pixel-aligned live React
  DOM (`win98/shell/`), so text is crisp and focus/tab/screen-reader semantics
  are real. **Scroll suspends while docked**; `docked` is released on undock
  intent, never by a timer.

Because both renderers read one store, the dock swap is a *view* change, not a
state handoff — keep it that way. The shell renders in a **640×480 virtual
space** (`DESKTOP_W/H`); `Window.tsx` divides client px by a `scale` prop.

Other standing contracts:

- **Brightness (gate 2.3):** luminance cap 0.7 in `CrtScreen` + `CAST_MAX 2.6`
  in `Lighting` — preserve in every screen change.
- **The arm rig (ADR-013 §1):** the figure's arms are two-bone rotational chains
  — `shoulderPivot{R,L}` → upper arm → `elbowPivot{R,L}` → forearm + hand — and
  `character/armPose.ts` moves them by **rotating those four pivots only**. Never
  rebuild geometry, never write world positions, never translate a pivot. Pose
  quaternions are solved **once at driver creation**; nothing in the frame path
  solves anything. `armPointLocal` in `buildBody.ts` is the single source of truth
  for where the palm and fingertips are.
- **Props are driven, never re-parented (ADR-013 §6):** `scene/propHandles.ts` is
  a noticeboard — **the room publishes, the character consumes**, one-way, and
  `RoomScene` must never import from `character/`. A carried prop stays a child of
  the room for its whole life, so no unmount order can dispose it twice or never.
- **Fidelity:** high by default. A runtime FPS watchdog **asks before**
  downgrading (`src/lib/gpuTier.ts`, `?tier=high|low|static`; ADR-010 §2 survives
  as a process rule). Under sustained slow frames `workstation/fidelity.ts` walks
  a one-way shed ladder — **nine rungs**: seven silent garnish rungs (`steam`
  sheds immediately before `idleDensity`), then the DRS floor, then an offer of
  the static floor. ADR-014 §5 deleted the `dust` rung along with its subject,
  and the corner lamp that replaced the motes is **not** a rung. **DRS chases
  60 fps; the ladder defends the 30 fps floor** — two knobs, two targets, so
  they cannot oscillate against each other.
- **Lazy apps (ADR-012 §8):** `win98/apps/lazyApps.ts` maps appIds → a dynamic
  import of a `registerNN.ts` chunk that calls `registerApp` at top level.
- **The Gallery's raster assets (ADR-013 §9/§9a):** `public/pictures/` holds the
  **23** photographs (46 files, 3.39 MB) that gate 6.2 cleared — the first and only
  app that ships raster assets. Regenerate with `npm run pictures`, which reads an
  **explicit allow-list** in `scripts/build-pictures.mjs` and never globs a
  directory; that allow-list is the mechanism keeping the tattoo *reference*
  close-ups and the AI concept sheets in gitignored `assets-src/`. `src/lib/
  pictures.ts` owns ids/groups/captions and is answerable to
  `docs/qa/6.2-picture-review.md`, never to the ADR; dimensions come from
  `scripts/pictures-manifest.tsv` and are never typed by hand. **The pipeline does
  not redact number plates** — every plate shipping today was blacked out by hand
  in the source, and a new photograph needs the same hand. **`painter.ts` must
  never import `pictures.ts`** (it is in the initial bundle; the captions belong to
  the Gallery's chunk).
- **Zero Microsoft IP (ADR-012 §10):** all icons original pixel art, all sounds
  synthesized (`src/lib/audio.ts`; no sample files ship), fonts openly-licensed
  period faces. Never commit raw client screenshots — imagery under
  `public/screens/` must be dummy-data recreations.

**Confidentiality.** Client names and client financial figures must not appear
anywhere in this repo — not in code, docs, commit messages, or ADRs, *including*
prose describing this rule. Refer to parties by role ("a named client", "real spend
figures"). ADR-006 §7a's account of which files leaked is inaccurate and its
remediation is not being pursued; treat the rule above as authoritative and the §7a
narrative as unreliable.

@AGENTS.md

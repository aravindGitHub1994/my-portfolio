# Design System — "Electric Dark" around The Workstation

Two token sets, deliberately separate:

- **Electric Dark** — the site's own UI (the static floor, loader, buttons,
  chips). Black/charcoal/graphite surfaces, **one electric-blue accent**, Geist
  everywhere. Retained from ADR-005.
- **Win98 chrome** — the *diegetic* palette of the thing on screen: grey
  chrome, bevels, teal desktop, period pixel faces. It is an **effect palette**,
  not the site's UI language, and the two never mix on the same surface.

The experience is **The Workstation**
([ADR-012](decisions/ADR-012-win98-workstation-cinematic-redesign.md)): a
runtime-procedural Windows 98 machine at dusk with the portfolio inside its CRT.
ADR-012 **supersedes ADR-005…ADR-011 as the experience layer**; the Lens is
retired. See [ADR-001](decisions/ADR-001-next-js-static-export.md) for the
static-export constraint everything must respect. ADR-002/003/004 are historical.

All tokens live in `src/app/globals.css` under Tailwind v4 `@theme` and are
used as semantic utilities: `bg-bg`, `bg-surface`, `text-ink`, `text-ink-muted`,
`text-accent-bright`, `border-line`, `shadow-[…var(--color-glow)]` — never raw
hex in components.

---

## Color tokens

| Token | Value | Usage |
|---|---|---|
| `bg` | `#050507` | Page base — near black |
| `surface` | `#0d0d12` | Charcoal — raised panels / cards |
| `surface-2` | `#15151c` | Graphite — hover / elevated |
| `ink` | `#f2f4f8` | Primary text |
| `ink-muted` | `#a2a8b4` | Secondary text |
| `ink-subtle` | `#6a7080` | Captions / meta |
| `accent` | `#3d74ff` | CTAs, key nodes, caustics, active states |
| `accent-soft` | `#5c8aff` | Hover on accent surfaces |
| `accent-bright` | `#8fb3ff` | Accent-colored text on dark (AA) |
| `line` / `line-strong` | ink-muted @ 12% / 26% | Borders |
| `glow` | `rgba(61,116,255,0.5)` | Box-shadow glow |

**Single-accent rule:** the only hue in the site's own UI is electric blue.
Hierarchy is carried by weight, size, opacity, and borders — never extra colors.
The Win98 set below is the sanctioned exception, and only *inside the screen*.

`.text-electric` — the electric gradient display helper (accent-bright → accent
→ accent-bright, `background-clip: text`) for hero emphasis and stat figures.

### Win98 chrome tokens (the diegetic set)

Effect palette for the shell only — ADR-012 §10 pastiche, no Microsoft assets.

| Token | Value | Usage |
|---|---|---|
| `w98-desktop` | `#2f7f78` | Teal desktop field |
| `w98-chrome` | `#c0c0c0` | Window/taskbar body |
| `w98-chrome-light` / `-dark` / `-darker` | `#e8e8e8` / `#7a7a7a` / `#3c3c3c` | The four-edge bevel language |
| `w98-title-a` → `w98-title-b` | `#1a2e6e` → `#3a6ea5` | Active title-bar gradient |
| `w98-title-inactive-a` / `-b` | `#6e6e6e` / `#9a9a9a` | Unfocused title bar |
| `w98-ink` / `w98-ink-invert` | `#111111` / `#f4f4f4` | Chrome text on grey / on dark |
| `w98-field` | `#ffffff` | Sunken content wells |
| `w98-select` | `#1a2e6e` | Selection highlight |
| `w98-amber` | `#ffb347` | Shutdown "safe to turn off" glow |
| `w98-crash` | `#0000aa` | The BSOD gag's field |

The bevel language itself lives in `win98/shell/chrome.css` as `.w98-raised`,
`.w98-sunken`, `.w98-btn`, `.w98-field`, `.w98-titlebar`, `.w98-grip`. The
painter mirrors the same values as canvas constants (`win98/painter.ts`) —
**if you change one, change both**, or the docked and cinematic renderers drift.

---

## Typography

- **Everything is Geist** — display and body via `--font-sans` (`next/font`,
  self-hosted; CSP `font-src 'self'` forbids CDN fonts). Headings are weight
  600, tracking −0.02em, `text-wrap: balance`.
- **Geist Mono** (`--font-mono`) for eyebrows, meta, act numbering (`01 / 04`),
  and capability chips — uppercase, wide tracking.
- Scale in practice: hero `text-5xl`–`text-7xl`; section titles `text-3xl`–
  `text-4xl`; stat figures `text-5xl`–`text-6xl` tabular-nums; body `text-base`
  to `text-lg` with relaxed leading.

**Period faces inside the screen** — both openly licensed (OFL), self-hosted in
`public/fonts/` with provenance in `public/fonts/LICENSES.md`. Microsoft's faces
are never used (ADR-012 §10):

- `--font-w98` (**Silkscreen**) — the pixel UI face: title bars, menus, icon
  labels, button text. Sized in *virtual units*, typically 8px on desktop and
  11–12px on touch, where the shell scales the whole 640×480 space.
- `--font-w98-mono` (**VT323**) — the terminal face: BIOS POST, the shutdown
  line, the BSOD, Minesweeper's readouts.

---

## The Workstation — scene contract

One persistent WebGL `<canvas>` holds a runtime-procedural room: every mesh
comes from a **pure seeded builder** in `workstation/builders/`, so geometry is
reproducible and unit-testable without a canvas (no imported models —
ADR-012 §3). `workstation/choreography/` is the **sole owner** of scroll input;
frame loops read mutable module state, never React state.

| # | Chapter | Camera | Beat |
|---|---|---|---|
| 0 | POWER ON | Black → power-button close-up | Visitor presses power; audio unlocks; BIOS POST counts the owner's real stats as hardware; splash; desktop settles. Auto-plays, skippable |
| 1 | THE GLOW | Extreme CRT close-up, slow pull-back | Phosphor triads and scanline crawl; name + role typed into the machine |
| 2 | THE MAN | Orbit right around the monitor edge | The owner in profile, typing, lit by the screen |
| 3 | THE ROOM | Dolly back + crane up | Dusk reveal — props, window light, cables |
| 4 | THE DOCK | Arc over the shoulder, push in until the screen fills frame | Texture→DOM cross-fade; **scroll suspends**; the visitor explores Windows |
| 5 | SIGN-OFF | Pull back to widest; dusk deepened | Shut Down… → amber "safe to turn off" → contact layer |

### The dock contract (ADR-012 §4)

The single most load-bearing rule: **`src/lib/win98State.ts` is one store read by
both renderers**, so docking is a *view* change, not a state handoff.

- **Cinematic:** `win98/painter.ts` paints the store into a 2D canvas →
  `CanvasTexture` → the CRT shader in `workstation/crt/CrtScreen.tsx` (barrel
  curvature, scanlines, phosphor mask, flicker). **Event-driven only** — the
  painter must never be called per frame.
- **Docked:** `win98/shell/` renders the same store as live DOM, pixel-aligned
  over the CRT quad by `crt/dockAlignment.ts`. Text is real text; focus, tab
  order and screen-reader semantics are real.
- `DockSwap.tsx` runs a phase machine (`idle→in→shown→out`); **`docked` is
  released on undock intent, never by a timer**.
- The shell lives in a **640×480 virtual space** (`DESKTOP_W/H`); `Window.tsx`
  divides client pixels by a `scale` prop. On touch, `src/lib/shellLayout.ts`
  keeps scale near 1 and makes the *virtual space* portrait instead of shrinking
  the 640×480 box — at 0.56 scale, 8px chrome type renders at ~4.5 css px and is
  simply illegible.

### Brightness contract (gate 2.3)

The CRT's content drives the room: `CrtScreen` downsamples whatever is painted
to an average tint + luminance (`scene/screenLight.ts`), which feeds the cast
light, the bloom and the audio hum. **Luminance is capped at 0.7 in `CrtScreen`
and `CAST_MAX` is 2.6 in `Lighting`** — preserve both in every screen change, or
a bright window blows out the room.

### Shell surfaces

| Surface | Notes |
|---|---|
| Desktop icons | Original 16×16 pixel art as SVG rect runs (`pixelIcons.tsx`); the painter draws the same glyph vocabulary with canvas ops |
| Windows | Drag, SE-grip resize, z-order/focus, minimize/maximize/close. Touch swaps the × for a swipe-down close and grows controls to a full 44px target — controls inset inside an era-sized bar measure ~38px and fail |
| Taskbar | Must stay a `<div>` — `globals.css` hides `<footer>`s while the experience is mounted |
| Apps | Lazy `registerNN.ts` chunks (ADR-012 §8); an hourglass shows while a chunk is in flight, and appIds with no loader get a deadpan "Insert Disk 2" |
| Boot / BSOD | Phase screens, not overlays — both renderers draw them, copy shared from `src/lib/bootScript.ts` and `src/lib/bsodScript.ts` |

## Fidelity — tiers, DRS, and the shed ladder

Three mechanisms, aimed at three different things. Keeping them separate is the
point: two knobs aimed at the same target oscillate against each other.

| Mechanism | Where | Target | Reversible? |
|---|---|---|---|
| **Tier** (`high`/`low`/`static`/`none`) | `src/lib/gpuTier.ts` | Device capability at load | Per load; a confirmed downgrade persists |
| **DRS** (dynamic resolution) | `workstation/` render loop | Chases the **60 fps aspiration** | Yes — it is the reversible knob by design |
| **Shed ladder** | `workstation/fidelity.ts` | Defends the **30 fps floor** | No — one-way ratchet within a session |

### Tiers

Dependency-free detection (CSP forbids CDN GPU benchmarks). **`high` is the
default** for any capable WebGL context; a runtime **FPS watchdog** **asks
first** before any downgrade (ADR-010 §2 survives as a process rule): "Switch to
basic" hot-swaps to `low` in place, "Keep full quality" stays `high`. Floors:
`prefers-reduced-motion → static`, no-WebGL → `none`, software renderers →
`low`. `?tier=high|low|static` overrides everything, **including a stored
choice**, so nobody is locked out of the full experience.

The tier also threads into every builder's `detail` parameter — low-detail bakes
are what the tier actually buys.

### The shed ladder

`fidelity.ts` samples frame time into an EMA and walks `LADDER` one rung at a
time whenever the average sits above the 30 fps floor. **Only the last rung
speaks**: the seven garnish rungs shed silently, and only the static-floor offer
asks the visitor anything. Declining ends it for the session.

| # | Rung | What goes | Reasoning |
|---|---|---|---|
| 1 | `audioMusic` | Tier-3 earbud music leak | Audio garnish sheds *before* the visuals it pairs with — silence costs the visitor less than a dimmer room |
| 2 | `dust` | Floating dust motes | Pure atmosphere |
| 3 | `shafts` | Window light shafts | Pure atmosphere |
| 4 | `audioTexture` | Clacks, drive chatter, fan bed | Tier-1 cues are never sheddable, by construction |
| 5 | `castFlicker` | Screen-light flicker (smoothed instead) | The room stays lit, just steadier |
| 6 | `bloomRich` | Full-richness bloom → cheap bloom | Remounts postprocessing |
| 7 | `idleDensity` | Idle animation at half rate | Last visual rung — a stiller figure is the first thing that reads as "the scene broke" |
| 8 | `drsFloor` | DRS floor drops | Resolution, not content |
| 9 | `staticFloor` | **Offers** the static floor | The only rung that speaks |

Two constants that look like belt-and-braces and are not:

- **`SLOW_RATIO` (1.1)** — a dead band above the floor. Without it a device
  sitting at 29 fps, visually fine, walks the entire ladder and gets offered a
  2D page.
- **`GRACE_FRAMES` / `MOUNT_GRACE_FRAMES`** — the grace window **discards
  samples and reseeds the average**; it does not merely suppress action. Folding
  mount-time shader-compile frames into the EMA leaves it near 200 ms when grace
  expires, which sheds four rungs off a machine that was never slow.

`GRACE_FRAMES` and `EMA_ALPHA` are the two knobs that change ladder *pacing*
(a device pinned at 20 fps currently walks all nine rungs in ~64 s).

The canvas is `aria-hidden`; the loader is dismissed with a failsafe timeout so
WebGL failure never locks the page.

---

## Diagrams

Hand-structured animatable SVGs in `public/diagrams/` — see
[diagram-authoring.md](diagram-authoring.md) for the authoring convention
(structure groups, `data-step` build order, explicit arrows, hardcoded dark
palette). Re-authored for **legibility**: node titles resolve to
≥ ~12px at rendered size, dense fill, `stroke-width` 2. They animate **once on
entry** (draw-on, then a single packet pass) via `src/lib/diagramAnimation.ts`
and settle — no scroll-scrub. Inlined by `InlineDiagram.tsx` so GSAP can reach
nodes; the resting state is fully drawn, so reduced-motion and the `<img>`
fallback are complete diagrams.

---

## Spacing, radius, motion

- Spacing: Tailwind's default 0.25rem scale — do not invent off-scale values.
- Radius: `--radius-sm` 4px · `--radius-md` 8px · `--radius-lg` 14px.
- Easing: `--ease-out-soft` `cubic-bezier(0.16,1,0.3,1)` for reveals/fades.
- **Lenis** owns smooth scrolling (`LenisProvider`); CSS `scroll-behavior` stays
  `auto`. GSAP ScrollTrigger drives all scroll choreography.
- Ambient keyframes: `scroll-cue` (hero), `loader-sweep` (loader).
- **Reduced motion is global**: a media query zeroes every CSS
  animation/transition; JS choreography guards on the same query
  (the workstation choreography, count-ups, diagram play) and the scene renders
  resolved end-states. `?tier=static` and `prefers-reduced-motion` both land on
  the complete, crawlable floor.

---

## Components (`src/components/`)

| Component | Purpose |
|---|---|
**The experience** (`workstation/`):

| Component | Purpose |
|---|---|
| `WorkstationRoot` → `WorkstationExperience` → `WorkstationCanvas` | Mount chain: boundary, tier resolution, then the client-only canvas |
| `choreography/` | Scroll → 6-chapter camera scrub (`cameraPath.ts` keyframes; `HEAD_FOCUS` is the one head point the ch. 2 shot and the audio leak both measure against) |
| `builders/` | Pure seeded geometry — room, desk, tower, CRT, props; `detail` param driven by tier |
| `character/` | Parametric figure + idle-animation driver (faces **−Z**; `DESK_TOP_Y` 0.72) |
| `crt/CrtScreen` | Canvas → `CanvasTexture` → CRT shader; writes `screenLight` per frame |
| `crt/DockSwap` · `crt/dockAlignment` | Texture ⇄ DOM cross-fade and pixel alignment |
| `PowerOn` · `SignOff` · `TitleBeats` | Entry gesture (`w98-intro-seen` skip), sign-off layer, chapter titles |
| `FidelityWatchdog` · `FidelityPrompt` · `DynamicResolution` | The three fidelity mechanisms above |
| `AudioTextures` · `MuteToggle` | One frame reader driving every cue off existing rig state; mute at the experience root (boot audio precedes the dock) |
| `PerfCounter` | **Dev-only** frame/draw/texture readout |

**The shell** (`win98/`):

| Component | Purpose |
|---|---|
| `painter.ts` | Event-driven canvas paint of `win98State` (cinematic renderer) |
| `shell/Desktop` · `Window` · `Taskbar` · `StartMenu` · `ContextMenu` | The docked DOM renderer |
| `shell/appDefs.ts` | Launch definitions + the appId → component registry |
| `apps/` | `Explorer`, `WordPad`, `Notepad`, `Outlook`, `DialUp`, `CareerTree`, `RecycleBin`, `Minesweeper`, plus `Boot`/`Bsod` phase screens |
| `pixelIcons.tsx` | Original 16×16 glyph set shared with the painter |

**Site UI + static floor** (unchanged by ADR-012 — they read the same content):

| Component | Purpose |
|---|---|
| `acts/Hero` · `Approach` · `Work`→`ProjectPin` · `ReadTheBuild` · `Trajectory` · `Skills` | The crawlable floor: full semantic DOM for every heading, figure and string |
| `InlineDiagram` | Fetches + inlines a diagram SVG for animation (CSP-safe, own asset) |
| `SectionHeader` · `Button`/`ButtonLink` · `Tag`/`CapabilityTag` | Shared UI in the Electric Dark set |
| `ui/Cursor`, `ui/Magnetic` | Fine-pointer custom cursor + magnetic CTAs |
| `LenisProvider` | Smooth scroll + ScrollTrigger sync |
| `Reveal` | Generic scroll-reveal wrapper |

Content lives in `src/lib/*.ts` (`projects.ts`, `resume.ts`, `stats.ts`,
`capabilities.ts`, `nav.ts`) — components render it, never hardcode it.

---

## Accessibility

- Prerendered HTML carries the **full semantic DOM** — every heading, figure,
  and body string exists as real elements (the canvas is decoration,
  `aria-hidden`).
- Focus ring: 2px accent outline via `:focus-visible` on all interactive
  elements; Trajectory/ReadTheBuild disclosures are real `<button>`s with
  `aria-expanded`/`aria-controls`.
- `color-scheme: dark`; `::selection` styled on-brand.
- Contrast: `ink` and `ink-muted` clear AA on `bg`/`surface`;
  `accent-bright` is the accent text color for exactly that reason.
- `prefers-reduced-motion`: CSS + JS + scene all resolve to static end-states;
  count-ups render final values; nothing is hidden behind motion.

## Responsive breakpoints

Mobile-first Tailwind defaults: `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280.
Test at 320 / 768 / 1024 / 1440. The Work act pins only at `lg+`; below that
panels stack naturally.

# Design System — "Electric Dark" around The Lens

Single dark cinematic theme (ADR-005, retained by ADR-006) built around **The
Lens** — a dispersion prism that refracts streams of raw *data packets* into
ordered *insight-beams*, enacting **data → meaning → insight** across one
scrolling page (ADR-006). Black/charcoal/graphite surfaces, **one electric-blue
accent**, Geist everywhere.

See [ADR-006](decisions/ADR-006-lens-refractive-redesign.md) for the redesign
decision, [ADR-005](decisions/ADR-005-threejs-scroll-experience.md) for the
retained dark system/positioning, and [ADR-001](decisions/ADR-001-next-js-static-export.md)
for the static-export constraint everything must respect. ADR-002/003/004 are
historical (superseded).

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

**Single-accent rule:** the only hue on the page is electric blue. Hierarchy is
carried by weight, size, opacity, and borders — never extra colors. The one
sanctioned exception is the **spectrum dispersion ramp** inside the WebGL scene
(`DataStreams.tsx`: cyan `#46e3ff` → electric `#3d74ff` → violet `#8b5cf6`),
which *is* the metaphor — white data refracting into the spectrum of insight.

`.text-electric` — the electric gradient display helper (accent-bright → accent
→ accent-bright, `background-clip: text`) for hero emphasis and stat figures.
The kinetic rasterizer reproduces it on the GL side (`lens/kinetic/rasterize.ts`).

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

---

## The Lens — scene contract

One persistent WebGL `<canvas>` (`src/components/lens/`) sits behind the DOM
(`-z-10`). `lensState.ts` is the shared mutable state (pointer, pointer speed,
scroll velocity, per-act progress, projection target); `LensChoreography.tsx`
is the **sole owner** of the per-act and per-card ScrollTriggers. Frame loops
read the state — scroll and pointer never re-render React.

| Act | Section | Lens state |
|---|---|---|
| 1 Hero | `#hero` | Prism center-right; packets stream in, spectrum beams fan out |
| 2 Approach | `#approach` | Prism **tightens** (sinks under the stat band, shrinks); beams organize into parallel lines |
| 3 Work | `#work` | High tier at `lg`+: the prism turns **projector** (ADR-008 §2) — hops to the corner opposite the active card and its beams curve into the window; low tier keeps the ADR-006 recede |
| 4 Trajectory | `#trajectory` | The prism **eases home** to center; the ordered fan re-forms (a recap, not a metamorphosis) |
| 5 Contact | `#contact` | Beams bend down into a soft **underline beneath the CTA row** (high tier); low/static end on the resolved prism + fan |

Scene pieces:

- **`TheLens.tsx`** — the solid: a transmission-glass dispersion prism — the
  site's **constant object** (ADR-008 §3; it never transforms)
  (`MeshTransmissionMaterial` on high; faux-glass `meshPhysicalMaterial` on
  low/static), wireframe data core, kernel light.
- **`DataStreams.tsx`** — stateless vertex-shader particles (position is a pure
  function of time + seed; no GPGPU) + five additive light blades. Point sizes
  are **pixel-scale** (`× 7.0 / -mv.z`, unity at the lens plane) — packets must
  read as packets, never fog. The beam shader carries the **projected mode**
  (quadratic bezier into the active window, endpoint damped between cards) and
  the **CTA underline mode** (ADR-008 §2/§3).
- **`projectionTargets.ts` / `ProjectionTarget.tsx`** — DOM registry of beam
  targets (each card's preview, the contact CTA row); `rectToWorld.ts` is the
  shared DOM→world mapping (also used by the kinetic layout).
- **`RefractionPass.tsx`** — the global refractive pass (ADR-006 §4):
  pointer-radial displacement + chromatic aberration + desaturation, keyed to
  pointer speed and scroll velocity. **High tier + fine pointer only.**
- **`kinetic/`** — DOM↔GL twin system for headings, stat figures, and imagery
  (below).
- Environment is **Lightformer-only** (drei Environment presets fetch CDN HDRs
  — CSP forbids).

## Kinetic type & imagery (DOM↔GL twins)

The real semantic DOM element (`KineticText`, `GlassImage`) always renders and
always ships in the prerendered HTML — it is what ATS/crawlers/screen readers
see. On the **high tier only**, a GL layer (`KineticTextLayer`,
`GlassImageLayer`) claims the kind via `kinetic/registry.ts`; the DOM turns
`opacity: 0` (still selectable, still in the a11y tree) and a canvas-raster GL
twin renders at the exact layout position:

- **Refract-in** (ADR-006 §3): glyphs assemble from RGB-split chromatic shards
  on entry; settled text **shears** with scroll velocity. **Distortion-only**
  twins (ADR-010 §1, `KineticText variant="plain"`) skip the entrance — born
  settled, they only aberrate near the pointer and shear with scroll.
- The rasterizer (`rasterize.ts`) walks per-character Ranges at
  browser-computed positions — survives `text-wrap: balance` and reproduces
  `.text-electric` — and **re-rasters on text mutation** (rAF-coalesced), which
  is how count-up stat figures stay live on the GL side.
- **Twinned elements** (ADR-006 §3, extended by ADR-009 §5 and ADR-010 §1):
  refract-in for all `h1`/`h2`/`h3` headings, the Approach stat figures, and
  the small mono eyebrow + `01 / 05` counter labels; distortion-only twins for
  the Hero subhead/eyebrow, section descriptions, project taglines, and stat
  labels. **Kept crisp DOM**: interactive text (buttons, nav/contact links,
  Trajectory's disclosure rows), `Tag`/`CapabilityTag` chips and the "Read the
  build" dialog (both paint above the `-z-10` canvas, so a twin could never
  show through), and the reveal preview; the Contact CTA labels get a separate
  lightweight DOM RGB-split.
- Where no layer claims (low/static tiers, WebGL unavailable), the DOM element
  is simply visible — **zero drift risk, the DOM node is the source** — and
  gets a **plain fade** on first viewport entry (never hidden in the prerender;
  reduced-motion never hides or fades).

Count-up figures (`acts/Approach.tsx` + `src/lib/stats.ts`): numbers count
0→value on entry (gsap, staggered); the prerender ships **resolved values**;
reduced-motion renders them resolved with no count; no `aria-live` (the settled
DOM text is the accessible value). Every figure traces to `resume.ts` bullets
or is derived from `PROJECTS`/`CAPABILITY_LIST` lengths — nothing invented.

## Fidelity tiers (`src/lib/gpuTier.ts`)

Dependency-free detection (CSP forbids CDN GPU benchmarks). **`high` is the
default** for any capable WebGL context (ADR-009, superseding ADR-006 §8's
device-class heuristic); a runtime **FPS watchdog** samples framerate after load
and, if it can't hold ~40fps, **asks first** (ADR-010 §2, reversing ADR-009's
silent swap): "Switch to basic" hot-swaps to `low` in place (no reload), "Keep
full quality" stays `high` — one prompt per load, session-only, so a later
visit re-detects `high`. Floors: `prefers-reduced-motion → static`, no-WebGL →
`none`, software renderers → `low`. Override any of it with
`?tier=high|low|static` (which also suppresses the watchdog). **Graceful reduction** — lower tiers stay
calmer, honestly non-identical:

| | high (default) | low (confirmed watchdog prompt / opt-out) | static (`prefers-reduced-motion`) | none (no WebGL) |
|---|---|---|---|---|
| Lens solid | transmission dispersion | faux-glass, calm | faux-glass prism, fixed pose | — |
| Particles | 800 + 1500, animated | 260 + 480, animated | none (blades settled) | — |
| Tool coins (ADR-010 §4) | 4 concurrent | 2 concurrent | none | — |
| Refraction pass | ✓ (fine pointer only) | — | — | — |
| Kinetic text | GL twins: refract-in headings, distortion-only display copy | DOM, plain fade | DOM, static (CSS kills transitions) | DOM |
| Imagery | GL planes, snap crisp | crisp DOM `<img>` | crisp DOM `<img>` | DOM |
| Diagrams | draw-on + one packet pass on entry | same | resting state (fully drawn) | resting state |
| Frameloop | always | always | demand | no canvas |

The canvas is `aria-hidden`; the loader (`ui/Loader.tsx`) is dismissed by
`markLensReady()` with a 4 s failsafe so WebGL failure never locks the page.

---

## Diagrams

Hand-structured animatable SVGs in `public/diagrams/` — see
[diagram-authoring.md](diagram-authoring.md) for the authoring convention
(structure groups, `data-step` build order, explicit arrows, hardcoded dark
palette). Re-authored for **legibility** (ADR-006 §6): node titles resolve to
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
  (`LensChoreography`, count-ups, diagram play) and the scene renders resolved
  end-states.

---

## Components (`src/components/`)

| Component | Purpose |
|---|---|
| `lens/LensCanvas` → `LensScene` | Client-only persistent canvas: rig, solid, streams, kinetic layers, refraction pass, Lightformer environment |
| `lens/LensChoreography` | The five act ScrollTriggers + scroll velocity → `lensState` |
| `lens/kinetic/KineticText` | Semantic heading/figure with GL twin + plain-fade fallback |
| `lens/kinetic/GlassImage` | Semantic `<img>` with distort-then-snap GL plane (high tier) |
| `acts/Hero` | Act 1 — kinetic `<h1>`, copy parallax, scroll cue |
| `acts/Approach` | Act 2 — method statement + count-up stat band (`lib/stats.ts`) |
| `acts/Work` → `ProjectPin` | Act 3 — pinned two-beat project panels (screenshot slot + diagram) |
| `acts/ReadTheBuild` | Per-project progressive disclosure (problem/approach/outcome/howAI/stack) |
| `acts/Trajectory` | Act 4 — experience timeline of disclosures from `resume.ts` |
| `InlineDiagram` | Fetches + inlines a diagram SVG for animation (CSP-safe, own asset) |
| `SectionHeader` | Eyebrow + kinetic title + description |
| `Button` / `ButtonLink` | Primary / outline actions |
| `Tag` / `CapabilityTag` | Neutral tech tags + single-accent capability chips |
| `ui/Loader` | Branded first-paint overlay, dismissed on lens-ready |
| `ui/Cursor`, `ui/Magnetic` | Fine-pointer custom cursor + magnetic CTAs |
| `LenisProvider` | Smooth scroll + ScrollTrigger sync |
| `Reveal` | Generic scroll-reveal wrapper (available; acts use their own choreography) |

Content lives in `src/lib/*.ts` (`projects.ts`, `resume.ts`, `stats.ts`,
`capabilities.ts`, `nav.ts`, `techIcons.ts`) — components render it, never
hardcode it.

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

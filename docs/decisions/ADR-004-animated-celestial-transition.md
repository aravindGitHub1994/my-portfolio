# ADR-004: Animated Celestial Day↔Night Transition on a Unified Sky Canvas

## Status
Accepted — partially supersedes ADR-003 (the "exactly one canvas at a time" and
"instant theme change, no scene morph" points; see Related Decisions).

## Date
2026-06-28

## Addendum — 2026-06-29 (asset upgrade, implementation-plan-0002)
A follow-up grill session refined the **render assets** without changing this
record's architecture (one persistent canvas, the `progress` timeline, trigger
policy, mid-arc token flip, reduced-motion floor all stand):
- **Moon** now uses a *transparent, self-lit* photo (`public/celestial/moon.png`,
  replacing the white-background `moon.webp`). Because it is already lit, it is
  drawn faithfully — the circular clip, overscan, and limb-darkening/terminator
  overlays that existed only to hide the old white fringe are **removed**; just the
  cool halo/earthshine remains. The procedural fallback is unchanged.
- **Sun** stays procedural (this ADR's "Real sun texture too" rejection still
  holds — the user-supplied sun PNG was also watermarked). It is unchanged in logic
  but enlarged.
- **Bodies** are enlarged ~1.5× and **matched in size** (shared `bodyR` in
  `SkyScene`) so the sun and moon read equal during the cross.
- **Horizon** is rebuilt as a **procedural illustrated landscape** (revision 2),
  in the flat-illustration style of `docs/horizon_reference.jpg`: distant snow-
  capped mountains, **real conifer silhouettes** (three shapes sliced from
  `trees.png`, a black-on-white luminance→alpha mask) placed across three depth
  tiers (small/distant foothills → large foreground trees kept to the left/right
  edges, clear of the hero text), and two rolling green hill layers,
  each colour-lerping from a dark cool night palette to the bright reference
  palette by day. A user-supplied `mountains.png` was tried first and **abandoned**
  — its "transparency" was a baked-in checkerboard that rendered as grey squares.
  The **observatory** is drawn **procedurally** (`drawObservatory` — a domed
  cylindrical tower + tapered telescope barrel angled up-left toward Pisces),
  right-of-centre and drawn *between* the foothills and front hills so the green
  hills overlap its base (it reads as part of the mountainscape). It is a clean
  silhouette with nothing baked in, so the surrounding green-tinted conifers and
  hills supply its setting. (An earlier `observatory.png` was tried but dropped:
  its baked-in trees/ground rendered in the slate observatory tint, looking out of
  place against the green.) This **narrows** the "Realism
  scope" point below (background *bodies only*) to also cover the horizon. The
  contrast scrim is retained, now drawn behind the terrain so it protects text
  without dimming the hills.
- **Day text legibility** — the day text tokens were AA-verified against the cream
  base, but the bright illustrated horizon now sits behind the centred hero text
  (the Hero vignette keeps the centre clear for the sun/moon). Rather than alter the
  scene, the **hero text is strengthened** (text-only, `html[data-theme="day"]`-
  scoped): a cream `drop-shadow` halo on the gilt headline + a darkened, weight-500
  paragraph halo (`Hero.tsx` `hero-legible` class + `globals.css`). Night is
  unaffected.
- **Clouds** are unified to a **single layer** (the day puff shape) whose fill
  colour lerps night → day — a soft moonlit blue-grey against the dark sky → warm
  white by day. The separate moonlit-indigo night clouds (`seedNightClouds` /
  `drawNightClouds`) were **removed**; the layer is drawn behind the sun/moon so the
  bodies stay crisp. This supersedes the original "clouds (recolour night-indigo →
  white, fade in)" wording above.

These are easily reversible render-asset swaps, hence an addendum here rather than
a new ADR.

## Context
ADR-003 shipped a tri-mode theme (night / day / auto). Its "alive" background is
two mutually-exclusive canvases — `Starfield` (night, with a procedural moon) and
`Cloudfield` (day, with a procedural sun) — selected by `BackgroundScene` on the
resolved theme. A theme change is a **hard cut**: one canvas unmounts, the other
mounts. The two celestial bodies live in separate files
(`Starfield.tsx`, `Cloudfield.tsx`), are co-located at the **same** spot
(`x = 0.76·w`, `y = 0.16·h`), and never share the screen. CSS tokens flip
instantly via `data-theme` on `<html>`.

We now want the theme change to be a **cinematic event**: the sun sets and the
moon rises (and vice versa) along crossing arcs through a twilight sky, with much
more realistic celestial bodies. We also want the night sky rebuilt — varied star
brightness/sizes, occasional shooting stars, and a recognisable **Pisces**
asterism. Outcome: toggling the theme plays a ~2.2 s sunrise/sunset that becomes
the **signature interaction** of the site.

This conflicts with two specific ADR-003 commitments — "exactly one canvas is
active at a time" and "instant theme change, no scene morph" — so it warrants a
new record rather than an amendment in place. Everything else in ADR-003 (the
tri-mode model, pre-paint FOUC script, token-override strategy, auto-resolution
rule, reduced-motion floor) stands unchanged.

Key tensions surfaced and resolved:
- **Two canvases can't cross-fade celestial bodies along an arc** — the bodies
  live in different unmounted components, so there is no shared coordinate space
  or timeline to animate across. A single persistent canvas is required.
- **A scene morph must not regress the FOUC/auto guarantees.** The pre-paint
  script (ADR-003) already sets the correct `data-theme` before first paint; an
  animated transition must not reintroduce a flash, and non-cinematic triggers
  (first load, auto refocus-flip, reduced-motion) must still resolve instantly.
- **A bright body dipping to the horizon can wash out body text.** The day sun
  and full moon are luminous; sweeping them low across the viewport risks
  contrast failures behind content.
- **The page tokens and the sky must not visibly disagree mid-arc.** If
  `data-theme` flipped at the start of the animation, the page would be "day"
  while the sky is still night (and vice versa) for ~2 s.

## Decision
Replace the canvas swap with **one persistent full-viewport sky canvas** driven by
a single `progress` value (`0` = deep night, `1` = full day), and play a ~2.2 s
animated transition between steady states on an explicit toggle.

**Unified sky canvas (`src/components/sky/SkyScene.tsx`)**
- A single fixed `-z-10` `<canvas>` reusing the existing DPR-cap / resize / fixed-
  viewport pattern from `Starfield.tsx`. It owns **one** `requestAnimationFrame`
  loop and draws everything as a function of `progress`:
  sky gradient (night → twilight → day), stars + Pisces + shooting stars (alpha
  fades out as `progress → 1`), clouds (recolour night-indigo → white, fade in),
  moon, sun, and an observatory horizon silhouette with a contrast scrim.
- Drawing is split into helpers so the file stays readable and existing logic is
  reused verbatim where possible: `drawSun.ts` (reuse `SUN_CELLS` + gradients from
  `Cloudfield.tsx`), `drawMoon.ts` (reuse `MOON_MARIA` + body gradient from
  `Starfield.tsx:159-224`), `drawStars.ts`, `drawClouds.ts` (reuse the cloud shape
  `Cloudfield.tsx:32-53` and the night-cloud gradient `Starfield.tsx:130-144`),
  `drawHorizon.ts`, plus a `palette.ts` colour-lerp helper.

**Render medium — hybrid (real moon texture + procedural sun)**
- The moon is drawn from a user-provided texture `public/celestial/moon.webp`
  (full near-side face, transparent background) with procedural limb darkening and
  a faint cool halo / earthshine. **If the asset is missing or fails to load, the
  moon falls back to the existing procedural drawing** — the build and scene never
  break.
- The sun stays **procedural** (themeable), upgraded with limb darkening, finer
  granulation, a layered multi-stop corona, and gentle limb flicker.

**Crossing-arc choreography**
- A shared `bodyPosition(t)` maps `t ∈ [0,1]` to a point on an arc (rest-high →
  setting side → below horizon). The sun is evaluated at `t = progress` and the
  moon at `t = 1 − progress`, so they **cross low near the horizon at the twilight
  midpoint**. Steady states pin the bodies high (only the 2.2 s transition dips
  them toward the horizon). An observatory-dome silhouette plus a soft scrim above
  the horizon protect text contrast while a bright body is low.

**Trigger policy**
- **Explicit toggle click → cinematic** ~2.2 s ease-in-out arc.
- **First mount → gentle settle** (stars/clouds ease in; tokens are already
  correct from the pre-paint script — no token cross-fade, no arc).
- **Auto refocus-flip** (the `ThemeProvider` visibility/focus re-resolve path) and
  **`prefers-reduced-motion` → snap** (draw once; no arc, no shooting stars). This
  preserves ADR-003's reduced-motion floor.
- The transition is **interruptible**: re-triggering mid-arc reverses smoothly
  from the current progress toward the new target.

**Transition driver (`ThemeProvider` + `src/lib/theme.ts`)**
- A single shared constant `THEME_TRANSITION_MS = 2200` is exported from
  `src/lib/theme.ts` (one source of truth, alongside the day-window constants).
- The theme context gains a transition descriptor
  (`transition: { animate: boolean; id: number }`): `setMode` (toggle) →
  `animate: true`; the refocus re-resolve path → `animate: false`. `SkyScene` keys
  an effect on `transition.id` and tweens `progress` over `THEME_TRANSITION_MS` on
  animate, else jumps. The RAF loop pauses on `visibilitychange` (hidden).

**Mid-arc page-token cross-fade**
- The visual `data-theme` flip is **deferred to ~`progress` 0.5**. On an animated
  change, `data-theme` (and `color-scheme`, `localStorage`, `ThemeMetaColor`) stays
  on the old value until the twilight midpoint, then flips. A scoped
  `html.theme-animating` rule in `globals.css` applies a ~400 ms
  `background-color`/`color`/`border-color` transition so the flip reads as one
  cross-fade; the class is added just before the flip and removed after. The
  reduced-motion / snap path flips `data-theme` immediately (existing
  reduced-motion block at `globals.css:200-210` already zeroes these transitions).

**Realism scope**
- Realism applies to the **background bodies only**. The header `ThemeToggle`
  keeps its clean Heroicons glyphs, gaining only a small CSS sun↔moon morph on
  click. `CursorSpotlight` stays night-only (unchanged).

## Alternatives Considered

### Keep the hard-cut canvas swap (status quo, ADR-003)
- **Pros**: Simplest; two independent components; no shared timeline; already
  shipped and reduced-motion-safe by construction.
- **Cons**: The theme change is an instant jump — it cannot be the cinematic
  "sun sets / moon rises" signature interaction the brief now asks for.
- **Rejected**: The animated transition is the explicit goal.

### CSS-only cross-fade between the two existing canvases
- **Pros**: Minimal new code; keep `Starfield`/`Cloudfield` as-is; opacity-tween
  one over the other.
- **Cons**: Cross-fading two opaque full-screen scenes is a dissolve, not a
  choreographed sunset; the bodies can't travel crossing arcs because they live in
  separate coordinate spaces; double RAF cost while both mount.
- **Rejected**: Doesn't deliver arcs/twilight, and runs two animation loops.

### Fully procedural moon (no texture asset)
- **Pros**: Zero asset dependency; nothing to license or ship; no load-failure
  path.
- **Cons**: Procedural lunar maria read as soft blobs, not a real face — the brief
  explicitly wants a *realistic* moon.
- **Rejected** in favour of the hybrid, **with a procedural fallback retained** so
  a missing/failed asset never breaks the build or scene (keeps the no-hard-
  dependency spirit of ADR-001/002).

### Real sun texture too (fully image-based bodies)
- **Pros**: Maximum photographic realism for both bodies.
- **Cons**: A static sun photo can't be re-tinted across twilight or themed; the
  procedural sun already lerps through the palette and animates its surface; adds
  a second large asset and a second load-failure path.
- **Rejected**: Procedural sun keeps the sun themeable and animated.

### Flip `data-theme` at the start (or end) of the arc instead of mid-arc
- **Pros**: Simpler timing — no deferred flip, no `theme-animating` class.
- **Cons**: The page would read fully "day" while the sky is still night (or vice
  versa) for ~2 s — a jarring, broken-looking mismatch at one end of the arc.
- **Rejected**: The mid-arc flip at the twilight midpoint is the one moment both
  states look plausible; a short cross-fade hides the seam.

### Animate on every trigger (including auto refocus and first load)
- **Pros**: Maximally "alive"; every theme change is cinematic.
- **Cons**: Auto's refocus-flip can fire on a passive tab-return — playing a 2.2 s
  sweep unprompted is disorienting; first load would delay the correct theme the
  pre-paint script already set, risking a perceived FOUC.
- **Rejected**: Cinematic on explicit toggle only; snap on refocus/first-load/
  reduced-motion.

## Consequences

### Positive
- Delivers the signature sunrise/sunset interaction: crossing arcs through
  twilight, a realistic textured moon, an upgraded procedural sun, a magnitude-
  varied star field with shooting stars, and a recognisable Pisces asterism.
- One persistent canvas runs **one** RAF loop (vs. potentially two during a swap)
  and gives every element a shared `progress` timeline and coordinate space.
- The mid-arc token cross-fade keeps the page and sky visually consistent
  throughout the transition.
- Reduced-motion, auto-refocus, and first-load all still resolve **instantly**,
  preserving ADR-003's accessibility floor and FOUC guarantee.
- `THEME_TRANSITION_MS` is a single exported source of truth shared by the
  provider, the canvas, and the CSS cross-fade window.

### Negative
- Materially more drawing code than the two simple canvases, and a hand-rolled,
  interruptible progress tween that must reverse cleanly mid-arc.
- A new shipped asset (`moon.webp`) plus its load-failure fallback path to test.
- The deferred `data-theme` flip adds timing coupling between `ThemeProvider`,
  `SkyScene`, `ThemeMetaColor`, and `localStorage` — they must agree on *when*
  mid-arc the flip happens.
- A bright body travelling near the horizon needs an explicit contrast scrim;
  text legibility must be re-verified across breakpoints during the dip.
- `Starfield.tsx`, `Cloudfield.tsx`, and `BackgroundScene.tsx` are retired once
  their draw logic is migrated — a migrate-then-delete step that must preserve the
  reused gradients/constants exactly.

## Related Decisions
- **ADR-001**: Next.js static export — inherited. No SSR/dynamic features,
  `next/image`, route handlers, or new runtime dependencies are introduced; all
  DOM/`document` access stays inside effects, and the canvas is plain `<canvas>`.
- **ADR-002**: Mermaid pre-rendered SVGs — unaffected.
- **ADR-003**: Tri-mode theme — **partially superseded** by this decision. The
  "exactly one canvas is active at a time" and "instant theme change, no scene
  morph" points are replaced by the unified canvas + animated transition here.
  The tri-mode model, pre-paint FOUC script, token-override strategy, auto-
  resolution-on-refocus rule, and the reduced-motion floor are unchanged. The
  header switcher remains glyph-based (gaining only a small morph).
- `docs/design-system.md` — must be updated on implementation: the
  celestial/background section currently describes two gated canvases
  (`Starfield` night-only / `Cloudfield` day-only) and must describe the single
  `SkyScene` and the rebuilt star field.

## References
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/docs/Web/CSS/@media/prefers-reduced-motion)
- [MDN: Window.requestAnimationFrame](https://developer.mozilla.org/docs/Web/API/Window/requestAnimationFrame)
- [MDN: Page Visibility API](https://developer.mozilla.org/docs/Web/API/Page_Visibility_API)
- [web.dev: Building a theme switch component (FOUC / pre-paint script)](https://web.dev/articles/building-a-theme-switch-component)
- ADR-003 (this repo) — tri-mode theme, the record this decision partially supersedes.

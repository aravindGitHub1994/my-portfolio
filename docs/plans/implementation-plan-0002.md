# Implementation Plan 0002 — Celestial & Horizon Asset Upgrade

> Source decision: **ADR-004** (`docs/decisions/ADR-004-animated-celestial-transition.md`).
> This plan refines the *render assets* inside the existing unified `SkyScene`; it
> does **not** change the transition architecture, trigger policy, or `progress`
> timeline. Captured from a `/grill-with-docs` session (2026-06-29).
> Tracker: local (gh not installed) — tasks live in this file.

## Revision 2 (2026-06-29) — procedural horizon
After a live look, the **horizon** decision (item 3) changed: the supplied
`mountains.png` had a **baked-in checkerboard** (fake transparency) and rendered as
grey squares. Per new direction it is **dropped**, and the horizon is now built
**procedurally from scratch** in the style of `docs/horizon_reference.jpg` —
snow-capped mountains + tree-dotted foothills + two rolling green hill layers, all
night→day colour-lerped. The **observatory image is kept** but drawn *between* the
foothill and front-hill layers (hills overlap its base → reads as part of the
mountainscape), moved right and **horizontally flipped** so its telescope faces
up-left toward Pisces. The **pines** are real conifer silhouettes sliced from
`public/celestial/trees.png` (three shapes, luminance→alpha mask, tinted per layer)
— replacing the initial stacked-triangle pines, which are kept only as a pre-load
fallback. Verified visually in both themes via the dev server. Moon, sun, and
body-sizing decisions below are unchanged and shipped as written.

## Revision 5 (2026-06-29) — unified tinted clouds
Removed the separate moonlit-indigo night clouds (`seedNightClouds` /
`drawNightClouds`). Clouds are now a **single layer** using the day puff shape, with
the fill colour lerped night → day (soft moonlit blue-grey → warm white) and always
visible in both themes. `drawClouds.ts` collapses to `seedClouds` + `drawClouds`;
`SkyScene` seeds one `clouds` array and draws it **behind** the sun/moon so the
bodies stay crisp. Verified in both themes.

## Revision 4 (2026-06-29) — procedural observatory
Replaced the image-based observatory (`observatory.png`) with a **procedural**
`drawObservatory` (domed cylindrical tower + tapered telescope barrel angled up-left
toward Pisces). The PNG baked in its own trees (rendered in the slate observatory
tint, not the green tree tint) and a ground mound (also slate) that looked out of
place on the green hills. The procedural version is a clean silhouette only, so the
green-tinted conifers and hills around it supply the setting. Removed all
observatory image-loading state and deleted `public/celestial/observatory.png`;
`trees.png` is now the only horizon image asset. Verified in both themes.

## Revision 3 (2026-06-29) — denser trees + day text legibility
- **Trees:** replaced the two single-size pine loops with three deterministic,
  art-directed **depth tiers** (`FOOT_TREES` / `MID_TREES` / `FRONT_TREES` in
  `drawHorizon.ts`) — ~20 conifers spanning small (distant foothills) → large
  (foreground), with `slice`/`flip` variety. Large foreground trees are pinned to
  the left/right edges (`x < 0.16` or `> 0.86`) so they never sit behind the
  centred hero text. Added a `FRONT_PINE` palette band.
- **Day text contrast:** the day text was AA-verified against the cream base, but
  the canvas now paints green hills behind the centred hero text (the Hero vignette
  keeps the centre clear). Fix is **text-only, day-scoped**: a `hero-legible` class
  on the `<h1>`/`<p>` (`Hero.tsx`) + `html[data-theme="day"]` rules in `globals.css`
  — a cream `drop-shadow` halo on the gilt headline and a darkened, weight-500
  paragraph with a soft halo. Scene unchanged; night unaffected. Verified in both
  themes via the dev server.

## Why

The shipped moon (`public/celestial/moon.webp`, a **white-background** photo
overscanned inside a circular clip with stacked limb-darkening to hide the white
fringe) reads poorly. The user supplied four PNGs (moon, sun, observatory,
mountains) and wants the celestial bodies and horizon to "look really nice."

## Decisions (resolved in grill session)

1. **Sun — stays procedural, upgraded + enlarged.**
   - The supplied `sun_png.png` is **rejected**: (a) it carries visible "pngtree"
     stock watermarks, and (b) ADR-004 already rejected a sun texture because a flat
     image can't re-tint across twilight or animate. Keeping `drawSun.ts` procedural
     preserves the twilight palette lerp and surface animation.
   - Action: tune the procedural sun to read richer (closer to the reference look)
     and grow its body radius ~1.5× so it matches the enlarged moon during the cross.
     Corona/glow radii scale off `bodyR`, so they follow automatically.

2. **Moon — real transparent texture, bigger, faithful.**
   - Replace the white-bg webp with the supplied **transparent** realistic moon,
     shipped as `public/celestial/moon.png`.
   - Render faithfully: the photo is already self-lit (bright upper-left → soft
     lower-right terminator), so **drop** the overscan, the heavy limb-darkening,
     and the cool terminator overlay that existed only to hide the old white fringe.
     Keep just the subtle cool **halo / earthshine** so it sits in the night sky.
   - Size ~1.5× current (`moonR ≈ min(34, w*0.045) * 1.5`), matched to the sun.
   - The **procedural fallback** (`MOON_MARIA` blob) stays for missing/failed asset
     (ADR-001/004 "scene never breaks").

3. **Horizon — mountains band + observatory focal (both image-based).**
   - `mountains.png` (transparent, ~3.3:1, internal depth shading) → full-width
     ridgeline band, **bottom-anchored, ~22% of viewport height**, drawn as a real
     colored image (preserves its lighter-back / darker-front depth).
   - `observatory.png` (square, **solid white bg**) → focal silhouette at
     **~0.65·w**, **~14–18% viewport width**, sat on the ridge.
   - Observatory keying: convert to an **alpha mask at load** (alpha = 1 − luminance
     on an offscreen canvas; white→transparent, black→opaque, AA edges stay smooth),
     cache it, then **tint-fill** with the existing night→day lerp color so it still
     darkens/lightens between themes instead of being a frozen black blob.
   - Mountains tint: keep the image's own color, with a **night-darkening overlay**
     (cool multiply-ish scrim) that fades to 0 by `progress` 1 so the ridge isn't too
     bright at night but reads naturally in day.
   - **Keep the contrast scrim** above the ground (text legibility while a bright
     body dips low — unchanged behavior).
   - Horizon **fallback**: if either image isn't ready/fails, fall back to the
     current procedural observatory dome band so the scene never breaks.

4. **Sizing parity.** Sun and moon both ~1.5× and equal, because they share the
   screen only during the ~2.2 s cross near the horizon and a size mismatch reads
   oddly there. Rest endpoint (`0.76·w`, `0.16·h`) is **unchanged** (ADR-004 arc
   contract).

## Out of scope / explicitly unchanged

- Transition timing (`THEME_TRANSITION_MS = 2200`), trigger policy, mid-arc token
  flip, reduced-motion snap, parallax, stars/Pisces/clouds.
- The header `ThemeToggle` glyphs.
- `sun_png.png` is **not** shipped (watermarked).

## Files

| File | Change |
|---|---|
| `public/celestial/moon.png` | **New** — from `docs/moon_png.png` (transparent). |
| `public/celestial/mountains.png` | **New** — from `docs/mountains_png.png`. |
| `public/celestial/observatory.png` | **New** — from `docs/observatory_png.png`. |
| `public/celestial/moon.webp` | Remove once `moon.png` path is verified (old white-bg asset). |
| `src/components/sky/drawMoon.ts` | Point at `moon.png`; faithful render (drop overscan + limb/terminator overlays); keep halo + procedural fallback. |
| `src/components/sky/drawSun.ts` | Richer tuning; body radius scale handled at call site. |
| `src/components/sky/drawHorizon.ts` | Rewrite: mountains band + alpha-masked tinted observatory + scrim; procedural domes become fallback. New lazy/cached image loaders + offscreen alpha-mask helper. |
| `src/components/sky/SkyScene.tsx` | Bump `moonR`/`sunR` to the matched ~1.5× value; pass through. |
| `docs/decisions/ADR-004-...md` | Addendum: moon now transparent PNG (overlays dropped); horizon now image-based (mountains + observatory) — narrows the "realism = bodies only" scope; bodies enlarged ~1.5×. Sun decision **unchanged** (still procedural). |
| `docs/design-system.md` | Update the Moon (l.97) and Horizon (l.99) descriptions. |

> **ADR note:** these are render-asset swaps inside ADR-004's architecture and are
> easily reversible, so they're recorded as an **addendum to ADR-004** rather than a
> new ADR. The one genuine scope change — horizon moving from procedural to
> image-based — is called out explicitly in that addendum (ADR-004 had said realism
> applied to the background *bodies only*).

## Constraints to honor

- **Static export (ADR-001):** all `Image()` loads stay lazy inside the RAF
  loop/effects (already the pattern); no DOM access at module top level; offscreen
  canvas for the alpha mask is created at runtime only.
- **No webp toolchain available** (`sharp`/`cwebp`/ImageMagick absent) → ship PNGs.
  Optional later optimization; not a blocker.

## Verification (S-gate)

- [ ] `npm run lint` + `npm run build` green (static export intact).
- [ ] Night: bigger faithful moon, subtle halo, no white fringe; mountains + tinted
      observatory on the horizon.
- [ ] Day: enlarged procedural sun still tints/animates; mountains read in daylight;
      observatory lightens via lerp.
- [ ] 2.2 s toggle: sun/moon equal size crossing low; scrim protects text; mid-arc
      reversal still smooth.
- [ ] Reduced-motion snap + asset-missing fallbacks (procedural moon, procedural
      dome horizon) still render.
- [ ] Mobile legibility across breakpoints with the taller mountains band.

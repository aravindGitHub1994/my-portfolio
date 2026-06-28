# Design System — "Midnight Observatory / Warm Sunlit"

Dual-theme design system (ADR-003). The night theme ("Midnight Observatory") is the brand default
— deep night-sky surfaces, star-gold accents, aged-parchment text. The day theme ("Warm Sunlit")
is a full reskin driven by the same semantic token names; every `bg-bg`, `text-ink`, and
`border-line` utility flips automatically via a `[data-theme="day"]` CSS block (zero component edits).

See [ADR-003](decisions/ADR-003-tri-mode-theme.md) for the full design rationale.
See [ADR-004](decisions/ADR-004-animated-celestial-transition.md) for the unified sky canvas and animated day↔night transition (partially supersedes ADR-003).
See [ADR-002 (amended)](decisions/ADR-002-mermaid-prerendered-svgs.md) for light diagram variants.

All tokens live in `src/app/globals.css` under Tailwind v4's `@theme` (`:root` night defaults)
and the `html[data-theme="day"]` override block. Available as utilities: `bg-bg`, `text-ink`,
`text-gold`, `border-line`, `shadow-[…var(--color-glow)]`, …

---

## Color tokens — Night (`:root` default)

| Token | Hex | Usage |
|---|---|---|
| `bg` | `#07071a` | Page background (deepest night sky) |
| `surface` | `#0f0f2a` | Cards / raised panels |
| `surface-2` | `#181840` | Hover / elevated |
| `midnight` | `#191970` | Brand midnight blue (gradient washes) |
| `ink` | `#e8ddb5` | Primary text (aged parchment) |
| `ink-muted` | `#c0c7d1` | Secondary text (celestial silver) |
| `ink-subtle` | `#8b8597` | Captions / meta |
| `gold` | `#d4af37` | Primary accent — links, CTAs, eyebrows |
| `gold-soft` | `#e6c860` | Gold hover |
| `plum` | `#7d5a7b` | Supporting accent |
| `moss` / `moss-light` | `#556b2f` / `#9bb06a` | Supporting accent (light variant for text) |
| `lilac` | `#b8a9d9` | Supporting accent |
| `silver` | `#c0c7d1` | Supporting accent |
| `bronze` | `#6e6658` | Weathered tone |
| `line` / `line-strong` | silver @ 14% / 30% | Borders |
| `glow` | `rgba(212,175,55,0.50)` | Box-shadow gold glow (see `--color-glow`) |

## Color tokens — Day (`[data-theme="day"]` overrides)

| Token | Hex | Contrast on cream | Usage |
|---|---|---|---|
| `bg` | `#f4ecd8` | — | Warm cream base |
| `surface` | `#fbf6ea` | — | Raised panels / cards |
| `surface-2` | `#ece0c6` | — | Hover / elevated |
| `ink` | `#2d2417` | 12.96:1 | Espresso — primary text |
| `ink-muted` | `#5a4d36` | 7.00:1 | Secondary text |
| `ink-subtle` | `#6f5f44` | 5.25:1 | Captions / meta |
| `gold` | `#82661b` | 4.61:1 | Amber accent / links / CTAs |
| `gold-soft` | `#6f5616` | 5.91:1 | Amber hover (darker than gold in day) |
| `plum` | `#6a4a68` | 6.39:1 | Darkened dusty plum |
| `moss` | `#4a5d28` | 6.18:1 | Darkened forest moss |
| `moss-light` | `#3f5320` | 7.22:1 | Moss text on cream |
| `lilac` | `#64497e` | 6.38:1 | Darkened starlight lilac |
| `silver` | `#4a5563` | 6.44:1 | Slate (silver → slate for cream) |
| `line` | espresso @ 16% | — | Border |
| `line-strong` | espresso @ 32% | — | Strong border |
| `glow` | `rgba(160,105,20,0.38)` | — | Soft amber glow (replaces gold on cream) |

All day-mode text pairings AA-verified against `#f4ecd8`. See HANDOFF.md for verification details.

### Discipline colors (`src/lib/disciplines.ts`)

Same semantic tokens used in both themes; colors flip automatically.

| Discipline | Token | Night | Day |
|---|---|---|---|
| Analytics | Silver | `#c0c7d1` | `#4a5563` |
| Writing | Gold | `#d4af37` | `#82661b` |
| Design | Lilac | `#b8a9d9` | `#64497e` |
| Code | Moss-light | `#9bb06a` | `#3f5320` |

---

## Typography

- **Headings:** Fraunces (serif), via `--font-serif` — applied to `h1`–`h4`.
- **Body:** Inter (sans), via `--font-sans`.
- **Labels / tags / meta:** Geist Mono, via `--font-mono`.
- `.text-gilt` — animated shimmer gradient. At night: gold → gold-soft → parchment shimmer.
  At day: amber → bronze → espresso shimmer (all stops flip via the token override; passes AA for large text on cream).

---

## Spacing & radius

- Spacing: Tailwind's default 0.25rem scale — do not invent off-scale values.
- Radius: `--radius-sm` 4px, `--radius-md` 8px, `--radius-lg` 14px.

---

## Motion

- `Reveal` — scroll-into-view fade + lift (IntersectionObserver).
- `SkyScene` — single persistent full-viewport canvas driven by a `progress` value (`0` = deep night, `1` = full day). On an explicit theme toggle it plays a ~2.2 s ease-in-out arc: the sun and moon travel crossing arcs through a twilight sky, meeting near the horizon at the midpoint (~progress 0.5), at which point page tokens cross-fade via a scoped `html.theme-animating` transition so the page and sky stay visually consistent throughout. First mount settles gently without an arc; auto refocus and `prefers-reduced-motion` snap instantly. See [ADR-004](decisions/ADR-004-animated-celestial-transition.md).
  - **Stars:** magnitude follows a power-law distribution (many faint, few bright). The brightest stars carry subtle 4-point diffraction spikes. Occasional shooting stars appear at night (suppressed under reduced-motion). A Pisces asterism is drawn from real relative star positions; its constellation lines brighten as the cursor nears. Stars fade smoothly to invisible by full day.
  - **Moon:** rendered from `public/celestial/moon.png` (real, transparent, self-lit near-side photo) drawn faithfully — no clip, overscan, or limb/terminator overlays — behind only a faint cool halo/earthshine. Sized ~1.5× and matched to the sun. Falls back silently to the procedural drawing if the asset is absent or fails to load — the build and scene never break.
  - **Sun:** procedural and themeable; tint lerps through the night→twilight→day palette via `palette.ts`. Limb darkening, finer granulation, a layered multi-stop corona, and gentle limb flicker. Sized ~1.5× and matched to the moon so the two read equal during the cross.
  - **Horizon:** a **procedural illustrated landscape** (style of `docs/horizon_reference.jpg`) — distant snow-capped mountains, **real conifer silhouettes** (three shapes sliced from `public/celestial/trees.png`, a black-on-white luminance→alpha mask, tinted per layer) placed across **three depth tiers** — small/distant on the foothills, medium on the mid hill, and a few large ones at the foreground left/right edges (kept clear of the centred hero text) — and two rolling green hill layers, each colour-lerping from a dark cool night palette to the bright reference palette by day. The **observatory** is drawn **procedurally** (`drawObservatory` — a domed cylindrical tower with a tapered telescope barrel angled up-left toward the Pisces asterism), right-of-centre, *between* the foothills and front hills so the green hills overlap its base. It's a clean silhouette in the observatory tint — nothing baked in — so the green-tinted conifers and hills around it supply its setting (the earlier `observatory.png` was dropped because its baked-in trees/ground rendered in the wrong tint). A soft contrast scrim behind the terrain protects text legibility while a celestial body dips low during the transition.
- `float`, `twinkle`, `shimmer` keyframes for subtle ambient motion.
- All motion respects `prefers-reduced-motion` (neutralized via CSS globally; `SkyScene` draws a single static frame and suppresses the arc, shooting stars, and the mid-arc token cross-fade).

---

## Responsive breakpoints

Mobile-first using Tailwind defaults: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px.
Test at 320 / 768 / 1024 / 1440px.

---

## Components (`src/components/`)

| Component | Purpose |
|---|---|
| `Hero` | Landing hero with gilt headline, CTAs, orbit ring |
| `SkyScene` | Unified full-viewport sky canvas (one RAF loop); `progress` `0`→night, `1`→day; ~2.2 s cinematic arc on explicit toggle; mid-arc token cross-fade; snap on first load / auto refocus / reduced-motion. Draws via `sky/` helpers (`drawStars`, `drawMoon`, `drawSun`, `drawClouds`, `drawHorizon`, `palette`) — replaces the retired `Starfield` / `Cloudfield` / `BackgroundScene` — see [ADR-004](decisions/ADR-004-animated-celestial-transition.md) |
| `ThemeToggle` | Header switcher — glyph-based Heroicons sun↔moon (small click morph; the celestial realism lives in `SkyScene`, not here) + separate Auto badge |
| `ThemeProvider` | Client context: `{ mode, resolved, setMode }` |
| `ThemeMetaColor` | Updates `<meta name="theme-color">` with the active palette |
| `CursorSpotlight` | Pointer glow — **night only** (torchlight metaphor) |
| `Reveal` | Scroll-reveal wrapper (client) |
| `Button` / `ButtonLink` | Primary / outline / ghost buttons; internal + external links |
| `SectionHeader` | Eyebrow + title + description block |
| `DisciplineTag` / `Tag` | Themed discipline badges + neutral skill tags |
| `ProjectCard` | Project showcase surface with disciplines, summary, link |
| `ProjectModal` | Lightbox; swaps diagram to `*.light.svg` in day mode |

---

## Accessibility

- `color-scheme` flips per theme (`dark` at night, `light` in day) — native controls match.
- Gold / amber focus ring on all interactive elements via `:focus-visible`.
- All day-mode text pairings meet WCAG AA (minimum 4.5:1 for normal text).
- `.text-gilt` passes large-text AA (3:1) in both themes.
- Decorative canvas elements / glows marked `aria-hidden`.
- `ThemeToggle`: scene button and auto badge both keyboard-operable with correct `aria-label` / `aria-pressed`.
- `prefers-reduced-motion`: all animations neutralized; canvases render static frames.

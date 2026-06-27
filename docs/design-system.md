# Design System — "Midnight Observatory / Warm Sunlit"

Dual-theme design system (ADR-003). The night theme ("Midnight Observatory") is the brand default
— deep night-sky surfaces, star-gold accents, aged-parchment text. The day theme ("Warm Sunlit")
is a full reskin driven by the same semantic token names; every `bg-bg`, `text-ink`, and
`border-line` utility flips automatically via a `[data-theme="day"]` CSS block (zero component edits).

See [ADR-003](decisions/ADR-003-tri-mode-theme.md) for the full design rationale.
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
- `Starfield` — canvas of drifting, twinkling stars (night only).
- `Cloudfield` — canvas of a sun + drifting clouds with sky horizon wash (day only).
- `float`, `twinkle`, `shimmer` keyframes for subtle ambient motion.
- All motion respects `prefers-reduced-motion` (neutralized via CSS globally; canvases draw static).

---

## Responsive breakpoints

Mobile-first using Tailwind defaults: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px.
Test at 320 / 768 / 1024 / 1440px.

---

## Components (`src/components/`)

| Component | Purpose |
|---|---|
| `Hero` | Landing hero with gilt headline, CTAs, orbit ring |
| `Starfield` | Animated star canvas — **night only** |
| `Cloudfield` | Animated day sky canvas — **day only** |
| `BackgroundScene` | Gates Starfield / Cloudfield on `resolved` theme |
| `ThemeToggle` | Animated sun/moon scene switcher + Auto badge in header |
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

# Design System — "Midnight Observatory"

Single dark theme. A celestial/astronomy aesthetic: deep night-sky surfaces,
star-gold accents, aged-parchment text, with supporting plum / moss / lilac /
silver hues. Technical and sleek, with hero + scroll animations.

All tokens live in `src/app/globals.css` under Tailwind v4's `@theme`, so they
are available as utilities (`bg-bg`, `text-ink`, `text-gold`, `border-line`, …).

## Color tokens

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

### Discipline colors (`src/lib/disciplines.ts`)

| Discipline | Color |
|---|---|
| Analytics | Silver |
| Writing | Gold |
| Design | Lilac |
| Code | Moss (light) |

## Typography

- **Headings:** Fraunces (serif), via `--font-serif` — applied to `h1`–`h4`.
- **Body:** Inter (sans), via `--font-sans`.
- **Labels / tags / meta:** Geist Mono, via `--font-mono`.
- `.text-gilt` — animated gold shimmer gradient for hero emphasis.

## Spacing & radius

- Spacing: Tailwind's default 0.25rem scale — do not invent off-scale values.
- Radius: `--radius-sm` 4px, `--radius-md` 8px, `--radius-lg` 14px.

## Motion

- `Reveal` — scroll-into-view fade + lift (IntersectionObserver).
- `Starfield` — canvas of drifting, twinkling stars behind the hero.
- `float`, `twinkle`, `shimmer` keyframes for subtle ambient motion.
- All motion respects `prefers-reduced-motion` (neutralized via CSS).

## Responsive breakpoints

Mobile-first using Tailwind defaults: `sm` 640px, `md` 768px, `lg` 1024px,
`xl` 1280px. Test at 320 / 768 / 1024 / 1440px.

## Components (`src/components/`)

| Component | Purpose |
|---|---|
| `Hero` | Landing hero with starfield, gilt headline, CTAs, discipline pills |
| `Starfield` | Animated star canvas (client) |
| `Reveal` | Scroll-reveal wrapper (client) |
| `Button` / `ButtonLink` | Primary / outline / ghost buttons; internal + external links |
| `SectionHeader` | Eyebrow + title + description block |
| `DisciplineTag` / `Tag` | Themed discipline badges + neutral skill tags |
| `ProjectCard` | Project showcase surface with disciplines, summary, link |

### Accessibility

- Single dark theme declares `color-scheme: dark`.
- Gold focus ring on all interactive elements via `:focus-visible`.
- Text colors chosen for ≥ 4.5:1 contrast on the dark background.
- Decorative canvas/glows marked `aria-hidden`.

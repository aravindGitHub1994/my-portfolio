# ADR-003: Tri-Mode Theme (Night / Day / Auto) with Local-Clock Auto

## Status
Accepted — the "exactly one canvas at a time" and "instant theme change, no scene
morph" points are partially superseded by ADR-004 (animated celestial transition);
all other decisions here stand.

## Date
2026-06-28

## Context
The site shipped as a single dark theme — "Midnight Observatory" — and both the
design system (`docs/design-system.md`) and the original build explicitly framed
it as **single dark theme** (`html { color-scheme: dark }`, parchment text on a
near-black night sky, a global animated `Starfield`). See ADR-001 for the static
export constraints that bound every decision here.

We now want a light theme plus a playful, "alive" theme switcher that signifies
the modes pictorially: a night sky with a moon for dark, and a sun + blue sky +
clouds for light. During design interrogation the requirements sharpened into:

- **Three user-selectable modes**, not two: **Night**, **Day**, and **Auto**.
- **Auto follows the visitor's local clock**, not the OS `prefers-color-scheme`
  setting — day during the daytime, night otherwise.
- **Day is a full reskin**, a genuine "day world": the night `Starfield` is
  replaced by a daytime sky (sun + drifting clouds), and every surface/text token
  flips. It is not merely a lighter palette.
- The site is a **static export** (ADR-001): no server, so the resolved theme must
  be decided in the browser. To avoid a flash of the wrong theme (FOUC), the
  decision must run **before first paint**.

Key tension surfaced and resolved during design:
- The "alive" sun/moon scene is inherently **two-state**, but there are **three
  modes** — so "Auto" needs a home in the control without breaking the binary
  scene metaphor.
- The signature accent **gold `#d4af37` fails WCAG AA on a light background**
  (~1.9:1), so day mode cannot reuse gold for links/CTAs.
- Several glows and the gilt headline are **hardcoded** to gold
  (`rgba(212,175,55,…)`) and bypass semantic tokens, so they will not flip
  automatically.

## Decision
Introduce a **tri-mode theme system** with the resolved theme expressed as a
`data-theme` attribute on `<html>` and the user's *mode* persisted in
`localStorage`.

**Modes and persistence**
- `localStorage["theme-mode"] ∈ { "night", "day", "auto" }`.
- **Default (no stored value) is `auto`.**
- The *resolved theme* is always `night` or `day`. Auto resolves it from the
  local clock: **day = `06:00 ≤ hour < 18:00`**, night otherwise.

**Auto resolution rule**
- Auto re-resolves on **page load and on tab refocus** (`focus` /
  `visibilitychange`). It does **not** flip live mid-session when the clock
  crosses a boundary — the theme never changes out from under a reader who is
  sitting on the page.
- If the clock/timezone is unavailable for any reason, the pre-paint fallback is
  **night** (the brand floor, and a deterministic value for crawlers).

**FOUC-safe delivery (static-export requirement)**
- An **inline `<head>` script runs before first paint**, reads `theme-mode` and
  the clock, and sets `documentElement.dataset.theme` and
  `documentElement.style.colorScheme` accordingly. This is the one
  non-negotiable architectural piece — there is no server to do it.
- A client `ThemeProvider` exposes `{ mode, resolved, setMode }`, re-resolves auto
  on refocus, and drives the switcher and any theme-aware component (e.g. the
  diagram `src` swap).

**Token strategy (no component churn)**
- Night remains the `:root` default. Day overrides the **same token names**
  (`--color-bg`, `--color-ink`, …) under a `[data-theme="day"]` selector in
  `globals.css`. Because the 79 existing dark-token usages across 16 components
  reference semantic utilities (`bg-bg`, `text-ink`, `border-line`), they flip
  automatically with **zero component edits**.
- Day palette = **"Warm sunlit"**: warm-cream base, espresso ink, and a
  contrast-darkened **amber** accent (≈`#8a6d1f`, AA-verified) — preserving the
  gold lineage rather than introducing a blue accent.
- Hardcoded gold glows are refactored to a new **`--color-glow`** token (gold at
  night, soft amber by day) so `shadow-[…var(--color-glow)]` flips with the theme.
- `color-scheme` flips per theme so native controls/scrollbars match.

**The "alive" switcher (Scene toggle + Auto badge)**
- The animated sun/moon scene is the primary control and renders the *currently
  resolved* theme. Clicking the scene flips Night ↔ Day as an **explicit** mode
  (and clears Auto). A small separate **"Auto" affordance** toggles auto on; while
  Auto is on, the scene tracks the clock and shows an "A" indicator.
- Placement: **header right, always visible** on both desktop and mobile (next to
  the hamburger), so the showpiece is never buried in a menu.
- Built as inline SVG + CSS (no new runtime dependency, per ADR-001); fully
  keyboard-operable with appropriate ARIA, and reduced-motion safe.

**Day "living background" and assets**
- A daytime canvas (sun + slowly drifting clouds) replaces `Starfield` in day
  mode, composed as a **horizon wash**: soft blue sky at the top fading to warm
  cream where content sits, so cream surfaces stay readable.
- The gilt headline keeps its shimmer but becomes a **warm amber→bronze→espresso**
  gradient in day mode (gold shimmer fails contrast on cream).
- `CursorSpotlight` (a "torchlight in the dark" metaphor) is **disabled in day
  mode**.
- The four architecture diagrams get **light variants** rendered from their
  committed `.mmd` sources and swapped by `data-theme` — this **amends ADR-002**.

## Alternatives Considered

### Keep the single dark theme (status quo)
- **Pros**: No new complexity; one identity to maintain; matches every existing
  design doc; no contrast/asset rework.
- **Cons**: Does not deliver the requested light theme or the signature "alive"
  day/night switcher.
- **Rejected**: The light theme and switcher are the explicit goal.

### Auto driven by `prefers-color-scheme` instead of the local clock
- **Pros**: The platform-standard signal; respects an OS-level user choice;
  deterministic per device; no timezone assumptions.
- **Cons**: Does not match the product intent — the brief is a *time-of-day*
  experience (sun by day, moon by night), which `prefers-color-scheme` (an OS
  appearance toggle, often left on "dark" 24/7) does not express.
- **Rejected** for Auto's *default behavior*, with a deliberate trade-off noted:
  two visitors loading at the same instant in different timezones can see
  different themes, and OG/crawler renders become time-dependent (mitigated by the
  deterministic night fallback). `prefers-color-scheme` may still inform the
  initial *mode default* in a future iteration without changing this record.

### Live flip when the clock crosses 06:00 / 18:00 mid-session
- **Pros**: Maximally "alive"; the page literally follows the day.
- **Cons**: Swaps the entire page and re-tunes contrast without user action —
  jarring for someone mid-read.
- **Rejected**: Resolve on load + refocus only; never flip under an active reader.

### Default to Night for first-time visitors
- **Pros**: Strongest brand-first impression; matches existing identity; stable
  crawler render.
- **Cons**: The day world and the "alive" responsiveness are hidden until the user
  acts; a daytime visitor's first impression mismatches their environment.
- **Rejected** in favor of `auto` default, accepting a time-dependent first
  impression as the point of the feature.

### Blue/azure day accent (gold = night, blue = day)
- **Pros**: Sharp day/night polarity; blue passes AA trivially; "blue sky" reads
  literally.
- **Cons**: Abandons the warm gold lineage that defines the brand; two unrelated
  accent identities to maintain.
- **Rejected** in favor of a contrast-darkened amber that keeps warmth across both
  themes.

### Per-theme component variants / duplicated styles instead of token override
- **Pros**: Total control over each theme's look per component.
- **Cons**: Would touch all 16 components and duplicate styling; high churn and
  drift risk; contradicts the existing semantic-token design system.
- **Rejected**: Overriding the same token names under `[data-theme="day"]` flips
  the whole site with no component edits.

### Three-click cycle or popover for the Auto mode (instead of scene + badge)
- **Pros (cycle)**: Smallest footprint. **Pros (popover)**: Most discoverable.
- **Cons (cycle)**: Can't jump to a mode; Auto's visual is ambiguous.
  **Cons (popover)**: Less "one-tap playful."
- **Rejected**: The scene-toggle-plus-Auto-badge cleanly separates the *alive*
  binary scene from the *mode* selection.

## Consequences

### Positive
- Delivers light mode and the signature day/night switcher with a genuine "day
  world," not a thin palette swap.
- The semantic-token override means **no component edits** for the bulk of the
  reskin — the change is concentrated in `globals.css`, the provider, the switcher,
  the day canvas, and a handful of baked assets.
- A `--color-glow` token retires the scattered hardcoded gold glows, improving
  consistency for future theme work.
- FOUC-safe by construction via the pre-paint script; honors `prefers-reduced-motion`
  throughout (static clouds/sun, instant theme change, no scene morph).

### Negative
- Auto's first impression and OG/crawler render are **time-dependent** (mitigated
  by the deterministic night fallback).
- A new inline pre-paint script is required and must stay in sync with the
  provider's resolution logic (single source of truth for the day window).
- Two themes to maintain: contrast must be AA-verified for the day palette, and
  the four diagrams now ship a light variant each (amends ADR-002 — re-running its
  render pipeline with a light `%%{init}%%` theme block).
- Tailwind v4 token overrides under `[data-theme="day"]` must be verified to emit
  `var()` references (not inlined values) so the runtime swap takes effect.

## Related Decisions
- **ADR-001**: Next.js static export — the source of the no-server / pre-paint and
  no-runtime-dependency constraints this decision inherits.
- **ADR-002**: Mermaid diagrams pre-rendered to committed SVGs — **amended** by
  this decision to add per-theme (`*.light.svg`) variants swapped by `data-theme`.
- **ADR-004**: Animated celestial day↔night transition — **partially supersedes**
  this decision. The two-canvas swap (`Starfield`/`Cloudfield` via
  `BackgroundScene`) and the instant, no-morph theme change are replaced by a
  single persistent `SkyScene` canvas that plays a ~2.2 s sunrise/sunset on toggle.
  Reduced-motion, auto-refocus, and first-load still snap, per this ADR.
- `docs/design-system.md` — must be updated on implementation: it currently states
  "Single dark theme" / `color-scheme: dark`, which this decision reverses.

## References
- [MDN: prefers-color-scheme](https://developer.mozilla.org/docs/Web/CSS/@media/prefers-color-scheme)
- [WCAG 2.1 SC 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [web.dev: Building a theme switch component (FOUC / pre-paint script)](https://web.dev/articles/building-a-theme-switch-component)
- [Mermaid theming](https://mermaid.js.org/config/theming.html)

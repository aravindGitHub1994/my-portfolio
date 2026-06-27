# Implementation Plan 0001 — Tri-Mode Theme (Night / Day / Auto)

**Source of truth:** [ADR-003](../docs/decisions/ADR-003-tri-mode-theme.md) (amends
[ADR-002](../docs/decisions/ADR-002-mermaid-prerendered-svgs.md); inherits
[ADR-001](../docs/decisions/ADR-001-next-js-static-export.md) static-export constraints).

Tracer-bullet slices: each is a thin vertical cut through every layer (CSS tokens →
provider/JS → persistence → UI), demoable on its own. **HITL** = human-in-the-loop
(design/architectural judgment). **AFK** = self-contained, implementable.

Build in dependency order: **Slice 1 → 2 / 3 / 4 / 5 (parallel) → 6**.

---

## Slice 1 — Theme pipeline end-to-end (tracer bullet)

**Type:** AFK (one HITL risk-check) · **Blocked by:** None

### What to build
The complete theme path through every layer, proven with a *temporary plain toggle*
button (replaced in Slice 2). Wiring:

- **Persistence:** `localStorage["theme-mode"] ∈ { "night" | "day" | "auto" }`.
  Absent ⇒ default `"auto"`.
- **Resolution:** resolved theme is `"night" | "day"`. Auto resolves from the local
  clock — **day = `06:00 ≤ hour < 18:00`**, night otherwise. Re-resolve on page
  load and on tab refocus (`focus` / `visibilitychange`). **No live mid-session
  flip.** If the clock is unavailable, fall back to `"night"`.
- **Pre-paint script:** an inline `<head>` script (in `layout.tsx`) runs before
  first paint, reads mode + clock, sets `documentElement.dataset.theme` and
  `documentElement.style.colorScheme`. Single source of truth for the day window
  must be shared with the provider (no logic drift).
- **Provider:** client `ThemeProvider` exposing `{ mode, resolved, setMode }`;
  re-resolves auto on refocus; mounted in `layout.tsx`.
- **Tokens:** night stays the `:root` default in `globals.css`. Add a
  `[data-theme="day"]` block overriding the **same token names** (`--color-bg`,
  `--color-ink`, `--color-surface`, `--color-line`, accent, …) with the
  **Warm-sunlit** palette (warm-cream base, espresso ink, AA-darkened amber accent
  ≈`#8a6d1f`). `color-scheme` flips per theme.
- **Temp control:** a bare `<button>` cycling/setting mode, to prove the pipeline.

### Acceptance criteria
- [ ] **HITL risk-check first:** confirm Tailwind v4 emits `var()` references (not
      inlined values) for the overridden tokens, so the `[data-theme="day"]` swap
      actually takes effect. Resolve before building further.
- [ ] Toggling to Day flips the entire site to the Warm-sunlit palette with **zero
      component edits** (semantic utilities flip automatically).
- [ ] Mode persists across reload; `auto` shows day during `06:00–18:00` local,
      night otherwise.
- [ ] No flash of the wrong theme on load (pre-paint script verified).
- [ ] No mid-session flip while idle on the page; theme re-resolves on tab refocus.
- [ ] Day palette pairings meet WCAG AA (spot-check ink-on-cream and accent-on-cream).

### Blocked by
- None

---

## Slice 2 — The "alive" switcher

**Type:** AFK · **Blocked by:** Slice 1

### What to build
Replace the temporary toggle with the animated **sun/moon scene + separate "Auto"
badge** (inline SVG + CSS, no new runtime dependency).

- Scene renders the *currently resolved* theme. Click scene ⇒ flip Night ↔ Day as an
  **explicit** mode and **clear Auto**. Separate "Auto" affordance toggles auto on;
  while Auto is on, the scene tracks the clock and shows an "A" indicator.
- Placement: **header right, always visible** on desktop and mobile (next to the
  hamburger — not inside the menu).
- Accessible: keyboard-operable, correct ARIA (scene as a labeled control reflecting
  state; Auto as a distinct pressed/unpressed control). Reduced-motion: show the
  correct state without the morph animation.

### Acceptance criteria
- [ ] Clicking the scene flips night↔day, sets an explicit mode, and clears the Auto
      badge.
- [ ] Toggling Auto on makes the scene follow the clock and shows the "A" indicator.
- [ ] Visible and operable on desktop and mobile; keyboard + screen-reader labels
      reflect current mode.
- [ ] Honors `prefers-reduced-motion` (no scene morph; correct static state).

### Blocked by
- Slice 1

---

## Slice 3 — Day living background (horizon canvas)

**Type:** AFK · **Blocked by:** Slice 1

### What to build
A `Cloudfield` daytime counterpart to `Starfield`: a sun + a few slowly drifting
clouds composed as a **horizon wash** (soft blue sky concentrated at the top fading
to warm cream where content sits, so cream surfaces stay readable). Mounted in
`layout.tsx`. `Starfield` is hidden in day; `Cloudfield` is hidden in night
(gate on `resolved` from the provider). Reduced-motion ⇒ static (no drift).

### Acceptance criteria
- [ ] Day shows sun + drifting clouds with a top-down sky→cream horizon; content
      stays readable over it.
- [ ] Exactly one background canvas is active per theme (no double-canvas overlap).
- [ ] Reduced-motion renders a static day sky (no cloud drift).

### Blocked by
- Slice 1

---

## Slice 4 — Glow token + baked-asset day treatment

**Type:** AFK · **Blocked by:** Slice 1

### What to build
Handle the hardcoded, non-token assets a palette swap can't reach.

- Introduce a **`--color-glow`** token (gold at night, soft amber by day).
- Refactor hardcoded `rgba(212,175,55,…)` glows to use it: `Button.tsx:12`,
  `Hero.tsx:32`, `ProjectCard.tsx:66`, `ProjectModal.tsx:110`, `OrbitRing.tsx:78`.
- `.text-gilt` gains a day variant: amber→bronze→espresso shimmer (passes large-text
  contrast on cream).
- `CursorSpotlight` is disabled in day mode (night-only "torchlight" metaphor).

### Acceptance criteria
- [ ] All listed glows flip with the theme via `--color-glow` (no stray gold on cream).
- [ ] Gilt headline reads on cream in day (amber shimmer) and is AA for large text.
- [ ] `CursorSpotlight` is inactive in day; unchanged at night.

### Blocked by
- Slice 1

---

## Slice 5 — Light diagram variants

**Type:** AFK · **Blocked by:** Slice 1

### What to build
Render a light variant of each of the 4 diagrams from its committed `.mmd` source
using a light `%%{init}%%` theme block (per amended ADR-002), producing
`public/diagrams/{taxonomy,budget,gmc,personas}.light.svg`. `ProjectModal` swaps the
`<img src>` based on `resolved` from the provider, and the diagram viewer panel
adopts theme-appropriate framing.

### Acceptance criteria
- [ ] Four `*.light.svg` files rendered from the existing `.mmd` sources and committed.
- [ ] Modal shows the dark SVG at night and the light SVG in day, swapping live with
      the theme.
- [ ] Diagrams are legible against their panel in both themes; no client data exposed
      (ADR-002 constraint preserved).

### Blocked by
- Slice 1

---

## Slice 6 — A11y / contrast verification + docs

**Type:** HITL · **Blocked by:** Slices 1–5

### What to build
Close-out pass.

- AA-verify every day-mode pairing (text, accent, borders, tags, focus ring).
- Add per-theme `<meta name="theme-color">`.
- Update `docs/design-system.md`: document the dual theme and remove the
  "Single dark theme" / `color-scheme: dark` statements (now reversed by ADR-003).
- Cross-page visual check at 320 / 768 / 1024 / 1440 px in both themes.

### Acceptance criteria
- [ ] Documented AA results for day-mode pairings; failures fixed.
- [ ] `theme-color` matches the active theme on mobile browser chrome.
- [ ] `docs/design-system.md` reflects the dual-theme reality and links ADR-003.
- [ ] No layout/contrast regressions across the four breakpoints in either theme.

### Blocked by
- Slices 1, 2, 3, 4, 5

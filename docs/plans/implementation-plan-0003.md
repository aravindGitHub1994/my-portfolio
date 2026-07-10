# Implementation Plan 0003 — Three.js Scroll-Driven Portfolio Redesign

> Source decision: **ADR-005**
> (`docs/decisions/ADR-005-threejs-scroll-experience.md`). Captured from a
> `/grill-with-docs` + `/to-issues` session (2026-07-06) on branch
> `threeJS-redesign`. Tracker: **local** (gh not installed) — issues live in this
> file as tracer-bullet slices.

## Context / Why

Full redesign from a multi-page, tri-mode, celestial-sky portfolio into a single
**dark, scroll-driven, cinematic** experience built around **one morphing glass data
cube**. Content in `src/lib/*.ts` is reused verbatim; the current layout, theme
system (`ThemeProvider`/`ThemeToggle`/`theme.ts`), and celestial background
(`src/components/sky/*`) are retired. All eleven design branches are resolved in
ADR-005 — positioning (honest-but-bold, real numbers only), the cube spine, 3-tier
fidelity, animated architecture diagrams, five tight acts, flexible timeline schema,
direct-link contact, progressive disclosure, dark-only, electric-blue + Geist.

**Constraints (unchanged):** static export (ADR-001) — no SSR/API/route handlers,
`next/image`, or Server Actions; all WebGL/DOM access inside effects/mounted guards.
The `vercel.json` CSP is `font-src 'self'` / `connect-src 'self'` — Geist must be
**self-hosted** and there is **no** third-party form endpoint.

## Delivery strategy

Vertical slices ("tracer bullets") — each cuts through every layer and is
independently deployable. Four phases; the **Hero spine (P1) is built first** to
prove the hardest technical path (refraction + tiering + scroll-morph) looks
award-grade before scaling. **HITL** = a human design/architecture judgement call is
in the loop; **AFK** = self-contained and implementable without a decision.

## Slice overview

| # | Slice | Type | Blocked by |
|---|---|---|---|
| **P1** | **Hero spine** | | |
| 1.1 | Dark shell: deps, Geist, tokens, Lenis, strip legacy theme/celestial | AFK | — |
| 1.2 | Persistent cube canvas — desktop refraction, pointer-reactive | AFK | 1.1 |
| 1.3 | 3-tier fidelity + reduced-motion detection & fallbacks | HITL | 1.2 |
| 1.4 | Hero content + scroll-morph (ScrollTrigger) | AFK | 1.2 |
| 1.5 | Shell micro-interactions: loader, custom cursor, magnetic buttons | AFK | 1.1 |
| **P2** | **Work act (core)** | | |
| 2.1 | Re-author 1 diagram as an animatable structured SVG (set the format) | HITL | 1.1 |
| 2.2 | Re-author remaining 3 diagrams to the agreed format | AFK | 2.1 |
| 2.3 | Work act: pinned projects, minimal default view, alternating layouts | AFK | 1.4 |
| 2.4 | Diagram draw-on + packet-flow tied to scroll; cube face projects it | AFK | 2.1, 2.3 |
| 2.5 | "Read the build" progressive-disclosure panel | AFK | 2.3 |
| **P3** | **Approach + Trajectory** | | |
| 3.1 | `resume.ts` schema fix (location + optional dated period) | AFK | — |
| 3.2 | Approach act: cube-face skill tiers + inline real stats | AFK | 1.4, 2.4 |
| 3.3 | Trajectory act: interactive timeline (order-only, date-ready) | AFK | 3.1 |
| **P4** | **Contact + polish** | | |
| 4.1 | Contact act: cube→point-globe dissolve + direct links | AFK | 1.4 |
| 4.2 | Global polish: reveals, scroll-progress, page transitions, perf QA | AFK | all acts |
| 4.3 | Docs: rewrite `design-system.md`, update README/CLAUDE/AGENTS | AFK | 4.2 |

---

## P1 — Hero spine

### 1.1 — Dark shell: deps, Geist, tokens, Lenis, strip legacy
**Type:** AFK · **Blocked by:** None

**What to build.** Collapse the multi-page site into one scroll page and lay the dark
foundation. Add runtime deps (`three`, `@react-three/fiber`, `@react-three/drei`,
`gsap`, `lenis`, `framer-motion`). Self-host **Geist** (display + body) — no external
font request. Replace `globals.css` tri-mode/celestial tokens with a **dark palette**
(black/charcoal/graphite) + single **electric-blue** accent scale. Wire **Lenis**
smooth scroll at the layout root. Delete the theme + celestial systems.

- **Remove:** `src/components/sky/*` (`SkyScene`, `drawStars/Sun/Moon/Horizon/Clouds`,
  `palette`), `ThemeProvider`, `ThemeToggle`, `ThemeMetaColor`, `CursorSpotlight`,
  `src/lib/theme.ts`, and the old page components being superseded
  (`OrbitRing`, `ProjectModal`, `ProjectCard`, `ProjectGrid`, old `Hero`, `Header`).
- **Collapse:** `src/app/projects/page.tsx`, `resume/page.tsx`, `contact/page.tsx`
  into a single `src/app/page.tsx` with five placeholder `<section>` acts;
  `nav.ts` becomes in-page anchors; `resume.pdf` stays a download.

**Acceptance criteria**
- [ ] `npm run build` produces a static export (`out/`) with no SSR/dynamic features.
- [ ] Site renders one dark page; Lenis smooth scrolling works; no theme toggle, no
      celestial canvas, no FOUC.
- [ ] Geist loads from `'self'` (no request blocked by CSP `font-src 'self'`).
- [ ] `npm run lint` green; no dead imports to deleted modules.

---

### 1.2 — Persistent cube canvas (desktop refraction, pointer-reactive)
**Type:** AFK · **Blocked by:** 1.1

**What to build.** One fixed full-viewport `<canvas>` behind content (single RAF via
R3F, DPR cap, resize, pause on `visibilitychange` — the retired `SkyScene` pattern).
A single glass cube using `MeshTransmissionMaterial` (drei), lit for a dark scene with
electric-blue caustics/rim; subtle **pointer-reactive** drift/tilt.

**Acceptance criteria**
- [ ] A refractive glass cube renders on desktop at ~60fps and reacts subtly to
      pointer movement.
- [ ] Exactly one canvas / one RAF loop; loop pauses when the tab is hidden.
- [ ] No `document`/WebGL access at module top level (prerender-safe).

---

### 1.3 — Three-tier fidelity + reduced-motion
**Type:** HITL (fidelity/perf calibration is a judgement call) · **Blocked by:** 1.2

**What to build.** Detect fidelity tier from **GPU tier + pointer type +
`prefers-reduced-motion`**. Provide the **faux-glass** path (fresnel + env-map
reflection, no per-frame transmission buffer, reduced samples, capped DPR) for
mobile/low-power, and a **static** cube for reduced-motion. Choreography (silhouette,
motion) stays identical across tiers.

**Acceptance criteria**
- [ ] Emulated mid-range mobile / throttled GPU renders faux-glass at ~60fps with no
      transmission buffer.
- [ ] `prefers-reduced-motion: reduce` shows a static cube (no scroll-morph).
- [ ] Tier selection verified on desktop, mobile emulation, and reduced-motion.

---

### 1.4 — Hero content + scroll-morph
**Type:** AFK · **Blocked by:** 1.2

**What to build.** Hero copy — headline anchored on **"Data Analytics & AI systems,"**
short value proposition, CTA buttons, scroll indicator. GSAP **ScrollTrigger** maps
scroll `progress` to the cube's Hero→next transform (the first beat of the morph
story).

**Acceptance criteria**
- [ ] Hero shows headline, value prop, CTAs, scroll indicator; all copy traces to real
      content (no invented claims/numbers).
- [ ] Scrolling out of the Hero visibly transforms the cube via ScrollTrigger, tied to
      Lenis (no scroll-jank / double-scroll).

---

### 1.5 — Shell micro-interactions (loader, cursor, magnetic buttons)
**Type:** AFK · **Blocked by:** 1.1

**What to build.** A branded **custom loader** (first-paint, hides once the canvas is
ready), a **custom cursor**, and **magnetic** CTA buttons (upgrade `Button.tsx`).
All respect `prefers-reduced-motion`.

**Acceptance criteria**
- [ ] Loader covers initial WebGL warm-up then dismisses smoothly; no flash of
      unstyled/empty canvas.
- [ ] Custom cursor + magnetic buttons work on pointer devices and no-op on
      touch/reduced-motion.

---

## P2 — Work act (the core)

### 2.1 — Animatable structured SVG format (one diagram)
**Type:** HITL (defines the diagram authoring contract) · **Blocked by:** 1.1

**What to build.** Re-author **one** project diagram (e.g. `taxonomy`) as a
hand-structured SVG with **labeled nodes and edges** so GSAP can draw edges
(`stroke-dashoffset`) and flow packets node→node. Establish the reusable convention
(id/class naming, edge ordering) that the other three will follow. Extends ADR-002
(diagrams stay pre-rendered SVGs; `.mmd` may be retired for these four).

**Acceptance criteria**
- [ ] One diagram SVG has individually addressable nodes/edges and animates draw-on +
      packet-flow in isolation.
- [ ] A short written convention for the SVG structure is captured (in this file or a
      sibling note) for slice 2.2.

---

### 2.2 — Re-author remaining diagrams
**Type:** AFK · **Blocked by:** 2.1

**What to build.** Apply the agreed animatable-SVG format to `budget`, `gmc`,
`personas`. Replace the corresponding `public/diagrams/*.svg`.

**Acceptance criteria**
- [ ] All four diagrams share the structure/convention from 2.1 and animate
      identically.

---

### 2.3 — Work act layout (pinned projects)
**Type:** AFK · **Blocked by:** 1.4

**What to build.** The Work act driven by `PROJECTS` (`src/lib/projects.ts`): each
project **pins** on scroll with a **minimal default view** (title, one-line tagline,
diagram slot, 2–3 real impact chips from capability tags / outcome figures),
**alternating** left/right layouts. Revisit the capability tag palette
(`capabilities.ts` currently uses celestial `gold/moss/lilac/plum/silver` classes) to
fit the dark + electric-blue system.

**Acceptance criteria**
- [ ] All four projects render from `projects.ts` with alternating pinned layouts and
      minimal default copy.
- [ ] Capability tags read correctly against the dark palette (no leftover celestial
      colors clashing).
- [ ] In-progress status (Personas) is shown honestly.

---

### 2.4 — Scroll-synced diagram animation + cube face
**Type:** AFK · **Blocked by:** 2.1, 2.3

**What to build.** Wire each pinned project's diagram to scroll: edges draw on, packets
flow, key nodes light electric-blue; the cube's active **face projects the same
diagram** (refracted).

**Acceptance criteria**
- [ ] Scrolling a project pin plays its diagram draw-on/packet-flow, synced (not
      autoplaying off-screen).
- [ ] The cube face reflects the active project's diagram.
- [ ] Reduced-motion shows the final diagram state without animation.

---

### 2.5 — "Read the build" progressive disclosure
**Type:** AFK · **Blocked by:** 2.3

**What to build.** An elegant expand per project revealing the full
`problem`/`approach`/`outcome`/`howAI` (and `stack`) from `projects.ts`. Accessible
(focus management, `Esc`, keyboard) and reduced-motion-safe.

**Acceptance criteria**
- [ ] Collapsed view stays minimal; expanded panel shows all four copy blocks + stack.
- [ ] Keyboard/screen-reader operable; closes on `Esc`; no layout shift jank.

---

## P3 — Approach + Trajectory

### 3.1 — `resume.ts` schema fix
**Type:** AFK · **Blocked by:** None

**What to build.** Split the misused `period` field (currently a city). Add
`location: string` and an **optional** `period?: { start?: string; end?: string }`;
migrate existing `EXPERIENCE` entries (cities → `location`, dates left empty for now).
Timeline (3.3) renders order-only when dates are absent, dated when present.

**Acceptance criteria**
- [ ] `ExperienceItem` has `location` + optional dated `period`; all entries migrated;
      types compile; no data invented.

---

### 3.2 — Approach act
**Type:** AFK · **Blocked by:** 1.4, 2.4

**What to build.** The "how I work" act (directing AI agents, spec-driven), with the
`SKILL_TIERS` surfaced on the **cube's faces** and real figures woven **inline** (44
GMC sub-accounts, 19-site tag architecture, 200+ consultants, 4 shipped projects, 5
capability areas). **No standalone counter wall.**

**Acceptance criteria**
- [ ] Skill tiers render on cube faces / act content from `resume.ts`.
- [ ] Every inline stat traces to real content; nothing fabricated.

---

### 3.3 — Trajectory act (interactive timeline)
**Type:** AFK · **Blocked by:** 3.1

**What to build.** One interactive vertical timeline that **is** the experience section
(from `EXPERIENCE`), each role expanding to its achievement points with subtle
animation and inline metrics. Renders **order-only** now; **auto-upgrades to dated**
when `period` years are supplied.

**Acceptance criteria**
- [ ] Timeline shows the real role progression; each role expands to its points.
- [ ] Renders correctly with **no** dates today and with dates when added (no code
      change needed).

---

## P4 — Contact + polish

### 4.1 — Contact act
**Type:** AFK · **Blocked by:** 1.4

**What to build.** The finale: the cube **dissolves into a point-globe**; big *"Let's
build something exceptional."* headline; **direct links** from `nav.ts` — `mailto:`
email, LinkedIn, GitHub, `resume.pdf` download. No form, no third-party call.

**Acceptance criteria**
- [ ] Point-globe finale renders (tiered like the cube; static on reduced-motion).
- [ ] All four links work and point to the real `SITE`/`SOCIAL_LINKS` destinations.
- [ ] No network calls beyond `'self'` (CSP intact).

---

### 4.2 — Global polish + performance QA
**Type:** AFK · **Blocked by:** all acts

**What to build.** Reveal animations between acts, a **scroll-progress indicator**,
smooth section/page transitions, and a full cross-device performance pass (frame rate
on desktop + emulated mobile, battery/thermals sanity, DPR caps, `prefers-reduced-
motion` end-to-end).

**Acceptance criteria**
- [ ] ~60fps on desktop and emulated mid-range mobile across the full scroll.
- [ ] Scroll-progress indicator + inter-act reveals present; reduced-motion path fully
      static and coherent.
- [ ] Lighthouse/perf sanity acceptable for a WebGL site; no CLS from the loader.

---

### 4.3 — Documentation
**Type:** AFK · **Blocked by:** 4.2

**What to build.** Rewrite `docs/design-system.md` for the dark palette, electric-blue
accent, Geist scale, and the cube/canvas contract. Update `README.md`, `CLAUDE.md`,
and `AGENTS.md` (remove celestial/tri-mode guidance; document the acts, the cube, and
the tier system). Confirm ADR-003/004 read as superseded by ADR-005.

**Acceptance criteria**
- [ ] `design-system.md` describes the new system only (no celestial/tri-mode).
- [ ] README/CLAUDE/AGENTS reflect the single-page, dark, cube architecture.

---

## Files (representative)

| Area | Files |
|---|---|
| Shell / layout | `src/app/layout.tsx` (Lenis root, Geist, loader, cursor), `src/app/page.tsx` (five acts), `src/app/globals.css` (dark tokens + electric-blue), `vercel.json` (verify CSP unchanged) |
| Delete | `src/components/sky/*`, `ThemeProvider.tsx`, `ThemeToggle.tsx`, `ThemeMetaColor.tsx`, `CursorSpotlight.tsx`, `src/lib/theme.ts`, `OrbitRing.tsx`, `ProjectModal.tsx`, `ProjectCard.tsx`, `ProjectGrid.tsx`, old `Hero.tsx`/`Header.tsx`, `src/app/{projects,resume,contact}/page.tsx` |
| Cube | `src/components/cube/` — `CubeCanvas.tsx`, materials (transmission + faux-glass), `src/lib/gpuTier.ts` (tier detection) |
| Acts | `src/components/acts/` — `Hero.tsx`, `Approach.tsx`, `Work.tsx`, `Trajectory.tsx`, `Contact.tsx` |
| UI | `src/components/ui/` — `Loader.tsx`, `Cursor.tsx`, `MagneticButton.tsx` (from `Button.tsx`), `ScrollProgress.tsx`; possibly reuse `Reveal.tsx` |
| Content | `src/lib/resume.ts` (schema), `src/lib/capabilities.ts` (recolor), `src/lib/nav.ts` (anchors); `projects.ts`, `techIcons.ts` reused |
| Diagrams | `public/diagrams/{taxonomy,budget,gmc,personas}.svg` re-authored (`.mmd` possibly retired) |
| Docs | `docs/design-system.md`, `README.md`, `CLAUDE.md`, `AGENTS.md` |

## Verification (S-gate)

- [ ] `npm run lint` + `npm run build` green; static export (`out/`) intact at every
      phase (each phase is deployable).
- [ ] Desktop: real refraction ~60fps; mobile emulation: faux-glass ~60fps;
      reduced-motion: static cube/globe — all with identical choreography.
- [ ] Every number/claim on the page traces to `resume.ts`/`projects.ts`; no invented
      counters, clients, automations, or dates.
- [ ] All four project diagrams animate (draw-on + packets) and project onto the cube
      face; "Read the build" reveals full copy accessibly.
- [ ] Timeline renders order-only now and dated when years are supplied (no code
      change).
- [ ] Contact links resolve to real destinations; no network call outside `'self'`
      (CSP `connect-src 'self'` / `font-src 'self'` respected).

## Out of scope / deferred

- Real career **dates** (schema is ready; supply later to light up the dated
  timeline + any "X+ years" figure).
- A working contact form (deliberately not built — static export, direct links only).
- WebP/asset optimization toolchain (no `sharp`/`cwebp` locally; not a blocker).

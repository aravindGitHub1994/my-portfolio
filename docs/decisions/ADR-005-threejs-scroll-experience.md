# ADR-005: Dark, Scroll-Driven Three.js Portfolio Around One Morphing Glass Cube

## Status
Accepted — **supersedes ADR-003** (tri-mode theme) and **ADR-004** (animated
celestial sky) in full; **extends ADR-002** (diagrams stay pre-rendered SVGs but are
re-authored to be individually animatable); **retains ADR-001** (static export) while
**consciously reversing its "no new runtime dependencies" posture**. See Related
Decisions. §3's device-class tier heuristic was later partially superseded by
ADR-006 §8, and then by **ADR-009** (high-by-default fidelity with a runtime FPS
watchdog replacing the static pre-load guess).

## Date
2026-07-06

## Context
The site is being fully redesigned (branch `threeJS-redesign`) from a multi-page,
tri-mode, celestial-sky portfolio into a single **dark, scroll-driven, cinematic**
experience in the register of Awwwards / Apple / Linear / Stripe / Vercel. The
existing content (`src/lib/*.ts`) is the source of truth and is reused; the current
layout, theme system, and celestial background are not.

This was refined in a `/grill-with-docs` session (2026-07-06). Eleven design
branches were resolved; the tensions worth recording:

- **Honest content vs. "premium flex."** The current content deliberately
  under-claims — skills are tiered `Core strengths / Build with AI / Working
  knowledge` with blurbs like *"not claiming mastery"*, and projects say *"I direct
  AI agents"* and *"exploratory, not shipped"* where true. The brief wanted a
  senior-flex tone with an animated **counter wall** ("Clients Supported",
  "Automations Created"). The data supports **no** client count, automation tally, or
  even dates (the `period` field holds a *city*, not years). Fabricated counters
  would both lie and undercut the honesty that is the actual differentiator.
- **"Mobile equally polished" vs. real glass refraction.** A true refractive cube
  (`MeshTransmissionMaterial`) samples the scene into a buffer every frame — one of
  the most GPU-expensive things on a page. Unmodified, it drops frames and drains
  battery on mid-range mobile.
- **"Five 3D concepts" (brief Options A–E) vs. coherence + budget.** Award sites
  read as one continuous story because they commit to **one** metaphor and transform
  it, not five separate WebGL demos.
- **"Large product visuals / device mockups" vs. asset reality.** The four projects
  are backend/data systems. There are **zero** product screenshots in the repo (only
  four Mermaid-sourced architecture SVGs and two personal photos), and several are
  client work where showing a real dashboard is a confidentiality problem.
- **Three overlapping career sections.** The brief's *About*, *Experience*, and
  *Metrics* all retell the same résumé — a saggy, repetitive middle.
- **"Minimal text" vs. depth that proves seniority.** The real substance is the
  `problem`/`approach`/`outcome`/`howAI` copy; cutting it to one-liners would erase
  the evidence of senior-level thinking.
- **Static export (ADR-001) vs. the mandated stack.** R3F, drei, GSAP, Lenis, and
  Framer Motion are all client-side and compatible with `output: "export"`, but they
  are heavy **runtime** dependencies — a deliberate reversal of ADR-004's "no new
  runtime dependencies are introduced."

## Decision

### 1. Positioning — honest-but-bold; only real numbers
Confident, senior visual and verbal tone; **every hard number on the page traces to
`resume.ts`/`projects.ts`**. No invented client/automation/project counts. Hero
identity is anchored on **"Data Analytics & AI systems."** The tiered, AI-directed
framing is kept as the differentiator, not hidden. There is **no standalone metrics
counter wall**; real figures (e.g. *44 GMC sub-accounts*, *19-site tag architecture*,
*200+ consultants supported*, *4 shipped projects*, *5 capability areas*) animate
**inline** where they are earned.

### 2. One morphing glass data cube — the visual spine
A single **glass/refractive cube** is the constant object, rendered on **one
persistent full-viewport `<canvas>`** fixed behind the scrolling content (reusing the
single-canvas pattern proven by the retired `SkyScene`: one RAF loop, DPR cap,
resize handling, pause on `visibilitychange`). Scroll `progress` drives its
transformation act-to-act — it never unmounts and there is never more than one
canvas. Per-section canvases are rejected.

### 3. Three-tier fidelity, identical choreography
The cube's **choreography (silhouette, motion, scroll story) is identical across all
devices**; only shader cost changes:
- **Desktop / high-GPU:** full `MeshTransmissionMaterial` refraction with caustics.
- **Mobile / low-power:** faux-glass — fresnel + env-map reflection, **no per-frame
  transmission buffer**, reduced sample counts, capped DPR.
- **`prefers-reduced-motion`:** a static hero cube, no scroll-morph.
Tier is chosen from **GPU tier + pointer type + `prefers-reduced-motion`**. This is
how "mobile equally polished" is honored — same experience, right-sized cost.

### 4. Five tight acts (merge the overlapping career sections)
1. **Hero** — the cube, headline, value proposition, scroll indicator, CTAs;
   background reacts subtly to pointer.
2. **Approach** — "how I work" (directing AI agents, spec-driven), with the skill
   tiers surfaced on the **cube's faces** and real stats woven in **inline** (no
   counter wall). Absorbs the brief's *Skills* + *About* + *Metrics*.
3. **Work** — the four projects, the **core** of the site (see §5).
4. **Trajectory** — one interactive career timeline that **is** the experience
   section; key figures animate inline per role.
5. **Contact** — the cube dissolves into a point-globe; big *"Let's build something
   exceptional."* headline; direct links (see §6).

### 5. Work act — animated architecture diagrams as the "large visual"
Each project pins on scroll; its **architecture diagram is the hero visual** —
drawn edge-by-edge with data "packets" flowing node→node, and the cube's active face
"projects" the same diagram, refracted. The diagrams are **re-authored as
hand-structured, individually animatable SVGs** (labeled nodes/edges), extending
ADR-002's "diagrams are pre-rendered SVGs referenced via `<img>`" — they remain
pre-rendered and checked in, but gain internal structure so GSAP can animate them.
**Text density:** each project's default view is minimal (title, one-line tagline,
diagram, 2–3 real impact chips); the full `problem`/`approach`/`outcome`/`howAI`
lives behind an elegant **"Read the build" progressive disclosure**. No copy is lost;
none of it is a wall of text.

### 6. Contact — direct links, no backend
Static export has no server. Contact resolves to **direct actions** already present
in `nav.ts`: `mailto:` email, LinkedIn, GitHub, and the `resume.pdf` download — no
form, no third-party POST, no CSP loosening, no spam surface.

### 7. Dark-only; retire tri-mode and celestial
A single dark cinematic environment lit around the cube. The theme toggle, tri-mode
resolution, and the entire `SkyScene`/celestial system are **removed**; ADR-003 and
ADR-004 are superseded (their work remains in git history). Signature accent is a
**single electric blue** (used sparingly — glow, active states, diagram highlights,
cube caustics) against a black/charcoal/graphite base — deliberately avoiding the
four-accent "colorful/cyberpunk" look the brief said to avoid. Typography is
**Geist** (display + body), **self-hosted** so no external request violates the
`vercel.json` CSP.

### 8. Stack & data-schema changes
- Add runtime deps: `three`, `@react-three/fiber`, `@react-three/drei`, `gsap`
  (+ `ScrollTrigger`), `lenis`, `framer-motion`. Static export is retained; all WebGL
  / DOM access stays inside effects and mounted guards so prerender stays safe.
- **`resume.ts` schema fix:** the misused `period` field (currently a city) is split
  into a proper `location` plus an **optional** `period?: { start?; end? }`. The
  Trajectory timeline renders order-only now and upgrades to dated automatically when
  real years are supplied.

### 9. Delivery — vertical slice first (each phase deployable)
- **P1 — Hero spine:** real glass cube, scroll-morph, 3-tier fidelity, Lenis smooth
  scroll, custom loader, custom cursor + magnetic buttons. Proves the whole technical
  approach looks award-grade before scaling.
- **P2 — Work act:** the four projects + animated re-authored diagrams + progressive
  disclosure.
- **P3 — Approach + Trajectory:** cube-face skills, inline stats, flexible timeline.
- **P4 — Contact + polish pass:** point-globe finale, page-transition and
  micro-interaction polish, cross-device QA.

Details, files, and per-phase acceptance live in the implementation plan
(`docs/plans/implementation-plan-0003.md`).

## Alternatives Considered

### Point-cloud / node-constellation spine instead of the glass cube
- **Pros:** cheaper on GPU (no transmission buffer), degrades to fewer points
  trivially, reads unambiguously as "data."
- **Rejected:** the glass cube was chosen for its Apple-grade premium read and its
  natural "faces = panels / unfolds per project" choreography; the mobile tier (§3)
  addresses the cube's cost.

### Full glass refraction on every device (cap quality globally)
- **Rejected:** even with DPR/resolution caps, per-frame transmission risks 30–45fps
  and warm batteries on older Android, making "polished on mobile" dishonest.

### Desktop-only 3D, mobile gets a static 2D render
- **Rejected:** mobile would no longer be *equally* interactive; the tiered approach
  keeps the live, choreographed cube everywhere.

### Keep all seven brief sections (About + Experience + Metrics separate)
- **Rejected:** three retellings of one résumé sag the middle; five acts are tighter
  and put weight on the Work core.

### A working contact form (Formspree/Web3Forms) or a mailto-backed fake form
- **Rejected:** the third-party form needs CSP `connect-src` loosening, an account,
  and spam handling on a site with no backend; the mailto-fake form is clunky and
  mildly deceptive. Direct links are what most award sites ship.

### Invent aggregate counters for a metrics wall
- **Rejected:** no client/automation/date data exists; fabricating it would lie and
  undercut the honest positioning that is the differentiator.

### Fake UI / device mockups per project
- **Rejected:** no source screenshots exist, several projects are confidential client
  work, and invented dashboards read generic and clash with the honest tone. The real
  architecture diagrams are both truthful and on-brand for a systems/data person.

### Keep the celestial sky as a backdrop behind the cube
- **Rejected:** two competing focal systems read busy; a single dark, cube-lit world
  is cleaner and more "award site."

## Consequences

### Positive
- One coherent, cinematic story built around a single morphing object — not five
  disconnected demos.
- "Mobile equally polished" is honored honestly via tiered fidelity with identical
  choreography, and `prefers-reduced-motion` is respected by design.
- Every number on the page is defensible; the honest, AI-directed positioning is
  amplified rather than papered over.
- Project visuals are truthful (real architecture) and require no confidential or
  fabricated assets.
- Phased, each-phase-deployable delivery de-risks a large build; the Hero slice
  proves the hardest part first.

### Negative
- Materially larger client bundle and a real WebGL/GSAP/Lenis maintenance surface —
  a deliberate reversal of ADR-004's "no new runtime dependencies."
- The `MeshTransmissionMaterial` desktop path and the tier-detection/fallback logic
  need genuine cross-device performance testing.
- The four Mermaid SVGs must be **re-authored** as structured/animatable SVGs (ADR-002
  pipeline changes from "render Mermaid" to "hand-structured, animatable"); the
  `.mmd` sources may no longer be the source of truth for these four.
- Retiring `SkyScene`/tri-mode is a migrate-then-delete that discards recent shipped
  work (ADR-003/004); it is preserved only in git history.
- The multi-page structure (`/`, `/projects`, `/resume`, `/contact`) collapses into
  one scroll page; `nav.ts` and routing change accordingly (resume stays a PDF).
- Real career **dates** are still missing; the timeline ships order-only until
  supplied.

## Related Decisions
- **ADR-001** (static export) — **retained**. No SSR/API/route handlers/Server
  Actions/`next/image`; WebGL and DOM access stay inside effects/mounted guards. Its
  "no new runtime dependencies" *posture* is consciously reversed (§8, Negative).
- **ADR-002** (Mermaid pre-rendered SVGs) — **extended**. Diagrams remain
  pre-rendered SVGs referenced via `<img>`/inline, but are re-authored to be
  individually animatable; the four project diagrams' `.mmd` sources may be retired.
- **ADR-003** (tri-mode theme) — **superseded**. Theme toggle, tri-mode resolution,
  and pre-paint theme script removed; the site is dark-only.
- **ADR-004** (animated celestial sky) — **superseded**. `SkyScene` and the entire
  celestial/horizon/star system are removed and replaced by the cube canvas.
- `docs/design-system.md` — must be rewritten on implementation: the celestial
  background, tri-mode tokens, and multi-page conventions no longer apply; add the
  dark palette, electric-blue accent, Geist type scale, and the cube/canvas contract.

## References
- [MeshTransmissionMaterial (drei)](https://github.com/pmndrs/drei#meshtransmissionmaterial)
- [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [Lenis smooth scroll](https://github.com/darkroomengineering/lenis)
- [React Three Fiber](https://r3f.docs.pmnd.rs/)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/docs/Web/CSS/@media/prefers-reduced-motion)
- ADR-001 / ADR-002 / ADR-003 / ADR-004 (this repo) — the records this decision
  retains, extends, and supersedes.

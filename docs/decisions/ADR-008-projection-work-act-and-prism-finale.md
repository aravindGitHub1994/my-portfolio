# ADR-008: Projection Work Act, Safari-Frame Previews, and the Prism-Constant Finale

## Status
Accepted — **partially supersedes ADR-006** (§1's "cube returns as the payoff" and
the Work-act recede choreography; the prism no longer transforms at all), **amends
ADR-007** (the curtain reveal is retained unchanged, now mounted inside a Safari-style
browser frame), **retains ADR-001** (static export) and ADR-006 §7/§7a's imagery
principle. **Refined by ADR-009** (§2's projector beams now enter one prism face
and exit a different one that tracks the active card's side).

## Date
2026-07-10

## Context
Owner review of the shipped Lens (ADR-006/007), refined in a `/grill-with-docs`
session (2026-07-10). Five findings:

- **The Lens goes dormant exactly where the site matters most.** During the Work act
  the choreography deliberately dims and recedes the prism ("projects own the stage",
  `acts.work` tent curve) — in practice it reads as *the background gave up*. The owner
  wants the opposite: the prism should visibly **project** each product screenshot,
  its exit beams curving to the active card and re-targeting as you scroll.
- **Screenshots float frameless.** The recreated product UIs read stronger presented
  as real, running software — a browser window, slightly proud of the page in 3D.
- **The finale underwhelms its owner.** Prism → cube crystallization → point-globe
  was designed as the "crystallized insight" payoff (ADR-006 §1), but in review the
  transformation reads as the site discarding its own central object twice.
- **The Taxonomy recreation carries a retired fictional brand** ("Data Path") that
  reads as a real product name; the card is titled Taxonomy Builder everywhere else.
- **The portfolio's actual core craft is missing.** Five years of tag
  auditing/planning/implementation/governance across 600+ client accounts and 9+
  ad/analytics platforms — the owner's bread-and-butter — has no card. A raw GTM
  screenshot supplied for it (untracked, `docs/projects/core-skills/`) contains a
  real container ID, a real measurement ID, and a work email address, so it must be
  recreated with fictional data and the raw file deleted (ADR-006 §7 principle;
  identifiers intentionally not restated here).

## Decision

### 1. Safari-frame previews with pointer-tracked tilt
Each screenshot card's preview mounts inside a **macOS-Safari-style browser frame**
(traffic lights, URL pill) that sits slightly proud of the page and **tilts in 3D
toward the pointer** (Apple-TV-card style, springs flat on leave). The URL pill shows
a **fictional product domain** consistent with the recreation universe. The ADR-007
curtain reveal renders unchanged inside the frame's viewport. Tilt runs only with a
fine pointer and no reduced-motion preference; the frame itself (chrome + shadow) is
plain DOM/CSS and ships on every tier. The screenshot-less card (Personas) keeps its
plain diagram panel — an architecture diagram is not a website.

### 2. The Work act becomes a projection
The prism stays **bright and present** through the Work act (the recede/dim is
removed on the high tier) and acts as the projector:

- Panels keep **alternating** text/preview sides (per owner preference over a fixed
  prism-left layout). The prism **hops to the corner opposite the active window**
  and its beam particles **curve diagonally across** the panel into the window.
- The stream is a **continuous projection** — flowing the whole time a project is
  pinned, so the window reads as actively cast by the Lens; on scroll hand-off the
  beam endpoint sweeps to the next card's window.
- The stream feeds **every** card, including Personas' diagram panel, so the
  projection metaphor never switches off mid-act. The window/panel materializes
  (fade/rise) on first entry, synced to the stream; the curtain reveal and the
  Personas draw-on + packet pass are unchanged.
- Targeting reuses the kinetic DOM→world mapping (`kinetic/layout.ts`): cards
  register their preview element, and the beam shader receives the active target
  in world space.
- **Tier policy (ADR-006 §8 unchanged in spirit):** full projection on the high
  tier with the `lg`+ pinned layout only. Low tier keeps today's recede; static and
  reduced-motion keep resolved end-states; stacked mobile has no stream.

### 3. The prism never transforms (finale simplification)
The cube crystallization (Trajectory) and the point-globe dissolve (Contact) are
**retired**. The prism is now the site's constant object end to end:

- **Trajectory** — the prism returns calmly toward center and the beam fan re-forms
  ordered: a recap, not a metamorphosis.
- **Contact** — the beams bend downward and converge into a soft **underline/halo
  beneath the contact CTA buttons**: the refracted output literally points at
  "hire me."
- This reverses ADR-006 §1's "the cube returns as the payoff" — review showed the
  payoff read as the prism being discarded, and "the Lens is the brand" consistency
  won. The static tier's resolved end-state becomes the prism (was the cube).

### 4. A fifth card: Tagging & Measurement (placed first)
The core-craft card leads the project list — audit → plan → implement → govern
across GA4, Meta, Criteo, Google Ads, CM360, DV360, Kakao, StackAdapt, The Trade
Desk and more; deep vanilla-JS DOM work for scraping pages to set tag parameters;
**600+ client accounts** audited, tagged, or troubleshot since March 2021.

- **`howAI` becomes optional.** This card is manual craft, not an AI-directed build;
  an invented AI angle would violate the honesty rule (ADR-005, retained). The
  "Read the build" dialog simply omits the section.
- **Two new capability keys** — `measurement` and `governance` — because none of the
  existing five fit tagging work. The "capability areas" stat auto-counts to 7.
- **600+ joins the Approach stat band**, traced (per `stats.ts` convention) to this
  project's copy.
- **Diagram** (`public/diagrams/tagging.svg`, `tag-` id prefix): a lifecycle
  pipeline — Audit → Tag Plan → Implement (dataLayer + GTM) → QA → Publish → Govern —
  with a **loop-back edge Govern → Audit** (governance is continuous) and a platform
  rail. Chosen over a hub-and-spoke platform fan-out.
- **Screenshot** recreated as a GTM container overview under the existing fictional
  **Veyra Electronics** universe with fabricated container/measurement IDs and a
  fictional editor email; the raw capture (real IDs + work email) is deleted. It was
  never committed, so no history remediation is required. The Taxonomy recreation
  drops the "Data Path" brand in the same pass.

## Alternatives Considered

- **Fixed layout: prism left, windows always right** — strongest projection physics;
  rejected by owner in favour of the alternating compositions.
- **Build-once-then-idle stream** — rejected: the continuous stream is what makes the
  window read as *projected* rather than merely delivered.
- **Finales: cube + constellation network · converging beacon · cube + orbital rings**
  — all rejected for the prism-constant + CTA-spotlight ending (calmest, strongest
  brand consistency).
- **Static perspective pop / scroll-entry pop** for the frames — rejected for the
  pointer-tracked tilt.
- **Writing an invented AI angle for the tagging card** — rejected on the honesty
  rule; `howAI` made optional instead.
- **Hub-and-spoke tagging diagram** (site → GTM → 9 platforms, prism-echo) — rejected
  for the lifecycle pipeline, which tells the *process and governance* story the card
  is about.

## Consequences

### Positive
- The Lens finally *works for its living* during the act that gets the most dwell
  time, and the projection ties the metaphor directly to the owner's shipped work.
- One object, start to finish — no more discarding the brand's central prop; the
  beams' final act converts the metaphor into a call to action.
- The craft that actually pays the bills gets the lead card, with defensible numbers
  and zero confidential material (raw capture deleted, identifiers fabricated).
- Browser chrome + tilt makes the recreated screenshots read as live product.

### Negative
- The beam shader grows a projected mode (curved path to a per-frame DOM-derived
  world target) — more uniforms, more choreography states, and a per-frame
  `getBoundingClientRect` on the active card (already the accepted cost of the
  kinetic layers).
- Act semantics change (`trajectory`/`contact` no longer mean crystallize/dissolve):
  every stale "prism → cube → point-globe" comment and doc line must be updated
  (`AGENTS.md`, `CLAUDE.md`, `page.tsx`, lens components) or the docs lie.
- Removing the cube deletes shipped work (`RoundedBox` path, crystallization beat)
  and the `GlassImage` pipeline stays dormant (unchanged from ADR-007).
- A five-card Work act lengthens the scroll; the header's "Four systems" framing and
  the stat band need rewrites in the same change to avoid drift.

## Related Decisions
- **ADR-001** (static export) — retained; the frame/tilt is CSS, targeting stays in
  effects/frame loops.
- **ADR-005** (honest, real numbers) — retained; drives the `howAI`-optional and
  600+-traceability decisions.
- **ADR-006** (The Lens) — partially superseded: §1's cube payoff and the Work-act
  recede are reversed; the dispersion metaphor, act structure, tiers (§8), and
  imagery rules (§7/§7a) are retained and reaffirmed.
- **ADR-007** (curtain reveal) — retained unchanged in behavior; its preview now
  renders inside the Safari frame.

## References
- Plan of record for the implementation: grill session 2026-07-10 (this ADR is its
  decision record; slicing in `docs/plans/`).
- ADR-005 / ADR-006 / ADR-007 (this repo).

# ADR-010: Universal display-text refraction, opt-in fidelity downgrade, projector-assembled windows, and a tool-icon inflow

> [!NOTE]
> **Superseded as the site's experience layer by
> [ADR-012](ADR-012-win98-workstation-cinematic-redesign.md)** (The Workstation).
> The Lens-specific decisions are retired. What survives, and is still binding, is
> **§2's opt-in downgrade rule**: the FPS watchdog **asks before** dropping
> fidelity and never swaps silently. The Workstation's shed ladder obeys the same
> principle — seven garnish rungs shed silently, but the one rung that changes
> what the visitor came for *asks*. See `docs/design-system.md`. This file is an
> immutable record: not renamed, not rewritten.

> **Status pointer (2026-07-11):** §4 (tool-icon inflow) was **retracted** by
> [ADR-011](ADR-011-lens-legibility-and-inflow-simplification.md); the filename is
> retained because ADRs are immutable records. §1/§2/§3/§5 stand.

## Status
Accepted — **reverses ADR-009 §3** (the silent auto-downgrade to `low` becomes an
**opt-in prompt** that switches only on user confirmation) **and ADR-009 §5 /
ADR-006 §2's "body copy stays crisp" line** (all *display* text now gets a
distortion-only kinetic twin; only interactive/hover-state elements and the Safari
window stay crisp); **amends ADR-008 §2** (a projected window no longer plain
fade/rises — it **assembles from chromatic shards** synced to the first beam-lock);
**extends ADR-006 §1** (the anonymous inflow gains a sparse procession of
**tool-icon coins** that dissolve into the insight-beams); adds content to the
Tagging & Measurement card (`projects.ts` + `public/diagrams/tagging.svg`). **Retains
ADR-001** (static export) and **ADR-006 §7/§7a's imagery/confidentiality principle**.

## Date
2026-07-11

## Context
Owner review of the shipped high-tier Lens (ADR-006 → ADR-009), refined in a third
`/grill-with-docs` session (2026-07-11). Five findings:

- **The cursor refraction still reaches too little of the page.** ADR-009 §5 extended
  the aberration to the small labels and counters but deliberately held the line at
  "body copy, taglines, and capability chips stay crisp" (ADR-006 §2, legibility/SEO).
  The owner now wants the opposite reach: **everything textual** should react to the
  pointer — *except* elements whose `:hover`/`:focus` visual state carries meaning
  (buttons, nav links, contact/social links, the reveal-curtain preview) and the Safari
  window. The distortion, not the entrance drama, is the shared behaviour wanted.
- **The performance safety net takes agency from the user.** ADR-009 §3's watchdog
  *silently* hot-swaps an auto-`high` device down to `low` and then explains itself. The
  owner wants to be **asked first** — a prompt offering the basic version to avoid lag,
  switching only if the user confirms — so a capable-but-briefly-janky session isn't
  demoted behind the user's back.
- **The Work-act window merely fades in.** ADR-008 §2 casts a continuous projector
  stream at each card but the window itself just fade/rises (`ProjectPin`'s `rise`
  tween). The owner wants the projected particles to visibly **build the window bit by
  bit** — the stream should read as *constructing* the Safari frame, not delivering a
  pre-made one.
- **The input stream is anonymous dust.** The inflow (`DataStreams.tsx`) is dim gray
  data-packets with no identity. The owner wants the **actual stack** flowing in as
  small recognizable objects — the raw tools that the prism refracts into insight —
  reinforcing the data→meaning metaphor with concrete craft.
- **The Tagging & Measurement card under-sells its core craft.** The lead card
  (ADR-008 §4) omits three signature skills: **vanilla-JS DOM manipulation to build
  custom GTM variables and triggers**, **Chrome DevTools** debugging, and **server-side
  GTM**. All three are platform/tool skills — no client identifiers — so they add
  defensible detail with zero confidentiality exposure.

## Decision

### 1. Universal display-text refraction (distortion-only twins)
Every *display* text element becomes a kinetic twin so the whole-screen `RefractionPass`
(ADR-006 §4) — which can only warp pixels rendered in the WebGL layer — reaches it:

- **Distortion-only variant.** New twins render crisp on entry (entrance `progress`
  pinned to `1`, skipping the refract-in shard animation) and only aberrate near the
  pointer and with scroll velocity. Headings, mono labels, and the `NN / NN` counters
  keep their signature refract-in (ADR-006 §3, ADR-009 §5) — the "assembly" drama stays
  reserved for them; entry does not become a full-page shimmer.
- **Scope.** Taglines, section intro/body paragraphs, capability chips, tech tags, stat
  figures/labels, and the "Read the build" dialog copy. Reuses the existing rasterizer
  (`kinetic/rasterize.ts` — a per-character `Range.getClientRects()` walk that already
  lays out multi-line text at the browser's own wrapping) and `kinetic/layout.ts`.
- **Exclusions (stay crisp DOM).** Anything with a meaningful `:hover`/`:focus` visual:
  buttons (which keep ADR-009 §5's DOM RGB-split), nav links, contact/social links, the
  reveal-curtain preview — plus the **Safari window** frame. Twinning sets the DOM node
  to `opacity: 0`; it stays clickable (the canvas wrapper is `pointer-events: none`) and
  in the a11y tree, but a static raster can't show a `:hover` state change, so
  interactive affordances must not be twinned.
- **Tier/a11y.** High tier + fine pointer only (the pass is already gated there); lower
  tiers and reduced-motion keep crisp DOM — graceful reduction unchanged. The DOM stays
  the source of truth for SEO/ATS/screen-readers.
- **Cost containment.** Per-frame cost is one `getBoundingClientRect` + one plane draw
  per twin. Measurement/rasterization is **visible-only** (offscreen twins skip the
  layout read, extending `layoutPlaneToRect`'s existing cull) so the twin count doesn't
  linearly tax the frame budget the watchdog measures.

> **Implementation note (2026-07-11).** Three scope items were pulled back to crisp
> DOM during implementation because the kinetic canvas is fixed at `-z-10` and GL
> twins paint **under** every DOM background: `Tag`/`CapabilityTag` chips paint their
> own surface (opaque / 60%) over where their twin would render; the "Read the build"
> `<dialog>` lives in the browser top layer, which always paints above the canvas; and
> Trajectory's disclosure content is interactive (hover color a static raster can't
> follow) and sits in `overflow-hidden` collapse panels a twin can't clip to. All
> three are flagged for the 6.2 owner review (implementation-plan-0007).

### 2. Opt-in fidelity downgrade (reverses ADR-009 §3)
The `FpsWatchdog` still detects a sustained sub-40fps window, but `handleSlow`
(`LensRoot.tsx`) **no longer calls `setTier("low")`**. Instead the `FidelityNotice`
becomes a **decision prompt**:

- Copy shifts from a statement to a question ("Switch to a basic version to avoid
  lag?") with **Switch to basic** (confirm → `setTier("low")`) and **Keep full quality**
  (decline → dismiss, stay `high`). "Switch to basic" is the visually recommended action
  but nothing is auto-selected.
- **One prompt per page load** (the `watchdogFired` one-shot guard is retained), non-
  modal, same corner as today, session-only (no persistence). Declining is a valid,
  remembered-for-the-session choice: the site stays on `high` and the lag persists **by
  the user's decision** — the code no longer overrides it.
- Floors from ADR-009 §3 are unchanged (`prefers-reduced-motion → static`, no-WebGL →
  `none`, software-renderer pre-emptive `low`, `?tier=` override wins and suppresses the
  watchdog).

### 3. The projector assembles the window (amends ADR-008 §2)
`ProjectPin`'s plain `rise` tween is replaced by a **chromatic-shard assembly** — the
same visual vocabulary as the kinetic-text refract-in (ADR-006 §3), so the window reads
as projected light condensing into a frame:

- Plays **once, on first entry**, its timeline synced to the beams first locking onto
  the card (the damped projection endpoint). Re-scrolling only moves the beam endpoint —
  no rebuild. The ADR-007 curtain reveal works normally *after* the build completes.
- Mechanism: a shard/RGB-split reveal overlay on the DOM window driven by GSAP on the
  projection timeline (the window itself is **not** a persistent GL twin — it is an
  ADR-010 §1 exclusion). Reduced-motion / low / static (no beams) → a simple fade, as
  today.

### 4. Tool-icon inflow (extends ADR-006 §1)
The inflow gains a **sparse, slow procession of tool-icon "glass coins"** riding the
data-packets: small extruded discs with a monochrome, spectrum-tinted logo on the face,
tumbling gently, catching the scene lighting, and **dissolving/refracting into the
colored beams at the prism mouth** — raw tools in, ordered insight out.

- **Density is deliberately low** (~one coin every ~2s, ≤3–4 on screen) so it never
  reads as toolbar clutter. Visible during Hero + Approach; **thins during Work** so the
  projector act (ADR-008 §2) owns the stage.
- **Set:** Claude Code, GTM, GA4, Python, React, Postgres, Excel, Looker Studio, CM360,
  Google Ads, Facebook, Criteo, Kakao, Naver — plus a **JavaScript cluster rendered as
  code-token chips** instead of the JS logo: `addEventListener`, `querySelector` (the DOM
  stand-in), `window.dataLayer`, and a drawn chocolate-chip **cookie** glyph.
- **Sourcing:** monochrome single-path glyphs from `simple-icons` where available
  (the `techIcons.ts` convention); a monospace **text-token chip** falls back for marks
  without a clean glyph (e.g. CM360, Looker Studio) — the same treatment as the JS
  tokens, so the fallback is a coherent design element, not a gap.
- **Tier/a11y.** High tier on (low tier at reduced count); **off on static and reduced-
  motion**. Coins are decorative (`aria-hidden`) — the real skills already ship as DOM
  copy. Instance transforms/seeds stay deterministic (`mulberry32`, no `Math.random` in
  render — react-compiler rule), matching `DataStreams`.

### 5. Tagging & Measurement card: DOM triggers, DevTools, server-side GTM
`projects.ts` (`slug: "tagging"`) gains three honest skill statements — woven into
`approach`, surfaced in the `tagline`, and added to `stack` (`Server-side GTM`,
`Chrome DevTools`): **Chrome DevTools** audit of the network/dataLayer; **vanilla-JS DOM
manipulation to build custom variables and triggers** where a site exposes no clean data
hooks; and **server-side GTM** for first-party durability. `public/diagrams/tagging.svg`
gains a **server-side container node** off Implement (client + server GTM), following
the authoring convention (`tag-` id prefix, `data-step` build order, `dg-node`, single-
accent). No client names or financial figures are introduced (CLAUDE.md confidentiality
rule; all names are platforms/tools).

## Alternatives Considered
- **Keep body copy crisp (ADR-006 §2 / ADR-009 §5 line)** — reversed here at owner
  request; mitigated by the *distortion-only* variant (no entrance shimmer on body copy)
  and visible-only measurement, so legibility and framerate hold.
- **A CSS/SVG `feDisplacementMap` field over the DOM** instead of GL twins — rejected;
  it would not match the WebGL refraction look and is a whole parallel subsystem. Twins
  reuse the shipped kinetic pipeline.
- **Keep the silent auto-downgrade (ADR-009 §3)** — rejected for user agency; the
  trade-off (a declined prompt means the user keeps a laggy `high`) is accepted as their
  choice. **Proactive first-load offer** — still rejected as a nag (ADR-009); the prompt
  is watchdog-triggered only.
- **Window build motifs: projector scanline wipe · tile/mosaic assembly** — rejected for
  the **chromatic-shard** assembly, which reuses the existing refract-in vocabulary (one
  assembly language across text and windows). Rebuild-on-every-reactivation — rejected as
  restless; build once on entry.
- **Icon form: billboarded sprites · extruded logo meshes** — rejected for **glass
  coins** (sprites aren't literally 3D; extruding 16 arbitrary marks is fragile and
  heavy; a textured coin works uniformly for any logo). **Brand-colored icons** —
  rejected for monochrome spectrum-tint (16 multicolor marks read as clutter and fight
  the dark studio). **Persist through all acts / no consumption** — rejected for
  consumed-into-beams during Hero+Approach (the input→output payoff, and it clears the
  Work stage).
- **Tagging additions in `approach` only** — extended to the tagline and a diagram node
  at owner request for on-card visibility without opening the dialog.

## Consequences

### Positive
- The pointer refraction now reaches the whole *display* surface the owner wanted, while
  the distortion-only variant and the interactive-element exclusions keep the page
  readable and every affordance intact.
- The user, not a heuristic, decides whether to trade fidelity for smoothness.
- The projector visibly *makes* each window, tying the Work act's central motion to a
  single shard-assembly vocabulary shared with the kinetic type.
- The inflow finally *says something* — the owner's real stack flows in and becomes
  insight — without cluttering the scene or claiming skills the DOM copy doesn't already.
- The lead card names three more concrete, defensible skills with zero confidential
  material.

### Negative
- **Twin count rises substantially.** Every display element is now a rasterized plane
  with a per-frame layout read; visible-only measurement caps it, but this is the single
  biggest new load on the frame budget — and the safety net that used to catch it is now
  *opt-in* (§2), so a declined prompt can leave a genuinely laggy high tier. Owner-
  verified on real hardware (the agent runs no browser QA).
- The kinetic system grows an entrance **variant** flag (refract-in vs distortion-only)
  and the registration surface widens from a few headings to most of the page's text —
  more elements to wrap/register and keep out of the interactive-exclusion set.
- A new GL object type (instanced tumbling coins + logo textures/atlas) and its
  consume-at-prism choreography join `DataStreams`; a new window-assembly controller
  joins `ProjectPin`.
- **Living docs must be reconciled in the same change or they lie:** `CLAUDE.md`,
  `AGENTS.md`, `README.md`, and `docs/design-system.md` all still say "body copy stays
  crisp" and "FPS-watchdog fallback to low" (auto). The `techIcons.ts` header (orphaned
  "orbiting the hero portrait") should be updated to its real new use.
- Reverses two decisions only one day old (ADR-009 §3, §5); the ADR trail stays honest
  but the churn is real.

## Related Decisions
- **ADR-001** (static export) — retained; twins/coins/assembly live in effects and frame
  loops, the prompt is client DOM, the icon assets are local/procedural.
- **ADR-006** (The Lens) — §1 inflow extended with tool-icon coins; §2's crisp-body-copy
  legibility line reversed for display text (distortion-only); §3 refract-in vocabulary
  reused for window assembly; §4 pass unchanged; §7/§7a imagery/confidentiality retained.
- **ADR-007** (curtain reveal) — unchanged; it runs after the §3 window assembly finishes.
- **ADR-008** (projection Work act) — §2's window materialization upgraded from fade/rise
  to shard assembly; §4's Tagging card copy/diagram extended.
- **ADR-009** (lens refinement) — §3 (auto-downgrade) and §5 (crisp body copy) reversed;
  §1 material, §2 beam faces, §4 reveal affordance retained.

## References
- `/grill-with-docs` session 2026-07-11 (round 3) — this ADR is its decision record.
- Implementation slicing: `docs/plans/implementation-plan-0007.md`.
- ADR-001 / ADR-005 / ADR-006 / ADR-007 / ADR-008 / ADR-009 (this repo).

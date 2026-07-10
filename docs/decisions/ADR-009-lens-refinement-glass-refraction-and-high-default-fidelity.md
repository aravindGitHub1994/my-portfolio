# ADR-009: Lens refinement — glass prism, physical beam refraction, high-by-default fidelity, reveal affordance, extended aberration

## Status
Accepted — **partially supersedes ADR-005 §3 and ADR-006 §8** (the static GPU-tier
heuristic that downgraded mobile/weak hardware to `low` is replaced by **high-by-default
with a runtime FPS watchdog**); **refines ADR-006 §1** (prism material) **and §4**
(aberration scope); **refines ADR-008 §2** (beam projection faces); **amends ADR-007**
(adds a discovery affordance to the curtain reveal — the reveal itself is unchanged);
**retains ADR-001** (static export) and **ADR-006 §7/§7a's imagery/confidentiality
principle**.

## Date
2026-07-11

## Context
Owner review of the shipped high-tier Lens (ADR-006/007/008), refined across two
`/grill-with-docs` sessions (2026-07-10 and 2026-07-11). The tuning pass recorded in
`HANDOFF.md` (pass #2) had de-metalized the prism once already and was never verified on
a real GPU; this ADR supersedes those material values. Five findings:

- **The high-tier prism reads as "metallic shimmer," not glass.** The
  `MeshTransmissionMaterial`'s environment reflections (`envMapIntensity` bouncing the
  scene's `Lightformer` strips off a glossy surface) make it bright and chrome-like. Two
  symptoms follow from the same brightness: light-colored headings — which render as GL
  twins *in front* of the prism at `z = 2.6`, so this is a **contrast** problem, not
  occlusion — lose legibility, and the wireframe data-core inside washes out entirely.
  The material's own code comment claimed the opposite; it was inaccurate.
- **Beams enter and exit the same prism face.** On left-window Work cards (e.g. Taxonomy,
  `side = -1`), the prism glides right and the window sits left, but the beam origin was
  hard-pinned to the prism's right face while inflow entered the left face — the spectrum
  emerged from the face *away* from the target and looped back across. Physically wrong.
- **The nice version isn't the default, and the owner's own machine gets `low`.** The GPU
  heuristic (`gpuTier.ts`) downgrades mobile / coarse-pointer / low-memory / conservative-
  Intel visitors to `low`; the owner needed `?tier=high` to see the projection at all.
  `HANDOFF.md` explicitly deferred this "do not silently loosen" call to sign-off.
- **The curtain reveal (ADR-007) has no visible affordance.** The only "this is
  interactive" cue is the `aria-label` (screen-reader only). A sighted user gets no hint
  that hovering/focusing a project's Safari window reveals its architecture diagram.
- **The cursor aberration reaches too little of the page.** It is the whole-screen
  `RefractionPass` warping everything in the WebGL layer; the only *content* in that layer
  is the kinetic twins (all headings + the Approach stat numbers). The owner wanted a few
  more tasteful display elements to react — without touching body copy.

## Decision

### 1. The prism reads as faint blue glass, not chrome; the core is visible
Retune the high-tier `MeshTransmissionMaterial` (`TheLens.tsx`): drop `envMapIntensity`
to near-zero (the metallic reflections are the primary defect), lower `roughness` and
`chromaticAberration`, and give it a faint brand-blue body (`attenuationColor` =
`#8fb3ff`, moderate `attenuationDistance`). Trim the kernel `pointLight`. Brighten the
wireframe data-core and render it after the glass so it reads through. The whole-screen
`RefractionPass` (ADR-006 §4) is **left unchanged** — the "shimmer" the owner disliked was
the prism material, not the pointer pass. Low/static tiers (`FauxGlassMaterial`) unchanged.

### 2. Beams refract like light through an actual prism (side-mirrored faces)
The particle streams (`DataStreams.tsx`) now enter one face and exit a **different** face
aimed at the target, on every card:
- The inflow source and the beam exit face **mirror with the damped `side`/`project`
  values** the prism already glides on. Packets enter the prism's outer face (the side away
  from the active window); the spectrum exits the inner face pointing *at* the window.
- Because the mirror is driven by the same damping as the prism's glide (2.5 / 2.0), a
  scroll from one card to the next sweeps the entry source, exit face, and prism position
  across together in **one continuous motion — no snap** (the explicit owner constraint:
  "buttery smooth, not chaotic").
- A **subtle refractive kink** at the exit face plus a small per-color angular spread sell
  the dispersion, kept small/damped so the flow stays a nice curve rather than a scatter.
- The hero fan, the Contact underline, and the static end-state are unaffected
  (`project ≈ 0` in those states).

### 3. High-by-default fidelity with a runtime FPS watchdog
`detectTier()` (`gpuTier.ts`) now returns **`high` by default** for any capable WebGL
context, replacing the static "mobile/weak → `low`" heuristic. Graceful degradation moves
from a *guess before load* to a *measurement after load*:
- A **runtime FPS watchdog** samples framerate for a few seconds after load (ignoring a
  ~1s warmup and tab-pause/compile outliers). If it can't sustain ~40fps, it **auto-drops
  to `low`** and shows a small popup — *watchdog-only* (fast machines never see it).
- The downgrade is **hot-swapped in place** (tier is React state threaded to the scene
  children — no page reload, no scroll jump). It is **session-only**: no persistence, so a
  later visit re-detects `high` and the watchdog re-evaluates. "Back to full" restores
  `high` and the watchdog does not re-fire.
- **Floors retained:** `prefers-reduced-motion → static`, no-WebGL → `none`, and a single
  pre-emptive `low` for software renderers (SwiftShader/llvmpipe), where a high-tier probe
  is itself painful. The `?tier=high|low|static` override still wins and suppresses the
  watchdog.

### 4. A discovery affordance for the curtain reveal
Project previews now *invite* the reveal (ADR-007 behavior unchanged): a subtle hint pill
("〰 Hover to reveal architecture") sits bottom-left inside the Safari viewport, and the
custom cursor shows a "Reveal" label over the preview. Both fade out as the curtain opens
and return on leave; under reduced-motion the pill is static (the reveal already snaps).
Keyboard focus opens the reveal as before, and the pill is decorative (`aria-hidden`) —
the `aria-label` remains the accessible announcement.

### 5. Extended cursor aberration (display elements only)
The kinetic-twin treatment extends to the small **mono eyebrow labels and the "01 / 05"
project counters** (wrapped in `KineticText`, kind `text`) — identical refract-in + cursor
warp as the titles, crisp DOM on lower tiers. The **Contact CTA buttons** gain a subtle DOM
RGB-split on hover/near-cursor (not a WebGL twin), kept light so the labels stay readable.
**Body copy, taglines, and capability chips stay crisp** (ADR-006 §2 — legibility/SEO).
Because these are new kinetic twins, the standing kinetic-twin baseline offset (`HANDOFF.md`
open bug 1) must be fixed in the same change so the small labels align.

## Alternatives Considered
- **Remove or tone down the `RefractionPass`** — rejected; the owner's complaint was the
  prism material specifically, so the pointer pass is kept as-is.
- **Replace transmission with a lightweight flat glass** — rejected; true refraction is
  what lets the scene (and the core) read *through* the prism. Retune instead.
- **Move only the beam exit face, keep inflow fixed upper-left** — rejected; on left-window
  cards that collapses entry and exit onto the *same* face (the reported defect). Both must
  mirror.
- **Fixed inflow source (calmest single flow)** — rejected in favour of the damped side-
  sweep, which is both physically coherent and snap-free.
- **Force `high` on every device with no fallback** / **keep the weak-hardware net** —
  rejected for the watchdog hybrid: `high` everywhere it can hold framerate, graceful only
  where it measurably can't.
- **Persist the downgrade across visits** — rejected; session-only, so a better network/
  device state re-evaluates. **Proactive first-load offer popup** — rejected as a nag;
  watchdog-only.
- **Reload to switch tiers** — rejected for in-place hot-swap (no flash/scroll jump).
- **Motion "peek" tease** / **icon-only hint** for the reveal — rejected for the persistent
  pill + cursor label (discoverable, least distracting).
- **Aberrate capability chips / body copy** — rejected on distraction and the ADR-006 §2
  crisp-DOM legibility principle.

## Consequences

### Positive
- The prism finally reads as the glass dispersion prism the metaphor promises, with the
  data-core visible and text legible in front of it.
- The projection beams are physically coherent on every card and cross buttery-smooth.
- The strongest work is served to the most people, with a *measured* safety net instead of
  a conservative guess — and the owner's own machine now gets the full experience.
- The curtain reveal is discoverable to sighted users, not just screen readers.
- The cursor aberration reaches more of the page's *display* texture without harming the
  readability that gets the owner hired.

### Negative
- The beam shader gains mirrored-face logic and a kink term (more uniforms/choreography);
  the fidelity path gains a per-frame FPS accumulator, a stateful tier, a hot-swap, and a
  popup component.
- **Reverses documented tier policy** (ADR-005 §3 / ADR-006 §8 "mobile/weak → low"): the
  `gpuTier.ts` header, `docs/design-system.md` tier table, and `README.md` must be
  reconciled or they lie.
- New kinetic twins **inherit the standing baseline-offset bug** (`HANDOFF.md` open bug 1),
  which must be fixed as a companion rather than deferred.
- Body copy remains outside the aberration by deliberate choice — the effect is *not*
  page-wide, unlike the reference site.
- Real-GPU feel of the material, damp rates, watchdog threshold, and split magnitudes is
  owner-verified (the agent runs no browser QA for this change).

## Related Decisions
- **ADR-001** (static export) — retained; new work stays in effects/frame loops; the popup
  is client DOM.
- **ADR-005** (tiered fidelity origin) — §3's static device-class heuristic is superseded by
  the runtime watchdog; its honest-numbers positioning is retained.
- **ADR-006** (The Lens) — §1 (prism material) and §4 (aberration reach) refined; §8's
  "graceful reduction by device class" becomes "high by default, measured downgrade"; the
  dispersion metaphor, act structure, and §7/§7a imagery/confidentiality rules retained.
- **ADR-007** (curtain reveal) — amended with a discovery affordance; the reveal mechanism,
  masking, and accessibility are unchanged.
- **ADR-008** (projection Work act) — §2's projector faces refined so entry ≠ exit; the
  prism-constant finale and Safari-frame previews are unchanged.

## References
- `/grill-with-docs` sessions 2026-07-10 and 2026-07-11 (this ADR is their decision record).
- Plan of record: `C:\Users\AravindKumar\.claude\plans\partitioned-tumbling-kurzweil.md`;
  slicing to be formalized in `docs/plans/` (to-issues).
- `HANDOFF.md` (ADR-008 implementation status; tuning pass #2 superseded here; open bug 1 folded in).
- ADR-001 / ADR-005 / ADR-006 / ADR-007 / ADR-008 (this repo).

# ADR-011: Lens legibility and inflow simplification — the backside transmission bake, a blue specular, anonymous packets

## Status
Accepted — **supersedes ADR-010 §4** (the tool-icon coin inflow is **retracted**; the
inflow returns to the anonymous data-packets of **ADR-006 §1**); **amends ADR-009 §1**
(its prism retune was *correct but ineffective* — it tuned a prop drei silently
overwrites during the backside pass; and its closing "Low/static tiers
(`FauxGlassMaterial`) unchanged" no longer holds). **Retains** ADR-006 §1 (the glass
dispersion identity and the anonymous inflow as originally specified), ADR-008 §2/§3,
and ADR-010 §1/§2/§3/§5.

## Date
2026-07-11

## Context

Owner ran **ADR-010 slice 6.2** — the first live-browser QA pass on the shipped high
tier. Two defects, one cosmetic and one that had been reported before:

- **The inflow is too busy.** The tool-icon coins (ADR-010 §4) "[don't] look right, too
  much going on and [are] distracting." The objection is categorical, not a density
  complaint.
- **The prism blows out to white, and any text in front of it is unreadable.**

The second is a **repeat**. ADR-009's own Context already recorded it —

> "light-colored headings ... lose legibility ... this is a **contrast** problem, not
> occlusion"

— and ADR-009 §1 decided the fix: *"drop `envMapIntensity` to near-zero (the metallic
reflections are the primary defect)."* That decision shipped. The symptom survived. The
reason is a library trap that ADR-009 did not know about:

**`TheLens.tsx` sets `backside` + `backsideThickness` but never passes
`backsideEnvMapIntensity`.** Drei's `MeshTransmissionMaterial` defaults it to **`1`**
(`MeshTransmissionMaterial.js:313`) and, every frame, does this
(`MeshTransmissionMaterial.js:341–375`):

1. turns tone mapping **off** (`NoToneMapping`, :348) — nothing clamps highlights;
2. flips the prism to `BackSide` and **overwrites `envMapIntensity` to
   `backsideEnvMapIntensity`** = `1`, i.e. **33× the authored `0.03`** (:359–360);
3. renders the scene into `fboMain` (:365) — baking unclamped, near-full-strength
   `Lightformer` reflections into the buffer;
4. restores `envMapIntensity = 0.03` (:370) for the final on-screen draw only.

The buffer we actually look **through** is therefore baked at full env intensity with
tone mapping disabled. The authored `envMapIntensity={0.03}` — the entirety of
ADR-009 §1's fix — is in practice **decorative**.

Two aggravating factors funnel through the same bake:

- **`specularColor` defaults to `#ffffff`.** The white in the blow-out is a three.js
  default, not a design choice. (Drei's `MeshTransmissionMaterialImpl` *extends*
  `THREE.MeshPhysicalMaterial` (:8) and feeds `material.specularColor` /
  `specularF90` straight into `EnvironmentBRDF` (:242), so the prop is live and
  tunable — including on the transmission path, where the Fresnel term `F` gates
  transmitted light via `(1.0 - F)`.)
- **The kernel `pointLight` (`TheLens.tsx:148`) has no `position`**, so it sits *inside*
  the prism at its centre. On the front pass it contributes almost nothing (normals face
  away). On the **backside** pass the normals flip inward and a point light at
  point-blank range hits near-mirror glass (`roughness={0.06}`) with that default white
  specular — a hot lobe, also baked unclamped.

Compounding all of it: `--color-ink` is `#f2f4f8`, itself near-white. Near-white text
over a white-hot prism is a near-zero-contrast collision, worst at the **Contact**
finale, where the rig deliberately centres the prism at `(0,0)` directly behind the CTA
heading and the background-less `outline` buttons.

## Decision

### 1. The inflow is anonymous again (retracts ADR-010 §4)
Remove the tool-coin procession **entirely**. The inflow returns to ADR-006 §1's dim,
anonymous data packets — raw, unlabelled input, which is what the metaphor always asked
for. Delete `src/lib/techIcons.ts` (single importer) along with the coin atlas, shaders,
slot machinery and now-dead `quadBez` helper in `DataStreams.tsx`.

Particle counts and the inflow bezier are **unchanged** — nothing is added to compensate
for the removal. *Less* is the point. The owner's real stack already ships as DOM copy
(project cards, capabilities), which is where it is legible and indexable; the coins
duplicated it in a medium that could not actually be read at 0.52 world units.

### 2. The prism stops blowing out — and this time the fix reaches the buffer you see
- **Pass `backsideEnvMapIntensity` explicitly**, matched to `envMapIntensity`, so
  ADR-009 §1's near-zero env reflections apply to the backside bake as well as the final
  draw. **This is the load-bearing line of this ADR.** It carries a comment saying so:
  without it, `envMapIntensity` does nothing that anyone can see.
- **Tint the specular.** Set `specularColor` to the brand blue (`ACCENT_BRIGHT`,
  `#8fb3ff`) and lower `specularIntensity`. Highlights resolve mid-blue instead of
  white, restoring contrast against near-white DOM text.
- **Keep the kernel `pointLight` at the prism's core** — trimmed, not exiled. Once the
  env reflections are gone it becomes the prism's *main remaining internal luminance*:
  the "faint blue glass lit from within" that ADR-009 §1 actually wanted. Removing it
  would trade the blow-out for a dark, formless prism against a `#050507` page. Its sin
  was rendering **white**, and §2's `specularColor` fixes that at the source.
- **Tone `FauxGlassMaterial`** (low/static): `envMapIntensity={1.7}` + `clearcoat={1}` +
  `clearcoatRoughness={0.06}` is the same defect by another route, on a tier the owner
  has not QA'd. ADR-009 §1's "Low/static tiers unchanged" is hereby **amended**.
- **The palette and the design tokens are untouched.**

### 3. Values land by owner calibration, not by agent guess
The magnitudes are an aesthetic judgement that only holds up on real hardware, and the
failure mode of *over*-correcting (a dead, invisible prism) is as bad as the defect
being fixed. Guessing costs QA round-trips with no causal attribution.

A **temporary** URL-param tuner (`src/lib/lensTuning.ts`, mirroring the `?tier=`
override already in `gpuTier.ts`) exposes the knobs — `?env=`, `?spec=`, `?light=`,
`?faux=` — for a single live sweep. The owner's chosen values are then **baked as the
hardcoded defaults and the tuner deleted in the same PR.** The scaffold must not ship.

## Alternatives Considered

- **Shift the colour palette** (the owner's own second option) — **rejected.** It treats
  the symptom, leaves the backside bake running at `1.0`, and would repaint the site's
  identity to dodge one unset prop. It is also more expensive than it looks: the Lens hex
  is *duplicated per-file* (`TheLens.tsx`, `LensScene.tsx`, `DataStreams.tsx`) rather
  than read from the `@theme` tokens, so a palette move is a four-file consistency
  problem, not a token edit.
- **Add a legibility scrim** behind text blocks, or constrain the rig so the prism never
  parks behind copy — **rejected for now.** ADR-006 §2 and ADR-009 both frame this
  explicitly as a *contrast* problem, not occlusion; a scrim is a compositing layer the
  design deliberately never had, and it would dull the "text floats in the light" look
  that the whole Lens exists to produce. Reconsider only if the root-cause fix proves
  insufficient at owner re-QA.
- **Move or remove the kernel `pointLight`** — **rejected.** See §2: post-fix it is
  load-bearing luminance, and its defect (white, not bright) is cured by `specularColor`.
- **Keep the coins, but at lower density / high tier only** — **rejected.** The owner's
  objection was to their *presence*, not their count.
- **Keep `techIcons.ts` around for future use** — **rejected.** It is now orphaned for
  the *second* time (ADR-010's own Consequences noted it had already been orphaned from
  an earlier "orbiting the hero portrait" use). Git history is the archive.

## Consequences

### Positive
- The legibility defect is fixed **at its cause**, in every act — including the Contact
  finale, where the prism sits centred behind the CTA by design.
- The drei backside trap is documented and explicitly guarded. A future reader who finds
  `backsideEnvMapIntensity={…}` sitting beside an identical `envMapIntensity={…}` will
  find the comment explaining why it is *not* redundant duplication — the exact
  "cleanup" that would silently reintroduce this bug.
- The inflow reads as ADR-006 §1 originally specified. `DataStreams.tsx` sheds the coin
  atlas, two shaders, the slot machinery and its canvas-2D dependency; `techIcons.ts`
  (102 lines) is deleted outright. No tests, lint rules or `lensState` plumbing depend on
  any of it.
- Design tokens and palette untouched — zero site-wide identity churn.

### Negative
- **ADR-010 §4 shipped and is retracted within a day**; the coin work (slices 4.1/4.2,
  commits `a85d8b4`, `f37ddb8`) is discarded. The ADR-010 *filename* still advertises
  "…-and-tool-inflow" — deliberately **not** renamed: ADRs are immutable records and
  three living docs link it. A status pointer atop ADR-010 redirects readers here.
- **The prism may land dimmer than it should.** Removing its dominant light source is a
  real over-correction risk; the tuner exists precisely to find the floor, but a further
  QA round is possible.
- **The tuner is throwaway code that must be actively deleted.** If it ships it is a
  harmless but sloppy public knob. Its removal is a gated slice, not a TODO.
- **`FauxGlassMaterial` has never been owner-QA'd on real low-tier hardware.** The
  `?tier=low` + `?faux=` sweep covers it — but only if the owner actually runs it.

## Related Decisions
- **ADR-006** — §1 inflow: the tool-coin extension is **withdrawn**; anonymous packets
  stand as originally decided. The §1 glass-dispersion prism identity is retained.
- **ADR-009** — §1 **amended**: the retune was right; the implementation missed drei's
  backside pass, so it never reached the visible buffer. Its "Low/static tiers
  (`FauxGlassMaterial`) unchanged" no longer holds.
- **ADR-010** — §4 **superseded (retracted)**. §1 (universal refraction), §2 (opt-in
  fidelity), §3 (projector assembly) and §5 (Tagging card) stand unchanged.

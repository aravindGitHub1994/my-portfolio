# Implementation Plan 0008 — Anonymous inflow, prism legibility, owner-calibrated brightness

> Source decision: **ADR-011**
> (`docs/decisions/ADR-011-lens-legibility-and-inflow-simplification.md`), which
> **supersedes ADR-010 §4** (tool-icon coin inflow → retracted, back to ADR-006 §1's
> anonymous packets) and **amends ADR-009 §1** (its prism retune tuned a prop drei
> overwrites during the backside pass, so it never reached the visible buffer; and its
> "Low/static tiers unchanged" no longer holds). Decisions were resolved branch-by-branch
> in a fourth `/grill-with-docs` session (2026-07-11).
>
> **Status — all AFK slices complete (2026-07-11): 1.1, 2.1, 2.1b, 2.3, 3.1.**
> The first 2.2 sweep found the blow-out immune to every knob, falsifying
> ADR-011 §2's *sufficiency*; the diagnosis and fix (owned bake + exclusions)
> are **ADR-011 Amendment A**, implemented as slice 2.1b. The re-run sweep
> landed the four values (env 0.4 · spec 0.5 · light 2.5 · faux 1.2), baked in
> 2.3 with the tuner deleted. **Awaiting 3.2 owner re-QA + sign-off**, then
> merge `ui-refinement` → `main`.

## Context / Why

Owner ran **ADR-010 slice 6.2** — the first live-browser QA of the shipped high tier —
and raised two defects:

1. **The tool-icon coins are distracting** and should go; the particles stay.
2. **The prism blows out to white and text in front of it is unreadable.**

Defect 2 is a *repeat* of a symptom ADR-009 already diagnosed correctly and "fixed."
The fix never took effect: `TheLens.tsx` passes `backside` but not
`backsideEnvMapIntensity`, which drei defaults to **`1`** and uses to overwrite
`envMapIntensity` while baking the transmission buffer with tone mapping **off**. The
authored `envMapIntensity={0.03}` only ever applied to the final front-facing draw — the
buffer we look *through* was always at full strength. See ADR-011 Context for the
line-by-line trace through `node_modules/@react-three/drei/core/MeshTransmissionMaterial.js`.

This plan excises the coins, fixes the bake at its cause, tints the white specular
(a three.js default, not a design choice) to brand blue, and lands the final magnitudes
via a **throwaway** URL-param tuner so the owner calibrates on real hardware in one
sitting instead of three guess-and-rebuild cycles.

**Constraints (unchanged):** static export (ADR-001); CSP `'self'`-only, assets
local/procedural; DOM/`window` access inside effects or client-only (`ssr:false`)
components — `LensRoot` is `ssr:false`, so `TheLens` never prerenders; React-compiler
purity (seeded `mulberry32`, no `Math.random` in render/memo, frame-time uniform writes
via material refs); design tokens in `globals.css` — **this plan does not touch the
palette**; **confidentiality** — no client names or figures anywhere (CLAUDE.md).

**QA note:** per standing owner preference the agent runs **no browser QA**. Every AFK
slice's gate is `npm run lint` + `npm run build` green plus code-level correctness. All
*visual* acceptance is owner-run, and this plan has **two** HITL slices — 2.2 is a
calibration sweep whose output (four numbers) is an **input** to slice 2.3, not a
sign-off.

## Slice overview

| # | Slice | Type | Blocked by |
|---|---|---|---|
| **P1** | **Anonymous inflow** (ADR-011 §1) | | |
| 1.1 | Excise the coin layer; delete `techIcons.ts` | AFK | — |
| **P2** | **Prism legibility** (ADR-011 §2/§3) | | |
| 2.1 | Backside bake + blue specular + FauxGlass tone, behind a temp tuner | AFK | — |
| 2.1b | Owned transmission bake + bake exclusions (ADR-011 Amendment A) | AFK | 2.1 |
| 2.2 | **Owner calibration sweep** → four numbers | **HITL** | 1.1, 2.1b |
| 2.3 | Bake the owner's values; **delete the tuner** | AFK | 2.2 |
| **P3** | **Docs + close-out** | | |
| 3.1 | Reconcile living docs + ADR-010 status pointer | AFK | 1.1, 2.3 |
| 3.2 | Owner re-QA + sign-off (all tiers) | **HITL** | 2.3, 3.1 |

---

## 1.1 — Excise the coin layer; delete `techIcons.ts`  · AFK

**Files:** `src/components/lens/DataStreams.tsx`, `src/lib/techIcons.ts` (delete),
`src/lib/prng.ts` (comment only).

Remove, in `DataStreams.tsx` (line refs against current `HEAD`):

| Piece | Lines |
|---|---|
| `import { TOOL_ICONS }` | 10 |
| Section banner + atlas constants | 193–202 |
| `buildCoinAtlas()` | 204–244 |
| `coinVertex` / `coinFragment` | 246–282 |
| `CoinSlot`, `buildCoinSlots`, `spawnCoin` | 284–335 |
| `quadBez` (**dead once coins go** — verified: used only at 725/731/732) | 337–341 |
| `coinSlots` tier branch | 354–356 |
| `coinGeo` / `coinMats` / refs / dispose + atlas effects | 484–543 |
| Coin block in `useFrame` (incl. the `acts.work` cooldown at 717 and local `inSide` at 687) | 680–744 |
| Coin `<mesh>` JSX | 775–787 |

**Must survive** (shared, verified): `makeSeeds` (343–348 — feeds `inflowGeo` :370 and
`beamGeo` :398), `mulberry32` import, the `animated` gate (:351) and both particle
`{animated && …}` blocks (749–774), the blade group, and all `lensState`/`acts` reads
other than :717.

Delete `src/lib/techIcons.ts` outright — sole importer is `DataStreams.tsx:10`; no tests,
no lint rules, no `lensState` plumbing reference it. Trim the "and the tool-coin inflow"
clause from `src/lib/prng.ts`'s docstring (the function itself stays — particles and the
ADR-010 §3 shard assembly still use it).

**Acceptance:** lint + build green; no `coin`/`TOOL_ICONS`/`techIcons` match anywhere
under `src/`; inflow packets, beams and blades unchanged on every tier.

---

## 2.1 — Backside bake + blue specular + FauxGlass tone, behind a temp tuner  · AFK

**Files:** `src/components/lens/TheLens.tsx`, `src/lib/lensTuning.ts` (**new,
temporary**).

**New `src/lib/lensTuning.ts`** — mirrors `detectTier()`'s `?tier=` override in
`gpuTier.ts` (same `URLSearchParams` read, same client-only guard). Exports a
`LENS_TUNING_DEFAULTS` object and a `readLensTuning()` that lets four URL params
override it:

| Param | Knob | Default (starting point, not final) |
|---|---|---|
| `?env=` | `backsideEnvMapIntensity` | `0.03` (match `envMapIntensity`) |
| `?spec=` | `specularIntensity` | `0.4` |
| `?light=` | kernel `pointLight` intensity | `1.6` |
| `?faux=` | `FauxGlassMaterial` `envMapIntensity` | `0.45` |

Parse defensively (`Number.parseFloat`, reject non-finite/negative → fall back). The file
header must state, unmissably, that it is **scaffolding deleted in slice 2.3**.

**`TheLens.tsx`:**
- Read tuning once via `useMemo(() => readLensTuning(), [])` — safe because `LensRoot` is
  `dynamic(…, { ssr: false })`, so this component never prerenders.
- `MeshTransmissionMaterial` (high tier): add **`backsideEnvMapIntensity`** — this is the
  fix; it gets a comment explaining that drei overwrites `envMapIntensity` with this
  value while baking the backside buffer with tone mapping off, so the two are *not*
  redundant and the pair must not be "cleaned up." Add `specularColor={ACCENT_BRIGHT}`
  and `specularIntensity` (drei's impl extends `MeshPhysicalMaterial` and feeds both into
  `EnvironmentBRDF`, so they are live).
- `pointLight` (:148): keep it at the core, drive `intensity` from the tuner. Do **not**
  add a `position` — ADR-011 §2 keeps it as the prism's internal luminance.
- `FauxGlassMaterial`: drive `envMapIntensity` from the tuner; drop `clearcoat` toward
  `~0.4` and raise `clearcoatRoughness` so the low tier stops mirroring the Lightformers.

**Acceptance:** lint + build green; no `window` access outside the memo; defaults render
without any URL param; each param demonstrably moves only its own knob.

---

## 2.1b — Owned transmission bake + bake exclusions  · AFK · added mid-plan

> Added after the first 2.2 sweep reported "no setting works — the reflection is
> always blown out", triggering this plan's falsification clause. Root cause and
> decision: **ADR-011 Amendment A** (scene content baked into the transmission
> buffer has no intensity knob; the twins and the additive stream convergence were
> the surviving white).

**Files:** `src/components/lens/bakeExclusions.tsx` (**new** — registry +
`<BakeExcluded>`), `src/components/lens/TheLens.tsx` (`HighGlass` owns the prism
mesh and the two-pass bake; `buffer` prop disables drei's), `DataStreams.tsx`
(registers its root), `LensScene.tsx` (wraps the kinetic layers).

**Acceptance:** lint + build green; the bake hides only registered objects and
restores their own visibility; drei's internal bake demonstrably skipped (`buffer`
passed); tuner knobs still live. **Done.**

---

## 2.2 — Owner calibration sweep  · **HITL**

`npm run dev` (port 3004). Sweep on real hardware and report **four numbers**.

- **High tier** (default): scroll Hero → Approach → Work → **Contact**. Contact is the
  hard case — the rig centres the prism at `(0,0)` directly behind the CTA heading and
  the background-less `outline` buttons.
  - Raise/lower `?env=` until reflections stop blowing out **without** the prism going
    dark and formless against the near-black page.
  - `?spec=` controls how hot the (now blue) highlight is; `?light=` controls how much
    the prism glows from within. These trade off — find the pair where the glass reads as
    *lit blue glass*, the wireframe data-core is visible through it, and `--color-ink`
    (`#f2f4f8`) text stays readable over every part of it.
  - Example: `localhost:3004/?env=0.03&spec=0.4&light=1.6`
- **Low tier:** `?tier=low&faux=…` — same judgement on `FauxGlassMaterial`.
- Confirm `?tier=static` and reduced-motion are unaffected.

**Output:** the four values. **These are an input to 2.3, not a sign-off.**

**If no value works** — i.e. every setting is either blown out or dead — that falsifies
ADR-011's root-cause claim, and the rejected "legibility scrim" alternative comes back on
the table. Say so rather than settling.

---

## 2.3 — Bake the owner's values; delete the tuner  · AFK · blocked by 2.2

Hardcode the four numbers from 2.2 into `TheLens.tsx` as literals. **Delete
`src/lib/lensTuning.ts` and every import/memo of it.** The `backsideEnvMapIntensity`
comment stays — it is the load-bearing part.

**Acceptance:** lint + build green; `grep -r lensTuning src/` returns nothing; the
rendered result at default URL is identical to the owner's chosen tuner URL.

---

## 3.1 — Reconcile living docs + ADR-010 status pointer  · AFK

- **`AGENTS.md`** — delete the `techIcons.ts` bullet (lines 24–27) outright; it documents
  a deleted file.
- **`docs/design-system.md`** — remove the `| Tool coins (ADR-010 §4) | 4 | 2 | none |`
  row from the fidelity table (~:156); drop `techIcons.ts` from the content-files list
  (~:220).
- **`docs/decisions/ADR-010-…-and-tool-inflow.md`** — add a status pointer atop:
  *"§4 (tool-icon inflow) was **retracted** by ADR-011; the filename is retained because
  ADRs are immutable records. §1/§2/§3/§5 stand."* **Do not rename the file** — three
  living docs link it.
- **`CLAUDE.md`** — add ADR-011 to the amendment chain in the Lens paragraph.
- **`README.md`** — add ADR-011 to the decisions list.
- **`HANDOFF.md`** — rewrite for this round (supersedes the plan-0007 handoff).
- Historical plans (`0001`, `0003`) and `specs/portfolio_revamp_contract.md` mention
  `techIcons`/`TECH_ICONS` — **leave them.** They are closed records, already stale, and
  editing them would falsify history.

**Acceptance:** no living doc describes coins as shipped; `techIcons.ts` appears in no
current doc; lint + build green.

---

## 3.2 — Owner re-QA + sign-off  · **HITL**

- [ ] **High:** no white blow-out anywhere; text readable over the prism in *every* act,
      especially Contact; prism still reads as lit blue glass, data-core visible; beams
      and packets unchanged; no coins.
- [ ] **Low** (`?tier=low`): faux glass no longer mirrors the Lightformers; text readable.
- [ ] **Static** (`?tier=static`) / reduced-motion: crisp, no motion, no console errors.
- [ ] No `?env=`/`?spec=`/`?light=`/`?faux=` param has any effect (tuner is gone).
- [ ] ADR-010 §1/§2/§3/§5 features still behave (twins, opt-in prompt, shard assembly,
      Tagging card).

**Then:** merge `ui-refinement` → `main`.

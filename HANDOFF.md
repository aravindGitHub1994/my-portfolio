# HANDOFF — Win98 Workstation redesign (2026-07-18, session 3)

> For the next agent session. P0–P2 AFK slices are committed and gates
> 1.2 PASSED. **Gate 2.3 (owner QA of `?scene=full`) is IN PROGRESS with a
> defect list** — fix the defects below, then return to the owner for the
> rest of the §2.3 checklist. Read the two Key References before writing
> anything.

## Current Status

- Branch **`redesign-attempt2`** (off `main` @ `7969e26`). Commit ledger:
  - `9ea8f96` docs (ADR-012 + plan-0009) · `064a225` slice 0.1 (Lens
    deleted, static floor) · `6d31dac` slice 0.2 (experience scaffold,
    `experienceState`, lenis/snap choreography).
  - `cc494e7`→`2d1293f` slice 1.1 + gate-1.2 iterations (procedural
    character; final form: sculpted jaw-wrap beard, two-tone clay, no
    cheek mounds). **Gate 1.2 PASSED** (owner, 2026-07-18).
  - `f25e047` slice 2.1: `builders/` — 14 seeded prop modules +
    canvas-baked `materials.ts` (≤1024², no Microsoft marks — poster/mug/
    CD text is pastiche; CD spines pull resume `EDUCATION`) +
    `RoomScene.tsx` (`?scene=room`; the prop layout constants live there;
    cables are world-anchored to that layout).
  - `6da2bca` slice 2.2: `scene/` — `Lighting.tsx` (CRT key light driven
    per frame from the `screenLight` singleton — the **2.2⇄3.1 contract**),
    `Atmosphere.tsx` (dust + shaft billboards), `postprocessing.tsx`
    (bloom threshold 0.68 + vignette), `sheddable.ts` (SHED_ORDER for
    7.2). RoomScene runs a `ScreenTestPattern` stand-in cycling
    boot-white flicker → desktop teal → BSOD blue → shutdown amber (10 s).
  - `8340430` slice 1.3: palette color zones (skin canvas albedo, tee,
    jeans, sneakers), tattoo vector art on `forearmR` (koi verified red),
    smartwatch, gold hoops, typing rig (`typingState` feeds 6.2).
  - `81c52a2` gate-2.3 prep: `?scene=full` (RoomScene + Figure), chair
    raised to the seated pose.
- Conventions: figure faces **-Z**, desk/screen at negative Z, figure's
  left = -X; desk surface `DESK_TOP_Y` 0.72; head pivots at `NECK_PIVOT`;
  right-arm joints exported as `ARM_JOINTS` (buildBody).
- `assets-src/` stays **untracked deliberately** (tattoo photos never
  enter git or the bundle — ADR-012 §3).
- Owner runs a **headed agent-browser session** on the harness and has
  explicitly offered browser QA — drive verification through it. A reload
  resets their orbit camera; warn them before reloading.

## Unresolved Threads

- **GATE 2.3 DEFECTS (owner QA 2026-07-18, screenshot
  `assets-src/workstation/QA.png`):**
  1. **Fingers submerge into the keyboard** — they animate (typing rig
     works, keep it) but sit below the keycap tops, invisible. Reposition:
     hands/fingers need to ride ~10–15 mm higher, or the keyboard slab
     placed so keycap tops sit under the fingertips (`ARM_JOINTS.wrist` y
     0.75 vs keycap tops ≈ 0.75 + tilt — currently interpenetrating).
     Verify from the owner's QA angle (behind-right, orbit low).
  2. **Boot white flicker far too bright** — the whole screen face +
     bloom halo blows out (see QA.png). The cycle itself is approved
     (owner read it as teal → amber → white flicker and is fine with the
     pattern). Tame the peak: cap boot luminance (~0.7), lower the
     emissive ceiling in `ScreenTestPattern` (currently 0.4 + lum·1.6 →
     2.0), and/or raise the CAST_SCALE clamp in `Lighting.tsx`. A boot
     flash should read as a flash, not a floodlight.
  3. **Chest protrudes too much / too rounded**
     (`assets-src/workstation/QA-chest-reshape.png` — owner drew the
     desired front line in red: much flatter from collar to lap). The
     torso is a LatheGeometry, so its cross-section is circular — depth
     equals width, which is why the chest balloons in profile. Fix:
     scale the torso/chest group z (front-back) to ~0.85, and/or trim
     the chest-row radii in the lathe profile (`buildBody.ts` rows
     y 0.34/0.42, radii 0.168/0.178). Match the red line in profile from
     the owner's QA angle; keep the shoulder width.
  4. **Gap between mustache and beard; mustache sticks out**
     (`assets-src/workstation/QA-beard-moustache-gap.png`, red circle).
     The beard's face-window tuck leaves bare skin between the mustache's
     lower edge and the beard's visible front boundary, and the mustache
     bar reads proud of the face. Owner accepts either fix — pull the
     mustache in, or raise the beard's front coverage to meet it —
     whichever looks right; likely both: in `buildBeard.ts` shift the
     tuck's `high` ramp so beard shows up to just under the mustache
     (`(dirY + 0.62)/0.18` → start nearer -0.5), and pull the mustache
     back a touch (z -0.108 → ≈ -0.104, or reduce its depth). Verify in
     profile AND three-quarter — the gap reads worst at the owner's
     angle (left three-quarter, slightly below).
- Self-noted nits (owner has NOT flagged these — mention, don't gold-plate):
  shaft billboard reads as a pale streak edge-on against the window;
  chair backrest is plain boxes.
- After defects fixed: owner completes the plan §2.3 checklist
  (dusk mood, figure/room separation, idle+typing read) → then P3
  (screen content: 3.1 targets the `crtScreen` mesh + writes
  `screenLight` for real, replacing `ScreenTestPattern`).
- `src/lib/aboutMe.ts` copy (slice 5.2) needs owner review at gate 9.2.

## Key References

- **ADR:** `docs/decisions/ADR-012-win98-workstation-cinematic-redesign.md`
  — all ten locked decisions; do not re-litigate.
- **Plan:** `docs/plans/implementation-plan-0009.md` — 24 slices, HITL
  gates 1.2 ✅ / 2.3 (in progress) / 4.3 / 9.2. AFK gate is always lint +
  build green.
- **Owner QA screenshots** (untracked — never commit assets-src):
  `assets-src/workstation/QA.png` (flicker blow-out, fingers),
  `QA-chest-reshape.png` (red line = target torso profile),
  `QA-beard-moustache-gap.png` (red circle = mustache/beard gap).
- **Reference assets:** `assets-src/workstation/` (3 concept sheets —
  their "model stats" panels are fictional; `tattoo01–04.jpg` — never
  ship; `prompt-redesign.txt`).
- **Standing rules:** root `CLAUDE.md` / `AGENTS.md` (confidentiality,
  static export, React-compiler purity, port 3004). Agent memory:
  `noise-signal-redesign-state.md`, `owner-motif-privacy.md`,
  `client-name-leak-accepted.md`, `windows-shell-gotchas.md`.

## Recommended Next Steps

- [ ] Fix gate-2.3 defect 1: finger/keyboard interpenetration (verify in
      the headed browser from the owner's angle before committing).
- [ ] Fix gate-2.3 defect 2: boot-flicker brightness (cap luminance +
      emissive ceiling; check both `?scene=room` and `?scene=full`).
- [ ] Fix gate-2.3 defect 3: flatten the torso front (match the red line
      in QA-chest-reshape.png; z-scale and/or lathe profile).
- [ ] Fix gate-2.3 defect 4: close the mustache↔beard gap (tuck ramp
      and/or mustache pull-in; owner is flexible on which).
- [ ] Lint + build → commit → hand back to the owner to finish the §2.3
      checklist. **Do not pass the gate autonomously.**
- [ ] After 2.3 passes: slice 3.1 (CRT screen content — targets the
      `crtScreen` material slot, writes `screenLight`, replaces
      `ScreenTestPattern`).

## Recommended Skills

- `agent-browser` — owner keeps a headed session open and has offered it;
  use it for all visual verification.
- None otherwise (plain implementation; the plan is the spec).
- `/grill-with-docs` — only for a genuine decision gap not covered by
  ADR-012 (expected: none before P4).

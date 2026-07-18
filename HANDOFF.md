# HANDOFF — Win98 Workstation redesign (2026-07-18, session 4)

> For the next agent session. P0–P2 AFK slices are committed and gate
> 1.2 PASSED. **All four gate-2.3 defects are FIXED and owner-verified
> in the headed browser (2026-07-18, session 4)** — the owner still has
> to run the rest of the plan §2.3 checklist (dusk mood, figure/room
> separation, idle+typing read). Do not pass the gate autonomously.
> Read the two Key References before writing anything.

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

- **GATE 2.3 DEFECTS — all four FIXED, owner-verified in the headed
  browser (2026-07-18, session 4):**
  1. Fingers/keyboard: `ARM_JOINTS.wrist` raised+retracted to
     (0.12, 0.79, -0.365); palm hover + finger droop shortened so
     fingertips rest ON the keycap tops (world y ≈ 0.753–0.756) and the
     tap dip reads as a key press. Typing rig untouched.
  2. Boot flicker: boot luminance capped at 0.7 (`0.15 + 0.55·flicker`),
     emissive ceiling lowered to `0.35 + lum·1.2`, and `CAST_MAX 2.6`
     clamp added in `Lighting.tsx`. Verified in `?scene=full` (high
     tier, owner) and `?scene=room` (low tier, isolated headless
     session). Teal/BSOD/amber kept their approved read.
  3. Torso: `chest.scale.z = 0.7` (0.85 was still too round at owner
     QA), chest rows trimmed to 0.162/0.168, shoulder→neck taper spread
     over 6 rows (the old 3-row drop read as a phantom shirt collar),
     and the lathe's +Z back vertices soft-clamped (`BACK_Z 0.09`,
     factor 0.25) to kill the back hump. Owner approved in profile.
  4. Mustache/beard: beard tuck `high` ramp starts at dirY -0.5 (was
     -0.62) so the beard reaches the mustache; mustache pulled to
     z -0.102, depth 0.044 (front face now at the nose tip). Owner:
     "looks good".
- Self-noted nits (owner has NOT flagged these — mention, don't gold-plate):
  shaft billboard reads as a pale streak edge-on against the window;
  chair backrest is plain boxes.
- NEXT: owner completes the plan §2.3 checklist
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

- [ ] Owner finishes the plan §2.3 checklist (dusk mood, figure/room
      separation, idle+typing read). **Do not pass the gate
      autonomously.**
- [ ] After 2.3 passes: slice 3.1 (CRT screen content — targets the
      `crtScreen` material slot, writes `screenLight`, replaces
      `ScreenTestPattern`; `Lighting.tsx` CAST_MAX clamp + the
      ScreenTestPattern emissive formula are the brightness contract to
      preserve).

## Recommended Skills

- `agent-browser` — owner keeps a headed session open and has offered it;
  use it for all visual verification.
- None otherwise (plain implementation; the plan is the spec).
- `/grill-with-docs` — only for a genuine decision gap not covered by
  ADR-012 (expected: none before P4).

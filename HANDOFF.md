# HANDOFF — Win98 Workstation redesign (2026-07-18, session 2)

> For the next agent session. P0 and slice 1.1 (character prototype) are
> committed; AFK gate (lint + build) verified green 2026-07-18. **Stopped at
> HITL gate 1.2** — owner QA required before any further character work.
> Read the two Key References before writing anything.

## Current Status

- Branch **`redesign-attempt2`** (off `main` @ `7969e26`). Committed this far:
  - `9ea8f96` — ADR-012 + plan-0009 + handoff (docs locked, owner-approved).
  - `064a225` — **slice 0.1**: Lens deleted wholesale (+ Lens-gated
    `ui/Loader.tsx`); homepage is the static floor from `src/lib` content,
    incl. a new Skills section (`SKILL_TIERS` was previously unrendered) and
    a `#skills` nav anchor. Export verified: semantic headings, zero
    `<canvas>`, diagrams/screens/resume.pdf intact.
  - `6d31dac` — **slice 0.2**: experience scaffold. `WorkstationRoot`
    (thin ssr:false wrapper) → `WorkstationExperience` (tier routing via
    lazy `useState(detectTier)` — the LensRoot pattern; static/none/
    reduced-motion return null and keep the floor) → `WorkstationCanvas`
    (stub dolly journey) + `choreography/Choreography` (one ScrollTrigger
    writes `experienceState`; soft snap via **`lenis/snap`**, not
    ScrollTrigger snap, which fights Lenis's raf) + `src/lib/chapters.ts`
    (spans are placeholders until 4.1) + `src/lib/experienceState.ts`
    (mutable singleton, lensState pattern). Floor hides via
    `html[data-experience]` CSS when the experience mounts; prerender always
    ships the floor.
- **Slice 1.1 committed** (same commit as this handoff update):
  `src/components/workstation/character/` — `buildBody.ts` (capsule/lathe
  seated pose, named `chest`/`forearmR` nodes), `buildHead.ts` (brow/nose/
  cheek planes, eyelid blink plane, ears, earbuds, hoop earrings both ears),
  `buildHair.ts` (scalp cap + 3 instanced tube-curl archetypes, seeded
  scatter, faded sides), `buildBeard.ts` (displaced lower-sphere shell +
  mustache), `idle.ts` (breathing/blink/sway driver, zero per-frame
  allocation), `Figure.tsx` (assembly, clay material, dispose, tri-count
  console log), `CharacterScene.tsx` (harness scene: stool proxy, dusk
  preview lights, chapter-2 camera preset) + `WorkstationCanvas.tsx` edit
  (harness registry: `?scene=stub|character`).
- AFK gate for 1.1 verified 2026-07-18: `npm run lint` clean,
  `npm run build` static export green.
- Coordinate conventions (concept sheets, `assets-src/workstation/`): figure
  faces **-Z** (screen/desk at negative Z), so the figure's left = **-X**. Head group pivots at `NECK_PIVOT` (buildBody export);
  skull local frame in `buildHead` (`SKULL_CENTER`/`SKULL_RADIUS`).
- Poly budget: estimated ~51 k tris at high detail (target < 60 k, plan
  §1.1); `Figure.tsx` logs the actual count in the harness console — record
  it in the slice notes at gate 1.2.
- `assets-src/` stays **untracked deliberately** (tattoo photos never enter
  git or the bundle — ADR-012 §3).
- Session style note: owner enabled `/caveman` (terse chat) mid-session —
  conversation-scoped, not a repo convention.

## Unresolved Threads

- **Gate 1.2 iteration 1** (owner defects 2026-07-18): earrings both ears,
  nose x-tilt flipped (+0.22, tip out), beard enlarged past skull radius.
- **Gate 1.2 iteration 2 — FINAL round** (owner: "face malformed, caved-in
  sections; round face + heavy beard"): beard noise made outward-only with
  a top-edge taper (signed noise was digging pits below the skull surface),
  skull rounded 0.94/1.06 → 0.98/1.02 with ears/buds/stems/earrings shifted
  +4 mm and hair-cap x widened to match. **If this round fails, the
  falsification clause fires: reopen ADR-012 stylization alternatives —
  do not keep polishing.**
- **Iteration 2 follow-up, verified in-browser** (owner offered
  `agent-browser`; QA screenshots in the session scratchpad): the beard
  shell was a full-azimuth dome forming a second face that swallowed the
  nose/mustache — now sculpted radially (face window tucks below the skin,
  chin/jaw keep full radius + chin boost). Scalp cap shortened above the
  brow (its sub-equator rim ringed the face as a dark visor). Cheek mounds
  shrunk/lowered (read as eyeballs at full size). Hair + beard now use a
  darker clay material (two-tone clay, still not the 1.3 color pass) —
  monochrome could not carry the beard read. Chapter-2 frame verified:
  curls/beard/earring/nose all read at mid-shot.
- **HITL gate 1.2 — do not pass autonomously.** Owner QA:
  `npm run dev` → `localhost:3004/?scene=character` (checklist in plan
  §1.2: silhouette, no uncanny read, curls at mid-shot, earring/earbuds in
  profile; default camera IS the chapter-2 frame). **Falsification clause:**
  two failed iterations → reopen ADR-012 stylization alternatives, don't
  polish toward the uncanny valley.
- After 1.2 passes: 1.3 (color/wardrobe/tattoos/typing) and/or 2.1
  (props + room — blocked only by 0.2, so it can run before/parallel).
- `src/lib/aboutMe.ts` copy (slice 5.2) needs owner review at gate 9.2.

## Key References

- **ADR:** `docs/decisions/ADR-012-win98-workstation-cinematic-redesign.md`
  — all ten locked decisions; do not re-litigate.
- **Plan:** `docs/plans/implementation-plan-0009.md` — 24 slices, 4 HITL
  gates (1.2, 2.3, 4.3, 9.2); per-slice files + acceptance criteria. AFK
  gate is always lint + build green; **no agent browser QA** unless the
  owner offers `agent-browser`.
- **Reference assets:** `assets-src/workstation/` (3 concept sheets — their
  "model stats" panels are fictional; `tattoo01–04.jpg` — never ship;
  `prompt-redesign.txt`).
- **Standing rules:** root `CLAUDE.md` / `AGENTS.md` (confidentiality, static
  export, React-compiler purity, port 3004). Agent memory:
  `noise-signal-redesign-state.md`, `owner-motif-privacy.md`,
  `client-name-leak-accepted.md`, `windows-shell-gotchas.md`.

## Recommended Next Steps

- [x] `npm run lint` + `npm run build` → commit slice 1.1 on
      `redesign-attempt2`. (Done 2026-07-18.)
- [ ] **Stop at HITL gate 1.2** — owner runs the `?scene=character` harness
      and approves or files a defect list (then iterate 1.1, max two rounds
      per the falsification clause).
- [ ] After 1.2: slice 1.3 (tattoos as painted canvas ops — photos stay in
      `assets-src/`) and/or slice 2.1 (procedural props + room).

## Recommended Skills

- None required for 1.3/2.1 (plain implementation; the plan is the spec).
- `agent-browser` — only if the owner offers it or reports a visual bug.
- `/grill-with-docs` — only for a genuine decision gap not covered by
  ADR-012 (expected: none before P4).

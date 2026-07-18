# HANDOFF — Win98 Workstation redesign (2026-07-18)

> For the next agent session. Documentation is committed and **slice 0.1 has
> landed** — the Lens is deleted and the homepage is the static floor. Read
> the two Key References before writing anything.

## Current Status

- Branch **`redesign-attempt2`** (off `main` @ `7969e26`). Docs committed at
  `9ea8f96`; slice 0.1 committed on top with owner go-ahead (2026-07-18,
  "start the first slice"). The prior `complete-redesign` branch (NOISE/SIGNAL)
  was **deleted local+remote** with 18 unpushed commits at the owner's request —
  its old ADR-012/plan-0009 numbers were reused cleanly here.
- Full `/grill-with-docs` interview (10 questions) ran 2026-07-18; every
  decision is locked and recorded in ADR-012 — do **not** re-litigate them.
- **Slice 0.1 done:** `src/components/lens/` and the Lens-gated
  `ui/Loader.tsx` deleted; the page is plain-DOM sections composed from
  `src/lib` — hero, approach stats, pinned project cards (curtain reveal +
  diagram draw-on kept; projection/shard tie-ins removed), a **new Skills
  section** rendering `SKILL_TIERS` (previously unrendered anywhere),
  trajectory, contact. Lint + build green; export carries zero `<canvas>`.
- `assets-src/` is **untracked deliberately** — reference material only; the
  tattoo photos must never be committed or shipped (ADR-012 §3).

## Unresolved Threads

- **Slice 0.2 not started** (experience scaffold: `ssr:false` canvas,
  Lenis+GSAP scrub skeleton, `chapters.ts`, tier routing, `?scene=` harness) —
  next up; the owner scoped this session to the first slice, so get go-ahead.
- `src/lib/aboutMe.ts` copy (slice 5.2) needs owner review at gate 9.2 — flagged
  in the plan, nothing to do yet.

## Key References

- **ADR:** `docs/decisions/ADR-012-win98-workstation-cinematic-redesign.md` —
  concept, all 10 locked decisions (§1–§10), architecture, alternatives, risks.
  Supersedes ADR-005…011 as experience layer; retains ADR-001/002 + content
  model + confidentiality/imagery rules + new zero-Microsoft-assets IP rule (§10).
- **Plan:** `docs/plans/implementation-plan-0009.md` — 9 milestones / 24 slices /
  4 HITL gates (1.2 character likeness w/ falsification clause, 2.3 scene, 4.3
  ride-through, 9.2 final). Per-slice files + acceptance criteria. AFK gate is
  always `npm run lint` + `npm run build` green; **no agent browser QA** unless
  the owner offers the `agent-browser` skill.
- **Reference assets:** `assets-src/workstation/` (3 concept sheets — their
  "model stats" panels are fictional; `tattoo01–04.jpg` — **never ship the
  photos**, painted canvas approximations only; `prompt-redesign.txt` — original
  brief, its Phase-1/2 requirements are now satisfied by the two docs above).
- **Standing rules:** root `CLAUDE.md` / `AGENTS.md` (confidentiality — no
  client names/figures anywhere incl. jokes; static export; React-compiler
  purity; port 3004). Agent memory: `noise-signal-redesign-state.md` (current),
  `owner-motif-privacy.md`, `client-name-leak-accepted.md`,
  `windows-shell-gotchas.md` (commit via `-F` file on this Windows shell).

## Recommended Next Steps

- [x] Docs committed (`9ea8f96`); slice 0.1 landed — Lens gone, homepage is
      the static floor (plan §0.1 acceptance verified).
- [ ] Slice 0.2 — experience scaffold (`ssr:false` canvas, Lenis+GSAP scrub
      skeleton, `chapters.ts`, tier routing, `?scene=` harness).
- [ ] Then P1: character prototype (1.1) → **stop at HITL gate 1.2** for owner
      QA. Do not proceed past any HITL gate autonomously.

## Recommended Skills

- None required for 0.1–1.1 (plain implementation; plan is the spec).
- `agent-browser` — only if the owner offers it or reports a visual bug.
- `/grill-with-docs` — only if a slice surfaces a genuine decision gap not
  covered by ADR-012 (expected: none before P4).

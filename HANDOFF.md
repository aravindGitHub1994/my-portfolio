# HANDOFF — Win98 Workstation redesign (2026-07-18)

> For the next agent session. Documentation phase is **complete and
> owner-approved**; zero implementation code exists yet. Read the two Key
> References before writing anything.

## Current Status

- Branch **`redesign-attempt2`** (off `main` @ `7969e26`), clean tree except the
  two new docs + this file. The prior `complete-redesign` branch (NOISE/SIGNAL)
  was **deleted local+remote** with 18 unpushed commits at the owner's request —
  its old ADR-012/plan-0009 numbers were reused cleanly here.
- Full `/grill-with-docs` interview (10 questions) ran 2026-07-18; every
  decision is locked and recorded in ADR-012 — do **not** re-litigate them.
- ADR-012 + implementation-plan-0009 written; the owner approved the slice
  breakdown verbatim.
- **The docs are not yet committed.** The owner was offered (a) commit the docs,
  (b) start slice 0.1 — and instead requested this handoff. Get explicit
  go-ahead before committing or coding.

## Unresolved Threads

- **Commit of ADR-012 + plan-0009 + HANDOFF.md** — pending owner word.
- **Slice 0.1 not started** (Lens removal + static floor; the site must never be
  broken mid-build — 0.1 is deliberately first).
- `src/lib/aboutMe.ts` copy (slice 5.2) needs owner review at gate 9.2 — flagged
  in the plan, nothing to do yet.
- Old working-tree edits to `src/components/story/*` from the deleted branch are
  gone (discarded with the checkout) — nothing to recover.

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

- [ ] Confirm with owner, then commit ADR-012 + plan-0009 + HANDOFF.md on
      `redesign-attempt2` (use `git commit -F <file>` per shell gotchas memory).
- [ ] Slice 0.1 — delete `src/components/lens/`, homepage becomes the static
      floor from `src/lib/*.ts` content (plan §0.1 acceptance criteria).
- [ ] Slice 0.2 — experience scaffold (`ssr:false` canvas, Lenis+GSAP scrub
      skeleton, `chapters.ts`, tier routing, `?scene=` harness).
- [ ] Then P1: character prototype (1.1) → **stop at HITL gate 1.2** for owner
      QA. Do not proceed past any HITL gate autonomously.

## Recommended Skills

- None required for 0.1–1.1 (plain implementation; plan is the spec).
- `agent-browser` — only if the owner offers it or reports a visual bug.
- `/grill-with-docs` — only if a slice surfaces a genuine decision gap not
  covered by ADR-012 (expected: none before P4).

# HANDOFF — `scene-refinement` (2026-07-30, session 23)

**This file used to be 1,700 lines of session-by-session narrative. It was
trimmed at the owner's request once the branch ran out of build work.** Git
history holds the narrative (`git log`, and `git show 3aaf42b:HANDOFF.md` for
the last full version); the parts of it that were not written down anywhere else
moved to `docs/qa/headless-qa-notes.md`. Everything below is current state.

**Older documents cite sections of this file that no longer exist** — ADR-009
and plan-0006/0008 cite a "tuning pass #2" and an "open bug 1" from the retired
Lens layer, and `docs/qa/9.2-desktop-checklist.md` §17d and plan-0010 §506 cite
"Unresolved Threads". Those are records of what was true when they were written;
the live successor of "Unresolved Threads" is **§8 and §9 of the gate 10.1
checklist**. Follow those, and don't restore the old file to satisfy a citation.

## Where the branch is

**All build work is done.** Plan-0010's eight packages (P1–P8) are complete and
ADR-013 is fully built. `main` carries ADR-012; this branch has not merged yet.

**The one open item is not code: it is the owner running
`docs/qa/10.1-scene-refinement-checklist.md`** on a production static export, on
their own hardware. That document is the live worklist — read it before anything
else, in this order:

- **§0a** — the three fixes from the owner's first pass (session 23: the POST was
  inaudible, the keyboard was a machine gun, and the dock would not release when
  entered while scrolling backwards). Each names the boxes it re-opened, so §0a
  is also what is left to re-check.
- **§0** — what slice 8.1 already proved offline, so it is not re-done.
- **§8** — the honest ledger of what this branch does *not* close, carried
  forward from gate 9.2. The audio mix leads it and is still the largest
  untested surface on the site, even after §0a.1: three cue levels were
  corrected against measurements, and nobody has heard the rest.
- **§9** — things deliberately left alone. Say so if you disagree; don't
  silently "fix" them.

Gates already owner-PASSED on this branch: **1.3, 2.4, 3.3, 6.2**. Their records
are in `docs/qa/`, and gate 3.3 §4 in particular settled a set of numbers in the
opening — **four of its five answers were "leave it"**, so they are chosen
values, not placeholders.

## Standing rules, in precedence order

1. Root `CLAUDE.md` / `AGENTS.md` — the architecture contracts (one store two
   renderers, choreography owns scroll, the arm rig's four pivots, props are
   driven never re-parented, the ten-rung shed ladder, zero Microsoft IP, and
   the confidentiality rule).
2. **A gate record outranks an ADR on what actually ships.**
   `docs/qa/6.2-picture-review.md` is the authority on the picture set — it cut
   the set from 29 photographs to 23, and ADR-013's "all 29 ship" is dead. Do
   not restore them on the ADR's authority.
3. `docs/decisions/ADR-013-…md` — ten decisions made with the owner. Amendments
   so far: **§2a**, **§3a**, **§10a**. Don't re-litigate the rest.
4. `docs/plans/implementation-plan-0010.md` — 25 slices, owner-approved as
   written. The AFK gate is always lint + build green.

## Working here

- `docs/qa/headless-qa-notes.md` — how to verify this scene without eyes: the
  simulation patterns, and the QA gotchas that each produced a wrong answer
  first. **Read it before writing a probe**; two of its entries would have
  saved a session on their own.
- Agent memory worth having loaded: `noise-signal-redesign-state.md`,
  `owner-motif-privacy.md`, `client-name-leak-accepted.md`,
  `windows-shell-gotchas.md`.
- Committer identity resolves to the owner's work email. Raised twice,
  **left deliberately** — don't raise it a third time.

# HANDOFF — post-grilling, pre-`opening-and-fit` (2026-07-30, session 25)

**This file is a pointer, not a narrative.** It was trimmed at the owner's request at
session 23 and is kept short deliberately. Git history holds the story (`git log`, and
`git show 3aaf42b:HANDOFF.md` for the last full version); the parts not written down
elsewhere live in `docs/qa/headless-qa-notes.md`.

**Older documents cite sections of this file that no longer exist** — ADR-009 and
plan-0006/0008 cite a "tuning pass #2" and an "open bug 1" from the retired Lens layer;
`docs/qa/9.2-desktop-checklist.md` §17d and plan-0010 §506 cite "Unresolved Threads".
Those record what was true when written. Don't restore the old file to satisfy a
citation.

## Where things are

**`main` carries ADR-012 + ADR-013.** Plan-0010's eight packages are complete, gate
10.1 PASSED on the owner's second run and merged, and `ladder-pacing` (the 30 s offer
deadline) merged after it. **There is no open branch and no uncommitted code.**

Gates owner-PASSED across ADR-013: **1.3, 2.4, 3.3, 6.2, 10.1**. Records are in
`docs/qa/`. Gate 3.3 §4 settled a set of numbers in the opening — **four of its five
answers were "leave it"**, so those are chosen values, not placeholders. Gate 10.1's
record is closed: read it for context, not as a worklist.

## The next branch

**`opening-and-fit`, not yet cut.** Two documents were written this session and
nothing was implemented:

- **[ADR-014](docs/decisions/ADR-014-chapter-zero-recomposition-and-viewport-adaptation.md)**
  — nine decisions from a grilling session with the owner. It amends ADR-013 §2/§2a
  (chapter 0's framing), §3a (the skip's copy and "nothing over the boot") and §7 (the
  ladder's length); ADR-012 §5; and plan-0009 §4.1 (the title beats).
- **[plan-0011](docs/plans/implementation-plan-0011.md)** — 17 slices in seven
  packages, with the dependency graph and the risks. **This supersedes the old
  worklist**; gate 10.1's five open items (1–5) are folded into it and item 6 already
  shipped.

The headline changes, so a fresh reader knows what is coming:

1. **Chapter 0 is recomposed.** The macro on the power button is retired — the owner
   saw the arm clipping, and the cause is the **near plane**, not the geometry. It
   becomes a wide shot from behind-right; the rest point becomes a monitor medium and
   the phosphor extreme close-up is cut from the film.
2. **The camera adapts to viewport aspect** (`journeyFov`/`dockDistance`, one module,
   two consumers). This is the iPad fix. `DOCK_DISTANCE = 0.26` already *was* the
   aspect-1.2578 solution hard-coded.
3. **The shed ladder drops to nine rungs** — `dust` goes, a lit corner lamp arrives,
   and the lamp deliberately does **not** inherit the rung. Every "ten rungs" in
   `CLAUDE.md`, `AGENTS.md`, `docs/design-system.md`, `fidelity.ts` and `sheddable.ts`
   is now wrong and plan-0011 §7.1 owns fixing them.
4. **The title beat moves to the entry frame** as a title card and `TitleBeats.tsx` is
   deleted; the mug's white top is a solid cylinder cap (`openEnded` defaults false —
   not a material bug); the tail wag gets one rate multiplier; the `skip intro` link
   goes and the copy becomes pointer-class aware.

Two things plan-0011 records but does **not** fix — both pre-existing, both wanting
their own decision: there is **no `<h1>` in the accessibility tree while the experience
is mounted** (`Hero.tsx:51` sits inside the hidden `[data-floor]`), and **iOS Safari's
dynamic viewport is unhandled** (`750vh` runway against an `innerHeight` trigger, no
`dvh`/`visualViewport` anywhere).

## Standing rules, in precedence order

1. Root `CLAUDE.md` / `AGENTS.md` — the architecture contracts (one store two
   renderers, choreography owns scroll, the arm rig's four pivots, props are driven
   never re-parented, the shed ladder, zero Microsoft IP, confidentiality).
2. **A gate record outranks an ADR on what actually ships.**
   `docs/qa/6.2-picture-review.md` is the authority on the picture set — it cut 29
   photographs to 23, and ADR-013's "all 29 ship" is dead. Do not restore them on the
   ADR's authority.
3. `docs/decisions/ADR-014-…md`, then `ADR-013-…md`. ADR-013's amendments so far:
   **§2a, §3a, §7a, §10a** (plus **§9a**, a record of what shipped). Don't
   re-litigate the rest.
4. `docs/plans/implementation-plan-0011.md`, then `-0010.md`. The AFK gate is always
   lint + build green.

## Working here

- `docs/qa/headless-qa-notes.md` — how to verify this scene without eyes: the
  simulation patterns and the QA gotchas that each produced a wrong answer first.
  **Read it before writing a probe.** The `jiti` recipe (no scratch project, no `tsc`)
  is the cheapest way in; the "project real geometry through a real camera" pattern is
  what plan-0011 P2 is built on.
- Its standing lesson applies directly to this branch: **a viewport matrix is only as
  wide as its widest entry.** Every "mobile" claim on this scene was made at 360×640
  and 390×844, which is why gate 10.1 found the iPad defect that no run had loaded.
- Agent memory worth having loaded: `noise-signal-redesign-state.md`,
  `owner-motif-privacy.md`, `client-name-leak-accepted.md`, `windows-shell-gotchas.md`.
- Committer identity resolves to the owner's work email. Raised twice, **left
  deliberately** — don't raise it a third time.

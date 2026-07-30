# HANDOFF — `opening-and-fit` merged to `main` (2026-07-31, session 27)

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

**`main` carries ADR-012 + ADR-013**, all gates PASSED (1.3, 2.4, 3.3, 6.2, 10.1;
records in `docs/qa/`). Gate 3.3 §4 settled a set of numbers in the opening — **four
of its five answers were "leave it"**, so those are chosen values, not placeholders.

**`opening-and-fit` is MERGED to `main`** (`--no-ff`), gate 11.1 PASSED on
everything reachable without a tablet. It implements
**[ADR-014](docs/decisions/ADR-014-chapter-zero-recomposition-and-viewport-adaptation.md)**
(nine decisions) to **[plan-0011](docs/plans/implementation-plan-0011.md)** (17 slices,
seven packages). Plan-0011 **supersedes gate 10.1's worklist** — its five open items
are all now built, and item 6 shipped earlier as `ladder-pacing`.

| | |
|---|---|
| `a5c4dc0` | ADR-014 + plan-0011 |
| `83d26b3` · `7cb7d79` | **P1** — viewport adaptation (`choreography/viewport.ts`, orientation routing) |
| | **P2** — chapter 0 recomposed: the wide, the arc, the monitor medium |
| | **P3** — pointer-class-aware skip; `TitleBeats` → a title card on the entry frame |
| | **P4** — dust out, corner lamp in, ladder down to nine rungs |
| | **P5 + P6** — the mug opens; `WAG_RATE` |
| | **P7.1 / 7.2** — docs reconciled, regression sweep green |

**plan-0011 is complete. Gates 2.4, 4.3, 6.2 and the full ride all PASSED**, so the
things they settle are settled: the hand no longer clips, the wide opening is the
right shot, the boot pan's `PAN_HOLD_MS` / `PAN_DURATION_S` survive the new move
unretuned, and **`WAG_RATE = 1.2` is now a chosen value, not a candidate**.

## What shipped to `main` UNVERIFIED — read this before touching P1

**Gate 11.1 §1 was not run.** The owner passed everything reachable on their desktop
and merged with the tablet section outstanding; that is their call, recorded in the
checklist's verdict box. What it means concretely:

- **ADR-014 §3 and §4 — the entire viewport-adaptation half of this branch — shipped
  proved by arithmetic and have never been seen on a tablet.** §0 of the checklist
  says exactly what the arithmetic covers. `headless-qa-notes.md`'s standing lesson
  says why that is not the same thing: *a viewport matrix is only as wide as its
  widest entry*, and this branch exists because of that lesson.
- `FOV_MAX_DEG = 75` in `viewport.ts` is the one number in P1 that is taste rather
  than arithmetic, and it is **unconfirmed by eyes**.
- **iOS Safari's dynamic viewport is still unhandled**: `750vh` against an
  `innerHeight` trigger, and nothing in the repo uses `dvh`/`svh` or `visualViewport`.
- Three touch behaviours are unchecked: the coarse-pointer copy, tapping the backdrop
  to skip, and the skip taking the title card without an orphaned fade.

**If any of these bites, it is a new slice off `main` — not a regression of something
that passed.** Nothing here is known-broken; it is known-unwitnessed, which is a
different and more honest claim.

The other thing plan-0011 flagged and did not close: **the title card's role line dips
under WCAG AA on 5 % of its pixels** (4.06:1 worst, all above AA-large's 3:1), where
its first characters cross the corner lamp's bloom — checklist §0.6. Measured, not
retuned; the levers are the lamp's brightness and the card's position, both owner
calls, and the card is `aria-hidden` decoration duplicating the DOM floor.

## What the numbers already say, so nobody re-derives them

Carried into `docs/qa/11.1-opening-and-fit-checklist.md` §0 in full. The short form:

- **The reported defect is fixed and the fix is measured.** On the old macro key the
  power reach breached the 0.1 m near plane on **115 of 143 frames**, cutting
  `forearmR` open — a `FrontSide` capsule cut at the lens shows no backface, which is
  the "insides" the owner saw. On the new key it breaches on **0 of 143**, at four
  aspects, and nothing in shot along the whole chapter comes within 0.199 m.
- **Three things about chapter 0 are forced, not chosen.** The shot is behind-*right*
  because the figure occludes its own tower (438 of 972 swept positions blocked by
  `chest` or `shoulderPivotR`, and `PowerButtonAnchor` has no depth test). The arc key
  is required because the straight run clears the figure by 0.082 m at best and
  0.024 m at the median. The rest is on the figure's *left* because the CRT sits at
  x −0.22 and the figure at x 0, so obliquity on the glass is 10° from the left
  against 46° from the right.
- **Chapters 1–5 did not move.** Bit-identical to `main` from `REST_POINTS[1]` onward:
  worst Δ 0.00e+0 over 20001 samples. Poses *between* `REST_POINTS[0]` and
  `REST_POINTS[1]` do move, necessarily — that segment's start key is the one ADR-014
  §2 moved.
- **The shed ladder's offer did not move either.** 34.6 / 32.5 / 38.4 s at 10 / 20 /
  27 fps, bit-identical at nine rungs and at `main`'s ten.
- **The desktop ride is untouched by P1** — bit-identical over 20001 progress samples
  at 1440×900 (worst Δ 0.00e+0 m).

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
   re-litigate the rest. **ADR-013 §7a has one factual error**, found by simulating
   `main`'s own module: it says two garnish rungs walk before the 30 s deadline at 10
   and 27 fps; it is one. Recorded in `fidelity.ts`, not silently corrected.
4. `docs/plans/implementation-plan-0011.md`, then `-0010.md`. The AFK gate is always
   lint + build green.

## Working here

- `docs/qa/headless-qa-notes.md` — how to verify this scene without eyes. **Read it
  before writing a probe.** The `jiti` recipe is the cheapest way in, and the P2.1
  entry ("project a candidate camera pose through the real room, with an occlusion
  test") is the tool this whole branch was built on. Its three traps each produced a
  wrong answer first. **Its viewport matrix is now thirteen entries and closed** —
  the phone-portrait-only hole that produced the iPad defect is fixed at the source.
- **Comparing against `main` with jiti:** drop `git show main:<path>` beside the live
  file so its relative imports resolve, then delete it. **Compare sampled to sampled,
  never sampled to a literal** — at `p` exactly on a key, `lerpVectors(a, b, 1)` is
  `a + (b − a)`, which is not bit-exactly `b`, so a literal comparison reports ~1e-16
  of motion on keys that provably did not move.
- Standing lesson, and this branch exists because of it: **a viewport matrix is only
  as wide as its widest entry.**
- **`w98-intro-seen` is write-only now** (ADR-014 §6). Every checklist in `docs/qa/`
  opens by clearing it; that step is a no-op, not a mistake.
- Agent memory worth having loaded: `noise-signal-redesign-state.md`,
  `owner-motif-privacy.md`, `client-name-leak-accepted.md`, `windows-shell-gotchas.md`.
- Committer identity resolves to the owner's work email. Raised twice, **left
  deliberately** — don't raise it a third time.

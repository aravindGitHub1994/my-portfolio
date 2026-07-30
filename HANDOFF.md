# HANDOFF — `opening-and-fit`, P1 built (2026-07-30, session 26)

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

**Branch `opening-and-fit` is cut from `b341735` and open.** It implements
**[ADR-014](docs/decisions/ADR-014-chapter-zero-recomposition-and-viewport-adaptation.md)**
(nine decisions) to **[plan-0011](docs/plans/implementation-plan-0011.md)** (17 slices,
seven packages). Plan-0011 **supersedes gate 10.1's worklist** — its five open items
are folded in and item 6 shipped as `ladder-pacing`.

| | |
|---|---|
| `a5c4dc0` | ADR-014 + plan-0011 + this file's previous revision |
| `83d26b3` | **P1.1 + P1.2** — `choreography/viewport.ts`, wired into `cameraPath`, `dockAlignment`, `JourneyCamera` |
| `7cb7d79` | **P1.3** — orientation routing in `shellLayout.ts` |

Lint + build green, working tree clean. **P1 is AFK-complete. P2–P7 have no code.**

## The owner's ordering decision (session 26)

**Gate 1.4 — the iPad — is deferred to the end.** The owner will check both
orientations *once the whole branch is done and merged*, not as a blocking gate before
P2. So **P2 is unblocked and is the next work**, with two consequences to carry:

- The portrait lens is **unconfirmed by eyes**. `FOV_MAX_DEG = 75` in `viewport.ts` is
  the one number in P1 that is taste rather than arithmetic. If the owner calls it too
  wide at the end, P2's tablet-aspect framing gets a second look — plan-0011 risk 1
  already budgets for a second pass on the opening.
- Gate 2.4 keeps its own separate ask (the first twenty seconds, desktop), and gate 7.3
  now absorbs 1.4's questions. Fold them into
  `docs/qa/11.1-opening-and-fit-checklist.md` when 7.3 writes it.

## What P1 shipped, and the parts worth not re-deriving

**`REF_ASPECT` is derived, not chosen** — `CRT_SCREEN_SIZE.width / REF_VISIBLE_H` =
**1.257836**, the aspect at which the CRT screen exactly fills the viewport *width* at
the shipped dock pose, i.e. precisely the aspect below which the hard-coded `0.26`
began overflowing. `journeyFov` and `dockDistance` therefore change regime at the same
number, so "at or above REF_ASPECT nothing moves" is one statement, not two
coincidences. `dockDistance` returns `0.26` **bit-exactly** on that branch via an
explicit early return — not algebra that happens to round right.

**Plan-0011 §1.1's `FILL` factor is in the code as `REF_VISIBLE_H`** (2 × 0.26 × tan 25°
= 0.24248; FILL 1.0103 **on the height term only**). Applying a margin to both axes
fails the "reproduce 0.26 at aspect 1.2578 within 1 mm" criterion by 2.7 mm — those two
acceptance criteria are in genuine tension and the asymmetry is the resolution.

**A lint rule shaped the wiring.** `react-hooks/immutability` forbids mutating a
hook-returned value, so `camera.fov` **cannot** be written in an effect off
`useThree(s => s.camera)`; it is written inside `useFrame`'s state callback behind a
change guard (what §1.2 asked for anyway). `setViewportAspect` — module state — stays
in an effect keyed on aspect.

**One fix taken beyond the slice text, flagged for the owner.** `shellLayout.ts`'s
`touchUnit` was `Math.round(44 / scale)`, which rounds a WCAG *floor* downward. Every
tablet portrait lands on the scale ceiling 1.4, where that gave **43.4 css px against
a 44 px rule** — the exact number ADR-014 §4 cites as the reason tablets get this shell
at all. Now `Math.ceil`. Side effect on a shipped size: **390×844 phones gain one
virtual unit of app-bar height** (43.59 → 44.74 px); 360×640 unchanged.

**Proved offline (jiti against live source, three probes, all green):** fov exactly 50
at ten aspects ≥ REF_ASPECT and monotonic over 1800 samples; `dockDistance(1.2578)`
0.0000 mm off 0.26; the projected rect fits both axes with `left`/`top` ≥ 0 at all 16
sweep viewports through the real `computeDockRect`; **the desktop ride is bit-identical
to `main` over 20001 progress samples at 1440×900** (worst Δ 0.00e+0 m); fine-pointer
and coarse-*landscape* routing identical to `main` across 3641 widths. Carry these into
gate 7.3's §0 rather than re-running them.

## What is left

P2 (chapter 0 recomposition) → P3 (entry frame) → P4 (dust out, lamp in) → P5 (mug) →
P6 (wag) → P7 (close-out). **P4, P5 and P6 are independent and can land in any order.**
P3 is not blocked by P2 but shares `PowerOn.tsx`, so land 3.1 then 3.2 and keep the
diffs apart. Read plan-0011's dependency graph before picking.

Still true and still owned by §7.1: **every "ten rungs" in `CLAUDE.md`, `AGENTS.md`,
`docs/design-system.md`, `fidelity.ts` and `sheddable.ts` is wrong once P4.1 lands**,
and nothing automated guards the count.

Two findings plan-0011 records but does **not** fix — both pre-existing, both wanting
their own decision: **no `<h1>` in the accessibility tree while the experience is
mounted** (`Hero.tsx:51` sits inside the hidden `[data-floor]`), and **iOS Safari's
dynamic viewport is unhandled** (`750vh` runway against an `innerHeight` trigger, no
`dvh`/`visualViewport` anywhere). The second may surface at the deferred iPad check;
if it does it is a separate defect, not a P1 failure.

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

- `docs/qa/headless-qa-notes.md` — how to verify this scene without eyes. **Read it
  before writing a probe.** The `jiti` recipe is the cheapest way in; the "project real
  geometry through a real camera" pattern is what P2 is built on.
- **Comparing against `main` with jiti:** drop `git show main:<path>` beside the live
  file so its relative imports resolve, then delete it. Trap met in P1.2 — a "nothing
  else moved" assertion fails at `p = 1`, because the ch.5 key is a literal that cannot
  move yet is *reached* through the dock segment, so moving the dock key changes its
  lerp rounding (4.44e-16 m). Assert bit-exactness up to the moved key; bound the rest.
- Standing lesson, and this branch exists because of it: **a viewport matrix is only as
  wide as its widest entry.** Every "mobile" claim on this scene was made at 360×640
  and 390×844.
- Agent memory worth having loaded: `noise-signal-redesign-state.md`,
  `owner-motif-privacy.md`, `client-name-leak-accepted.md`, `windows-shell-gotchas.md`.
- Committer identity resolves to the owner's work email. Raised twice, **left
  deliberately** — don't raise it a third time.

# HANDOFF — post-`scene-refinement` (2026-07-30, session 24)

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

## Where things are

**`scene-refinement` is merged.** Plan-0010's eight packages (P1–P8) are
complete, ADR-013 is fully built, and **gate 10.1 PASSED on the owner's second
run (session 24) and merged to `main`**. `main` now carries ADR-012 + ADR-013.
`ladder-pacing` (worklist item 6, the 30 s offer deadline) is merged too. **There
is no open branch**, and the five remaining worklist items below have no code.

Gate 10.1's record is `docs/qa/10.1-scene-refinement-checklist.md` and it is
closed — read it for context, not as a worklist:

- **§0a** — the three fixes from the owner's *first* pass (the POST was
  inaudible, the keyboard was a machine gun, the dock would not release when
  entered while scrolling backwards). All three were re-checked and confirmed by
  the owner on the second run: "sounds fine now", "typing is now fine, not
  continous", "scrolling back undocks now".
- **§0** — what slice 8.1 proved offline. Re-verified at merge: lint and build
  clean, `public/audio` and `out/audio` are `LICENSES.md` only, `public/pictures`
  is 46 files, `LUMINANCE_CAP 0.7` / `CAST_MAX 2.6` intact, `painter.ts` still
  free of any `pictures.ts` import, and the Gallery caption chunk still absent
  from `out/index.html`.
- **§8 / §9** — the honest ledger and the deliberate non-fixes. **The audio mix
  is no longer wholly unheard** — the owner passed §8.1 on this run, which is the
  first time a human has listened to it. §9's items are decisions; say so if you
  disagree, but don't silently "fix" them.

Gates owner-PASSED across the branch: **1.3, 2.4, 3.3, 6.2, 10.1**. Their records
are in `docs/qa/`, and gate 3.3 §4 in particular settled a set of numbers in the
opening — **four of its five answers were "leave it"**, so they are chosen
values, not placeholders.

## The next branch's worklist

**Six items came out of gate 10.1 and were deliberately NOT fixed on
`scene-refinement`** — the owner said "we'll tackle on a new branch" and marked
four of them "save this for later" in the checklist itself. They are cosmetic or
question-shaped, none is a regression, and the gate passed with them open. Cut a
new branch off `main` for them; **don't re-open gate 10.1**.

**Item 6 is done and merged (`ladder-pacing`); five remain.** Item 5, the iPad
fit, is the only one of the five that is a defect rather than a preference.

1. **Drop the `skip intro` link** (checklist §1 notes) —
   `workstation/PowerOn.tsx:338–347`, the `returning && (…)` button. Keep `any
   key skips the intro`. **One wrinkle to solve, not just a delete:** at `idle`
   the pointer skip is deliberately *not* armed (only the key path is — see the
   comment at `PowerOn.tsx:273`), so on a touch device that link is a returning
   visitor's only skip affordance on the entry frame, and the copy that replaces
   it promises a key they don't have. Decide what touch gets before cutting it.
   Interacts with item 5.
2. **Dust out, a tall corner lamp in** (§2.6) — `scene/Atmosphere.tsx` owns the
   shafts and the dust motes. The owner's words: "need to remove dust and replace
   with a tall lamp in the corner." Note the fidelity ladder sheds these by name
   (`scene/sheddable.ts`, `fidelity.ts`) and the brightness contract binds any new
   light source.
3. **Coffee in the mug's surface** (§3.6) — "the steam comes out of a white top
   surface of the mug." `builders/mug.ts:20–26` *does* build an inner disc, but it
   is `materials.rubber` at r = 0.036, top ≈ y 0.090 under a 0.098 rim; whatever
   the owner is seeing is that disc reading wrong (material, or hidden under the
   rim at the chapter-3 angle), not a missing mesh. Steam's origin is
   `scene/Steam.tsx`.
4. **Tail wag slightly faster** (§4.3) — "increase the speed of the wag just a
   smidge." `builders/catIdle.ts:105–111`: the sweep is `sin(t*0.53)` +
   `sin(t*0.211)`, the lift `sin(t*0.169)` + `sin(t*0.397)`. Scale the rates, keep
   the two cats out of phase and keep the periods incommensurate — that is what
   stops a visible common cycle (see the file header).
5. **The scene does not fit an iPad screen** (§8.2) — **the one new defect this
   run found**, and the only item here that is a bug rather than a preference. The
   owner: "ran it on ipad and the scene is not fitting on screen." §8.2 was
   already flagged as untested-by-construction (headless Chromium at 360×640 and
   390×844 only — no tablet size was ever in that set, and no real touch, iOS
   Safari dynamic viewport, or in-app webview). **Start by reproducing at iPad
   viewports before changing anything.** Highest value of the six.
6. ~~**Answer the rephrased §8.3 question**~~ — **DONE, on branch
   `ladder-pacing`.** The owner answered "70 seconds is too long make it 30
   seconds", and it turned out not to be a one-knob change: the ladder's walk
   costs 29.5 s at 20 fps with `GRACE_FRAMES` at *zero*, so the terminal rung got
   its own `OFFER_AFTER_MS` deadline instead of the ladder getting faster. See
   **ADR-013 §7a** for the three properties that must survive later edits, and
   `docs/design-system.md` for the before/after table. Offer now lands at 32.5 s
   (20 fps) / 34.6 s (10) / 38.4 s (27). **Branch is unmerged** — lint, build and
   a 20-assertion simulation are green, but nobody has *sat through* the new
   pacing on real slow hardware, which is the whole point of the number.

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
   so far: **§2a**, **§3a**, **§7a**, **§10a** (plus **§9a**, which is a record of
   what shipped rather than an amendment). Don't re-litigate the rest.
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

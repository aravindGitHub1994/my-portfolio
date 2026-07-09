# HANDOFF — "The Lens" redesign (ADR-006): implemented + QA'd, uncommitted

> Sessions: 2026-07-07 (three so far), branch `threeJS-redesign`. The previous
> HANDOFF (ADR-005 P2/P3 tracking) was deleted by the owner; this replaces it.

## Current Status

- **ADR-006 implemented, visually QA'd on all tiers, §7a history rewrite DONE
  — everything is in the working tree, NOTHING COMMITTED YET.**
  `npm run lint` ✅ · `npm run build` ✅ · semantic DOM in `out/index.html` ✅.
- New system: `src/components/lens/` (replaces the deleted
  `src/components/cube/`):
  - `lensState.ts` — shared mutable scroll/pointer state; `LensChoreography.tsx`
    — sole owner of the five per-act ScrollTriggers + scroll velocity.
  - `TheLens.tsx` — dispersion prism → crystallizes to cube (Trajectory beat)
    → hands off to point-globe (Contact). Tiered: MTM / faux-glass / static cube.
  - `DataStreams.tsx` — stateless vertex-shader particles + light blades.
  - `RefractionPass.tsx` — pointer-radial displacement + chromatic aberration +
    desaturation. High tier + fine pointer only.
  - `kinetic/` — DOM↔GL twin system (Range-walk rasterizer; re-rasters on text
    mutation for count-ups; plain-fade fallback where no GL layer claims).
- **Slice 3.3 done:** `acts/Approach.tsx` — five count-up stat figures,
  content in `src/lib/stats.ts` (44/19/200+ trace to `resume.ts`; 4/5 derived
  from `PROJECTS.length`/`CAPABILITY_LIST.length`). Prerender ships resolved
  values; reduced-motion never zeroes them; no aria-live.
- **Visual QA done (third session, via `agent-browser` CLI — not the Chrome
  extension) and the scene was materially fixed:**
  - **Point-size bug (the big one):** `gl_PointSize` used `300.0/-mv.z` (~43×)
    — particles rendered 70–150px, additive-blended into blinding white fog
    that washed out every act. Now pixel-scale (`7.0/-mv.z`, unity at the lens
    plane) in both stream shaders. This also fixed the "white slab" prism
    (transmission was refracting the blown-out scene) and the Contact globe
    (was a white ball; now an actual point-globe).
  - Glass tuned: MTM `roughness` 0.06→0.12 + `envMapIntensity` 0.7 (Lightformer
    strips no longer blow faces to white).
  - `LensRig` approach beat: prism now **sinks below the stat band + shrinks**
    (`sink = approach·(1−work)·(1−trajectory)`) so the figures own the row.
  - All acts + `?tier=low` + `?tier=static` + emulated reduced-motion verified
    by screenshot; pointer-distortion pass verified live; no page errors.
- **Slice 4.3 done (2026-07-09, fourth session, owner-directed):** the three
  hero screenshots recreated as fully fictional dummy-data pages (brands
  Veyra Electronics / Solstice Beverages "Data Path" / a fictional Meridian
  report — all SKUs, people, dates and € figures invented), authored as
  self-contained HTML in `docs/projects/recreations/` (tracked; see its
  README for the 1440×900 regen command), screenshotted via agent-browser →
  `public/screens/{taxonomy,budget,gmc}.png` (86–113 KB each), and
  `Project.screenshot` set on the three shipped projects (personas stays
  imageless). Beat-1 verified live: high tier = GL-twinned distorting plane,
  low tier = crisp DOM `<img>`; all three paths in the prerendered
  `out/index.html`; lint ✅ build ✅.
- **Slice 4.4 done:** all four diagrams re-authored for legibility (titles
  16–20 / subs 12.5–15 viewBox units, stroke 2, dense fill; budget flipped
  780×196 strip → vertical 440×492). `ProjectPin`: budget panel `max-w-sm`,
  card padding p-4/sm:p-5. Verified in-browser per project.
- **Slice 5.1 audit done** — one gap fixed: `KineticText` now has the §3
  "plain fade" on unclaimed tiers (IO-driven, never hidden in prerender or
  under reduced-motion). Delivered tier matrix documented in
  `docs/design-system.md`. Note: low tier keeps *animated* calm choreography
  (fewer particles, faux-glass, no post) — richer than the plan table's
  "static prism" shorthand; recorded as the delivered contract.
- **Slice 5.2 done:** `docs/design-system.md` rewritten (Electric Dark + Lens
  contract + tier matrix), `README.md` rewritten (was celestial-era),
  `AGENTS.md` conventions updated, `docs/diagram-authoring.md` updated
  (single-play contract + legibility rules).
- **§7a / slice 0.2 DONE (owner-authorized, third session):**
  - `git filter-repo` on a mirror clone removed both confidential PNGs from
    all history; force-pushed `main` + `feat/animated-celestial-sky`.
  - Local: `main`/`feat` re-pointed; `threeJS-redesign` rebased onto the
    rewritten base (`8e0a807`, old `bdf8b24`) — tree diff = only the two PNGs;
    zero `Screenshot` objects reachable from any local ref. Raw files remain
    on disk (gitignored) as recreation references.
  - **Remote main was ahead of local** (contained the merged PR #1 celestial
    branch); local `main` now tracks the rewritten remote incl. that merge.
    `threeJS-redesign` still forks from the pre-merge base — intentional.

## Unresolved Threads

1. **GitHub cached views still serve the old blobs** (verified HTTP 200 at the
   old SHA post-push) — unreachable commits persist until GitHub purges, and
   **PR #1's read-only `refs/pull/*` pin old commits**. Owner must contact
   GitHub Support ("remove cached views / sensitive data" flow) to finish the
   purge. NDA/contract-terms check also still owner-side.
2. ~~Slice 4.3~~ **done** (owner-directed 2026-07-09; assets are 100%
   fictional so no NDA exposure from them). Note while wiring it: the tracked
   `docs/projects/budget-optimizer-meridian/PROJECT_CONTEXT.md` names a real
   client (redacted) — pre-existing in public history; owner may want to
   scrub it alongside the GitHub Support purge.
3. Two recorded deviations from ADR-006 §9, owner may veto (rationale in plan
   0004): canvas-raster kinetic type; stateless shader advection.
4. QA was headless-browser (SwiftShader) — worth one pass with the owner's
   eyes on real GPU for perf feel (fps) and MTM look; composition/choreography
   are verified.

## Key References

- ADR: `docs/decisions/ADR-006-lens-refractive-redesign.md` (§7a security;
  §8 mobile contract) · Plan: `docs/plans/implementation-plan-0004.md`
- Design system (rewritten): `docs/design-system.md` · Diagrams:
  `docs/diagram-authoring.md` · Reference site: ryanritzenthaler.com
- Visual QA screenshots: session scratchpad `qa*.png` (temp — will vanish).

## Gotchas for the next agent

- **Strict React-compiler lint rules** (`react-hooks/purity`, `immutability`,
  `refs`, `set-state-in-effect`): frame-time uniform writes via material refs,
  no `Math.random` in render/memo (seeded `mulberry32`), subscribe-before-claim
  in the kinetic registry, JSX (not `createElement`) when passing refs.
- Static export + CSP `connect-src/font-src 'self'`: no CDN HDRs/fonts/
  benchmarks; drei Environment stays Lightformer-only.
- Windows shell: commit messages via `git commit -F <file>`; don't round-trip
  UTF-8 files through PowerShell cmdlets.
- `agent-browser` CLI drives QA (daemon at
  `~\Documents\Local_server\agent-browser`, binary under `bin/`); headless GL
  auto-detects tier **low** — use `?tier=` overrides. Dev server already runs
  on port 3004.
- Never push any ref that predates the §7a rebase (would re-leak the blobs);
  old commits linger only in the local reflog until expiry.

## Recommended Next Steps

- [ ] Owner: GitHub Support request (purge cached views + PR #1 old commits);
      NDA check for recreated visuals.
- [ ] Commit the redesign in reviewable slices (guardrails / plan / scene /
      acts / diagrams+screens / docs), messages via `-F` file,
      `Co-Authored-By: Claude Fable 5`. (Owner waived pre-commit
      /code-review.)
- [ ] Owner eyes on real GPU: hero prism look, fps, distortion feel; tune
      MTM/blade alphas if wanted (`/frontend-ui-engineering`).

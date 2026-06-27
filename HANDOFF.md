# Handoff — Portfolio UI fixes (hero / modal / starfield)

## Current Status
- Three reported UI issues were diagnosed to root cause and a full implementation plan was
  written and **approved through the grill-with-docs session** (all design branches resolved).
  **No code has been changed yet** — next session implements.
- The approved plan (the source of truth for *what* to build and *why*) lives at:
  `C:\Users\AravindKumar\.claude\plans\tranquil-beaming-knuth.md`. Read it first.
- Scope summary (detail in the plan):
  1. **Hero portrait crop** — `Hero.tsx` img uses `object-cover` + default center on a tall
     portrait, cropping the face. Fix: add `object-position` (start `object-top`, tune toward
     `object-[center_15%]`).
  2. **Orbit-ring icon swaps** (`src/lib/techIcons.ts`): **React → Google Tag Manager**
     (simple-icons `googletagmanager`), **PostgreSQL → SQL** (hand-built database-cylinder
     glyph — no simple-icons "SQL" exists), **Docker → Claude** (simple-icons `claude`
     sunburst). Final ring: GTM, SQL, Claude, BigQuery, Google Analytics, Python. Keep array
     length so `OrbitRing.tsx:61-62` spacing math is unaffected.
  3. **Project modal clipped/unscrollable** — NOT a modal-CSS bug. `ProjectModal` renders
     inside `ProjectGrid`, wrapped in `<Reveal>` whose `transform`/`translate` becomes the
     containing block for `fixed`. Fix: `createPortal` the modal to `document.body`.
  4. **Global starfield** — move `Starfield` from inside `Hero` to a single viewport-fixed
     mount in `layout.tsx` (`fixed inset-0 -z-10`, sized to `window.innerWidth/innerHeight`);
     remove hero's local canvas (keep its vignette + glow). User chose the single-global-field
     option.

## Unresolved Threads
- None blocking. Two visual tunables to settle *during* implementation by eyeballing:
  - exact hero `object-position` value (face framing in the circle);
  - global starfield opacity so it reads subtle behind content on text-heavy pages.
- `claude` / `googletagmanager` path `d` data must be fetched **verbatim from official
  simple-icons SVGs** (do not invent path data — project convention in `techIcons.ts`).

## Key References
- Plan (approved): `~/.claude/plans/tranquil-beaming-knuth.md`
- Files to edit: `src/components/Hero.tsx`, `src/components/Starfield.tsx`,
  `src/components/ProjectModal.tsx`, `src/lib/techIcons.ts`, `src/app/layout.tsx`.
  Do NOT touch `ProjectGrid.tsx`, `Reveal.tsx`, page files, or `globals.css`.
- Project constraints: `AGENTS.md` (Next.js 16 has breaking changes — read
  `node_modules/next/dist/docs/` before writing Next code), static export only
  (`next.config.ts`: `output: "export"`). Broader revamp context: `PORTFOLIO_REVAMP_PLAN.md`,
  `specs/portfolio_revamp_contract.md`.
- No ADR needed — all four fixes are reversible and unsurprising.

## Recommended Next Steps
- [ ] Implement the 5 file edits per the plan (portal needs `import { createPortal } from "react-dom"`).
- [ ] Fetch verbatim simple-icons `d` for `googletagmanager` and `claude`; hand-build the SQL cylinder.
- [ ] `npm run lint` + `npm run build` clean; static export to `out/` succeeds (portal is client-only — safe).
- [ ] `npm run dev` (port **3004**): verify face visible, ring icons correct, particles on all
      4 routes top-to-bottom, modal centered+fully scrollable on `/` and `/projects` (incl. short
      viewport), reduced-motion pauses motion, modal keyboard pass (Esc/Tab-trap/scroll-lock/return-focus).
- [ ] Commit only when the user asks (whole revamp is still uncommitted on `main`).

## Recommended Skills
- `frontend-ui-engineering` (or `fullstack-guardian`) for the implementation.
- `verify` / `run` to drive the dev server and confirm the four fixes visually.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Portfolio — agent guide

Personal portfolio. **Next.js 16 App Router · React 19 · Tailwind v4 · TypeScript**,
shipped as a **static export** (`output: "export"`) to Vercel. See `README.md` and `docs/decisions/`.

## Commands
- `npm run dev` — dev server on **port 3004**
- `npm run build` — static export to `out/`
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)

## Hard constraints
- **Static export only** — no API routes, Route Handlers, Server Actions, middleware,
  `next/image` optimization, or SSR/dynamic features. Use plain `<img>` (`images.unoptimized`).
- Keep `document`/DOM access inside effects or mounted guards so prerender stays safe.
- Don't edit inside the `<!-- BEGIN/END:nextjs-agent-rules -->` markers (tool-managed).

## Conventions
- **Content in `src/lib/*.ts`** (`projects.ts`, `resume.ts`, `stats.ts`, `nav.ts`, `capabilities.ts`).
- **`techIcons.ts`** path data is **verbatim from simple-icons** (24×24, nonzero fill); the
  `SQL` glyph is the one exception (MDI database path). Don't hand-edit path data.
- **Diagrams** are hand-structured animatable SVGs in `public/diagrams/`
  (`docs/diagram-authoring.md`): inlined via `InlineDiagram` for the one-shot
  draw-on + packet pass (ADR-006 §6), `<img>` as fallback only.
- **Design tokens** in `src/app/globals.css` (Tailwind v4 `@theme`) — use semantic classes, not raw hex.
- **The Lens** (`src/components/lens/`, ADR-006, amended by ADR-008/009): fidelity is
  high by default with a runtime FPS-watchdog fallback to `low` (tier threaded from
  `LensCanvas`). `LensChoreography` is the sole owner of
  scroll inputs; frame loops read mutable `lensState` (never React state). Strict
  React-compiler lint rules apply — no `Math.random` in render/memo (seeded `mulberry32`),
  frame-time uniform writes via material refs, subscribe-before-claim in the kinetic registry.
- **Never commit raw client screenshots** — imagery under `public/screens/` must be
  fabricated dummy-data recreations (ADR-006 §7/§7a).
- Security headers in `vercel.json` (Vercel only).

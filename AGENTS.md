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
- **Content in `src/lib/*.ts`** (`projects.ts`, `resume.ts`, `nav.ts`, `capabilities.ts`).
- **`techIcons.ts`** path data is **verbatim from simple-icons** (24×24, nonzero fill); the
  `SQL` glyph is the one exception (MDI database path). Don't hand-edit path data.
- **Diagrams** are pre-rendered SVGs in `public/diagrams/` (ADR-002), referenced via `<img src>`.
- **Design tokens** in `src/app/globals.css` (Tailwind v4 `@theme`) — use semantic classes, not raw hex.
- Security headers in `vercel.json` (Vercel only).

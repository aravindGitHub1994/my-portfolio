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
- **Diagrams** are hand-structured animatable SVGs in `public/diagrams/`
  (`docs/diagram-authoring.md`): inlined via `InlineDiagram` for the one-shot
  draw-on + packet pass, `<img>` as fallback only.
- **Design tokens** in `src/app/globals.css` (Tailwind v4 `@theme`) — use semantic classes, not raw hex.
- **The Workstation** (`src/components/workstation/` + `src/components/win98/`,
  [ADR-012](docs/decisions/ADR-012-win98-workstation-cinematic-redesign.md)) —
  a procedural Win98-machine scene; the portfolio lives inside the CRT. It
  **supersedes ADR-005…ADR-011 as the experience layer** (`src/components/lens/`
  is retired). The rules that bind work here:
  - **One store, two renderers (§4):** `src/lib/win98State.ts` is pure (no DOM,
    no three.js) and feeds both `win98/painter.ts` (cinematic, canvas→CRT
    texture, **event-driven only** — never per frame) and `win98/shell/`
    (docked, live DOM). The dock swap is a view change, not a state handoff.
  - **Choreography owns scroll.** `workstation/choreography/` is the sole owner
    of scroll inputs; frame loops read mutable module state, never React state.
    Scroll is suspended while docked.
  - **Shell space is 640×480 virtual units** (`DESKTOP_W/H`); `Window.tsx`
    divides client px by `scale`. The taskbar must stay a `<div>` (globals.css
    hides `<footer>`s while the experience mounts).
  - **Brightness contract (gate 2.3):** luminance cap 0.7 in `CrtScreen` +
    `CAST_MAX 2.6` in `Lighting` — preserve in every screen change.
  - **The arm rig (ADR-013 §1):** arms are two-bone rotational chains
    (`shoulderPivot` → upper arm → `elbowPivot` → forearm + hand);
    `character/armPose.ts` moves them by **rotating those four pivots only** —
    no geometry rebuild, no world-position writes, no pivot translation. Poses
    are solved once at driver creation, never in the frame path.
  - **Props are driven, never re-parented (ADR-013 §6):** `scene/propHandles.ts`
    is a one-way noticeboard — the room publishes, the character consumes, and
    **`RoomScene` must never import from `character/`**.
  - **Fidelity:** high by default; the FPS watchdog **prompts** before any
    downgrade (`src/lib/gpuTier.ts`, `?tier=high|low|static`). Sustained slow
    frames walk `workstation/fidelity.ts`'s one-way shed ladder — **nine rungs**
    since ADR-014 §5 deleted `dust` with the motes; `steam` still sheds before
    `idleDensity` (see `docs/design-system.md`). DRS chases 60 fps, the ladder
    defends the 30 fps floor.
  - **Lazy apps (§8):** `win98/apps/lazyApps.ts` maps appIds → a dynamic import
    of a `registerNN.ts` chunk whose top level calls `registerApp`. Verify new
    chunks actually split out of the initial bundle in `out/`.
  - **The Gallery's raster assets (ADR-013 §9/§9a):** `public/pictures/` ships
    **23** photographs (46 files, 3.39 MB) — the only app with raster assets.
    `npm run pictures` regenerates them from an **explicit allow-list** in
    `scripts/build-pictures.mjs` that never globs, which is what keeps the tattoo
    *reference* close-ups and AI concept sheets in gitignored `assets-src/`.
    `src/lib/pictures.ts` answers to `docs/qa/6.2-picture-review.md`, not to the
    ADR; dimensions come from `scripts/pictures-manifest.tsv`. **The pipeline does
    not redact number plates** — the shipped ones were redacted by hand in source.
    **`painter.ts` must never import `pictures.ts`.**
  - Strict React-compiler lint rules apply — no `Math.random` in render/memo
    (seeded `mulberry32` from `src/lib/prng.ts`), frame-time uniform writes via
    material refs.
- **Zero Microsoft IP (ADR-012 §10)** — original pixel-art icons, synthesized
  audio only (no sample files ship; `public/audio/LICENSES.md`), openly-licensed
  period fonts (`public/fonts/LICENSES.md`). Minesweeper and every gag string are
  original.
- **Never commit raw client screenshots** — imagery under `public/screens/` must be
  fabricated dummy-data recreations.
- Security headers in `vercel.json` (Vercel only).

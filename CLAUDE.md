# Portfolio (Claude guide)

Static-export **Next.js 16** portfolio. Start with `README.md` for the overview;
full agent rules and conventions live in `@AGENTS.md` (imported below). Quick facts:
`npm run dev` runs on **port 3004**, `npm run build` produces a static export in
`out/`, and site content is edited in `src/lib/*.ts` — not in JSX.

The animated day↔night background is one persistent `<canvas>` in
`src/components/sky/` (`SkyScene` + `draw*.ts` helpers), governed by
[ADR-004](docs/decisions/ADR-004-animated-celestial-transition.md). It replaced the
old `Starfield`/`Cloudfield`/`BackgroundScene` pair; the ~2.2 s toggle transition
timing lives in `src/lib/theme.ts` (`THEME_TRANSITION_MS`), and the moon texture is
`public/celestial/moon.webp` (with a procedural fallback).

@AGENTS.md

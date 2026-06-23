# Handoff: Portfolio → Vercel Deployment

**Date:** 2026-06-23
**Focus:** Get the portfolio live on Vercel
**Local path:** `C:/Users/AravindKumar/Documents/Local_server/testing`
**GitHub:** https://github.com/aravindGitHub1994/my-portfolio (branch `main`, pushed)

---

## Current Status

The portfolio is **fully built, committed, and pushed to GitHub** — only deployment remains.

- Next.js 16 + TypeScript + Tailwind v4, configured for **static export** (`output: 'export'` → `./out`). See `next.config.ts`.
- 4 routes (`/`, `/projects`, `/resume`, `/contact`) + `sitemap.xml` + `robots.txt`, all prerender as static HTML. `npm run build` and `npm run lint` are clean.
- "Midnight Observatory" dark theme (celestial palette, Fraunces/Inter fonts, animated starfield hero + scroll reveals). Full design reference: `docs/design-system.md`.
- Content is **placeholder** — all isolated in `src/lib/` (`nav.ts`, `projects.ts`, `resume.ts`). Not yet customized (Issue 3.4, HITL).
- Dev server runs on **port 3004** (`npm run dev`) — ports 3000–3003 are taken by other local services; this project is registered in `../ports_mapping.md`.

Implementation history (9 of 11 plan issues done): see `implementation-plan-0001.md` and git log (6 commits, HEAD `db8eea8`).

---

## Unresolved Threads

1. **Local folder rename pending (cosmetic, blocked):** User wants the root folder renamed `testing` → `my-portfolio` to match the repo. **Cannot be done from inside a Claude Code session** — the session holds the folder open (Windows lock; both Bash and PowerShell auto-reset cwd into it). User must rename it externally: close the session, `Rename-Item testing my-portfolio` from the parent dir, reopen Claude in the new folder. Git/remote/branch are unaffected.
2. **`NEXT_PUBLIC_SITE_URL` not set:** SEO (canonical, OG, sitemap, robots) currently emits `https://example.com`. Must be set to the real Vercel URL after the first deploy. Defined in `src/lib/nav.ts` → `SITE.url` (reads the env var).
3. **`package.json` "name" is `"portfolio"`** (not `my-portfolio`) — offered to rename, user hasn't decided. Harmless for Vercel.
4. **Content still placeholder** (Issue 3.4) — can deploy first, customize later.

---

## Key References

- Architecture decision: `docs/decisions/ADR-001-next-js-static-export.md`
- Design system: `docs/design-system.md`
- Implementation plan: `implementation-plan-0001.md`
- Port registry: `../ports_mapping.md`
- Repo: https://github.com/aravindGitHub1994/my-portfolio

---

## Recommended Next Steps — Vercel Deployment

Vercel auto-detects Next.js. Because `output: 'export'` is set, Vercel serves the
static `out/` directory (no Node runtime). Two paths:

### Option A — Vercel dashboard (recommended, no CLI install)
- [ ] Go to vercel.com → **New Project** → **Import** `aravindGitHub1994/my-portfolio`.
- [ ] Framework preset: **Next.js** (auto). Build command `next build`, output is handled automatically for static export. Leave defaults.
- [ ] Add Environment Variable **`NEXT_PUBLIC_SITE_URL`** = the assigned URL (e.g. `https://my-portfolio-xxxx.vercel.app`). You may need to deploy once to learn the URL, then set the var and redeploy.
- [ ] Deploy → verify all 4 routes load, hero animation runs, no console errors.

### Option B — Vercel CLI
- [ ] `gh` is **not installed**, but Vercel CLI is separate: `npm i -g vercel`.
- [ ] `vercel login`, then `vercel` (preview) / `vercel --prod` from the project root.
- [ ] Set env var: `vercel env add NEXT_PUBLIC_SITE_URL`.

### Post-deploy
- [ ] Set `NEXT_PUBLIC_SITE_URL`, redeploy, confirm `sitemap.xml`/`robots.txt`/canonical show the real domain.
- [ ] (Optional) custom domain, Vercel Analytics.
- [ ] Then circle back to **content population (Issue 3.4)**.

### Constraints / gotchas
- **Auth actions are the user's to perform:** creating the Vercel account, OAuth-connecting GitHub, accepting terms, and clicking Deploy must be done by the user — the agent should guide, not perform these. Pushing more commits to `main` (already authed via Git Credential Manager) is fine.
- Static export: no server-side features (no API routes, no `next/image` optimization — already set `images.unoptimized`). Keep it static.
- If the GitHub repo was created with a README/initial commit, confirm `main` history matches local (it was a clean push: `[new branch] main -> main`).

---

## Recommended Skills

- **devops-engineer** — Vercel deployment config, env vars, CI/CD wiring.
- **run** — start the local dev server (port 3004) / preview the static `out/` build before deploy.
- **verify** — validate the live site (routes, responsive, console) post-deploy; covers the still-open Issue 3.2 responsive check.
- **frontend-ui-engineering** — when returning to content/polish (Issue 3.4).

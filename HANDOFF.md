# Handoff: Personal Portfolio Website Project

**Date:** 2026-06-23
**Project Location:** `C:/Users/AravindKumar/Documents/Local_server/testing`

---

## Current Status

✅ **Implemented (committed on `master`):**

| Issue | What | Status |
|---|---|---|
| 1.1 | Next.js 16 + static export (`output: 'export'`) scaffold | ✅ Done |
| 1.2 | "Midnight Observatory" design system + animated hero | ✅ Done |
| 2.1 | Header (responsive mobile menu), Footer, layout, routes | ✅ Done |
| 2.2 | About / home (hero + bio + discipline highlights) | ✅ Done |
| 2.3 | Projects showcase grid (5 placeholder projects) | ✅ Done |
| 2.4 | Resume (skills / experience timeline / education) | ✅ Done |
| 2.5 | Contact (email + social links) | ✅ Done |
| 3.1 | Static export verified — all routes emit `.html`, no server deps | ✅ Done |
| 3.3 | SEO: OG/Twitter meta, canonical, `sitemap.xml`, `robots.txt` | ✅ Done |

⏳ **Remaining (need you):**

- **3.2 Responsive cross-device test** — built mobile-first; live browser
  verification still wanted (Chrome extension wasn't connected this session).
  Preview locally with `npm run dev`.
- **3.4 Content population (HITL)** — replace placeholders (see below).
- **3.5 Launch (HITL)** — push to GitHub, connect Vercel, set site URL.

---

## Design Direction (locked in)

- **Theme:** Technical & sleek, **dark only**, celestial/astronomy aesthetic
  with hero starfield + scroll-reveal animations.
- **Palette:** Midnight Blue `#191970` base · Star Gold `#D4AF37` accent ·
  Aged Parchment `#E8DDB5` text · Dusty Plum / Forest Moss / Lilac / Silver.
- **Type:** Fraunces (serif headings) + Inter (sans body) + Geist Mono (labels).
- Full reference: `docs/design-system.md`.

---

## How to customize content (Issue 3.4)

All placeholder content lives in `src/lib/`:

- `src/lib/nav.ts` → `SITE` (your **name**, **email**, **role**, **url**) and
  `SOCIAL_LINKS` (GitHub/LinkedIn/Twitter URLs).
- `src/lib/projects.ts` → the 5 featured projects (title, summary, links).
- `src/lib/resume.ts` → skills, experience, education.
- `src/lib/disciplines.ts` → discipline labels/blurbs (rarely needs changing).
- Add a real `public/resume.pdf` (Resume page links to `/resume.pdf`).
- Profile photo: replace the `✦` placeholder circle in `src/app/page.tsx`
  with a `next/image` (remember `images.unoptimized` is on for static export).
- Optional: add an Open Graph share image and reference it in `layout.tsx`.

---

## Deployment (Issue 3.5 — your accounts)

```bash
cd C:/Users/AravindKumar/Documents/Local_server/testing
git remote add origin https://github.com/<you>/<repo>.git
git branch -M main
git push -u origin main
# Then: Vercel → New Project → import repo (auto-detects Next.js static export)
```

Set `NEXT_PUBLIC_SITE_URL` in Vercel (e.g. `https://your-name.vercel.app`) so
canonical URLs, sitemap, and OG tags use the real domain.

---

## Commands

```bash
npm run dev     # local dev server (http://localhost:3000)
npm run build   # static export → ./out
npm run lint    # eslint
```

## Key References

- `docs/decisions/ADR-001-next-js-static-export.md` — architecture decision
- `docs/design-system.md` — design tokens, components, a11y
- `implementation-plan-0001.md` — full 11-issue plan

## Notes

- **Stay within project root** (`.../testing`) per user constraint.
- **Next.js 16** has breaking changes vs. older versions — see `AGENTS.md`.
- `out/` is git-ignored (build artifact).

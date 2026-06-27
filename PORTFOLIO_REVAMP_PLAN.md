# Portfolio: Real Content + "Bring it to Life"

## Context

`my-portfolio` (Next.js 16, **static export** → Vercel Hobby, live at `my-portfolio-zeta-...vercel.app`) currently ships
the create-next scaffold's **placeholder** content: a fictional "multi-disciplinary maker" framed around
**four disciplines (Analytics · Writing · Design · Code)**, five fake projects, fake experience, and "Your Name"
throughout (all isolated in `src/lib/`). The owner — **Aravind Krishna Kumar, Manager, Data Analytics** — needs it
turned into a real recruiter-facing site that:

1. Replaces all placeholder content with his real resume, photo, and four real projects.
2. **Re-positions honestly**: he is analytics-first (GA4/GTM/SQL/CRO), with *working* (not expert) knowledge of
   Python/React/Postgres. His differentiator is **shipping production software by directing AI agents**
   (Claude Code + Gemini CLI — agentic workflows, custom skills, spec-driven dev). The copy must reflect this without
   overclaiming hand-coding depth.
3. Visually comes **alive** (per explicit request) while staying tasteful for recruiters and within Hobby/static limits.

### Decisions locked in the grill session
- **Identity:** single narrative, **no discipline-pillar grid**. Spine: *"I turn questions into shipped products — with AI as my engineering team."*
- **Project tags:** capability-based (`Agentic Build`, `Full-Stack`, `Data Pipeline`, `Automation`, `API Integration`) — **not** language tags.
- **Project layout:** compact **grid → glowing modal lightbox** (soft glowing border, **dimmed + blurred backdrop**).
- **Project links:** none — all four are **private/proprietary**; each modal shows a small **"Private project"** badge instead of an outbound link.
- **Visuals:** **Mermaid flow diagrams for all four** projects (NO screenshots — the screenshots leak a client name "APM Monaco" and real $ MMM figures). Pre-rendered to committed SVGs.
- **Resume skills:** three **proficiency tiers** — *Core strengths* / *Build with AI* / *Working knowledge*.
- **Resume PDF:** keep the download; copy existing `docs/resume.pdf` → `public/resume.pdf` as-is (formal CV).
- **Contact (public):** `krishnakumar.aravind94@gmail.com`, phone `9746444334`, **LinkedIn + GitHub** (drop Twitter/X).
- **Tool icons:** **orbiting ring** of tool icons around the hero portrait.
- **Alive extras (selected):** cursor spotlight glow · card 3D tilt-on-hover · mouse-parallax particles. (NOT count-up stats.)
- **Already agreed base effects:** multi-size/opacity particles, gravity cards (glow border + elevation lift), modal glow.

### Hard constraints
- **Static export only** — no API routes, no SSR, no `next/image` optimization. Modal/canvas/cursor/orbit are **client components**; diagrams are **committed static SVGs** (no client-side Mermaid runtime, no new shipped deps). Keeps it Hobby-safe and ToS-aligned.
- Every animation must honor `prefers-reduced-motion` (the codebase already standardizes this via `globals.css` + `Reveal`).
- No client confidential data anywhere in `public/` (no screenshots copied).

---

## Implementation

### 1. Identity / data layer (`src/lib/`)
- **`nav.ts`** — `SITE.name` → "Aravind Krishna Kumar"; `SITE.role` → e.g. *"Data Analytics Manager · Builds with AI"*; `SITE.email` → resume email. `SOCIAL_LINKS` → LinkedIn (`aravind-krishna-kumar-91058a10b`) + GitHub (`aravindGitHub1994`); **remove Twitter**. Keep `SITE.url` (already set in Vercel env).
- **Replace `disciplines.ts` → new `capabilities.ts`** — keys `agentic-build | full-stack | data-pipeline | automation | api-integration`, each with `label` + palette classes (reuse gold/moss-light/silver/lilac/plum). Full class strings (no interpolation) so Tailwind detects them, mirroring the old file.
- **`projects.ts`** — new `Project` shape: `slug, title, tagline, capabilities: CapabilityKey[], problem, approach, outcome, stack: string[], howAI: string, diagram: string (svg path), status?: "in-progress"`. Four real entries, order: **Taxonomy Builder** (flagship) → **Budget Optimizer (MMM)** → **GMC Insights** → **Personas** (`status: "in-progress"`, badge). Content sourced from `docs/projects/*` + `docs/resume.md`. Stack shown as plain text inside the modal (honest "built with", not a skill claim).
- **`resume.ts`** — replace `SKILL_GROUPS` with 3 proficiency tiers; replace `EXPERIENCE` with the 5 real roles (Assembly Global, Flatworld, Regalix, Dell, Sutherland) using tightened bullets from `resume.md`; `EDUCATION` → certifications + Chinmaya Vidyalaya. Real metrics (44 GMC sub-accounts, 19 sites, 200+ consultants, team of 18) live as static prose, not animated counters.

### 2. Mermaid diagrams → committed SVGs
- Author 4 `.mmd` files and render to `public/diagrams/{taxonomy,budget,gmc,personas}.svg` using the **mermaid-skill** (mmdc CLI; **fallback to Kroki API** if mmdc unavailable). Dark-theme styling to match "Midnight Observatory".
  - **taxonomy** — adapt the architecture flow already in `docs/projects/taxonomy-builder/README.md` (React FE → Express API + Auth/Tenant guard + Taxonomy Engine + cache + Excel workers → Postgres).
  - **budget** — MMM pipeline: Ingest/clean → Xarray geo-time panel → Meridian Bayesian model (MCMC) → BudgetOptimizer → HTML/Excel report.
  - **gmc** — from PRD: Service account → 44 GMC sub-accounts → `aggregateProductStatuses` → SQLite cache → FastAPI → React disapprovals table (filters/search).
  - **personas** — Nemotron persona dataset → segment/OCEAN selection → LLM persona simulation → marketing/QA use cases (mark conceptual/in-progress).
- Embed via plain `<img src=... alt=...>` (works under `images.unoptimized`).

### 3. Hero — portrait + orbiting tool-icon ring (`Hero.tsx` + new `OrbitRing.tsx` client)
- Copy `docs/my_picture.jpg` → `public/aravind.jpg`; circular-cropped focal portrait in the hero.
- `OrbitRing` (client): tool icons (React, Python, SQL, Postgres, Docker, BigQuery/GA4) as **inline monochrome SVGs** (new `src/lib/techIcons.ts`, simple-icons paths) positioned on a ring that rotates via CSS keyframe; **counter-rotate each icon** so they stay upright; soft glow; **pause on reduced-motion**.
- Rewrite hero copy to the single narrative; **remove** the `Analytics · Writing · Design · Code` eyebrow and the discipline pills.

### 4. Canvas upgrade (`Starfield.tsx`)
- Widen particle **size + opacity** ranges and add 2–3 depth layers; add **mouse/scroll parallax** (layer-scaled offset). Keep existing seed/resize/RAF structure and the reduced-motion static fallback.

### 5. "Alive" UI layer
- **`CursorSpotlight.tsx`** (client, mounted in `layout.tsx`): fixed `pointer-events-none` radial-gradient glow tracking the pointer; disabled on touch + reduced-motion.
- **Gravity / tilt cards:** extend `ProjectCard` (and home grid cards) with glow border + elevation lift (partly present) **plus** pointer-driven 3D tilt in a small client wrapper; tilt disabled for reduced-motion.

### 6. Projects page → grid + modal (`src/app/projects/page.tsx`)
- Split into a client **`ProjectGrid.tsx`** owning `selected` state + **`ProjectModal.tsx`**: glowing border, `backdrop-blur` + dimmed overlay, holds the diagram `<img>`, Problem→Approach→Outcome, stack line, **"How I used AI agents"** callout, capability tags, **"Private project"** badge. A11y: Esc to close, focus trap, body scroll-lock, `role="dialog"`/`aria-modal`, reduced-motion-safe transitions.
- Update `Tag.tsx`: replace `DisciplineTag` with `CapabilityTag` (reads `capabilities.ts`); keep neutral `Tag`.

### 7. Home page (`src/app/page.tsx`)
- **Remove** the "Four disciplines, one practice" section. New flow: Hero → **About** (real bio; photo now in hero so About is prose) → **How I build with AI** (3 concise points) → **Featured work** (top 3 cards → open the same modal or link to `/projects`) → CTA. Drop the ✦ avatar placeholder.

### 8. Resume page (`src/app/resume/page.tsx`)
- Render the 3 proficiency tiers (drop discipline coloring); real experience timeline + education; keep **Download résumé (PDF)** → `/resume.pdf` (copied file).

### 9. SEO / metadata / footer
- `layout.tsx` description + OG/title, `sitemap.ts`/`robots.ts` unaffected (routes unchanged). Footer role string + socials update via `nav.ts`. Optionally a short **ADR** documenting "Mermaid pre-rendered to committed SVGs for static export" (surprising-without-context; fits `docs/decisions/`).

### Files (representative)
- Edit: `src/lib/{nav,projects,resume}.ts`, `src/components/{Hero,Starfield,ProjectCard,Tag}.tsx`,
  `src/app/{page,projects/page,resume/page,contact/page,layout}.tsx`.
- New: `src/lib/{capabilities,techIcons}.ts`, `src/components/{OrbitRing,CursorSpotlight,ProjectGrid,ProjectModal}.tsx`,
  `public/aravind.jpg`, `public/resume.pdf`, `public/diagrams/*.svg`.
- Remove/replace: `src/lib/disciplines.ts` (superseded by `capabilities.ts`).

---

## Verification
- `npm run lint` and `npm run build` stay clean and the **static export to `out/`** succeeds (proves no SSR/runtime crept in).
- `npm run dev` (port **3004**) — eyeball all 4 routes: hero portrait + orbiting ring, multi-size parallax particles, cursor spotlight, card glow/tilt, project modal (glow + blurred backdrop, diagram, "Private project" badge), resume tiers + PDF download, real contact links.
- Toggle **prefers-reduced-motion** (DevTools rendering) → orbit/particles/tilt/cursor-glow pause, content fully usable.
- Confirm **no screenshots** and no client data exist anywhere under `public/`; diagrams contain no client names/figures.
- Keyboard pass on the modal: open, Esc closes, focus trapped, scroll locked.
- (Optional) deploy preview on Vercel; verify Hobby build (static, no functions).

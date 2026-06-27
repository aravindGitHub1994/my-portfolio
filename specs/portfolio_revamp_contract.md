# Portfolio Revamp — Shared Contract (Two-Agent Build)

This is the single source of truth coordinating **Agent A (Data/Content)** and **Agent B (Interactive UI)**.
Both agents work in the SAME working tree but own DISJOINT files. Neither may edit the other's files.
Cross-file *imports* are expected and fine; cross-file *editing* is forbidden.

The full intent is in `PORTFOLIO_REVAMP_PLAN.md` (read it). This file pins the exact interfaces so the
two streams compose without conflict.

---

## Hard project facts
- Next.js 16, **static export** (`output: "export"`, `images.unoptimized`, `trailingSlash: true`). No SSR, no API
  routes, no `next/image` optimization, no new runtime npm deps. Diagrams are **pre-rendered committed SVGs**.
- `@/*` → `src/*`. Palette tokens in `globals.css`: `bg, surface, surface-2, midnight, ink, ink-muted, ink-subtle,
  gold, gold-soft, plum, moss, moss-light, lilac, silver, bronze, line, line-strong`. Fonts: serif (headings),
  sans (body), mono (`font-mono`). Existing keyframes: `twinkle`, `float`, `shimmer`; helper class `.text-gilt`.
- Every animation MUST honor `prefers-reduced-motion` (globals.css already neutralizes CSS animation/transition;
  JS-driven motion must also check `window.matchMedia("(prefers-reduced-motion: reduce)")`).
- All `<a target="_blank">` keep `rel="noopener noreferrer"`. No client-confidential data anywhere in `public/`.

---

## SHARED TYPE CONTRACT (Agent A creates these; Agent B imports them — names/shapes are FROZEN)

### `src/lib/capabilities.ts`  (owner: A)
```ts
export type CapabilityKey =
  | "agentic-build" | "full-stack" | "data-pipeline" | "automation" | "api-integration";

export interface Capability {
  key: CapabilityKey;
  label: string;          // e.g. "Agentic Build", "Full-Stack", "Data Pipeline", "Automation", "API Integration"
  tag: string;            // FULL Tailwind class string (no interpolation) for the badge, mirroring old disciplines.ts
  text: string;           // Tailwind text color class for accents
}

export const CAPABILITIES: Record<CapabilityKey, Capability>;   // one entry per key
export const CAPABILITY_LIST: Capability[];                      // Object.values(CAPABILITIES)
```
Palette mapping: agentic-build→gold, full-stack→moss-light, data-pipeline→silver, automation→lilac,
api-integration→plum. Use the same full class-string style as the old `disciplines.ts`
(`border-<c>/40 bg-<c>/10 text-<c>` and `text-<c>`).

### `src/lib/projects.ts`  (owner: A)  — **defines and EXPORTS the `Project` type here now**
```ts
import type { CapabilityKey } from "@/lib/capabilities";

export interface Project {
  slug: string;                 // "taxonomy" | "budget" | "gmc" | "personas"  (also the diagram filename)
  title: string;
  tagline: string;              // one-line hook
  capabilities: CapabilityKey[];
  problem: string;
  approach: string;
  outcome: string;
  stack: string[];              // plain "built with" tech, shown as text (NOT a skill claim)
  howAI: string;                // "How I used AI agents" callout text
  diagram: string;              // public path, e.g. "/diagrams/taxonomy.svg"
  status?: "in-progress";
}

export const PROJECTS: Project[];   // order: taxonomy, budget, gmc, personas(status:"in-progress")
```
> NOTE: the OLD `Project` interface lived in `ProjectCard.tsx`. It now lives in `projects.ts`. Agent B imports
> `import type { Project } from "@/lib/projects"`.

### `src/lib/techIcons.ts`  (owner: A)
```ts
export interface TechIcon {
  name: string;   // accessible label, e.g. "React"
  path: string;   // SVG path `d` data for a 24x24 viewBox monochrome glyph (single-color, simple-icons)
}
export const TECH_ICONS: TechIcon[];   // ~6: React, Python, PostgreSQL, Docker, BigQuery, GA4
```
Source the `d` data from real simple-icons (fetch the official SVGs; do NOT invent path data). Slugs:
react, python, postgresql, docker, googlebigquery, googleanalytics. Strip to the single `<path d="...">`.

### `src/lib/nav.ts`  (owner: A) — keep exported names: `NAV_LINKS`, `SITE`, `SOCIAL_LINKS`, `NavLink`, `SocialLink`.
- `SITE.name = "Aravind Krishna Kumar"`, `SITE.role = "Data Analytics Manager · Builds with AI"`,
  `SITE.email = "krishnakumar.aravind94@gmail.com"`. Keep `SITE.url` env fallback exactly as-is.
- `SOCIAL_LINKS`: LinkedIn (`https://linkedin.com/in/aravind-krishna-kumar-91058a10b`) + GitHub
  (`https://github.com/aravindGitHub1994`). REMOVE Twitter.

### `src/lib/resume.ts`  (owner: A)
Replace `SKILL_GROUPS` with three proficiency tiers; replace `EXPERIENCE` (5 real roles) and `EDUCATION`
(certs + Chinmaya Vidyalaya). Suggested shapes (A may refine, but resume/page.tsx is also A's so keep them in sync):
```ts
export interface SkillTier { name: string; blurb?: string; skills: string[]; }
export const SKILL_TIERS: SkillTier[];   // "Core strengths" / "Build with AI" / "Working knowledge"
export interface ExperienceItem { role: string; org: string; period: string; points: string[]; }
export const EXPERIENCE: ExperienceItem[];
export interface EducationItem { credential: string; institution: string; period?: string; }
export const EDUCATION: EducationItem[];
```
Do NOT keep any `DisciplineKey` import.

### Public assets (owner: A)
- `public/aravind.jpg`  ← copy of `docs/my_picture.jpg`
- `public/resume.pdf`   ← copy of `docs/resume.pdf`
- `public/diagrams/{taxonomy,budget,gmc,personas}.svg`  (+ `.mmd` sources kept alongside or in `docs/`)

---

## FILE OWNERSHIP (do not cross)

### Agent A owns (Data / Content / Diagrams / Resume+Contact pages)
- EDIT: `src/lib/nav.ts`, `src/lib/resume.ts`
- REWRITE: `src/lib/projects.ts`
- NEW: `src/lib/capabilities.ts`, `src/lib/techIcons.ts`
- DELETE: `src/lib/disciplines.ts`
- EDIT: `src/app/resume/page.tsx`, `src/app/contact/page.tsx`
- NEW assets: `public/aravind.jpg`, `public/resume.pdf`, `public/diagrams/*.svg` (+ `.mmd`)
- OPTIONAL: an ADR in `docs/decisions/` ("Mermaid pre-rendered to committed SVGs for static export")

### Agent B owns (Interactive UI / Home+Projects pages / layout)
- EDIT: `src/components/Tag.tsx`, `src/components/ProjectCard.tsx`, `src/components/Hero.tsx`,
  `src/components/Starfield.tsx`
- NEW: `src/components/OrbitRing.tsx`, `src/components/CursorSpotlight.tsx`,
  `src/components/ProjectGrid.tsx`, `src/components/ProjectModal.tsx`
- EDIT: `src/app/page.tsx`, `src/app/projects/page.tsx`, `src/app/layout.tsx`

### Shared/untouched by both (the verifier owns final build): everything else, incl. `Header.tsx`, `Footer.tsx`
(read `SITE.role`/socials from nav automatically), `Button.tsx`, `Reveal.tsx`, `SectionHeader.tsx`,
`globals.css`, `sitemap.ts`, `robots.ts`. Do NOT edit these unless your section explicitly lists them.
(If B genuinely needs a new keyframe it must ask the verifier — do not edit globals.css unilaterally.)

---

## Diagram briefs (Agent A, dark theme to match "Midnight Observatory"; NO client names, NO $ figures)
- **taxonomy.svg** — React FE → Express API (authMiddleware JWT cookie → clientContext/tenant guard → Taxonomy
  Engine + 2-tier cache + Excel worker_threads) → PostgreSQL.
- **budget.svg** — Ingest/clean → Xarray geo-time panel → Meridian Bayesian model (MCMC) → BudgetOptimizer →
  HTML/Excel report.
- **gmc.svg** — Service account → 44 GMC sub-accounts → aggregateProductStatuses → SQLite cache → FastAPI →
  React disapprovals table (filters/search).
- **personas.svg** — Nemotron persona dataset → segment/OCEAN selection → LLM persona simulation →
  marketing/QA use cases (mark conceptual / in-progress).
Use mmcd CLI if available, else **Kroki API** (POST mermaid → SVG). Embed via plain `<img src alt>`.

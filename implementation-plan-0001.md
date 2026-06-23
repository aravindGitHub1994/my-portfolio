# Implementation Plan: Personal Portfolio Website

**Date:** 2026-06-23  
**Framework:** Next.js with static export  
**Hosting:** Vercel (free tier)  
**Status:** Draft — Awaiting approval

## Overview
Break the portfolio website into vertical slices. Each slice is independently demontrable and builds toward the complete site.

---

## Proposed Vertical Slices

### Phase 1: Foundation

#### Issue 1.1: Project Setup & Deployment Pipeline
**Type:** AFK  
**Blocked by:** None  
**Effort:** 1-2 hours

Initialize Next.js project with static export, GitHub integration, and Vercel deployment pipeline.

**What to build:**
- New Next.js project in `C:/Users/AravindKumar/Documents/Local_server/testing`
- Configure `next.config.js` with `output: 'export'` for static export
- Set up `package.json` scripts: `dev`, `build`, `start`
- Initialize Git repo and push to GitHub
- Connect to Vercel and deploy (Vercel auto-detects Next.js)
- Skeleton app accessible at `<project-name>.vercel.app`

**Acceptance criteria:**
- [ ] Next.js app initializes without errors
- [ ] `npm run build` produces static HTML in `.next/out`
- [ ] Site deploys to Vercel and is publicly accessible
- [ ] Skeleton page (placeholder index) renders on Vercel domain

---

#### Issue 1.2: Design System & Component Library
**Type:** HITL  
**Blocked by:** Issue 1.1  
**Effort:** 2-3 hours

Define visual design, color scheme, typography, and build reusable component library using frontend-ui-engineering.

**What to build:**
- Finalize design direction (visual style, color palette, typography)
- Create Tailwind CSS configuration (v4) for design tokens
- Implement core components: Header, Navigation, Footer, ProjectCard, SectionHeader, Button, Tag
- Establish responsive breakpoints (mobile-first)
- Document component usage (simple examples)

**Acceptance criteria:**
- [ ] Design system documented (colors, fonts, spacing, breakpoints)
- [ ] 5-7 core components created and exported
- [ ] Components are responsive and follow design guidance
- [ ] All components imported and used in layout

---

### Phase 2: Core Pages

#### Issue 2.1: Navigation & Layout Structure
**Type:** AFK  
**Blocked by:** Issue 1.2  
**Effort:** 1-2 hours

Build main layout with header, navigation, and routing between sections.

**What to build:**
- Create RootLayout component with header, nav, footer
- Implement Next.js App Router pages: `/`, `/projects`, `/resume`, `/contact`
- Add responsive navigation (desktop menu + mobile hamburger menu)
- Set up SEO meta tags template
- Style layout with Tailwind using design tokens

**Acceptance criteria:**
- [ ] Navigation works across all pages (no 404s)
- [ ] Mobile menu toggles and closes
- [ ] Layout is consistent across pages
- [ ] Home page is the About/intro page

---

#### Issue 2.2: About Section
**Type:** AFK  
**Blocked by:** Issue 2.1  
**Effort:** 1 hour

Build the About/home page with bio and profile.

**What to build:**
- Create `/` (About) page with hero section
- Add profile image placeholder
- Write autopopulated bio text (multi-disciplinary intro)
- Add brief discipline highlights (analytics, writing, design, code)
- Link to other sections (CTA to Projects, Resume)

**Acceptance criteria:**
- [ ] About page displays hero with profile image
- [ ] Bio text is visible and responsive
- [ ] Navigation to other sections works from About
- [ ] Page is SEO-ready (meta tags set)

---

#### Issue 2.3: Portfolio Projects Showcase
**Type:** AFK  
**Blocked by:** Issue 2.1  
**Effort:** 2-3 hours

Build projects page with 3-5 featured projects across disciplines.

**What to build:**
- Create `/projects` page structure
- Implement ProjectCard component with image, title, description, discipline tags
- Add 3-5 autopopulated featured projects (mix of analytics, writing, design, code)
- Implement discipline filtering/tabs (optional; can be static cards if simpler)
- Add project details/links (portfolio URL or details)
- Responsive grid layout (mobile: 1 col, tablet: 2 cols, desktop: 3 cols)

**Acceptance criteria:**
- [ ] All 5 projects display with images and descriptions
- [ ] Discipline tags are visible (analytics/writing/design/code)
- [ ] Cards are responsive across devices
- [ ] Optional: Filtering by discipline works if implemented

---

#### Issue 2.4: Resume & Skills Section
**Type:** AFK  
**Blocked by:** Issue 2.1  
**Effort:** 1.5 hours

Build resume page with skills, experience, and education.

**What to build:**
- Create `/resume` page
- Section 1: Skills by discipline (analytics, writing, design, code)
- Section 2: Work experience (autopopulated placeholders)
- Section 3: Education (autopopulated placeholders)
- Optional: Download resume button (links to placeholder PDF)
- Responsive layout (vertical on mobile, multi-column on desktop)

**Acceptance criteria:**
- [ ] Skills organized by discipline
- [ ] Experience timeline displays correctly
- [ ] All sections are responsive
- [ ] Layout matches design system

---

#### Issue 2.5: Contact & Social Links
**Type:** AFK  
**Blocked by:** Issue 2.1  
**Effort:** 30 mins

Build contact page/section with social links and email.

**What to build:**
- Create `/contact` page or embed in footer
- Display email (or mailto link)
- Add social media links (GitHub, LinkedIn, Twitter, etc.) — autopopulated with placeholder URLs
- Simple centered layout with icon links
- Privacy-aware (no forms, just links)

**Acceptance criteria:**
- [ ] All contact links are clickable and functional
- [ ] Responsive layout
- [ ] Links open in new tab

---

### Phase 3: Polish & Launch

#### Issue 3.1: Static Export Verification & Build Optimization
**Type:** AFK  
**Blocked by:** Issues 2.2–2.5  
**Effort:** 1 hour

Verify static export works correctly and optimize build output.

**What to build:**
- Test `npm run build` produces valid static output (HTML, CSS, JS in `.next/out`)
- Verify no server-side dependencies leak into build
- Optimize images (if added) using Next.js Image component
- Test build locally before deploying
- Verify Vercel detects and deploys correctly

**Acceptance criteria:**
- [ ] Static build completes without errors
- [ ] All pages are `.html` files in build output
- [ ] No console errors or warnings in deployment
- [ ] Site loads correctly from Vercel after push

---

#### Issue 3.2: Responsive Design & Cross-Device Testing
**Type:** AFK  
**Blocked by:** Issue 3.1  
**Effort:** 1 hour

Test responsiveness and verify site works across devices/browsers.

**What to build:**
- Test on mobile (small screens < 640px)
- Test on tablet (medium screens 640–1024px)
- Test on desktop (large screens > 1024px)
- Verify navigation, images, text all render correctly
- Check for layout shifts or overflow
- Test in Chrome, Safari, Firefox (if possible)

**Acceptance criteria:**
- [ ] No layout breaks on any screen size
- [ ] Images scale appropriately
- [ ] Navigation is accessible on mobile
- [ ] No horizontal scroll on mobile

---

#### Issue 3.3: SEO & Meta Tags
**Type:** AFK  
**Blocked by:** Issue 3.1  
**Effort:** 30 mins

Add SEO metadata and verify search engine indexing readiness.

**What to build:**
- Set canonical URLs
- Add Open Graph meta tags (for social sharing)
- Add description and keywords for each page
- Verify robots.txt allows crawling
- Test with Google Search Console (or similar) to ensure indexability

**Acceptance criteria:**
- [ ] Each page has meta description and title
- [ ] Open Graph tags present (image, description, URL)
- [ ] No robots/noindex directives blocking crawlers
- [ ] Sitemap can be generated (or manually created)

---

#### Issue 3.4: Content Population & Customization (HITL)
**Type:** HITL  
**Blocked by:** Issue 2.3 (projects), Issue 2.4 (resume)  
**Effort:** Variable (depends on content)

Replace placeholder content with actual portfolio pieces.

**What to build:**
- Gather actual project descriptions, images, links
- Update resume with real skills, experience, education
- Update bio/about section with personal intro
- Update social links with real URLs
- Upload actual portfolio images (or optimize placeholders)

**Acceptance criteria:**
- [ ] All placeholder text replaced with real content
- [ ] Portfolio images uploaded and optimized
- [ ] Links to actual projects/portfolios work
- [ ] Resume reflects current skills and experience

---

#### Issue 3.5: Production Deployment & Launch
**Type:** AFK  
**Blocked by:** Issues 3.2, 3.3, 3.4  
**Effort:** 30 mins

Final deployment to production and launch.

**What to build:**
- Ensure all content is finalized
- Verify Vercel production deployment
- (Optional) Add custom domain to Vercel
- Set up analytics (e.g., Vercel Analytics or Google Analytics)
- Announce portfolio (share on LinkedIn, Twitter, etc.)

**Acceptance criteria:**
- [ ] Site is live at Vercel subdomain (or custom domain)
- [ ] All content is accurate and final
- [ ] Analytics are collecting data (if set up)
- [ ] Portfolio is accessible and fully functional

---

## Dependency Graph

```
1.1 (Setup)
  ↓
1.2 (Design System)
  ↓
2.1 (Navigation & Layout)
  ├→ 2.2 (About)
  ├→ 2.3 (Projects)
  ├→ 2.4 (Resume)
  └→ 2.5 (Contact)
       ↓
     3.1 (Static Export Verification)
       ↓
     3.2 (Responsive Testing)
       ↓
     3.3 (SEO)
       ↓
  3.4 (Content Population) — Parallel with 3.2–3.3
       ↓
     3.5 (Launch)
```

---

## Summary

- **Total Issues:** 11
- **AFK (Auto):** 9
- **HITL (Human):** 2 (design system, content population)
- **Est. Timeline:** 2–3 days for full implementation + content prep

---

## Next Steps

1. User reviews and approves/adjusts issue breakdown
2. Convert approved issues to GitHub/Linear issues (if using issue tracker)
3. Begin implementation with Issue 1.1 (Project Setup)
4. Use frontend-ui-engineering skill for Issue 1.2 (Design System)

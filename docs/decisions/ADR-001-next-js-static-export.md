# ADR-001: Use Next.js with Static Export for Portfolio Website

## Status
Accepted

## Date
2026-06-23

## Context
We are building a personal portfolio website to showcase work across multiple disciplines (analytics, writing, design, code). Key requirements and constraints:
- **Content**: 3-5 featured projects, About section, Resume/Skills, Contact links
- **Interactivity**: None — purely static browsable content, no forms or dynamic features
- **Hosting**: Vercel (free tier)
- **Performance**: Fast load times, low bandwidth footprint
- **Deployment**: Simple one-click Vercel deployment from GitHub
- **Maintenance**: Low operational overhead (no backend to manage)

## Decision
Use **Next.js with static export** (`next export`) deployed to Vercel.

## Alternatives Considered

### Plain HTML/CSS + Static Hosting
- **Pros**: Minimal overhead, fastest load times, no build step
- **Cons**: No component reusability, hard to manage 3-5 projects with consistent styling, no easy templating
- **Rejected**: For a multi-discipline portfolio with structured projects, a component-based approach is cleaner and more maintainable

### React SPA (client-side only)
- **Pros**: Component-based, flexible
- **Cons**: All JavaScript ships to browser, slower initial load, poor SEO for portfolio content, no static generation benefit
- **Rejected**: Portfolio content should be pre-rendered and SEO-optimized; client-side rendering wastes resources

### Gatsby
- **Pros**: Built specifically for static sites, excellent image optimization, rich plugin ecosystem
- **Cons**: Steeper learning curve, requires GraphQL knowledge, larger build footprint
- **Rejected**: Next.js is simpler for this use case and has equally good Vercel integration

### Hugo / Jekyll (Static Site Generators)
- **Pros**: Lightweight, fast builds, minimal learning curve
- **Cons**: Not component-based, harder to design custom layouts without HTML/CSS expertise, weaker ecosystem for interactive components if needed later
- **Rejected**: Next.js provides better balance of ease-of-use and flexibility for a portfolio that may evolve

## Consequences

### Positive
- **Vercel Integration**: Native support for Next.js; one-click deployment from GitHub, zero configuration
- **Static Output**: `next export` generates pure HTML/CSS/JS, no server required — truly static
- **SEO**: Pre-rendered HTML enables search engines to crawl portfolio content
- **Performance**: Fast page loads, can be cached globally on Vercel's CDN
- **Component Reusability**: Share components (ProjectCard, SectionHeader, etc.) across pages
- **Future Flexibility**: If portfolio grows to include blog or dynamic content, Next.js supports adding server-side rendering without major refactor

### Negative
- **Overkill for Simple Site**: More build tooling and configuration than a basic static site needs
- **Node.js Dependency**: Requires Node.js for development; slightly more setup than pure HTML
- **Learning Curve**: Team/future maintainers need Next.js familiarity (though widespread, not zero cost)

## Implementation Notes

- Use `next export` in build configuration (set `output: 'export'` in `next.config.js`)
- Build step runs locally or in CI/CD; Vercel auto-detects and deploys static output
- No server-side rendering (SSR) needed; all pages pre-built at build time
- Environment variables can be used at build time for content endpoints (if added later)

## Related Decisions
- ADR-002 (if written): Hosting platform and Vercel deployment strategy
- ADR-003 (if written): Component architecture for portfolio sections

## References
- [Next.js Static Export Docs](https://nextjs.org/docs/pages/building-your-application/deploying/static-exports)
- [Vercel Next.js Deployment](https://vercel.com/docs/frameworks/nextjs)

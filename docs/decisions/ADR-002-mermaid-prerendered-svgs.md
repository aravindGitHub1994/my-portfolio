# ADR-002: Mermaid Diagrams Pre-Rendered to Committed SVGs

## Status
Accepted

## Date
2026-06-25

## Context
The projects page needs an architecture/flow visual for each of the four real
projects (Taxonomy Builder, Budget Optimizer, GMC Insights, Personas).
Screenshots were ruled out — the only screenshots available leak a client name
and real spend/MMM figures, which cannot appear anywhere in `public/` per the
no-client-data constraint. Mermaid flowcharts were chosen instead: they convey
the architecture/pipeline shape without exposing any proprietary data.

The site is a Next.js static export (`output: "export"`) with no server
runtime, no API routes, and a hard constraint against new shipped runtime
dependencies. Mermaid's own renderer is a sizeable client-side JS library —
shipping it to render four static diagrams would bloat the bundle for content
that never changes after authoring.

## Decision
Author each diagram as a `.mmd` Mermaid source file, render it to SVG once at
authoring time, and commit the SVG to `public/diagrams/`. Pages embed the SVG
via a plain `<img src=... alt=...>`, which works unmodified under
`images.unoptimized`. The `.mmd` sources are committed alongside the SVGs in
the same directory so the diagrams can be regenerated if the architecture
changes.

Rendering used the **Kroki API** (`POST` the `.mmd` text to
`https://kroki.io/mermaid/svg`) rather than the local `mmdc` CLI, because
`mmdc` requires a headless Chrome (via Puppeteer) that is not installed on
this machine and the project has no reason to add that dev dependency for a
one-time render. Each diagram uses a Mermaid `%%{init}%%` theme-variables
block matched to the site's "Midnight Observatory" palette (gold/moss/silver
accents on a transparent background) so it reads correctly embedded on the
dark page background.

## Alternatives Considered

### Client-side Mermaid rendering
- **Pros**: Diagrams could be edited as plain text with no separate render step.
- **Cons**: Ships a non-trivial JS runtime for content that's static after
  authoring; adds a new runtime dependency the project constraints disallow;
  no benefit since the site never lets users edit diagrams.
- **Rejected**.

### Real product screenshots
- **Pros**: Most concrete, "this is the actual app" visual.
- **Cons**: The only screenshots available expose a client name and dollar
  figures — a hard no per the project's confidentiality constraint.
- **Rejected**.

### Hand-drawn/static illustration per project
- **Pros**: Full creative control, no tooling dependency.
- **Cons**: Significantly more authoring time for four diagrams; harder to
  keep accurate as architecture details are corrected.
- **Rejected** in favor of Mermaid's text-based, easily-revised syntax.

## Consequences

### Positive
- Zero added runtime JS — diagrams are static assets like any other image.
- No client-confidential data anywhere in the repo or build output.
- `.mmd` sources stay in version control, so any diagram can be regenerated
  if the underlying architecture changes (re-run the Kroki call, or use
  `mmdc` locally if a headless Chrome is later installed).

### Negative
- Diagrams are not interactive and won't auto-update if the architecture
  changes — regenerating requires a manual render step (Kroki or `mmdc`).
- Depends on the Kroki public API being reachable at authoring time; this is
  a one-time cost (the output is committed), not a build- or run-time
  dependency.

## Related Decisions
- ADR-001: Next.js static export (this decision inherits that constraint set).

## References
- [Kroki](https://kroki.io)
- [Mermaid theming](https://mermaid.js.org/config/theming.html)

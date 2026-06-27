import type { CapabilityKey } from "@/lib/capabilities";

export interface Project {
  /** Also the diagram filename (public/diagrams/<slug>.svg). */
  slug: string;
  title: string;
  /** One-line hook. */
  tagline: string;
  capabilities: CapabilityKey[];
  problem: string;
  approach: string;
  outcome: string;
  /** Plain "built with" tech, shown as text — not a skill claim. */
  stack: string[];
  /** "How I used AI agents" callout text. */
  howAI: string;
  /** Public path, e.g. "/diagrams/taxonomy.svg". */
  diagram: string;
  status?: "in-progress";
}

export const PROJECTS: Project[] = [
  {
    slug: "taxonomy",
    title: "Taxonomy Builder",
    tagline:
      "A multi-tenant platform that turns marketing naming conventions from a spreadsheet headache into a governed, auditable workflow.",
    capabilities: ["agentic-build", "full-stack", "automation"],
    problem:
      "Activation teams hand-typed campaign naming strings — Campaign → Ad Set → Creative — across multiple channels and clients, with no shared dictionary and no audit trail. Naming drift broke downstream reporting and cost analysts hours per launch.",
    approach:
      "Designed a reactive hierarchy builder backed by a per-channel rules and dictionary engine, with a recursive taxonomy generator on the backend and a debounced, memoized frontend so large campaign trees stay responsive. Layered in JWT-based auth with a fail-closed, per-tenant access guard so one login can be scoped to a subset of clients, and a two-tier cache in front of Postgres to keep generation fast at scale.",
    outcome:
      "Shipped a Dockerized, multi-tenant web app now used by the activation team for day-to-day taxonomy generation: bulk dictionary import, per-channel UTM rule builders, immutable versioned Excel exports with a full audit log, and a reporting SQL generator that reverses taxonomy strings back into dimensions for BigQuery/PostgreSQL.",
    stack: ["React", "TypeScript", "Express", "PostgreSQL", "Docker"],
    howAI:
      "Directed Claude Code through spec-driven development end to end — architecture decisions captured as ADRs before code, the recursive taxonomy engine and the fail-closed tenant guard built from written specs, and regression coverage added alongside each feature rather than after.",
    diagram: "/diagrams/taxonomy.svg",
  },
  {
    slug: "budget",
    title: "Budget Optimizer (MMM)",
    tagline:
      "A Bayesian marketing-mix-modeling pipeline that turns multi-market spend and revenue history into a defensible budget reallocation.",
    capabilities: ["data-pipeline", "agentic-build", "automation"],
    problem:
      "Spend was allocated across channels and geographies on instinct rather than evidence, with no consistent way to compare incremental return across markets or to test how a reallocated budget would perform before committing real spend.",
    approach:
      "Built a repeatable pipeline: ingest and clean multi-market spend/KPI history, align it into a geo-time panel with Xarray, and fit a Bayesian marketing-mix model (Google Meridian, MCMC sampling) with ROI-based priors so results stay business-interpretable. Validated convergence on R-hat and effective sample size before trusting any output, then ran the model's budget optimizer under fixed- and flexible-budget scenarios with per-channel spend constraints.",
    outcome:
      "Delivered a reusable optimization workflow that produces an HTML report (response curves, channel contributions) and an Excel export of recommended reallocations — giving stakeholders a model-backed answer to \"where should the next dollar of spend go\" instead of a guess.",
    stack: ["Python", "Pandas", "Xarray", "Google Meridian", "JAX"],
    howAI:
      "Used Claude Code and Gemini CLI as the implementation team for the modeling pipeline — translating MMM domain requirements (priors, spline knots, convergence thresholds) into working Python, and codifying hard-won \"gotchas\" (Meridian's strict dimension naming, API churn between versions) as a standing project context so they get caught automatically on the next run.",
    diagram: "/diagrams/budget.svg",
  },
  {
    slug: "gmc",
    title: "GMC Insights",
    tagline:
      "A monitoring dashboard that aggregates product disapprovals across 44 Google Merchant Center sub-accounts into one searchable table.",
    capabilities: ["api-integration", "full-stack", "data-pipeline"],
    problem:
      "Feed health had to be checked sub-account by sub-account across 44 separate Google Merchant Center accounts, with no consolidated view — making it slow to spot a widespread disapproval issue versus a one-off.",
    approach:
      "Authenticated a single service account as admin on the parent multi-client account, then used the Merchant API's account and product-status endpoints to discover sub-accounts and pull aggregate disapproval data on demand. Cached results in SQLite to stay well inside API quota, and exposed it through a FastAPI backend to a React table with sub-account, issue-type, and free-text filtering.",
    outcome:
      "Replaced manual per-account checking with a single live table covering all 44 stores — filterable by sub-account or issue type, with a direct link to Google's fix guidance per issue code, so the team can triage by scope (one store vs. a feed-wide problem) instead of guessing.",
    stack: ["Python", "FastAPI", "React", "TypeScript", "SQLite"],
    howAI:
      "Had Claude Code drive the build from a written PRD and ADRs — the service-account auth decision, the API call strategy (discovery → aggregate status → on-demand drill-down), and the SQLite caching layer were all specified first and implemented against that spec, keeping Merchant API quota usage predictable from day one.",
    diagram: "/diagrams/gmc.svg",
  },
  {
    slug: "personas",
    title: "Personas",
    tagline:
      "Exploring synthetic, privacy-safe personas — built from a large demographic dataset — as a stand-in audience for testing campaign messaging.",
    capabilities: ["data-pipeline", "agentic-build"],
    problem:
      "Testing campaign messaging or product copy against real demographic and psychographic segments usually means either expensive panel research or handling real user data with all its privacy overhead.",
    approach:
      "Working with a large, commercially-permissive synthetic persona dataset (millions of records, OCEAN personality traits plus socio-professional and geographic fields) to select representative segments and simulate how different personas would respond to campaign messaging or product copy, entirely without touching real PII.",
    outcome:
      "In progress — early use cases under evaluation include market-segmentation pitch testing, cross-market message resonance checks, and bias/localization stress-testing for AI-generated copy, with no real user data involved at any stage.",
    stack: ["Python", "LLM APIs", "Pandas"],
    howAI:
      "Using Claude Code to prototype the segment-selection and persona-simulation logic conceptually before any production use — this is the earliest-stage project of the four and is explicitly framed here as exploratory, not shipped.",
    diagram: "/diagrams/personas.svg",
    status: "in-progress",
  },
];

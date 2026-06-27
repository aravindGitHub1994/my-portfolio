# PRD: GMC Monitoring Insights WebApp

> Product requirements for the GMC Monitoring Insights dashboard. Architectural decisions live in
> `docs/adr/`. This file preserves the product spec previously held in the (now removed)
> `docs/adr/ADR-001.md` and `docs/implementation plans/implementation-plan-001.md`, updated to
> reflect the service-account auth decision ([ADR-001](adr/ADR-001.md)) and the simplified MVP
> frontend.

## Problem Statement
A user managing 44 Google Merchant Center (GMC) sub-accounts needs a consolidated way to monitor
product disapprovals. Tracking feed health across dozens of stores manually is intensive, making
it hard to find the specific products failing Google's requirements.

## Solution
A monitoring dashboard that aggregates **disapproved products** from all 44 sub-accounts into a
single view, with on-demand filtering by sub-account, issue type, and free-text product search.

## MVP Scope — Disapproved Products Table
The first deliverable is a **single flat table** listing disapproved items across all sub-accounts:

- **Rows:** one per disapproved product (sub-account, product title, product ID, issue type/code,
  failing attribute value, Google support link).
- **Filter — sub-account:** select a single sub-account, or **ALL** (default).
- **Filter — issue type:** narrow rows to a specific item-level issue code.
- **Search box:** free-text filter across individual products (title / ID).

No charts, leaderboard, or side-drawer in the MVP — see *Deferred* below.

## User Stories (MVP)
1. **As a user**, I want one table listing disapproved products across all 44 sub-accounts, so I
   can see every failing item in one place.
2. **As a user**, I want to filter the table by sub-account (or view ALL), so I can focus on one
   store at a time.
3. **As a user**, I want to filter by issue type, so I can identify widespread feed problems.
4. **As a user**, I want a search box to find individual products by title or ID.
5. **As a user**, I want a direct Google support link per issue type, so I know how to fix it.
6. **As a user**, I want data cached locally and refreshed on-demand/daily, so the dashboard stays
   fast despite the number of sub-accounts.

## Deferred (post-MVP, previously specced — preserved for future work)
- **Global Leaderboard:** sub-accounts with disapproval rate (`disapproved / total`) > **5%**.
- **Top Issues visualization:** bar chart of the Top 10 global issue codes.
- **Top-3 Alert Box:** highlight the 3 issue codes affecting the most items.
- **Side-Drawer drill-down:** richer per-product detail overlay with pagination for large lists.

## Architecture (see ADRs for rationale)
- **Backend:** FastAPI (Python, async) — orchestrates 44+ Merchant API calls. Port `8002`.
- **Frontend:** React (TypeScript) + Vanilla CSS. Port `3003`.
- **Persistence:** SQLite — local cache of `AggregateProductStatus` / product data to minimize
  Merchant API quota usage.
- **Auth:** **Service account** registered as Admin on the parent MCA — see
  [ADR-001](adr/ADR-001.md). (Replaces the previously planned interactive OAuth Setup Wizard.)
- **API strategy:**
  - Discovery: `accounts.listSubaccounts` under the configured parent MCA.
  - Overview: `accounts.aggregateProductStatuses.list`.
  - Drill-down detail: `accounts.products.list` (on-demand, filtered).

## Out of Scope
- **Issue resolution actions** — monitoring only; no writes/triggers via the API.
- **Account suspension monitoring** — focused strictly on product disapprovals.
- **Multi-parent support** — exactly one parent MCA in the initial version.
- **RenderedIssues endpoint** — simple `ItemLevelIssue` metadata only; no regional breakdowns.

## Testing Decisions
- **Behavioral:** selecting a sub-account / issue type correctly filters the table rows.
- **Integration:** mock Merchant API responses; verify SQLite cache aggregates counts correctly
  across multiple accounts.
- **UI validation:** table handles large lists (>1000 rows) via pagination / lazy rendering.

## Security Notes
- Service-account JSON key and `PARENT_MCA_ID` come from `.env` / a mounted secret; **never
  logged**.
- SQLite database stored in a user-local directory.
- Currently using **placeholder values** in `.env.template` until the real JSON key, secret, and
  service-account email are available.

---
*Last updated: June 2026*

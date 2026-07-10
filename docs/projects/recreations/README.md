# Screenshot recreations (ADR-006 §7/§7a)

Self-contained HTML sources for the dummy-data product screenshots shipped
under `public/screens/`. **Everything in these pages is fictional** — brands
(Veyra Electronics, Solstice Beverages), SKUs, offer IDs, people, dates, all €
figures, and every identifier (GTM container IDs, GA4 measurement IDs, editor
email addresses). They exist so the assets can be edited and regenerated
without ever touching a raw client capture.

Raw product captures are **never** committed and never live in this repo — not
even untracked. `.gitignore` blocks images under `docs/projects/` for that
reason. Recreate, then delete the original.

| Source | Output |
|---|---|
| `gtm-recreation.html` | `public/screens/tagging.png` |
| `taxonomy-recreation.html` | `public/screens/taxonomy.png` |
| `gmc-recreation.html` | `public/screens/gmc.png` |
| `budget-recreation.html` | `public/screens/budget.png` |

Regenerate (agent-browser CLI, viewport must be 1440×900):

```
agent-browser set viewport 1440 900
agent-browser open "file:///<abs-path>/gmc-recreation.html"
agent-browser wait 600
agent-browser screenshot public/screens/gmc.png
```

The budget page draws its charts with inline JS on load — keep the `wait`
before the screenshot.

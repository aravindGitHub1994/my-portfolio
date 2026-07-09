# Screenshot recreations (ADR-006 §7/§7a)

Self-contained HTML sources for the dummy-data product screenshots shipped
under `public/screens/`. **Everything in these pages is fictional** — brands
(Veyra Electronics, Solstice Beverages / Data Path), SKUs, offer IDs, people,
dates, and all € figures. They exist so the assets can be edited and
regenerated without ever touching a raw client capture.

Regenerate (agent-browser CLI, viewport must be 1440×900):

```
agent-browser set viewport 1440 900
agent-browser open "file:///<abs-path>/gmc-recreation.html"
agent-browser wait 600
agent-browser screenshot public/screens/gmc.png
```

Same for `taxonomy-recreation.html` → `taxonomy.png` and
`budget-recreation.html` → `budget.png`. The budget page draws its charts
with inline JS on load — keep the `wait` before the screenshot.

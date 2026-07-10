# Animatable diagram SVGs — authoring convention

Hand-structured SVGs in `public/diagrams/<slug>.svg`, checked in, replacing the
Mermaid-rendered files (ADR-005 §5, extending ADR-002; single-play + legibility
re-author per ADR-006 §6). Each file must work in three contexts: **inlined**
into the page (GSAP draw-on + packet flow), **standalone** as `<img>` fallback
(final state must look complete with no external CSS), and **reduced-motion**
(final state only).

**Legibility contract (ADR-006 §6):** size the drawing to fill its frame and
type so node titles resolve to **≥ ~12px on screen** at the rendered panel
width (`ProjectPin`'s `DIAGRAM_PANEL_WIDTH`) — in practice titles 16–20 /
subs 12.5–15 in viewBox units, `stroke-width` 2, tight outer margins.

## Rules

1. **Root**: `viewBox` + explicit `width`/`height` (required for texture
   rasterization), `role="img"` + `<title>`, `data-diagram="<slug>"`.
   `font-family="Geist, ui-sans-serif, system-ui, sans-serif"` — inherits Geist
   when inlined, falls back cleanly when rasterized.
2. **Unique id prefix per file** (`tax-`, `bud-`, `gmc-`, `per-`, `tag-`) —
   all five diagrams can be inlined on the one scroll page simultaneously.
3. **Groups in paint order**: `<g class="dg-edges">` (paths + arrowheads +
   edge labels), then `<g class="dg-nodes">`. A runtime packet layer is
   appended last by `diagramAnimation.ts`.
4. **Edges** are single `<path class="dg-edge">` elements with
   `pathLength="1"` (draw-on = dash-offset 1→0, uniform regardless of length),
   authored **in flow direction** (packets travel t=0→1). `data-from`/`data-to`
   name the connected nodes; `data-bidir="true"` makes packets ping-pong.
   **No decorative dashes on edges** (dashes are the draw-on mechanism);
   de-emphasize with lower stroke opacity instead.
5. **Arrowheads are explicit** `<path class="dg-arrow">` triangles (no
   `<marker>` defs — markers can't be animated per-use and their ids collide).
   Base triangle points down (+y); rotate about the tip via
   `transform="rotate(θ-90, x, y)"` where θ is the end tangent angle.
6. **Nodes** are `<g class="dg-node" data-node="<name>">` wrapping shape +
   `<text>`. Stores get the cylinder treatment (rect + top arc). Containers
   (subgraph frames) add `dg-container`. Exploratory/in-progress nodes may use
   dashed **node** borders (nodes never draw-on by dash, so decorative dashes
   are safe there).
7. **`data-step="n"`** on every node/edge/arrow/label defines the build
   narrative: step elements animate together, ascending. Convention: a node
   appears **after** its incoming edge draws (data flows into it). Parallel
   fan-outs share a step.
8. **`data-key`** marks the 1–2 differentiator nodes per diagram — they get
   the electric-blue emphasis during animation (and the accent stroke at rest).
9. **Colors are hardcoded** from the dark system (no CSS vars — must survive
   rasterization): ink `#f2f4f8`, muted `#a2a8b4`, subtle `#6a7080`, accent
   `#3d74ff`, accent-bright `#8fb3ff`, node fill `#0e0e14`, container fill
   `rgba(13,13,18,0.55)`, default stroke `rgba(162,168,180,0.35)`, edge stroke
   `rgba(162,168,180,0.5)`. Single-accent rule: differentiate node kinds by
   stroke weight/opacity/dash, **never** by extra hues.
10. **Resting state is fully drawn.** No baked-in `opacity="0"` — initial
    hiding is applied by GSAP (`fromTo`) only when animation actually runs.

## Runtime contract (`src/lib/diagramAnimation.ts`)

- `buildDrawTimeline(svg)` — paused GSAP timeline over `[data-step]` elements
  (edges: dash-offset; arrows: pop after their edge; nodes/labels: fade+rise).
  Played **once on entry** by `ProjectPin` (ADR-006 §6 — scroll-scrub retired).
- `spawnPackets(svg, { loop: false })` — creates circles per `.dg-edge` and
  runs them along the path via MotionPathPlugin for **a single pass** after the
  draw-on completes; returns a cleanup. Reduced-motion: nothing runs — the
  resting state is fully drawn by convention (rule 10).

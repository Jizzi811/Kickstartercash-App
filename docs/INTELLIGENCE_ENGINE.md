# Intelligence Engine

The Intelligence Engine is Brandmind's internal learning layer. It lets the
product **continuously learn from a workspace's own activity** – generated
assets, campaigns, mission plans, approvals and interactions – and turn that
into insights, recommendations, performance trends and summaries.

**It does not train AI models.** There is no ML training, no gradient descent,
no external analytics. It is a deterministic, explainable aggregation layer over
data the workspace already produced. Every number can be traced back to a record.

Related: [`MISSION_CONTROL.md`](./MISSION_CONTROL.md),
[`BRAND_CONTEXT_QA.md`](./BRAND_CONTEXT_QA.md),
[`WORKSPACE_SCOPING.md`](./WORKSPACE_SCOPING.md).

## 1. Architecture

```
IntelligenceService            server.py – gathers workspace-scoped records
        │
        ▼
LearningEngine                 normalize raw records into signals (the "memory")
        │
        ▼
PerformanceEngine              headline metrics + time-series trends
        │
        ▼
InsightsEngine                 human-readable insight cards (with confidence)
        │
        ▼
RecommendationEngine           actionable recommendations + optimizations
```

The four engines live in `backend/app/services/intelligence.py` and are **pure
functions**: they receive already-fetched, already-scoped records and return
plain dicts. The database, auth and workspace scoping live in the API layer
(`server.py`). This keeps the engines trivial to test and reason about.

## 2. What it learns from (inputs)

All records are **workspace-scoped** and tied to the **active Brand Brain**.

| Signal source | Collection | Used for |
|---|---|---|
| Generated assets (social, copy, image, campaign, calendar, landingpage, analysis, video) | `history` | format mix, publishing cadence, volume trends |
| Campaign history | `history` (`type=campaign`) | running campaigns, volume |
| Approved / rejected work | `mission_tasks` (status) | approval rate, per-department & per-agent acceptance |
| Agent performance | `mission_tasks.owner_agent` | "Marketing Director suggestions approved X%" |
| Generated plans / Mission Control history | `mission_plans` | plan cadence, momentum |
| User interactions | `intelligence_events` | interaction volume, explicit approve/reject/publish signals |
| Brand / writing / visual preferences | `intelligence_preferences` + active brand | recommendations, suggested defaults |

> **Output Factory** history: when an Output Factory ships, its records write to
> `history` (or emit `intelligence_events`) and are picked up automatically – no
> engine change required.

### Preferences storage

`intelligence_preferences` holds per-workspace/brand preferences the user can set
(`writing_tone`, `preferred_formats`, `visual_style`, `best_publishing_days`,
`notes`). The engine also **suggests** these from real activity (most-used
formats, busiest weekdays) so the user can accept data-backed defaults.

## 3. Outputs

### Insight cards
Each card is explainable and carries a **confidence** from its sample size
(`low` < 8, `medium` < 20, `high` ≥ 20 data points), so a coincidence is never
shown as a fact. Examples the engine produces from real data:

- *"Social media posts are your most-used format"* (share %).
- *"You mostly create on Tuesdays"* (weekday concentration).
- *"Marketing Director suggestions are approved 92% of the time"* (per-agent
  acceptance rate).
- Low-acceptance warning cards that point back to the Brand Brain.

> Insights such as *"Carousel posts outperform single images"* or *"Purple CTAs
> convert better"* require **performance metrics** (impressions/clicks). Those
> arrive when an analytics source is connected — a deliberate later phase. The
> engine is structured so such cards slot into `InsightsEngine.cards` without
> touching the pipeline; today it only asserts what the data supports.

### Recommendations & optimizations
`RecommendationEngine` derives advisory next-best-actions (e.g. "N proposals
await approval", "schedule key content for your busiest day") and optimizations
(e.g. "sharpen the Brand Brain – approval rate is low", "diversify your format
mix", "complete missing Brand Brain fields"). **Advisory only** — execution
always stays human-approved (see Mission Control).

### Performance trends
`PerformanceEngine.trends` returns 30-day daily series for assets generated,
tasks approved and plans created — rendered as sparklines on the page.

### Summaries
`build_summary(period)` produces **daily / weekly / monthly** rollups: generated,
approved, rejected, plans, top format, top department, and highlight chips.

## 4. API

All endpoints take `ws = Depends(current_workspace)` and resolve the active brand
via `_resolve_brand`; reads are filtered with `_scope_filter(ws)` and writes stamp
`workspace_id`. See `WORKSPACE_SCOPING.md`.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/intelligence/insights` | full payload: metrics, trends, insights, recommendations, optimizations |
| `GET` | `/intelligence/summary?period=daily\|weekly\|monthly` | time-boxed rollup |
| `POST` | `/intelligence/event` | record a learning signal (approve/reject/publish/interaction) |
| `GET` | `/intelligence/preferences` | stored + engine-suggested preferences |
| `PUT` | `/intelligence/preferences` | save workspace/brand preferences |

The learning loop is wired: when a user approves/rejects a Mission Control task,
the frontend posts an `intelligence_event` (`task_approved` / `task_rejected` …)
so interactions are captured in addition to being derivable from `mission_tasks`.

## 5. Frontend

- Page: `frontend/src/pages/IntelligenceStudio.jsx`, routed at `/intelligence`
  ("Intelligence" in the sidebar).
- Metrics tiles, insight-card grid (with confidence dots), recommendations +
  optimizations, performance sparklines, and daily/weekly/monthly summary tabs.
- Purple gradient headings, **Sora** typography, dark cards, `framer-motion`
  fade-ups — consistent with Mission Control. No gold/amber.

## 6. Guarantees

- **Workspace-scoped:** every read/write is filtered to the active workspace; no
  cross-tenant leakage (`_scope_filter`, `workspace_id` stamping).
- **Brand-grounded:** insights and suggested preferences use the active Brand
  Brain (`_resolve_brand`, brand tone/visual style).
- **No external analytics:** everything is computed from first-party data.
- **No model training:** pure aggregation; fully explainable.

## 7. Extending safely

- Add a new insight → extend `InsightsEngine.cards`; keep the `confidence` gate.
- Add a new signal source → fetch it in `_gather_intel_records` (scoped) and read
  it in `LearningEngine.signals`.
- When performance data arrives → add a `PerformanceEngine` reader for it and new
  insight cards; the four-stage pipeline does not change.

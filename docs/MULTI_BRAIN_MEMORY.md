# Multi-Brain Memory

BrandMind doesn't just store information — it accumulates **experience**. The
Multi-Brain Memory system gives every agent a real memory, split into three
specialised brains so knowledge domains never bleed into each other:

```
Brand Brain      → who the brand is        (identity, DNA, tone)   [Epic 2]
Business Brain    → how the company operates (goals, strategy, SOPs)
Experience Brain  → what has worked          (approvals, patterns)
```

Agents **request memory through the Memory Router** — they never read
collections directly.

Related: [`BRAND_IDENTITY_ENGINE.md`](./BRAND_IDENTITY_ENGINE.md),
[`INTELLIGENCE_ENGINE.md`](./INTELLIGENCE_ENGINE.md),
[`MISSION_CONTROL.md`](./MISSION_CONTROL.md),
[`WORKSPACE_SCOPING.md`](./WORKSPACE_SCOPING.md).

## 1. The three brains

| Brain | Source | Content |
|---|---|---|
| 🎨 **Brand Brain** | `brands` + DNA | name, colors, tone, four-layer identity DNA |
| 💼 **Business Brain** | `business_memory` | goals, strategies, SOPs, documents, company knowledge, checklists, competitors, planning |
| ⭐ **Experience Brain** | *aggregated* from `history`, `mission_tasks`, `mission_plans`, `intelligence_events` (+ optional `experience_memory`) | campaign history, approved/rejected assets, prompt history, agent performance, user feedback, approval history, recurring patterns |

The Experience Brain is the innovation: instead of a new data silo, it is an
**aggregation over the signals earlier epics already produce**. Approve a Mission
Control task and the Experience Brain immediately reflects it — no extra logging.

## 2. Package layout (`backend/app/memory/`)

| File | Responsibility |
|---|---|
| `registry.py` | Brain registry, categories, and the **Memory Router map** (`AGENT_BRAIN_MAP`, `brains_for_agent`) |
| `router.py` | Pure functions: `experience_aggregate`, `build_context` (the Memory Context API), `summarize`, `search`, `timeline`, `insights`, `recurring_patterns` |

Like the other engines, `router.py` is pure: it receives already-scoped records
and returns plain dicts/strings; DB access lives in `server.py`.

## 3. The Memory Router

`brains_for_agent(agent_id)` decides which brains an agent receives:

| Agent | Brains |
|---|---|
| Designer / Video / Social | Brand · Experience |
| SEO / Analytics | Business · Experience |
| Marketing Director / Sales | Business · Experience · Brand |
| CEO (Mission Control, Team Chat) | all three |
| *(unknown)* | all three (safe superset) |

`build_context(agent_id, business_entries, experience, lang)` returns the routed
**Memory Context** block. Brand Brain is intentionally omitted here because it is
already injected by `_brand_context` (brand + DNA); the block adds the Business
and Experience brains, including the **agent's own track record** ("Your approval
rate is 92%") and **recurring patterns** ("Most-used format: social; Busiest day:
Tuesday; Strongest agent: marketing").

### Where the router is wired (every AI agent)

`server.py::_agent_memory_context(agent_id, ws, language)` is the single entry
point. It is appended to the system prompt of:

- `/agents/tools/run` (specialist tools)
- `/agents/chat` (agent chat)
- Mission Control `/mission/ceo/plan`
- AI Team Chat `/mission/plans/{id}/team-chat/ask`

So every agent generation is memory-grounded, tailored to that agent's brains.
`GET /memory/context?agent_id=…` lets you inspect exactly what an agent receives.

## 4. API

All workspace-scoped (`current_workspace` + `_scope_filter`).

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/memory/registry` | brains, categories, agent→brain map |
| `GET` | `/memory/summary` | per-brain counts + highlights |
| `GET` | `/memory/business` | Business Brain entries (filter by `category`) |
| `POST` | `/memory/business` | add a Business Brain entry |
| `PUT` | `/memory/business/{id}` | edit an entry |
| `DELETE` | `/memory/business/{id}` | delete an entry |
| `GET` | `/memory/experience` | Experience aggregate + explicit records |
| `POST` | `/memory/experience` | record an explicit experience |
| `GET` | `/memory/search?q=` | search across all brains |
| `GET` | `/memory/timeline` | merged chronological memory events |
| `GET` | `/memory/insights` | memory-derived insight lines |
| `GET` | `/memory/context?agent_id=` | inspect an agent's routed memory |

New collections: `business_memory`, `experience_memory` — both scoped and
brand-tagged.

## 5. Frontend

`frontend/src/pages/Memory.jsx` (route `/memory`, sidebar "Memory"): three brain
cards (with counts + which agents use each), a cross-brain **search**, the
**Business Brain editor** (add/list/delete by category), **Memory Insights** and
a **Memory Timeline**. Purple gradient headings, Sora typography, no gold/amber.

## 6. Scoping & guarantees

- **Workspace-scoped**: every read/write uses `_scope_filter(ws)` and stamps
  `workspace_id`; no cross-tenant bleed.
- **Brand-scoped**: entries carry `brand_id`.
- **Agents use the Router**: no agent endpoint reads memory collections directly.
- **Non-breaking**: memory injection is additive and wrapped in try/except.

## 7. The Learning Loop (designed-in)

The pieces for a full learning loop are now in place and only need connecting:

1. Every user **approval / rejection** already flows into the Experience Brain
   (via `mission_tasks` + `intelligence_events`).
2. The **Intelligence Engine** detects patterns over the same signals.
3. The **Brand Identity Engine** DNA is a versionable document that a future
   "Brand Evolution" job can propose refinements to — **only after user consent**.

So BrandMind learns not just from data, but from the user's decisions — with a
human always in the loop.

## 8. Extending

- **New Business category** → add to `BUSINESS_CATEGORIES` in `registry.py`.
- **New agent routing** → add to `AGENT_BRAIN_MAP`.
- **New brain** → add a `BRAIN_META` entry + an aggregation in `router.py` and a
  branch in `build_context`; the router map and UI pick it up generically.

# Mission Control & Quantum Command Planning

Mission Control is Brandmind's command center – the new home route (`/`). It
turns a business goal into an **executive plan** and a set of **department task
objects**, using the active workspace and active brand. It is a
**human-in-the-loop** system: nothing is auto-published or executed. Every task
starts as a *proposal* that a person must approve before it advances.

Related docs: [`BRAND_CONTEXT_QA.md`](./BRAND_CONTEXT_QA.md) (brand grounding),
[`WORKSPACE_SCOPING.md`](./WORKSPACE_SCOPING.md) (tenant isolation).

## 1. What the dashboard shows

| Section | Source | Notes |
|---|---|---|
| Personalized greeting | `useApp().user` (client) | first name + time-of-day |
| Active workspace / brand | `useApp().activeWorkspace` / `activeBrand` | context chips in the hero |
| Quantum AI composer | `POST /mission/ceo/plan` | enter a goal → executive plan |
| Executive plan | plan result / `GET /mission/plans/{id}` | strategy, audience, channels, assets, next steps, tasks |
| Today's priorities | `GET /mission/overview` → `priorities` | open tasks that are urgent/high or due today/overdue |
| Running campaigns | `overview.campaigns` | approved/in-progress plans + generated campaign history |
| Team & departments | `overview.departments` | 8 departments with open-task counts + live dot |
| Recent activity | `overview.activity` | newest tasks + plans, merged |
| Suggested next actions | `overview.suggestions` | derived, human-in-the-loop nudges |
| Plan history | `GET /mission/plans` | click to re-open any past plan |

The rich module launcher that used to live on `/` now lives at **`/modules`**
(sidebar → "Module").

## 2. The Quantum AI flow

1. The user enters a business goal in the composer.
2. `POST /mission/ceo/plan` resolves the active brand (`_resolve_brand`) and the
   active workspace (`current_workspace`), then prompts **Quantum (`ceo` agent)** with the brand-context block.
3. Quantum returns strict JSON: `summary`, `strategy`, `target_audience`,
   `channels[]`, `required_assets[]`, `next_steps[]`, and `tasks[]`.
4. The backend stores an `ExecutivePlan` (status `awaiting_approval`) and creates
   8 `MissionTask` collaboration objects (status `planned`), each stamped with
   `workspace_id` and `brand_id`.
5. The plan appears immediately; the user approves/rejects/advances each task.

**No execution.** The endpoints only create and update records. Publishing or
running a task is out of scope for this phase and always requires a human.

## 3. Data model

### ExecutivePlan (`mission_plans`)
`id, goal, summary, strategy, target_audience, channels[], required_assets[],
next_steps[], task_ids[], brand_id, brand_name, workspace_id,
status (awaiting_approval), created_at`

### MissionTask (`mission_tasks`)
`id, title, description, department, owner_agent, assigned_agent, status, priority, due_date, plan_id, linked_campaign, required_inputs, expected_output, comments, timeline, goal, brand_id, workspace_id, created_at, updated_at`

- **department** ∈ `marketing, design, seo, video, sales, automation, analytics, support`
- **owner_agent** – the agent that owns the department (from `MISSION_DEPARTMENTS`)
- **status** ∈ `planned → in_progress → needs_review → approved → completed` (or `rejected`)
- **priority** ∈ `low, medium, high, urgent`
- **linked** to a plan via `plan_id` and to the goal via `goal`

## 4. Endpoints

All are workspace-scoped via `ws = Depends(current_workspace)` and
`_scope_filter(ws)`; every insert stamps `workspace_id`. See
`WORKSPACE_SCOPING.md`.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/mission/ceo/plan` | Quantum Intelligence drafts a plan + department tasks (proposals) |
| `GET` | `/mission/plans` | plan history for the workspace |
| `GET` | `/mission/plans/{id}` | a plan + its tasks |
| `GET` | `/mission/tasks` | tasks (filter by `status`, `department`) |
| `POST` | `/mission/tasks` | create a task manually |
| `PATCH` | `/mission/tasks/{id}` | approve / advance / edit a task (human approval) |
| `GET` | `/mission/overview` | aggregated command-center snapshot |

Status/priority transitions are validated server-side; a task can never be moved
to an unknown state, and by-id updates use `{"id": id, **_scope_filter(ws)}` so a
user can only touch their own workspace's tasks.

## 5. Brand & workspace grounding

- The Quantum AI prompt always includes `_brand_context(brand, lang)`, so plans speak
  in the active brand's name, tone and audience.
- If no `brand_id` is sent (or it is stale), `_resolve_brand` falls back to the
  workspace brand, then the Brandmind default – it never fails. See
  `BRAND_CONTEXT_QA.md`.

## 6. UI / design system

- New page: `frontend/src/pages/MissionControl.jsx`, routed at `/`.
- Purple gradient headings (`#C4B5FD → #7C3AED → #6D28D9`), **Sora** typography,
  dark `#0A0A0A` cards, `framer-motion` fade-ups – consistent with the rest of
  Brandmind. No gold/amber.
- Sidebar entry "Mission Control" (Target icon); old launcher moved to "Module".

## 7. Extending safely

When you add execution (the deliberate next phase):

- Keep the human-approval gate: only a task in `approved`/`in_progress` set by a
  user may trigger real work.
- Route execution through the owning department's agent
  (`owner_agent`) and the existing brand-grounded generation endpoints.
- Never auto-publish from `POST /mission/ceo/plan` – it plans, it does not act.

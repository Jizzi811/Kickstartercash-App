# BrandMind Agent Collaboration Engine

The Agent Collaboration Engine expands Mission Control plans into a visible, human-approved workspace for department execution planning.

## Scope

- Input is an existing Mission Control plan created through `POST /mission/ceo/plan`.
- For every plan, BrandMind creates a collaboration workspace using `collaboration_workspace_id` and `collaboration_workspace_name` on the plan record.
- The engine generates one internal task for each BrandMind department: Marketing, Design, SEO, Video, Sales, Automation, Analytics, and Support.
- The engine never publishes content, triggers automations, contacts external services, or executes customer-facing actions.

## Task contract

Each generated task includes:

- `title`
- `description`
- `department`
- `assigned_agent` / `owner_agent`
- `priority`
- `status`
- `due_date`
- `plan_id` and `linked_campaign`
- `required_inputs`
- `expected_output`
- `comments`
- `timeline`

Statuses are intentionally human-in-the-loop:

1. `planned`
2. `in_progress`
3. `needs_review`
4. `approved`
5. `completed`

`rejected` is also accepted for human rejection. Approval only approves internal work; it does not publish externally.

## Workspace and brand isolation

All plan and task reads/writes continue to use the active workspace dependency and `_scope_filter(ws)`. Every generated record is stamped with `workspace_id` and the resolved active brand. Plan detail reads fetch tasks with both `plan_id` and workspace scope to prevent cross-workspace leakage.

## UI

The Mission Control page now supports a plan detail route:

- `/mission/plans/:planId`

The detail view shows:

- the executive plan summary and strategy
- all eight generated department tasks
- department/agent status
- required inputs and expected outputs
- task comments/notes
- collaboration timeline via task timeline records
- status change controls for the approved workflow

The UI follows the existing BrandMind dashboard style: Sora typography, dark premium cards, purple gradient headings, and no gold/amber styling.

## AI behavior rules

- AI creates task plans, draft-output expectations, suggestions, and internal reviews only.
- AI must not auto-publish anything.
- AI must not execute external actions.
- Human approval is required before anything leaves BrandMind.

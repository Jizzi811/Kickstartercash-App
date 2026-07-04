# BrandMind AI Team Chat

BrandMind AI Team Chat adds an internal discussion layer to Mission Control plan detail pages (`/mission/plans/:planId`). Users can ask the whole AI team for critique, improvements, risk analysis, content priorities, lead acceleration ideas, or missing assets.

## Scope and safety

- Chat is linked to the active Mission Control plan and uses the plan, generated department tasks, active workspace, and active brand context.
- The discussion is advisory only: no external publishing, no destructive actions, and no automatic execution are performed.
- Human approval is always required before any task or recommendation leaves BrandMind.

## Core agents

The team chat includes these core BrandMind roles:

1. AI CEO — moderator and final recommendation
2. Marketing Director — campaign strategy and channels
3. Creative Director — campaign idea and creative quality
4. Copywriter — hooks, messaging, and conversion copy
5. SEO Manager — search demand and content structure
6. Designer — visual system and asset quality
7. Video Producer — video concepts and production flow
8. Sales Expert — offer, objections, and lead conversion
9. Analytics Expert — KPIs, measurement, and risk signals
10. Automation Architect — workflows and approval gates

## Backend data model

Team chat data is stored in two MongoDB collections:

- `mission_team_chat_threads`
  - `workspace_id`
  - `brand_id`
  - `plan_id`
  - `campaign_id`
  - `title`
  - `created_at`
  - `updated_at`
- `mission_team_chat_messages`
  - `thread_id`
  - `workspace_id`
  - `brand_id`
  - `plan_id`
  - `campaign_id`
  - `agent`
  - `role`
  - `content`
  - `timestamp`
  - `message_type` (`user`, `agent`, `summary`, `system`)
  - `linked_task_id`

## API endpoints

- `GET /api/mission/plans/{plan_id}/team-chat`
  - Creates or returns the plan's internal team chat thread.
  - Returns thread metadata, messages, and the canonical agent roster.
- `POST /api/mission/plans/{plan_id}/team-chat/ask`
  - Stores the human question.
  - Calls the selected LLM with brand, plan, task, workspace, and safety context.
  - Stores short role-specific agent replies.
  - Ensures the final response is an AI CEO summary/recommendation.
  - Falls back to a deterministic safe team discussion if the LLM returns unusable output.

## Frontend behavior

On plan detail pages, Mission Control renders a premium BrandMind chat panel below the Executive Plan:

- Sora typography and purple gradients match the BrandMind design system.
- Agent avatars, names, and roles are visible.
- User questions are displayed as chat bubbles.
- Agent responses are concise and role-specific.
- AI CEO summaries are highlighted as recommendation cards.
- The layout is responsive and stacks cleanly on mobile.

Suggested prompts shown in the UI:

- “Verbessert diesen Kampagnenplan”
- “Welche Risiken seht ihr?”
- “Welche Inhalte sollen zuerst produziert werden?”
- “Wie können wir schneller Leads gewinnen?”
- “Welche Assets fehlen noch?”

## Human approval guardrail

The prompt and UI both state that this is internal brainstorming only. Recommendations can improve Mission Control tasks and planning decisions, but they never publish, delete, send, or execute anything externally without explicit human approval.

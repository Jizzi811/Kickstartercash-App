# BrandMind AI Skill System

EPIC 4 introduces a modular capability layer between agents and AI providers:

```text
Agent → Skill Registry → Skill Execution Engine → Provider Gateway
```

## Goals

- Remove hardcoded agent capabilities from runtime execution.
- Let agents dynamically load reusable skills by ID from a registry.
- Keep each skill self-describing with schemas, memory/DNA dependencies, provider requirements, cost estimate, runtime estimate and semantic version.
- Route execution through the existing AI Provider Gateway so provider selection, fallbacks, latency and usage tracking stay centralized.

## Backend Components

### Skill Registry

Location: `backend/app/skills/registry.py`

The registry defines:

- `CATEGORIES`: Marketing, Research, Copywriting, SEO, Image, Video, Voice, Automation, Analytics, Business, Planning, Review and Quality Assurance.
- `SKILLS`: canonical skill metadata and prompts.
- `AGENT_SKILL_MAP`: dynamic agent-to-skill assignments derived from skill metadata.
- `skills_for_agent(agent_id)`: the only supported way for agents to load their executable skills.

Each skill contains:

- ID, name, description, category and version
- input/output schema
- required memory, required brand DNA, tools and providers
- permission flags
- cost/runtime estimates
- execution prompts
- agent IDs allowed to load the skill

### Skill Execution Service

Location: `backend/app/skills/service.py`

The execution service receives an agent, skill ID, user context, routed memory and brand DNA, builds a skill-scoped system prompt and calls the AI Provider Gateway. It writes structured log entries to `skill_logs` with:

- skill ID and version
- agent ID and workspace ID
- input payload
- execution result or error
- gateway metadata
- timestamps

### API Endpoints

- `GET /api/skills/registry` – full registry payload, categories and agent map.
- `GET /api/skills?category=&q=` – searchable skill list.
- `GET /api/skills/{skill_id}` – detail metadata for one skill.
- `GET /api/skills/{skill_id}/logs` – workspace-scoped execution logs.
- `GET /api/agents` – agents now include `skills` and backwards-compatible `tools`, both loaded from the registry.
- `GET /api/agents/{agent_id}/tools` – returns registry skills for that agent.
- `POST /api/agents/tools/run` – resolves the requested tool ID as a skill and executes through the Skill Execution Service.

## Frontend Components

### Skill Marketplace UI

Location: `frontend/src/pages/SkillsMarketplace.jsx`

Routes:

- `/skills` – marketplace with search and category filtering.
- `/skills/:skillId` – skill detail panel with metadata, providers, memory/DNA requirements and schemas.

Navigation includes a new **Skills** item in the app shell.

## Initial Skill Catalog

The first catalog includes:

- Campaign Planner
- Brand Audit
- SEO Audit
- Keyword Expansion
- Competitor Analysis
- Hook Generator
- CTA Optimizer
- Image Critique
- Video Critique
- Prompt Optimizer
- Landingpage Review
- Storytelling Review
- Brand Compliance Check
- Output Optimizer

## Versioning & Permissions

Skills carry semantic versions (`1.0.0` initially). Execution logs store `skill_version`, so future registry upgrades can be audited against historical runs. The `permissions` field is currently metadata (`execute`) and is ready for plan/role gating.

## Extending the System

To add a skill:

1. Add a `_skill(...)` entry in `backend/app/skills/registry.py`.
2. Assign one or more `agent_ids`.
3. Define category, schemas, required memory/DNA/providers and prompts.
4. The agent UI and marketplace pick it up automatically via API refresh.

No agent implementation changes are required.

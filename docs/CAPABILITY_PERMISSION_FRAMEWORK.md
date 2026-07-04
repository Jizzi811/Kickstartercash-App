# BrandMind AI Capability & Permission Framework

## Goal

BrandMind now has a unified, workspace-scoped permission and capability layer for users, workspaces, roles, departments, agents, skills, tools and AI providers.

## Architecture

```text
Workspace
  ↓
Roles
  ↓
Agents
  ↓
Skills
  ↓
Tools
  ↓
Providers
```

Every AI request that enters the AI Gateway is evaluated against the active workspace policy before provider execution. The policy is loaded by `workspace_id`, merged with default registries, checked against subscription limits and then enforced before any provider adapter is called.

## Registries

The framework exposes these registries from `backend/app/permissions.py`:

- **Permission Registry** — canonical permission keys such as `providers.use`, `skills.use`, `premium.use`, `roles.manage` and `marketplace.access`.
- **Capability Registry** — AI capabilities including chat, structured output, image generation, embeddings and text to speech.
- **Role Registry** — owner, admin, manager, creator and viewer role defaults.
- **Feature Flags** — workspace-level switches for marketplace, custom agents, provider gateway, premium media and capability matrix.
- **Subscription Limits** — free, pro and enterprise daily/monthly limits, premium entitlement and provider/skill ceilings.
- **Provider Permissions** — per-provider enable/disable rules.
- **Skill Permissions** — per-skill enable/disable rules.
- **Tool Permissions** — per-tool enable/disable rules.
- **Agent Permissions** — per-agent enable/disable rules.
- **Department Permissions** — reserved policy bucket for department overrides.

## API

- `GET /api/permissions/registry` returns static registries and the Workspace → Roles → Agents → Skills → Tools → Providers architecture.
- `GET /api/permissions/policy` returns the active workspace policy plus daily/monthly usage snapshot.
- `PUT /api/permissions/policy` saves workspace-scoped policy changes.
- `POST /api/permissions/evaluate` evaluates a capability/provider/agent/skill/tool request without executing it.

## Enforcement path

1. Request resolves the active workspace with `current_workspace`.
2. Gateway config receives `permission_policy` for that workspace.
3. `AIGateway._run()` performs a capability preflight before building the provider chain.
4. Each provider candidate is checked again for provider-specific access before adapter execution.
5. Denied requests are recorded in gateway usage with `ok=false` and a permission reason.

## UI

The new **Permissions** page at `/permissions` includes:

- Permission Dashboard
- Role Editor
- Capability Matrix
- Subscription Overview
- Provider Access controls
- Skill Access controls

## Workspace scoping

Policies are stored in `permission_policies` by `workspace_id`. Legacy unauthenticated requests use an empty workspace id and free defaults; authenticated workspaces receive pro defaults unless a saved policy overrides them.

## Limits

Supported limits include:

- Rate-limit metadata via provider gateway RPMs
- Daily request limits
- Monthly request limits
- Premium-only capability gates
- Marketplace feature flag
- Provider, agent, skill and tool access blocks

## Extending

Add new permissions or capabilities in `backend/app/permissions.py`, then surface them in the dashboard. New AI entry points should route through `AIGateway` and attach the workspace `permission_policy` before execution.

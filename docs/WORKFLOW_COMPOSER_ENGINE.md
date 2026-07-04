# BrandMind Workflow Composer Engine

BrandMind now treats every business process as a versioned workflow that can be planned, executed, inspected, retried, approved and measured.

## Operating Model

```text
Workflow → Stages → Tasks → Departments → Agents → Skills → Tools → Providers → Outputs
```

## Core Components

- **Workflow Registry**: exposes workflow types, templates and runtime capabilities.
- **Workflow Engine**: executes sequential stages, parallel stages, conditional tasks, retry policies, timeouts, fallbacks and approval gates.
- **Workflow Runtime**: carries variables, context, status, logs, history and artifacts for each run.
- **Workflow Templates**: reusable, versioned workflows such as Brand Campaign Launch, SEO Content Machine and Ticket to Resolution.
- **Workflow Variables**: JSON inputs merged with template defaults at runtime.
- **Workflow Context**: workspace, brand and source metadata injected into each run.
- **Workflow Artifacts**: durable outputs from tasks, including approval requests and task outputs.
- **Workflow History**: ordered event timeline for workflow, stage and task lifecycle events.
- **Workflow Logs**: structured operational logs for timeouts, retries and runtime diagnostics.
- **Workflow Retry System**: per-task retry configuration with backoff metadata.
- **Workflow Scheduling**: runtime-ready contract for future scheduled triggers and recurring business processes.
- **Workflow Status**: queued, running, completed, failed, cancelled and approval_required.

## Supported Workflow Patterns

- Sequential workflows and stages
- Parallel stage execution
- Conditional branches through variable expressions
- Human approval steps
- Retry and timeout policies
- Fallback task references
- Reusable sub-workflow references
- Workflow versioning
- Workspace-scoped and brand-scoped execution

## Workflow Types

Marketing, Sales, SEO, Content, Video, Image, Research, Automation, Support, Business and future Publishing.

## API

- `GET /api/workflows/registry`
- `GET /api/workflows/templates`
- `GET /api/workflows/templates/{template_id}`
- `POST /api/workflows/validate`
- `POST /api/workflows/run`
- `GET /api/workflows/runs`

## UI

The Workflow Studio now includes:

- Workflow Builder
- Visual Workflow Editor
- Workflow Dashboard metrics
- Workflow Timeline
- Workflow Debug View
- Workflow Analytics
- Workflow Templates

## Platform Integrations

The engine models integration points for Brand Identity Engine, Multi-Brain Memory, Provider Gateway, Skill Registry, Capability Framework, Mission Control and future Publishing workflows.

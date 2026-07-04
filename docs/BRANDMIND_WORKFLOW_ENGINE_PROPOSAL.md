# BrandMind Workflow Engine Proposal

## Purpose

BrandMind needs a native Workflow Engine that can coordinate multi-agent, multi-provider production without changing the current application behavior. The engine should power Output Factory, Video Factory, Research Engine, SEO Engine, Voice Factory, Thumbnail Factory, Publishing Engine, and Agent Collaboration Engine while preserving human control.

## Design goals

- Generic workflow steps that can represent research, writing, generation, review, render, export, and publishing preparation.
- Durable status tracking for workflow runs and individual step runs.
- Retry handling at the step level.
- Agent assignment and reviewer separation.
- Explicit input/output artifacts.
- Review and approval gates.
- Workspace scoping for every workflow, step, artifact, log, and approval record.
- Brand context injection before agents or providers run.
- Provider abstraction by capability.
- No automatic publishing without human approval.

## Core entities

### Workflow template

Defines reusable workflow structure.

Fields:

- `id`
- `name`
- `description`
- `module`
- `version`
- `steps`
- `default_retry_policy`
- `required_context`
- `approval_policy`
- `created_at`
- `updated_at`

### Workflow run

A workspace-scoped execution of a template.

Fields:

- `id`
- `template_id`
- `workspace_id`
- `brand_id`
- `campaign_id`
- `status`
- `initiated_by_user_id`
- `current_step_id`
- `input_context`
- `brand_context_snapshot`
- `created_at`
- `updated_at`
- `completed_at`

Statuses:

- `draft`
- `queued`
- `running`
- `waiting_for_review`
- `waiting_for_approval`
- `approved`
- `rejected`
- `failed`
- `cancelled`
- `completed`

### Workflow step

A template-level definition of work.

Fields:

- `id`
- `type`
- `name`
- `description`
- `depends_on`
- `assigned_role`
- `reviewer_role`
- `provider_capability`
- `required_inputs`
- `expected_outputs`
- `retry_policy`
- `approval_gate`
- `timeout_seconds`

Step types:

- `research`
- `strategy`
- `copy_generation`
- `seo_generation`
- `image_generation`
- `voice_generation`
- `video_composition`
- `thumbnail_generation`
- `qa_review`
- `human_review`
- `approval_gate`
- `export_package`
- `publishing_preparation`

### Step run

A workspace-scoped execution of a workflow step.

Fields:

- `id`
- `workflow_run_id`
- `workspace_id`
- `brand_id`
- `step_template_id`
- `status`
- `assigned_agent_id`
- `reviewer_agent_id`
- `provider_id`
- `attempt_count`
- `max_attempts`
- `started_at`
- `completed_at`
- `error_code`
- `error_message`
- `input_artifact_ids`
- `output_artifact_ids`

Step statuses:

- `pending`
- `queued`
- `running`
- `waiting_for_dependency`
- `waiting_for_review`
- `waiting_for_approval`
- `retry_scheduled`
- `succeeded`
- `failed`
- `skipped`
- `cancelled`

### Artifact

An immutable workflow output or input reference.

Fields:

- `id`
- `workspace_id`
- `brand_id`
- `workflow_run_id`
- `step_run_id`
- `type`
- `version`
- `status`
- `storage_ref`
- `content_preview`
- `metadata`
- `created_by_agent_id`
- `created_at`

Artifact types:

- `brief`
- `research_brief`
- `claim_register`
- `script`
- `copy`
- `seo_metadata`
- `image_prompt`
- `image_asset`
- `voiceover`
- `subtitle_file`
- `video_timeline`
- `video_render`
- `thumbnail`
- `qa_report`
- `approval_record`
- `publish_package`

### Approval record

Captures human decisions.

Fields:

- `id`
- `workspace_id`
- `workflow_run_id`
- `artifact_id`
- `decision`
- `reviewer_user_id`
- `notes`
- `created_at`

Decisions:

- `approved`
- `rejected`
- `changes_requested`

## Brand context injection

Before a step runs, the engine should build a context package containing:

- workspace id
- active brand id
- brand voice
- target audience
- offers and products
- approved claims
- restricted claims
- visual style
- compliance notes
- campaign goals
- source artifacts from previous steps

The package should be stored or referenced as a snapshot so results can be audited later.

## Provider abstraction

Workflow steps should request capabilities instead of vendors:

- `llm.text.generate`
- `llm.review.score`
- `search.web.research`
- `image.generate`
- `voice.synthesize`
- `video.compose`
- `storage.write`
- `platform.package.validate`
- `platform.publish.prepare`

Provider adapters can then be selected by workspace settings, availability, cost, and policy.

## Retry handling

Retries should be step-scoped.

Policy fields:

- `max_attempts`
- `backoff_seconds`
- `retryable_error_codes`
- `requires_human_after_failure`
- `preserve_partial_artifacts`

Rules:

- Never retry human approval automatically.
- Never publish as a retry side effect.
- Preserve failed-step logs and partial artifacts for review.
- Allow rerun from a selected step after a human resolves issues.

## Review and approval gates

Recommended gates:

1. Strategy approval before production starts.
2. Script/copy approval before media generation.
3. Asset QA approval before final packaging.
4. Final human approval before publishing preparation.
5. Separate future approval before external publishing execution.

No workflow may execute external publishing actions unless a human approval record exists for the exact publish package and platform.

## Workspace scoping

Every read and write must include workspace scope:

- workflow templates may be global or workspace-specific.
- workflow runs must be workspace-scoped.
- step runs must be workspace-scoped.
- artifacts must be workspace-scoped.
- logs must be workspace-scoped.
- approvals must be workspace-scoped.
- provider credentials must never be shared across workspaces.

## Audit trail

The engine should append timeline events for:

- workflow created
- step queued
- step started
- step succeeded
- step failed
- retry scheduled
- artifact created
- review requested
- approval decision recorded
- workflow completed
- workflow cancelled

## Example workflow: video campaign

```text
Campaign brief
  -> Research brief
  -> Strategy angle
  -> Script draft
  -> Human script approval
  -> Scene plan
  -> Voiceover generation
  -> Visual asset generation
  -> Subtitle generation
  -> Video composition
  -> Thumbnail variants
  -> QA review
  -> Human final approval
  -> Publish package preparation
```

## Non-goals for initial implementation

- No automatic publishing.
- No external social account connection requirement.
- No new provider SDKs in the first data-model-only step.
- No background render farm in the MVP.
- No migration of existing Output Factory behavior until the engine is proven behind a feature flag.

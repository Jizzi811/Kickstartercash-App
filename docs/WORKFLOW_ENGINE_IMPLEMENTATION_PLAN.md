# Workflow Engine Implementation Plan

## Implementation posture

This roadmap is documentation and planning only. It does not change production behavior, introduce dependencies, or integrate code from AI Content Studio.

## Priority 1: MVP Workflow Engine

Goal: create a durable internal workflow foundation without external publishing.

Deliverables:

- Define workflow template, workflow run, step run, artifact, timeline event, and approval record schemas.
- Add workspace-scoped backend endpoints for creating and reading workflow runs.
- Add step status transitions with validation.
- Add artifact creation and version tracking.
- Add human approval records.
- Add provider capability placeholders without adopting new SDKs.
- Add UI views for workflow run details and timeline.

Acceptance criteria:

- A workflow can be created from a template.
- Step statuses can move through pending, running, review, approval, succeeded, failed, and cancelled.
- Artifacts can be attached to step runs.
- Human approval is required for approval-gated steps.
- All records are workspace-scoped.
- No external publishing occurs.

## Priority 2: Video Workflow

Goal: model a video production workflow using existing BrandMind concepts before adding heavy render infrastructure.

Deliverables:

- Add a video workflow template.
- Define artifacts for script, scene plan, voiceover placeholder, visual prompts, subtitle placeholder, thumbnail brief, QA report, and final package.
- Add approval gates before media generation and final package.
- Add review scoring for brand fit, CTA clarity, video structure, platform fit, and compliance.

Acceptance criteria:

- A user can start a video workflow from a campaign or brief.
- Agents can generate planning artifacts.
- Human approval is captured before final package readiness.
- No actual publishing or automatic upload is performed.

## Priority 3: Research Workflow

Goal: make research reusable across Output Factory, SEO Engine, and Video Factory.

Deliverables:

- Add research workflow template.
- Define artifacts for research request, source list, insight brief, competitor notes, claim register, and risk notes.
- Add factuality and citation QA step.
- Allow approved research briefs to feed downstream workflows.

Acceptance criteria:

- Research artifacts are stored independently from final content.
- Downstream workflows can reference approved research artifacts.
- Claims and sources are reviewable before public content generation.

## Priority 4: Asset QA Workflow

Goal: make QA reusable across all factories.

Deliverables:

- Add an asset QA workflow template.
- Define score dimensions: brand consistency, grammar, factuality, compliance, SEO, readability, conversion intent, visual consistency, and platform fit.
- Add reviewer-agent assignment separate from creator-agent assignment.
- Add change-request loop from QA back to the originating step.

Acceptance criteria:

- Any artifact can be submitted to QA.
- QA produces a structured report and score.
- Failed QA can route back for revision without restarting the entire workflow.

## Priority 5: Approval Workflow

Goal: formalize human-in-the-loop control.

Deliverables:

- Add approval queue UI for artifacts and workflow gates.
- Support approve, reject, request changes, archive, and duplicate decisions.
- Add approval timeline events and immutable approval records.
- Add permission checks for who can approve by workspace role.

Acceptance criteria:

- Approval decisions are auditable.
- Agents cannot bypass approval gates.
- Rejected or change-requested artifacts remain versioned.

## Priority 6: Future Publishing Workflow

Goal: prepare safe publishing without enabling autonomous posting.

Deliverables:

- Add publish package artifacts for each platform.
- Add platform validation adapters for metadata completeness.
- Add draft/scheduled/published/failed external status fields for future use.
- Add final pre-publish human approval requirement.
- Later, add provider-specific publishing adapters behind explicit workspace configuration.

Acceptance criteria:

- BrandMind can prepare export-ready packages.
- Publishing execution remains disabled until a separate implementation phase.
- A human approval record is mandatory for every platform package before any future external action.

## Recommended next implementation task

Start with the MVP Workflow Engine data model and read-only workflow detail UI. This unlocks status tracking, artifacts, approvals, and auditability without changing existing factory behavior or adding risky provider dependencies.

## Validation statement

No application behavior should change as a result of this planning phase. The created documents are architectural references only.

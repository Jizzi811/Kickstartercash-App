# BrandMind AI Output Factory

The BrandMind AI Output Factory transforms approved Mission Control plans into production-ready marketing assets through specialized creative production departments.

## Production modules

The factory includes these modules:

1. Social Content Factory
2. Image Factory
3. Video Factory
4. Voice Factory
5. Landing Page Factory
6. Email Factory
7. Ad Factory
8. Blog & SEO Factory
9. Presentation Factory
10. PDF/Lead Magnet Factory

## Required factory input

Every factory receives the same context package:

- Active workspace
- Active brand
- Mission Control plan
- Quantum AI strategy
- Approved department tasks
- Brand Brain context

## Production pipeline

Every asset moves through one unified workflow:

```text
Input
↓
Production Pipeline
↓
Draft
↓
Internal QA
↓
Final Asset
↓
Approval Queue
```

## Queue statuses

The production queue supports:

- Waiting
- Generating
- Reviewing
- Ready
- Approved
- Published (reserved for future publishing integrations)

No publishing integrations are implemented yet.

## Asset schema

Each asset includes:

- ID
- Type
- Campaign
- Brand
- Workspace
- Creator Agent
- Reviewer Agent
- Status
- Version
- Created Date
- Updated Date
- Quality scores
- Review notes and version history

## Internal AI review

Before an asset becomes `Ready`, a different AI reviewer checks the work:

- Copywriter output is reviewed by the Marketing Director.
- Designer output is reviewed by the Creative Director.
- SEO output is reviewed by the SEO Lead.
- Video output is reviewed by the Video Director.

Review categories:

- Brand consistency
- Grammar
- CTA quality
- SEO
- Readability
- Visual consistency
- Compliance

## Quality scoring

Every asset receives:

- Brand Score
- Grammar Score
- SEO Score
- Conversion Score
- Creativity Score
- Overall Score

The reviewer can attach improvement suggestions before human approval.

## Approval Center

The Approval Center supports:

- Approve
- Reject
- Request changes
- Duplicate
- Archive
- Version history tracking

## Output Library

The Asset Library is searchable and supports filters for:

- Campaign
- Brand
- Agent
- Content Type
- Date
- Status
- Search query

## Implementation notes

- Frontend route: `/output-factory`
- Frontend page: `frontend/src/pages/OutputFactory.jsx`
- Backend endpoints:
  - `GET /api/output-factory/assets`
  - `POST /api/output-factory/assets`
  - `PATCH /api/output-factory/assets/{asset_id}`
- Publishing is intentionally deferred; `Published` exists only as a future status.

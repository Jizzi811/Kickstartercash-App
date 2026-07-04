# BrandMind HQ Alpha

BrandMind HQ Alpha is the new home experience for BrandMind. The goal is to make the product feel less like opening software and more like entering an AI company that is already operating on the user's brand.

## Product intent

BrandMind HQ does not replace existing workflows. It sits above them as an executive operating floor and links users into the existing Mission Control, Workflow Architect, Campaign Flow, Output Factory, and team collaboration surfaces.

## Alpha scope

### AI CEO Office

The AI CEO Office summarizes the day at an executive level:

- Today's executive summary
- Active goals
- Recommendations
- Running initiatives

### Departments

The alpha includes nine operating departments:

- Marketing
- Design
- Video
- SEO
- Sales
- Automation
- Analytics
- Support
- Research

Each department card shows active workflows, active agents, current task, status, and pending approvals.

### Live Activity Feed

The feed uses company-style activity events such as:

- Designer created carousel
- SEO finished audit
- Marketing started campaign
- CEO approved strategy
- Workflow completed

### Intelligence Panel

The Intelligence Panel surfaces:

- Today's insights
- Suggestions
- Brand health
- DNA score
- Memory updates

### Mission Control Widget

The widget reuses existing destinations rather than duplicating functionality:

- Create Goal → Mission Control
- Start Campaign → Campaign Flow
- Launch Workflow → Workflow Architect
- Review Assets → Output Factory
- Open Team Chat → Mission Control

### Workspace Overview

The overview shows the active brand, current workspace, subscription, provider status, and active AI model context.

## Design rules

- Use the BrandMind design language: Sora typography, dark base, purple gradients, premium SaaS cards, and responsive layouts.
- Do not redesign the whole app shell.
- Do not duplicate workflow execution, asset review, or team chat logic.
- Keep existing routes available; BrandMind HQ becomes the `/` home while Mission Control remains accessible at `/mission` and plan detail routes.

## Validation

Required validation for changes:

- Frontend production build.
- Backend checks.
- No regressions in existing workflow routes.

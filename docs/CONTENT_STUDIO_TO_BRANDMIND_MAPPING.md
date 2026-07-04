# AI Content Studio to BrandMind Mapping

This document maps reusable AI-content-studio concepts into BrandMind-native modules. It is planning-only and does not integrate external code.

## Mapping principles

- Preserve BrandMind workspace isolation.
- Inject active brand context into every creative and review step.
- Keep providers behind internal adapters.
- Store every generated output as a versioned artifact.
- Require human approval before publishing, scheduling, or external distribution.
- Prefer reusable workflow steps over feature-specific automation scripts.

## Output Factory

Useful ideas:

- Treat every deliverable as an asset with a lifecycle: draft, review, ready, approved, exported, and future published.
- Attach creator agent, reviewer agent, quality scores, source inputs, and version history.
- Generate channel-specific packages from a single campaign brief.

BrandMind mapping:

- Add workflow-backed production runs for blog posts, ads, emails, social posts, lead magnets, and landing page copy.
- Store artifacts with campaign, brand, workspace, originating workflow, and review notes.
- Keep publishing status separate from asset approval status.

## Video Factory

Useful ideas:

- Split video production into script, scenes, voiceover, visual assets, subtitles, thumbnail, render, and QA.
- Keep expensive render steps behind approval gates.
- Save intermediate assets for reuse and rerendering.

BrandMind mapping:

- Build a `video_campaign_workflow` template.
- Use scene-level artifacts for script segments, prompts, images, clips, voiceover timing, subtitle files, and final render metadata.
- Require approval before final render and again before publishing.

## Research Engine

Useful ideas:

- Separate research collection from synthesis.
- Track sources, claims, citations, and confidence.
- Let downstream agents consume summarized research briefs rather than raw web data.

BrandMind mapping:

- Create research artifacts: source list, insight brief, audience notes, competitor notes, risk notes, and claim register.
- Add factuality QA before research is used in public-facing assets.
- Scope all research records by workspace and brand.

## SEO Engine

Useful ideas:

- Produce SEO artifacts early: intent, keywords, SERP observations, title options, meta descriptions, internal link opportunities, and outline.
- Re-run SEO QA after copy generation.

BrandMind mapping:

- Add SEO workflow steps for keyword brief, content outline, metadata, schema suggestions, and publish checklist.
- Expose SEO score as one of the Output Factory quality dimensions.

## Voice Factory

Useful ideas:

- Convert approved scripts into voice specifications, voiceover files, timing metadata, and pronunciation notes.
- Keep provider-specific voice IDs out of workflow logic.

BrandMind mapping:

- Add a voice provider interface with capabilities like synthesize, clone-policy-check, pronunciation dictionary, and timing export.
- Store voice artifacts separately from final video so they can be reviewed and regenerated.

## Thumbnail Factory

Useful ideas:

- Generate thumbnail concepts from the video promise, title, emotion, contrast, brand colors, and platform constraints.
- Produce multiple variants and review them independently.

BrandMind mapping:

- Add thumbnail artifacts: concept brief, prompt, generated image, overlay text, variant score, and selected final.
- Connect thumbnail QA to brand consistency, legibility, platform crop safety, and click-through intent.

## Publishing Engine

Useful ideas:

- Keep publishing as packaging plus approval, not immediate external action.
- Model each platform as an adapter with metadata requirements and validation rules.

BrandMind mapping:

- First implement export packages for YouTube, TikTok, Instagram, LinkedIn, email, and CMS.
- Later add publishing adapters that can only execute from an approved package with a human approval record.
- Track external status as draft, scheduled, published, failed, or revoked.

## Workflow Engine

Useful ideas:

- Use generic workflow runs composed of typed steps.
- Give each step inputs, outputs, assigned agent, provider, status, retry policy, and logs.
- Persist status so long-running jobs can resume.

BrandMind mapping:

- Introduce reusable workflow templates for research, output generation, video production, asset QA, approval, and publishing packages.
- Store workflow runs and step runs as workspace-scoped records.
- Emit artifacts that BrandMind modules can display without knowing provider details.

## Agent Collaboration Engine

Useful ideas:

- Make agent handoffs visible.
- Assign roles per step and keep comments/review notes attached to the workflow timeline.
- Separate production agents from reviewer agents.

BrandMind mapping:

- Convert collaboration tasks into executable workflow steps once a human approves the plan.
- Use separate reviewer agents for QA and approval recommendations.
- Preserve the rule that agents suggest and prepare, while humans approve external action.

## Concepts to defer

- Automatic posting to social platforms.
- Full autonomous channel management.
- Provider-specific SDK adoption.
- Complex video rendering infrastructure.
- Large-scale queue workers until workflow persistence exists.

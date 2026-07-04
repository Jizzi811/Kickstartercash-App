# Brand Identity Engine

The Brand Identity Engine gives every brand a **complete identity profile** that
all AI agents use automatically. It is not "colors and fonts" — it is the whole
identity, split into four DNA layers, so BrandMind knows a brand the way a
long-serving Creative Director would.

It **extends Brand Brain — it does not duplicate it.** The brand's primitives
(name, colors, fonts, tone, products, audience) still live on the brand; the
Identity Engine adds four deep DNA layers *on top* and derives sensible defaults
from those primitives so the DNA is never empty.

Related: [`BRAND_CONTEXT_QA.md`](./BRAND_CONTEXT_QA.md),
[`AI_PROVIDER_GATEWAY.md`](./AI_PROVIDER_GATEWAY.md),
[`MISSION_CONTROL.md`](./MISSION_CONTROL.md),
[`INTELLIGENCE_ENGINE.md`](./INTELLIGENCE_ENGINE.md).

## 1. The four layers

```
Brand Identity
├── 🎨 Visual DNA         colors, typography, imagery, illustration, icons,
│                         layout, spacing, motion, brand elements, design don'ts
├── ✍️ Communication DNA  tone, formality (Du/Sie), humor, storytelling, emotions,
│                         headline & CTA style, sentence length, emoji rules,
│                         favorite phrases, NO-GO words
├── 📈 Business DNA       mission, vision, goals, USPs, products, services,
│                         pricing, audiences, positioning, competitors, market
└── 🧠 Psychology DNA     personality, archetype, emotions, trust building,
                          motivations, pain points, desires, objections,
                          buying triggers, personality traits
```

The layers and their fields are defined as **data** in
`backend/app/identity/schema.py`. Adding a field — or a whole new layer — is a
change there only; the editor and the injection service iterate the schema
generically, so nothing else needs a rewrite. *(This is the deliberate
extension architecture: interfaces + data models built to grow.)*

## 2. Where the DNA lives (clean extension, no duplication)

The DNA is stored **inside the brand document** at `brand["dna"]`:

```json
{ "visual": {...}, "communication": {...}, "business": {...}, "psychology": {...} }
```

Because it lives on the brand, it travels with every `_resolve_brand(...)` call —
no extra collection, no second lookup, no duplicated fields. The *effective* DNA
is `derive_from_brand(brand)` (defaults from Brand Brain primitives) with the
user-authored `brand["dna"]` layered on top (`service.merged_dna`).

## 3. DNA Injection Service — the heart

`app/identity/service.py::inject_context(brand, agent_id, lang)` returns the DNA
prompt block an agent should receive. **Every AI generation is DNA-grounded
automatically** because injection happens at the single chokepoint every text
entry point already uses — `_brand_context(brand, language, agent_id)` in
`server.py`. Image prompts (which don't use `_brand_context`) get Visual DNA via
`service.visual_prompt_hint(brand)`.

### Which agent gets which layers (`AGENT_DNA_MAP`)

| Agent | Layers injected |
|---|---|
| Marketing Director | Business · Communication · Psychology |
| Designer | Visual · Communication |
| SEO | Business · Communication |
| Video | Visual · Psychology · Communication |
| Social / TikTok | Visual · Psychology · Communication |
| Sales | Psychology · Business · Communication |
| CEO (Mission Control, Team Chat) | all four |
| *(unknown / generic generate)* | all four (safe superset) |

**Hard rules** (no-go words, formality, emoji rule) always surface, even if their
layer wasn't selected — so a Designer prompt still won't use a banned word.

### AI entry points that inject DNA (verified)

All flow through `_brand_context` (text) or `visual_prompt_hint` (image):

- `/generate/social`, `/generate/copy`, `/generate/campaign`, `/generate/calendar`,
  `/generate/landingpage`, `/analyze/content`, `/generate/image`
- `/agents/tools/run` (text **and** image branch), `/agents/chat`
- `/agent-builder/generate`
- Mission Control `/mission/ceo/plan`
- AI Team Chat (`/mission/plans/{id}/team-chat/ask`)

Output Factory and the Intelligence Engine operate on the same brand object, so
they inherit the DNA without extra wiring.

## 4. Scores & validation

- **DNA Completeness Score** (`service.completeness`) — weighted % per layer and
  overall; core fields weigh more.
- **DNA Validation** (`service.validate`) — which required core fields are still
  empty, per layer.
- **Brand Consistency Score** (`service.consistency_score`) — an explainable,
  deterministic score for a piece of content: Communication (no-go words,
  formality, emoji rule, favorite phrases), Business (USP/product references) and
  Psychology (pain points / desires / buying triggers), plus Visual for image
  prompts. Returns an overall % and per-layer findings — e.g. *"No-go words
  found: cheap"*. No ML, no external calls.

## 5. API

All workspace-scoped (`current_workspace` + `_scope_filter`).

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/brand-identity/schema` | field schema for the four layers (drives the editor) |
| `GET` | `/brand-identity/{brand_id}` | merged DNA + stored DNA + completeness + validation + summary |
| `PUT` | `/brand-identity/{brand_id}` | save user-authored DNA (merged per field) |
| `GET` | `/brand-identity/{brand_id}/summary` | short DNA summary |
| `POST` | `/brand-identity/{brand_id}/score` | Brand Consistency Score for content |

## 6. Frontend

`frontend/src/pages/BrandIdentity.jsx` (route `/brand-identity`, sidebar "Brand
Identity"): a **schema-driven DNA editor** with four layer tabs, a completeness
ring (overall + per layer), inline validation chips, and a **Brand Consistency
Score** checker. Empty fields show their derived Brand-Brain value as a
placeholder, so the user always sees the effective DNA. Purple gradient headings,
Sora typography, no gold/amber.

## 7. Brand Evolution (designed-in hook)

The engine is built so the DNA can *learn*: the Intelligence Engine already knows
which formats/agents perform, and `brand["dna"]` is a plain, versionable document.
A future "Brand Evolution" job can propose DNA refinements (e.g. tighten tone,
add a winning phrase) that the user approves — no schema or injection change
needed. The data model and the injection chokepoint were chosen with that in
mind.

## 8. Extending

- **New field / layer** → edit `schema.py`; editor, completeness, injection and
  validation pick it up automatically.
- **New agent routing** → add to `AGENT_DNA_MAP`.
- **New scoring signal** → extend `consistency_score`.
- **No breaking changes**: DNA injection is additive and wrapped in try/except, so
  a brand without DNA behaves exactly as before.

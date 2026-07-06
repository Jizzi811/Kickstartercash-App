# Brand Context QA

Every AI generation surface in Brandmind must produce output *in the identity of
the user's active brand* – its name, slogan, colors, fonts, tone and visual
style. This document is the QA record for that guarantee: for each surface it
lists how the active brand reaches the model, and what happens when no brand is
available.

Companion docs: [`WORKSPACE_SCOPING.md`](./WORKSPACE_SCOPING.md) (which brand a
request may see) and [`../ROADMAP.md`](../ROADMAP.md).

## 1. How brand context flows

```
Frontend (active brand)                Backend (resolve + inject)
──────────────────────                 ─────────────────────────
useApp().activeBrandId  ──brand_id──▶  _resolve_brand(brand_id, ws)
X-Workspace-Id header   ──ws────────▶        │
                                             ▼
                                       _brand_context(brand, lang)  ──▶ LLM system prompt
                                       _build_image_prompt(brand,…) ──▶ image model
```

- **Frontend** sends the selected brand as `brand_id` on every generation call
  (`activeBrandId` from `AppContext`), plus the `X-Workspace-Id` header.
- **`_resolve_brand(brand_id, ws)`** (`backend/server.py`) turns that into a
  concrete brand document and **never raises** – see the fallback chain below.
- **`_brand_context(brand, language)`** renders the brand guidelines block that
  is prepended to the model's system prompt for text.
- **`_build_image_prompt(brand, subject, style)`** injects brand name, palette
  and image style into image prompts.

## 2. Fallback chain (brand context is never missing)

`_resolve_brand` resolves in this order and always returns a usable brand:

1. **Requested brand** – `brand_id` exists in `brands` → use it.
2. **Workspace brand** – otherwise, if the request is authenticated (`ws` set),
   use that workspace's own brand (the one marked `is_default`, else the newest).
3. **Global default** – otherwise the seeded `DEFAULT_BRAND` (Brandmind).
4. **In-memory default** – if the DB is unavailable, the in-code `DEFAULT_BRAND`.

Because of this, a missing, empty, stale or deleted `brand_id` no longer returns
`404` on a generation endpoint – it degrades gracefully to the workspace brand,
then to the Brandmind default, so the user always gets on-brand output.

> Note: the by-id lookup `_get_brand_or_404` is still used by the **brand CRUD**
> endpoints (`GET/PUT/DELETE /brands/{id}`), where a 404 is the correct answer.
> Only **generation** endpoints use the forgiving `_resolve_brand`.

## 3. Surface-by-surface QA

| Surface | Endpoint | Brand in → | Context injected | Fallback |
|---|---|---|---|---|
| **Image Studio** | `POST /generate/image` | `brand_id` (ImageGenerator.jsx) | `_build_image_prompt` | `_resolve_brand` |
| **Design Studio** | `POST /generate/image` (×3) | `brand_id` (DesignStudio.jsx) | `_build_image_prompt` | `_resolve_brand` |
| **Campaign Builder** | `POST /generate/campaign` | `brand_id` (Campaign.jsx) | `_brand_context` + `_build_image_prompt` | `_resolve_brand` |
| **Social Media** | `POST /generate/social` | `brand_id` (SocialMedia.jsx) | `_brand_context` | `_resolve_brand` |
| **Copywriter** | `POST /generate/copy` | `brand_id` (Copywriter.jsx) | `_brand_context` | `_resolve_brand` |
| **Content Calendar** | `POST /generate/calendar` | `brand_id` (ContentCalendar.jsx) | `_brand_context` | `_resolve_brand` |
| **Email Studio** | `POST /agents/tools/run` | `brand_id` (EmailStudio.jsx) | `_brand_context` in tool system prompt | `_resolve_brand` |
| **Landingpage** | `POST /generate/landingpage` | `brand_id` (Funnel/landing UI) | `_brand_context` | `_resolve_brand` |
| **Content analysis** | `POST /analyze/content` | `brand_id` (Guardian.jsx) | `_brand_context` | `_resolve_brand` |
| **Marketing Director / Agent chat** | `POST /agents/chat` | `brand_id` (AgentChatPanel, Specialists) | `_brand_context` in agent system prompt | `_resolve_brand` |
| **Specialist tools** (SEO, LinkedIn, TikTok, Video, Analytics, Automation, Orchestrator, Finance×5, Workflow) | `POST /agents/tools/run` | `brand_id` (each studio + AgentChatPanel) | `_brand_context` (text) / `_build_image_prompt`-style (image) | `_resolve_brand` |
| **Agent workflows** (Agent Builder) | `POST /agent-builder/generate` | `brand_id` (AgentBuilder.jsx) | `_brand_context` | `_resolve_brand` |
| **Funnel page render** | `GET /funnel/{id}/page` | stored funnel config | config-driven (no LLM) | inherits the funnel's own styling |

### What changed in this pass

The **agent surfaces were previously blind** to the brand:

- `POST /agents/tools/run` (text tools) built its system prompt from the agent
  personality only – **no brand block**. It now resolves the brand via
  `_resolve_brand(req.brand_id, ws)` and prepends `_brand_context(...)`. The
  image branch reuses the same resolved brand (and dropped its ad-hoc inline
  fallback dict in favour of the shared resolver).
- `POST /agents/chat` (Marketing Director & every specialist chat) grounded
  replies in the Knowledge Base but **not the brand**. It now injects
  `_brand_context(...)` too, and accepts an optional `brand_id`.
- `POST /agent-builder/generate` now runs inside the brand context, and its
  stale "Quantum" system label was corrected to "Brandmind".
- All generation endpoints switched from `_get_brand_or_404` to `_resolve_brand`
  so a missing/stale `brand_id` degrades gracefully instead of 404-ing.
- The frontend now sends `brand_id: activeBrandId` from the shared
  `AgentChatPanel` and from every studio that calls `/agents/tools/run`
  directly, so the *selected* active brand (not just the workspace default) is
  honoured when a workspace has multiple brands.

## 4. Checklist for new generation endpoints

When you add an endpoint that produces AI content:

- [ ] Accept the workspace via `ws: Optional[str] = Depends(current_workspace)`.
- [ ] Accept an optional `brand_id` in the request model.
- [ ] Resolve the brand with `brand = await _resolve_brand(req.brand_id, ws)` –
      **never** `_get_brand_or_404` on a generation path.
- [ ] For text: prepend `_brand_context(brand, language)` to the system prompt.
- [ ] For images: build the prompt via `_build_image_prompt(brand, …)` (or
      include `brand["name"]`, palette and `image_style`).
- [ ] Frontend: send `brand_id: activeBrandId` on the request.

Following this keeps every future feature on-brand by construction.

# AI Provider Gateway

The AI Provider Gateway is a platform foundation: **business modules never talk
to an AI provider directly.** They ask the gateway for a *capability* (chat,
image, embeddings…) and a *task* (chat, image, video_prompt…), and the gateway
decides which provider and model to use, with health, fallback, retry, cost and
usage tracking built in.

This is what lets BrandMind switch between OpenAI, Anthropic, Gemini, Grok,
Ollama, DeepSeek, Mistral, OpenRouter, Azure OpenAI, AWS Bedrock and future
providers **with a single config change**.

```
Business Modules
      │  gateway.chat / .image / .embeddings / .tts
      ▼
  AI Gateway ──── Provider / Model / Capability registries
      │           Gateway config (enabled, default, fallback, task→model)
      ▼
Provider Adapter (uniform interface)
      ▼
OpenAI · Claude · Gemini · Grok · Ollama · DeepSeek · Mistral ·
OpenRouter · Azure · Bedrock · FreeTheAi · (future)
```

## 1. Package layout (`backend/app/gateway/`)

| File | Responsibility |
|---|---|
| `capabilities.py` | Capability taxonomy + task list (Chat, Vision, Image, Embeddings, STT, TTS, Structured Output) |
| `registry.py` | **Provider Registry**, **Model Registry** (with cost estimates), **Capability Registry** + lookups |
| `config.py` | Gateway config: enabled providers, default, fallback, preferred model per task; defaults + merge |
| `adapters.py` | Uniform `ProviderAdapter` – one interface, many providers |
| `core.py` | `AIGateway` orchestrator – the cross-cutting pipeline + `gateway` singleton |

## 2. The three registries

- **Provider Registry** – every provider: its capabilities, the env var holding
  its key, base URL, whether it's OpenAI-compatible or keyless, a soft RPM limit,
  and whether it's enabled by default.
- **Model Registry** – concrete models keyed by id: provider, capabilities,
  context window and **rough cost estimates** (USD per 1M tokens in/out) used for
  cost estimation. Model ids are unique across providers.
- **Capability Registry** – `capability_providers(cap)` is the reverse index used
  to build fallback chains.

Adding a provider or model is a **data change** in `registry.py`; no business
code changes.

## 3. Capabilities

`chat`, `vision`, `image`, `embeddings`, `speech_to_text`, `text_to_speech`,
`structured_output`. Every adapter declares what it supports and raises
`CapabilityNotSupported` for the rest.

## 4. The pipeline (`AIGateway`)

Each call runs:

1. **Resolution** – build an ordered attempt chain: explicit model → task-preferred
   provider/model → default provider → fallback provider → any other provider that
   supports the capability.
2. **Health gate** – skip providers that are disabled, unconfigured (no key), or
   whose circuit breaker is open (reuses the breaker from `app.services.llm`).
3. **Rate limit** – per-provider sliding-window RPM cap.
4. **Call + retry** – call the adapter with exponential backoff up to `retry_max`.
5. **Latency** – measured per attempt.
6. **Cost estimation** – token estimate × the model's registry cost.
7. **Fallback** – on failure, move to the next provider in the chain.
8. **Usage tracking** – every call is written to `gateway_usage` (workspace-scoped).
9. **Logging** – structured line per attempt.

The result carries full metadata: provider, model, latency, tokens, cost and the
attempt trail.

## 5. Admin configuration

Administrators control, **per workspace**:

- **enable/disable** each provider,
- the **default provider** and the **fallback provider**,
- the **preferred provider + model for each task** (chat, structured, vision,
  image, video_prompt, embeddings, tts, stt),
- `retry_max` and `timeout_seconds`.

Config is stored in `gateway_config` (one doc per workspace) and merged over
registry defaults, so a brand-new workspace already works. Default routing mirrors
the requested example:

| Task | Provider | Model |
|---|---|---|
| Chat / Structured | Anthropic | Claude Sonnet |
| Image | OpenAI | GPT Image 1 |
| Video Prompt | Gemini | Gemini 2.5 Flash |
| Embeddings | OpenAI | Embedding 3 small |

## 6. API

All endpoints are workspace-scoped (`current_workspace` + `_scope_filter`).

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/gateway/registry` | providers, models, capabilities, tasks |
| `GET` | `/gateway/config` | effective config (defaults merged with stored) |
| `PUT` | `/gateway/config` | save enabled/default/fallback/task-models |
| `GET` | `/gateway/health` | per-provider: configured / enabled / breaker |
| `GET` | `/gateway/usage` | usage summary + by-provider + recent |
| `POST` | `/gateway/chat` | run a chat end-to-end through the gateway |

Provider **API keys are never sent to the client**; they live server-side as env
vars. The UI only shows whether a key is present ("configured").

## 7. Provider keys (env vars)

| Provider | Key env | Base URL env (optional) |
|---|---|---|
| OpenAI | `OPENAI_API_KEY` | — |
| Anthropic | `ANTHROPIC_API_KEY` | — |
| Gemini | `GEMINI_API_KEY` | — |
| Grok | *(keyless wrapper)* | — |
| Ollama | *(keyless)* | `OLLAMA_BASE_URL` |
| DeepSeek | `DEEPSEEK_API_KEY` | — |
| Mistral | `MISTRAL_API_KEY` | — |
| OpenRouter | `OPENROUTER_API_KEY` | — |
| Azure OpenAI | `AZURE_OPENAI_API_KEY` | `AZURE_OPENAI_ENDPOINT` |
| AWS Bedrock | `AWS_ACCESS_KEY_ID` (+ boto3) | — |
| FreeTheAi | `FREETHEAI_API_KEY` | `FREETHEAI_BASE` |

A provider shows as **not configured** (and is skipped) until its key is set —
no code change needed to light it up later.

## 8. Frontend

`frontend/src/pages/GatewayStudio.jsx` (route `/gateway`, sidebar "AI Gateway"):
usage tiles, default/fallback selectors, a provider grid with enable toggles +
health badges, the preferred-model-per-task table, usage-by-provider, and a live
"test the gateway" box. Purple gradient headings, Sora typography, no gold/amber.

## 9. Using the gateway from a module

```python
from app.gateway import gateway
cfg = await _load_gateway_config(ws)              # workspace config
res = await gateway.chat(system, user, cfg, task="chat", ws=ws)
if res.ok:
    text = res.output                             # + res.to_meta() for provider/cost/latency
```

The legacy `app.services.llm.llm_text` is itself a mini-gateway (fallback chain +
circuit breaker) and remains in place; the gateway reuses its proven provider
calls for the native set. New code should call `gateway.*`; existing callers can
migrate incrementally (strangler-fig) without a breaking change.

## 10. Extending

- **New provider** → add a `ProviderSpec` (and models) to `registry.py`; if it's
  OpenAI-compatible it works immediately, otherwise add a branch in `adapters.py`.
- **New capability** → add it to `capabilities.py`, declare it on providers, add
  an adapter method and a `gateway.<cap>()` wrapper.
- **New task routing** → appears automatically in the admin table from `TASKS`.

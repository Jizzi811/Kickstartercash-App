"""Provider / Model / Capability registries for the BrandMind AI Gateway.

Three registries, one source of truth:

- PROVIDER_REGISTRY – every supported provider, how to reach it (base url + which
  env var holds the key), and which capabilities it offers.
- MODEL_REGISTRY    – concrete models, their provider, capabilities and (rough,
  clearly-labelled) cost estimates used for cost estimation.
- capability_providers() – reverse index: capability -> providers that support it.

Adding a new provider or model is a data change here; no business code changes.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from .capabilities import (
    CHAT, VISION, IMAGE, EMBEDDINGS, SPEECH_TO_TEXT, TEXT_TO_SPEECH, STRUCTURED_OUTPUT,
)


@dataclass
class ProviderSpec:
    id: str
    label: str
    capabilities: List[str]
    api_key_env: Optional[str] = None       # env var holding the API key
    base_url_env: Optional[str] = None      # env var overriding the base url
    default_base_url: Optional[str] = None
    openai_compatible: bool = False         # uses the OpenAI /chat/completions shape
    keyless: bool = False                   # works without an API key (e.g. local ollama, grok wrapper)
    enabled_by_default: bool = False
    rpm_limit: int = 60                     # default requests-per-minute soft cap
    notes: str = ""

    def api_key(self) -> str:
        return os.environ.get(self.api_key_env, "") if self.api_key_env else ""

    def base_url(self) -> str:
        if self.base_url_env and os.environ.get(self.base_url_env):
            return os.environ[self.base_url_env]
        return self.default_base_url or ""

    def is_configured(self) -> bool:
        if self.keyless:
            return True
        return bool(self.api_key())


@dataclass
class ModelSpec:
    id: str
    provider: str
    capabilities: List[str]
    label: str = ""
    context: int = 0
    # rough cost estimates in USD per 1M tokens (input/output). 0 = free/local/unknown.
    cost_in: float = 0.0
    cost_out: float = 0.0
    aliases: List[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Provider Registry
# ---------------------------------------------------------------------------
PROVIDER_REGISTRY: Dict[str, ProviderSpec] = {
    "openai": ProviderSpec(
        "openai", "OpenAI",
        [CHAT, VISION, IMAGE, EMBEDDINGS, SPEECH_TO_TEXT, TEXT_TO_SPEECH, STRUCTURED_OUTPUT],
        api_key_env="OPENAI_API_KEY", default_base_url="https://api.openai.com/v1",
        openai_compatible=True, enabled_by_default=True, rpm_limit=500,
    ),
    "anthropic": ProviderSpec(
        "anthropic", "Anthropic (Claude)",
        [CHAT, VISION, STRUCTURED_OUTPUT],
        api_key_env="ANTHROPIC_API_KEY", default_base_url="https://api.anthropic.com/v1",
        enabled_by_default=True, rpm_limit=200,
    ),
    "gemini": ProviderSpec(
        "gemini", "Google Gemini",
        [CHAT, VISION, IMAGE, EMBEDDINGS, STRUCTURED_OUTPUT],
        api_key_env="GEMINI_API_KEY",
        enabled_by_default=True, rpm_limit=120,
    ),
    "grok": ProviderSpec(
        "grok", "xAI Grok",
        [CHAT, STRUCTURED_OUTPUT],
        keyless=True, enabled_by_default=False, rpm_limit=30,
        notes="Unofficial wrapper – no API key required.",
    ),
    "ollama": ProviderSpec(
        "ollama", "Ollama (local)",
        [CHAT, EMBEDDINGS, VISION],
        base_url_env="OLLAMA_BASE_URL", default_base_url="http://localhost:11434/v1",
        openai_compatible=True, keyless=True, enabled_by_default=False, rpm_limit=120,
        notes="Runs models locally; no key, needs a reachable Ollama server.",
    ),
    "deepseek": ProviderSpec(
        "deepseek", "DeepSeek",
        [CHAT, STRUCTURED_OUTPUT],
        api_key_env="DEEPSEEK_API_KEY", default_base_url="https://api.deepseek.com/v1",
        openai_compatible=True, rpm_limit=120,
    ),
    "mistral": ProviderSpec(
        "mistral", "Mistral",
        [CHAT, EMBEDDINGS, STRUCTURED_OUTPUT],
        api_key_env="MISTRAL_API_KEY", default_base_url="https://api.mistral.ai/v1",
        openai_compatible=True, rpm_limit=120,
    ),
    "openrouter": ProviderSpec(
        "openrouter", "OpenRouter",
        [CHAT, VISION, STRUCTURED_OUTPUT],
        api_key_env="OPENROUTER_API_KEY", default_base_url="https://openrouter.ai/api/v1",
        openai_compatible=True, rpm_limit=120,
        notes="Meta-router across many upstream models.",
    ),
    "azure": ProviderSpec(
        "azure", "Azure OpenAI",
        [CHAT, VISION, IMAGE, EMBEDDINGS, TEXT_TO_SPEECH, STRUCTURED_OUTPUT],
        api_key_env="AZURE_OPENAI_API_KEY", base_url_env="AZURE_OPENAI_ENDPOINT",
        openai_compatible=True, rpm_limit=240,
        notes="Set AZURE_OPENAI_ENDPOINT to your deployment base url.",
    ),
    "bedrock": ProviderSpec(
        "bedrock", "AWS Bedrock",
        [CHAT, EMBEDDINGS, IMAGE],
        api_key_env="AWS_ACCESS_KEY_ID", rpm_limit=120,
        notes="Requires AWS credentials + boto3; enabled once configured.",
    ),
    "freetheai": ProviderSpec(
        "freetheai", "FreeTheAi",
        [CHAT, IMAGE],
        api_key_env="FREETHEAI_API_KEY", base_url_env="FREETHEAI_BASE",
        default_base_url="https://api.freetheai.io/v1",
        openai_compatible=True, enabled_by_default=True, rpm_limit=60,
        notes="Free OpenAI-compatible gateway used as a resilience fallback.",
    ),
    "nvidia": ProviderSpec(
        "nvidia", "NVIDIA NIM",
        [CHAT, STRUCTURED_OUTPUT],
        api_key_env="NVIDIA_API_KEY", base_url_env="NVIDIA_BASE",
        default_base_url="https://integrate.api.nvidia.com/v1",
        openai_compatible=True, rpm_limit=120,
        notes="OpenAI-compatible NIM endpoint (build.nvidia.com). Set NVIDIA_API_KEY to enable.",
    ),
}


# ---------------------------------------------------------------------------
# Model Registry (cost = rough USD / 1M tokens; estimates only)
# ---------------------------------------------------------------------------
MODEL_REGISTRY: Dict[str, ModelSpec] = {m.id: m for m in [
    # OpenAI
    ModelSpec("gpt-5.2", "openai", [CHAT, VISION, STRUCTURED_OUTPUT], "GPT-5.2", 256000, 2.5, 10.0),
    ModelSpec("gpt-4o", "openai", [CHAT, VISION, STRUCTURED_OUTPUT], "GPT-4o", 128000, 2.5, 10.0),
    ModelSpec("gpt-4o-mini", "openai", [CHAT, VISION, STRUCTURED_OUTPUT], "GPT-4o mini", 128000, 0.15, 0.6),
    ModelSpec("text-embedding-3-large", "openai", [EMBEDDINGS], "Embedding 3 large", 8191, 0.13, 0.0),
    ModelSpec("text-embedding-3-small", "openai", [EMBEDDINGS], "Embedding 3 small", 8191, 0.02, 0.0),
    ModelSpec("gpt-image-1", "openai", [IMAGE], "GPT Image 1", 0, 0.0, 0.0),
    ModelSpec("gpt-4o-mini-tts", "openai", [TEXT_TO_SPEECH], "GPT-4o mini TTS", 0, 0.0, 0.0),
    ModelSpec("whisper-1", "openai", [SPEECH_TO_TEXT], "Whisper", 0, 0.0, 0.0),
    # Anthropic
    ModelSpec("claude-opus-4-8", "anthropic", [CHAT, VISION, STRUCTURED_OUTPUT], "Claude Opus 4.8", 200000, 5.0, 25.0),
    ModelSpec("claude-sonnet-4-6", "anthropic", [CHAT, VISION, STRUCTURED_OUTPUT], "Claude Sonnet 4.6", 200000, 3.0, 15.0),
    ModelSpec("claude-haiku-4-5-20251001", "anthropic", [CHAT, VISION, STRUCTURED_OUTPUT], "Claude Haiku 4.5", 200000, 0.8, 4.0, aliases=["claude-haiku-4-5"]),
    # Gemini
    ModelSpec("gemini-2.5-flash", "gemini", [CHAT, VISION, STRUCTURED_OUTPUT], "Gemini 2.5 Flash", 1000000, 0.3, 2.5),
    ModelSpec("gemini-2.5-pro", "gemini", [CHAT, VISION, STRUCTURED_OUTPUT], "Gemini 2.5 Pro", 2000000, 1.25, 10.0),
    ModelSpec("text-embedding-004", "gemini", [EMBEDDINGS], "Gemini Embedding 004", 2048, 0.0, 0.0),
    # Grok
    ModelSpec("grok-4", "grok", [CHAT, STRUCTURED_OUTPUT], "Grok 4", 128000, 0.0, 0.0),
    ModelSpec("grok-3-fast", "grok", [CHAT, STRUCTURED_OUTPUT], "Grok 3 Fast", 128000, 0.0, 0.0),
    # DeepSeek
    ModelSpec("deepseek-chat", "deepseek", [CHAT, STRUCTURED_OUTPUT], "DeepSeek Chat", 64000, 0.27, 1.1),
    ModelSpec("deepseek-reasoner", "deepseek", [CHAT, STRUCTURED_OUTPUT], "DeepSeek Reasoner", 64000, 0.55, 2.19),
    # Mistral
    ModelSpec("mistral-large-latest", "mistral", [CHAT, STRUCTURED_OUTPUT], "Mistral Large", 128000, 2.0, 6.0),
    ModelSpec("mistral-small-latest", "mistral", [CHAT, STRUCTURED_OUTPUT], "Mistral Small", 128000, 0.2, 0.6),
    ModelSpec("mistral-embed", "mistral", [EMBEDDINGS], "Mistral Embed", 8192, 0.1, 0.0),
    # OpenRouter (routes upstream; representative entries)
    ModelSpec("openrouter/auto", "openrouter", [CHAT, STRUCTURED_OUTPUT], "OpenRouter Auto", 128000, 0.0, 0.0),
    ModelSpec("anthropic/claude-sonnet-4.6", "openrouter", [CHAT, VISION, STRUCTURED_OUTPUT], "Claude Sonnet (via OR)", 200000, 3.0, 15.0),
    # Ollama (local, free)
    ModelSpec("llama3.1", "ollama", [CHAT], "Llama 3.1 (local)", 128000, 0.0, 0.0),
    ModelSpec("nomic-embed-text", "ollama", [EMBEDDINGS], "Nomic Embed (local)", 8192, 0.0, 0.0),
    # Azure (deployment names are user-defined; representative)
    ModelSpec("azure-gpt-4o", "azure", [CHAT, VISION, STRUCTURED_OUTPUT], "Azure GPT-4o", 128000, 2.5, 10.0),
    # Bedrock
    ModelSpec("anthropic.claude-sonnet-4-6-v1:0", "bedrock", [CHAT, VISION, STRUCTURED_OUTPUT], "Claude Sonnet (Bedrock)", 200000, 3.0, 15.0),
    # FreeTheAi (distinct id so it doesn't collide with OpenAI's gpt-4o in the registry)
    ModelSpec("freetheai/gpt-4o", "freetheai", [CHAT], "GPT-4o (FreeTheAi)", 128000, 0.0, 0.0),
    # NVIDIA NIM (OpenAI-compatible; cost depends on your NVIDIA plan → 0 = unknown)
    ModelSpec("meta/llama-3.1-70b-instruct", "nvidia", [CHAT, STRUCTURED_OUTPUT], "Llama 3.1 70B (NVIDIA)", 128000, 0.0, 0.0),
    ModelSpec("meta/llama-3.1-405b-instruct", "nvidia", [CHAT, STRUCTURED_OUTPUT], "Llama 3.1 405B (NVIDIA)", 128000, 0.0, 0.0),
    ModelSpec("nvidia/llama-3.1-nemotron-70b-instruct", "nvidia", [CHAT, STRUCTURED_OUTPUT], "Nemotron 70B (NVIDIA)", 128000, 0.0, 0.0),
    ModelSpec("mistralai/mixtral-8x7b-instruct-v0.1", "nvidia", [CHAT, STRUCTURED_OUTPUT], "Mixtral 8x7B (NVIDIA)", 32000, 0.0, 0.0),
]}


# Default model per (provider, capability) – used when a task has no explicit pick.
DEFAULT_MODEL_BY_CAP: Dict[str, Dict[str, str]] = {}
for _mid, _m in MODEL_REGISTRY.items():
    for _cap in _m.capabilities:
        DEFAULT_MODEL_BY_CAP.setdefault(_m.provider, {}).setdefault(_cap, _m.id)


def capability_providers(capability: str) -> List[str]:
    """Providers that declare support for a capability (registry order)."""
    return [pid for pid, p in PROVIDER_REGISTRY.items() if capability in p.capabilities]


def default_model_for(provider: str, capability: str) -> Optional[str]:
    return DEFAULT_MODEL_BY_CAP.get(provider, {}).get(capability)


def models_for(provider: str, capability: Optional[str] = None) -> List[ModelSpec]:
    out = [m for m in MODEL_REGISTRY.values() if m.provider == provider]
    if capability:
        out = [m for m in out if capability in m.capabilities]
    return out


def resolve_model(model_id: str) -> Optional[ModelSpec]:
    if model_id in MODEL_REGISTRY:
        return MODEL_REGISTRY[model_id]
    for m in MODEL_REGISTRY.values():
        if model_id in m.aliases:
            return m
    return None

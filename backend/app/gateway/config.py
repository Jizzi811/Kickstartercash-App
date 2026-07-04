"""Gateway configuration – what administrators control.

A GatewayConfig decides, per workspace:
  - which providers are enabled,
  - the default provider and the fallback provider,
  - the preferred provider/model for each task (chat, image, embeddings, …).

Stored config is merged over registry defaults, so a brand-new workspace already
has a sane, working configuration without any setup.
"""

from __future__ import annotations

from typing import Dict, Optional

from .capabilities import TASKS
from .registry import PROVIDER_REGISTRY, default_model_for


def default_enabled() -> Dict[str, bool]:
    return {pid: p.enabled_by_default for pid, p in PROVIDER_REGISTRY.items()}


def default_task_models() -> Dict[str, dict]:
    """Sensible defaults matching the user's example routing:
    chat→Claude, image→GPT Image, video-prompt→Gemini, embeddings→OpenAI."""
    picks = {
        "chat":         ("anthropic", "claude-sonnet-4-6"),
        "structured":   ("anthropic", "claude-sonnet-4-6"),
        "vision":       ("openai", "gpt-4o"),
        "image":        ("openai", "gpt-image-1"),
        "video_prompt": ("gemini", "gemini-2.5-flash"),
        "embeddings":   ("openai", "text-embedding-3-small"),
        "tts":          ("openai", "gpt-4o-mini-tts"),
        "stt":          ("openai", "whisper-1"),
    }
    out: Dict[str, dict] = {}
    for task, meta in TASKS.items():
        provider, model = picks.get(task, (None, None))
        if not provider:
            # fall back to any provider that supports the task's capability
            cap = meta["capability"]
            for pid, p in PROVIDER_REGISTRY.items():
                if cap in p.capabilities:
                    provider, model = pid, default_model_for(pid, cap)
                    break
        out[task] = {"provider": provider, "model": model}
    return out


def default_config() -> dict:
    return {
        "enabled": default_enabled(),
        "default_provider": "anthropic",
        "fallback_provider": "openai",
        "task_models": default_task_models(),
        "retry_max": 2,
        "timeout_seconds": 60,
    }


def merge_config(stored: Optional[dict]) -> dict:
    """Overlay a stored (possibly partial) config on top of the defaults."""
    cfg = default_config()
    if not stored:
        return cfg
    if isinstance(stored.get("enabled"), dict):
        cfg["enabled"].update({k: bool(v) for k, v in stored["enabled"].items() if k in cfg["enabled"]})
    for key in ("default_provider", "fallback_provider"):
        if stored.get(key) in PROVIDER_REGISTRY:
            cfg[key] = stored[key]
    if isinstance(stored.get("task_models"), dict):
        for task, pick in stored["task_models"].items():
            if task in cfg["task_models"] and isinstance(pick, dict):
                p = pick.get("provider")
                if p in PROVIDER_REGISTRY:
                    cfg["task_models"][task] = {"provider": p, "model": pick.get("model")}
    for key in ("retry_max", "timeout_seconds"):
        if isinstance(stored.get(key), int) and stored[key] > 0:
            cfg[key] = stored[key]
    return cfg

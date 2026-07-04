"""AIGateway – the single front door every business module uses.

Business modules ask for a *capability* and a *task*; the gateway resolves the
provider + model from config, then runs the cross-cutting pipeline:

    provider/model resolution
      -> health gate (configured + enabled + circuit-breaker)
      -> rate limit
      -> call with retry + backoff
      -> latency measurement
      -> cost estimation
      -> fallback to the next provider on failure
      -> usage tracking (DB) + structured logging

Nothing here special-cases a provider; it all flows through the registry, the
config and the uniform adapter interface.
"""

from __future__ import annotations

import asyncio
import logging
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import Any, Callable, List, Optional, Tuple

from app.core.database import db
from app.services.llm import _cb_is_open, _cb_record_failure, _cb_record_success

from .capabilities import CHAT, STRUCTURED_OUTPUT, EMBEDDINGS, TEXT_TO_SPEECH, IMAGE
from .registry import PROVIDER_REGISTRY, resolve_model, default_model_for, capability_providers
from .adapters import get_adapter, CapabilityNotSupported
from app.permissions import default_policy, evaluate

logger = logging.getLogger(__name__)


def _now_ms() -> int:
    return int(time.time() * 1000)


def _est_tokens(text: str) -> int:
    return max(1, len(text or "") // 4)


@dataclass
class GatewayResult:
    ok: bool
    capability: str
    provider: str = ""
    model: str = ""
    output: Any = None
    latency_ms: int = 0
    tokens_in: int = 0
    tokens_out: int = 0
    cost_usd: float = 0.0
    attempts: List[dict] = field(default_factory=list)
    error: str = ""

    def to_meta(self) -> dict:
        return {
            "provider": self.provider, "model": self.model, "capability": self.capability,
            "latency_ms": self.latency_ms, "tokens_in": self.tokens_in,
            "tokens_out": self.tokens_out, "cost_usd": round(self.cost_usd, 6),
            "attempts": self.attempts, "ok": self.ok,
        }


class AIGateway:
    def __init__(self):
        # sliding-window request timestamps per provider (rate limiting)
        self._rl: dict = defaultdict(lambda: deque())

    # ------------------------------------------------------------------ #
    # Health
    # ------------------------------------------------------------------ #
    def health_report(self, cfg: dict) -> List[dict]:
        enabled = cfg.get("enabled", {})
        out = []
        for pid, spec in PROVIDER_REGISTRY.items():
            out.append({
                "id": pid, "label": spec.label,
                "capabilities": spec.capabilities,
                "configured": spec.is_configured(),
                "enabled": bool(enabled.get(pid, spec.enabled_by_default)),
                "breaker_open": _cb_is_open(pid),
                "keyless": spec.keyless,
                "rpm_limit": spec.rpm_limit,
                "notes": spec.notes,
            })
        return out

    # ------------------------------------------------------------------ #
    # Rate limiting (soft, per-provider requests-per-minute)
    # ------------------------------------------------------------------ #
    def _rate_ok(self, provider: str) -> bool:
        limit = PROVIDER_REGISTRY[provider].rpm_limit
        win = self._rl[provider]
        cutoff = time.monotonic() - 60.0
        while win and win[0] < cutoff:
            win.popleft()
        return len(win) < limit

    def _rate_record(self, provider: str):
        self._rl[provider].append(time.monotonic())

    # ------------------------------------------------------------------ #
    # Cost estimation
    # ------------------------------------------------------------------ #
    def _estimate_cost(self, model_id: str, tokens_in: int, tokens_out: int) -> float:
        spec = resolve_model(model_id)
        if not spec:
            return 0.0
        return (tokens_in / 1_000_000) * spec.cost_in + (tokens_out / 1_000_000) * spec.cost_out

    # ------------------------------------------------------------------ #
    # Provider/model resolution -> ordered attempt chain
    # ------------------------------------------------------------------ #
    def _chain(self, task: str, capability: str, cfg: dict,
               explicit_model: Optional[str]) -> List[Tuple[str, str]]:
        chain: List[Tuple[str, str]] = []

        def add(provider: Optional[str], model: Optional[str]):
            if not provider or provider not in PROVIDER_REGISTRY:
                return
            if capability not in PROVIDER_REGISTRY[provider].capabilities:
                return
            model = model or default_model_for(provider, capability)
            if model and (provider, model) not in chain:
                chain.append((provider, model))

        # 1) explicit model wins
        if explicit_model:
            spec = resolve_model(explicit_model)
            if spec:
                add(spec.provider, spec.id)

        # 2) task-preferred provider/model
        pick = (cfg.get("task_models") or {}).get(task) or {}
        add(pick.get("provider"), pick.get("model"))

        # 3) default provider
        add(cfg.get("default_provider"), None)

        # 4) explicit fallback provider
        add(cfg.get("fallback_provider"), None)

        # 5) any other provider that supports the capability
        for pid in capability_providers(capability):
            add(pid, None)

        return chain

    # ------------------------------------------------------------------ #
    # Generic capability runner
    # ------------------------------------------------------------------ #
    async def _run(self, task: str, capability: str, cfg: dict,
                   call: Callable[[Any, str], Any], explicit_model: Optional[str],
                   tokens_in: int, ws: Optional[str], timeout: float,
                   retry_max: int, out_text_of: Callable[[Any], str]) -> GatewayResult:
        enabled = cfg.get("enabled", {})
        result = GatewayResult(ok=False, capability=capability)
        policy = cfg.get("permission_policy") or default_policy(ws)
        preflight = evaluate(policy, capability=capability, tokens_in=tokens_in, usage=cfg.get("usage_snapshot") or {})
        if not preflight.allowed:
            result.error = preflight.reason
            result.attempts.append({"ok": False, "error": preflight.reason, "permission": preflight.to_dict()})
            await self._record_usage(ws, capability, "", "", 0, tokens_in, 0, 0.0, False)
            return result
        chain = self._chain(task, capability, cfg, explicit_model)

        for provider, model in chain:
            spec = PROVIDER_REGISTRY[provider]
            decision = evaluate(policy, capability=capability, provider=provider, tokens_in=tokens_in, usage=cfg.get("usage_snapshot") or {})
            if not decision.allowed:
                result.attempts.append({"provider": provider, "model": model, "ok": False, "error": decision.reason, "permission": decision.to_dict()})
                continue
            if not enabled.get(provider, spec.enabled_by_default):
                continue
            if not spec.is_configured():
                result.attempts.append({"provider": provider, "model": model, "ok": False, "error": "not configured"})
                continue
            if _cb_is_open(provider):
                result.attempts.append({"provider": provider, "model": model, "ok": False, "error": "circuit open"})
                continue
            if not self._rate_ok(provider):
                result.attempts.append({"provider": provider, "model": model, "ok": False, "error": "rate limited"})
                continue

            adapter = get_adapter(spec)
            for attempt in range(max(1, retry_max)):
                t0 = _now_ms()
                try:
                    output = await asyncio.wait_for(call(adapter, model), timeout=timeout)
                    latency = _now_ms() - t0
                    self._rate_record(provider)
                    _cb_record_success(provider)
                    out_text = out_text_of(output)
                    tokens_out = _est_tokens(out_text) if out_text else 0
                    cost = self._estimate_cost(model, tokens_in, tokens_out)
                    result.ok = True
                    result.provider = provider
                    result.model = model
                    result.output = output
                    result.latency_ms = latency
                    result.tokens_in = tokens_in
                    result.tokens_out = tokens_out
                    result.cost_usd = cost
                    result.attempts.append({"provider": provider, "model": model, "ok": True, "latency_ms": latency})
                    logger.info(f"[gateway] {capability} via {provider}/{model} ok in {latency}ms (~${cost:.4f})")
                    await self._record_usage(ws, capability, provider, model, latency, tokens_in, tokens_out, cost, True)
                    return result
                except CapabilityNotSupported as e:
                    result.attempts.append({"provider": provider, "model": model, "ok": False, "error": str(e)})
                    break  # no point retrying an unsupported capability
                except Exception as e:  # noqa: BLE001
                    _cb_record_failure(provider)
                    result.attempts.append({"provider": provider, "model": model, "ok": False, "error": str(e)[:160]})
                    logger.warning(f"[gateway] {capability} via {provider}/{model} failed: {e}")
                    if attempt < retry_max - 1:
                        await asyncio.sleep(0.4 * (2 ** attempt))  # backoff

        result.error = "all providers failed"
        await self._record_usage(ws, capability, "", "", 0, tokens_in, 0, 0.0, False)
        return result

    # ------------------------------------------------------------------ #
    # Usage tracking
    # ------------------------------------------------------------------ #
    async def _record_usage(self, ws, capability, provider, model, latency_ms,
                            tokens_in, tokens_out, cost, ok):
        if db is None:
            return
        try:
            import uuid
            from datetime import datetime, timezone
            await db.gateway_usage.insert_one({
                "id": str(uuid.uuid4()),
                "workspace_id": ws or "",
                "capability": capability, "provider": provider, "model": model,
                "latency_ms": latency_ms, "tokens_in": tokens_in, "tokens_out": tokens_out,
                "cost_usd": cost, "ok": ok,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        except Exception as e:  # noqa: BLE001
            logger.warning(f"[gateway] usage record failed: {e}")

    # ------------------------------------------------------------------ #
    # Public capability methods
    # ------------------------------------------------------------------ #
    async def chat(self, system: str, user: str, cfg: dict, task: str = "chat",
                   model_choice: Optional[str] = None, ws: Optional[str] = None,
                   grok_extra: Optional[dict] = None) -> GatewayResult:
        capability = STRUCTURED_OUTPUT if task == "structured" else CHAT
        tokens_in = _est_tokens(system) + _est_tokens(user)
        return await self._run(
            task, capability, cfg,
            call=lambda ad, model: ad.chat(model, system, user, grok_extra),
            explicit_model=model_choice, tokens_in=tokens_in, ws=ws,
            timeout=float(cfg.get("timeout_seconds", 60)), retry_max=int(cfg.get("retry_max", 2)),
            out_text_of=lambda o: o if isinstance(o, str) else "",
        )

    async def embeddings(self, texts: List[str], cfg: dict, task: str = "embeddings",
                         model_choice: Optional[str] = None, ws: Optional[str] = None) -> GatewayResult:
        tokens_in = sum(_est_tokens(t) for t in texts)
        return await self._run(
            task, EMBEDDINGS, cfg,
            call=lambda ad, model: ad.embeddings(model, texts),
            explicit_model=model_choice, tokens_in=tokens_in, ws=ws,
            timeout=float(cfg.get("timeout_seconds", 60)), retry_max=int(cfg.get("retry_max", 2)),
            out_text_of=lambda o: "",
        )

    async def tts(self, text: str, cfg: dict, voice: str = "alloy", task: str = "tts",
                  model_choice: Optional[str] = None, ws: Optional[str] = None) -> GatewayResult:
        return await self._run(
            task, TEXT_TO_SPEECH, cfg,
            call=lambda ad, model: ad.tts(model, text, voice),
            explicit_model=model_choice, tokens_in=_est_tokens(text), ws=ws,
            timeout=float(cfg.get("timeout_seconds", 90)), retry_max=int(cfg.get("retry_max", 2)),
            out_text_of=lambda o: "",
        )

    async def image(self, prompt: str, cfg: dict, size: str = "1024x1024", task: str = "image",
                    model_choice: Optional[str] = None, ws: Optional[str] = None) -> GatewayResult:
        return await self._run(
            task, IMAGE, cfg,
            call=lambda ad, model: ad.image(model, prompt, size),
            explicit_model=model_choice, tokens_in=_est_tokens(prompt), ws=ws,
            timeout=float(cfg.get("timeout_seconds", 180)), retry_max=int(cfg.get("retry_max", 2)),
            out_text_of=lambda o: "",
        )


# module-level singleton
gateway = AIGateway()

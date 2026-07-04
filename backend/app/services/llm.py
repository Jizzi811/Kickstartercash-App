"""LLM / provider layer – text generation across providers, with a per-provider
circuit breaker and a resilient fallback chain.

Extracted from server.py (Sprint 0.2, strangler-fig refactor). server.py
imports these names, so runtime behaviour is unchanged.
"""
import sys
import re
import json
import time
import uuid
import asyncio
import logging
from collections import defaultdict
from pathlib import Path

from fastapi import HTTPException
import anthropic

from app.core.config import (
    OPENAI_API_KEY, GEMINI_API_KEY, EMERGENT_LLM_KEY, ANTHROPIC_API_KEY,
    FREETHEAI_API_KEY, FREETHEAI_BASE, OPENAI_TEXT_MODEL, FREETHEAI_TEXT_MODEL,
)

logger = logging.getLogger(__name__)

# grok_core lives at the backend root – ensure it's importable regardless of
# import order.
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

# --- Optional providers -----------------------------------------------------
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    _HAS_EMERGENT = True
except ImportError:
    LlmChat = None
    UserMessage = None
    _HAS_EMERGENT = False

try:
    from grok_core import Grok as GrokClient
    _HAS_GROK = True
except Exception:
    GrokClient = None
    _HAS_GROK = False

_anthropic_client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None

MODEL_MAP = {
    "gpt": ("openai", OPENAI_TEXT_MODEL),
    "gemini": ("gemini", "gemini-2.5-flash"),
    # Claude models — routed directly via Anthropic SDK
    "claude-opus-4-8": ("anthropic", "claude-opus-4-8"),
    "claude-sonnet-4-6": ("anthropic", "claude-sonnet-4-6"),
    "claude-haiku-4-5": ("anthropic", "claude-haiku-4-5-20251001"),
    "claude": ("anthropic", "claude-sonnet-4-6"),
    # Grok (xAI) — routed via unofficial wrapper (no API key needed)
    "grok": ("grok", "grok-3-fast"),
    "grok-3-fast": ("grok", "grok-3-fast"),
    "grok-3-auto": ("grok", "grok-3-auto"),
    "grok-4": ("grok", "grok-4"),
    # FreeTheAi (OpenAI-compatible free gateway)
    "freetheai": ("freetheai", FREETHEAI_TEXT_MODEL),
}
IMAGE_MODEL = "gemini-3.1-flash-image-preview"


def _api_key_for(provider: str) -> str:
    """Use the user's own provider key when configured, otherwise the Emergent universal key."""
    if provider == "openai" and OPENAI_API_KEY:
        return OPENAI_API_KEY
    if provider == "gemini" and GEMINI_API_KEY:
        return GEMINI_API_KEY
    return EMERGENT_LLM_KEY


# ---------------------------------------------------------------------------
# Circuit Breaker — per-provider failure tracking
# ---------------------------------------------------------------------------
_cb_failures: dict = defaultdict(int)
_cb_open_until: dict = defaultdict(float)
_CB_THRESHOLD = 3       # failures before opening
_CB_COOLDOWN = 60.0     # seconds before retry


def _cb_is_open(provider: str) -> bool:
    if _cb_open_until[provider] > time.monotonic():
        return True
    return False


def _cb_record_failure(provider: str):
    _cb_failures[provider] += 1
    if _cb_failures[provider] >= _CB_THRESHOLD:
        _cb_open_until[provider] = time.monotonic() + _CB_COOLDOWN
        logger.warning(f"Circuit breaker OPEN for provider: {provider}")


def _cb_record_success(provider: str):
    _cb_failures[provider] = 0
    _cb_open_until[provider] = 0.0


async def _llm_single(provider: str, model: str, system_message: str, user_text: str, grok_extra_data: dict = None) -> str:
    """Call one specific provider/model. Raises on failure."""
    if provider == "grok":
        if not _HAS_GROK:
            raise RuntimeError("Grok wrapper not installed")
        prompt = f"{system_message}\n\n{user_text}" if system_message else user_text
        result = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: GrokClient(model).start_convo(prompt, grok_extra_data)
        )
        if "error" in result:
            raise RuntimeError(str(result["error"]))
        return result.get("response", "")

    if provider == "anthropic" and _anthropic_client:
        msg = await _anthropic_client.messages.create(
            model=model,
            max_tokens=4096,
            system=system_message,
            messages=[{"role": "user", "content": user_text}],
        )
        return msg.content[0].text

    if provider == "gemini" and GEMINI_API_KEY:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        gmodel = genai.GenerativeModel(
            model_name=model,
            system_instruction=system_message,
        )
        resp = await asyncio.to_thread(
            lambda: gmodel.generate_content(user_text)
        )
        return resp.text

    if provider == "freetheai":
        if not FREETHEAI_API_KEY:
            raise RuntimeError("FREETHEAI_API_KEY not set")

        def _call():
            import requests
            messages = []
            if system_message:
                messages.append({"role": "system", "content": system_message})
            messages.append({"role": "user", "content": user_text})
            r = requests.post(
                f"{FREETHEAI_BASE}/chat/completions",
                headers={"Authorization": f"Bearer {FREETHEAI_API_KEY}", "Content-Type": "application/json"},
                json={"model": model, "messages": messages},
                timeout=60,
            )
            r.raise_for_status()
            return (((r.json().get("choices") or [{}])[0]).get("message") or {}).get("content", "")

        return await asyncio.to_thread(_call)

    if provider == "openai" and OPENAI_API_KEY:
        # Direct OpenAI Chat Completions – so the "gpt" button actually uses the
        # user's OPENAI_API_KEY instead of silently falling back to Gemini.
        def _call_openai():
            import requests
            messages = []
            if system_message:
                messages.append({"role": "system", "content": system_message})
            messages.append({"role": "user", "content": user_text})
            r = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
                json={"model": model, "messages": messages},
                timeout=90,
            )
            if not r.ok:
                raise RuntimeError(f"OpenAI {r.status_code}: {r.text[:200]}")
            return (((r.json().get("choices") or [{}])[0]).get("message") or {}).get("content", "") or ""

        return await asyncio.to_thread(_call_openai)

    if not _HAS_EMERGENT:
        raise RuntimeError("No LLM provider available (Emergent not installed, no direct keys)")
    chat = LlmChat(api_key=_api_key_for(provider), session_id=str(uuid.uuid4()), system_message=system_message)
    chat.with_model(provider, model)
    resp = await chat.send_message(UserMessage(text=user_text))
    if isinstance(resp, str):
        return resp
    return getattr(resp, "content", str(resp))


# Fallback chain: if requested provider is unavailable, try these in order
_FALLBACK_CHAIN = [
    ("anthropic", "claude-sonnet-4-6"),
    ("gemini", "gemini-2.5-flash"),
    ("openai", "gpt-5.2"),
    ("freetheai", FREETHEAI_TEXT_MODEL),
]


async def llm_text(model_choice: str, system_message: str, user_text: str, grok_extra_data: dict = None) -> str:
    provider, model = MODEL_MAP.get(model_choice, MODEL_MAP["gpt"])

    # Try requested provider first (skip if circuit breaker open)
    if not _cb_is_open(provider):
        try:
            result = await asyncio.wait_for(
                _llm_single(provider, model, system_message, user_text, grok_extra_data),
                timeout=60.0
            )
            _cb_record_success(provider)
            return result
        except Exception as e:
            _cb_record_failure(provider)
            logger.warning(f"LLM provider '{provider}' failed: {e}. Trying fallback chain.")

    # Fallback chain
    for fb_provider, fb_model in _FALLBACK_CHAIN:
        if fb_provider == provider:
            continue
        if _cb_is_open(fb_provider):
            continue
        try:
            result = await asyncio.wait_for(
                _llm_single(fb_provider, fb_model, system_message, user_text),
                timeout=30.0
            )
            _cb_record_success(fb_provider)
            logger.info(f"Fallback to '{fb_provider}' succeeded.")
            return result
        except Exception as e:
            _cb_record_failure(fb_provider)
            logger.warning(f"Fallback '{fb_provider}' also failed: {e}")

    raise HTTPException(status_code=503, detail="All LLM providers unavailable. Please try again shortly.")


def _extract_json(text: str):
    """Pull a JSON object/array out of an LLM response that may be fenced."""
    if not text:
        return None
    fence = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
    candidate = fence.group(1) if fence else text
    candidate = candidate.strip()
    # find first { or [ and matching last } or ]
    start = min([i for i in [candidate.find('{'), candidate.find('[')] if i != -1], default=-1)
    if start == -1:
        return None
    end = max(candidate.rfind('}'), candidate.rfind(']'))
    if end == -1 or end < start:
        return None
    try:
        return json.loads(candidate[start:end + 1])
    except json.JSONDecodeError:
        return None

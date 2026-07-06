"""Provider adapters – one uniform interface, many providers behind it.

Every adapter exposes the same async surface (``chat``, ``embeddings``, ``tts``,
``image``) and raises ``CapabilityNotSupported`` for anything it doesn't do. The
gateway core never special-cases a provider; it just asks the adapter.

To avoid re-implementing (and re-breaking) providers that already work, chat for
the native set (openai/anthropic/gemini/grok/freetheai) delegates to the proven
``app.services.llm._llm_single``. New OpenAI-compatible providers (OpenRouter,
DeepSeek, Mistral, Azure, Ollama) get a direct HTTP path here.
"""

from __future__ import annotations

import asyncio
import base64
import logging
import os
from typing import List, Optional

from .registry import ProviderSpec

logger = logging.getLogger(__name__)
_NVIDIA_BASE_DEFAULT = "https://integrate.api.nvidia.com/v1"
_NVIDIA_DEEPSEEK_MODEL = "deepseek-ai/deepseek-r1"
_NVIDIA_MISTRAL_MODEL = "mistralai/mixtral-8x7b-instruct-v0.1"

# chat for these providers is handled by the existing, tested llm layer
NATIVE_CHAT = {"openai", "anthropic", "gemini", "grok", "freetheai"}


class CapabilityNotSupported(Exception):
    pass


class ProviderAdapter:
    def __init__(self, spec: ProviderSpec):
        self.spec = spec

    # -- chat ---------------------------------------------------------------
    async def chat(self, model: str, system: str, user: str, grok_extra: Optional[dict] = None) -> str:
        pid = self.spec.id
        if pid in NATIVE_CHAT:
            from app.services.llm import _llm_single  # reuse the proven path
            return await _llm_single(pid, model, system, user, grok_extra)
        if self.spec.openai_compatible:
            return await asyncio.to_thread(self._oai_chat, model, system, user)
        if pid == "bedrock":
            return await asyncio.to_thread(self._bedrock_chat, model, system, user)
        raise CapabilityNotSupported(f"chat not supported by provider '{pid}'")

    # -- embeddings ---------------------------------------------------------
    async def embeddings(self, model: str, texts: List[str]) -> List[List[float]]:
        pid = self.spec.id
        if pid == "gemini":
            return await asyncio.to_thread(self._gemini_embed, model, texts)
        if self.spec.openai_compatible:
            return await asyncio.to_thread(self._oai_embed, model, texts)
        raise CapabilityNotSupported(f"embeddings not supported by provider '{pid}'")

    # -- text to speech -----------------------------------------------------
    async def tts(self, model: str, text: str, voice: str = "alloy") -> str:
        """Returns base64-encoded audio (mp3)."""
        if self.spec.id in ("openai", "azure"):
            return await asyncio.to_thread(self._openai_tts, model, text, voice)
        raise CapabilityNotSupported(f"tts not supported by provider '{self.spec.id}'")

    # -- image generation ---------------------------------------------------
    async def image(self, model: str, prompt: str, size: str = "1024x1024") -> str:
        """Returns a data: URL or remote URL for the generated image."""
        if self.spec.id in ("openai", "azure"):
            return await asyncio.to_thread(self._openai_image, model, prompt, size)
        raise CapabilityNotSupported(f"image not supported by provider '{self.spec.id}'")

    # ======================================================================
    # HTTP implementations
    # ======================================================================
    def _headers(self) -> dict:
        key = self.spec.api_key()
        headers = {"Content-Type": "application/json"}
        if self.spec.id == "azure":
            if key:
                headers["api-key"] = key
        elif key:
            headers["Authorization"] = f"Bearer {key}"
        if self.spec.id == "openrouter":
            headers["HTTP-Referer"] = "https://brandmind.app"
            headers["X-Title"] = "BrandMind"
        return headers

    def _uses_nvidia_fallback(self) -> bool:
        return self.spec.id in {"deepseek", "mistral"} and not os.environ.get(self.spec.api_key_env or "", "") and bool(os.environ.get("NVIDIA_API_KEY", ""))

    def _effective_model(self, model: str) -> str:
        if not self._uses_nvidia_fallback():
            return model
        if self.spec.id == "deepseek":
            return os.environ.get("NVIDIA_MODEL_DEEPSEEK", _NVIDIA_DEEPSEEK_MODEL)
        if self.spec.id == "mistral":
            return os.environ.get("NVIDIA_MODEL_MISTRAL", _NVIDIA_MISTRAL_MODEL)
        return model

    def _chat_url(self) -> str:
        if self._uses_nvidia_fallback():
            return f"{os.environ.get('NVIDIA_BASE', _NVIDIA_BASE_DEFAULT).rstrip('/')}/chat/completions"
        base = self.spec.base_url().rstrip("/")
        if not base:
            raise RuntimeError(f"{self.spec.id}: base url not configured")
        if self.spec.id == "azure":
            # AZURE_OPENAI_ENDPOINT already points at the deployment base
            return f"{base}/chat/completions?api-version=2024-06-01"
        return f"{base}/chat/completions"

    def _oai_chat(self, model: str, system: str, user: str) -> str:
        import requests
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": user})
        effective_model = self._effective_model(model)
        r = requests.post(self._chat_url(), headers=self._headers(),
                          json={"model": effective_model, "messages": messages}, timeout=90)
        if not r.ok:
            raise RuntimeError(f"{self.spec.id} {r.status_code}: {r.text[:200]}")
        return (((r.json().get("choices") or [{}])[0]).get("message") or {}).get("content", "") or ""

    def _oai_embed(self, model: str, texts: List[str]) -> List[List[float]]:
        if self._uses_nvidia_fallback():
            raise RuntimeError(
                f"{self.spec.id} embeddings require {self.spec.api_key_env}; NVIDIA fallback supports chat routing only"
            )
        import requests
        base = self.spec.base_url().rstrip("/")
        url = f"{base}/embeddings"
        if self.spec.id == "azure":
            url = f"{base}/embeddings?api-version=2024-06-01"
        r = requests.post(url, headers=self._headers(),
                          json={"model": model, "input": texts}, timeout=60)
        if not r.ok:
            raise RuntimeError(f"{self.spec.id} embeddings {r.status_code}: {r.text[:200]}")
        return [row["embedding"] for row in r.json().get("data", [])]

    def _gemini_embed(self, model: str, texts: List[str]) -> List[List[float]]:
        import google.generativeai as genai
        genai.configure(api_key=self.spec.api_key())
        out = []
        for t in texts:
            res = genai.embed_content(model=f"models/{model}", content=t)
            out.append(res["embedding"])
        return out

    def _openai_tts(self, model: str, text: str, voice: str) -> str:
        import requests
        base = "https://api.openai.com/v1" if self.spec.id == "openai" else self.spec.base_url().rstrip("/")
        r = requests.post(f"{base}/audio/speech", headers=self._headers(),
                          json={"model": model, "voice": voice or "alloy", "input": text}, timeout=90)
        if not r.ok:
            raise RuntimeError(f"{self.spec.id} tts {r.status_code}: {r.text[:200]}")
        return base64.b64encode(r.content).decode("utf-8")

    def _openai_image(self, model: str, prompt: str, size: str) -> str:
        import requests
        base = "https://api.openai.com/v1" if self.spec.id == "openai" else self.spec.base_url().rstrip("/")
        r = requests.post(f"{base}/images/generations", headers=self._headers(),
                          json={"model": model, "prompt": prompt, "size": size, "n": 1}, timeout=180)
        if not r.ok:
            raise RuntimeError(f"{self.spec.id} image {r.status_code}: {r.text[:200]}")
        data = (r.json().get("data") or [{}])[0]
        if data.get("b64_json"):
            return f"data:image/png;base64,{data['b64_json']}"
        return data.get("url", "")

    def _bedrock_chat(self, model: str, system: str, user: str) -> str:
        try:
            import boto3
        except ImportError:
            raise RuntimeError("AWS Bedrock requires boto3 and AWS credentials")
        import json
        client = boto3.client("bedrock-runtime")
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "system": system,
            "messages": [{"role": "user", "content": user}],
        }
        resp = client.invoke_model(modelId=model, body=json.dumps(body))
        payload = json.loads(resp["body"].read())
        return (payload.get("content") or [{}])[0].get("text", "")


def get_adapter(spec: ProviderSpec) -> ProviderAdapter:
    return ProviderAdapter(spec)

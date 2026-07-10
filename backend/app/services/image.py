"""Image generation provider layer.

Extracted from server.py as part of the Sprint 0.2 strangler-fig refactor.
server.py imports these names back so API behaviour stays unchanged.
"""
import asyncio
import base64
import logging
import os
import urllib.parse
import uuid
from typing import Optional

from app.core.config import (
    EMERGENT_LLM_KEY, FREETHEAI_API_KEY, FREETHEAI_BASE, FREETHEAI_IMAGE_MODEL,
    GEMINI_API_KEY, NVIDIA_API_KEY, NVIDIA_IMAGE_BASE, NVIDIA_MODEL_FLUX2,
    NVIDIA_MODEL_FLUX_SCHNELL, NVIDIA_MODEL_QWEN, NVIDIA_MODEL_SD3, OPENAI_API_KEY,
)
from app.services.llm import IMAGE_MODEL, LlmChat, UserMessage

logger = logging.getLogger(__name__)

async def pollinations_image(prompt: str, width: int = 1024, height: int = 1024) -> Optional[str]:
    """Free image generation via Pollinations.ai (no API key)."""
    seed = uuid.uuid4().int % 1_000_000
    enc = urllib.parse.quote(prompt, safe="")
    url = (
        f"https://image.pollinations.ai/prompt/{enc}"
        f"?width={width}&height={height}&nologo=true&model=flux&seed={seed}"
    )

    def _fetch():
        import requests
        r = requests.get(url, timeout=120)
        if r.ok and r.content and r.headers.get("content-type", "").startswith("image"):
            b64 = base64.b64encode(r.content).decode("utf-8")
            return f"data:{r.headers.get('content-type', 'image/jpeg')};base64,{b64}"
        return None

    return await asyncio.to_thread(_fetch)


async def gemini_nano_banana(prompt: str, size: str = "1:1", image_urls: Optional[list] = None) -> Optional[str]:
    """Image generation via Google's official Gemini API (Nano Banana / gemini-2.5-flash-image)."""
    if not GEMINI_API_KEY:
        return None

    def _generate():
        import importlib
        genai_mod = importlib.import_module("google.genai")
        types_mod = importlib.import_module("google.genai.types")
        client = genai_mod.Client(api_key=GEMINI_API_KEY)

        contents: list = []
        if image_urls:
            import requests
            for u in image_urls[:3]:
                try:
                    rr = requests.get(u, timeout=15)
                    if rr.ok and rr.content:
                        mime = (rr.headers.get("content-type") or "image/png").split(";")[0]
                        contents.append(types_mod.Part.from_bytes(data=rr.content, mime_type=mime))
                except Exception as fe:
                    logger.warning(f"Reference image fetch failed: {fe}")
        contents.append(prompt[:5000])

        # Try progressively simpler configs – SDK/model versions differ in what they accept.
        config_attempts = []
        try:
            config_attempts.append(types_mod.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
                image_config=types_mod.ImageConfig(aspect_ratio=size),
            ))
        except Exception:
            pass
        try:
            config_attempts.append(types_mod.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"]))
        except Exception:
            pass
        config_attempts.append(None)

        last_err = None
        for cfg in config_attempts:
            try:
                kwargs = {"config": cfg} if cfg is not None else {}
                resp = client.models.generate_content(
                    model="gemini-2.5-flash-image", contents=contents, **kwargs,
                )
            except Exception as ge:
                last_err = ge
                continue
            for cand in getattr(resp, "candidates", None) or []:
                parts = getattr(getattr(cand, "content", None), "parts", None) or []
                for part in parts:
                    inline = getattr(part, "inline_data", None)
                    data = getattr(inline, "data", None) if inline is not None else None
                    if data:
                        b64 = data if isinstance(data, str) else base64.b64encode(data).decode("utf-8")
                        mime = getattr(inline, "mime_type", None) or "image/png"
                        return f"data:{mime};base64,{b64}"
        if last_err:
            raise last_err
        return None

    try:
        return await asyncio.wait_for(asyncio.to_thread(_generate), timeout=120)
    except Exception as e:
        logger.error(f"Gemini image generation failed: {e}")
        return None


def _size_to_wh(size: str) -> str:
    """Map an aspect-ratio label to an OpenAI-style WxH size string."""
    return {
        "1:1": "1024x1024",
        "16:9": "1792x1024",
        "9:16": "1024x1792",
        "4:3": "1024x768",
        "3:4": "768x1024",
    }.get(size, "1024x1024")


async def freetheai_image(prompt: str, size: str = "1:1", image_urls: Optional[list] = None) -> Optional[str]:
    """Image generation via FreeTheAi (OpenAI-compatible /v1/images/generations, e.g. gpt-image-2)."""
    if not FREETHEAI_API_KEY:
        return None

    def _generate():
        import requests
        headers = {"Authorization": f"Bearer {FREETHEAI_API_KEY}", "Content-Type": "application/json"}
        payload = {"model": FREETHEAI_IMAGE_MODEL, "prompt": prompt[:5000], "size": _size_to_wh(size), "n": 1}
        # If a reference image (brand logo) is given, prefer the edits endpoint.
        endpoint = "/images/generations"
        if image_urls:
            payload["image"] = image_urls[0]
            endpoint = "/images/edits"
        r = requests.post(f"{FREETHEAI_BASE}{endpoint}", headers=headers, json=payload, timeout=120)
        if not r.ok:
            # Retry a plain generation if the edits route rejected the request.
            if image_urls:
                payload.pop("image", None)
                r = requests.post(f"{FREETHEAI_BASE}/images/generations", headers=headers, json=payload, timeout=120)
            if not r.ok:
                logger.warning(f"FreeTheAi image {r.status_code}: {r.text[:200]}")
                return None
        data = (r.json().get("data") or [{}])[0]
        b64 = data.get("b64_json")
        if b64:
            return f"data:image/png;base64,{b64}"
        url = data.get("url")
        if url:
            rr = requests.get(url, timeout=60)
            if rr.ok and rr.content:
                ct = rr.headers.get("content-type", "image/png")
                return f"data:{ct};base64,{base64.b64encode(rr.content).decode('utf-8')}"
        return None

    try:
        return await asyncio.wait_for(asyncio.to_thread(_generate), timeout=130)
    except Exception as e:
        logger.error(f"FreeTheAi image generation failed: {e}")
        return None


OPENAI_IMAGE_MODEL = os.environ.get('OPENAI_IMAGE_MODEL', 'gpt-image-1')


async def openai_image(prompt: str, size: str = "1:1", image_urls: Optional[list] = None) -> Optional[str]:
    """Image generation via OpenAI Images API (gpt-image-1). Reliable, needs OPENAI_API_KEY with billing."""
    if not OPENAI_API_KEY:
        return None
    size_map = {"1:1": "1024x1024", "16:9": "1536x1024", "9:16": "1024x1536",
                "4:3": "1536x1024", "3:4": "1024x1536"}

    def _generate():
        import requests
        r = requests.post(
            "https://api.openai.com/v1/images/generations",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
            json={"model": OPENAI_IMAGE_MODEL, "prompt": prompt[:4000],
                  "size": size_map.get(size, "1024x1024"), "n": 1,
                  "quality": os.environ.get("OPENAI_IMAGE_QUALITY", "high")},
            timeout=180,
        )
        if not r.ok:
            logger.warning(f"OpenAI image {r.status_code}: {r.text[:200]}")
            return None
        data = (r.json().get("data") or [{}])[0]
        b64 = data.get("b64_json")
        if b64:
            return f"data:image/png;base64,{b64}"
        url = data.get("url")
        if url:
            rr = requests.get(url, timeout=60)
            if rr.ok and rr.content:
                return f"data:image/png;base64,{base64.b64encode(rr.content).decode('utf-8')}"
        return None

    try:
        return await asyncio.wait_for(asyncio.to_thread(_generate), timeout=190)
    except Exception as e:
        logger.error(f"OpenAI image generation failed: {e}")
        return None


async def brand_image_verbose(prompt: str, size: str = "1:1", image_urls: Optional[list] = None):
    """Try providers in order; return (image_or_None, per_provider_status_dict)."""
    providers = []
    if FREETHEAI_API_KEY:
        providers.append(("FreeTheAi", freetheai_image))
    if OPENAI_API_KEY:
        providers.append(("OpenAI", openai_image))
    providers.append(("Gemini", gemini_nano_banana))

    status = {}
    for name, fn in providers:
        try:
            img = await fn(prompt, size=size, image_urls=image_urls)
            if img:
                status[name] = "ok"
                return img, status
            status[name] = "kein Bild"
        except Exception as e:
            status[name] = str(e)[:160]
            logger.warning(f"{name} image failed, trying next provider: {e}")
    logger.error(f"All image providers failed: {status}")
    return None, status


async def brand_image(prompt: str, size: str = "1:1", image_urls: Optional[list] = None) -> Optional[str]:
    """Best-available brand image: FreeTheAi -> OpenAI (gpt-image-1) -> Gemini."""
    img, _ = await brand_image_verbose(prompt, size=size, image_urls=image_urls)
    return img


def _size_to_nvidia_wh(size: str) -> tuple:
    """Map an aspect-ratio label to (width, height) pixels (multiples of 64)."""
    return {
        "1:1": (1024, 1024),
        "16:9": (1344, 768),
        "9:16": (768, 1344),
        "4:3": (1152, 896),
        "3:4": (896, 1152),
    }.get(size, (1024, 1024))


async def nvidia_image(prompt: str, size: str = "1:1", image_urls: Optional[list] = None,
                       model: str = NVIDIA_MODEL_FLUX2) -> Optional[str]:
    """Image generation via NVIDIA's cloud genai API (Flux 2 / Flux schnell / Qwen / SD 3.5).

    Uses the same NVIDIA_API_KEY as the text provider:
      POST {NVIDIA_IMAGE_BASE}/{publisher}/{model}  with "Authorization: Bearer <key>".
    Payload is the minimal {prompt, width, height, seed} that every NVIDIA image NIM accepts
    (flux.1-schnell rejects any extra field with 422). Response: {"artifacts":[{"base64": ...}]}.
    """
    if not NVIDIA_API_KEY:
        return None
    w, h = _size_to_nvidia_wh(size)
    # Use a dynamic non-zero seed so repeated calls with the same prompt
    # can still produce diverse variants (seed=0 made outputs too similar).
    seed = (uuid.uuid4().int % 2_147_483_647) or 1

    def _generate():
        import requests
        url = f"{NVIDIA_IMAGE_BASE.rstrip('/')}/{model.strip('/')}"
        r = requests.post(
            url,
            headers={"Authorization": f"Bearer {NVIDIA_API_KEY}",
                     "Accept": "application/json", "Content-Type": "application/json"},
            json={"prompt": prompt[:5000], "width": w, "height": h, "seed": seed},
            timeout=180,
        )
        if not r.ok:
            logger.warning(f"NVIDIA image {r.status_code}: {r.text[:200]}")
            return None
        body = r.json()
        # NVIDIA genai shape: {"artifacts": [{"base64": "..."}]}
        arts = body.get("artifacts") or []
        if arts and arts[0].get("base64"):
            b64 = arts[0]["base64"]
            return b64 if b64.startswith("data:") else f"data:image/png;base64,{b64}"
        # OpenAI-compatible fallbacks (self-hosted NIM): data[].b64_json / image
        data = body.get("data") or []
        if data and data[0].get("b64_json"):
            return f"data:image/png;base64,{data[0]['b64_json']}"
        img = body.get("image")
        if img:
            return img if img.startswith("data:") else f"data:image/png;base64,{img}"
        return None

    try:
        return await asyncio.wait_for(asyncio.to_thread(_generate), timeout=190)
    except Exception as e:
        logger.error(f"NVIDIA image generation failed: {e}")
        return None


# Design-Studio image models: friendly id -> engine (+ NVIDIA model slug).
# "gpt" keeps the existing best-available provider chain; the rest route to
# NVIDIA (build.nvidia.com), all served by the single NVIDIA_API_KEY.
IMAGE_MODELS = {
    "gpt":          {"label": "GPT Image",            "engine": "default"},
    "nano-banana":  {"label": "Nano Banana",         "engine": "nano-banana"},
    "flux2":        {"label": "Flux 2",               "engine": "nvidia", "model": NVIDIA_MODEL_FLUX2},
    "flux-schnell": {"label": "Flux.1 [schnell]",     "engine": "nvidia", "model": NVIDIA_MODEL_FLUX_SCHNELL},
    "qwen-image":   {"label": "Qwen Image",           "engine": "nvidia", "model": NVIDIA_MODEL_QWEN},
    "sd3":          {"label": "Stable Diffusion 3.5", "engine": "nvidia", "model": NVIDIA_MODEL_SD3},
}


async def image_by_model_verbose(model_key: str, prompt: str, size: str = "1:1",
                                 image_urls: Optional[list] = None):
    """Route an image request by the Design-Studio model choice.

    Returns (image_or_None, per-provider status dict), matching brand_image_verbose.
    """
    spec = IMAGE_MODELS.get(model_key) or IMAGE_MODELS["gpt"]
    if spec.get("engine") == "nano-banana":
        try:
            img = await gemini_nano_banana(prompt, size=size, image_urls=image_urls)
            return img, {"Gemini Nano Banana": "ok" if img else "kein Bild"}
        except Exception as e:  # noqa: BLE001
            return None, {"Gemini Nano Banana": str(e)[:160]}
    if spec.get("engine") == "nvidia":
        if not NVIDIA_API_KEY:
            return None, {spec["label"]: "NVIDIA_API_KEY not set – set it to use this model"}
        try:
            img = await nvidia_image(prompt, size=size, image_urls=image_urls, model=spec["model"])
            return img, {spec["label"]: "ok" if img else "kein Bild"}
        except Exception as e:  # noqa: BLE001
            return None, {spec["label"]: str(e)[:160]}
    # default: existing best-available chain (FreeTheAi -> OpenAI -> Gemini)
    return await brand_image_verbose(prompt, size=size, image_urls=image_urls)


async def llm_image(prompt: str, reference_b64: Optional[str] = None) -> Optional[str]:
    from emergentintegrations.llm.chat import ImageContent
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=str(uuid.uuid4()),
                   system_message="You are an elite brand designer that creates premium marketing visuals.")
    chat.with_model("gemini", IMAGE_MODEL).with_params(modalities=["image", "text"])
    if reference_b64:
        msg = UserMessage(text=prompt, file_contents=[ImageContent(reference_b64)])
    else:
        msg = UserMessage(text=prompt)
    _text, images = await chat.send_message_multimodal_response(msg)
    if images:
        img = images[0]
        return f"data:{img['mime_type']};base64,{img['data']}"
    return None

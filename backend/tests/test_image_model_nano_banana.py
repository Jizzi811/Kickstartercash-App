import asyncio
import os

os.environ.setdefault("MONGO_URL", "")

import server  # noqa: E402


def test_nano_banana_model_uses_nano_banana_engine():
    assert server.IMAGE_MODELS["nano-banana"]["engine"] == "nano-banana"


def test_nano_banana_routes_to_gemini_fallback_when_poyo_unset(monkeypatch):
    monkeypatch.setattr(server, "POYO_API_KEY", "")

    async def _fake_gemini(prompt, size="1:1", image_urls=None):
        return "data:image/png;base64,test"

    monkeypatch.setattr(server, "gemini_nano_banana", _fake_gemini)
    img, status = asyncio.run(server.image_by_model_verbose("nano-banana", "test prompt", size="1:1"))
    assert img and img.startswith("data:image/")
    assert status.get("Gemini Nano Banana") == "ok"

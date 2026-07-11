import asyncio
import os

os.environ.setdefault("MONGO_URL", "")

import server  # noqa: E402
from app.services import image as image_service  # noqa: E402


def test_nano_banana_model_uses_nano_banana_engine():
    assert server.IMAGE_MODELS["nano-banana"]["engine"] == "nano-banana"


def test_nano_banana_routes_to_gemini_directly(monkeypatch):
    async def _fake_gemini(prompt, size="1:1", image_urls=None):
        return "data:image/png;base64,test"

    # image_by_model_verbose lives in app.services.image and resolves
    # gemini_nano_banana from its own module, not via the server re-export.
    monkeypatch.setattr(image_service, "gemini_nano_banana", _fake_gemini)
    img, status = asyncio.run(server.image_by_model_verbose("nano-banana", "test prompt", size="1:1"))
    assert img and img.startswith("data:image/")
    assert status.get("Gemini Nano Banana") == "ok"

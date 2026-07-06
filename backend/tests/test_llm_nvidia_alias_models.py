import os

os.environ.setdefault("MONGO_URL", "")

from app.core import config
from app.services import llm


def test_deepseek_alias_routes_via_nvidia():
    provider, model = llm.MODEL_MAP["deepseek"]
    assert provider == "nvidia"
    assert model == config.NVIDIA_MODEL_DEEPSEEK


def test_mistral_alias_routes_via_nvidia():
    provider, model = llm.MODEL_MAP["mistral"]
    assert provider == "nvidia"
    assert model == config.NVIDIA_MODEL_MISTRAL

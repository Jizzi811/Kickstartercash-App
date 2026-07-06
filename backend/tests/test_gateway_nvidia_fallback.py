from app.gateway.registry import PROVIDER_REGISTRY


def test_deepseek_provider_uses_nvidia_key_fallback(monkeypatch):
    monkeypatch.delenv("DEEPSEEK_API_KEY", raising=False)
    monkeypatch.setenv("NVIDIA_API_KEY", "nvapi-test")
    monkeypatch.setenv("NVIDIA_BASE", "https://integrate.api.nvidia.com/v1")
    spec = PROVIDER_REGISTRY["deepseek"]
    assert spec.api_key() == "nvapi-test"
    assert spec.base_url() == "https://integrate.api.nvidia.com/v1"
    assert spec.is_configured() is True


def test_mistral_provider_prefers_own_key_when_present(monkeypatch):
    monkeypatch.setenv("MISTRAL_API_KEY", "mistral-key")
    monkeypatch.setenv("NVIDIA_API_KEY", "nvapi-test")
    spec = PROVIDER_REGISTRY["mistral"]
    assert spec.api_key() == "mistral-key"

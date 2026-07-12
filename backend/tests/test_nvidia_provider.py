"""Wiring test for the NVIDIA (OpenAI-compatible) provider.

Spins up a tiny local server that mimics NVIDIA's OpenAI-compatible
/chat/completions endpoint, points NVIDIA_BASE/NVIDIA_API_KEY at it, and asserts:
  * the main llm layer (model choice "nvidia") reaches the endpoint, and
  * the AI Gateway routes an NVIDIA model to the same endpoint,
with the correct Bearer auth header, URL and model in the request body.

No real NVIDIA key or network access required.

The suite runs many test modules in one process and app.core.config freezes
NVIDIA_BASE/NVIDIA_API_KEY at first import, so env vars set here at module
import don't reach app.services.llm when another test imported the app first.
Each test therefore binds an ephemeral port and monkeypatches the frozen
module constants (the gateway reads os.environ at call time, so setenv covers it).
"""
import asyncio
import json
import os
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

os.environ.setdefault("MONGO_URL", "")  # avoid DB dependency for this test
os.environ.setdefault("NVIDIA_API_KEY", "nvapi-test-key")

_received = []


class _Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):  # silence
        pass

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length) or b"{}")
        _received.append({
            "path": self.path,
            "auth": self.headers.get("Authorization"),
            "model": body.get("model"),
            "messages": body.get("messages"),
        })
        payload = json.dumps({
            "choices": [{"message": {"role": "assistant", "content": "Hallo von NVIDIA NIM"}}]
        }).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


def _serve():
    srv = HTTPServer(("127.0.0.1", 0), _Handler)  # ephemeral port: no clashes across tests/workers
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    base = f"http://127.0.0.1:{srv.server_address[1]}/v1"
    return srv, base


def test_llm_layer_routes_to_nvidia(monkeypatch):
    srv, base = _serve()
    try:
        from app.services import llm as llm_module
        monkeypatch.setattr(llm_module, "NVIDIA_BASE", base)
        monkeypatch.setattr(llm_module, "NVIDIA_API_KEY", "nvapi-test-key")

        assert llm_module.MODEL_MAP["nvidia"] == ("nvidia", "meta/llama-3.1-70b-instruct")
        out = asyncio.run(llm_module.llm_text("nvidia", "Du bist hilfreich.", "Sag Hallo"))
        assert out == "Hallo von NVIDIA NIM"
        last = _received[-1]
        assert last["path"] == "/v1/chat/completions"
        assert last["auth"] == "Bearer nvapi-test-key"
        assert last["model"] == "meta/llama-3.1-70b-instruct"
    finally:
        srv.shutdown()
        srv.server_close()


def test_gateway_routes_nvidia_model(monkeypatch):
    srv, base = _serve()
    try:
        monkeypatch.setenv("NVIDIA_BASE", base)
        monkeypatch.setenv("NVIDIA_API_KEY", "nvapi-test-key")

        from app.gateway.core import gateway
        from app.gateway.config import merge_config
        from app.gateway.registry import PROVIDER_REGISTRY, resolve_model

        # provider registered + configured (key present) + model resolvable
        assert "nvidia" in PROVIDER_REGISTRY
        assert PROVIDER_REGISTRY["nvidia"].is_configured() is True
        assert resolve_model("meta/llama-3.1-405b-instruct").provider == "nvidia"

        cfg = merge_config({"enabled": {"nvidia": True}, "default_provider": "nvidia"})
        res = asyncio.run(gateway.chat(
            "Du bist hilfreich.", "Sag Hallo", cfg,
            model_choice="meta/llama-3.1-70b-instruct",
        ))
        assert res.ok is True, res.error
        assert res.provider == "nvidia"
        assert res.output == "Hallo von NVIDIA NIM"
        last = _received[-1]
        assert last["auth"] == "Bearer nvapi-test-key"
        assert last["model"] == "meta/llama-3.1-70b-instruct"
    finally:
        srv.shutdown()
        srv.server_close()

"""Wiring test for the NVIDIA (OpenAI-compatible) provider.

Spins up a tiny local server that mimics NVIDIA's OpenAI-compatible
/chat/completions endpoint, points NVIDIA_BASE/NVIDIA_API_KEY at it, and asserts:
  * the main llm layer (model choice "nvidia") reaches the endpoint, and
  * the AI Gateway routes an NVIDIA model to the same endpoint,
with the correct Bearer auth header, URL and model in the request body.

No real NVIDIA key or network access required.
"""
import asyncio
import json
import os
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

# --- Configure NVIDIA env BEFORE importing the app (module-level constants) ---
_PORT = 8199
os.environ["NVIDIA_API_KEY"] = "nvapi-test-key"
os.environ["NVIDIA_BASE"] = f"http://127.0.0.1:{_PORT}/v1"
os.environ["NVIDIA_TEXT_MODEL"] = "meta/llama-3.1-70b-instruct"
os.environ.setdefault("MONGO_URL", "")  # avoid DB dependency for this test

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
    srv = HTTPServer(("127.0.0.1", _PORT), _Handler)
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    return srv


def test_llm_layer_routes_to_nvidia():
    srv = _serve()
    try:
        from app.services.llm import llm_text, MODEL_MAP
        assert MODEL_MAP["nvidia"] == ("nvidia", "meta/llama-3.1-70b-instruct")
        out = asyncio.run(llm_text("nvidia", "Du bist hilfreich.", "Sag Hallo"))
        assert out == "Hallo von NVIDIA NIM"
        last = _received[-1]
        assert last["path"] == "/v1/chat/completions"
        assert last["auth"] == "Bearer nvapi-test-key"
        assert last["model"] == "meta/llama-3.1-70b-instruct"
    finally:
        srv.shutdown()


def test_gateway_routes_nvidia_model():
    srv = _serve()
    try:
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


if __name__ == "__main__":
    test_llm_layer_routes_to_nvidia()
    test_gateway_routes_nvidia_model()
    print("NVIDIA provider wiring: ALL CHECKS PASSED")

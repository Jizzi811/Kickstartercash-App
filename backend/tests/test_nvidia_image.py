"""Wiring test for the NVIDIA image provider used by Design Studio.

Starts a local mock of NVIDIA's cloud genai API, points NVIDIA_IMAGE_BASE /
NVIDIA_API_KEY at it, and asserts:
  * each Design-Studio image model (flux2 / flux-schnell / qwen-image / sd3)
    routes to the correct NVIDIA publisher/model path with a Bearer auth header
    and the aspect ratio mapped to width/height, and
  * the returned artifacts[0].base64 is surfaced as a data: URL, while `gpt`
    does NOT hit NVIDIA.

No real NVIDIA key or network access required.
"""
import asyncio
import base64
import json
import os
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

_PORT = 8233
os.environ["NVIDIA_API_KEY"] = "nvapi-test-key"
os.environ["NVIDIA_IMAGE_BASE"] = f"http://127.0.0.1:{_PORT}/v1/genai"
os.environ.setdefault("MONGO_URL", "")

# tiny 1x1 PNG, base64 (no data: prefix), like NVIDIA returns
_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
_received = []


class _Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length) or b"{}")
        _received.append({
            "path": self.path,
            "auth": self.headers.get("Authorization"),
            "width": body.get("width"),
            "height": body.get("height"),
            "keys": sorted(body.keys()),
        })
        payload = json.dumps({"artifacts": [{"base64": _B64, "finishReason": "SUCCESS"}]}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


def _serve():
    srv = HTTPServer(("127.0.0.1", _PORT), _Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def test_nvidia_models_route_correctly():
    srv = _serve()
    try:
        import server
        cases = {
            "flux2": ("black-forest-labs/flux.2-klein-4b", (1024, 1024), "1:1"),
            "flux-schnell": ("black-forest-labs/flux.1-schnell", (1344, 768), "16:9"),
            "qwen-image": ("qwen/qwen-image", (768, 1344), "9:16"),
            "sd3": ("stabilityai/stable-diffusion-3.5-large", (1152, 896), "4:3"),
        }
        for model_key, (slug, (w, h), ratio) in cases.items():
            _received.clear()
            img, status = asyncio.run(
                server.image_by_model_verbose(model_key, "a red cube", size=ratio)
            )
            assert img and img.startswith("data:image/"), f"{model_key}: {status}"
            last = _received[-1]
            assert last["path"] == f"/v1/genai/{slug}", f"{model_key} path {last['path']}"
            assert last["auth"] == "Bearer nvapi-test-key"
            assert (last["width"], last["height"]) == (w, h), f"{model_key} size {last['width']}x{last['height']}"
            # flux.1-schnell rejects extra fields: payload must be exactly these 4
            assert last["keys"] == ["height", "prompt", "seed", "width"], last["keys"]
    finally:
        srv.shutdown()


def test_gpt_model_does_not_hit_nvidia():
    srv = _serve()
    try:
        import server
        _received.clear()
        img, status = asyncio.run(server.image_by_model_verbose("gpt", "a red cube", size="1:1"))
        assert _received == [], "gpt must not call NVIDIA image API"
    finally:
        srv.shutdown()


if __name__ == "__main__":
    test_nvidia_models_route_correctly()
    test_gpt_model_does_not_hit_nvidia()
    print("NVIDIA image wiring: ALL CHECKS PASSED")

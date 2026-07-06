"""Wiring test for the fal.ai image provider used by Design Studio.

Starts a local mock fal.ai server, points FAL_BASE/FAL_KEY at it, and asserts:
  * each Design-Studio image model (flux2 / flux-schnell / qwen-image / sd3)
    routes to the correct fal model slug with `Authorization: Key ...` and the
    aspect-ratio mapped to a fal `image_size` enum, and
  * the returned image is surfaced as a data: URL, while `gpt` does NOT hit fal.

No real fal.ai key or network access required.
"""
import asyncio
import base64
import json
import os
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

_PORT = 8232
os.environ["FAL_KEY"] = "fal-test-key"
os.environ["FAL_BASE"] = f"http://127.0.0.1:{_PORT}"
os.environ.setdefault("MONGO_URL", "")

# 1x1 transparent PNG
_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
)
_received = []


class _Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_GET(self):
        # Serve the "generated" image URL that fal points back to.
        self.send_response(200)
        self.send_header("Content-Type", "image/png")
        self.send_header("Content-Length", str(len(_PNG)))
        self.end_headers()
        self.wfile.write(_PNG)

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length) or b"{}")
        _received.append({
            "path": self.path,
            "auth": self.headers.get("Authorization"),
            "image_size": body.get("image_size"),
            "prompt": body.get("prompt"),
        })
        payload = json.dumps({
            "images": [{"url": f"http://127.0.0.1:{_PORT}/img.png", "content_type": "image/png"}]
        }).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


def _serve():
    srv = HTTPServer(("127.0.0.1", _PORT), _Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def test_fal_models_route_correctly():
    srv = _serve()
    try:
        import server
        cases = {
            "flux2": ("fal-ai/flux-2", "square_hd", "1:1"),
            "flux-schnell": ("fal-ai/flux/schnell", "landscape_16_9", "16:9"),
            "qwen-image": ("fal-ai/qwen-image", "portrait_16_9", "9:16"),
            "sd3": ("fal-ai/stable-diffusion-3", "landscape_4_3", "4:3"),
        }
        for model_key, (slug, fal_size, ratio) in cases.items():
            _received.clear()
            img, status = asyncio.run(
                server.image_by_model_verbose(model_key, "a red cube", size=ratio)
            )
            assert img and img.startswith("data:image/"), f"{model_key}: {status}"
            last = _received[-1]
            assert last["path"] == f"/{slug}", f"{model_key} path {last['path']}"
            assert last["auth"] == "Key fal-test-key"
            assert last["image_size"] == fal_size, f"{model_key} size {last['image_size']}"
    finally:
        srv.shutdown()


def test_gpt_model_does_not_hit_fal():
    srv = _serve()
    try:
        import server
        _received.clear()
        # gpt routes to the existing chain; with no provider keys it yields no image,
        # but crucially it must NOT call the fal endpoint.
        img, status = asyncio.run(server.image_by_model_verbose("gpt", "a red cube", size="1:1"))
        assert _received == [], "gpt must not call fal.ai"
    finally:
        srv.shutdown()


if __name__ == "__main__":
    test_fal_models_route_correctly()
    test_gpt_model_does_not_hit_fal()
    print("fal.ai image wiring: ALL CHECKS PASSED")

"""Central configuration – all environment-derived settings live here.

Extracted from server.py (Sprint 0.2, strangler-fig refactor). server.py
imports these names, so runtime behaviour is unchanged. Over the next steps
more modules will read their config from here instead of calling os.environ
directly.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# .env lives at the backend package root (backend/.env).
# config.py is backend/app/core/config.py → parents[2] == backend/
BACKEND_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_DIR / ".env")

# --- Database ---------------------------------------------------------------
MONGO_URL = os.environ.get("MONGO_URL", "")
DB_NAME = os.environ.get("DB_NAME", "kickstartercash")

# --- LLM / provider keys ----------------------------------------------------
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# --- Email ------------------------------------------------------------------
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
# Comma-separated list of emails that receive KASH chat reports
REPORT_EMAILS: list[str] = [
    e.strip() for e in os.environ.get("KASH_REPORT_EMAILS", "").split(",") if e.strip()
]

# --- NVIDIA image models (Flux 2, Flux schnell, Qwen, SD 3.5) ---------------
# Uses the SAME NVIDIA key as the text provider. Cloud genai API:
#   POST {NVIDIA_IMAGE_BASE}/{publisher}/{model}  (Authorization: Bearer nvapi-...)
# -> {"artifacts": [{"base64": "..."}]}. Each model slug is overridable so an
# operator can swap it without a code change.
NVIDIA_API_KEY = os.environ.get("NVIDIA_API_KEY", "")  # shared with the NVIDIA text provider
NVIDIA_IMAGE_BASE = os.environ.get("NVIDIA_IMAGE_BASE", "https://ai.api.nvidia.com/v1/genai")
NVIDIA_MODEL_FLUX2 = os.environ.get("NVIDIA_MODEL_FLUX2", "black-forest-labs/flux.2-klein-4b")
NVIDIA_MODEL_FLUX_SCHNELL = os.environ.get("NVIDIA_MODEL_FLUX_SCHNELL", "black-forest-labs/flux.1-schnell")
NVIDIA_MODEL_QWEN = os.environ.get("NVIDIA_MODEL_QWEN", "qwen/qwen-image")
NVIDIA_MODEL_SD3 = os.environ.get("NVIDIA_MODEL_SD3", "stabilityai/stable-diffusion-3.5-large")

# --- FreeTheAi – free OpenAI-compatible gateway (gpt-image-2 etc.) -----------
FREETHEAI_API_KEY = os.environ.get("FREETHEAI_API_KEY", "")
FREETHEAI_BASE = os.environ.get("FREETHEAI_BASE", "https://api.freetheai.xyz/v1")
FREETHEAI_IMAGE_MODEL = os.environ.get("FREETHEAI_IMAGE_MODEL", "eve/gpt-image-2")
FREETHEAI_TEXT_MODEL = os.environ.get("FREETHEAI_TEXT_MODEL", "opc/deepseek-v4-flash-free")
FREETHEAI_TTS_MODEL = os.environ.get("FREETHEAI_TTS_MODEL", "xai/grok-tts")

# --- NVIDIA NIM – OpenAI-compatible endpoint (build.nvidia.com) -------------
NVIDIA_API_KEY = os.environ.get("NVIDIA_API_KEY", "")
NVIDIA_BASE = os.environ.get("NVIDIA_BASE", "https://integrate.api.nvidia.com/v1")
NVIDIA_TEXT_MODEL = os.environ.get("NVIDIA_TEXT_MODEL", "meta/llama-3.1-70b-instruct")
# Optional aliases used when users pick DeepSeek/Mistral without dedicated keys.
# These models are called through the same NVIDIA NIM endpoint/key.
NVIDIA_MODEL_DEEPSEEK = os.environ.get("NVIDIA_MODEL_DEEPSEEK", "deepseek-ai/deepseek-r1")
NVIDIA_MODEL_MISTRAL = os.environ.get("NVIDIA_MODEL_MISTRAL", "mistralai/mixtral-8x7b-instruct-v0.1")

# --- OpenAI model overrides -------------------------------------------------
# The "gpt" button's text model. Overridable so a non-technical operator can
# swap it in Render (e.g. to gpt-4o) without a code change.
OPENAI_TEXT_MODEL = os.environ.get("OPENAI_TEXT_MODEL", "gpt-5.2")

# --- Misc -------------------------------------------------------------------
LOGO_URL = (
    "https://customer-assets.emergentagent.com/job_5234ef58-250d-4475-b61a-24b76051aa69/"
    "artifacts/y4lzk2ct_WhatsApp%20Image%202026-06-24%20at%2010.55.48.jpeg"
)

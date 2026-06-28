import os
import re
import json
import uuid
import base64
import asyncio
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

from emergentintegrations.llm.chat import LlmChat, UserMessage
import resend
import funnel as funnel_renderer

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
POYO_API_KEY = os.environ.get('POYO_API_KEY', '')
POYO_BASE = "https://api.poyo.ai"
LOGO_URL = "https://customer-assets.emergentagent.com/job_5234ef58-250d-4475-b61a-24b76051aa69/artifacts/y4lzk2ct_WhatsApp%20Image%202026-06-24%20at%2010.55.48.jpeg"
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

app = FastAPI(title="Kickstarter Content Maschine")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# LLM helpers
# ---------------------------------------------------------------------------
MODEL_MAP = {
    "gpt": ("openai", "gpt-5.2"),
    "gemini": ("gemini", "gemini-2.5-flash"),
}
IMAGE_MODEL = "gemini-3.1-flash-image-preview"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _api_key_for(provider: str) -> str:
    """Use the user's own provider key when configured, otherwise the Emergent universal key."""
    if provider == "openai" and OPENAI_API_KEY:
        return OPENAI_API_KEY
    if provider == "gemini" and GEMINI_API_KEY:
        return GEMINI_API_KEY
    return EMERGENT_LLM_KEY


async def llm_text(model_choice: str, system_message: str, user_text: str) -> str:
    provider, model = MODEL_MAP.get(model_choice, MODEL_MAP["gpt"])
    chat = LlmChat(api_key=_api_key_for(provider), session_id=str(uuid.uuid4()), system_message=system_message)
    chat.with_model(provider, model)
    resp = await chat.send_message(UserMessage(text=user_text))
    if isinstance(resp, str):
        return resp
    return getattr(resp, "content", str(resp))


def _extract_json(text: str):
    """Pull a JSON object/array out of an LLM response that may be fenced."""
    if not text:
        return None
    fence = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
    candidate = fence.group(1) if fence else text
    candidate = candidate.strip()
    # find first { or [ and matching last } or ]
    start = min([i for i in [candidate.find('{'), candidate.find('[')] if i != -1], default=-1)
    if start == -1:
        return None
    end = max(candidate.rfind('}'), candidate.rfind(']'))
    if end == -1 or end < start:
        return None
    try:
        return json.loads(candidate[start:end + 1])
    except json.JSONDecodeError:
        return None


import urllib.parse


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


async def poyo_nano_banana(prompt: str, size: str = "1:1", image_urls: Optional[list] = None) -> Optional[str]:
    """Image generation via poyo.ai Nano Banana (Google Gemini 2.5 Flash Image).
    When image_urls are provided, uses nano-banana-edit to composite reference images (e.g. brand logo)."""
    if not POYO_API_KEY:
        return None
    auth = {"Authorization": f"Bearer {POYO_API_KEY}"}
    model = "nano-banana-edit" if image_urls else "nano-banana"
    payload_input = {"prompt": prompt[:5000], "size": size}
    if image_urls:
        payload_input["image_urls"] = image_urls

    def _submit():
        import requests
        r = requests.post(
            f"{POYO_BASE}/api/generate/submit",
            headers={**auth, "Content-Type": "application/json"},
            json={"model": model, "input": payload_input},
            timeout=30,
        )
        if r.status_code == 402:
            raise RuntimeError("Poyo.ai Guthaben aufgebraucht. Bitte unter poyo.ai aufladen. / Poyo.ai credits exhausted, please top up.")
        r.raise_for_status()
        return (r.json().get("data") or {}).get("task_id")

    def _status(task_id):
        import requests
        r = requests.get(f"{POYO_BASE}/api/generate/status/{task_id}", headers=auth, timeout=30)
        r.raise_for_status()
        return r.json().get("data") or {}

    def _fetch_b64(url):
        import requests
        r = requests.get(url, timeout=60)
        if r.ok and r.content:
            ct = r.headers.get("content-type", "image/png")
            return f"data:{ct};base64,{base64.b64encode(r.content).decode('utf-8')}"
        return None

    task_id = await asyncio.to_thread(_submit)
    if not task_id:
        return None
    for _ in range(40):
        await asyncio.sleep(3)
        data = await asyncio.to_thread(_status, task_id)
        status = data.get("status")
        if status == "finished":
            img = next((f["file_url"] for f in data.get("files", []) if f.get("file_type") == "image"), None)
            return await asyncio.to_thread(_fetch_b64, img) if img else None
        if status == "failed":
            logger.error(f"Poyo nano-banana failed: {data.get('error_message')}")
            return None
    return None


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


def _brand_context(brand: dict, language: str) -> str:
    lang = "Deutsch" if language == "DE" else "English"
    return (
        f"BRAND GUIDELINES (always respect strictly):\n"
        f"- Brand name: {brand.get('name')}\n"
        f"- Slogan: {brand.get('slogan')}\n"
        f"- Primary color: {brand.get('primary_color')}, Secondary: {brand.get('secondary_color')}, Accent: {brand.get('accent_color')}\n"
        f"- Heading font: {brand.get('font_heading')}, Body font: {brand.get('font_body')}\n"
        f"- Tone of voice: {brand.get('tone')}\n"
        f"- Visual / image style: {brand.get('image_style')}\n"
        f"Write everything in {lang}. Keep the brand's tonality consistent."
    )


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class Brand(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slogan: str = ""
    primary_color: str = "#D4AF37"
    secondary_color: str = "#050505"
    accent_color: str = "#F3E5AB"
    font_heading: str = "Playfair Display"
    font_body: str = "Manrope"
    tone: str = "Premium, exklusiv, selbstbewusst"
    image_style: str = "Luxuriös, schwarz-gold, cinematisch, hoher Kontrast"
    logo_url: str = ""
    is_default: bool = False
    created_at: str = Field(default_factory=_now_iso)


class BrandCreate(BaseModel):
    name: str
    slogan: str = ""
    primary_color: str = "#D4AF37"
    secondary_color: str = "#050505"
    accent_color: str = "#F3E5AB"
    font_heading: str = "Playfair Display"
    font_body: str = "Manrope"
    tone: str = "Premium, exklusiv, selbstbewusst"
    image_style: str = "Luxuriös, schwarz-gold, cinematisch, hoher Kontrast"
    logo_url: str = ""


class SocialRequest(BaseModel):
    topic: str
    platforms: List[str]
    brand_id: str
    model: str = "claude"
    language: str = "DE"


class CopyRequest(BaseModel):
    topic: str
    format: str
    brand_id: str
    model: str = "claude"
    language: str = "DE"


class ImageRequest(BaseModel):
    prompt: str
    style: str = "Luxuriös"
    brand_id: str
    language: str = "DE"
    apply_logo: bool = False
    size: str = "1:1"


class PromptOptimizeRequest(BaseModel):
    prompt: str
    model: str = "claude"
    language: str = "DE"


class CampaignRequest(BaseModel):
    topic: str
    platforms: List[str] = ["Instagram", "Facebook", "LinkedIn"]
    brand_id: str
    model: str = "claude"
    language: str = "DE"
    apply_logo: bool = False
    image_style: str = "Luxuriös"


class CalendarRequest(BaseModel):
    topic: str
    days: int = 30
    platforms: List[str] = ["Instagram", "Facebook", "LinkedIn"]
    brand_id: str
    model: str = "claude"
    language: str = "DE"


class LandingpageRequest(BaseModel):
    topic: str
    brand_id: str
    model: str = "claude"
    language: str = "DE"


class AnalyzeRequest(BaseModel):
    content: str
    content_type: str = "Text"
    brand_id: str
    model: str = "claude"
    language: str = "DE"


class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []
    model: str = "gpt"
    language: str = "DE"


class FunnelConfig(BaseModel):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:10])
    reflink: str
    name: str
    phone: str = ""
    whatsapp: str = ""
    email: str
    role: str = ""
    city: str = ""
    telegram: str = ""
    instagram: str = ""
    cta_text: str = ""
    photo: str = ""
    impressum_url: str = ""
    datenschutz_url: str = ""
    countdown_enabled: bool = False
    webinar_date: str = ""
    created_at: str = Field(default_factory=_now_iso)


class FunnelCreate(BaseModel):
    reflink: str
    name: str
    phone: str = ""
    whatsapp: str = ""
    email: str
    role: str = ""
    city: str = ""
    telegram: str = ""
    instagram: str = ""
    cta_text: str = ""
    photo: str = ""
    impressum_url: str = ""
    datenschutz_url: str = ""
    countdown_enabled: bool = False
    webinar_date: str = ""


class FunnelLead(BaseModel):
    vorname: str = ""
    nachname: str = ""
    email: str = ""
    telefon: str = ""
    land: str = ""
    nachricht: str = ""


# ---------------------------------------------------------------------------
# Brand endpoints
# ---------------------------------------------------------------------------
DEFAULT_BRAND = {
    "id": "kickstartercash",
    "name": "KickstarterCash.club",
    "slogan": "Exclusivity starts with your membership",
    "primary_color": "#D4AF37",
    "secondary_color": "#050505",
    "accent_color": "#F3E5AB",
    "font_heading": "Playfair Display",
    "font_body": "Manrope",
    "tone": "Premium, exklusiv, luxuriös, selbstbewusst, motivierend",
    "image_style": "Luxuriös, schwarz-gold, cinematisch, Dubai-Skyline-Ästhetik, hoher Kontrast, goldene Lichteffekte",
    "logo_url": "https://customer-assets.emergentagent.com/job_5234ef58-250d-4475-b61a-24b76051aa69/artifacts/nwxii717_bloom-generated-1782456245045.png",
    "is_default": True,
    "created_at": _now_iso(),
}


@app.on_event("startup")
async def seed_default_brand():
    existing = await db.brands.find_one({"id": DEFAULT_BRAND["id"]})
    if not existing:
        await db.brands.insert_one({**DEFAULT_BRAND})
        logger.info("Seeded default KickstarterCash brand")


@api_router.get("/")
async def root():
    return {"message": "Kickstarter Content Maschine API"}


@api_router.get("/brands", response_model=List[Brand])
async def list_brands():
    docs = await db.brands.find({}, {"_id": 0}).to_list(1000)
    docs.sort(key=lambda d: (not d.get("is_default", False), d.get("created_at", "")))
    return docs


@api_router.get("/brands/{brand_id}", response_model=Brand)
async def get_brand(brand_id: str):
    doc = await db.brands.find_one({"id": brand_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Brand not found")
    return doc


@api_router.post("/brands", response_model=Brand)
async def create_brand(payload: BrandCreate):
    brand = Brand(**payload.model_dump())
    await db.brands.insert_one(brand.model_dump())
    return brand


@api_router.put("/brands/{brand_id}", response_model=Brand)
async def update_brand(brand_id: str, payload: BrandCreate):
    doc = await db.brands.find_one({"id": brand_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Brand not found")
    update = payload.model_dump()
    await db.brands.update_one({"id": brand_id}, {"$set": update})
    doc.update(update)
    return doc


@api_router.delete("/brands/{brand_id}")
async def delete_brand(brand_id: str):
    if brand_id == DEFAULT_BRAND["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete the default brand")
    await db.brands.delete_one({"id": brand_id})
    return {"ok": True}


# ---------------------------------------------------------------------------
# Generation endpoints
# ---------------------------------------------------------------------------
async def _get_brand_or_404(brand_id: str) -> dict:
    doc = await db.brands.find_one({"id": brand_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Brand not found")
    return doc


def _build_image_prompt(brand: dict, subject: str, style: str) -> str:
    brand_line = (
        f"Apply the brand identity of '{brand.get('name')}': dominant colors {brand.get('primary_color')} (gold) "
        f"and {brand.get('secondary_color')} (deep black), {brand.get('image_style')}. "
    )
    return (
        f"Create a premium, high-resolution marketing image. Visual style: {style}. {brand_line}"
        f"Subject: {subject}. The result must look like a professional advertising asset, "
        "elegant composition, dramatic lighting, no spelling errors in any text."
    )


def _fetch_logo_b64(brand: dict) -> Optional[str]:
    if not brand.get("logo_url"):
        return None
    try:
        import requests
        r = requests.get(brand["logo_url"], timeout=15)
        if r.ok:
            return base64.b64encode(r.content).decode("utf-8")
    except Exception as e:
        logger.warning(f"Logo fetch failed: {e}")
    return None


@api_router.post("/generate/social")
async def generate_social(req: SocialRequest):
    brand = await _get_brand_or_404(req.brand_id)
    ctx = _brand_context(brand, req.language)
    platforms = ", ".join(req.platforms)
    system = (
        "You are a world-class social media marketing strategist. "
        "You always return strictly valid JSON and nothing else."
    )
    user = (
        f"{ctx}\n\n"
        f"Create platform-optimized social media posts about: '{req.topic}'.\n"
        f"Target platforms: {platforms}.\n"
        "For EACH platform return an object with keys: platform, caption (the full post text incl. fitting emojis), "
        "hashtags (array of strings without the # symbol), cta (a strong call to action), "
        "image_idea (a short visual concept for an accompanying image).\n"
        'Return ONLY this JSON shape: {"posts": [ {"platform": "...", "caption": "...", '
        '"hashtags": ["..."], "cta": "...", "image_idea": "..."} ]}'
    )
    raw = await llm_text(req.model, system, user)
    data = _extract_json(raw) or {"posts": []}
    result = {
        "id": str(uuid.uuid4()),
        "type": "social",
        "topic": req.topic,
        "brand_id": req.brand_id,
        "posts": data.get("posts", []),
        "created_at": _now_iso(),
    }
    await db.history.insert_one({**result})
    result.pop("_id", None)
    return result


@api_router.post("/generate/copy")
async def generate_copy(req: CopyRequest):
    brand = await _get_brand_or_404(req.brand_id)
    ctx = _brand_context(brand, req.language)
    system = (
        "You are an elite direct-response copywriter. Return strictly valid JSON and nothing else."
    )
    user = (
        f"{ctx}\n\n"
        f"Write a high-converting '{req.format}' about: '{req.topic}'.\n"
        "Return ONLY this JSON shape: "
        '{"title": "a punchy headline", "body": "the full copy with line breaks as \\n", '
        '"variants": ["1-2 alternative short hook lines"]}'
    )
    raw = await llm_text(req.model, system, user)
    data = _extract_json(raw) or {"title": "", "body": raw, "variants": []}
    result = {
        "id": str(uuid.uuid4()),
        "type": "copy",
        "topic": req.topic,
        "format": req.format,
        "brand_id": req.brand_id,
        "title": data.get("title", ""),
        "body": data.get("body", ""),
        "variants": data.get("variants", []),
        "created_at": _now_iso(),
    }
    await db.history.insert_one({**result})
    result.pop("_id", None)
    return result


@api_router.post("/generate/image")
async def generate_image(req: ImageRequest):
    brand = await _get_brand_or_404(req.brand_id)
    full_prompt = _build_image_prompt(brand, req.prompt, req.style)
    image_urls = None
    if req.apply_logo:
        full_prompt += (
            " Seamlessly and tastefully integrate the provided KickstarterCash.club brand logo "
            "into the composition (e.g. as a premium watermark or focal brand mark), keeping it crisp and legible."
        )
        image_urls = [LOGO_URL]

    try:
        image_url = await poyo_nano_banana(full_prompt, size=req.size, image_urls=image_urls)
    except RuntimeError as e:
        raise HTTPException(status_code=402, detail=str(e))
    except Exception as e:
        logger.error(f"Image generation error: {e}")
        raise HTTPException(status_code=500, detail="Bildgenerierung fehlgeschlagen / Image generation failed")

    if not image_url:
        raise HTTPException(status_code=500, detail="Kein Bild erzeugt / No image produced")

    record = {
        "id": str(uuid.uuid4()),
        "type": "image",
        "prompt": req.prompt,
        "style": req.style,
        "brand_id": req.brand_id,
        "image": image_url,
        "created_at": _now_iso(),
    }
    await db.history.insert_one({**record})
    record.pop("_id", None)
    return record


@api_router.post("/generate/optimize-prompt")
async def optimize_prompt(req: PromptOptimizeRequest):
    lang = "Deutsch" if req.language == "DE" else "English"
    system = "You are a prompt engineering expert. Return only the improved prompt text, no preface."
    user = (
        f"Turn the following rough idea into a professional, detailed {lang} prompt for an AI tool. "
        f"Be specific about goal, audience, tone, format and constraints.\n\nRough idea: {req.prompt}"
    )
    raw = await llm_text(req.model, system, user)
    return {"optimized": raw.strip()}


@api_router.post("/generate/campaign")
async def generate_campaign(req: CampaignRequest):
    brand = await _get_brand_or_404(req.brand_id)
    ctx = _brand_context(brand, req.language)
    platforms = ", ".join(req.platforms)

    social_user = (
        f"{ctx}\n\nCreate platform-optimized social media posts about: '{req.topic}'.\n"
        f"Target platforms: {platforms}.\n"
        "For EACH platform return an object with keys: platform, caption, hashtags (array without #), cta, image_idea.\n"
        'Return ONLY this JSON: {"posts": [ {"platform": "...", "caption": "...", "hashtags": ["..."], "cta": "...", "image_idea": "..."} ]}'
    )
    copy_user = (
        f"{ctx}\n\nWrite a high-converting short ad / sales copy about: '{req.topic}'.\n"
        'Return ONLY this JSON: {"title": "punchy headline", "body": "the ad copy with \\n line breaks", "variants": ["1-2 alternative hooks"]}'
    )
    json_system = "You return strictly valid JSON and nothing else."
    image_prompt = _build_image_prompt(brand, req.topic, req.image_style)

    social_raw, copy_raw, image_res = await asyncio.gather(
        llm_text(req.model, json_system, social_user),
        llm_text(req.model, json_system, copy_user),
        poyo_nano_banana(image_prompt),
        return_exceptions=True,
    )

    posts = []
    if isinstance(social_raw, str):
        posts = (_extract_json(social_raw) or {}).get("posts", [])
    copy_data = {"title": "", "body": "", "variants": []}
    if isinstance(copy_raw, str):
        copy_data = _extract_json(copy_raw) or copy_data
    image_url = image_res if isinstance(image_res, str) else None
    if isinstance(image_res, Exception):
        logger.error(f"Campaign image error: {image_res}")

    result = {
        "id": str(uuid.uuid4()),
        "type": "campaign",
        "topic": req.topic,
        "brand_id": req.brand_id,
        "posts": posts,
        "copy": copy_data,
        "image": image_url,
        "created_at": _now_iso(),
    }
    await db.history.insert_one({**result})
    result.pop("_id", None)
    return result


@api_router.post("/generate/calendar")
async def generate_calendar(req: CalendarRequest):
    brand = await _get_brand_or_404(req.brand_id)
    ctx = _brand_context(brand, req.language)
    days = req.days if req.days in (30, 60, 90) else 30
    count = {30: 15, 60: 22, 90: 30}[days]
    platforms = ", ".join(req.platforms)
    system = "You are a senior content strategist. Return strictly valid JSON and nothing else."
    user = (
        f"{ctx}\n\nCreate a {days}-day content calendar about: '{req.topic}'.\n"
        f"Distribute {count} posts evenly across the {days} days using these platforms: {platforms}.\n"
        "Each entry must have: day (integer 1..{days}), platform, title (short content idea), "
        "caption (1-2 sentences), hashtags (array without #), post_time (e.g. '18:00').\n"
        f'Return ONLY this JSON: {{"items": [ {{"day": 1, "platform": "...", "title": "...", '
        '"caption": "...", "hashtags": ["..."], "post_time": "..."} ]}'
    )
    raw = await llm_text(req.model, system, user)
    data = _extract_json(raw) or {"items": []}
    items = sorted(data.get("items", []), key=lambda x: x.get("day", 0))
    result = {
        "id": str(uuid.uuid4()),
        "type": "calendar",
        "topic": req.topic,
        "days": days,
        "brand_id": req.brand_id,
        "items": items,
        "created_at": _now_iso(),
    }
    await db.history.insert_one({**result})
    result.pop("_id", None)
    return result


@api_router.post("/generate/landingpage")
async def generate_landingpage(req: LandingpageRequest):
    brand = await _get_brand_or_404(req.brand_id)
    ctx = _brand_context(brand, req.language)
    system = "You are an elite conversion copywriter and web strategist. Return strictly valid JSON and nothing else."
    user = (
        f"{ctx}\n\nCreate a complete high-converting landing page for: '{req.topic}'.\n"
        "Return ONLY this JSON shape:\n"
        '{"headline": "...", "subtitle": "...", "cta": "...", '
        '"benefits": [{"title": "...", "text": "..."}], '
        '"testimonials": [{"name": "...", "text": "..."}], '
        '"faq": [{"q": "...", "a": "..."}], '
        '"pricing": {"name": "...", "price": "...", "features": ["..."], "cta": "..."}, '
        '"footer": "...", "seo": {"title": "...", "description": "...", "keywords": ["..."]}}'
    )
    raw = await llm_text(req.model, system, user)
    data = _extract_json(raw) or {}
    result = {
        "id": str(uuid.uuid4()),
        "type": "landingpage",
        "topic": req.topic,
        "brand_id": req.brand_id,
        "content": data,
        "created_at": _now_iso(),
    }
    await db.history.insert_one({**result})
    result.pop("_id", None)
    return result


@api_router.delete("/history/{item_id}")
async def delete_history(item_id: str):
    await db.history.delete_one({"id": item_id})
    return {"ok": True}


@api_router.post("/analyze/content")
async def analyze_content(req: AnalyzeRequest):
    brand = await _get_brand_or_404(req.brand_id)
    ctx = _brand_context(brand, req.language)
    lang = "Deutsch" if req.language == "DE" else "English"
    system = (
        "You are a strict brand guardian and marketing quality auditor. "
        "You evaluate content against brand guidelines and marketing best practices. "
        "Return strictly valid JSON and nothing else."
    )
    user = (
        f"{ctx}\n\n"
        f"Analyze the following {req.content_type} content for the brand above. Respond in {lang}.\n\n"
        f"CONTENT TO ANALYZE:\n\"\"\"\n{req.content}\n\"\"\"\n\n"
        "Perform two evaluations:\n"
        "1) BRAND GUARDIAN: Check brand consistency. Provide checks for: 'Markenkonformität' (overall brand fit), "
        "'Tonalität' (tone of voice match), 'Sprache & Wording' (language/wording match), "
        "'Markenbegriffe & Slogan' (uses brand terms/slogan), 'Zielgruppen-Fit' (audience fit). "
        "Each check has status one of: 'pass', 'warn', 'fail' and a short note.\n"
        "2) MARKETING SCORE: An overall score 0-100, plus concrete improvement suggestions (e.g. 'Headline stärker', "
        "'CTA fehlt', 'Bild emotionaler', 'mehr Kontrast', 'SEO verbessern') and a list of strengths.\n\n"
        'Return ONLY this JSON shape: {"score": 85, "verdict": "one-sentence summary", '
        '"tone_match": 90, "brand_match": 88, '
        '"checks": [{"label": "...", "status": "pass", "note": "..."}], '
        '"improvements": ["...", "..."], "strengths": ["...", "..."]}'
    )
    raw = await llm_text(req.model, system, user)
    data = _extract_json(raw) or {}
    result = {
        "id": str(uuid.uuid4()),
        "type": "analysis",
        "content_type": req.content_type,
        "brand_id": req.brand_id,
        "score": data.get("score", 0),
        "verdict": data.get("verdict", ""),
        "tone_match": data.get("tone_match", 0),
        "brand_match": data.get("brand_match", 0),
        "checks": data.get("checks", []),
        "improvements": data.get("improvements", []),
        "strengths": data.get("strengths", []),
        "created_at": _now_iso(),
    }
    await db.history.insert_one({**result})
    result.pop("_id", None)
    return result


# ---------------------------------------------------------------------------
# History
# ---------------------------------------------------------------------------
@api_router.get("/history")
async def get_history(type: Optional[str] = None, limit: int = 50):
    query = {"type": type} if type else {}
    docs = await db.history.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return docs


@api_router.post("/chat")
async def chat(req: ChatRequest):
    lang = "Deutsch" if req.language == "DE" else "English"
    system = (
        "Du bist der KI-Marketing-Assistent von KickstarterCash.club – ein luxuriöser, "
        "selbstbewusster und motivierender Experte für Marketing, Verkauf, Branding, "
        "Funnels und digitale Produkte. Gib präzise, professionelle und konkret umsetzbare "
        f"Antworten. Antworte immer auf {lang}."
    )
    convo = ""
    for m in req.history[-12:]:
        role = "User" if m.get("role") == "user" else "Assistant"
        convo += f"{role}: {m.get('content', '')}\n"
    convo += f"User: {req.message}\nAssistant:"
    reply = await llm_text(req.model, system, convo)
    return {"reply": reply.strip()}


# ---------------------------------------------------------------------------
# Funnel (member sales funnel in KickstarterCash design)
# ---------------------------------------------------------------------------
@api_router.post("/funnel", response_model=FunnelConfig)
async def create_funnel(payload: FunnelCreate):
    cfg = FunnelConfig(**payload.model_dump())
    await db.funnels.insert_one(cfg.model_dump())
    return cfg


@api_router.get("/funnel", response_model=List[FunnelConfig])
async def list_funnels():
    docs = await db.funnels.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs


@api_router.get("/funnel/{funnel_id}", response_model=FunnelConfig)
async def get_funnel(funnel_id: str):
    doc = await db.funnels.find_one({"id": funnel_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Funnel not found")
    return doc


@api_router.put("/funnel/{funnel_id}", response_model=FunnelConfig)
async def update_funnel(funnel_id: str, payload: FunnelCreate):
    doc = await db.funnels.find_one({"id": funnel_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Funnel not found")
    update = payload.model_dump()
    await db.funnels.update_one({"id": funnel_id}, {"$set": update})
    doc.update(update)
    return doc


@api_router.delete("/funnel/{funnel_id}")
async def delete_funnel(funnel_id: str):
    await db.funnels.delete_one({"id": funnel_id})
    return {"ok": True}


@api_router.get("/funnel/{funnel_id}/page")
async def funnel_page(funnel_id: str, request: Request):
    doc = await db.funnels.find_one({"id": funnel_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Funnel not found")
    lead_url = f"/api/funnel/{funnel_id}/lead"
    html_out = funnel_renderer.render_funnel(doc, lead_url)
    return Response(content=html_out, media_type="text/html")


@api_router.post("/funnel/{funnel_id}/lead")
async def funnel_lead(funnel_id: str, lead: FunnelLead):
    cfg = await db.funnels.find_one({"id": funnel_id}, {"_id": 0})
    if not cfg:
        raise HTTPException(status_code=404, detail="Funnel not found")

    record = {
        "id": str(uuid.uuid4()),
        "funnel_id": funnel_id,
        **lead.model_dump(),
        "created_at": _now_iso(),
    }
    await db.funnel_leads.insert_one({**record})

    advisor_email = cfg.get("email")
    email_sent = False
    if RESEND_API_KEY and advisor_email:
        name = f"{lead.vorname} {lead.nachname}".strip()
        html_body = (
            f"<h2 style='font-family:sans-serif'>Neue Funnel-Anfrage</h2>"
            f"<table style='font-family:sans-serif;font-size:15px'>"
            f"<tr><td><b>Name:</b></td><td>{name}</td></tr>"
            f"<tr><td><b>E-Mail:</b></td><td>{lead.email}</td></tr>"
            f"<tr><td><b>Telefon/WhatsApp:</b></td><td>{lead.telefon}</td></tr>"
            f"<tr><td><b>Land:</b></td><td>{lead.land}</td></tr>"
            f"<tr><td><b>Nachricht:</b></td><td>{lead.nachricht}</td></tr>"
            f"</table>"
            f"<p style='font-family:sans-serif;color:#888'>Gesendet über deinen KickstarterCash Funnel.</p>"
        )
        params = {
            "from": SENDER_EMAIL,
            "to": [advisor_email],
            "reply_to": lead.email or SENDER_EMAIL,
            "subject": f"🚀 Neue Funnel-Anfrage von {name or lead.email}",
            "html": html_body,
        }
        try:
            await asyncio.to_thread(resend.Emails.send, params)
            email_sent = True
        except Exception as e:
            logger.error(f"Funnel lead email failed: {e}")

    record.pop("_id", None)
    return {"ok": True, "email_sent": email_sent}


@api_router.get("/funnel/{funnel_id}/leads")
async def funnel_leads(funnel_id: str):
    docs = await db.funnel_leads.find({"funnel_id": funnel_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


# ---------------------------------------------------------------------------
# Prompt library
# ---------------------------------------------------------------------------
PROMPT_LIBRARY = [
    {"id": "p1", "category": "Marketing", "title_de": "Produkt-Launch Ankündigung", "title_en": "Product launch announcement",
     "prompt_de": "Schreibe eine aufmerksamkeitsstarke Launch-Ankündigung für [Produkt], die Neugier weckt, den größten Nutzen betont und mit einem klaren CTA endet.",
     "prompt_en": "Write an attention-grabbing launch announcement for [product] that sparks curiosity, highlights the biggest benefit and ends with a clear CTA."},
    {"id": "p2", "category": "Marketing", "title_de": "Elevator Pitch", "title_en": "Elevator pitch",
     "prompt_de": "Erstelle einen 30-Sekunden Elevator Pitch für [Business], der Problem, Lösung und Alleinstellungsmerkmal in 3 Sätzen verpackt.",
     "prompt_en": "Create a 30-second elevator pitch for [business] packing problem, solution and USP into 3 sentences."},
    {"id": "p3", "category": "Verkauf", "title_de": "Einwandbehandlung 'zu teuer'", "title_en": "Objection handling 'too expensive'",
     "prompt_de": "Formuliere 5 überzeugende Antworten auf den Einwand 'zu teuer' für [Angebot], die auf Wert statt Preis fokussieren.",
     "prompt_en": "Write 5 convincing responses to the 'too expensive' objection for [offer] focusing on value over price."},
    {"id": "p4", "category": "Verkauf", "title_de": "Verkaufs-E-Mail Sequenz", "title_en": "Sales email sequence",
     "prompt_de": "Entwirf eine 5-teilige Verkaufs-E-Mail-Sequenz für [Produkt] mit Betreffzeilen, Storytelling und steigender Dringlichkeit.",
     "prompt_en": "Draft a 5-part sales email sequence for [product] with subject lines, storytelling and rising urgency."},
    {"id": "p5", "category": "Webseiten", "title_de": "Landingpage Headline-Set", "title_en": "Landing page headline set",
     "prompt_de": "Generiere 10 Landingpage-Headlines für [Angebot] in verschiedenen Stilen: nutzenorientiert, neugierig, dringlich, sozialer Beweis.",
     "prompt_en": "Generate 10 landing page headlines for [offer] in varied styles: benefit, curiosity, urgency, social proof."},
    {"id": "p6", "category": "Webseiten", "title_de": "FAQ Generator", "title_en": "FAQ generator",
     "prompt_de": "Erstelle 8 häufige Fragen und überzeugende Antworten für die Verkaufsseite von [Produkt].",
     "prompt_en": "Create 8 frequently asked questions and persuasive answers for the sales page of [product]."},
    {"id": "p7", "category": "KI Bilder", "title_de": "Luxus Hero Image", "title_en": "Luxury hero image",
     "prompt_de": "Ein cinematisches, luxuriöses Hero-Bild für [Thema], schwarz-gold, dramatische Beleuchtung, edler Bokeh-Hintergrund, 8K, Werbequalität.",
     "prompt_en": "A cinematic, luxurious hero image for [topic], black and gold, dramatic lighting, elegant bokeh background, 8K, advertising quality."},
    {"id": "p8", "category": "KI Bilder", "title_de": "Produkt-Mockup", "title_en": "Product mockup",
     "prompt_de": "Professionelles Produkt-Mockup von [Produkt] auf Marmoroberfläche, weiches Studiolicht, minimalistisch, premium, hohe Detailtreue.",
     "prompt_en": "Professional product mockup of [product] on marble surface, soft studio light, minimalist, premium, high detail."},
    {"id": "p9", "category": "Video", "title_de": "Reel Hook (3 Sek.)", "title_en": "Reel hook (3 sec)",
     "prompt_de": "Schreibe 10 packende 3-Sekunden-Hooks für ein Reel über [Thema], die zum Weiterschauen zwingen.",
     "prompt_en": "Write 10 gripping 3-second hooks for a reel about [topic] that force viewers to keep watching."},
    {"id": "p10", "category": "Video", "title_de": "YouTube Skript-Struktur", "title_en": "YouTube script structure",
     "prompt_de": "Erstelle eine Skript-Struktur für ein 8-Minuten YouTube-Video über [Thema]: Hook, Intro, 3 Hauptpunkte, CTA.",
     "prompt_en": "Create a script structure for an 8-minute YouTube video about [topic]: hook, intro, 3 main points, CTA."},
    {"id": "p11", "category": "SEO", "title_de": "Keyword-Cluster", "title_en": "Keyword cluster",
     "prompt_de": "Erstelle ein SEO-Keyword-Cluster für [Thema] mit Haupt-Keyword, 10 Long-Tails und Suchintention.",
     "prompt_en": "Create an SEO keyword cluster for [topic] with main keyword, 10 long-tails and search intent."},
    {"id": "p12", "category": "SEO", "title_de": "Meta-Description", "title_en": "Meta description",
     "prompt_de": "Schreibe 5 SEO-optimierte Meta-Descriptions (max. 155 Zeichen) für [Seite] mit Keyword und CTA.",
     "prompt_en": "Write 5 SEO-optimized meta descriptions (max 155 chars) for [page] with keyword and CTA."},
    {"id": "p13", "category": "Branding", "title_de": "Marken-Tonalität definieren", "title_en": "Define brand voice",
     "prompt_de": "Definiere die Markenstimme für [Marke] mit 5 Adjektiven, Do's & Don'ts und 3 Beispielsätzen.",
     "prompt_en": "Define the brand voice for [brand] with 5 adjectives, do's & don'ts and 3 example sentences."},
    {"id": "p14", "category": "Branding", "title_de": "Slogan Generator", "title_en": "Slogan generator",
     "prompt_de": "Generiere 15 einprägsame Slogans für [Marke] in unterschiedlichen Stilen: kurz, emotional, nutzenbasiert.",
     "prompt_en": "Generate 15 memorable slogans for [brand] in varied styles: short, emotional, benefit-based."},
    {"id": "p15", "category": "E-Mail", "title_de": "Newsletter Betreffzeilen", "title_en": "Newsletter subject lines",
     "prompt_de": "Schreibe 12 Newsletter-Betreffzeilen für [Thema] mit hoher Öffnungsrate, inkl. Emojis und Neugier.",
     "prompt_en": "Write 12 high-open-rate newsletter subject lines for [topic], including emojis and curiosity."},
    {"id": "p16", "category": "E-Mail", "title_de": "Willkommens-E-Mail", "title_en": "Welcome email",
     "prompt_de": "Verfasse eine warme Willkommens-E-Mail für neue Abonnenten von [Marke] mit klarem nächsten Schritt.",
     "prompt_en": "Write a warm welcome email for new subscribers of [brand] with a clear next step."},
    {"id": "p17", "category": "Chatbots", "title_de": "Support-Bot Persona", "title_en": "Support bot persona",
     "prompt_de": "Definiere die Persona und 10 Standardantworten für einen Support-Chatbot von [Business].",
     "prompt_en": "Define the persona and 10 standard responses for a support chatbot of [business]."},
    {"id": "p18", "category": "Funnels", "title_de": "Leadmagnet Ideen", "title_en": "Lead magnet ideas",
     "prompt_de": "Liste 10 hochwertige Leadmagnet-Ideen für [Zielgruppe] inkl. Format und Versprechen.",
     "prompt_en": "List 10 high-value lead magnet ideas for [audience] including format and promise."},
    {"id": "p19", "category": "Funnels", "title_de": "Upsell Angebot", "title_en": "Upsell offer",
     "prompt_de": "Entwirf ein überzeugendes Upsell-Angebot nach dem Kauf von [Produkt] mit Verknappung und Bonus.",
     "prompt_en": "Design a compelling post-purchase upsell offer for [product] with scarcity and bonus."},
    {"id": "p20", "category": "Marketing", "title_de": "Social Proof Texte", "title_en": "Social proof copy",
     "prompt_de": "Schreibe 5 glaubwürdige Testimonial-Vorlagen für [Produkt], die konkrete Ergebnisse betonen.",
     "prompt_en": "Write 5 credible testimonial templates for [product] emphasizing concrete results."},
]

PROMPT_CATEGORIES = ["Marketing", "Verkauf", "Webseiten", "KI Bilder", "Video", "SEO", "Branding", "E-Mail", "Chatbots", "Funnels"]


@api_router.get("/prompts")
async def get_prompts(category: Optional[str] = None, q: Optional[str] = None):
    items = PROMPT_LIBRARY
    if category and category != "Alle":
        items = [p for p in items if p["category"] == category]
    if q:
        ql = q.lower()
        items = [p for p in items if ql in p["title_de"].lower() or ql in p["title_en"].lower()
                 or ql in p["prompt_de"].lower() or ql in p["prompt_en"].lower()]
    return {"categories": PROMPT_CATEGORIES, "prompts": items}


# ---------------------------------------------------------------------------
# Specialist Agents – Phase 3
# ---------------------------------------------------------------------------

AGENT_TOOLS = {
    "ceo": [
        {"id": "delegate", "label": "Delegieren",     "label_en": "Delegate",        "icon": "GitBranch", "type": "llm",   "prompt_de": "Analysiere diese Aufgabe und erstelle einen detaillierten Delegationsplan: welcher Spezialist übernimmt was, in welcher Reihenfolge und mit welchem Ziel.", "prompt_en": "Analyze this task and create a detailed delegation plan: which specialist handles what, in what order and with what goal."},
        {"id": "strategy", "label": "Strategie",      "label_en": "Strategy",        "icon": "Map",       "type": "llm",   "prompt_de": "Erstelle eine vollständige Marketing-Strategie für: ", "prompt_en": "Create a complete marketing strategy for: "},
        {"id": "plan",     "label": "Aktionsplan",    "label_en": "Action Plan",     "icon": "ListChecks","type": "llm",   "prompt_de": "Erstelle einen konkreten 7-Schritte-Aktionsplan für: ", "prompt_en": "Create a concrete 7-step action plan for: "},
        {"id": "swot",     "label": "SWOT-Analyse",   "label_en": "SWOT Analysis",   "icon": "BarChart2", "type": "llm",   "prompt_de": "Führe eine SWOT-Analyse durch für: ", "prompt_en": "Conduct a SWOT analysis for: "},
    ],
    "content": [
        {"id": "hook",      "label": "Hook Generator", "label_en": "Hook Generator",  "icon": "Zap",       "type": "llm",   "prompt_de": "Schreibe 5 verschiedene Hooks (Aufmerksamkeitsfänger) für: ", "prompt_en": "Write 5 different hooks (attention grabbers) for: "},
        {"id": "headline",  "label": "Headlines",      "label_en": "Headlines",       "icon": "Type",      "type": "llm",   "prompt_de": "Generiere 10 konvertierende Headlines für: ", "prompt_en": "Generate 10 converting headlines for: "},
        {"id": "story",     "label": "Storytelling",   "label_en": "Storytelling",    "icon": "BookOpen",  "type": "llm",   "prompt_de": "Schreibe eine emotionale Story (Problem → Reise → Lösung) für: ", "prompt_en": "Write an emotional story (problem → journey → solution) for: "},
        {"id": "email",     "label": "E-Mail",         "label_en": "Email",           "icon": "Mail",      "type": "llm",   "prompt_de": "Schreibe eine konvertierende Marketing-E-Mail für: ", "prompt_en": "Write a converting marketing email for: "},
        {"id": "cta",       "label": "CTA-Texte",      "label_en": "CTA Copy",        "icon": "MousePointer","type": "llm", "prompt_de": "Erstelle 8 starke Call-to-Action Texte für: ", "prompt_en": "Create 8 strong call-to-action texts for: "},
    ],
    "designer": [
        {"id": "gpt_image",  "label": "GPT Image",    "label_en": "GPT Image",       "icon": "Image",     "type": "image", "prompt_de": "Generiere ein hochwertiges Werbebild für: ", "prompt_en": "Generate a high-quality advertising image for: "},
        {"id": "canva",      "label": "Canva Prompt",  "label_en": "Canva Prompt",    "icon": "Layout",    "type": "llm",   "prompt_de": "Erstelle eine detaillierte Canva-Design-Anleitung mit Farbcodes, Schriften, Layout und Elementen für: ", "prompt_en": "Create a detailed Canva design guide with color codes, fonts, layout and elements for: "},
        {"id": "leonardo",   "label": "Leonardo",      "label_en": "Leonardo",        "icon": "Wand2",     "type": "llm",   "prompt_de": "Erstelle einen optimierten Leonardo.ai Prompt für ein professionelles Werbebild von: ", "prompt_en": "Create an optimized Leonardo.ai prompt for a professional advertising image of: "},
        {"id": "flux",       "label": "Flux",          "label_en": "Flux",            "icon": "Sparkles",  "type": "llm",   "prompt_de": "Erstelle einen präzisen Flux-Bildgenerierungs-Prompt (photorealistisch, kommerziell) für: ", "prompt_en": "Create a precise Flux image generation prompt (photorealistic, commercial) for: "},
        {"id": "ideogram",   "label": "Ideogram",      "label_en": "Ideogram",        "icon": "PenTool",   "type": "llm",   "prompt_de": "Erstelle einen Ideogram-Prompt mit Textelementen und Logo-Integration für: ", "prompt_en": "Create an Ideogram prompt with text elements and logo integration for: "},
        {"id": "brand",      "label": "Brand-Guide",   "label_en": "Brand Guide",     "icon": "Palette",   "type": "llm",   "prompt_de": "Erstelle einen vollständigen Brand-Guide (Farben, Schriften, Do's & Don'ts) für: ", "prompt_en": "Create a complete brand guide (colors, fonts, do's & don'ts) for: "},
    ],
    "video": [
        {"id": "script",    "label": "Script",         "label_en": "Script",          "icon": "FileText",  "type": "llm",   "prompt_de": "Schreibe ein vollständiges Video-Script (Hook, Story, CTA) für: ", "prompt_en": "Write a complete video script (hook, story, CTA) for: "},
        {"id": "veo",       "label": "Veo Prompt",     "label_en": "Veo Prompt",      "icon": "Film",      "type": "llm",   "prompt_de": "Erstelle einen detaillierten Google Veo 3 Video-Prompt für: ", "prompt_en": "Create a detailed Google Veo 3 video prompt for: "},
        {"id": "runway",    "label": "Runway ML",      "label_en": "Runway ML",       "icon": "Clapperboard","type": "llm", "prompt_de": "Erstelle einen Runway ML Gen-3 Prompt mit Camera-Bewegungen und Stil für: ", "prompt_en": "Create a Runway ML Gen-3 prompt with camera movements and style for: "},
        {"id": "kling",     "label": "Kling",          "label_en": "Kling",           "icon": "Video",     "type": "llm",   "prompt_de": "Erstelle einen Kling AI Video-Prompt mit Motion-Beschreibung für: ", "prompt_en": "Create a Kling AI video prompt with motion description for: "},
        {"id": "storyboard","label": "Storyboard",     "label_en": "Storyboard",      "icon": "Layers",    "type": "llm",   "prompt_de": "Erstelle ein detailliertes Shot-by-Shot Storyboard für: ", "prompt_en": "Create a detailed shot-by-shot storyboard for: "},
        {"id": "reels",     "label": "Reels-Konzept",  "label_en": "Reels Concept",   "icon": "Play",      "type": "llm",   "prompt_de": "Entwickle 3 virale Instagram/TikTok Reels-Konzepte für: ", "prompt_en": "Develop 3 viral Instagram/TikTok Reels concepts for: "},
    ],
    "seo": [
        {"id": "keywords",  "label": "Keywords",       "label_en": "Keywords",        "icon": "Search",    "type": "llm",   "prompt_de": "Erstelle eine Keyword-Recherche mit Short-Tail, Long-Tail und LSI-Keywords für: ", "prompt_en": "Create keyword research with short-tail, long-tail and LSI keywords for: "},
        {"id": "meta",      "label": "Meta-Texte",     "label_en": "Meta Texts",      "icon": "Code",      "type": "llm",   "prompt_de": "Schreibe optimierte Meta-Title (60 Zeichen) und Meta-Description (155 Zeichen) für: ", "prompt_en": "Write optimized meta title (60 chars) and meta description (155 chars) for: "},
        {"id": "audit",     "label": "SEO-Audit",      "label_en": "SEO Audit",       "icon": "ClipboardList","type": "llm","prompt_de": "Erstelle eine SEO-Audit-Checkliste und Optimierungsplan für: ", "prompt_en": "Create an SEO audit checklist and optimization plan for: "},
        {"id": "schema",    "label": "Schema Markup",  "label_en": "Schema Markup",   "icon": "Braces",    "type": "llm",   "prompt_de": "Generiere JSON-LD Schema Markup (Organization, Product, FAQ) für: ", "prompt_en": "Generate JSON-LD schema markup (Organization, Product, FAQ) for: "},
        {"id": "blog_seo",  "label": "SEO-Artikel",    "label_en": "SEO Article",     "icon": "FileEdit",  "type": "llm",   "prompt_de": "Schreibe einen vollständigen SEO-optimierten Blogartikel (H1, H2, H3, Keywords, 800+ Wörter) über: ", "prompt_en": "Write a complete SEO-optimized blog article (H1, H2, H3, keywords, 800+ words) about: "},
    ],
    "social": [
        {"id": "post_pack", "label": "Post-Paket",     "label_en": "Post Package",    "icon": "Package",   "type": "llm",   "prompt_de": "Erstelle ein vollständiges Post-Paket (Caption, Hashtags, CTA, Bildidee) für alle Plattformen zu: ", "prompt_en": "Create a complete post package (caption, hashtags, CTA, image idea) for all platforms about: "},
        {"id": "hashtags",  "label": "Hashtags",       "label_en": "Hashtags",        "icon": "Hash",      "type": "llm",   "prompt_de": "Generiere 30 relevante Hashtags (Mix aus groß/mittel/niche) für: ", "prompt_en": "Generate 30 relevant hashtags (mix of large/medium/niche) for: "},
        {"id": "calendar",  "label": "Posting-Plan",   "label_en": "Posting Plan",    "icon": "Calendar",  "type": "llm",   "prompt_de": "Erstelle einen 2-Wochen-Social-Media-Posting-Kalender mit Themen und besten Zeiten für: ", "prompt_en": "Create a 2-week social media posting calendar with topics and best times for: "},
        {"id": "bio",       "label": "Bio & Profil",   "label_en": "Bio & Profile",   "icon": "User",      "type": "llm",   "prompt_de": "Schreibe eine optimierte Social-Media-Bio für alle Plattformen für: ", "prompt_en": "Write an optimized social media bio for all platforms for: "},
        {"id": "viral",     "label": "Viral-Konzept",  "label_en": "Viral Concept",   "icon": "TrendingUp","type": "llm",   "prompt_de": "Entwickle 5 virale Content-Ideen mit hohem Share-Potenzial für: ", "prompt_en": "Develop 5 viral content ideas with high share potential for: "},
    ],
    "sales": [
        {"id": "script",    "label": "Sales-Script",   "label_en": "Sales Script",    "icon": "MessageSquare","type": "llm","prompt_de": "Schreibe ein vollständiges Verkaufsgespräch-Script (Opener, Bedarfsanalyse, Präsentation, Closing) für: ", "prompt_en": "Write a complete sales conversation script (opener, needs analysis, presentation, closing) for: "},
        {"id": "objections","label": "Einwände",        "label_en": "Objections",      "icon": "ShieldCheck","type": "llm",  "prompt_de": "Liste die 10 häufigsten Einwände und perfekte Antworten darauf für: ", "prompt_en": "List the 10 most common objections and perfect responses for: "},
        {"id": "gmail",     "label": "Gmail Template",  "label_en": "Gmail Template",  "icon": "Mail",      "type": "llm",   "prompt_de": "Schreibe 3 professionelle Gmail-E-Mail-Templates (Erstansprache, Follow-up, Closing) für: ", "prompt_en": "Write 3 professional Gmail email templates (first contact, follow-up, closing) for: "},
        {"id": "sheets",    "label": "Google Sheets",   "label_en": "Google Sheets",   "icon": "Table",     "type": "llm",   "prompt_de": "Erstelle eine Google-Sheets-CRM-Vorlage mit Spalten, Formeln und Automatisierungen für: ", "prompt_en": "Create a Google Sheets CRM template with columns, formulas and automations for: "},
        {"id": "whatsapp",  "label": "WhatsApp Script", "label_en": "WhatsApp Script", "icon": "MessageSquare","type": "llm","prompt_de": "Schreibe natürliche WhatsApp-Nachrichten-Sequenz (Erstansprache → Interesse → Abschluss) für: ", "prompt_en": "Write a natural WhatsApp message sequence (first contact → interest → close) for: "},
        {"id": "funnel",    "label": "Funnel-Map",      "label_en": "Funnel Map",      "icon": "GitMerge",  "type": "llm",   "prompt_de": "Erstelle eine komplette Funnel-Karte (Awareness → Interest → Desire → Action) für: ", "prompt_en": "Create a complete funnel map (Awareness → Interest → Desire → Action) for: "},
    ],
    "analytics": [
        {"id": "kpis",      "label": "KPI-Dashboard",  "label_en": "KPI Dashboard",   "icon": "BarChart2", "type": "llm",   "prompt_de": "Definiere die wichtigsten KPIs, Zielwerte und Mess-Methoden für: ", "prompt_en": "Define the most important KPIs, target values and measurement methods for: "},
        {"id": "report",    "label": "Report",          "label_en": "Report",          "icon": "FileBarChart","type": "llm", "prompt_de": "Erstelle eine Report-Vorlage und erkläre wie man die Daten für folgendes interpretiert: ", "prompt_en": "Create a report template and explain how to interpret the data for: "},
        {"id": "ab_test",   "label": "A/B Test",        "label_en": "A/B Test",        "icon": "GitBranch", "type": "llm",   "prompt_de": "Entwickle einen A/B-Test-Plan mit Hypothese, Varianten und Erfolgskriterien für: ", "prompt_en": "Develop an A/B test plan with hypothesis, variants and success criteria for: "},
        {"id": "growth",    "label": "Wachstums-Plan",  "label_en": "Growth Plan",     "icon": "TrendingUp","type": "llm",   "prompt_de": "Erstelle einen datengetriebenen Wachstumsplan für: ", "prompt_en": "Create a data-driven growth plan for: "},
    ],
    "automation": [
        {"id": "n8n",       "label": "n8n Workflow",    "label_en": "n8n Workflow",    "icon": "Workflow",  "type": "llm",   "prompt_de": "Beschreibe einen vollständigen n8n-Workflow mit allen Nodes, Verbindungen und Konfigurationen für: ", "prompt_en": "Describe a complete n8n workflow with all nodes, connections and configurations for: "},
        {"id": "email_seq", "label": "E-Mail-Sequenz",  "label_en": "Email Sequence",  "icon": "Mail",      "type": "llm",   "prompt_de": "Baue eine automatische 7-E-Mail-Onboarding-Sequenz für: ", "prompt_en": "Build an automatic 7-email onboarding sequence for: "},
        {"id": "webhook",   "label": "Webhook",         "label_en": "Webhook",         "icon": "Webhook",   "type": "llm",   "prompt_de": "Erkläre wie man einen Webhook einrichtet und die Daten verarbeitet für: ", "prompt_en": "Explain how to set up a webhook and process the data for: "},
        {"id": "zapier",    "label": "Zapier/Make",     "label_en": "Zapier/Make",     "icon": "Zap",       "type": "llm",   "prompt_de": "Erstelle einen Zapier oder Make-Automationsplan für: ", "prompt_en": "Create a Zapier or Make automation plan for: "},
        {"id": "crm",       "label": "CRM-Flow",        "label_en": "CRM Flow",        "icon": "Users",     "type": "llm",   "prompt_de": "Entwirf einen CRM-Automations-Workflow für Lead-Management von: ", "prompt_en": "Design a CRM automation workflow for lead management of: "},
    ],
    "coding": [
        {"id": "html",      "label": "Landingpage",     "label_en": "Landing Page",    "icon": "Globe",     "type": "llm",   "prompt_de": "Schreibe vollständigen HTML/CSS/JS Code für eine konvertierende Landingpage für: ", "prompt_en": "Write complete HTML/CSS/JS code for a converting landing page for: "},
        {"id": "react",     "label": "React",           "label_en": "React",           "icon": "Code2",     "type": "llm",   "prompt_de": "Erstelle eine vollständige React-Komponente (TypeScript, Tailwind) für: ", "prompt_en": "Create a complete React component (TypeScript, Tailwind) for: "},
        {"id": "api",       "label": "API / Webhook",   "label_en": "API / Webhook",   "icon": "Plug",      "type": "llm",   "prompt_de": "Schreibe den vollständigen Backend-Code (FastAPI/Express) für eine API-Integration mit: ", "prompt_en": "Write the complete backend code (FastAPI/Express) for an API integration with: "},
        {"id": "n8n_node",  "label": "n8n Node",        "label_en": "n8n Node",        "icon": "Box",       "type": "llm",   "prompt_de": "Erstelle einen benutzerdefinierten n8n Node (JavaScript) für: ", "prompt_en": "Create a custom n8n node (JavaScript) for: "},
        {"id": "php",       "label": "PHP Script",      "label_en": "PHP Script",      "icon": "Terminal",  "type": "llm",   "prompt_de": "Schreibe einen sicheren PHP-Script für: ", "prompt_en": "Write a secure PHP script for: "},
    ],
}

AGENTS = {
    "ceo": {
        "id": "ceo",
        "emoji": "🎯",
        "name": "CEO Jarvjis",
        "role_de": "Orchestrator & Entscheider",
        "role_en": "Orchestrator & Decision Maker",
        "color": "#D4AF37",
        "personality_de": (
            "Du bist Jarvjis, der visionäre CEO und Mastermind hinter KickstarterCash. "
            "Du denkst strategisch, erkennst Chancen sofort und delegierst mit Präzision. "
            "Du sprichst direkt, selbstbewusst und inspirierend – wie ein erfahrener Unternehmer. "
            "Du analysierst die Anfrage und gibst eine klare Entscheidung + Aktionsplan."
        ),
        "personality_en": (
            "You are Jarvjis, the visionary CEO and mastermind behind KickstarterCash. "
            "You think strategically, spot opportunities instantly and delegate with precision. "
            "You speak directly, confidently and inspiringly – like an experienced entrepreneur. "
            "You analyze the request and give a clear decision + action plan."
        ),
    },
    "content": {
        "id": "content",
        "emoji": "✍️",
        "name": "Content Agent",
        "role_de": "Texte, Hooks & Storytelling",
        "role_en": "Copy, Hooks & Storytelling",
        "color": "#60A5FA",
        "personality_de": (
            "Du bist der Content-Spezialist von KickstarterCash. Du schreibst fesselnde Texte, "
            "unwiderstehliche Hooks, emotionale Storys und konvertierende Sales-Texte. "
            "Du kennst die Zielgruppe genau und sprichst ihre Sprache. "
            "Dein Stil: prägnant, emotional, handlungsauslösend."
        ),
        "personality_en": (
            "You are the content specialist of KickstarterCash. You write captivating copy, "
            "irresistible hooks, emotional stories and converting sales texts. "
            "You know the target audience precisely and speak their language. "
            "Your style: concise, emotional, action-triggering."
        ),
    },
    "designer": {
        "id": "designer",
        "emoji": "🎨",
        "name": "Dina – Creative Director",
        "role_de": "Creative Director & Visual AI Designer",
        "role_en": "Creative Director & Visual AI Designer",
        "color": "#C084FC",
        "personality_de": (
            "Du bist die offizielle Creative Director und Visual AI Designer von KickstarterCash.club. "
            "Du kombinierst das Wissen von: Art Director, Brand Designer, Creative Director, Werbeagentur, "
            "Filmregisseur, Fotograf, Kameramann, Motion Designer, Prompt Engineer, Social Media Designer, "
            "UX Designer und Storyboard Artist. "
            "Du erschaffst hochwertige Werbemittel, die professionell, modern und emotional wirken. "
            "Du entwirfst niemals durchschnittliche Inhalte. Jedes Ergebnis soll Werbeagentur-Niveau besitzen. "
            "\n\nDEINE AUFGABE: Du entwickelst kreative Konzepte für Bilder, Werbebanner, Social Media Posts, "
            "Reels, Kurzvideos, Werbespots, Storyboards, Thumbnails, Landingpages, Präsentationen, "
            "Animationen, Produktdarstellungen, Karussells, Cover und Mockups. "
            "Du entwickelst zuerst die kreative Idee. Danach setzt du sie in einen professionellen Prompt um. "
            "\n\nKICKSTARTERCASH CORPORATE DESIGN: Farben: Gold (#C7941D), Dunkelgrün (#233221), Weiß, Schwarz. "
            "Stil: Premium, Minimalistisch, Modern, Luxuriös, Hochwertig, Klar, Elegant. "
            "\n\nKREATIVER DENKPROZESS: 1) Verstehe das Ziel. 2) Analysiere Zielgruppe. "
            "3) Überlege welche Emotion erzeugt werden soll. 4) Entwickle mehrere kreative Ideen. "
            "5) Wähle die stärkste Idee. 6) Entwickle Bildsprache. 7) Entwickle Farben. "
            "8) Entwickle Licht. 9) Entwickle Perspektive. 10) Erstelle den fertigen Prompt. "
            "\n\nBILDDESIGN: Denke wie ein internationaler Werbefotograf. Berücksichtige: Licht, Schatten, "
            "Farben, Stimmung, Blickführung, Fokus, Komposition, Tiefenschärfe, Perspektive, Materialien, "
            "Reflexionen, Typografie, Raumgefühl, Emotion. Beschreibe niemals nur Objekte – beschreibe das gesamte Bild. "
            "\n\nVIDEO: Denke wie ein Hollywood-Regisseur. Jedes Video besitzt: Hook, Story, Emotion, "
            "Spannungsbogen, Höhepunkt, Call To Action. Erstelle Videos immer szenenweise. "
            "Beschreibe: Kamera, Brennweite, Bewegungen, Übergänge, Licht, Musik, Soundeffekte, Atmosphäre. "
            "\n\nKI TOOLS: Du kennst die Besonderheiten von GPT Image, Midjourney, Flux, Ideogram, "
            "Leonardo AI, Runway, Veo, Kling, Hailuo, CapCut, Canva, Stable Diffusion. "
            "Du passt Prompts automatisch an das jeweilige Tool an. "
            "\n\nPRODUKTBILDER: Originalprodukte dürfen niemals verändert werden – keine Veränderungen an "
            "Logo, Farben, Typografie, Verpackung, Form, Proportionen, Material oder Beschriftungen. "
            "Alle kreativen Elemente entstehen ausschließlich um das Produkt herum. "
            "\n\nQUALITÄTSSTANDARD: Jede Idee muss modern, einzigartig, hochwertig, emotional, professionell, "
            "markengerecht, aufmerksamkeitsstark und social-media-tauglich sein. "
            "\n\nAUSGABEFORMAT: 1) Kreative Idee 2) Gestaltungskonzept 3) Warum diese Idee funktioniert "
            "4) Fertiger Prompt 5) Optional: Alternative Idee. "
            "Wenn Bild UND Video sinnvoll wären, entwickle beide. "
            "Wenn mehrere Formate sinnvoll sind, erstelle zusätzlich: Reel Cover, Story Variante, "
            "Facebook Variante, LinkedIn Variante, Thumbnail, Banner. "
            "Beende jede Aufgabe mit mindestens drei kreativen Zusatzideen, die das Projekt auf das nächste Qualitätsniveau bringen könnten."
        ),
        "personality_en": (
            "You are the official Creative Director and Visual AI Designer of KickstarterCash.club. "
            "You combine the expertise of: Art Director, Brand Designer, Creative Director, Ad Agency, "
            "Film Director, Photographer, Cameraman, Motion Designer, Prompt Engineer, Social Media Designer, "
            "UX Designer, and Storyboard Artist. "
            "You create high-quality advertising materials that look professional, modern and emotional. "
            "You never design average content — every result must have advertising agency quality. "
            "KickstarterCash brand: Gold (#C7941D), Dark Green (#233221), White, Black. "
            "Style: Premium, Minimalist, Modern, Luxurious, High-Quality, Clear, Elegant. "
            "Always follow: 1) Understand goal 2) Analyze audience 3) Define emotion "
            "4) Generate creative ideas 5) Select strongest idea 6) Develop visuals → prompt. "
            "Think like an international advertising photographer for images. "
            "Think like a Hollywood director for videos — scene by scene. "
            "Know AI tools: Midjourney, Flux, Ideogram, Leonardo AI, Runway, Veo, Kling. "
            "End every task with at least three creative bonus ideas to elevate the project."
        ),
    },
    "video": {
        "id": "video",
        "emoji": "🎬",
        "name": "Video Agent",
        "role_de": "Video, Reels & Produktion",
        "role_en": "Video, Reels & Production",
        "color": "#F472B6",
        "personality_de": (
            "Du bist der Video-Produzent von KickstarterCash. "
            "Du kennst Veo, Runway ML, Kling, CapCut und alle modernen Video-KI-Tools. "
            "Du schreibst Storyboards, Skripte, Hook-Sequenzen und Reels-Konzepte. "
            "Du weißt was viral geht, welche Schnittrhythmen funktionieren und wie man Aufmerksamkeit hält. "
            "Dein Output: konkrete Scripts, Shot-Listen und Produktions-Anleitungen."
        ),
        "personality_en": (
            "You are the video producer of KickstarterCash. "
            "You know Veo, Runway ML, Kling, CapCut and all modern video AI tools. "
            "You write storyboards, scripts, hook sequences and reels concepts. "
            "You know what goes viral, which editing rhythms work and how to maintain attention. "
            "Your output: concrete scripts, shot lists and production guides."
        ),
    },
    "seo": {
        "id": "seo",
        "emoji": "🌍",
        "name": "SEO Agent",
        "role_de": "Webseiten, Rankings & Keywords",
        "role_en": "Websites, Rankings & Keywords",
        "color": "#34D399",
        "personality_de": (
            "Du bist der SEO-Experte von KickstarterCash. "
            "Du analysierst Webseiten, identifizierst Keyword-Chancen und baust Ranking-Strategien. "
            "Du kennst Google's Core Updates, E-E-A-T, technisches SEO und Content-SEO. "
            "Du lieferst konkrete Meta-Texte, strukturierte Daten, Keyword-Cluster und Maßnahmenpläne."
        ),
        "personality_en": (
            "You are the SEO expert of KickstarterCash. "
            "You analyze websites, identify keyword opportunities and build ranking strategies. "
            "You know Google's Core Updates, E-E-A-T, technical SEO and content SEO. "
            "You deliver concrete meta texts, structured data, keyword clusters and action plans."
        ),
    },
    "social": {
        "id": "social",
        "emoji": "📱",
        "name": "Social Agent",
        "role_de": "Reels, Posts & Plattform-Strategie",
        "role_en": "Reels, Posts & Platform Strategy",
        "color": "#FBBF24",
        "personality_de": (
            "Du bist der Social-Media-Stratege von KickstarterCash. "
            "Du lebst Instagram, TikTok, Facebook, LinkedIn, YouTube Shorts und Pinterest. "
            "Du weißt welche Inhalte auf welcher Plattform funktionieren, wann der beste Posting-Zeitpunkt ist "
            "und wie man Reichweite organisch aufbaut. "
            "Du erstellst komplette Post-Pakete mit Caption, Hashtags, CTA und Bildidee."
        ),
        "personality_en": (
            "You are the social media strategist of KickstarterCash. "
            "You live Instagram, TikTok, Facebook, LinkedIn, YouTube Shorts and Pinterest. "
            "You know what content works on which platform, when the best posting time is "
            "and how to build reach organically. "
            "You create complete post packages with caption, hashtags, CTA and image idea."
        ),
    },
    "sales": {
        "id": "sales",
        "emoji": "🤝",
        "name": "Sales Agent",
        "role_de": "Verkauf, Funnels & Conversion",
        "role_en": "Sales, Funnels & Conversion",
        "color": "#FB923C",
        "personality_de": (
            "Du bist der Verkaufs-Profi von KickstarterCash. "
            "Du kennst jeden psychologischen Trigger, jede Einwandbehandlung und jede Closing-Technik. "
            "Du baust Funnels, die konvertieren, entwickelst Angebote die unwiderstehlich sind "
            "und schreibst Sales-Skripte die Ergebnisse liefern. "
            "Dein Motto: Jeder Interessent ist ein potenzieller Kunde."
        ),
        "personality_en": (
            "You are the sales pro of KickstarterCash. "
            "You know every psychological trigger, every objection handling and every closing technique. "
            "You build funnels that convert, develop offers that are irresistible "
            "and write sales scripts that deliver results. "
            "Your motto: Every prospect is a potential customer."
        ),
    },
    "analytics": {
        "id": "analytics",
        "emoji": "📈",
        "name": "Analytics Agent",
        "role_de": "Daten, KPIs & Wachstums-Insights",
        "role_en": "Data, KPIs & Growth Insights",
        "color": "#A78BFA",
        "personality_de": (
            "Du bist der Analytics-Experte von KickstarterCash. "
            "Du liebst Daten, erkennst Muster sofort und übersetzt Zahlen in klare Handlungsempfehlungen. "
            "Du kennst Google Analytics 4, Meta Ads Manager, TikTok Analytics und Funnel-Metriken. "
            "Du erstellst Reports, identifizierst Bottlenecks und zeigst wo Wachstum möglich ist."
        ),
        "personality_en": (
            "You are the analytics expert of KickstarterCash. "
            "You love data, spot patterns instantly and translate numbers into clear action recommendations. "
            "You know Google Analytics 4, Meta Ads Manager, TikTok Analytics and funnel metrics. "
            "You create reports, identify bottlenecks and show where growth is possible."
        ),
    },
    "marketing": {
        "id": "marketing",
        "emoji": "🎯",
        "name": "Marco – Marketing Director",
        "role_de": "Senior Marketing Director & KI-Marketingstratege",
        "role_en": "Senior Marketing Director & AI Marketing Strategist",
        "color": "#D4AF37",
        "personality_de": (
            "Du bist der offizielle Senior Marketing Director und KI-Marketingstratege von KickstarterCash.club. "
            "Du verfügst über Expertenwissen in: Digital Marketing, Performance Marketing, Social Media Marketing, "
            "Branding, Storytelling, Verkaufspsychologie, Copywriting, SEO, GEO (Generative Engine Optimization), "
            "KI-Marketing, Community Building, Affiliate Marketing, Funnel Building, Content Marketing, "
            "E-Mail Marketing, Videomarketing, Influencer Marketing, Conversion Optimierung, Customer Journey, "
            "Automationen und Marketing Analytics. "
            "Du denkst immer unternehmerisch und strategisch. Du bist kein einfacher Texter. "
            "Du arbeitest wie ein kompletter Marketing Director eines erfolgreichen Unternehmens. "
            "\n\nDEINE AUFGABE: Hilf Mitgliedern von KickstarterCash.club dabei, erfolgreicheres Marketing zu betreiben. "
            "Analysiere zunächst das eigentliche Ziel des Nutzers. Stelle bei Bedarf Rückfragen. "
            "Entwickle eine durchdachte Marketingstrategie. Erstelle erst danach Inhalte. "
            "Denke niemals nur kurzfristig. Denke immer in Kampagnen. "
            "\n\nÜBER KICKSTARTERCASH.CLUB: Moderne Plattform rund um KI, Digitalisierung, Marketing, "
            "Kryptowährungen, Community, Unternehmertum, Affiliate Marketing, Finanzwissen, Automationen, "
            "Exklusive Mitgliedschaften und Premium Services. "
            "Kommunikationsstil: modern, hochwertig, seriös, motivierend, sympathisch, lösungsorientiert, verständlich. "
            "Vermeide billige Werbesprache. Erzeuge Vertrauen. "
            "\n\nDEIN DENKPROZESS: 1) Verstehe die Aufgabe vollständig. 2) Analysiere Zielgruppe. "
            "3) Analysiere Marketingziel. 4) Überlege welche Kanäle geeignet sind. 5) Entwickle eine Strategie. "
            "6) Erstelle den Content. 7) Optimiere für Reichweite und Conversion. 8) Überlege zusätzliche Möglichkeiten. "
            "\n\nCONTENTREGELN: Jeder Content muss Aufmerksamkeit erzeugen, neugierig machen, Vertrauen schaffen, "
            "Mehrwert liefern, Emotionen erzeugen und zum Handeln motivieren. "
            "Vermeide: Buzzword-Bingo, leere Werbeversprechen, unnötige Wiederholungen, langweilige Einleitungen. "
            "Nutze situationsabhängig AIDA, PAS, BAB, Storytelling, Hook→Interesse→Mehrwert→CTA. "
            "\n\nAUSGABEFORMAT: Strukturiere Antworten klar mit Überschriften und Listen. "
            "Gib immer konkrete Beispiele. "
            "Beende jede Antwort mit mindestens zwei zusätzlichen Ideen, die der Nutzer wahrscheinlich noch nicht "
            "bedacht hat und die seine Marketingstrategie sinnvoll ergänzen."
        ),
        "personality_en": (
            "You are the official Senior Marketing Director and AI marketing strategist of KickstarterCash.club. "
            "You have expert knowledge in digital marketing, performance marketing, social media marketing, "
            "branding, storytelling, sales psychology, copywriting, SEO, GEO, AI marketing, "
            "community building, affiliate marketing, funnel building, content marketing, email marketing, "
            "video marketing, influencer marketing, conversion optimization, customer journey, and marketing analytics. "
            "You always think entrepreneurially and strategically. "
            "You work like a complete Marketing Director of a successful company. "
            "Analyze the user's actual goal first, ask clarifying questions if needed, "
            "develop a well-thought-out marketing strategy, then create content. "
            "Always think in campaigns, never just short-term. "
            "Structure answers clearly with headings and lists. Always give concrete examples. "
            "End every answer with at least two additional ideas the user likely hasn't considered."
        ),
    },
    "automation": {
        "id": "automation",
        "emoji": "🤖",
        "name": "Automation Agent",
        "role_de": "Workflows, n8n & KI-Automation",
        "role_en": "Workflows, n8n & AI Automation",
        "color": "#F87171",
        "personality_de": (
            "Du bist der Automation-Architekt von KickstarterCash. "
            "Du baust intelligente Workflows mit n8n, Make, Zapier und eigenen APIs. "
            "Du automatisierst E-Mail-Sequenzen, Lead-Nurturing, Social-Media-Posting und CRM-Prozesse. "
            "Du denkst in Systemen: Was einmal gebaut ist, arbeitet für immer. "
            "Dein Output: konkrete Workflow-Strukturen, Node-Konfigurationen und Automatisierungs-Pläne."
        ),
        "personality_en": (
            "You are the automation architect of KickstarterCash. "
            "You build intelligent workflows with n8n, Make, Zapier and custom APIs. "
            "You automate email sequences, lead nurturing, social media posting and CRM processes. "
            "You think in systems: what is built once works forever. "
            "Your output: concrete workflow structures, node configurations and automation plans."
        ),
    },
    "coding": {
        "id": "coding",
        "emoji": "💻",
        "name": "Coding Agent",
        "role_de": "HTML, React, PHP, APIs & n8n",
        "role_en": "HTML, React, PHP, APIs & n8n",
        "color": "#22D3EE",
        "personality_de": (
            "Du bist der Lead-Entwickler von KickstarterCash. "
            "Du beherrschst HTML, CSS, JavaScript, React, PHP, Python und REST-APIs. "
            "Du baust Landingpages, Integrationen, Webhooks und n8n-Nodes. "
            "Du schreibst sauberen, kommentierten Code der sofort einsetzbar ist. "
            "Dein Stil: pragmatisch, effizient, keine unnötige Komplexität."
        ),
        "personality_en": (
            "You are the lead developer of KickstarterCash. "
            "You master HTML, CSS, JavaScript, React, PHP, Python and REST APIs. "
            "You build landing pages, integrations, webhooks and n8n nodes. "
            "You write clean, commented code that is immediately usable. "
            "Your style: pragmatic, efficient, no unnecessary complexity."
        ),
    },
}


class AgentChatRequest(BaseModel):
    agent_id: str
    message: str
    history: list = []
    model: str = "gpt"
    language: str = "DE"
    use_knowledge: bool = True


class AgentToolRunRequest(BaseModel):
    agent_id: str
    tool_id: str
    context: str = ""
    model: str = "gpt"
    language: str = "DE"
    brand_id: str = "kickstartercash"


@api_router.get("/agents")
async def list_agents():
    result = []
    for a in AGENTS.values():
        entry = dict(a)
        entry["tools"] = AGENT_TOOLS.get(a["id"], [])
        result.append(entry)
    return result


@api_router.get("/agents/{agent_id}/tools")
async def get_agent_tools(agent_id: str):
    if agent_id not in AGENTS:
        raise HTTPException(status_code=404, detail="Agent not found")
    return AGENT_TOOLS.get(agent_id, [])


@api_router.post("/agents/tools/run")
async def run_agent_tool(req: AgentToolRunRequest):
    agent = AGENTS.get(req.agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    tools = AGENT_TOOLS.get(req.agent_id, [])
    tool = next((t for t in tools if t["id"] == req.tool_id), None)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    lang = req.language
    tool_prompt = tool.get("prompt_de" if lang == "DE" else "prompt_en", "")
    full_prompt = f"{tool_prompt}{req.context}".strip()

    if tool["type"] == "image":
        brand = await db.brands.find_one({"id": req.brand_id}, {"_id": 0})
        if not brand:
            brand = {"name": "KickstarterCash", "primary_color": "#D4AF37", "tone": "luxuriös"}
        image_prompt = (
            f"Professional advertising image for KickstarterCash.club. "
            f"Style: luxurious, gold and black, premium. "
            f"Subject: {req.context or 'KickstarterCash brand visual'}. "
            f"Brand colors: gold (#D4AF37) and black. High quality, commercial photography style."
        )
        try:
            image_url = await poyo_nano_banana(image_prompt, size="16:9")
            if image_url:
                return {
                    "type": "image",
                    "tool_label": tool["label"] if lang == "DE" else tool["label_en"],
                    "image_url": image_url,
                    "prompt_used": image_prompt,
                }
        except Exception as e:
            logger.error(f"Tool image generation error: {e}")
        return {"type": "error", "message": "Bildgenerierung fehlgeschlagen. Bitte prüfe das Poyo-Guthaben."}

    personality = agent["personality_de"] if lang == "DE" else agent["personality_en"]
    lang_label = "Deutsch" if lang == "DE" else "English"
    system = (
        f"{personality}\n\n"
        f"Antworte immer auf {lang_label}. "
        f"Du nutzt gerade das Tool: {tool['label'] if lang == 'DE' else tool['label_en']}. "
        f"Sei präzise, strukturiert und sofort umsetzbar."
    )
    reply = await llm_text(req.model, system, full_prompt)
    return {
        "type": "text",
        "tool_label": tool["label"] if lang == "DE" else tool["label_en"],
        "reply": reply.strip(),
    }


@api_router.post("/agents/chat")
async def agent_chat(req: AgentChatRequest):
    agent = AGENTS.get(req.agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    lang = req.language
    personality = agent["personality_de"] if lang == "DE" else agent["personality_en"]
    lang_label = "Deutsch" if lang == "DE" else "English"

    kb_context = ""
    if req.use_knowledge:
        docs = await db.knowledge.find({}, {"_id": 0, "title": 1, "content": 1, "category": 1}).to_list(40)
        if docs:
            kb_context = "\n\nWISSENSDATENBANK (nutze diese als Grundlage, halluziniere nicht):\n"
            kb_context += "\n".join(f"[{d['category']}] {d['title']}: {d['content'][:400]}" for d in docs[:20])

    system = (
        f"{personality}\n\n"
        f"Antworte immer auf {lang_label}. "
        f"Du bist Teil des Jarvjis Multi-Agenten-Systems für KickstarterCash.club."
        f"{kb_context}"
    )

    convo = ""
    for m in req.history[-10:]:
        role = "User" if m.get("role") == "user" else "Assistant"
        convo += f"{role}: {m.get('content', '')}\n"
    convo += f"User: {req.message}\nAssistant:"

    reply = await llm_text(req.model, system, convo)
    return {"reply": reply.strip(), "agent_id": req.agent_id, "agent_name": agent["name"]}


# ---------------------------------------------------------------------------
# Knowledge Base
# ---------------------------------------------------------------------------

KB_CATEGORIES = [
    "Produkte", "Exclusive Cards", "FAQs", "PDFs & Schulung",
    "Corporate Design", "Texte & Landingpages", "Blogartikel", "Marketingstrategien",
]


class KbEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str
    title: str
    content: str
    tags: List[str] = []
    created_at: str = Field(default_factory=_now_iso)
    updated_at: str = Field(default_factory=_now_iso)


class KbEntryCreate(BaseModel):
    category: str
    title: str
    content: str
    tags: List[str] = []


class KbEntryUpdate(BaseModel):
    category: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None


class KbSearchRequest(BaseModel):
    query: str
    category: Optional[str] = None
    model: str = "gpt"


@api_router.get("/knowledge")
async def list_knowledge(category: Optional[str] = None, q: Optional[str] = None):
    filt: dict = {}
    if category and category != "Alle":
        filt["category"] = category
    docs = await db.knowledge.find(filt, {"_id": 0}).to_list(2000)
    docs.sort(key=lambda d: d.get("created_at", ""), reverse=True)
    if q:
        ql = q.lower()
        docs = [d for d in docs if ql in d.get("title", "").lower()
                or ql in d.get("content", "").lower()
                or any(ql in t.lower() for t in d.get("tags", []))]
    return {"categories": KB_CATEGORIES, "entries": docs}


@api_router.post("/knowledge", response_model=KbEntry)
async def create_knowledge(payload: KbEntryCreate):
    entry = KbEntry(**payload.model_dump())
    await db.knowledge.insert_one(entry.model_dump())
    return entry


@api_router.put("/knowledge/{entry_id}", response_model=KbEntry)
async def update_knowledge(entry_id: str, payload: KbEntryUpdate):
    doc = await db.knowledge.find_one({"id": entry_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Entry not found")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updates["updated_at"] = _now_iso()
    await db.knowledge.update_one({"id": entry_id}, {"$set": updates})
    doc.update(updates)
    return doc


@api_router.delete("/knowledge/{entry_id}")
async def delete_knowledge(entry_id: str):
    result = await db.knowledge.delete_one({"id": entry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"ok": True}


@api_router.post("/knowledge/search")
async def search_knowledge(payload: KbSearchRequest):
    filt: dict = {}
    if payload.category and payload.category != "Alle":
        filt["category"] = payload.category
    docs = await db.knowledge.find(filt, {"_id": 0}).to_list(2000)
    if not docs:
        return {"answer": "Die Wissensdatenbank ist noch leer. Bitte zuerst Einträge hinzufügen.", "sources": []}
    context = "\n\n".join(
        f"[{d['category']}] {d['title']}:\n{d['content']}" for d in docs[:30]
    )
    system = (
        "Du bist Jarvjis, der KI-Agent von KickstarterCash. "
        "Beantworte Fragen ausschließlich auf Basis der folgenden Wissensdatenbank. "
        "Halluziniere nichts. Zitiere die Quelle (Titel) wenn möglich.\n\n"
        f"WISSENSDATENBANK:\n{context}"
    )
    answer = await llm_text(payload.model, system, payload.query)
    relevant = [d for d in docs if any(
        w in d["title"].lower() or w in d["content"].lower()
        for w in payload.query.lower().split()
    )][:3]
    return {"answer": answer, "sources": [{"title": d["title"], "category": d["category"]} for d in relevant]}


# ---------------------------------------------------------------------------
# Phase 6 – Custom Agent Builder
# ---------------------------------------------------------------------------

class CustomAgent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    emoji: str = "🤖"
    role: str
    personality: str
    color: str = "#D4AF37"
    category: str = ""
    created_at: str = Field(default_factory=_now_iso)
    updated_at: str = Field(default_factory=_now_iso)


class CustomAgentCreate(BaseModel):
    name: str
    emoji: str = "🤖"
    role: str
    personality: str
    color: str = "#D4AF37"
    category: str = ""


class CustomAgentUpdate(BaseModel):
    name: Optional[str] = None
    emoji: Optional[str] = None
    role: Optional[str] = None
    personality: Optional[str] = None
    color: Optional[str] = None
    category: Optional[str] = None


class CustomAgentChatRequest(BaseModel):
    message: str
    history: list = []
    model: str = "gpt"
    language: str = "DE"


class AgentBuilderRequest(BaseModel):
    description: str
    model: str = "gpt"
    language: str = "DE"


@api_router.get("/custom-agents")
async def list_custom_agents():
    docs = await db.custom_agents.find({}, {"_id": 0}).to_list(200)
    docs.sort(key=lambda d: d.get("created_at", ""), reverse=True)
    for agent in docs:
        doc_count = await db.custom_agent_docs.count_documents({"agent_id": agent["id"]})
        agent["doc_count"] = doc_count
    return docs


@api_router.post("/custom-agents", response_model=CustomAgent)
async def create_custom_agent(payload: CustomAgentCreate):
    agent = CustomAgent(**payload.model_dump())
    await db.custom_agents.insert_one(agent.model_dump())
    return agent


@api_router.put("/custom-agents/{agent_id}", response_model=CustomAgent)
async def update_custom_agent(agent_id: str, payload: CustomAgentUpdate):
    doc = await db.custom_agents.find_one({"id": agent_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Agent not found")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updates["updated_at"] = _now_iso()
    await db.custom_agents.update_one({"id": agent_id}, {"$set": updates})
    doc.update(updates)
    return doc


@api_router.delete("/custom-agents/{agent_id}")
async def delete_custom_agent(agent_id: str):
    await db.custom_agents.delete_one({"id": agent_id})
    await db.custom_agent_docs.delete_many({"agent_id": agent_id})
    return {"ok": True}


@api_router.post("/custom-agents/{agent_id}/documents")
async def upload_document(agent_id: str, request: Request):
    from fastapi import UploadFile, File
    agent = await db.custom_agents.find_one({"id": agent_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    form = await request.form()
    file = form.get("file")
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    filename = getattr(file, "filename", "document.txt")
    content_bytes = await file.read()

    # Extract text content
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else "txt"
    try:
        if ext in ("txt", "md", "csv", "json", "html", "xml"):
            content_text = content_bytes.decode("utf-8", errors="ignore")
        elif ext == "pdf":
            try:
                import io
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(content_bytes))
                content_text = "\n".join(p.extract_text() or "" for p in reader.pages)
            except Exception:
                content_text = content_bytes.decode("utf-8", errors="ignore")
        else:
            content_text = content_bytes.decode("utf-8", errors="ignore")
    except Exception:
        content_text = "[Binärdatei – Inhalt nicht lesbar]"

    doc = {
        "id": str(uuid.uuid4()),
        "agent_id": agent_id,
        "filename": filename,
        "content": content_text[:50000],  # cap at 50k chars
        "size": len(content_bytes),
        "ext": ext,
        "created_at": _now_iso(),
    }
    await db.custom_agent_docs.insert_one({**doc})
    doc.pop("_id", None)
    return doc


@api_router.get("/custom-agents/{agent_id}/documents")
async def list_documents(agent_id: str):
    docs = await db.custom_agent_docs.find(
        {"agent_id": agent_id}, {"_id": 0, "content": 0}
    ).to_list(100)
    return docs


@api_router.delete("/custom-agents/{agent_id}/documents/{doc_id}")
async def delete_document(agent_id: str, doc_id: str):
    await db.custom_agent_docs.delete_one({"id": doc_id, "agent_id": agent_id})
    return {"ok": True}


@api_router.post("/custom-agents/{agent_id}/chat")
async def custom_agent_chat(agent_id: str, req: CustomAgentChatRequest):
    agent = await db.custom_agents.find_one({"id": agent_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Load documents as knowledge context
    docs = await db.custom_agent_docs.find(
        {"agent_id": agent_id}, {"_id": 0, "filename": 1, "content": 1}
    ).to_list(20)

    doc_context = ""
    if docs:
        doc_context = "\n\nDOKUMENTE & WISSEN (nutze diese als einzige Quelle, halluziniere nicht):\n"
        for d in docs:
            doc_context += f"\n--- {d['filename']} ---\n{d['content'][:3000]}\n"

    lang_label = "Deutsch" if req.language == "DE" else "English"
    system = (
        f"Du bist {agent['name']}, ein spezialisierter KI-Agent.\n"
        f"Deine Rolle: {agent['role']}\n"
        f"Deine Persönlichkeit: {agent['personality']}\n\n"
        f"Antworte immer auf {lang_label}. "
        f"Sei präzise, hilfreich und bleibe in deiner Rolle."
        f"{doc_context}"
    )

    convo = ""
    for m in req.history[-10:]:
        role = "User" if m.get("role") == "user" else "Assistant"
        convo += f"{role}: {m.get('content', '')}\n"
    convo += f"User: {req.message}\nAssistant:"

    reply = await llm_text(req.model, system, convo)
    return {"reply": reply.strip()}


# Phase 7 – Agent Builder (natural language → workflow plan)
@api_router.post("/agent-builder/generate")
async def generate_agent_workflow(req: AgentBuilderRequest):
    lang_label = "Deutsch" if req.language == "DE" else "English"
    system = (
        "Du bist ein KI-Architekten-Assistent für das Jarvjis Agent-System. "
        "Wenn ein Benutzer einen Workflow beschreibt, antwortest du mit:\n"
        "1. **Agent-Konfiguration**: Name, Persönlichkeit, Rolle des zu erstellenden Agenten\n"
        "2. **Workflow-Schritte**: Nummerierte Schritt-für-Schritt Automatisierung\n"
        "3. **Benötigte Tools**: Welche Tools/APIs/Zugänge benötigt werden\n"
        "4. **n8n-Workflow-Struktur**: Welche n8n-Nodes in welcher Reihenfolge\n"
        "5. **Fehlende API-Zugänge**: Was der Nutzer noch einrichten muss\n"
        "6. **Einrichtungszeit**: Geschätzte Zeit für die Einrichtung\n\n"
        f"Antworte strukturiert auf {lang_label}. Sei konkret und technisch präzise."
    )
    reply = await llm_text(req.model, system, req.description)
    return {"plan": reply.strip()}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

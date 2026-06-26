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
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
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
    "claude": ("anthropic", "claude-sonnet-4-5-20250929"),
    "gpt": ("openai", "gpt-5.2"),
}
IMAGE_MODEL = "gemini-3.1-flash-image-preview"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def llm_text(model_choice: str, system_message: str, user_text: str) -> str:
    provider, model = MODEL_MAP.get(model_choice, MODEL_MAP["claude"])
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=str(uuid.uuid4()), system_message=system_message)
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
    reference_b64 = _fetch_logo_b64(brand) if req.apply_logo else None
    if reference_b64:
        full_prompt += " Tastefully integrate the provided brand logo into the composition."

    try:
        image_url = await llm_image(full_prompt, reference_b64)
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
    reference_b64 = _fetch_logo_b64(brand) if req.apply_logo else None
    if reference_b64:
        image_prompt += " Tastefully integrate the provided brand logo into the composition."

    social_raw, copy_raw, image_res = await asyncio.gather(
        llm_text(req.model, json_system, social_user),
        llm_text(req.model, json_system, copy_user),
        llm_image(image_prompt, reference_b64),
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

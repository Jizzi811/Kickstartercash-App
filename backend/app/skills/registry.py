"""BrandMind AI Skill Registry.

Skills are reusable capabilities that agents load dynamically. Agents no longer
own hardcoded tool lists; they receive skill references from this registry.
"""
from __future__ import annotations

from typing import Dict, List, Optional

CATEGORIES = [
    "Marketing", "Research", "Copywriting", "SEO", "Image", "Video", "Voice",
    "Automation", "Analytics", "Business", "Planning", "Review", "Quality Assurance",
]

_BASE_INPUT = {"type": "object", "required": ["context"], "properties": {"context": {"type": "string"}}}
_TEXT_OUTPUT = {"type": "object", "properties": {"reply": {"type": "string"}, "meta": {"type": "object"}}}

SKILLS: Dict[str, dict] = {}

def _skill(id: str, name: str, category: str, description: str, prompt_de: str, prompt_en: str,
           agents: List[str], icon: str = "Sparkles", version: str = "1.0.0",
           required_memory: Optional[List[str]] = None, required_dna: Optional[List[str]] = None,
           required_tools: Optional[List[str]] = None, required_providers: Optional[List[str]] = None,
           cost: str = "low", runtime: str = "20-45s", permission: str = "execute",
           skill_type: str = "llm"):
    SKILLS[id] = {
        "id": id, "name": name, "label": name, "label_en": name, "description": description,
        "category": category, "input_schema": _BASE_INPUT, "output_schema": _TEXT_OUTPUT,
        "required_memory": required_memory or ["brand", "business", "experience"],
        "required_dna": required_dna or ["tone", "visual_style", "audience"],
        "required_tools": required_tools or [], "required_providers": required_providers or ["chat", "structured_output"],
        "cost_estimate": cost, "average_runtime": runtime, "version": version,
        "permissions": [permission], "prompt_de": prompt_de, "prompt_en": prompt_en,
        "agent_ids": agents, "icon": icon, "type": skill_type, "status": "active",
    }

_skill("campaign_planner", "Campaign Planner", "Marketing", "Plans a complete campaign from objective to channel mix, funnel and KPI plan.", "Erstelle einen vollständigen Kampagnenplan mit Ziel, Zielgruppe, Funnel, Kanälen, Budget, Content-Plan, KPIs und nächsten Schritten für: ", "Create a complete campaign plan with objective, audience, funnel, channels, budget, content plan, KPIs and next steps for: ", ["ceo", "content", "orchestrator"], "Map")
_skill("brand_audit", "Brand Audit", "Review", "Audits brand positioning, consistency, message clarity and trust signals.", "Führe ein Brand-Audit durch: Positionierung, Tonalität, Visual DNA, Vertrauen, Differenzierung, Risiken und Quick Wins für: ", "Run a brand audit: positioning, tone, visual DNA, trust, differentiation, risks and quick wins for: ", ["ceo", "designer", "content"], "ShieldCheck")
_skill("seo_audit", "SEO Audit", "SEO", "Reviews on-page, technical and GEO readiness and returns prioritized fixes.", "Erstelle ein SEO-Audit mit Technical SEO, On-Page, Content, Schema, GEO und priorisierten Maßnahmen für: ", "Create an SEO audit covering technical SEO, on-page, content, schema, GEO and prioritized fixes for: ", ["seo", "seo_specialist"], "Search", required_memory=["business", "experience"])
_skill("keyword_expansion", "Keyword Expansion", "SEO", "Expands seed topics into keyword clusters, intent and content opportunities.", "Erweitere diese Seed-Keywords zu Clustern, Suchintentionen, Longtails und Content-Ideen: ", "Expand these seed keywords into clusters, search intents, long tails and content ideas: ", ["seo", "seo_specialist", "content"], "Hash", required_memory=["business", "experience"])
_skill("competitor_analysis", "Competitor Analysis", "Research", "Compares competitors, positioning, offers, channels and gaps.", "Analysiere Wettbewerber, Positionierung, Angebote, Kanäle, Stärken/Schwächen und Chancen für: ", "Analyze competitors, positioning, offers, channels, strengths/weaknesses and opportunities for: ", ["ceo", "marketing", "seo", "orchestrator"], "BarChart2")
_skill("hook_generator", "Hook Generator", "Copywriting", "Generates high-performing hooks for ads, reels, posts and landing pages.", "Generiere 20 starke Hooks in verschiedenen Stilen (Neugier, Problem, Kontrast, Benefit, Story) für: ", "Generate 20 strong hooks in different styles (curiosity, problem, contrast, benefit, story) for: ", ["content", "social", "tiktok", "copywriter"], "Type")
_skill("cta_optimizer", "CTA Optimizer", "Copywriting", "Improves calls to action for clarity, urgency and conversion.", "Optimiere diese CTA-Idee. Liefere 15 Varianten nach Funnel-Stufe und psychologischem Trigger für: ", "Optimize this CTA idea. Provide 15 variants by funnel stage and psychological trigger for: ", ["content", "email", "linkedin", "sales"], "MousePointer")
_skill("image_critique", "Image Critique", "Image", "Critiques visuals against brand DNA, message clarity and conversion purpose.", "Bewerte dieses Bild-/Visual-Konzept nach Brand-Fit, Klarheit, Blickführung, Conversion und Verbesserungen: ", "Critique this visual concept for brand fit, clarity, eye flow, conversion and improvements: ", ["designer", "content"], "Image", required_providers=["chat", "vision"])
_skill("video_critique", "Video Critique", "Video", "Reviews video concepts for hook, pacing, story, brand fit and CTA.", "Bewerte dieses Video-Konzept nach Hook, Pacing, Story, Brand-Fit, CTA und konkreten Verbesserungen: ", "Review this video concept for hook, pacing, story, brand fit, CTA and concrete improvements: ", ["video", "tiktok"], "Video", required_providers=["chat", "vision"])
_skill("image_generate_live", "Generate Image (Live)", "Image", "Generates production image variants directly with the backend image pipeline.", "Generiere ein hochwertiges Werbebild basierend auf: ", "Generate a high-quality production image based on: ", ["designer"], "Image", skill_type="image", required_providers=["image"])
_skill("video_generate_live", "Generate Video (Live)", "Video", "Starts a real Veo video generation job from the given context.", "Erzeuge ein kurzes Video basierend auf: ", "Generate a short video based on: ", ["video"], "Film", skill_type="video", required_providers=["video"])
_skill("prompt_optimizer", "Prompt Optimizer", "Quality Assurance", "Transforms rough prompts into provider-ready production prompts.", "Optimiere diesen Prompt für bessere KI-Ergebnisse. Liefere eine finale Version plus Begründung: ", "Optimize this prompt for better AI results. Return a final version plus rationale: ", ["ceo", "designer", "video", "coding", "orchestrator"], "Wand2")
_skill("landingpage_review", "Landingpage Review", "Review", "Reviews a landing page for structure, copy, friction, SEO and conversion.", "Reviewe diese Landingpage: Hero, Nutzenversprechen, Trust, Einwände, CTA, SEO, mobile UX und Quick Wins: ", "Review this landing page: hero, value prop, trust, objections, CTA, SEO, mobile UX and quick wins: ", ["content", "seo", "coding", "sales"], "Layout")
_skill("storytelling_review", "Storytelling Review", "Review", "Improves narrative arc, emotional clarity and proof points.", "Reviewe das Storytelling: Zielgruppe, Konflikt, Transformation, Beweise, Emotion, Klarheit und bessere Version: ", "Review the storytelling: audience, conflict, transformation, proof, emotion, clarity and better version: ", ["content", "linkedin", "email"], "BookOpen")
_skill("brand_compliance_check", "Brand Compliance Check", "Quality Assurance", "Checks whether output follows brand identity, tone and rules.", "Prüfe diesen Output auf Brand Compliance: Tonalität, Werte, Visual DNA, No-Gos, Konsistenz. Gib Freigabe oder Korrekturen: ", "Check this output for brand compliance: tone, values, visual DNA, no-gos, consistency. Give approval or corrections: ", ["ceo", "designer", "content", "orchestrator"], "ShieldCheck")
_skill("output_optimizer", "Output Optimizer", "Quality Assurance", "Refines existing output for usefulness, structure, conversion and polish.", "Optimiere diesen Output auf Klarheit, Struktur, Umsetzbarkeit, Conversion und Premium-Wirkung: ", "Optimize this output for clarity, structure, actionability, conversion and premium polish: ", ["ceo", "content", "orchestrator", "seo", "email", "linkedin"], "Sparkles")
_skill("ai_citation_strategist", "AI Citation Strategist", "SEO", "Improves visibility in AI answers (ChatGPT, Claude, Gemini, Perplexity) and GEO/AEO citations.", "Analysiere die Sichtbarkeit in KI-Suchen (ChatGPT, Claude, Gemini, Perplexity) und liefere eine priorisierte GEO/AEO-Strategie inkl. Quellen-, Entitäten- und Zitier-Optimierung für: ", "Analyze visibility across AI answer engines (ChatGPT, Claude, Gemini, Perplexity) and provide a prioritized GEO/AEO strategy including source, entity and citation optimization for: ", ["seo", "ceo"], "Quote", required_memory=["business", "experience"], required_dna=["audience", "positioning"], cost="medium", runtime="45-90s")
_skill("aeo_foundations_architect", "AEO Foundations Architect", "SEO", "Defines llms.txt, AI-aware robots rules and retrieval-ready content foundations.", "Erstelle die AEO-Basisarchitektur mit llms.txt, AI-fähigem robots-Konzept, strukturierter Entitätslogik, FAQ-Schema und priorisiertem Implementierungsplan für: ", "Design the AEO foundations with llms.txt, AI-aware robots strategy, entity structure, FAQ schema and a prioritized implementation plan for: ", ["seo", "coding"], "FileCog", required_memory=["business", "experience"], required_dna=["audience", "positioning"], cost="medium", runtime="45-90s")
_skill("agentic_search_optimizer", "Agentic Search Optimizer", "SEO", "Optimizes pages so AI agents can discover, parse and complete tasks reliably.", "Optimiere die Website für agentische Suche (AI-Browser/Agents): Crawlbarkeit, Task-Completeness, strukturierte Inhalte, Navigation und Prompt-freundliche Informationsarchitektur für: ", "Optimize the website for agentic search (AI browsers/agents): crawlability, task completeness, structured content, navigation and prompt-friendly information architecture for: ", ["seo", "coding", "automation"], "Bot", required_memory=["business", "experience"], required_dna=["audience", "tone"], cost="medium", runtime="45-90s")
_skill("video_optimization_specialist", "Video Optimization Specialist", "Video", "Optimizes YouTube/Reels videos for hook strength, retention, chapters, thumbnail angle and CTA.", "Optimiere dieses Video-/Channel-Konzept für Hook, Retention, Watchtime, Kapitelstruktur, Thumbnail-Ideen, Titel/Description-SEO und CTA-System: ", "Optimize this video/channel concept for hook strength, retention, watch time, chaptering, thumbnail angles, title/description SEO and CTA system: ", ["video", "seo", "content"], "Clapperboard", required_memory=["business", "experience"], required_dna=["audience", "tone"], cost="medium", runtime="45-90s")
_skill("email_marketing_strategist", "Email Marketing Strategist", "Marketing", "Builds lifecycle email systems with segmentation, automation, deliverability and offer sequencing.", "Entwickle eine Lifecycle-Email-Strategie mit Segmenten, Automationen, Kampagnenstruktur, Betreff-Ansätzen, Angebotssequenz und Deliverability-Absicherung für: ", "Build a lifecycle email strategy with segmentation, automations, campaign structure, subject-line angles, offer sequencing and deliverability safeguards for: ", ["content", "sales", "automation"], "Mail", required_memory=["business", "experience"], required_dna=["audience", "tone"], cost="medium", runtime="45-90s")
_skill("pr_communications_manager", "PR & Communications Manager", "Marketing", "Creates PR narratives, launch messaging, media angles and trust-building communication plans.", "Erstelle einen PR- und Kommunikationsplan mit Kernnarrativ, Pressewinkeln, Messaging-Hierarchie, Stakeholder-Plan, Krisenreaktionslinien und Veröffentlichungsfahrplan für: ", "Create a PR and communications plan with core narrative, press angles, messaging hierarchy, stakeholder plan, crisis response lines and publishing roadmap for: ", ["ceo", "content", "sales"], "Megaphone", required_memory=["brand", "business"], required_dna=["tone", "positioning", "audience"], cost="medium", runtime="45-90s")

AGENT_SKILL_MAP = {aid: [s["id"] for s in SKILLS.values() if aid in s.get("agent_ids", [])] for aid in sorted({a for s in SKILLS.values() for a in s.get("agent_ids", [])})}

def list_skills(category: Optional[str] = None, q: str = "") -> List[dict]:
    q = (q or "").lower().strip()
    rows = list(SKILLS.values())
    if category:
        rows = [s for s in rows if s["category"].lower() == category.lower()]
    if q:
        rows = [s for s in rows if q in (s["name"] + s["description"] + s["category"]).lower()]
    return sorted(rows, key=lambda s: (s["category"], s["name"]))

def get_skill(skill_id: str) -> Optional[dict]:
    return SKILLS.get(skill_id)

def skills_for_agent(agent_id: str) -> List[dict]:
    return [SKILLS[sid] for sid in AGENT_SKILL_MAP.get(agent_id, []) if sid in SKILLS]

def registry_payload() -> dict:
    return {"categories": CATEGORIES, "skills": list_skills(), "agent_skill_map": AGENT_SKILL_MAP}


def suggest_skill_for_task(task: str, preferred_agent_id: Optional[str] = None) -> Optional[dict]:
    """Heuristic matcher that maps free-form tasks to the best skill.

    We deliberately keep this lightweight and deterministic so it can run before
    any expensive model call.
    """
    text = (task or "").strip().lower()
    if not text:
        return None

    best = None
    best_score = -1.0
    for skill in SKILLS.values():
        if preferred_agent_id and preferred_agent_id not in skill.get("agent_ids", []):
            continue

        haystack = " ".join([
            skill.get("name", ""),
            skill.get("description", ""),
            skill.get("category", ""),
            skill.get("prompt_de", ""),
            skill.get("prompt_en", ""),
        ]).lower()

        # Basic token-overlap score
        tokens = [t for t in text.replace("/", " ").replace("-", " ").split() if len(t) >= 3]
        overlap = sum(1 for t in tokens if t in haystack)
        score = float(overlap)

        # Small boosts for obvious media intents.
        if any(k in text for k in ("bild", "image", "visual", "grafik")) and skill.get("type") == "image":
            score += 5.0
        if any(k in text for k in ("video", "reel", "veo", "clip")) and skill.get("type") == "video":
            score += 5.0

        # Targeted boosts for newly integrated agency-agent style skills.
        if skill.get("id") == "ai_citation_strategist" and any(
            k in text for k in ("geo", "aeo", "citation", "citations", "ai overview", "perplexity", "chatgpt", "claude", "gemini")
        ):
            score += 6.0
        if skill.get("id") == "aeo_foundations_architect" and any(
            k in text for k in ("llms.txt", "robots", "schema", "structured data", "entity", "entities")
        ):
            score += 6.0
        if skill.get("id") == "agentic_search_optimizer" and any(
            k in text for k in ("agentic", "ai browser", "webmcp", "crawlability", "task completeness")
        ):
            score += 6.0
        if skill.get("id") == "video_optimization_specialist" and any(
            k in text for k in ("watchtime", "retention", "thumbnail", "chapter", "youtube seo")
        ):
            score += 6.0
        if skill.get("id") == "email_marketing_strategist" and any(
            k in text for k in ("email", "newsletter", "deliverability", "lifecycle", "sequence")
        ):
            score += 6.0
        if skill.get("id") == "pr_communications_manager" and any(
            k in text for k in ("pr", "press", "communications", "media", "reputation")
        ):
            score += 6.0

        if score > best_score:
            best_score = score
            best = skill

    if best_score <= 0:
        # Fallback preference: orchestrator-safe planning skill for unknown tasks.
        return SKILLS.get("campaign_planner")
    return best

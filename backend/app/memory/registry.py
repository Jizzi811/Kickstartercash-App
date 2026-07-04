"""Multi-Brain Memory – the brain registry and the Memory Router map.

Three brains, one router. Each agent is routed only to the brains it needs, so
knowledge domains never bleed into each other:

    Brand Brain      – who the brand is (name, colors, tone, DNA).  [Epic 2]
    Business Brain    – how the company operates (goals, strategy, SOPs, …).
    Experience Brain  – what has worked (approvals, winning assets, patterns).

The registry is data-driven and extensible: adding a category is a change here,
and adding a whole new brain only requires a new aggregation in ``router.py``.
"""

from __future__ import annotations

from typing import Dict, List

BRAND = "brand"
BUSINESS = "business"
EXPERIENCE = "experience"

BRAIN_IDS = [BRAND, BUSINESS, EXPERIENCE]

BRAIN_META = {
    BRAND: {"de": "Brand Brain", "en": "Brand Brain", "emoji": "🎨",
            "desc_de": "Wer die Marke ist – Identität, DNA, Tonalität.",
            "desc_en": "Who the brand is – identity, DNA, tone."},
    BUSINESS: {"de": "Business Brain", "en": "Business Brain", "emoji": "💼",
               "desc_de": "Wie das Unternehmen arbeitet – Ziele, Strategie, SOPs.",
               "desc_en": "How the company operates – goals, strategy, SOPs."},
    EXPERIENCE: {"de": "Experience Brain", "en": "Experience Brain", "emoji": "⭐",
                 "desc_de": "Was funktioniert hat – Freigaben, Sieger-Assets, Muster.",
                 "desc_en": "What has worked – approvals, winning assets, patterns."},
}

# Business Brain categories (editable knowledge).
BUSINESS_CATEGORIES = [
    {"id": "goals", "de": "Ziele", "en": "Goals"},
    {"id": "strategies", "de": "Strategien", "en": "Strategies"},
    {"id": "sops", "de": "SOPs / Prozesse", "en": "SOPs / Processes"},
    {"id": "documents", "de": "Dokumente", "en": "Documents"},
    {"id": "company_knowledge", "de": "Unternehmenswissen", "en": "Company knowledge"},
    {"id": "checklists", "de": "Checklisten", "en": "Checklists"},
    {"id": "competitors", "de": "Wettbewerber", "en": "Competitors"},
    {"id": "planning", "de": "Planung", "en": "Planning"},
]
BUSINESS_CATEGORY_IDS = {c["id"] for c in BUSINESS_CATEGORIES}

# Experience Brain categories (mostly derived from prior epics' signals).
EXPERIENCE_CATEGORIES = [
    {"id": "campaign_history", "de": "Kampagnen-Historie", "en": "Campaign history"},
    {"id": "approved_assets", "de": "Freigegebene Assets", "en": "Approved assets"},
    {"id": "rejected_assets", "de": "Abgelehnte Assets", "en": "Rejected assets"},
    {"id": "prompt_history", "de": "Prompt-Historie", "en": "Prompt history"},
    {"id": "agent_performance", "de": "Agenten-Leistung", "en": "Agent performance"},
    {"id": "user_feedback", "de": "Nutzer-Feedback", "en": "User feedback"},
    {"id": "approval_history", "de": "Freigabe-Historie", "en": "Approval history"},
    {"id": "recurring_patterns", "de": "Wiederkehrende Muster", "en": "Recurring patterns"},
]

# Memory Router: which brains each agent/role receives.
# Unknown agents get all three (safe superset).
AGENT_BRAIN_MAP: Dict[str, List[str]] = {
    "ceo": [BRAND, BUSINESS, EXPERIENCE],
    "marketing": [BUSINESS, EXPERIENCE, BRAND],
    "designer": [BRAND, EXPERIENCE],
    "video": [BRAND, EXPERIENCE],
    "social": [BRAND, EXPERIENCE],
    "tiktok": [BRAND, EXPERIENCE],
    "seo": [BUSINESS, EXPERIENCE],
    "seo_specialist": [BUSINESS, EXPERIENCE],
    "content": [BRAND, EXPERIENCE, BUSINESS],
    "email": [BRAND, EXPERIENCE, BUSINESS],
    "linkedin": [BUSINESS, EXPERIENCE, BRAND],
    "sales": [BUSINESS, EXPERIENCE, BRAND],
    "analytics": [BUSINESS, EXPERIENCE],
    "orchestrator": [BRAND, BUSINESS, EXPERIENCE],
}


def brains_for_agent(agent_id) -> List[str]:
    if not agent_id:
        return list(BRAIN_IDS)
    return AGENT_BRAIN_MAP.get(agent_id, list(BRAIN_IDS))


def registry_payload() -> dict:
    return {
        "brains": [{"id": b, **BRAIN_META[b]} for b in BRAIN_IDS],
        "business_categories": BUSINESS_CATEGORIES,
        "experience_categories": EXPERIENCE_CATEGORIES,
        "agent_brain_map": AGENT_BRAIN_MAP,
    }

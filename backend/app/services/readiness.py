from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any, Optional

ONBOARDING_STATUSES = {"not_started", "path_selected", "in_progress", "completed", "skipped"}
ONBOARDING_PATHS = {"existing_brand", "founder", "explore"}
ONBOARDING_STEPS = {
    "existing_brand": ["brand_brain", "brand_identity", "knowledge", "home"],
    "founder": ["intake", "ideas", "brand", "offers", "business_plan", "finance", "operations", "summary"],
    "explore": ["home", "quantum", "brand", "create", "projects"],
}
PLACEHOLDER_VALUES = {"", "—", "n/a", "na", "none", "keine", "kein", "tbd", "todo", "test", "demo", "lorem ipsum"}

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def has_real_value(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        text = re.sub(r"\s+", " ", value).strip().lower()
        return bool(text) and text not in PLACEHOLDER_VALUES and len(text) > 1
    if isinstance(value, list):
        return any(has_real_value(v) for v in value)
    if isinstance(value, dict):
        return any(has_real_value(v) for v in value.values())
    return bool(value)

def onboarding_route(selected_path: str = "", current_step: str = "") -> str:
    if selected_path == "existing_brand":
        return {"brand_identity": "/brand-identity", "knowledge": "/knowledge", "home": "/app"}.get(current_step, "/brand-brain")
    if selected_path == "founder":
        return {"ideas": "/onboarding/founder/ideas", "brand": "/onboarding/founder/brand", "offers": "/onboarding/founder/offers", "business_plan": "/onboarding/founder/business-plan", "finance": "/onboarding/founder/finance", "operations": "/ops", "summary": "/app"}.get(current_step, "/onboarding/founder/intake")
    if selected_path == "explore":
        return "/app"
    return "/onboarding/select-path"

def calculate_brand_readiness(brand: Optional[dict], knowledge_count: int, workspace_id: str) -> dict:
    if not brand:
        return {"score": 0, "completed_categories": [], "incomplete_categories": [], "category_details": [], "next_actions": [], "calculated_at": _now_iso(), "brand_id": "", "workspace_id": workspace_id, "state": "no_active_brand"}
    bid = brand.get("id", "")
    dna = brand.get("dna") or {}
    criteria = [
        ("basics", "Grundlagen", "Basics", 14, [("name", brand.get("name")), ("industry", brand.get("industry"))], "/brand-brain", "Grunddaten ergänzen", "Complete basics"),
        ("audience", "Zielgruppe", "Audience", 14, [("target_audience", brand.get("target_audience")), ("problem_or_need", dna.get("problem") or dna.get("need"))], "/brand-brain", "Zielgruppe präzisieren", "Clarify audience"),
        ("positioning", "Positionierung", "Positioning", 14, [("value_proposition", brand.get("slogan") or dna.get("value_proposition")), ("differentiation", dna.get("differentiation"))], "/brand-brain", "Positionierung schärfen", "Sharpen positioning"),
        ("offering", "Angebot", "Offering", 14, [("products", brand.get("products")), ("offer_description", dna.get("offer_description") or brand.get("products"))], "/brand-brain", "Angebot ergänzen", "Add offering"),
        ("personality", "Persönlichkeit", "Personality", 12, [("values", dna.get("values")), ("tone", brand.get("tone"))], "/brand-identity", "Markenpersönlichkeit ergänzen", "Add personality"),
        ("visual_identity", "Visuelle Identität", "Visual identity", 12, [("colors", [brand.get("primary_color"), brand.get("secondary_color")]), ("style", brand.get("image_style")), ("logo", brand.get("logo_url"))], "/brand-identity", "Visuelle Identität festlegen", "Define visual identity"),
        ("marketing", "Marketingausrichtung", "Marketing direction", 10, [("marketing_goal", dna.get("marketing_goal")), ("channels", brand.get("social_accounts"))], "/brand-brain", "Marketingziel ergänzen", "Add marketing goal"),
        ("knowledge", "Markenwissen", "Brand knowledge", 10, [("knowledge_entry", knowledge_count > 0)], "/knowledge", "Markenwissen ergänzen", "Add brand knowledge"),
    ]
    details=[]; total=0; completed=[]; incomplete=[]
    for cid, de, en, pts, checks, route, action_de, action_en in criteria:
        present=[k for k,v in checks if has_real_value(v)]; missing=[k for k,v in checks if not has_real_value(v)]
        earned=round(pts * len(present) / len(checks)) if checks else 0
        status="complete" if not missing else ("partial" if present else "missing")
        total += earned
        (completed if status=="complete" else incomplete).append(cid)
        details.append({"id":cid,"label_de":de,"label_en":en,"status":status,"earned_points":earned,"possible_points":pts,"present_criteria":present,"missing_criteria":missing,"route":route,"action_de":action_de,"action_en":action_en})
    actions=[{"title_de":d["action_de"],"title_en":d["action_en"],"description_de":f"{d['label_de']} ist noch nicht vollständig hinterlegt.","description_en":f"{d['label_en']} is not complete yet.","route":d["route"],"priority":i+1,"category":d["id"]} for i,d in enumerate([x for x in details if x["status"]!="complete"][:3])]
    return {"score": max(0, min(100, int(total))), "completed_categories": completed, "incomplete_categories": incomplete, "category_details": details, "next_actions": actions, "calculated_at": _now_iso(), "brand_id": bid, "workspace_id": workspace_id, "state": "ok"}

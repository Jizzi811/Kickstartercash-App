from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from app.gateway import gateway as ai_gateway
from .registry import get_skill


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def execute_skill(skill_id: str, *, context: str, language: str, agent: dict, brand: dict,
                        memory_context: str, gateway_config: dict, workspace_id: Optional[str], db=None,
                        model_choice: Optional[str] = None) -> dict:
    skill = get_skill(skill_id)
    if not skill:
        raise ValueError("Skill not found")
    prompt = skill["prompt_de" if language == "DE" else "prompt_en"] + (context or "")
    lang_label = "Deutsch" if language == "DE" else "English"
    system = (
        f"You are executing the BrandMind skill '{skill['name']}' v{skill['version']}.\n"
        f"Skill description: {skill['description']}\n"
        f"Agent: {agent.get('name')} / {agent.get('role_de' if language == 'DE' else 'role_en', '')}.\n"
        f"Brand: {brand.get('name', 'Brand')} | Tone: {brand.get('tone', '')} | Audience: {brand.get('target_audience', '')}.\n"
        f"Required memory: {', '.join(skill.get('required_memory', []))}. Required DNA: {', '.join(skill.get('required_dna', []))}.\n"
        f"Return a practical, structured result in {lang_label}.\n"
        f"{memory_context or ''}"
    )
    started = now_iso()
    result = await ai_gateway.chat(system, prompt, gateway_config, task="chat", model_choice=model_choice, ws=workspace_id)
    doc = {
        "id": str(uuid.uuid4()), "skill_id": skill_id, "skill_version": skill["version"],
        "agent_id": agent.get("id", ""), "workspace_id": workspace_id or "",
        "input": {"context": context, "language": language}, "ok": result.ok,
        "output": result.output if result.ok else "", "error": result.error,
        "meta": result.to_meta(), "started_at": started, "created_at": now_iso(),
    }
    if db is not None:
        await db.skill_logs.insert_one({**doc})
    return {"type": "text", "skill": skill, "reply": doc["output"], "meta": doc["meta"], "log_id": doc["id"]}

"""Usage metering + quota enforcement for LLM generations.

One source of truth: the ``gateway_usage`` collection (the AI gateway already
writes there). ``llm_text`` records into the same collection, and quota is the
count of successful generations in the current calendar month vs. the
workspace plan's ``generations_per_month`` limit (PLANS in brandmind.py).

Month rollover is free: documents carry ISO ``created_at`` strings, so a
``^YYYY-MM`` prefix match selects the current month — no reset job needed.

Requests without a resolved workspace (legacy single-brand deployments,
background tasks) stay unmetered by design, matching _scope_filter semantics.
"""
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, Tuple

from fastapi import HTTPException

from app.core import database

logger = logging.getLogger(__name__)


def _month_prefix() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


async def monthly_generations(workspace_id: str) -> int:
    """Successful generations for this workspace in the current month."""
    db = database.db
    if db is None or not workspace_id:
        return 0
    return await db.gateway_usage.count_documents({
        "workspace_id": workspace_id,
        "ok": True,
        "created_at": {"$regex": f"^{_month_prefix()}"},
    })


async def plan_limit(workspace_id: str) -> Tuple[str, int]:
    """(plan_id, generations_per_month) for a workspace; trial limits if unknown."""
    from brandmind import PLANS  # lazy: brandmind is a backend-root module

    plan_id = "trial"
    db = database.db
    if db is not None and workspace_id:
        ws = await db.bm_workspaces.find_one({"id": workspace_id}, {"_id": 0, "plan": 1})
        if ws:
            plan_id = ws.get("plan") or "trial"
    plan = PLANS.get(plan_id) or PLANS["trial"]
    return plan_id, int(plan["limits"]["generations_per_month"])


async def check_quota(workspace_id: Optional[str]) -> None:
    """Raise 402 when the workspace's monthly generation quota is exhausted."""
    if not workspace_id or database.db is None:
        return
    plan_id, limit = await plan_limit(workspace_id)
    used = await monthly_generations(workspace_id)
    if used >= limit:
        raise HTTPException(status_code=402, detail={
            "error": "quota_exceeded",
            "plan": plan_id,
            "used": used,
            "limit": limit,
            "message": "Monatliches KI-Kontingent erreicht. Bitte Plan upgraden.",
        })


async def record_generation(workspace_id: Optional[str], source: str,
                            provider: str, model: str, ok: bool) -> None:
    """Write a gateway_usage-shaped document for a direct llm_text generation.

    Skipped when no workspace is resolved — legacy/unscoped calls stay
    unmetered, and the gateway path records its own richer documents.
    Metering must never break the generation itself, hence the broad guard.
    """
    db = database.db
    if db is None or not workspace_id:
        return
    try:
        await db.gateway_usage.insert_one({
            "id": str(uuid.uuid4()),
            "workspace_id": workspace_id,
            "capability": "llm_text",
            "source": source,
            "provider": provider,
            "model": model,
            "latency_ms": 0,
            "tokens_in": 0,
            "tokens_out": 0,
            "cost_usd": 0.0,
            "ok": ok,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        if ok:
            await db.bm_workspaces.update_one(
                {"id": workspace_id},
                {"$inc": {"usage.generations_this_month": 1}},
            )
    except Exception as e:  # noqa: BLE001
        logger.warning(f"[metering] usage record failed: {e}")

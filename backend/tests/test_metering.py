"""Quota enforcement + usage metering tests (Step 04 of the blueprint playbook).

Covers app.usage.metering directly and the llm_text integration: workspace
resolved -> quota checked before any provider call, successful generations
recorded into gateway_usage, exhausted quota -> 402 without touching a
provider, and unresolved workspaces staying unmetered. Fully offline.
"""
import asyncio
import os
from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

os.environ.setdefault("MONGO_URL", "")

from app.core import database  # noqa: E402
from app.core.request_context import (  # noqa: E402
    current_workspace_id, reset_workspace_id, set_workspace_id,
)
from app.usage import metering  # noqa: E402
from tests.test_identity import _FakeDB  # noqa: E402 — reuse the mongo fake

TRIAL_LIMIT = 30  # PLANS["trial"]["limits"]["generations_per_month"]
WS = "ws-test-1"


def _month() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


@pytest.fixture()
def db(monkeypatch):
    fake = _FakeDB()
    monkeypatch.setattr(database, "db", fake)
    asyncio.run(fake.bm_workspaces.insert_one(
        {"id": WS, "name": "Test", "slug": "test", "plan": "trial",
         "usage": {"generations_this_month": 0}}))
    return fake


def _burn(fake, n, ok=True):
    for _ in range(n):
        asyncio.run(fake.gateway_usage.insert_one(
            {"workspace_id": WS, "ok": ok, "created_at": f"{_month()}-05T10:00:00+00:00"}))


# ---------------------------------------------------------------------------
# metering primitives
# ---------------------------------------------------------------------------
def test_check_quota_passes_below_limit(db):
    _burn(db, TRIAL_LIMIT - 1)
    asyncio.run(metering.check_quota(WS))  # must not raise


def test_check_quota_blocks_at_limit_with_402(db):
    _burn(db, TRIAL_LIMIT)
    with pytest.raises(HTTPException) as exc:
        asyncio.run(metering.check_quota(WS))
    assert exc.value.status_code == 402
    assert exc.value.detail["error"] == "quota_exceeded"
    assert exc.value.detail["used"] == TRIAL_LIMIT
    assert exc.value.detail["limit"] == TRIAL_LIMIT


def test_failed_generations_do_not_burn_quota(db):
    _burn(db, TRIAL_LIMIT, ok=False)
    asyncio.run(metering.check_quota(WS))  # must not raise


def test_previous_month_does_not_count(db):
    for _ in range(TRIAL_LIMIT):
        asyncio.run(db.gateway_usage.insert_one(
            {"workspace_id": WS, "ok": True, "created_at": "2001-01-05T10:00:00+00:00"}))
    asyncio.run(metering.check_quota(WS))  # must not raise


def test_check_quota_unresolved_workspace_is_unmetered(db):
    _burn(db, TRIAL_LIMIT)
    asyncio.run(metering.check_quota(None))  # legacy requests never block


def test_record_generation_writes_usage_and_increments_counter(db):
    asyncio.run(metering.record_generation(WS, "llm_text", "openai", "gpt-5.2", True))
    assert len(db.gateway_usage.docs) == 1
    doc = db.gateway_usage.docs[0]
    assert doc["workspace_id"] == WS and doc["ok"] is True
    assert doc["capability"] == "llm_text" and doc["provider"] == "openai"
    ws = asyncio.run(db.bm_workspaces.find_one({"id": WS}))
    assert ws["usage"]["generations_this_month"] == 1


def test_record_generation_failure_counts_nothing(db):
    asyncio.run(metering.record_generation(WS, "llm_text", "openai", "gpt-5.2", False))
    assert len(db.gateway_usage.docs) == 1
    ws = asyncio.run(db.bm_workspaces.find_one({"id": WS}))
    assert ws["usage"]["generations_this_month"] == 0


def test_record_generation_without_workspace_is_skipped(db):
    asyncio.run(metering.record_generation(None, "llm_text", "openai", "gpt-5.2", True))
    assert db.gateway_usage.docs == []


# ---------------------------------------------------------------------------
# llm_text integration (workspace from request context)
# ---------------------------------------------------------------------------
def test_llm_text_records_generation_for_workspace(db, monkeypatch):
    from app.services import llm

    async def _fake_single(provider, model, system, user, extra=None):
        return "Hallo!"

    monkeypatch.setattr(llm, "_llm_single", _fake_single)
    monkeypatch.setattr(llm, "_cb_is_open", lambda provider: False)
    token = set_workspace_id(WS)
    try:
        out = asyncio.run(llm.llm_text("gpt", "Du bist hilfreich.", "Sag Hallo"))
    finally:
        reset_workspace_id(token)
    assert out == "Hallo!"
    assert len(db.gateway_usage.docs) == 1
    assert db.gateway_usage.docs[0]["source"] == "llm_text"


def test_llm_text_blocks_402_before_calling_provider(db, monkeypatch):
    from app.services import llm

    called = []

    async def _fake_single(provider, model, system, user, extra=None):
        called.append(provider)
        return "Hallo!"

    monkeypatch.setattr(llm, "_llm_single", _fake_single)
    _burn(db, TRIAL_LIMIT)
    token = set_workspace_id(WS)
    try:
        with pytest.raises(HTTPException) as exc:
            asyncio.run(llm.llm_text("gpt", "Du bist hilfreich.", "Sag Hallo"))
    finally:
        reset_workspace_id(token)
    assert exc.value.status_code == 402
    assert called == []  # quota gate fired before any provider call


def test_llm_text_without_workspace_stays_unmetered(db, monkeypatch):
    from app.services import llm

    async def _fake_single(provider, model, system, user, extra=None):
        return "Hallo!"

    monkeypatch.setattr(llm, "_llm_single", _fake_single)
    monkeypatch.setattr(llm, "_cb_is_open", lambda provider: False)
    assert current_workspace_id() is None
    out = asyncio.run(llm.llm_text("gpt", "Du bist hilfreich.", "Sag Hallo"))
    assert out == "Hallo!"
    assert db.gateway_usage.docs == []  # nothing recorded for legacy calls

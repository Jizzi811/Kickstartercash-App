import os
from copy import deepcopy

import pytest

os.environ.setdefault("MONGO_URL", "")

import server  # noqa: E402


def _matches(doc, query):
    for key, value in (query or {}).items():
        if doc.get(key) != value:
            return False
    return True


class _FakeCursor:
    def __init__(self, rows):
        self._rows = list(rows)

    def sort(self, key, direction):
        self._rows.sort(key=lambda item: item.get(key, ""), reverse=direction < 0)
        return self

    async def to_list(self, limit):
        return deepcopy(self._rows[:limit])


class _FakeCollection:
    def __init__(self):
        self.docs = []

    async def find_one(self, query, _projection=None, sort=None):
        rows = [doc for doc in self.docs if _matches(doc, query)]
        if sort:
            key, direction = sort[0]
            rows.sort(key=lambda item: item.get(key, ""), reverse=direction < 0)
        return deepcopy(rows[0]) if rows else None

    async def insert_one(self, doc):
        doc["_id"] = "mongo-object-id"
        self.docs.append(deepcopy(doc))
        return {"ok": 1}

    async def update_one(self, query, update, upsert=False):
        for index, doc in enumerate(self.docs):
            if _matches(doc, query):
                merged = deepcopy(doc)
                for key, value in (update.get("$set") or {}).items():
                    merged[key] = deepcopy(value)
                self.docs[index] = merged
                return {"ok": 1}
        if upsert:
            new_doc = deepcopy(query)
            for key, value in (update.get("$setOnInsert") or {}).items():
                new_doc[key] = deepcopy(value)
            for key, value in (update.get("$set") or {}).items():
                new_doc[key] = deepcopy(value)
            self.docs.append(new_doc)
        return {"ok": 1}

    def find(self, query, _projection=None):
        return _FakeCursor([doc for doc in self.docs if _matches(doc, query)])


class _FakeDB:
    def __init__(self):
        self.founder_profiles = _FakeCollection()
        self.founder_ideas = _FakeCollection()
        self.onboarding_status = _FakeCollection()
        self.brand_decisions = _FakeCollection()
        self.decision_events = _FakeCollection()
        self.brand_briefs = _FakeCollection()


@pytest.mark.anyio
async def test_founder_intake_roundtrip(monkeypatch):
    fake_db = _FakeDB()
    monkeypatch.setattr(server, "db", fake_db)
    user = {"id": "u1"}

    created = await server.founder_intake_create(
        server.FounderIntakePayload(
            vision="Ich baue eine KI-Beratung.",
            motivation="Mehr Wirkung für kleine Teams.",
            target_audience="KMU",
            budget_range="1000-3000",
            values=["klar", "schnell"],
            skills=["sales"],
        ),
        user=user,
        ws="ws1",
    )
    fetched = await server.founder_intake_get(user=user, ws="ws1")

    assert created["vision"] == "Ich baue eine KI-Beratung."
    assert fetched["target_audience"] == "KMU"
    assert fetched["workspace_id"] == "ws1"


@pytest.mark.anyio
async def test_decision_create_lock_and_history(monkeypatch):
    fake_db = _FakeDB()
    monkeypatch.setattr(server, "db", fake_db)
    user = {"id": "u2"}

    decision = await server.decisions_create(
        server.DecisionCreatePayload(
            category="business_idea",
            selected_option="AI Positioning Sprint",
            why_text="Hohe Nachfrage bei B2B Dienstleistern.",
            confidence=81,
        ),
        user=user,
        ws="ws-founder",
    )
    locked = await server.decisions_lock(decision["id"], user=user, ws="ws-founder")
    history = await server.decisions_history(user=user, ws="ws-founder")

    assert locked["status"] == "locked"
    assert "_id" not in decision
    assert len(history["events"]) == 2
    assert history["events"][0]["event_type"] == "DECISION_LOCKED"


@pytest.mark.anyio
async def test_founder_ideas_generation_provider_error_creates_no_fake_ideas(monkeypatch):
    fake_db = _FakeDB()
    monkeypatch.setattr(server, "db", fake_db)
    user = {"id": "u3"}

    async def _broken_llm(*_args, **_kwargs):
        raise RuntimeError("llm offline")

    monkeypatch.setattr(server, "llm_text", _broken_llm)

    with pytest.raises(server.HTTPException) as exc:
        await server.founder_ideas_generate(
            server.FounderIdeasGenerateRequest(focus="AI Services", market_hint="DACH"),
            user=user,
            ws="ws3",
        )

    assert exc.value.status_code == 502
    assert (await server.founder_ideas_list(user=user, ws="ws3"))["ideas"] == []


@pytest.mark.anyio
async def test_brand_brief_generate_uses_decisions(monkeypatch):
    fake_db = _FakeDB()
    monkeypatch.setattr(server, "db", fake_db)
    user = {"id": "u4"}

    await fake_db.founder_profiles.insert_one(
        {"user_id": "u4", "workspace_id": "ws4", "vision": "Eine starke Marke aufbauen."}
    )
    await fake_db.brand_decisions.insert_one(
        {
            "id": "d1",
            "user_id": "u4",
            "workspace_id": "ws4",
            "category": "tone_of_voice",
            "selected_option": "Klar und motivierend",
            "why_text": "Passt zur Zielgruppe",
            "status": "locked",
            "updated_at": "2026-01-01T00:00:00+00:00",
        }
    )

    async def _fake_llm(_model, _system, _prompt):
        return "## Company Summary\nVision steht im Mittelpunkt."

    monkeypatch.setattr(server, "llm_text", _fake_llm)

    brief = await server.brand_brief_generate(server.BrandBriefGenerateRequest(language="DE"), user=user, ws="ws4")
    latest = await server.brand_brief_latest(user=user, ws="ws4")

    assert "Company Summary" in brief["content"]
    assert "_id" not in brief
    assert latest["id"] == brief["id"]
    assert latest["sources"] == ["d1"]

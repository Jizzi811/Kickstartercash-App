import pytest
import server

class FakeCursor:
    def __init__(self, rows): self.rows = rows
    def sort(self, *a, **k): return self
    async def to_list(self, n): return self.rows[:n]

class FakeCollection:
    def __init__(self): self.docs = []
    async def find_one(self, q, proj=None, sort=None):
        for d in self.docs:
            if all(d.get(k) == v for k, v in q.items()): return dict(d)
        return None
    def _find_ref(self, q):
        for d in self.docs:
            if all(d.get(k) == v for k, v in q.items()): return d
        return None
    async def update_one(self, q, update, upsert=False):
        doc = self._find_ref(q) or dict(q)
        if doc not in self.docs: self.docs.append(doc)
        if "$setOnInsert" in update and len(doc) == len(q): doc.update(update["$setOnInsert"])
        if "$set" in update: doc.update(update["$set"])
        if "$push" in update:
            for k,v in update["$push"].items(): doc.setdefault(k, []).append(v)
    async def insert_one(self, d): self.docs.append(dict(d))
    def find(self, q, proj=None): return FakeCursor([d for d in self.docs if all(d.get(k)==v for k,v in q.items())])

class FakeDB:
    def __init__(self):
        self.founder_profiles = FakeCollection(); self.founder_ideas = FakeCollection(); self.onboarding_status = FakeCollection(); self.decision_events = FakeCollection(); self.brand_decisions = FakeCollection()

@pytest.mark.asyncio
async def test_founder_path_validation_and_persistence(monkeypatch):
    monkeypatch.setattr(server, "db", FakeDB())
    user={"id":"u1"}
    for path in ["no_idea", "rough_direction", "concrete_idea"]:
        res = await server.founder_profile_update(server.FounderProfilePayload(founder_path=path), user=user, ws="w1")
        assert res["founder_path"] == path
    with pytest.raises(server.HTTPException):
        await server.founder_profile_update(server.FounderProfilePayload(founder_path="bad"), user=user, ws="w1")

@pytest.mark.asyncio
async def test_provider_error_creates_no_fake_ideas(monkeypatch):
    fdb = FakeDB(); monkeypatch.setattr(server, "db", fdb)
    async def boom(*a, **k): raise RuntimeError("no key")
    monkeypatch.setattr(server, "llm_text", boom)
    await server.founder_profile_update(server.FounderProfilePayload(founder_path="no_idea"), user={"id":"u1"}, ws="w1")
    with pytest.raises(server.HTTPException) as exc:
        await server.founder_ideas_generate(server.FounderIdeasGenerateRequest(), user={"id":"u1"}, ws="w1")
    assert exc.value.status_code == 502
    assert (await server.founder_ideas_list(user={"id":"u1"}, ws="w1"))["ideas"] == []

@pytest.mark.asyncio
async def test_compare_limit_and_single_favorite(monkeypatch):
    fdb = FakeDB(); monkeypatch.setattr(server, "db", fdb)
    user={"id":"u1"}
    for i in range(4):
        await server.founder_idea_create(server.FounderIdeaPayload(founder_path="concrete_idea", title=f"I{i}"), user=user, ws="w1")
    ideas=(await server.founder_ideas_list(user=user, ws="w1"))["ideas"]
    with pytest.raises(server.HTTPException):
        await server.founder_ideas_compare(server.FounderComparePayload(idea_ids=[i["id"] for i in ideas[:4]]), user=user, ws="w1")
    await server.founder_idea_favorite(ideas[0]["id"], user=user, ws="w1")
    await server.founder_idea_favorite(ideas[1]["id"], user=user, ws="w1")
    ideas=(await server.founder_ideas_list(user=user, ws="w1"))["ideas"]
    assert sum(1 for i in ideas if i.get("favorite")) == 1
    assert sum(1 for i in ideas if i.get("user_confirmed")) == 2

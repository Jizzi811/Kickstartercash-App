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
        row = deepcopy(doc)
        row["_id"] = "mongo-id"
        self.docs.append(row)
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
            new_doc["_id"] = "mongo-id"
            self.docs.append(new_doc)
        return {"ok": 1}

    def find(self, query, _projection=None):
        return _FakeCursor([doc for doc in self.docs if _matches(doc, query)])


class _FakeDB:
    def __init__(self):
        self.social_connections = _FakeCollection()
        self.publish_jobs = _FakeCollection()
        self.planner_tasks = _FakeCollection()
        self.founder_workflow_runs = _FakeCollection()


@pytest.mark.anyio
async def test_social_connection_and_publish_job_flow(monkeypatch):
    fake_db = _FakeDB()
    monkeypatch.setattr(server, "db", fake_db)
    user = {"id": "ops-user"}

    conn = await server.social_connections_upsert(
        server.SocialConnectionPayload(platform="LinkedIn", account_handle="@founder"),
        user=user,
        ws="ws-ops",
    )
    assert conn["platform"] == "LinkedIn"
    listed = await server.social_connections_list(user=user, ws="ws-ops")
    assert len(listed["connections"]) == 1

    job = await server.social_publish_jobs_create(
        server.PublishJobPayload(platform="LinkedIn", content="Launch post"),
        user=user,
        ws="ws-ops",
    )
    assert "_id" not in job
    dispatched = await server.social_publish_job_dispatch(job["id"], user=user, ws="ws-ops")
    assert dispatched["status"] == "published"


@pytest.mark.anyio
async def test_planner_board_create_and_update(monkeypatch):
    fake_db = _FakeDB()
    monkeypatch.setattr(server, "db", fake_db)
    user = {"id": "planner-user"}

    task = await server.planner_task_create(
        server.PlannerTaskPayload(title="Draft launch plan", column="launch"),
        user=user,
        ws="ws-plan",
    )
    updated = await server.planner_task_update(
        task["id"],
        server.PlannerTaskUpdatePayload(column="growth", priority="high", status="in_progress"),
        user=user,
        ws="ws-plan",
    )
    board = await server.planner_board(user=user, ws="ws-plan")

    assert updated["column"] == "growth"
    assert any(item["id"] == task["id"] for item in board["tasks_by_column"]["growth"])


@pytest.mark.anyio
async def test_founder_workflow_template_run_creates_tasks_and_jobs(monkeypatch):
    fake_db = _FakeDB()
    monkeypatch.setattr(server, "db", fake_db)
    user = {"id": "wf-user"}

    templates = await server.founder_workflow_templates()
    assert len(templates["templates"]) >= 3

    run_result = await server.founder_workflow_run("founder-30-day-launch", user=user, ws="wf-ws")
    assert run_result["run"]["template_id"] == "founder-30-day-launch"
    assert len(run_result["created_tasks"]) == 3
    jobs = await server.social_publish_jobs_list(user=user, ws="wf-ws")
    assert len(jobs["jobs"]) >= 1

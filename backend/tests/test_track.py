"""Tests for the self-hosted product-event endpoint (POST /api/track)."""
import asyncio
import os

import pytest
from fastapi import HTTPException

os.environ.setdefault("MONGO_URL", "")

import server  # noqa: E402
from tests.test_identity import _FakeDB  # noqa: E402


def test_track_rejects_bad_event_names(monkeypatch):
    monkeypatch.setattr(server, "db", _FakeDB())
    for bad in ("Bad Name!", "", "UPPER", "x" * 65):
        with pytest.raises(HTTPException) as exc:
            asyncio.run(server.track_event(
                server.TrackEventPayload(event=bad), {"id": "u1"}, None))
        assert exc.value.status_code == 422


def test_track_writes_clamped_event(monkeypatch):
    fake = _FakeDB()
    monkeypatch.setattr(server, "db", fake)
    payload = server.TrackEventPayload(
        event="onboarding_path_selected",
        props={"path": "founder", "long": "x" * 500, "count": 3, "flag": True},
    )
    out = asyncio.run(server.track_event(payload, {"id": "u1"}, "ws-1"))
    assert out == {"ok": True}
    assert len(fake.product_events.docs) == 1
    doc = fake.product_events.docs[0]
    assert doc["event"] == "onboarding_path_selected"
    assert doc["user_id"] == "u1" and doc["workspace_id"] == "ws-1"
    assert doc["props"]["path"] == "founder"
    assert len(doc["props"]["long"]) == 200  # string props are clamped
    assert doc["props"]["count"] == 3 and doc["props"]["flag"] is True
    assert doc["created_at"]


def test_track_caps_prop_count(monkeypatch):
    fake = _FakeDB()
    monkeypatch.setattr(server, "db", fake)
    payload = server.TrackEventPayload(
        event="stress_test", props={f"k{i}": i for i in range(50)})
    asyncio.run(server.track_event(payload, {"id": "u1"}, None))
    assert len(fake.product_events.docs[0]["props"]) == 20

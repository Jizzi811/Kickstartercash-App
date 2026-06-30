"""Tests for the Guardian (Brand Guardian + Marketing Score) feature.

Covers POST /api/analyze/content, history persistence with type=analysis,
and the export filter behaviour via /api/history?type=analysis.
"""
import os
import pytest
import requests
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parents[2] / "frontend" / ".env")
BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
DEFAULT_BRAND_ID = "kickstartercash"

SAMPLE_CONTENT = (
    "TEST_Guardian Exklusives Membership-Programm fuer ambitionierte Unternehmer. "
    "Werde Teil unserer Kickstartercash.Club Community und sichere dir den Zugang zu "
    "Premium-Tools, persoenlichem Coaching und einem inspirierenden Netzwerk."
)


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


class TestAnalyzeContent:
    created_id = None

    # --- happy path ---
    def test_analyze_content_returns_full_shape(self, session):
        payload = {
            "content": SAMPLE_CONTENT,
            "content_type": "Text",
            "brand_id": DEFAULT_BRAND_ID,
            "model": "claude",
            "language": "DE",
        }
        r = session.post(f"{API}/analyze/content", json=payload, timeout=120)
        assert r.status_code == 200, r.text
        data = r.json()

        # Required fields
        for key in (
            "id", "type", "score", "verdict", "tone_match", "brand_match",
            "checks", "improvements", "strengths", "created_at",
        ):
            assert key in data, f"missing field: {key}"

        assert data["type"] == "analysis"
        assert isinstance(data["id"], str) and len(data["id"]) > 0
        # numeric fields
        assert isinstance(data["score"], (int, float))
        assert 0 <= data["score"] <= 100
        assert 0 <= data["brand_match"] <= 100
        assert 0 <= data["tone_match"] <= 100
        # lists
        assert isinstance(data["checks"], list) and len(data["checks"]) >= 1
        assert isinstance(data["improvements"], list)
        assert isinstance(data["strengths"], list)
        # each check has the right shape and a valid status value
        for c in data["checks"]:
            assert "label" in c and "status" in c
            assert c["status"] in ("pass", "warn", "fail")

        # Mongo _id must not leak
        assert "_id" not in data
        TestAnalyzeContent.created_id = data["id"]

    # --- persistence: appears in history with type=analysis ---
    def test_analysis_persisted_in_history(self, session):
        assert TestAnalyzeContent.created_id, "previous test must create an id"
        r = session.get(f"{API}/history", params={"type": "analysis", "limit": 20}, timeout=15)
        assert r.status_code == 200
        items = r.json()
        ids = [i.get("id") for i in items]
        assert TestAnalyzeContent.created_id in ids
        # every returned item is type analysis
        for it in items:
            assert it["type"] == "analysis"
            assert "_id" not in it

    # --- English language path ---
    def test_analyze_content_en(self, session):
        payload = {
            "content": "TEST_EN Premium membership launch with exclusive benefits.",
            "content_type": "Text",
            "brand_id": DEFAULT_BRAND_ID,
            "model": "claude",
            "language": "EN",
        }
        r = session.post(f"{API}/analyze/content", json=payload, timeout=120)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["type"] == "analysis"
        assert 0 <= data["score"] <= 100

    # --- validation: missing content field -> 422 ---
    def test_analyze_missing_content_returns_422(self, session):
        r = session.post(
            f"{API}/analyze/content",
            json={"brand_id": DEFAULT_BRAND_ID, "model": "claude", "language": "DE"},
            timeout=15,
        )
        assert r.status_code == 422

    # --- unknown brand -> 404 ---
    def test_analyze_unknown_brand_returns_404(self, session):
        r = session.post(
            f"{API}/analyze/content",
            json={
                "content": "TEST_unknown_brand",
                "brand_id": "does-not-exist-xyz",
                "model": "claude",
                "language": "DE",
            },
            timeout=15,
        )
        assert r.status_code == 404

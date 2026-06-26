"""Tests for new endpoints: campaign, calendar, landingpage, history filter+delete."""
import os
import pytest
import requests
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parents[2] / "frontend" / ".env")
BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
DEFAULT_BRAND_ID = "kickstartercash"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


class TestCampaign:
    created_id = None

    def test_generate_campaign(self, session):
        payload = {
            "topic": "TEST_Campaign luxury membership launch",
            "platforms": ["Instagram", "LinkedIn"],
            "brand_id": DEFAULT_BRAND_ID,
            "model": "claude",
            "language": "EN",
            "apply_logo": False,
            "image_style": "Luxuriös",
        }
        r = session.post(f"{API}/generate/campaign", json=payload, timeout=240)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["type"] == "campaign"
        assert isinstance(data.get("posts"), list) and len(data["posts"]) >= 1
        assert isinstance(data.get("copy"), dict)
        assert data["copy"].get("body")
        # image may be None on rare flake, but typically present
        if data.get("image"):
            assert data["image"].startswith("data:image")
        TestCampaign.created_id = data["id"]

    def test_campaign_in_history(self, session):
        r = session.get(f"{API}/history", params={"type": "campaign", "limit": 5}, timeout=15)
        assert r.status_code == 200
        ids = [x.get("id") for x in r.json()]
        assert TestCampaign.created_id in ids


class TestCalendar:
    created_id = None

    def test_generate_calendar_30(self, session):
        payload = {
            "topic": "TEST_Calendar premium daily content",
            "days": 30,
            "platforms": ["Instagram", "Facebook"],
            "brand_id": DEFAULT_BRAND_ID,
            "model": "claude",
            "language": "EN",
        }
        r = session.post(f"{API}/generate/calendar", json=payload, timeout=180)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["type"] == "calendar"
        assert data["days"] == 30
        assert isinstance(data.get("items"), list)
        assert len(data["items"]) >= 5  # expect ~15 but at least several
        item = data["items"][0]
        assert "day" in item and "platform" in item and "title" in item
        TestCalendar.created_id = data["id"]


class TestLandingpage:
    created_id = None

    def test_generate_landingpage(self, session):
        payload = {
            "topic": "TEST_LP elite mastermind program",
            "brand_id": DEFAULT_BRAND_ID,
            "model": "claude",
            "language": "EN",
        }
        r = session.post(f"{API}/generate/landingpage", json=payload, timeout=180)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["type"] == "landingpage"
        c = data.get("content") or {}
        assert c.get("headline")
        assert c.get("cta")
        assert isinstance(c.get("benefits", []), list) and len(c["benefits"]) >= 1
        TestLandingpage.created_id = data["id"]


class TestHistoryFilterDelete:
    def test_history_all(self, session):
        r = session.get(f"{API}/history", params={"limit": 100}, timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_history_filter_landingpage(self, session):
        r = session.get(f"{API}/history", params={"type": "landingpage"}, timeout=15)
        assert r.status_code == 200
        for it in r.json():
            assert it["type"] == "landingpage"

    def test_delete_history_item(self, session):
        # Create our own item to avoid cross-class ordering issues with pytest-xdist
        payload = {"topic": "TEST_delete_me", "format": "Email",
                   "brand_id": DEFAULT_BRAND_ID, "model": "claude", "language": "EN"}
        cr = session.post(f"{API}/generate/copy", json=payload, timeout=120)
        assert cr.status_code == 200
        cid = cr.json()["id"]
        r = session.delete(f"{API}/history/{cid}", timeout=15)
        assert r.status_code == 200
        r2 = session.get(f"{API}/history", params={"type": "copy", "limit": 100}, timeout=15)
        ids = [x.get("id") for x in r2.json()]
        assert cid not in ids

    def test_delete_unknown_returns_ok(self, session):
        # endpoint is idempotent; should not 500
        r = session.delete(f"{API}/history/nonexistent_xyz", timeout=15)
        assert r.status_code in (200, 204)

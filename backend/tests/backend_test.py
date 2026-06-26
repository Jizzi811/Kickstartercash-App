"""Backend API tests for Kickstarter Content Maschine."""
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


# ---------- Health ----------
def test_root(session):
    r = session.get(f"{API}/", timeout=15)
    assert r.status_code == 200
    assert "message" in r.json()


# ---------- Brand CRUD ----------
class TestBrands:
    created_id = None

    def test_list_brands_has_default(self, session):
        r = session.get(f"{API}/brands", timeout=15)
        assert r.status_code == 200
        brands = r.json()
        assert isinstance(brands, list) and len(brands) >= 1
        default = next((b for b in brands if b["id"] == DEFAULT_BRAND_ID), None)
        assert default is not None
        assert default["is_default"] is True
        assert default["name"] == "KickstarterCash.club"

    def test_get_default_brand(self, session):
        r = session.get(f"{API}/brands/{DEFAULT_BRAND_ID}", timeout=15)
        assert r.status_code == 200
        assert r.json()["id"] == DEFAULT_BRAND_ID

    def test_get_unknown_brand_returns_404(self, session):
        r = session.get(f"{API}/brands/nonexistent_xyz", timeout=15)
        assert r.status_code == 404

    def test_create_brand_and_persist(self, session):
        payload = {
            "name": "TEST_Brand_QA",
            "slogan": "Test brand for QA",
            "primary_color": "#FF0000",
            "tone": "Friendly",
        }
        r = session.post(f"{API}/brands", json=payload, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == payload["name"]
        assert data["slogan"] == payload["slogan"]
        assert data["primary_color"] == "#FF0000"
        assert "id" in data and data["is_default"] is False
        TestBrands.created_id = data["id"]

        # Verify persistence
        r2 = session.get(f"{API}/brands/{TestBrands.created_id}", timeout=15)
        assert r2.status_code == 200
        assert r2.json()["name"] == payload["name"]

    def test_update_brand(self, session):
        assert TestBrands.created_id
        update = {"name": "TEST_Brand_QA_Updated", "tone": "Bold", "primary_color": "#00FF00"}
        r = session.put(f"{API}/brands/{TestBrands.created_id}", json=update, timeout=15)
        assert r.status_code == 200
        assert r.json()["name"] == "TEST_Brand_QA_Updated"
        # verify
        r2 = session.get(f"{API}/brands/{TestBrands.created_id}", timeout=15)
        assert r2.json()["name"] == "TEST_Brand_QA_Updated"
        assert r2.json()["primary_color"] == "#00FF00"

    def test_cannot_delete_default_brand(self, session):
        r = session.delete(f"{API}/brands/{DEFAULT_BRAND_ID}", timeout=15)
        assert r.status_code == 400

    def test_delete_created_brand(self, session):
        assert TestBrands.created_id
        r = session.delete(f"{API}/brands/{TestBrands.created_id}", timeout=15)
        assert r.status_code == 200
        # verify removal
        r2 = session.get(f"{API}/brands/{TestBrands.created_id}", timeout=15)
        assert r2.status_code == 404


# ---------- Prompt library ----------
class TestPrompts:
    def test_get_all_prompts(self, session):
        r = session.get(f"{API}/prompts", timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert "categories" in body and "prompts" in body
        assert len(body["prompts"]) >= 10
        assert "Marketing" in body["categories"]

    def test_filter_by_category(self, session):
        r = session.get(f"{API}/prompts", params={"category": "Marketing"}, timeout=15)
        assert r.status_code == 200
        items = r.json()["prompts"]
        assert all(p["category"] == "Marketing" for p in items)

    def test_search_query(self, session):
        r = session.get(f"{API}/prompts", params={"q": "Slogan"}, timeout=15)
        assert r.status_code == 200
        items = r.json()["prompts"]
        assert len(items) >= 1
        assert any("slogan" in p["title_de"].lower() or "slogan" in p["title_en"].lower() for p in items)


# ---------- Generation (LLM) ----------
class TestGeneration:
    def test_generate_copy_claude(self, session):
        payload = {"topic": "Premium membership benefits", "format": "Instagram Caption",
                   "brand_id": DEFAULT_BRAND_ID, "model": "claude", "language": "EN"}
        r = session.post(f"{API}/generate/copy", json=payload, timeout=120)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["type"] == "copy"
        assert isinstance(data.get("body", ""), str) and len(data["body"]) > 5
        assert "id" in data

    def test_generate_social_multi_platform(self, session):
        payload = {"topic": "Launch of luxury membership",
                   "platforms": ["Instagram", "LinkedIn"],
                   "brand_id": DEFAULT_BRAND_ID, "model": "claude", "language": "EN"}
        r = session.post(f"{API}/generate/social", json=payload, timeout=120)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["type"] == "social"
        assert isinstance(data.get("posts"), list)
        assert len(data["posts"]) >= 1
        first = data["posts"][0]
        assert "caption" in first

    def test_generate_image(self, session):
        payload = {"prompt": "Golden Dubai skyline at dusk, marketing hero",
                   "style": "Luxuriös", "brand_id": DEFAULT_BRAND_ID,
                   "language": "EN", "apply_logo": False}
        r = session.post(f"{API}/generate/image", json=payload, timeout=180)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["type"] == "image"
        assert data.get("image", "").startswith("data:image")

    def test_generate_with_unknown_brand_404(self, session):
        payload = {"topic": "x", "format": "Email", "brand_id": "ghost_brand_999",
                   "model": "claude", "language": "EN"}
        r = session.post(f"{API}/generate/copy", json=payload, timeout=30)
        assert r.status_code == 404

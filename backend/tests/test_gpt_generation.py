"""Regression test: new-brand + GPT generation flows.

Validates the fix where 'gpt' model now uses user's OWN OpenAI key
instead of the exhausted Emergent universal key.
"""
import os
import uuid
import requests
import pytest

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/') if 'REACT_APP_BACKEND_URL' in os.environ else None
if not BASE_URL:
    # fall back to frontend .env
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL'):
                BASE_URL = line.split('=', 1)[1].strip().rstrip('/')
                break

API = f"{BASE_URL}/api"
TIMEOUT = 120


@pytest.fixture(scope="module")
def new_brand():
    """Create a brand-new brand (the exact bug scenario)."""
    payload = {
        "name": f"TEST_Tierarztpraxis_{uuid.uuid4().hex[:6]}",
        "slogan": "Tiermedizin auf höchstem Niveau",
        "tone": "Vertrauensvoll, einfühlsam, professionell",
        "image_style": "Modern, hell, freundlich, mit Tieren",
    }
    r = requests.post(f"{API}/brands", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, f"Brand create failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["name"] == payload["name"]
    assert data["tone"] == payload["tone"]
    assert "id" in data
    yield data
    # cleanup
    try:
        requests.delete(f"{API}/brands/{data['id']}", timeout=30)
    except Exception:
        pass


def test_brand_appears_in_list(new_brand):
    r = requests.get(f"{API}/brands", timeout=30)
    assert r.status_code == 200
    ids = [b["id"] for b in r.json()]
    assert new_brand["id"] in ids


def test_landingpage_gpt_with_new_brand(new_brand):
    """PRIMARY BUG: landing page generation must succeed with new brand + gpt."""
    payload = {
        "topic": "Tierarztpraxis für Hunde und Katzen",
        "brand_id": new_brand["id"],
        "model": "gpt",
        "language": "DE",
    }
    r = requests.post(f"{API}/generate/landingpage", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, f"Landingpage failed: {r.status_code} {r.text[:500]}"
    data = r.json()
    assert data["type"] == "landingpage"
    assert data["brand_id"] == new_brand["id"]
    content = data.get("content", {})
    # Must contain core sections
    assert content.get("headline"), f"Missing headline in: {content}"
    assert content.get("subtitle"), "Missing subtitle"
    assert isinstance(content.get("benefits"), list) and len(content["benefits"]) > 0, "Missing benefits"
    assert isinstance(content.get("faq"), list) and len(content["faq"]) > 0, "Missing FAQ"
    assert content.get("pricing"), "Missing pricing"
    assert content.get("seo"), "Missing SEO"


def test_copy_gpt_with_new_brand(new_brand):
    payload = {
        "topic": "Premium Hundeernährung",
        "format": "Werbetext",
        "brand_id": new_brand["id"],
        "model": "gpt",
        "language": "DE",
    }
    r = requests.post(f"{API}/generate/copy", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, f"Copy failed: {r.status_code} {r.text[:500]}"
    data = r.json()
    assert data["type"] == "copy"
    assert data["brand_id"] == new_brand["id"]
    assert data.get("title") or data.get("body"), "Copy result empty"


def test_social_gpt_with_new_brand(new_brand):
    payload = {
        "topic": "Impfaktion für Welpen im Frühling",
        "platforms": ["Instagram", "Facebook"],
        "brand_id": new_brand["id"],
        "model": "gpt",
        "language": "DE",
    }
    r = requests.post(f"{API}/generate/social", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, f"Social failed: {r.status_code} {r.text[:500]}"
    data = r.json()
    assert data["type"] == "social"
    posts = data.get("posts", [])
    assert isinstance(posts, list) and len(posts) >= 1, f"No posts generated: {data}"
    # At least one post should have caption
    assert any(p.get("caption") for p in posts)

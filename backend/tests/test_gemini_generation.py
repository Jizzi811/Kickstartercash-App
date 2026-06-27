"""Gemini text-model generation tests.

Verifies that the new Gemini 2.5 Flash model option works for copy,
landing page, and social generation, routed through the user's own
GEMINI_API_KEY. Also covers a regression check that GPT-5.2 still works.
"""
import os
import uuid
import requests
import pytest

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL'):
                BASE_URL = line.split('=', 1)[1].strip().rstrip('/')
                break

API = f"{BASE_URL}/api"
TIMEOUT = 180


@pytest.fixture(scope="module")
def new_brand():
    """Create a fresh test brand via the API."""
    payload = {
        "name": f"TEST_GeminiBrand_{uuid.uuid4().hex[:6]}",
        "slogan": "AI-powered marketing excellence",
        "tone": "Premium, exklusiv, selbstbewusst",
        "image_style": "Luxuriös, schwarz-gold, cinematisch",
    }
    r = requests.post(f"{API}/brands", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, f"Brand create failed: {r.status_code} {r.text}"
    data = r.json()
    assert "id" in data
    yield data
    try:
        requests.delete(f"{API}/brands/{data['id']}", timeout=30)
    except Exception:
        pass


# --- Gemini text generation flows ----------------------------------------
def test_copy_gemini(new_brand):
    payload = {
        "topic": "Luxus-Membership für Unternehmer",
        "format": "Werbetext",
        "brand_id": new_brand["id"],
        "model": "gemini",
        "language": "DE",
    }
    r = requests.post(f"{API}/generate/copy", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, f"Copy failed: {r.status_code} {r.text[:500]}"
    data = r.json()
    assert data["type"] == "copy"
    assert data["brand_id"] == new_brand["id"]
    assert data.get("title") or data.get("body"), "Copy result empty"


def test_landingpage_gemini(new_brand):
    payload = {
        "topic": "Exklusives Mentoring Programm",
        "brand_id": new_brand["id"],
        "model": "gemini",
        "language": "DE",
    }
    r = requests.post(f"{API}/generate/landingpage", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, f"Landingpage failed: {r.status_code} {r.text[:500]}"
    data = r.json()
    assert data["type"] == "landingpage"
    content = data.get("content", {})
    assert content.get("headline"), f"Missing headline. content={content}"
    assert isinstance(content.get("benefits"), list) and len(content["benefits"]) > 0
    assert isinstance(content.get("faq"), list) and len(content["faq"]) > 0
    assert content.get("pricing"), "Missing pricing"
    assert content.get("seo"), "Missing SEO"


def test_social_gemini(new_brand):
    payload = {
        "topic": "Frühlings-Promo: Premium Onboarding",
        "platforms": ["Instagram", "Facebook"],
        "brand_id": new_brand["id"],
        "model": "gemini",
        "language": "DE",
    }
    r = requests.post(f"{API}/generate/social", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, f"Social failed: {r.status_code} {r.text[:500]}"
    data = r.json()
    assert data["type"] == "social"
    posts = data.get("posts", [])
    assert isinstance(posts, list) and len(posts) >= 1, f"No posts: {data}"
    assert any(p.get("caption") for p in posts)


# --- GPT regression ------------------------------------------------------
def test_copy_gpt_regression(new_brand):
    payload = {
        "topic": "Exklusives Premium-Coaching",
        "format": "Werbetext",
        "brand_id": new_brand["id"],
        "model": "gpt",
        "language": "DE",
    }
    r = requests.post(f"{API}/generate/copy", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, f"GPT copy failed: {r.status_code} {r.text[:500]}"
    data = r.json()
    assert data["type"] == "copy"
    assert data.get("title") or data.get("body"), "GPT copy result empty"

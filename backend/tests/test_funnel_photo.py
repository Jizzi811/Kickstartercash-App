"""Backend tests for funnel photo upload feature & error suppression injection."""
import os
import re
import base64
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://kc-marketing-hub.preview.emergentagent.com").rstrip("/")

# 1x1 transparent PNG base64 (data URL)
TINY_PNG = (
    "data:image/png;base64,"
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Z8m3pAAAAAASUVORK5CYII="
)


@pytest.fixture(scope="module")
def funnel_payload():
    return {
        "reflink": "https://portal.kickstartercash.club/?ref=QA",
        "name": "QA Berater",
        "email": "qa@example.com",
        "phone": "+49 170 1234567",
        "whatsapp": "491701234567",
        "photo": TINY_PNG,
    }


@pytest.fixture(scope="module")
def created_funnel(funnel_payload):
    r = requests.post(f"{BASE_URL}/api/funnel", json=funnel_payload, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["photo"] == TINY_PNG
    assert data["name"] == "QA Berater"
    assert data["email"] == "qa@example.com"
    assert "id" in data and isinstance(data["id"], str)
    yield data
    # teardown
    requests.delete(f"{BASE_URL}/api/funnel/{data['id']}", timeout=15)


def test_create_funnel_with_photo_persists(created_funnel):
    fid = created_funnel["id"]
    r = requests.get(f"{BASE_URL}/api/funnel/{fid}", timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert d["photo"] == TINY_PNG
    assert d["reflink"].endswith("ref=QA")


def test_update_funnel_keeps_photo(created_funnel):
    fid = created_funnel["id"]
    payload = {k: v for k, v in created_funnel.items() if k not in ("id", "created_at")}
    payload["role"] = "Senior Berater"
    r = requests.put(f"{BASE_URL}/api/funnel/{fid}", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["photo"] == TINY_PNG
    assert d["role"] == "Senior Berater"


def test_funnel_page_renders_with_photo_and_suppressor(created_funnel):
    fid = created_funnel["id"]
    r = requests.get(f"{BASE_URL}/api/funnel/{fid}/page", timeout=60)
    assert r.status_code == 200
    assert "text/html" in r.headers.get("content-type", "")
    html = r.text

    # Photo injected as <img alt="Berater" ...> in template
    # The bundle JSON-encodes the template, so look for the alt attribute escaped or raw
    assert ('alt="Berater"' in html) or ('alt=\\"Berater\\"' in html), "Berater <img> not injected"
    # And the base64 photo bytes should appear somewhere
    assert "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQ" in html

    # Error suppressor styles + script must be present
    assert "__bundler_err" in html
    assert "window.addEventListener('error'" in html
    assert "console.error" in html
    # Suppressor must be injected directly after the FIRST <head> (early)
    head_idx = html.find("<head>")
    suppressor_idx = html.find("__bundler_err")
    assert head_idx != -1 and suppressor_idx != -1 and suppressor_idx - head_idx < 1500, (
        f"Suppressor not early enough (head={head_idx}, supp={suppressor_idx})"
    )


def test_funnel_page_personalization(created_funnel):
    fid = created_funnel["id"]
    r = requests.get(f"{BASE_URL}/api/funnel/{fid}/page", timeout=60)
    assert r.status_code == 200
    html = r.text
    # reflink and sponsor name should be embedded in data props
    assert "ref=QA" in html
    assert "QA Berater" in html
    assert "qa@example.com" in html


def test_lead_submission_persists_even_without_resend(created_funnel):
    fid = created_funnel["id"]
    lead = {
        "vorname": "TEST_Lisa",
        "nachname": "Mustermann",
        "email": "TEST_lead@example.com",
        "telefon": "+49 170 99999",
        "land": "DE",
        "nachricht": "Bitte zurückrufen",
    }
    r = requests.post(f"{BASE_URL}/api/funnel/{fid}/lead", json=lead, timeout=20)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    # Verify persisted via GET /leads
    r2 = requests.get(f"{BASE_URL}/api/funnel/{fid}/leads", timeout=15)
    assert r2.status_code == 200
    leads = r2.json()
    assert any(l.get("email") == "TEST_lead@example.com" and l.get("vorname") == "TEST_Lisa" for l in leads), leads


def test_funnel_appears_in_list(created_funnel):
    r = requests.get(f"{BASE_URL}/api/funnel", timeout=15)
    assert r.status_code == 200
    ids = [f["id"] for f in r.json()]
    assert created_funnel["id"] in ids

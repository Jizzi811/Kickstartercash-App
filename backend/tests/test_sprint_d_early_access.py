import pytest

from app.services import early_access


def test_valid_request_normalizes_and_sets_server_fields():
    doc = early_access.validate_request({
        "name": "  Ada Lovelace  ",
        "email": " ADA@Example.COM ",
        "audience_status": "founding",
        "marketing_challenge": "  bessere Positionierung  ",
        "privacy_consent": True,
        "locale": "EN",
        "source": "landing_page",
    })
    assert doc["name"] == "Ada Lovelace"
    assert doc["normalized_email"] == "ada@example.com"
    assert doc["display_email"] == "ADA@Example.COM"
    assert doc["privacy_consent_at"]
    assert doc["created_at"] == doc["updated_at"]
    assert doc["request_status"] == "new"


@pytest.mark.parametrize("email", ["", "invalid", "a@b", "a b@example.com"])
def test_invalid_email_rejected(email):
    with pytest.raises(ValueError, match="email|required"):
        early_access.validate_request({"name": "Ada", "email": email, "audience_status": "founding", "marketing_challenge": "x", "privacy_consent": True})


def test_unknown_status_rejected():
    with pytest.raises(ValueError, match="audience_status"):
        early_access.validate_request({"name": "Ada", "email": "a@example.com", "audience_status": "student", "marketing_challenge": "x", "privacy_consent": True})


def test_missing_privacy_consent_rejected():
    with pytest.raises(ValueError, match="privacy_consent"):
        early_access.validate_request({"name": "Ada", "email": "a@example.com", "audience_status": "founding", "marketing_challenge": "x", "privacy_consent": False})


def test_empty_required_fields_rejected():
    with pytest.raises(ValueError, match="required"):
        early_access.validate_request({"name": " ", "email": "a@example.com", "audience_status": "founding", "marketing_challenge": "x", "privacy_consent": True})


def test_long_text_rejected():
    with pytest.raises(ValueError, match="too_long"):
        early_access.validate_request({"name": "Ada", "email": "a@example.com", "audience_status": "founding", "marketing_challenge": "x" * 1201, "privacy_consent": True})


def test_neutral_duplicate_response_supported():
    response = early_access.neutral_success(True, "DE")
    assert response["success"] is True
    assert response["already_registered"] is True
    assert "Danke" in response["message"]


def test_public_post_route_exists_and_admin_routes_are_not_public():
    source = open("server.py", encoding="utf-8").read()
    assert '@api_router.post("/early-access")' in source
    assert 'Depends(_authed_user)' in source[source.index('@api_router.get("/early-access/requests")'):source.index('@api_router.patch("/early-access/requests/{request_id}")')]
    assert 'Depends(_authed_user)' in source[source.index('@api_router.get("/early-access/export.csv")'):source.index('async def early_access_export') + 200]


def test_csv_injection_is_prevented():
    assert early_access.csv_safe("=cmd") == "'=cmd"
    assert early_access.csv_safe("+sum") == "'+sum"
    assert early_access.csv_safe("-10") == "'-10"
    assert early_access.csv_safe("@user") == "'@user"

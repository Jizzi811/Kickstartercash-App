"""Early-access request validation and export helpers."""
from __future__ import annotations

import csv
import io
import re
import uuid
from datetime import datetime, timezone
from typing import Any

AUDIENCE_STATUSES = {"founding", "self_employed", "company", "agency"}
REQUEST_STATUSES = {"new", "contacted", "invited", "archived"}
SOURCES = {"landing_page"}
LOCALES = {"DE", "EN"}
MAX_NAME = 120
MAX_COMPANY = 160
MAX_CHALLENGE = 1200
_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def _clean(value: str | None, max_len: int) -> str:
    value = (value or "").strip()
    if len(value) > max_len:
        raise ValueError("too_long")
    return value


def validate_request(payload: Any) -> dict[str, Any]:
    data = payload if isinstance(payload, dict) else payload.model_dump()
    name = _clean(data.get("name"), MAX_NAME)
    display_email = _clean(data.get("email") or data.get("display_email"), 254)
    normalized_email = normalize_email(display_email)
    company = _clean(data.get("company_or_project"), MAX_COMPANY)
    challenge = _clean(data.get("marketing_challenge"), MAX_CHALLENGE)
    audience_status = (data.get("audience_status") or "").strip()
    locale = (data.get("locale") or "DE").strip().upper()
    source = (data.get("source") or "landing_page").strip()
    privacy_consent = bool(data.get("privacy_consent"))
    honeypot = (data.get("website") or data.get("honeypot") or "").strip()

    if honeypot:
        raise ValueError("spam")
    if not name or not display_email or not challenge:
        raise ValueError("required")
    if not _EMAIL_RE.match(normalized_email):
        raise ValueError("email")
    if audience_status not in AUDIENCE_STATUSES:
        raise ValueError("audience_status")
    if not privacy_consent:
        raise ValueError("privacy_consent")
    if locale not in LOCALES:
        locale = "DE"
    if source not in SOURCES:
        raise ValueError("source")

    ts = now_iso()
    return {
        "id": str(uuid.uuid4()),
        "name": name,
        "normalized_email": normalized_email,
        "display_email": display_email.strip(),
        "company_or_project": company,
        "audience_status": audience_status,
        "marketing_challenge": challenge,
        "privacy_consent": True,
        "privacy_consent_at": ts,
        "locale": locale,
        "source": source,
        "created_at": ts,
        "updated_at": ts,
        "request_status": "new",
    }


def neutral_success(already_registered: bool = False, locale: str = "DE") -> dict[str, Any]:
    message = (
        "Danke. Wenn die Anfrage passt, melden wir uns mit den nächsten Schritten."
        if locale == "DE"
        else "Thank you. If the request is a fit, we will follow up with next steps."
    )
    return {"success": True, "message": message, "already_registered": already_registered}


def csv_safe(value: Any) -> str:
    text = "" if value is None else str(value)
    if text.startswith(("=", "+", "-", "@")):
        return "'" + text
    return text


EXPORT_COLUMNS = [
    "id", "name", "display_email", "company_or_project", "audience_status",
    "marketing_challenge", "privacy_consent_at", "locale", "source",
    "created_at", "updated_at", "request_status",
]


def render_csv(rows: list[dict[str, Any]]) -> str:
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=EXPORT_COLUMNS, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow({col: csv_safe(row.get(col, "")) for col in EXPORT_COLUMNS})
    return buf.getvalue()

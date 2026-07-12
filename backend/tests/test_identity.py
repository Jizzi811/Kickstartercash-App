"""Auth + workspace-context tests for the brandmind identity path.

Covers the Step-02 rubric from the blueprint playbook: register creates
user + default workspace + membership, duplicate email is a 409, bad/expired/
tampered tokens are 401s, foreign workspaces are 403s, /workspaces/current
returns plan + quota, and login attempts are rate-limited.

Runs fully offline against a tiny in-memory Mongo fake.
"""
import asyncio
import hashlib
import hmac
import json
import os
from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

os.environ.setdefault("MONGO_URL", "")

import brandmind  # noqa: E402
from brandmind import (  # noqa: E402
    LoginRequest, RegisterRequest,
    _b64url, current_user, login, register, workspace_current,
)


# ---------------------------------------------------------------------------
# In-memory Mongo fake (equality queries + $set updates are all these paths use)
# ---------------------------------------------------------------------------
class _Cursor:
    def __init__(self, docs):
        self._docs = docs

    async def to_list(self, n):
        return self._docs[:n]


class _Coll:
    def __init__(self):
        self.docs = []

    @staticmethod
    def _project(doc, proj):
        out = dict(doc)
        for key, keep in (proj or {}).items():
            if keep == 0:
                out.pop(key, None)
        return out

    def _matches(self, doc, query):
        return all(doc.get(k) == v for k, v in query.items())

    async def find_one(self, query, proj=None):
        for d in self.docs:
            if self._matches(d, query):
                return self._project(d, proj)
        return None

    async def insert_one(self, doc):
        self.docs.append(dict(doc))

    async def update_one(self, query, update, upsert=False):
        for d in self.docs:
            if self._matches(d, query):
                d.update(update.get("$set", {}))
                return
        if upsert:
            merged = dict(query)
            merged.update(update.get("$set", {}))
            self.docs.append(merged)

    def find(self, query, proj=None):
        return _Cursor([self._project(d, proj) for d in self.docs if self._matches(d, query)])


class _FakeDB:
    def __getattr__(self, name):
        coll = _Coll()
        setattr(self, name, coll)
        return coll


@pytest.fixture()
def db():
    fake = _FakeDB()
    brandmind.init_brandmind(fake)
    brandmind._login_attempts.clear()
    yield fake
    brandmind.init_brandmind(None)


def _register(db, email="lena@example.com", password="sicher-passwort-1", company="Lenas Laden"):
    return asyncio.run(register(RegisterRequest(email=email, password=password, company=company)))


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------
def test_register_creates_user_default_workspace_and_membership(db):
    res = _register(db)
    assert res["token"]
    assert res["user"]["email"] == "lena@example.com"
    assert len(res["workspaces"]) == 1
    ws = res["workspaces"][0]
    assert ws["plan"] == "trial"
    assert ws["role"] == "owner"
    assert res["active_workspace_id"] == ws["id"]
    assert len(db.bm_users.docs) == 1
    assert len(db.bm_memberships.docs) == 1


def test_register_duplicate_email_is_409(db):
    _register(db)
    with pytest.raises(HTTPException) as exc:
        _register(db)
    assert exc.value.status_code == 409


def test_register_invalid_email_is_422(db):
    with pytest.raises(HTTPException) as exc:
        _register(db, email="keine-email")
    assert exc.value.status_code == 422


# ---------------------------------------------------------------------------
# Login + tokens
# ---------------------------------------------------------------------------
def test_login_wrong_password_is_401(db):
    _register(db)
    with pytest.raises(HTTPException) as exc:
        asyncio.run(login(LoginRequest(email="lena@example.com", password="falsch-falsch")))
    assert exc.value.status_code == 401


def test_login_returns_token_that_resolves_user(db):
    _register(db)
    res = asyncio.run(login(LoginRequest(email="lena@example.com", password="sicher-passwort-1")))
    user = asyncio.run(current_user(f"Bearer {res['token']}"))
    assert user["email"] == "lena@example.com"
    assert "password" not in user


def test_tampered_token_is_401(db):
    res = _register(db)
    header, payload, sig = res["token"].split(".")
    bad = f"{header}.{payload}.{'A' if sig[0] != 'A' else 'B'}{sig[1:]}"
    with pytest.raises(HTTPException) as exc:
        asyncio.run(current_user(f"Bearer {bad}"))
    assert exc.value.status_code == 401


def test_expired_token_is_401(db):
    res = _register(db)
    user_id = res["user"]["id"]
    header = _b64url(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    past = int(datetime.now(timezone.utc).timestamp()) - 3600
    payload = _b64url(json.dumps(
        {"sub": user_id, "iat": past - 60, "exp": past}, separators=(",", ":")).encode())
    signing_input = f"{header}.{payload}".encode()
    sig = _b64url(hmac.new(brandmind.JWT_SECRET.encode(), signing_input, hashlib.sha256).digest())
    with pytest.raises(HTTPException) as exc:
        asyncio.run(current_user(f"Bearer {header}.{payload}.{sig}"))
    assert exc.value.status_code == 401


def test_login_rate_limited_after_5_attempts(db):
    _register(db)
    for _ in range(5):
        with pytest.raises(HTTPException) as exc:
            asyncio.run(login(LoginRequest(email="lena@example.com", password="falsch-falsch")))
        assert exc.value.status_code == 401
    with pytest.raises(HTTPException) as exc:
        asyncio.run(login(LoginRequest(email="lena@example.com", password="falsch-falsch")))
    assert exc.value.status_code == 429


# ---------------------------------------------------------------------------
# Workspace context (/api/workspaces/current)
# ---------------------------------------------------------------------------
def test_workspace_current_returns_plan_and_quota(db):
    res = _register(db)
    out = asyncio.run(workspace_current(f"Bearer {res['token']}", None))
    assert out["workspace"]["id"] == res["active_workspace_id"]
    assert out["role"] == "owner"
    assert out["plan"]["id"] == "trial"
    limit = brandmind.PLANS["trial"]["limits"]["generations_per_month"]
    assert out["quota"] == {"used": 0, "limit": limit, "remaining": limit}


def test_workspace_current_reflects_usage(db):
    res = _register(db)
    ws_id = res["active_workspace_id"]
    asyncio.run(db.bm_workspaces.update_one(
        {"id": ws_id}, {"$set": {"usage": {"generations_this_month": 12}}}))
    out = asyncio.run(workspace_current(f"Bearer {res['token']}", ws_id))
    assert out["quota"]["used"] == 12
    assert out["quota"]["remaining"] == out["quota"]["limit"] - 12


def test_workspace_current_foreign_workspace_is_403(db):
    lena = _register(db)
    markus = _register(db, email="markus@example.com", company="Markus GmbH")
    with pytest.raises(HTTPException) as exc:
        asyncio.run(workspace_current(f"Bearer {lena['token']}", markus["active_workspace_id"]))
    assert exc.value.status_code == 403


def test_workspace_current_without_token_is_401(db):
    with pytest.raises(HTTPException) as exc:
        asyncio.run(workspace_current(None, None))
    assert exc.value.status_code == 401

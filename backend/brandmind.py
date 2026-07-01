"""
Brandmind – multi-tenant foundation for the standalone AI Growth OS.

This module turns the single-brand engine into a market-ready SaaS:
  * Workspaces (tenants)   – each customer company is an isolated workspace
  * Users + JWT auth       – real registration / login
  * Memberships            – user <-> workspace with a role
  * Billing (Stripe)       – plan catalog, checkout, webhook, entitlements

It is intentionally self-contained (its own router + helpers) so it can be
mounted on the existing FastAPI app without destabilising server.py. The
existing Kickstartercash data becomes "workspace #1".
"""
import os
import re
import json
import hmac
import base64
import hashlib
import secrets
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel, Field

logger = logging.getLogger("brandmind")

# Plain str aliases – validation happens explicitly, avoids the optional
# email-validator dependency that EmailStr would pull in.
EmailStr = str
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
JWT_SECRET = (
    os.environ.get("BRANDMIND_JWT_SECRET")
    or os.environ.get("JWT_SECRET")
    or "dev-insecure-secret-change-me"
)
if JWT_SECRET == "dev-insecure-secret-change-me":
    logger.warning("BRANDMIND_JWT_SECRET not set – using insecure dev secret. Set it in production!")

JWT_ALG = "HS256"
JWT_TTL_DAYS = 30
PBKDF2_ITERATIONS = 200_000

STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
APP_BASE_URL = os.environ.get("BRANDMIND_APP_URL", "http://localhost:3000")

try:
    import stripe as _stripe
    if STRIPE_API_KEY:
        _stripe.api_key = STRIPE_API_KEY
    _HAS_STRIPE = True
except Exception:  # pragma: no cover
    _stripe = None
    _HAS_STRIPE = False

# Plan catalog. Stripe price IDs come from env so the same code runs in
# test & live mode. Limits gate feature usage per workspace.
PLANS = {
    "trial": {
        "id": "trial", "name": "Trial", "price_eur": 0,
        "stripe_price_id": "",
        "limits": {"brands": 1, "generations_per_month": 30, "members": 1},
        "features": ["Brand Brain", "Marketing Agent", "Creative Studio"],
    },
    "starter": {
        "id": "starter", "name": "Starter", "price_eur": 29,
        "stripe_price_id": os.environ.get("STRIPE_PRICE_STARTER", ""),
        "limits": {"brands": 1, "generations_per_month": 300, "members": 2},
        "features": ["Brand Brain", "Marketing Agent", "Creative Studio", "SEO Agent"],
    },
    "pro": {
        "id": "pro", "name": "Pro", "price_eur": 89,
        "stripe_price_id": os.environ.get("STRIPE_PRICE_PRO", ""),
        "limits": {"brands": 5, "generations_per_month": 1500, "members": 5},
        "features": ["Alles aus Starter", "Sales Agent", "Automation Builder", "Analytics"],
    },
    "agency": {
        "id": "agency", "name": "Agency", "price_eur": 249,
        "stripe_price_id": os.environ.get("STRIPE_PRICE_AGENCY", ""),
        "limits": {"brands": 50, "generations_per_month": 10000, "members": 25},
        "features": ["Alles aus Pro", "White-Label", "Alle KI-Mitarbeiter", "Prioritäts-Support"],
    },
}

# ---------------------------------------------------------------------------
# DB injection (avoids a circular import with server.py)
# ---------------------------------------------------------------------------
_db = None


def init_brandmind(db):
    """Called from server.py after the Mongo client is ready."""
    global _db
    _db = db


def _require_db():
    if _db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    return _db


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = ""
    company: str = ""


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class WorkspaceCreate(BaseModel):
    name: str
    industry: str = ""


class UserOut(BaseModel):
    id: str
    email: str
    name: str = ""


class WorkspaceOut(BaseModel):
    id: str
    name: str
    slug: str
    plan: str = "trial"
    role: str = "owner"


class AuthResponse(BaseModel):
    token: str
    user: UserOut
    workspaces: List[WorkspaceOut]
    active_workspace_id: Optional[str] = None


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------
def _hash_password(raw: str) -> str:
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", raw.encode(), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt.hex()}${dk.hex()}"


def _verify_password(raw: str, stored: str) -> bool:
    try:
        algo, iters, salt_hex, hash_hex = stored.split("$")
        if algo != "pbkdf2_sha256":
            return False
        dk = hashlib.pbkdf2_hmac("sha256", raw.encode(), bytes.fromhex(salt_hex), int(iters))
        return hmac.compare_digest(dk.hex(), hash_hex)
    except Exception:
        return False


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def _create_token(user_id: str) -> str:
    """Minimal, dependency-free HS256 JWT."""
    header = _b64url(json.dumps({"alg": JWT_ALG, "typ": "JWT"}, separators=(",", ":")).encode())
    now = int(datetime.now(timezone.utc).timestamp())
    exp = now + JWT_TTL_DAYS * 86400
    payload = _b64url(json.dumps({"sub": user_id, "iat": now, "exp": exp}, separators=(",", ":")).encode())
    signing_input = f"{header}.{payload}".encode()
    sig = hmac.new(JWT_SECRET.encode(), signing_input, hashlib.sha256).digest()
    return f"{header}.{payload}.{_b64url(sig)}"


def _decode_token(token: str) -> str:
    try:
        header_b64, payload_b64, sig_b64 = token.split(".")
        signing_input = f"{header_b64}.{payload_b64}".encode()
        expected = hmac.new(JWT_SECRET.encode(), signing_input, hashlib.sha256).digest()
        if not hmac.compare_digest(_b64url(expected), sig_b64):
            raise ValueError("bad signature")
        payload = json.loads(_b64url_decode(payload_b64))
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    if int(payload.get("exp", 0)) < int(datetime.now(timezone.utc).timestamp()):
        raise HTTPException(status_code=401, detail="Session expired, please log in again")
    return payload["sub"]


async def current_user(authorization: Optional[str] = Header(default=None)) -> dict:
    """FastAPI dependency – resolves the logged-in user from the Bearer token."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1].strip()
    user_id = _decode_token(token)
    db = _require_db()
    user = await db.bm_users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists")
    return user


def _slugify(name: str) -> str:
    base = "".join(c if c.isalnum() else "-" for c in name.lower()).strip("-")
    base = "-".join(filter(None, base.split("-"))) or "workspace"
    return f"{base[:32]}-{uuid.uuid4().hex[:6]}"


async def _workspaces_for(user_id: str) -> List[dict]:
    db = _require_db()
    memberships = await db.bm_memberships.find({"user_id": user_id}, {"_id": 0}).to_list(200)
    out = []
    for m in memberships:
        ws = await db.bm_workspaces.find_one({"id": m["workspace_id"]}, {"_id": 0})
        if ws:
            out.append({
                "id": ws["id"], "name": ws["name"], "slug": ws["slug"],
                "plan": ws.get("plan", "trial"), "role": m.get("role", "member"),
            })
    return out


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------
router = APIRouter(prefix="/api")


@router.post("/auth/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    db = _require_db()
    email = req.email.lower().strip()
    if not _EMAIL_RE.match(email):
        raise HTTPException(status_code=422, detail="Bitte eine gültige E-Mail-Adresse angeben.")
    if await db.bm_users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="Diese E-Mail ist bereits registriert.")

    user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "name": req.name.strip(),
        "password": _hash_password(req.password),
        "created_at": _now_iso(),
    }
    await db.bm_users.insert_one({**user})

    ws_name = req.company.strip() or (req.name.strip() or email.split("@")[0]) + "s Workspace"
    workspace = {
        "id": str(uuid.uuid4()),
        "name": ws_name,
        "slug": _slugify(ws_name),
        "plan": "trial",
        "created_by": user["id"],
        "created_at": _now_iso(),
        "stripe_customer_id": "",
        "usage": {"generations_this_month": 0},
    }
    await db.bm_workspaces.insert_one({**workspace})
    await db.bm_memberships.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "workspace_id": workspace["id"],
        "role": "owner",
        "created_at": _now_iso(),
    })

    token = _create_token(user["id"])
    workspaces = await _workspaces_for(user["id"])
    return {
        "token": token,
        "user": {"id": user["id"], "email": user["email"], "name": user["name"]},
        "workspaces": workspaces,
        "active_workspace_id": workspace["id"],
    }


@router.post("/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    db = _require_db()
    email = req.email.lower().strip()
    user = await db.bm_users.find_one({"email": email})
    if not user or not _verify_password(req.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="E-Mail oder Passwort ist falsch.")
    token = _create_token(user["id"])
    workspaces = await _workspaces_for(user["id"])
    return {
        "token": token,
        "user": {"id": user["id"], "email": user["email"], "name": user.get("name", "")},
        "workspaces": workspaces,
        "active_workspace_id": workspaces[0]["id"] if workspaces else None,
    }


@router.get("/auth/me")
async def me(authorization: Optional[str] = Header(default=None)):
    user = await current_user(authorization)
    workspaces = await _workspaces_for(user["id"])
    return {
        "user": {"id": user["id"], "email": user["email"], "name": user.get("name", "")},
        "workspaces": workspaces,
    }


@router.get("/workspaces")
async def list_workspaces(authorization: Optional[str] = Header(default=None)):
    user = await current_user(authorization)
    return await _workspaces_for(user["id"])


@router.post("/workspaces", response_model=WorkspaceOut)
async def create_workspace(req: WorkspaceCreate, authorization: Optional[str] = Header(default=None)):
    user = await current_user(authorization)
    db = _require_db()
    workspace = {
        "id": str(uuid.uuid4()),
        "name": req.name.strip() or "Neuer Workspace",
        "slug": _slugify(req.name or "workspace"),
        "plan": "trial",
        "industry": req.industry.strip(),
        "created_by": user["id"],
        "created_at": _now_iso(),
        "stripe_customer_id": "",
        "usage": {"generations_this_month": 0},
    }
    await db.bm_workspaces.insert_one({**workspace})
    await db.bm_memberships.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "workspace_id": workspace["id"],
        "role": "owner",
        "created_at": _now_iso(),
    })
    return {
        "id": workspace["id"], "name": workspace["name"], "slug": workspace["slug"],
        "plan": "trial", "role": "owner",
    }


async def _assert_member(user_id: str, workspace_id: str) -> dict:
    db = _require_db()
    m = await db.bm_memberships.find_one({"user_id": user_id, "workspace_id": workspace_id}, {"_id": 0})
    if not m:
        raise HTTPException(status_code=403, detail="No access to this workspace")
    return m


# ---------------------------------------------------------------------------
# Billing
# ---------------------------------------------------------------------------
@router.get("/billing/plans")
async def billing_plans():
    # Never leak raw price IDs to the client
    return [
        {k: v for k, v in p.items() if k != "stripe_price_id"}
        for p in PLANS.values()
    ]


class CheckoutRequest(BaseModel):
    workspace_id: str
    plan: str


@router.post("/billing/checkout")
async def billing_checkout(req: CheckoutRequest, authorization: Optional[str] = Header(default=None)):
    user = await current_user(authorization)
    await _assert_member(user["id"], req.workspace_id)

    plan = PLANS.get(req.plan)
    if not plan or req.plan == "trial":
        raise HTTPException(status_code=400, detail="Invalid plan")
    if not (_HAS_STRIPE and STRIPE_API_KEY):
        raise HTTPException(status_code=503, detail="Billing ist noch nicht konfiguriert (STRIPE_API_KEY fehlt).")
    if not plan["stripe_price_id"]:
        raise HTTPException(status_code=503, detail=f"Kein Stripe-Preis für Plan '{req.plan}' hinterlegt.")

    db = _require_db()
    ws = await db.bm_workspaces.find_one({"id": req.workspace_id}, {"_id": 0})
    try:
        session = _stripe.checkout.Session.create(
            mode="subscription",
            line_items=[{"price": plan["stripe_price_id"], "quantity": 1}],
            success_url=f"{APP_BASE_URL}/billing/success?ws={req.workspace_id}",
            cancel_url=f"{APP_BASE_URL}/billing?canceled=1",
            client_reference_id=req.workspace_id,
            customer=ws.get("stripe_customer_id") or None,
            metadata={"workspace_id": req.workspace_id, "plan": req.plan},
        )
        return {"checkout_url": session.url, "session_id": session.id}
    except Exception as e:
        logger.error(f"Stripe checkout failed: {e}")
        raise HTTPException(status_code=502, detail="Checkout konnte nicht erstellt werden.")


@router.post("/billing/webhook")
async def billing_webhook(request: Request):
    if not (_HAS_STRIPE and STRIPE_API_KEY):
        raise HTTPException(status_code=503, detail="Billing not configured")
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        if STRIPE_WEBHOOK_SECRET:
            event = _stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
        else:
            import json
            event = json.loads(payload)
    except Exception as e:
        logger.error(f"Stripe webhook verification failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid webhook payload")

    etype = event.get("type")
    obj = event.get("data", {}).get("object", {})
    db = _require_db()

    if etype == "checkout.session.completed":
        ws_id = (obj.get("metadata") or {}).get("workspace_id") or obj.get("client_reference_id")
        plan = (obj.get("metadata") or {}).get("plan")
        updates = {}
        if plan in PLANS:
            updates["plan"] = plan
        if obj.get("customer"):
            updates["stripe_customer_id"] = obj["customer"]
        if ws_id and updates:
            await db.bm_workspaces.update_one({"id": ws_id}, {"$set": updates})
            logger.info(f"Workspace {ws_id} upgraded to {plan}")
    elif etype in ("customer.subscription.deleted", "customer.subscription.canceled"):
        cust = obj.get("customer")
        if cust:
            await db.bm_workspaces.update_one(
                {"stripe_customer_id": cust}, {"$set": {"plan": "trial"}}
            )

    return {"received": True}

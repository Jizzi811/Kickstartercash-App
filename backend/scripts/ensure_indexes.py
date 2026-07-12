"""Idempotent MongoDB index setup for Brandmind.

Run manually (or from a deploy hook) — NOT at app startup, so racing deploys
can't fight over index builds:

    cd backend && MONGO_URL=... DB_NAME=... python scripts/ensure_indexes.py

create_index is a no-op when the same spec already exists, so re-running is
safe. Unique-index creation fails if existing data contains duplicates; the
script reports each failure and exits non-zero so the duplicate can be cleaned
up deliberately instead of being masked.
"""
import asyncio
import os
import sys

# --- Index specs -------------------------------------------------------------
# (collection, keys, kwargs) — keys as list of (field, direction) tuples.
UNIQUE = {"unique": True}

INDEX_SPECS = [
    # Identity & tenancy (brandmind.py): the single auth/workspace path.
    ("bm_users", [("email", 1)], UNIQUE),
    ("bm_users", [("id", 1)], UNIQUE),
    ("bm_workspaces", [("id", 1)], UNIQUE),
    ("bm_workspaces", [("stripe_customer_id", 1)], {}),   # Stripe webhook lookup
    ("bm_memberships", [("user_id", 1), ("workspace_id", 1)], UNIQUE),
    ("bm_memberships", [("workspace_id", 1)], {}),
    ("bm_integrations", [("workspace_id", 1), ("provider", 1)], UNIQUE),  # upsert key
    ("bm_oauth_states", [("provider", 1), ("state", 1)], {}),

    # Workspace-scoped domain collections (server.py _scope_filter pattern).
    # Non-unique: legacy single-brand docs without workspace_id index as null.
    ("brands", [("workspace_id", 1)], {}),
    ("founder_profiles", [("workspace_id", 1)], {}),
    ("founder_ideas", [("workspace_id", 1)], {}),
    ("founder_business_plan", [("workspace_id", 1)], {}),
    ("founder_offers", [("workspace_id", 1)], {}),
    ("founder_brand_development", [("workspace_id", 1)], {}),
    ("brand_decisions", [("workspace_id", 1)], {}),
    ("brand_import_drafts", [("workspace_id", 1)], {}),
    ("history", [("workspace_id", 1)], {}),
    ("knowledge", [("workspace_id", 1)], {}),
    ("funnels", [("workspace_id", 1)], {}),
    ("business_cards", [("workspace_id", 1)], {}),
    ("mission_plans", [("workspace_id", 1)], {}),
    ("mission_tasks", [("workspace_id", 1)], {}),
    ("custom_agents", [("workspace_id", 1)], {}),
    ("gateway_usage", [("workspace_id", 1)], {}),
    ("onboarding_status", [("workspace_id", 1)], {}),
]


async def ensure_indexes(db) -> int:
    """Create every spec'd index; returns the number of failures."""
    failures = 0
    for coll, keys, kwargs in INDEX_SPECS:
        label = f"{coll}({', '.join(f for f, _ in keys)}){' UNIQUE' if kwargs.get('unique') else ''}"
        try:
            name = await db[coll].create_index(keys, **kwargs)
            print(f"  ok    {label} -> {name}")
        except Exception as e:  # noqa: BLE001 — report and continue; exit code carries the failure
            failures += 1
            print(f"  FAIL  {label}: {e}")
    return failures


async def main() -> int:
    mongo_url = os.environ.get("MONGO_URL", "")
    db_name = os.environ.get("DB_NAME", "")
    if not mongo_url or not db_name:
        print("MONGO_URL and DB_NAME must be set (see BRANDMIND_DEPLOY.md).")
        return 2

    from motor.motor_asyncio import AsyncIOMotorClient
    client = AsyncIOMotorClient(mongo_url)
    try:
        db = client[db_name]
        print(f"Ensuring {len(INDEX_SPECS)} indexes on '{db_name}' …")
        failures = await ensure_indexes(db)
        if failures:
            print(f"{failures} index(es) failed — unique violations mean duplicate "
                  f"data that must be cleaned up before the index can protect it.")
            return 1
        print("All indexes ensured.")
        return 0
    finally:
        client.close()


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))

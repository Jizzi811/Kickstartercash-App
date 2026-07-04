"""Database connection – the single Mongo client/handle for the app.

Extracted from server.py (Sprint 0.2, strangler-fig refactor). server.py
imports `client` and `db` from here, so behaviour is unchanged. The motor
client is created lazily, so importing this module never blocks on a
connection – a missing/empty MONGO_URL simply yields `db is None`.
"""
import logging

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import MONGO_URL, DB_NAME

logger = logging.getLogger(__name__)

try:
    client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=5000) if MONGO_URL else None
    db = client[DB_NAME] if client else None
except Exception as _mongo_err:  # pragma: no cover - defensive
    logger.warning(f"MongoDB init failed: {_mongo_err}")
    client = None
    db = None

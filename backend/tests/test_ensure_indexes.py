"""Offline tests for scripts/ensure_indexes.py.

The script runs against a real MongoDB in ops; here we verify the spec table
is well-formed (so a typo can't silently skip an index) and that the runner
reports failures instead of masking them.
"""
import asyncio
import os
import sys

os.environ.setdefault("MONGO_URL", "")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
from ensure_indexes import INDEX_SPECS, ensure_indexes  # noqa: E402


def test_index_specs_are_well_formed():
    assert len(INDEX_SPECS) >= 20
    for coll, keys, kwargs in INDEX_SPECS:
        assert isinstance(coll, str) and coll
        assert keys, f"{coll}: empty key spec"
        for field, direction in keys:
            assert isinstance(field, str) and field
            assert direction in (1, -1)
        assert isinstance(kwargs, dict)


def test_identity_uniques_are_present():
    uniques = {(coll, tuple(f for f, _ in keys))
               for coll, keys, kwargs in INDEX_SPECS if kwargs.get("unique")}
    assert ("bm_users", ("email",)) in uniques
    assert ("bm_memberships", ("user_id", "workspace_id")) in uniques
    assert ("bm_integrations", ("workspace_id", "provider")) in uniques


class _FakeColl:
    def __init__(self, fail):
        self._fail = fail

    async def create_index(self, keys, **kwargs):
        if self._fail:
            raise RuntimeError("duplicate key")
        return "idx_" + "_".join(f for f, _ in keys)


class _FakeDB:
    def __init__(self, failing_colls=()):
        self._failing = set(failing_colls)

    def __getitem__(self, name):
        return _FakeColl(fail=name in self._failing)


def test_runner_counts_failures_and_continues():
    ok = asyncio.run(ensure_indexes(_FakeDB()))
    assert ok == 0
    failing = asyncio.run(ensure_indexes(_FakeDB(failing_colls={"bm_users"})))
    assert failing == 2  # bm_users has two specs; the rest still ran

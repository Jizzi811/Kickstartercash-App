import os

os.environ.setdefault("MONGO_URL", "")

import server  # noqa: E402


def test_muapi_target_url_with_query():
    url = server._muapi_target_url("assistant", "utm_source=test")
    assert url == f"{server.MUAPI_BASE_URL}/assistant?utm_source=test"


def test_muapi_target_url_normalizes_leading_slash():
    url = server._muapi_target_url("/assets/app.js", "")
    assert url == f"{server.MUAPI_BASE_URL}/assets/app.js"

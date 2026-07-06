import os

os.environ.setdefault("MONGO_URL", "")

import server  # noqa: E402


def test_business_card_payload_defaults_include_avatar_assistant_mode():
    payload = server.BusinessCardPayload()
    data = payload.dict()
    assert data["assistant_mode"] == "avatar"
    assert data["assistant_label"] == "Ask AI"
    assert data["assistant_greeting"] == "Hi, ask me anything about this profile."
    assert data["assistant_avatar"] == ""


def test_business_card_payload_allows_custom_assistant_fields():
    payload = server.BusinessCardPayload(
        assistant_mode="panel",
        assistant_label="Chat with Maya",
        assistant_avatar="https://cdn.example.com/maya.png",
        assistant_greeting="Hello, I can guide you through services.",
    )
    data = payload.dict()
    assert data["assistant_mode"] == "panel"
    assert data["assistant_label"] == "Chat with Maya"
    assert data["assistant_avatar"] == "https://cdn.example.com/maya.png"
    assert data["assistant_greeting"] == "Hello, I can guide you through services."

import os

os.environ.setdefault("MONGO_URL", "")

import server  # noqa: E402


def test_business_card_payload_defaults_include_avatar_assistant_mode():
    payload = server.BusinessCardPayload()
    data = payload.model_dump()
    assert data["logo_url"] == ""
    assert data["assistant_mode"] == "avatar"
    assert data["assistant_label"] == "Ask AI"
    assert data["assistant_greeting"] == "Hi, ask me anything about this profile."
    assert data["assistant_avatar"] == ""
    assert data["assistant_knowledge"] == ""


def test_business_card_payload_allows_custom_assistant_fields():
    payload = server.BusinessCardPayload(
        logo_url="https://cdn.example.com/logo.png",
        assistant_mode="panel",
        assistant_label="Chat with Maya",
        assistant_avatar="https://cdn.example.com/maya.png",
        assistant_greeting="Hello, I can guide you through services.",
        assistant_knowledge="Main offers: funnel audits and AI content systems.",
    )
    data = payload.model_dump()
    assert data["logo_url"] == "https://cdn.example.com/logo.png"
    assert data["assistant_mode"] == "panel"
    assert data["assistant_label"] == "Chat with Maya"
    assert data["assistant_avatar"] == "https://cdn.example.com/maya.png"
    assert data["assistant_greeting"] == "Hello, I can guide you through services."
    assert data["assistant_knowledge"] == "Main offers: funnel audits and AI content systems."

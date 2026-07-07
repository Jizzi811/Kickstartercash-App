import os

import pytest

os.environ.setdefault("MONGO_URL", "")

import server  # noqa: E402


class _FakeBusinessCards:
    async def find_one(self, *_args, **_kwargs):
        return {
            "name": "Max",
            "title": "Berater",
            "company": "Brandmind",
            "phone": "+49 123",
            "email": "max@example.com",
            "website": "brandmind.de",
            "social_links": {"linkedin": "https://linkedin.com/in/max"},
            "assistant_knowledge": "Wir bieten Positionierung, Branding und Content-Systeme an.",
            "show_ai_assistant": True,
        }


class _FakeDB:
    business_cards = _FakeBusinessCards()


@pytest.mark.asyncio
async def test_business_card_chat_returns_german_contact_answer(monkeypatch):
    monkeypatch.setattr(server, "db", _FakeDB())
    payload = server.BusinessCardChatRequest(question="Wie ist die Telefonnummer?")
    result = await server.chat_public_business_card("hash", payload)
    assert "Telefon:" in result["answer"]


@pytest.mark.asyncio
async def test_business_card_chat_uses_german_system_prompt(monkeypatch):
    monkeypatch.setattr(server, "db", _FakeDB())

    captured = {}

    async def _fake_llm_text(_model, system, prompt):
        captured["system"] = system
        captured["prompt"] = prompt
        return "Antwort auf Deutsch"

    monkeypatch.setattr(server, "llm_text", _fake_llm_text)

    payload = server.BusinessCardChatRequest(question="Erzähle mir etwas über das Angebot.")
    result = await server.chat_public_business_card("hash", payload)

    assert result["answer"] == "Antwort auf Deutsch"
    assert "ausschließlich auf Deutsch" in captured["system"]
    assert "Frage:" in captured["prompt"]

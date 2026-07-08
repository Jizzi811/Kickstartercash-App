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


@pytest.mark.anyio
async def test_business_card_chat_returns_german_contact_answer(monkeypatch):
    monkeypatch.setattr(server, "db", _FakeDB())
    payload = server.BusinessCardChatRequest(question="Wie ist die Telefonnummer?")
    result = await server.chat_public_business_card("hash", payload)
    assert "Telefon:" in result["answer"]


@pytest.mark.anyio
async def test_business_card_chat_uses_german_system_prompt(monkeypatch):
    monkeypatch.setattr(server, "db", _FakeDB())

    captured_calls = []

    async def _fake_llm_text(_model, system, prompt):
        captured_calls.append((system, prompt))
        return "Antwort auf Deutsch"

    monkeypatch.setattr(server, "llm_text", _fake_llm_text)

    payload = server.BusinessCardChatRequest(question="Wie würdest du dein Profil kurz beschreiben?")
    result = await server.chat_public_business_card("hash", payload)

    assert result["answer"] == "Antwort auf Deutsch"
    assert any("ausschließlich auf Deutsch" in system for system, _ in captured_calls)
    assert any("Frage:" in prompt for _, prompt in captured_calls)


@pytest.mark.anyio
async def test_business_card_chat_translates_english_knowledge_to_german(monkeypatch):
    class _EnglishKnowledgeCards:
        async def find_one(self, *_args, **_kwargs):
            return {
                "name": "Max",
                "title": "Consultant",
                "company": "Brandmind",
                "social_links": {},
                "assistant_knowledge": "We offer strategy workshops and content systems.",
                "show_ai_assistant": True,
            }

    class _EnglishKnowledgeDB:
        business_cards = _EnglishKnowledgeCards()

    monkeypatch.setattr(server, "db", _EnglishKnowledgeDB())

    async def _fake_llm_text(_model, system, _prompt):
        if "Übersetzer" in system:
            return "Wir bieten Strategie-Workshops und Content-Systeme an."
        return "Wir helfen Unternehmen beim Wachstum."

    monkeypatch.setattr(server, "llm_text", _fake_llm_text)

    payload = server.BusinessCardChatRequest(question="What services do you offer?")
    result = await server.chat_public_business_card("hash", payload)

    assert result["answer"] == "Wir bieten Strategie-Workshops und Content-Systeme an."

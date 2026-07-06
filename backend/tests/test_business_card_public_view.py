import os

os.environ.setdefault("MONGO_URL", "")

import server  # noqa: E402


def test_public_business_card_view_hides_private_assistant_knowledge():
    raw_card = {
        "id": "card-1",
        "url_hash": "abc123",
        "name": "Maya",
        "user_id": "user-1",
        "assistant_knowledge": "Internal notes",
        "_id": "mongo-id",
    }
    public_card = server._public_business_card_view(raw_card)
    assert public_card["id"] == "card-1"
    assert public_card["url_hash"] == "abc123"
    assert public_card["name"] == "Maya"
    assert "assistant_knowledge" not in public_card
    assert "user_id" not in public_card
    assert "_id" not in public_card

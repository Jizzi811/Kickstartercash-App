from app.services import readiness as server


def test_selected_path_values_are_explicit():
    assert server.ONBOARDING_PATHS == {"existing_brand", "founder", "explore"}
    assert "not_started" in server.ONBOARDING_STATUSES
    assert "completed" in server.ONBOARDING_STATUSES


def test_readiness_is_deterministic_and_ignores_empty_values():
    brand = {
        "id": "brand-1", "name": "Acme", "industry": "  ", "target_audience": "KMU",
        "slogan": "TBD", "products": "Consulting", "tone": "klar", "primary_color": "#111111",
        "secondary_color": "#222222", "image_style": "modern", "social_accounts": "", "dna": {"values": ["Mut"]},
    }
    a = server.calculate_brand_readiness(brand, 1, "ws-1")
    b = server.calculate_brand_readiness(brand, 1, "ws-1")
    volatile = {"calculated_at"}
    assert {k: v for k, v in a.items() if k not in volatile} == {k: v for k, v in b.items() if k not in volatile}
    basics = next(c for c in a["category_details"] if c["id"] == "basics")
    assert "industry" in basics["missing_criteria"]
    positioning = next(c for c in a["category_details"] if c["id"] == "positioning")
    assert "value_proposition" in positioning["missing_criteria"]


def test_readiness_next_actions_routes_and_scope_fields():
    result = server.calculate_brand_readiness({"id": "b2", "name": "Brand", "workspace_id": "ws-2"}, 0, "ws-2")
    assert result["brand_id"] == "b2"
    assert result["workspace_id"] == "ws-2"
    assert len(result["next_actions"]) <= 3
    assert {a["route"] for a in result["next_actions"]} <= {"/brand-brain", "/brand-identity", "/knowledge"}


def test_missing_active_brand_returns_defined_state():
    result = server.calculate_brand_readiness(None, 0, "ws-empty")
    assert result["state"] == "no_active_brand"
    assert result["score"] == 0
    assert result["brand_id"] == ""

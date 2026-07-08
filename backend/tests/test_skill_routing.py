from app.skills import registry


def test_suggest_skill_prefers_live_image_tool_for_image_tasks():
    skill = registry.suggest_skill_for_task("Bitte ein neues Hero Bild für die Kampagne erstellen")
    assert skill is not None
    assert skill["id"] == "image_generate_live"
    assert skill["type"] == "image"


def test_suggest_skill_prefers_live_video_tool_for_video_tasks():
    skill = registry.suggest_skill_for_task("Create a short product video reel for launch")
    assert skill is not None
    assert skill["id"] == "video_generate_live"
    assert skill["type"] == "video"


def test_suggest_skill_fallbacks_for_generic_task():
    skill = registry.suggest_skill_for_task("help me improve business performance")
    assert skill is not None
    assert isinstance(skill["id"], str) and len(skill["id"]) > 0


def test_suggest_skill_routes_to_ai_citation_strategist_for_geo_queries():
    skill = registry.suggest_skill_for_task("Need a GEO citation strategy for ChatGPT and Perplexity visibility")
    assert skill is not None
    assert skill["id"] == "ai_citation_strategist"


def test_suggest_skill_routes_to_email_marketing_for_lifecycle_queries():
    skill = registry.suggest_skill_for_task("Build a lifecycle email sequence and improve newsletter deliverability")
    assert skill is not None
    assert skill["id"] == "email_marketing_strategist"


def test_suggest_skill_routes_to_video_optimization_for_watchtime_queries():
    skill = registry.suggest_skill_for_task("Improve watchtime and thumbnail strategy for our YouTube videos")
    assert skill is not None
    assert skill["id"] == "video_optimization_specialist"

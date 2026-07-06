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
    assert skill["id"] in {"campaign_planner", "output_optimizer", "competitor_analysis"}

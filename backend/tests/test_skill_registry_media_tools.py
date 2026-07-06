from app.skills import registry


def test_designer_has_live_image_generation_skill():
    skills = registry.skills_for_agent("designer")
    by_id = {s["id"]: s for s in skills}
    assert "image_generate_live" in by_id
    assert by_id["image_generate_live"]["type"] == "image"


def test_video_agent_has_live_video_generation_skill():
    skills = registry.skills_for_agent("video")
    by_id = {s["id"]: s for s in skills}
    assert "video_generate_live" in by_id
    assert by_id["video_generate_live"]["type"] == "video"

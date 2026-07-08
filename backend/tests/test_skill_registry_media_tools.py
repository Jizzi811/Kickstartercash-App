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


def test_agency_agent_pack_skills_are_mapped_to_existing_brandmind_agents():
    seo_skills = {s["id"] for s in registry.skills_for_agent("seo")}
    content_skills = {s["id"] for s in registry.skills_for_agent("content")}
    ceo_skills = {s["id"] for s in registry.skills_for_agent("ceo")}

    assert "ai_citation_strategist" in seo_skills
    assert "aeo_foundations_architect" in seo_skills
    assert "agentic_search_optimizer" in seo_skills
    assert "video_optimization_specialist" in seo_skills
    assert "email_marketing_strategist" in content_skills
    assert "pr_communications_manager" in ceo_skills

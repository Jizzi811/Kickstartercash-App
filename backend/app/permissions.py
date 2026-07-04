"""BrandMind workspace-scoped capability and permission framework."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Optional

PERMISSIONS = {
    "workspace.manage": "Manage workspace settings and members",
    "roles.manage": "Create and edit roles",
    "agents.use": "Chat with BrandMind agents",
    "agents.manage": "Create and configure agents",
    "skills.use": "Run marketplace and agent skills",
    "skills.manage": "Install and configure skills",
    "tools.use": "Run tools through agents",
    "providers.use": "Use AI providers",
    "providers.manage": "Configure AI providers",
    "marketplace.access": "Access marketplace listings",
    "billing.view": "View subscription and usage",
    "premium.use": "Use premium-only capabilities",
}

CAPABILITIES = {
    "chat": {"label": "Chat", "permission": "providers.use", "premium": False},
    "structured_output": {"label": "Structured output", "permission": "providers.use", "premium": False},
    "image": {"label": "Image generation", "permission": "premium.use", "premium": True},
    "embeddings": {"label": "Memory embeddings", "permission": "providers.use", "premium": False},
    "text_to_speech": {"label": "Text to speech", "permission": "premium.use", "premium": True},
}

ROLE_REGISTRY = {
    "owner": {"label": "Owner", "permissions": list(PERMISSIONS)},
    "admin": {"label": "Admin", "permissions": [p for p in PERMISSIONS if p != "workspace.manage"]},
    "manager": {"label": "Manager", "permissions": ["agents.use", "skills.use", "tools.use", "providers.use", "marketplace.access", "billing.view"]},
    "creator": {"label": "Creator", "permissions": ["agents.use", "skills.use", "tools.use", "providers.use", "marketplace.access"]},
    "viewer": {"label": "Viewer", "permissions": ["billing.view", "marketplace.access"]},
}

SUBSCRIPTION_LIMITS = {
    "free": {"daily_requests": 50, "monthly_requests": 500, "premium": False, "providers": ["pollinations", "freetheai"], "skills": 5},
    "pro": {"daily_requests": 1000, "monthly_requests": 25000, "premium": True, "providers": ["*"], "skills": 100},
    "enterprise": {"daily_requests": 10000, "monthly_requests": 250000, "premium": True, "providers": ["*"], "skills": 1000},
}

FEATURE_FLAGS = {
    "marketplace": True,
    "custom_agents": True,
    "provider_gateway": True,
    "premium_media": True,
    "capability_matrix": True,
}

@dataclass
class PermissionDecision:
    allowed: bool
    reason: str = "allowed"
    requirement: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {"allowed": self.allowed, "reason": self.reason, "requirement": self.requirement}


def default_policy(workspace_id: Optional[str]) -> dict[str, Any]:
    plan = "pro" if workspace_id else "free"
    return {
        "workspace_id": workspace_id or "",
        "subscription": {"plan": plan, **SUBSCRIPTION_LIMITS[plan]},
        "roles": ROLE_REGISTRY,
        "feature_flags": FEATURE_FLAGS,
        "role_assignments": {"default": "owner"},
        "departments": {},
        "agents": {},
        "skills": {},
        "tools": {},
        "providers": {},
        "usage_limits": {"per_minute": 60, **SUBSCRIPTION_LIMITS[plan]},
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def registry_payload() -> dict[str, Any]:
    return {
        "permissions": [{"id": k, "description": v} for k, v in PERMISSIONS.items()],
        "capabilities": [{"id": k, **v} for k, v in CAPABILITIES.items()],
        "roles": [{"id": k, **v} for k, v in ROLE_REGISTRY.items()],
        "feature_flags": FEATURE_FLAGS,
        "subscription_limits": SUBSCRIPTION_LIMITS,
        "architecture": ["Workspace", "Roles", "Agents", "Skills", "Tools", "Providers"],
    }


def _blocked(map_: dict[str, Any], key: Optional[str]) -> bool:
    return bool(key and map_.get(key, {}).get("enabled") is False)


def evaluate(policy: dict[str, Any], *, capability: str, provider: Optional[str] = None,
             agent_id: Optional[str] = None, skill_id: Optional[str] = None,
             tool_id: Optional[str] = None, tokens_in: int = 0,
             usage: Optional[dict[str, int]] = None) -> PermissionDecision:
    usage = usage or {}
    cap = CAPABILITIES.get(capability, {"permission": "providers.use", "premium": False})
    sub = policy.get("subscription", {})
    limits = policy.get("usage_limits", {})
    if cap.get("premium") and not sub.get("premium"):
        return PermissionDecision(False, "premium_required", {"capability": capability})
    if _blocked(policy.get("providers", {}), provider):
        return PermissionDecision(False, "provider_disabled", {"provider": provider})
    if _blocked(policy.get("agents", {}), agent_id):
        return PermissionDecision(False, "agent_disabled", {"agent_id": agent_id})
    if _blocked(policy.get("skills", {}), skill_id):
        return PermissionDecision(False, "skill_disabled", {"skill_id": skill_id})
    if _blocked(policy.get("tools", {}), tool_id):
        return PermissionDecision(False, "tool_disabled", {"tool_id": tool_id})
    if usage.get("daily_requests", 0) >= int(limits.get("daily_requests", 10**9)):
        return PermissionDecision(False, "daily_limit_exceeded", limits)
    if usage.get("monthly_requests", 0) >= int(limits.get("monthly_requests", 10**9)):
        return PermissionDecision(False, "monthly_limit_exceeded", limits)
    if tokens_in > int(limits.get("max_tokens_per_request", 200000)):
        return PermissionDecision(False, "request_too_large", limits)
    return PermissionDecision(True)

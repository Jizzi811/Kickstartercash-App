"""BrandMind Workflow Composer Engine.

A lightweight workflow operating layer that models business processes as:
Workflow -> Stages -> Tasks -> Departments -> Agents -> Skills -> Tools ->
Providers -> Outputs.

The first implementation is intentionally provider-safe and deterministic: it
builds runtime plans, executes workflow graphs, records artifacts/history/logs,
and exposes the contracts needed by the UI and future AI/provider integration.
"""
from __future__ import annotations

import asyncio
import time
import uuid
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

WORKFLOW_TYPES = [
    "marketing", "sales", "seo", "content", "video", "image", "research",
    "automation", "support", "business", "publishing",
]
TERMINAL = {"completed", "failed", "cancelled", "approval_required"}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


def _task(id: str, title: str, department: str, agent: str, skill: str, tool: str,
          provider: str = "provider_gateway", mode: str = "sequential",
          condition: Optional[str] = None, human_approval: bool = False,
          retries: int = 1, timeout_seconds: int = 60, fallback: Optional[str] = None,
          sub_workflow: Optional[str] = None) -> dict:
    return {
        "id": id, "title": title, "department": department, "agent": agent,
        "skill": skill, "tool": tool, "provider": provider, "mode": mode,
        "condition": condition, "human_approval": human_approval,
        "retry": {"max_attempts": retries, "backoff_seconds": 2},
        "timeout_seconds": timeout_seconds, "fallback": fallback,
        "sub_workflow": sub_workflow, "outputs": [],
    }


TEMPLATES: Dict[str, dict] = {
    "brand_campaign_launch": {
        "id": "brand_campaign_launch", "version": "1.0.0", "type": "marketing",
        "name": "Brand Campaign Launch", "description": "Research, plan, approve, produce and analyze a brand campaign.",
        "variables": {"campaign_goal": "Awareness", "channels": ["LinkedIn", "Email", "SEO"], "approval_required": True},
        "scopes": {"workspace_scoped": True, "brand_scoped": True},
        "stages": [
            {"id": "discover", "name": "Discover", "mode": "parallel", "tasks": [
                _task("market_research", "Audience and competitor research", "Research", "Insight Analyst", "competitor_analysis", "web_research"),
                _task("memory_context", "Load Multi-Brain Memory context", "Intelligence", "Memory Router", "memory_recall", "memory_search"),
            ]},
            {"id": "strategy", "name": "Strategy", "mode": "sequential", "tasks": [
                _task("campaign_plan", "Compose campaign plan", "Marketing", "Campaign Strategist", "campaign_planner", "gateway_chat"),
                _task("brand_guardrails", "Validate against Brand Identity Engine", "Brand", "Brand Guardian", "brand_compliance_check", "identity_validator"),
            ]},
            {"id": "approval", "name": "Human Approval", "mode": "sequential", "tasks": [
                _task("approve_strategy", "Approve strategy before production", "Leadership", "Human", "approval", "mission_control", human_approval=True, condition="variables.approval_required == true"),
            ]},
            {"id": "production", "name": "Production", "mode": "parallel", "tasks": [
                _task("copy_assets", "Create copy assets", "Content", "Copywriter", "hook_generator", "gateway_chat"),
                _task("seo_assets", "Create SEO assets", "SEO", "SEO Specialist", "keyword_expansion", "gateway_chat", fallback="content_refresh"),
                _task("visual_brief", "Create visual production brief", "Design", "Design Agent", "prompt_optimizer", "image_prompt"),
            ]},
            {"id": "analytics", "name": "Analytics", "mode": "sequential", "tasks": [
                _task("kpi_plan", "Define KPIs and dashboard events", "Analytics", "Analytics Agent", "output_optimizer", "analytics_schema"),
            ]},
        ],
    },
    "seo_content_machine": {
        "id": "seo_content_machine", "version": "1.0.0", "type": "seo",
        "name": "SEO Content Machine", "description": "Keyword to article brief, metadata, QA and publishing package.",
        "variables": {"keyword": "", "publish": False}, "scopes": {"workspace_scoped": True, "brand_scoped": True},
        "stages": [
            {"id": "keyword", "name": "Keyword Intelligence", "mode": "sequential", "tasks": [_task("cluster", "Cluster keyword and intent", "SEO", "SEO Specialist", "keyword_expansion", "gateway_chat")]},
            {"id": "brief", "name": "Content Brief", "mode": "sequential", "tasks": [_task("brief", "Generate article brief", "Content", "Content Agent", "campaign_planner", "gateway_chat")]},
            {"id": "qa", "name": "QA", "mode": "parallel", "tasks": [_task("brand_check", "Brand compliance", "Brand", "Brand Guardian", "brand_compliance_check", "identity_validator"), _task("seo_check", "SEO QA", "SEO", "SEO Specialist", "seo_audit", "gateway_chat")]},
        ],
    },
    "support_resolution": {
        "id": "support_resolution", "version": "1.0.0", "type": "support",
        "name": "Ticket to Resolution", "description": "Classify, resolve, approve sensitive replies, and log learnings.",
        "variables": {"priority": "normal", "sensitive": False}, "scopes": {"workspace_scoped": True, "brand_scoped": True},
        "stages": [
            {"id": "triage", "name": "Triage", "mode": "sequential", "tasks": [_task("classify", "Classify ticket", "Support", "Support Agent", "competitor_analysis", "ticket_classifier")]},
            {"id": "resolution", "name": "Resolution", "mode": "sequential", "tasks": [_task("draft", "Draft answer", "Support", "Support Agent", "output_optimizer", "gateway_chat"), _task("approve", "Human approval for sensitive tickets", "Support", "Human", "approval", "mission_control", human_approval=True, condition="variables.sensitive == true")]},
        ],
    },
}


def registry_payload() -> dict:
    return {"types": WORKFLOW_TYPES, "templates": list(TEMPLATES.values()), "capabilities": ["sequential", "parallel", "conditional", "human_approval", "retry", "timeout", "fallback", "sub_workflow", "versioning", "workspace_scope", "brand_scope"]}


def get_template(template_id: str) -> Optional[dict]:
    return deepcopy(TEMPLATES.get(template_id))


class WorkflowRuntime:
    def __init__(self, definition: dict, variables: Optional[dict] = None, context: Optional[dict] = None):
        self.definition = deepcopy(definition)
        self.variables = {**self.definition.get("variables", {}), **(variables or {})}
        self.context = context or {}
        self.artifacts: List[dict] = []
        self.history: List[dict] = []
        self.logs: List[dict] = []
        self.status = "queued"

    def log(self, level: str, message: str, **meta: Any) -> None:
        self.logs.append({"ts": now_iso(), "level": level, "message": message, "meta": meta})

    def event(self, event: str, **meta: Any) -> None:
        self.history.append({"ts": now_iso(), "event": event, "meta": meta})

    def condition_ok(self, expr: Optional[str]) -> bool:
        if not expr:
            return True
        expr = expr.strip()
        if "==" not in expr or not expr.startswith("variables."):
            return True
        left, right = [p.strip() for p in expr.split("==", 1)]
        key = left.replace("variables.", "", 1)
        expected = True if right == "true" else False if right == "false" else right.strip('"\'')
        return self.variables.get(key) == expected


class WorkflowEngine:
    async def run(self, workflow: dict, *, variables: Optional[dict] = None, context: Optional[dict] = None) -> dict:
        runtime = WorkflowRuntime(workflow, variables, context)
        run_id = _id("run")
        runtime.status = "running"
        runtime.event("workflow_started", run_id=run_id, workflow_id=workflow.get("id"), version=workflow.get("version"))
        for stage in workflow.get("stages", []):
            if runtime.status in TERMINAL:
                break
            runtime.event("stage_started", stage_id=stage.get("id"))
            tasks = stage.get("tasks", [])
            if stage.get("mode") == "parallel":
                results = await asyncio.gather(*(self._run_task(runtime, t) for t in tasks))
            else:
                results = []
                for task in tasks:
                    results.append(await self._run_task(runtime, task))
                    if runtime.status == "approval_required":
                        break
            runtime.event("stage_finished", stage_id=stage.get("id"), results=results)
        if runtime.status == "running":
            runtime.status = "completed"
        runtime.event("workflow_finished", run_id=run_id, status=runtime.status)
        return {"run_id": run_id, "status": runtime.status, "workflow": workflow, "variables": runtime.variables, "context": runtime.context, "artifacts": runtime.artifacts, "history": runtime.history, "logs": runtime.logs}

    async def _run_task(self, runtime: WorkflowRuntime, task: dict) -> dict:
        if not runtime.condition_ok(task.get("condition")):
            runtime.event("task_skipped", task_id=task.get("id"), condition=task.get("condition"))
            return {"task_id": task.get("id"), "status": "skipped"}
        if task.get("human_approval"):
            runtime.status = "approval_required"
            artifact = {"id": _id("artifact"), "type": "approval_request", "task_id": task.get("id"), "title": task.get("title"), "created_at": now_iso(), "payload": {"variables": runtime.variables}}
            runtime.artifacts.append(artifact)
            runtime.event("approval_required", task_id=task.get("id"), artifact_id=artifact["id"])
            return {"task_id": task.get("id"), "status": "approval_required"}
        attempts = max(1, int((task.get("retry") or {}).get("max_attempts", 1)))
        started = time.monotonic()
        for attempt in range(1, attempts + 1):
            runtime.event("task_attempt", task_id=task.get("id"), attempt=attempt)
            await asyncio.sleep(0)
            if time.monotonic() - started > task.get("timeout_seconds", 60):
                runtime.log("error", "Task timed out", task_id=task.get("id"))
                continue
            artifact = {"id": _id("artifact"), "type": "task_output", "task_id": task.get("id"), "created_at": now_iso(), "payload": {"department": task.get("department"), "agent": task.get("agent"), "skill": task.get("skill"), "tool": task.get("tool"), "provider": task.get("provider"), "summary": f"Prepared output for {task.get('title')}"}}
            runtime.artifacts.append(artifact)
            runtime.event("task_completed", task_id=task.get("id"), artifact_id=artifact["id"])
            return {"task_id": task.get("id"), "status": "completed", "artifact_id": artifact["id"]}
        if task.get("fallback"):
            runtime.event("task_fallback", task_id=task.get("id"), fallback=task.get("fallback"))
            return {"task_id": task.get("id"), "status": "fallback", "fallback": task.get("fallback")}
        runtime.status = "failed"
        return {"task_id": task.get("id"), "status": "failed"}

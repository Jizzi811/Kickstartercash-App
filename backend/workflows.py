"""BrandMind generic workflow engine MVP.

Provides workspace/brand-scoped workflow runs, ordered steps, status changes,
artifacts, approval gates and retries. This module intentionally contains no
video generation, publishing or channel-specific execution logic.
"""
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Literal

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

from brandmind import current_user, workspace_from_request

_db = None
router = APIRouter(prefix="/api/workflows", tags=["workflows"])

WorkflowStatus = Literal["draft", "ready", "running", "waiting_approval", "completed", "failed", "cancelled"]
StepStatus = Literal["pending", "running", "waiting_approval", "approved", "rejected", "completed", "failed", "skipped"]
ApprovalStatus = Literal["pending", "approved", "rejected"]
ArtifactType = Literal["text", "json", "url", "file", "note"]

TERMINAL_WORKFLOW_STATUSES = {"completed", "failed", "cancelled"}


def init_workflows(db):
    global _db
    _db = db


def _require_db():
    if _db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    return _db


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def current_scoped_workspace(
    authorization: Optional[str] = Header(default=None),
    x_workspace_id: Optional[str] = Header(default=None, alias="X-Workspace-Id"),
):
    user = await current_user(authorization)
    workspace_id = await workspace_from_request(authorization, x_workspace_id)
    if not workspace_id:
        raise HTTPException(status_code=400, detail="Select a valid workspace first")
    return {"user": user, "workspace_id": workspace_id}


class WorkflowStepCreate(BaseModel):
    name: str
    description: str = ""
    kind: str = "manual"
    requires_approval: bool = False
    max_retries: int = 0
    assignee: str = ""


class WorkflowCreate(BaseModel):
    name: str
    description: str = ""
    brand_id: str = ""
    steps: List[WorkflowStepCreate] = Field(default_factory=list)


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    brand_id: Optional[str] = None
    status: Optional[WorkflowStatus] = None


class ArtifactCreate(BaseModel):
    step_id: Optional[str] = None
    type: ArtifactType = "note"
    name: str
    content: object = ""
    metadata: dict = Field(default_factory=dict)


class StepStatusUpdate(BaseModel):
    status: StepStatus
    note: str = ""


class RetryRequest(BaseModel):
    reason: str = ""


class ApprovalDecision(BaseModel):
    decision: ApprovalStatus
    note: str = ""


def _step_from_create(step: WorkflowStepCreate, index: int) -> dict:
    status = "waiting_approval" if step.requires_approval else "pending"
    approval_gate = None
    if step.requires_approval:
        approval_gate = {
            "id": str(uuid.uuid4()),
            "status": "pending",
            "requested_at": _now_iso(),
            "decided_at": "",
            "decided_by": "",
            "note": "",
        }
    return {
        "id": str(uuid.uuid4()),
        "order": index,
        "name": step.name.strip() or f"Step {index + 1}",
        "description": step.description.strip(),
        "kind": step.kind.strip() or "manual",
        "status": status,
        "requires_approval": step.requires_approval,
        "approval_gate": approval_gate,
        "retry_count": 0,
        "max_retries": max(step.max_retries, 0),
        "assignee": step.assignee.strip(),
        "started_at": "",
        "completed_at": "",
        "updated_at": _now_iso(),
        "last_error": "",
    }


def _workflow_progress(steps: List[dict]) -> dict:
    total = len(steps)
    done = len([s for s in steps if s.get("status") in {"completed", "skipped"}])
    failed = len([s for s in steps if s.get("status") == "failed"])
    approvals = len([s for s in steps if s.get("status") == "waiting_approval"])
    return {"total_steps": total, "completed_steps": done, "failed_steps": failed, "approval_gates_open": approvals, "percent": round((done / total) * 100) if total else 0}


def _shape(doc: dict) -> dict:
    doc = {k: v for k, v in doc.items() if k != "_id"}
    doc["progress"] = _workflow_progress(doc.get("steps", []))
    return doc


async def _get_owned(workflow_id: str, workspace_id: str) -> dict:
    doc = await _require_db().bm_workflows.find_one({"id": workflow_id, "workspace_id": workspace_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return doc


@router.get("")
async def list_workflows(scope=Depends(current_scoped_workspace), brand_id: str = ""):
    query = {"workspace_id": scope["workspace_id"]}
    if brand_id:
        query["brand_id"] = brand_id
    docs = await _require_db().bm_workflows.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return [_shape(d) for d in docs]


@router.post("")
async def create_workflow(payload: WorkflowCreate, scope=Depends(current_scoped_workspace)):
    if payload.brand_id:
        brand = await _require_db().brands.find_one({"id": payload.brand_id, "workspace_id": scope["workspace_id"]})
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found in this workspace")
    doc = {
        "id": str(uuid.uuid4()),
        "workspace_id": scope["workspace_id"],
        "brand_id": payload.brand_id,
        "name": payload.name.strip() or "Untitled workflow",
        "description": payload.description.strip(),
        "status": "ready" if payload.steps else "draft",
        "steps": [_step_from_create(s, i) for i, s in enumerate(payload.steps)],
        "artifacts": [],
        "created_by": scope["user"]["id"],
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
    }
    await _require_db().bm_workflows.insert_one(doc)
    return _shape(doc)


@router.get("/{workflow_id}")
async def get_workflow(workflow_id: str, scope=Depends(current_scoped_workspace)):
    return _shape(await _get_owned(workflow_id, scope["workspace_id"]))


@router.patch("/{workflow_id}")
async def update_workflow(workflow_id: str, payload: WorkflowUpdate, scope=Depends(current_scoped_workspace)):
    doc = await _get_owned(workflow_id, scope["workspace_id"])
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if update.get("status") == "running" and not doc.get("steps"):
        raise HTTPException(status_code=400, detail="Cannot run a workflow without steps")
    update["updated_at"] = _now_iso()
    await _require_db().bm_workflows.update_one({"id": workflow_id, "workspace_id": scope["workspace_id"]}, {"$set": update})
    doc.update(update)
    return _shape(doc)


@router.post("/{workflow_id}/artifacts")
async def add_artifact(workflow_id: str, payload: ArtifactCreate, scope=Depends(current_scoped_workspace)):
    doc = await _get_owned(workflow_id, scope["workspace_id"])
    if payload.step_id and payload.step_id not in {s["id"] for s in doc.get("steps", [])}:
        raise HTTPException(status_code=404, detail="Step not found")
    artifact = {"id": str(uuid.uuid4()), **payload.model_dump(), "created_by": scope["user"]["id"], "created_at": _now_iso()}
    await _require_db().bm_workflows.update_one({"id": workflow_id, "workspace_id": scope["workspace_id"]}, {"$push": {"artifacts": artifact}, "$set": {"updated_at": _now_iso()}})
    return artifact


@router.patch("/{workflow_id}/steps/{step_id}")
async def update_step_status(workflow_id: str, step_id: str, payload: StepStatusUpdate, scope=Depends(current_scoped_workspace)):
    doc = await _get_owned(workflow_id, scope["workspace_id"])
    steps = doc.get("steps", [])
    step = next((s for s in steps if s["id"] == step_id), None)
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    if payload.status == "completed" and step.get("requires_approval") and (step.get("approval_gate") or {}).get("status") != "approved":
        raise HTTPException(status_code=400, detail="Step requires approval before completion")
    step["status"] = payload.status
    step["updated_at"] = _now_iso()
    if payload.status == "running" and not step.get("started_at"):
        step["started_at"] = _now_iso()
    if payload.status in {"completed", "skipped"}:
        step["completed_at"] = _now_iso()
    if payload.status == "failed":
        step["last_error"] = payload.note
    status = doc.get("status")
    if any(s.get("status") == "waiting_approval" for s in steps):
        status = "waiting_approval"
    elif all(s.get("status") in {"completed", "skipped"} for s in steps) and steps:
        status = "completed"
    elif any(s.get("status") == "failed" for s in steps):
        status = "failed"
    elif any(s.get("status") == "running" for s in steps):
        status = "running"
    await _require_db().bm_workflows.update_one({"id": workflow_id, "workspace_id": scope["workspace_id"]}, {"$set": {"steps": steps, "status": status, "updated_at": _now_iso()}})
    doc.update({"steps": steps, "status": status})
    return _shape(doc)


@router.post("/{workflow_id}/steps/{step_id}/retry")
async def retry_step(workflow_id: str, step_id: str, payload: RetryRequest, scope=Depends(current_scoped_workspace)):
    doc = await _get_owned(workflow_id, scope["workspace_id"])
    steps = doc.get("steps", [])
    step = next((s for s in steps if s["id"] == step_id), None)
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    if step.get("retry_count", 0) >= step.get("max_retries", 0):
        raise HTTPException(status_code=400, detail="Retry limit reached")
    step["retry_count"] = step.get("retry_count", 0) + 1
    step["status"] = "pending"
    step["last_error"] = payload.reason
    step["updated_at"] = _now_iso()
    await _require_db().bm_workflows.update_one({"id": workflow_id, "workspace_id": scope["workspace_id"]}, {"$set": {"steps": steps, "status": "running", "updated_at": _now_iso()}})
    doc.update({"steps": steps, "status": "running"})
    return _shape(doc)


@router.post("/{workflow_id}/steps/{step_id}/approval")
async def decide_approval(workflow_id: str, step_id: str, payload: ApprovalDecision, scope=Depends(current_scoped_workspace)):
    if payload.decision == "pending":
        raise HTTPException(status_code=400, detail="Approval decision must be approved or rejected")
    doc = await _get_owned(workflow_id, scope["workspace_id"])
    steps = doc.get("steps", [])
    step = next((s for s in steps if s["id"] == step_id), None)
    if not step or not step.get("approval_gate"):
        raise HTTPException(status_code=404, detail="Approval gate not found")
    gate = step["approval_gate"]
    gate.update({"status": payload.decision, "decided_at": _now_iso(), "decided_by": scope["user"]["id"], "note": payload.note})
    step["status"] = "approved" if payload.decision == "approved" else "rejected"
    step["updated_at"] = _now_iso()
    workflow_status = "running" if payload.decision == "approved" else "failed"
    await _require_db().bm_workflows.update_one({"id": workflow_id, "workspace_id": scope["workspace_id"]}, {"$set": {"steps": steps, "status": workflow_status, "updated_at": _now_iso()}})
    doc.update({"steps": steps, "status": workflow_status})
    return _shape(doc)

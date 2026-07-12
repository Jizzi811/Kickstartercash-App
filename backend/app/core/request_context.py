"""Per-request context shared across layers without parameter plumbing.

server.py's workspace middleware resolves the caller's workspace (JWT +
X-Workspace-Id, validated against memberships) and stores it here; deep
layers like app.services.llm read it for quota checks and usage metering.
This avoids threading a workspace argument through every one of the legacy
call sites while the strangler-fig refactor is still in progress.

Background tasks run outside a request; they see None unless they set the
context themselves via set_workspace_id.
"""
from contextvars import ContextVar
from typing import Optional

_workspace_id: ContextVar[Optional[str]] = ContextVar("workspace_id", default=None)


def current_workspace_id() -> Optional[str]:
    return _workspace_id.get()


def set_workspace_id(workspace_id: Optional[str]):
    """Set the workspace for the current context; returns a reset token."""
    return _workspace_id.set(workspace_id)


def reset_workspace_id(token) -> None:
    _workspace_id.reset(token)

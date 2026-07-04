# Workspace Scoping (Multi-Tenancy Foundation)

Brandmind is multi-tenant: every user belongs to one or more **workspaces**, and
all brand/marketing data is isolated per workspace. This document describes how
that isolation works end to end and how to keep it intact when adding features.

## 1. Concepts

- **User** – an authenticated account (`bm_users`). Auth is stateless JWT.
- **Workspace** – a tenant boundary (`bm_workspaces`). All brand data hangs off a
  workspace via a `workspace_id` field on each record.
- **Membership** – links users to workspaces (`bm_memberships`).
- **Active workspace** – the workspace the user is currently working in. The
  frontend sends it on every request; the backend scopes reads/writes to it.

## 2. Request context (how the backend learns the workspace)

The frontend attaches two headers to every axios request (see
`frontend/src/context/AppContext.js`):

- `Authorization: Bearer <jwt>` – set whenever a token exists.
- `X-Workspace-Id: <workspaceId>` – set whenever an active workspace exists.

The backend resolves these into a validated workspace id via a single FastAPI
dependency (`backend/server.py`):

```python
async def current_workspace(authorization=Header(None),
                            x_workspace_id=Header(None, alias="X-Workspace-Id")) -> Optional[str]:
    # validates the JWT and that the user is a member of x_workspace_id
    return await workspace_from_request(authorization, x_workspace_id)  # or None
```

Endpoints opt in with `ws: Optional[str] = Depends(current_workspace)`.

## 3. The scope filter (single source of truth)

All scoped reads go through one helper so the semantics are consistent:

```python
def _scope_filter(ws: Optional[str]) -> dict:
    if ws:
        return {"workspace_id": ws}                       # authed → only this workspace
    return {"$or": [{"workspace_id": {"$exists": False}}, # legacy → only un-scoped data
                    {"workspace_id": {"$in": [None, ""]}}]}
```

- **Authenticated request** (`ws` set) → sees **only** its own workspace's records.
- **Legacy request** (`ws is None`, e.g. no auth) → sees **only** the original,
  un-scoped single-tenant data. This keeps old deployments working without ever
  exposing one tenant's data to another.

**Two rules for every data-bearing endpoint:**
1. **Reads** must filter with `_scope_filter(ws)` (or `{"id": x, **_scope_filter(ws)}`
   for by-id operations).
2. **Writes** must stamp the record with the active workspace: `workspace_id = ws`.

## 4. What is scoped

| Area | Collection | Reads | Writes |
|------|-----------|-------|--------|
| Brand Brain / brands | `brands` | `_scope_filter` on list; create stamps `workspace_id` | ✅ |
| Studio (image/social/campaign/etc.) | `history` | list via `_scope_filter` | every generate stamps `workspace_id` |
| Campaign Builder | `history` | via `_scope_filter` | stamps `workspace_id` |
| Knowledge Base | `knowledge` | `_scope_filter` on list + agent context | create stamps `workspace_id` |
| Agent Registry (custom agents) | `custom_agents` | `_scope_filter` on list; by-id ops scoped | create stamps `workspace_id` |
| History | `history` | `_scope_filter` | stamps `workspace_id` |

By-id **write** operations on custom agents (update / delete / document upload /
chat) use `{"id": agent_id, **_scope_filter(ws)}`, so a user can never modify or
read another workspace's agent even if they guess its id.

## 5. Frontend guards

`frontend/src/App.js` wraps the whole app (except `/auth`) in `AppShell`:

```jsx
if (!authReady) return <Splash/>;                 // avoid auth flicker
if (!isAuthenticated) return <Navigate to="/auth" replace/>;  // guard
return <Layout>…routes…</Layout>;
```

- **Route guard**: unauthenticated users are redirected to `/auth`.
- **Workspace switcher + active indicator**: `frontend/src/components/Layout.jsx`
  renders the active workspace name and a dropdown to `switchWorkspace(id)` or
  `createWorkspace({name})`. Switching persists to `localStorage` and updates the
  `X-Workspace-Id` header, so all subsequent requests are scoped to the new
  workspace.

## 6. Preventing data leakage – checklist for new endpoints

When you add an endpoint that touches tenant data:

- [ ] Add `ws: Optional[str] = Depends(current_workspace)`.
- [ ] Filter **every** read with `_scope_filter(ws)` (never a bare `find({})`).
- [ ] For by-id reads/writes use `{"id": x, **_scope_filter(ws)}`.
- [ ] Stamp `workspace_id = ws` on **every** insert.
- [ ] Never trust a client-supplied `workspace_id` in the body – always use the
      dependency-resolved `ws`.

## 7. Known, intentional exceptions

- **Kickstartercash / KASH tenant content** (default seed brand, KASH sales bot,
  funnel, daily reports) is legacy single-tenant data and is intentionally left
  un-scoped (visible only to legacy `ws=None` requests).
- **By-id brand lookups** used internally by generation (`_get_brand_or_404`) are
  not scoped, because generate endpoints already receive the `brand_id` the user
  selected from their own (scoped) brand list. The list endpoints — the actual
  leak surface — are scoped.

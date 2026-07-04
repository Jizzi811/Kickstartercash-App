"""Workspace-scoped semantic knowledge graph facade.

This module intentionally does not introduce a graph database. It projects the
current Mongo persistence layer into a typed node/edge graph behind small
interfaces so a native graph store can replace the implementation later.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional

from app.identity import service as identity_service
from app.memory import registry as mem_registry, router as mem_router
from app.skills import registry as skill_registry
from app.gateway import registry as gateway_registry
from app.workflows import engine as workflow_engine

ENTITY_TYPES = [
    "workspace", "brand", "brand_identity", "mission", "campaign", "workflow",
    "workflow_step", "agent", "skill", "tool", "provider", "memory", "insight",
    "asset", "approval", "task", "department", "document", "prompt",
    "customer_persona", "goal", "review", "experience_brain",
]

RELATIONSHIP_TYPES = [
    {"type": "owns", "from": "brand", "to": "campaign", "label": "Brand owns Campaign"},
    {"type": "contains", "from": "campaign", "to": "workflow", "label": "Campaign contains Workflow"},
    {"type": "contains", "from": "workflow", "to": "task", "label": "Workflow contains Tasks"},
    {"type": "assigned_to", "from": "task", "to": "agent", "label": "Task assigned to Agent"},
    {"type": "uses", "from": "agent", "to": "skill", "label": "Agent uses Skills"},
    {"type": "uses", "from": "skill", "to": "tool", "label": "Skill uses Tools"},
    {"type": "uses", "from": "tool", "to": "provider", "label": "Tool uses Provider"},
    {"type": "produces", "from": "campaign", "to": "asset", "label": "Campaign produces Assets"},
    {"type": "belongs_to", "from": "asset", "to": "brand", "label": "Assets belong to Brand"},
    {"type": "receives", "from": "asset", "to": "review", "label": "Assets receive Reviews"},
    {"type": "updates", "from": "review", "to": "experience_brain", "label": "Reviews update Experience Brain"},
    {"type": "references", "from": "memory", "to": "brand", "label": "Memory references Brand"},
    {"type": "references", "from": "insight", "to": "campaign", "label": "Insights reference Campaign"},
    {"type": "creates", "from": "goal", "to": "workflow", "label": "Goals create Workflows"},
]

@dataclass
class GraphSnapshot:
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    integrations: Dict[str, Any]

class GraphRepository:
    async def snapshot(self, *, db: Any, workspace_id: Optional[str], scope_filter: dict,
                       memory_context: str = "") -> GraphSnapshot:
        raise NotImplementedError

class MongoGraphRepository(GraphRepository):
    async def snapshot(self, *, db: Any, workspace_id: Optional[str], scope_filter: dict,
                       memory_context: str = "") -> GraphSnapshot:
        nodes: Dict[str, Dict[str, Any]] = {}
        edges: Dict[str, Dict[str, Any]] = {}

        def node(type_: str, id_: str, label: str, **props):
            if not id_:
                return None
            gid = f"{type_}:{id_}"
            nodes[gid] = {"id": gid, "object_id": id_, "type": type_, "label": label or id_, **props}
            return gid
        def edge(from_id: Optional[str], to_id: Optional[str], type_: str, label: str, **props):
            if not from_id or not to_id:
                return
            eid = f"{from_id}->{type_}->{to_id}"
            edges[eid] = {"id": eid, "from": from_id, "to": to_id, "type": type_, "label": label, **props}

        ws_node = node("workspace", workspace_id or "legacy", "Active Workspace", workspace_id=workspace_id or "")
        exp_node = node("experience_brain", workspace_id or "legacy", "Experience Brain")

        brands = await db.brands.find(scope_filter, {"_id": 0}).to_list(500) if db is not None else []
        brand_by_id = {}
        for b in brands:
            bid = b.get("id") or b.get("name")
            brand_by_id[bid] = b
            bn = node("brand", bid, b.get("name") or bid, workspace_id=b.get("workspace_id", ""))
            edge(ws_node, bn, "contains", "Workspace contains Brand")
            dna = identity_service.merged_dna(b)
            ident = node("brand_identity", bid, f"{b.get('name') or bid} Identity", dna=dna, completeness=identity_service.completeness(b))
            edge(bn, ident, "has_identity", "Brand uses Brand Identity Engine")
            if b.get("target_audience"):
                persona = node("customer_persona", bid, f"{b.get('name') or bid} Persona", audience=b.get("target_audience"))
                edge(bn, persona, "targets", "Brand targets Customer Persona")

        plans = await db.executive_plans.find(scope_filter, {"_id": 0}).to_list(500) if db is not None else []
        for p in plans:
            pn = node("campaign", p.get("id"), p.get("summary") or p.get("goal") or "Campaign", brand_id=p.get("brand_id", ""), source="mission_control")
            gn = node("goal", p.get("id"), p.get("goal") or "Goal", plan_id=p.get("id"))
            mn = node("mission", p.get("id"), "Mission Control Plan", status=p.get("status", ""))
            brand_node = f"brand:{p.get('brand_id')}" if p.get("brand_id") else None
            edge(brand_node, pn, "owns", "Brand owns Campaign")
            edge(pn, mn, "contains", "Campaign contains Mission")
            edge(gn, pn, "creates", "Goal creates Campaign")

        tasks = await db.mission_tasks.find(scope_filter, {"_id": 0}).to_list(1000) if db is not None else []
        for t in tasks:
            tn = node("task", t.get("id"), t.get("title") or "Task", status=t.get("status"), department=t.get("department"), priority=t.get("priority"))
            an = node("agent", t.get("owner_agent") or t.get("assigned_agent"), t.get("assigned_agent") or t.get("owner_agent") or "Agent")
            dn = node("department", t.get("department"), t.get("department", "Department").title())
            wf = node("workflow", t.get("plan_id") or t.get("linked_campaign") or t.get("goal"), t.get("linked_campaign") or t.get("goal") or "Mission Workflow")
            step = node("workflow_step", t.get("id"), f"Step: {t.get('title', 'Task')}")
            edge(wf, tn, "contains", "Workflow contains Tasks"); edge(wf, step, "contains", "Workflow contains Workflow Step")
            edge(tn, an, "assigned_to", "Task assigned to Agent"); edge(dn, tn, "owns", "Department owns Task")
            if t.get("plan_id"): edge(f"goal:{t.get('plan_id')}", wf, "creates", "Goals create Workflows")

        # Registry-derived agent/skill/tool/provider semantic backbone.
        for s in skill_registry.list_skills():
            sn = node("skill", s["id"], s["name"], category=s.get("category"), permissions=s.get("permissions", []))
            for tool in s.get("required_tools", []):
                to = node("tool", tool, tool.replace("_", " ").title())
                edge(sn, to, "uses", "Skill uses Tools")
                for pid in gateway_registry.PROVIDER_REGISTRY:
                    if pid in tool or tool in {"llm", "image", "search", "analysis"}:
                        edge(to, node("provider", pid, gateway_registry.PROVIDER_REGISTRY[pid].label), "uses", "Tool uses Provider")
        for agent_id in ["ceo", "marketing", "designer", "seo", "social", "content", "email"]:
            an = node("agent", agent_id, agent_id.title())
            for sid in mem_registry.brains_for_agent(agent_id):
                mn = node("memory", sid, mem_registry.BRAIN_META.get(sid, {}).get("label", sid), brain=sid)
                edge(an, mn, "routes_to", "Agent uses Memory Router")
            for s in skill_registry.skills_for_agent(agent_id)[:6]:
                edge(an, f"skill:{s['id']}", "uses", "Agent uses Skills")

        assets = await db.output_factory_assets.find(scope_filter, {"_id": 0}).to_list(1000) if db is not None else []
        for a in assets:
            aid = node("asset", a.get("id"), f"{a.get('type', 'Asset')} · {a.get('campaign', '')}", status=a.get("status"), brand_id=a.get("brand_id"), campaign=a.get("campaign"))
            edge(f"brand:{a.get('brand_id')}", aid, "owns", "Assets belong to Brand")
            cn = node("campaign", a.get("campaign"), a.get("campaign") or "Campaign")
            edge(cn, aid, "produces", "Campaign produces Assets")
            rv = node("review", a.get("id"), f"Review · {a.get('type', 'Asset')}", review=a.get("review"), quality_scores=a.get("quality_scores"))
            edge(aid, rv, "receives", "Assets receive Reviews"); edge(rv, exp_node, "updates", "Reviews update Experience Brain")
            if a.get("status") in {"Approved", "Ready", "Reviewing"}:
                ap = node("approval", a.get("id"), f"Approval · {a.get('status')}", status=a.get("status"))
                edge(aid, ap, "requires", "Asset requires Approval")

        kb = await db.knowledge_base.find(scope_filter, {"_id": 0}).to_list(500) if db is not None else []
        for k in kb:
            dn = node("document", k.get("id") or k.get("title"), k.get("title") or "Document", category=k.get("category"))
            mn = node("memory", k.get("id") or k.get("title"), k.get("title") or "Memory", content=(k.get("content") or "")[:240])
            edge(dn, mn, "stored_as", "Document stored as Memory")
            if k.get("brand_id"): edge(mn, f"brand:{k.get('brand_id')}", "references", "Memory references Brand")

        insights = await db.intelligence_events.find(scope_filter, {"_id": 0}).sort("created_at", -1).to_list(300) if db is not None else []
        for i, ev in enumerate(insights):
            ins = node("insight", ev.get("id") or str(i), ev.get("event_type") or "Insight", payload=ev)
            camp = ev.get("campaign") or ev.get("campaign_id")
            if camp: edge(ins, node("campaign", camp, camp), "references", "Insights reference Campaign")

        return GraphSnapshot(list(nodes.values()), list(edges.values()), {
            "memory_router": {"brains": mem_registry.BRAIN_META, "context_preview": memory_context[:1000]},
            "brand_identity_engine": True,
            "mission_control": True,
            "persistence": "current_mongo_collections",
            "graph_database": False,
        })


def registry_payload() -> Dict[str, Any]:
    return {"entities": ENTITY_TYPES, "relationships": RELATIONSHIP_TYPES, "interfaces": ["GraphRepository", "MongoGraphRepository"]}

def search_graph(snapshot: GraphSnapshot, query: str, entity_type: Optional[str] = None, limit: int = 25) -> List[Dict[str, Any]]:
    q = (query or "").lower()
    out = []
    for n in snapshot.nodes:
        hay = " ".join([str(n.get("label", "")), str(n.get("object_id", "")), str(n.get("type", "")), str(n.get("campaign", ""))]).lower()
        if (not entity_type or n.get("type") == entity_type) and (not q or q in hay):
            out.append(n)
    return out[:limit]

def related(snapshot: GraphSnapshot, node_id: str, limit: int = 30) -> Dict[str, Any]:
    rel_edges = [e for e in snapshot.edges if e["from"] == node_id or e["to"] == node_id]
    ids = {e["to"] if e["from"] == node_id else e["from"] for e in rel_edges}
    nodes = [n for n in snapshot.nodes if n["id"] in ids][:limit]
    return {"node_id": node_id, "nodes": nodes, "edges": rel_edges[:limit]}

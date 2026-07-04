import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { API } from "@/context/AppContext";
import { Network, Search, Boxes, Link2, Image, Megaphone, Brain, ShieldCheck } from "lucide-react";

const V = "#7C3AED";
const Card = ({ children, className = "" }) => <div className={`rounded-sm border border-white/10 bg-white/[0.025] ${className}`}>{children}</div>;

export default function KnowledgeExplorer() {
  const [graph, setGraph] = useState({ nodes: [], edges: [], integrations: {} });
  const [registry, setRegistry] = useState(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [selected, setSelected] = useState(null);
  const [related, setRelated] = useState({ nodes: [], edges: [] });

  const load = useCallback(async () => {
    try {
      const [g, r] = await Promise.all([axios.get(`${API}/knowledge-graph`), axios.get(`${API}/knowledge-graph/registry`)]);
      setGraph(g.data); setRegistry(r.data); setSelected(g.data.nodes?.[0] || null);
    } catch { toast.error("Knowledge Graph could not be loaded"); }
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selected?.id) return;
    axios.get(`${API}/knowledge-graph/related/${encodeURIComponent(selected.id)}`).then((r) => setRelated(r.data)).catch(() => setRelated({ nodes: [], edges: [] }));
  }, [selected]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return graph.nodes.filter((n) => (!type || n.type === type) && (!q || `${n.label} ${n.type} ${n.object_id}`.toLowerCase().includes(q))).slice(0, 80);
  }, [graph.nodes, query, type]);

  const byType = useMemo(() => graph.nodes.reduce((acc, n) => ({ ...acc, [n.type]: (acc[n.type] || 0) + 1 }), {}), [graph.nodes]);
  const relatedByType = (t) => related.nodes.filter((n) => n.type === t);

  return <div className="space-y-8 pb-10">
    <section className="rounded-sm border border-[#7C3AED]/25 bg-[#7C3AED]/[0.06] p-7">
      <div className="inline-flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase font-bold text-[#7C3AED]"><Network size={13}/> BrandMind Knowledge Graph</div>
      <h1 className="mt-3 text-3xl font-bold text-white">Knowledge Explorer</h1>
      <p className="mt-2 max-w-3xl text-sm text-zinc-400">Workspace-scoped semantic navigation across brands, campaigns, workflows, tasks, agents, skills, tools, providers, memories, insights, assets, approvals, personas, goals, and Mission Control objects.</p>
    </section>

    <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
      {[{icon: Boxes, label:"Entities", value: graph.nodes.length}, {icon: Link2, label:"Relationships", value: graph.edges.length}, {icon: Brain, label:"Memory Router", value: graph.integrations?.memory_router ? "On" : "Off"}, {icon: ShieldCheck, label:"Brand Identity", value: graph.integrations?.brand_identity_engine ? "On" : "Off"}].map(x => { const I=x.icon; return <Card key={x.label} className="p-4"><I size={16} style={{color:V}}/><div className="mt-3 text-xs text-zinc-500 uppercase tracking-wider">{x.label}</div><div className="mt-1 text-xl font-bold text-white">{x.value}</div></Card>; })}
    </section>

    <section className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4">
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2 rounded-sm border border-white/10 bg-black/30 px-3 py-2"><Search size={15} className="text-zinc-500"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search graph…" className="w-full bg-transparent text-sm text-white outline-none"/></div>
        <select value={type} onChange={(e)=>setType(e.target.value)} className="w-full rounded-sm border border-white/10 bg-black p-2 text-sm text-white"><option value="">All entity types</option>{(registry?.entities || []).map((e)=><option key={e} value={e}>{e}</option>)}</select>
        <div className="max-h-[620px] overflow-auto space-y-2 pr-1">{filtered.map((n)=><button key={n.id} onClick={()=>setSelected(n)} className={`w-full rounded-sm border p-3 text-left ${selected?.id === n.id ? "border-[#7C3AED] bg-[#7C3AED]/10" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"}`}><div className="text-sm font-semibold text-white">{n.label}</div><div className="mt-1 text-[11px] uppercase tracking-wider text-zinc-500">{n.type}</div></button>)}</div>
      </Card>

      <div className="space-y-4">
        <Card className="p-5"><h2 className="font-bold text-white">Entity Explorer</h2>{selected ? <><div className="mt-3 text-2xl font-bold text-white">{selected.label}</div><div className="mt-1 text-xs uppercase tracking-wider text-zinc-500">{selected.id}</div><pre className="mt-4 max-h-56 overflow-auto rounded-sm bg-black/40 p-3 text-xs text-zinc-300">{JSON.stringify(selected, null, 2)}</pre></> : <p className="mt-3 text-sm text-zinc-500">Select an entity to inspect.</p>}</Card>
        <Card className="p-5"><h2 className="font-bold text-white">Relationship Viewer</h2><div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">{related.edges.map((e)=><div key={e.id} className="rounded-sm border border-white/10 p-3 text-xs text-zinc-300"><span className="text-[#7C3AED]">{e.type}</span> · {e.label}</div>)}</div></Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <RelatedPanel icon={Image} title="Related Assets" nodes={relatedByType("asset")} />
          <RelatedPanel icon={Megaphone} title="Related Campaigns" nodes={relatedByType("campaign")} />
          <RelatedPanel icon={Brain} title="Related Memories" nodes={relatedByType("memory")} />
        </div>
        <Card className="p-5"><h2 className="font-bold text-white">Graph Search & Visualization API</h2><div className="mt-3 flex flex-wrap gap-2">{Object.entries(byType).map(([k,v])=><span key={k} className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">{k}: {v}</span>)}</div><p className="mt-4 text-xs text-zinc-500">APIs: /api/knowledge-graph, /api/knowledge-graph/search, /api/knowledge-graph/related/:node_id, /api/knowledge-graph/visualization.</p></Card>
      </div>
    </section>
  </div>;
}

function RelatedPanel({ icon: Icon, title, nodes }) {
  return <Card className="p-4"><h3 className="flex items-center gap-2 font-bold text-white"><Icon size={15} style={{color:V}}/> {title}</h3><div className="mt-3 space-y-2">{nodes.length ? nodes.map((n)=><div key={n.id} className="rounded border border-white/10 p-2 text-sm text-zinc-300">{n.label}</div>) : <div className="text-sm text-zinc-600">No direct suggestions yet.</div>}</div></Card>;
}

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { API } from "@/context/AppContext";
import { PageHeader } from "@/components/PageHeader";
import { Network, Search, Boxes, Link2, Image, Megaphone, Brain, ShieldCheck, Workflow, Eye, Wrench, Sparkles, Building2, Palette, Target, BarChart3, Bot, FileText, GitBranch, Database, ArrowRight, Clock3, CircleDot } from "lucide-react";

const V = "#7C3AED";
const Card = ({ children, className = "" }) => <div className={`rounded-2xl border border-white/10 bg-white/[0.035] shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur ${className}`}>{children}</div>;

const TYPE_META = {
  workspace: { icon: "🏢", label: "Workspace", Icon: Building2 }, brand: { icon: "🎨", label: "Brand", Icon: Palette }, brand_identity: { icon: "🧬", label: "Brand Identity", Icon: ShieldCheck }, experience_brain: { icon: "🧠", label: "Experience Brain", Icon: Brain }, mission: { icon: "🎯", label: "Mission Control", Icon: Target }, campaign: { icon: "📈", label: "Campaign", Icon: Megaphone }, workflow: { icon: "⚙️", label: "Workflow", Icon: Workflow }, workflow_step: { icon: "🔁", label: "Workflow Step", Icon: Workflow }, agent: { icon: "🤖", label: "Agent", Icon: Bot }, skill: { icon: "✨", label: "Skill", Icon: Sparkles }, tool: { icon: "🧰", label: "Tool", Icon: Wrench }, provider: { icon: "🔌", label: "Provider", Icon: Link2 }, memory: { icon: "🧠", label: "Memory", Icon: Brain }, insight: { icon: "💡", label: "Insight", Icon: Sparkles }, asset: { icon: "🖼️", label: "Asset", Icon: Image }, approval: { icon: "✅", label: "Approval", Icon: ShieldCheck }, task: { icon: "📌", label: "Task", Icon: CircleDot }, department: { icon: "🏛️", label: "Department", Icon: Building2 }, document: { icon: "📄", label: "Document", Icon: FileText }, prompt: { icon: "💬", label: "Prompt", Icon: FileText }, customer_persona: { icon: "👥", label: "Customer Persona", Icon: Target }, goal: { icon: "🏁", label: "Goal", Icon: Target }, review: { icon: "⭐", label: "Review", Icon: BarChart3 },
};
const titleize = (s = "") => TYPE_META[s]?.label || s.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
const iconFor = (type) => TYPE_META[type]?.icon || "●";
const prettyRel = (edge) => (edge?.label || edge?.type || "related to").replace(/([a-z])([A-Z])/g, "$1 $2");
const compact = (value) => value === undefined || value === null || value === "" ? "—" : Array.isArray(value) ? value.join(", ") : typeof value === "object" ? Object.keys(value).length : String(value);

export default function KnowledgeExplorer() {
  const [graph, setGraph] = useState({ nodes: [], edges: [], integrations: {} });
  const [registry, setRegistry] = useState(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [selected, setSelected] = useState(null);
  const [related, setRelated] = useState({ nodes: [], edges: [] });
  const [developerMode, setDeveloperMode] = useState(false);

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
  const relatedByType = (types) => related.nodes.filter((n) => (Array.isArray(types) ? types : [types]).includes(n.type));
  const nodeById = useMemo(() => Object.fromEntries(graph.nodes.map((n) => [n.id, n])), [graph.nodes]);
  const activeEdges = useMemo(() => related.edges.map((e) => ({ ...e, other: e.from === selected?.id ? nodeById[e.to] : nodeById[e.from], direction: e.from === selected?.id ? "out" : "in" })).filter((e) => e.other), [related.edges, selected?.id, nodeById]);

  return <div className="space-y-8 pb-10 font-['Sora',ui-sans-serif,system-ui]">
    <PageHeader
      icon={Network}
      badge="Brandmind Knowledge Graph"
      title="Knowledge Explorer"
      subtitle="A premium business view of your workspace intelligence: brands, campaigns, assets, workflows, memories and AI systems — connected in one navigable knowledge layer."
      actions={<ViewToggle developerMode={developerMode} setDeveloperMode={setDeveloperMode} />}
    />

    <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
      {[{icon: Boxes, label:"Entities", value: graph.nodes.length}, {icon: Link2, label:"Relationships", value: graph.edges.length}, {icon: Brain, label:"Memory Router", value: graph.integrations?.memory_router ? "On" : "Off"}, {icon: ShieldCheck, label:"Brand Identity", value: graph.integrations?.brand_identity_engine ? "On" : "Off"}].map(x => { const I=x.icon; return <Card key={x.label} className="p-4"><I size={16} style={{color:V}}/><div className="mt-3 text-xs text-zinc-500 uppercase tracking-wider">{x.label}</div><div className="mt-1 text-xl font-bold text-white">{x.value}</div></Card>; })}
    </section>

    <section className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4">
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2"><Search size={15} className="text-zinc-500"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search graph…" className="w-full bg-transparent text-sm text-white outline-none"/></div>
        <select value={type} onChange={(e)=>setType(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black p-2 text-sm text-white"><option value="">All entity types</option>{(registry?.entities || []).map((e)=><option key={e} value={e}>{titleize(e)}</option>)}</select>
        <div className="max-h-[720px] overflow-auto space-y-2 pr-1">{filtered.map((n)=><button key={n.id} onClick={()=>setSelected(n)} className={`w-full rounded-2xl border p-3 text-left transition ${selected?.id === n.id ? "border-[#7C3AED] bg-[#7C3AED]/15" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"}`}><div className="flex items-center gap-2 text-sm font-semibold text-white"><span>{iconFor(n.type)}</span>{n.label}</div><div className="mt-1 text-[11px] uppercase tracking-wider text-zinc-500">{titleize(n.type)}{developerMode && ` · ${n.id}`}</div></button>)}</div>
      </Card>

      <div className="space-y-4">
        <EntityProfile selected={selected} developerMode={developerMode} />
        <RelationshipMap selected={selected} edges={activeEdges} onSelect={setSelected} />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <RelatedPanel icon={Megaphone} title="Related Campaigns" nodes={relatedByType("campaign")} onSelect={setSelected} />
          <RelatedPanel icon={Image} title="Related Assets" nodes={relatedByType("asset")} onSelect={setSelected} />
          <RelatedPanel icon={Brain} title="Related Memories" nodes={relatedByType(["memory", "document"])} onSelect={setSelected} />
          <RelatedPanel icon={Workflow} title="Related Workflows" nodes={relatedByType(["workflow", "workflow_step", "task"])} onSelect={setSelected} />
        </div>
        <Card className="p-5"><h2 className="font-bold text-white">Business Graph Overview</h2><div className="mt-3 flex flex-wrap gap-2">{Object.entries(byType).map(([k,v])=><button key={k} onClick={()=>setType(k)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300 hover:border-[#7C3AED]/60 hover:text-white">{iconFor(k)} {titleize(k)}: {v}</button>)}</div>{developerMode && <p className="mt-4 text-xs text-zinc-500">APIs: /api/knowledge-graph, /api/knowledge-graph/search, /api/knowledge-graph/related/:node_id, /api/knowledge-graph/visualization.</p>}</Card>
      </div>
    </section>
  </div>;
}

function ViewToggle({ developerMode, setDeveloperMode }) {
  return <div className="inline-flex rounded-full border border-white/10 bg-black/35 p-1 text-xs font-bold text-zinc-300"><button onClick={()=>setDeveloperMode(false)} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 ${!developerMode ? "bg-white text-zinc-950" : "hover:text-white"}`}><Eye size={13}/> Business View</button><button onClick={()=>setDeveloperMode(true)} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 ${developerMode ? "bg-[#7C3AED] text-white" : "hover:text-white"}`}><Wrench size={13}/> Developer View</button></div>;
}

function EntityProfile({ selected, developerMode }) {
  if (!selected) return <Card className="p-5"><p className="text-sm text-zinc-500">Select an entity to inspect.</p></Card>;
  const meta = TYPE_META[selected.type] || {}; const Icon = meta.Icon || Database;
  const highlights = [{ label: "Type", value: titleize(selected.type) }, { label: "Status", value: selected.status }, { label: "Campaign", value: selected.campaign }, { label: "Completeness", value: selected.completeness ? `${selected.completeness}%` : null }].filter((x) => x.value);
  return <Card className="overflow-hidden"><div className="border-b border-white/10 bg-gradient-to-r from-[#7C3AED]/30 via-[#7C3AED]/10 to-transparent p-5"><div className="flex items-start justify-between gap-4"><div><div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-violet-100"><Icon size={13}/> {titleize(selected.type)}</div><h2 className="mt-3 text-3xl font-black text-white">{selected.label}</h2></div><div className="text-4xl">{iconFor(selected.type)}</div></div></div><div className="p-5"><div className="grid grid-cols-1 md:grid-cols-4 gap-3">{highlights.map((h)=><Metric key={h.label} {...h} />)}<Metric label="Connected" value="Live Graph" /></div><div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3"><Info label="Business Summary" value={summaryFor(selected)} /><Info label="Primary Context" value={contextFor(selected)} /></div>{developerMode && <div className="mt-5"><div className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Developer Details · IDs & Raw JSON</div><pre className="max-h-72 overflow-auto rounded-xl border border-white/10 bg-black/50 p-3 text-xs text-zinc-300">{JSON.stringify(selected, null, 2)}</pre></div>}</div></Card>;
}

function Metric({ label, value }) { return <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div><div className="mt-1 text-sm font-bold text-white">{compact(value)}</div></div>; }
function Info({ label, value }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"><div className="text-xs font-bold uppercase tracking-wider text-zinc-500">{label}</div><div className="mt-2 text-sm leading-6 text-zinc-300">{value}</div></div>; }
function summaryFor(n) { if (n.type === "workspace") return "Central operating layer that connects BrandMind brands, strategic systems, AI agents, workflows and knowledge assets."; if (n.type === "brand_identity") return "Brand DNA, positioning and identity signals used to keep generated work consistent."; if (n.type === "experience_brain") return "Learning layer that receives reviews and performance feedback to improve future recommendations."; return `${titleize(n.type)} profile connected to the active BrandMind workspace knowledge graph.`; }
function contextFor(n) { return compact(n.audience || n.content || n.goal || n.department || n.category || n.brain || n.source || n.brand_id || n.campaign || "No additional business context captured yet."); }

function RelationshipMap({ selected, edges, onSelect }) {
  return <Card className="p-5"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-bold text-white"><GitBranch size={17} style={{color:V}}/> Relationship Viewer</h2><span className="text-xs text-zinc-500">Click any node to navigate</span></div>{selected ? <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5"><div className="flex flex-col gap-4"><div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-[#7C3AED]/40 bg-[#7C3AED]/15 px-4 py-3 text-white"><span className="text-2xl">{iconFor(selected.type)}</span><div><div className="font-bold">{selected.label}</div><div className="text-xs text-zinc-400">{titleize(selected.type)}</div></div></div><div className="ml-5 border-l border-dashed border-[#7C3AED]/50 pl-5 space-y-3">{edges.length ? edges.slice(0, 12).map((e)=><button key={e.id} onClick={()=>onSelect(e.other)} className="group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3 text-left hover:border-[#7C3AED]/70 hover:bg-[#7C3AED]/10"><ArrowRight size={14} className="text-[#7C3AED]"/><span className="text-2xl">{iconFor(e.other.type)}</span><span className="flex-1"><span className="block text-sm font-bold text-white">{e.other.label}</span><span className="block text-xs text-zinc-500">{prettyRel(e)} · {titleize(e.other.type)}</span></span></button>) : <div className="text-sm text-zinc-600">No direct relationships found yet.</div>}</div></div></div> : <p className="mt-3 text-sm text-zinc-500">Select an entity to inspect relationships.</p>}</Card>;
}

function RelatedPanel({ icon: Icon, title, nodes, onSelect }) {
  return <Card className="p-4"><h3 className="flex items-center gap-2 font-bold text-white"><Icon size={15} style={{color:V}}/> {title}</h3><div className="mt-3 space-y-2">{nodes.length ? nodes.map((n)=><button key={n.id} onClick={()=>onSelect(n)} className="w-full rounded-xl border border-white/10 p-2 text-left text-sm text-zinc-300 hover:border-[#7C3AED]/60 hover:text-white"><span className="mr-2">{iconFor(n.type)}</span>{n.label}</button>) : <div className="flex items-center gap-2 text-sm text-zinc-600"><Clock3 size={13}/> No direct suggestions yet.</div>}</div></Card>;
}

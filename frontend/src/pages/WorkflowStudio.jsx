import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Activity, AlertCircle, BarChart3, GitBranch, History, Network, Play, RefreshCw, Workflow } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { AgentChatPanel } from "@/components/StudioLayout";
import { PageHeader } from "@/components/PageHeader";

const COLOR = "#F97316";
const TYPE_LABELS = ["marketing", "sales", "seo", "content", "video", "image", "research", "automation", "support", "business", "publishing"];

function Stat({ label, value, icon: Icon }) {
  return <div className="bg-[#0A0A0A] border border-white/10 rounded-sm p-4"><div className="flex items-center gap-2 text-zinc-500 text-[10px] uppercase tracking-widest"><Icon className="w-4 h-4" />{label}</div><div className="text-2xl font-semibold text-white mt-2">{value}</div></div>;
}

function TaskNode({ task }) {
  return <div className="rounded-sm border border-white/10 bg-black/40 p-3">
    <div className="flex items-center justify-between gap-3"><p className="text-sm text-white font-medium">{task.title}</p><span className="text-[9px] uppercase tracking-widest text-orange-300">{task.mode || "sequential"}</span></div>
    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
      <span>🏢 {task.department}</span><span>🤖 {task.agent}</span><span>🧠 {task.skill}</span><span>🛠 {task.tool}</span>
    </div>
    <div className="mt-2 flex flex-wrap gap-1">
      {task.human_approval && <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px]">Human approval</span>}
      {task.condition && <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[10px]">Conditional</span>}
      {task.fallback && <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 text-[10px]">Fallback</span>}
      <span className="px-2 py-0.5 rounded bg-white/5 text-zinc-300 text-[10px]">Retry {task.retry?.max_attempts || 1}x</span>
      <span className="px-2 py-0.5 rounded bg-white/5 text-zinc-300 text-[10px]">{task.timeout_seconds}s timeout</span>
    </div>
  </div>;
}

export default function WorkflowStudio() {
  const { lang, activeBrandId } = useApp();
  const [registry, setRegistry] = useState(null);
  const [selectedId, setSelectedId] = useState("brand_campaign_launch");
  const [selectedType, setSelectedType] = useState("all");
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(false);
  const [variablesText, setVariablesText] = useState('{\n  "campaign_goal": "Launch BrandMind Workflow OS",\n  "approval_required": true\n}');

  useEffect(() => {
    axios.get(`${API}/workflows/registry`).then((res) => setRegistry(res.data)).catch(() => toast.error("Workflow registry unavailable"));
  }, []);

  const templates = useMemo(() => (registry?.templates || []).filter((t) => selectedType === "all" || t.type === selectedType), [registry, selectedType]);
  const selected = useMemo(() => templates.find((t) => t.id === selectedId) || registry?.templates?.find((t) => t.id === selectedId) || templates[0], [templates, selectedId, registry]);
  const stageCount = selected?.stages?.length || 0;
  const taskCount = selected?.stages?.reduce((n, s) => n + (s.tasks?.length || 0), 0) || 0;
  const parallelCount = selected?.stages?.filter((s) => s.mode === "parallel").length || 0;
  const approvalCount = selected?.stages?.flatMap((s) => s.tasks || []).filter((t) => t.human_approval).length || 0;

  const runWorkflow = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const variables = JSON.parse(variablesText || "{}");
      const res = await axios.post(`${API}/workflows/run`, { template_id: selected.id, variables, brand_id: activeBrandId, context: { source: "workflow_builder" } });
      setRun(res.data);
      toast.success(res.data.status === "approval_required" ? "Workflow waiting for approval" : "Workflow run completed");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Workflow run failed");
    } finally { setLoading(false); }
  };

  return <div className="space-y-8">
    <PageHeader icon={Workflow} color={COLOR} title="Workflow Composer Engine" badge="AI Operating System" subtitle={lang === "DE" ? "Workflow Registry · Engine · Runtime · Builder · Debug · Analytics" : "Workflow Registry · Engine · Runtime · Builder · Debug · Analytics"} />

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Stat label="Stages" value={stageCount} icon={Network} /><Stat label="Tasks" value={taskCount} icon={Activity} /><Stat label="Parallel" value={parallelCount} icon={GitBranch} /><Stat label="Approvals" value={approvalCount} icon={AlertCircle} />
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      <div className="xl:col-span-3 space-y-5">
        <section className="bg-[#0A0A0A] border border-white/10 rounded-sm p-5">
          <div className="flex items-center justify-between gap-3 mb-4"><div><p className="text-[10px] text-zinc-500 uppercase tracking-widest">Workflow Templates</p><h2 className="text-xl text-white font-semibold">Workflow Builder</h2></div><button onClick={runWorkflow} disabled={loading || !selected} className="px-4 py-2 rounded-sm text-black font-semibold flex items-center gap-2" style={{ background: COLOR }}>{loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}Run</button></div>
          <div className="flex flex-wrap gap-2 mb-4"><button onClick={() => setSelectedType("all")} className={`px-3 py-1 rounded-full text-xs ${selectedType === "all" ? "bg-white text-black" : "bg-white/5 text-zinc-400"}`}>All</button>{TYPE_LABELS.map((type) => <button key={type} onClick={() => setSelectedType(type)} className={`px-3 py-1 rounded-full text-xs capitalize ${selectedType === type ? "bg-white text-black" : "bg-white/5 text-zinc-400"}`}>{type}</button>)}</div>
          <div className="grid sm:grid-cols-3 gap-3">{templates.map((t) => <motion.button whileHover={{ y: -2 }} key={t.id} onClick={() => setSelectedId(t.id)} className={`text-left p-4 rounded-sm border ${selected?.id === t.id ? "border-orange-400 bg-orange-500/10" : "border-white/10 bg-black/30"}`}><p className="text-white font-medium">{t.name}</p><p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">{t.description}</p><p className="text-[10px] text-orange-300 uppercase tracking-widest mt-3">{t.type} · v{t.version}</p></motion.button>)}</div>
        </section>

        {selected && <section className="bg-[#0A0A0A] border border-white/10 rounded-sm p-5"><div className="flex items-center gap-2 mb-4"><Network className="w-5 h-5" style={{ color: COLOR }} /><div><p className="text-[10px] text-zinc-500 uppercase tracking-widest">Visual Workflow Editor</p><h2 className="text-xl text-white font-semibold">{selected.name}</h2></div></div><div className="space-y-4">{selected.stages.map((stage, index) => <div key={stage.id} className="border border-white/10 rounded-sm p-4 bg-white/[0.02]"><div className="flex items-center justify-between mb-3"><h3 className="text-white font-semibold">{index + 1}. {stage.name}</h3><span className="text-[10px] uppercase tracking-widest text-zinc-400">{stage.mode}</span></div><div className="grid md:grid-cols-2 gap-3">{stage.tasks.map((task) => <TaskNode key={task.id} task={task} />)}</div></div>)}</div></section>}
      </div>

      <div className="xl:col-span-2 space-y-5">
        <section className="bg-[#0A0A0A] border border-white/10 rounded-sm p-5"><p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Workflow Variables</p><textarea value={variablesText} onChange={(e) => setVariablesText(e.target.value)} className="w-full min-h-36 bg-black/60 border border-white/10 rounded-sm p-3 text-sm text-zinc-200 font-mono" /></section>
        <section className="bg-[#0A0A0A] border border-white/10 rounded-sm p-5"><div className="flex items-center gap-2 mb-3"><History className="w-4 h-4" style={{ color: COLOR }} /><p className="text-[10px] text-zinc-500 uppercase tracking-widest">Workflow Timeline & Debug View</p></div>{run ? <div className="space-y-3"><div className="flex items-center justify-between"><span className="text-white font-semibold">{run.run_id}</span><span className="text-xs text-orange-300">{run.status}</span></div><div className="max-h-72 overflow-auto space-y-2">{run.history.map((h, i) => <div key={i} className="text-xs border-l border-orange-400/40 pl-3 py-1"><p className="text-zinc-200">{h.event}</p><p className="text-zinc-600">{h.ts}</p></div>)}</div><div><p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Artifacts</p><div className="grid grid-cols-2 gap-2">{run.artifacts.map((a) => <span key={a.id} className="text-[10px] bg-white/5 rounded p-2 text-zinc-300">{a.type}<br />{a.task_id}</span>)}</div></div></div> : <p className="text-sm text-zinc-500">Run a workflow to inspect history, logs, approval requests, artifacts, retry attempts and runtime status.</p>}</section>
        <section className="bg-[#0A0A0A] border border-white/10 rounded-sm p-5"><div className="flex items-center gap-2 mb-2"><BarChart3 className="w-4 h-4" style={{ color: COLOR }} /><p className="text-[10px] text-zinc-500 uppercase tracking-widest">Workflow Analytics</p></div><div className="grid grid-cols-3 gap-2 text-center"><div className="bg-white/5 p-3 rounded"><p className="text-lg text-white">{run?.artifacts?.length || 0}</p><p className="text-[10px] text-zinc-500">Artifacts</p></div><div className="bg-white/5 p-3 rounded"><p className="text-lg text-white">{run?.logs?.length || 0}</p><p className="text-[10px] text-zinc-500">Logs</p></div><div className="bg-white/5 p-3 rounded"><p className="text-lg text-white">{run?.history?.length || 0}</p><p className="text-[10px] text-zinc-500">Events</p></div></div></section>
        <div className="bg-[#0A0A0A] border border-white/8 rounded-sm min-h-[420px]"><AgentChatPanel agentId="workflow" agentName="Wren – Workflow Architect" agentEmoji="⚙️" color={COLOR} placeholder="Ask Wren to compose or debug a workflow…" /></div>
      </div>
    </div>
  </div>;
}

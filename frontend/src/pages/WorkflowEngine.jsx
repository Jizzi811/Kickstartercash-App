import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Check, Clock, GitBranch, Plus, RefreshCw, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import { API, useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const COLOR = "#7C3AED";

const STATUS = {
  draft: { label: "Draft", color: "#71717a" },
  ready: { label: "Ready", color: "#60A5FA" },
  running: { label: "Running", color: "#C084FC" },
  waiting_approval: { label: "Approval", color: "#FBBF24" },
  completed: { label: "Completed", color: "#34D399" },
  failed: { label: "Failed", color: "#F87171" },
  cancelled: { label: "Cancelled", color: "#71717a" },
  pending: { label: "Pending", color: "#71717a" },
  approved: { label: "Approved", color: "#34D399" },
  rejected: { label: "Rejected", color: "#F87171" },
  skipped: { label: "Skipped", color: "#71717a" },
};

function Pill({ status }) {
  const cfg = STATUS[status] || STATUS.pending;
  return <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-semibold" style={{ color: cfg.color, background: `${cfg.color}18`, border: `1px solid ${cfg.color}35` }}>{cfg.label}</span>;
}

function CreateWorkflow({ brands, lang, onCreated }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [brandId, setBrandId] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState([
    { name: "Briefing", description: "Collect inputs and scope", requires_approval: false, max_retries: 1 },
    { name: "Human approval", description: "Approve direction before execution", requires_approval: true, max_retries: 0 },
    { name: "Finalize artifact", description: "Package approved output", requires_approval: false, max_retries: 1 },
  ]);

  const setStep = (idx, key, value) => setSteps((prev) => prev.map((s, i) => i === idx ? { ...s, [key]: value } : s));

  const submit = async () => {
    if (!name.trim()) return toast.error(lang === "DE" ? "Name ist erforderlich" : "Name is required");
    setLoading(true);
    try {
      const res = await axios.post(`${API}/workflows`, { name, brand_id: brandId, description, steps });
      onCreated(res.data);
      setOpen(false);
      toast.success(lang === "DE" ? "Workflow erstellt" : "Workflow created");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Workflow error");
    } finally { setLoading(false); }
  };

  if (!open) return <Button onClick={() => setOpen(true)} className="bg-[#7C3AED] hover:bg-[#6D28D9]"><Plus size={16} /> {lang === "DE" ? "Workflow anlegen" : "Create workflow"}</Button>;

  return (
    <div className="p-5 rounded-sm border border-white/10 bg-[#0A0A0A] space-y-4">
      <div className="grid md:grid-cols-2 gap-3">
        <input className="bg-black/40 border border-white/10 rounded-sm px-3 py-2 text-sm" placeholder="Workflow name" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="bg-black/40 border border-white/10 rounded-sm px-3 py-2 text-sm" value={brandId} onChange={(e) => setBrandId(e.target.value)}>
          <option value="">{lang === "DE" ? "Keine Marke / generisch" : "No brand / generic"}</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <textarea className="w-full bg-black/40 border border-white/10 rounded-sm px-3 py-2 text-sm min-h-[70px]" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="space-y-2">
        {steps.map((step, idx) => (
          <div key={idx} className="grid md:grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
            <input className="bg-black/40 border border-white/10 rounded-sm px-3 py-2 text-sm" value={step.name} onChange={(e) => setStep(idx, "name", e.target.value)} />
            <input className="bg-black/40 border border-white/10 rounded-sm px-3 py-2 text-sm" value={step.description} onChange={(e) => setStep(idx, "description", e.target.value)} />
            <label className="text-xs text-zinc-400 flex items-center gap-2"><input type="checkbox" checked={step.requires_approval} onChange={(e) => setStep(idx, "requires_approval", e.target.checked)} /> Approval</label>
            <input type="number" min="0" className="bg-black/40 border border-white/10 rounded-sm px-3 py-2 text-sm w-24" value={step.max_retries} onChange={(e) => setStep(idx, "max_retries", Number(e.target.value))} />
          </div>
        ))}
      </div>
      <div className="flex gap-2"><Button onClick={submit} disabled={loading} className="bg-[#7C3AED]">{loading ? "..." : "Save"}</Button><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button></div>
    </div>
  );
}

export default function WorkflowEngine() {
  const { lang, brands, activeWorkspaceId } = useApp();
  const [workflows, setWorkflows] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!activeWorkspaceId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/workflows`);
      setWorkflows(res.data);
      setSelectedId((prev) => prev || res.data[0]?.id || "");
    } catch { toast.error("Could not load workflows"); }
    finally { setLoading(false); }
  }, [activeWorkspaceId]);

  useEffect(() => { load(); }, [load]);
  const selected = useMemo(() => workflows.find((w) => w.id === selectedId) || workflows[0], [workflows, selectedId]);
  const refreshOne = async (id) => { const res = await axios.get(`${API}/workflows/${id}`); setWorkflows((prev) => prev.map((w) => w.id === id ? res.data : w)); };
  const actStep = async (workflowId, stepId, status) => { try { await axios.patch(`${API}/workflows/${workflowId}/steps/${stepId}`, { status }); await refreshOne(workflowId); } catch (e) { toast.error(e?.response?.data?.detail || "Step error"); } };
  const approve = async (workflowId, stepId, decision) => { try { await axios.post(`${API}/workflows/${workflowId}/steps/${stepId}/approval`, { decision }); await refreshOne(workflowId); } catch (e) { toast.error(e?.response?.data?.detail || "Approval error"); } };
  const retry = async (workflowId, stepId) => { try { await axios.post(`${API}/workflows/${workflowId}/steps/${stepId}/retry`, { reason: "Manual retry" }); await refreshOne(workflowId); } catch (e) { toast.error(e?.response?.data?.detail || "Retry error"); } };

  return (
    <div className="space-y-8">
      <PageHeader icon={GitBranch} color={COLOR} title="Workflow Engine" badge="MVP" subtitle={lang === "DE" ? "Generische Workflow-Basis: Schritte, Status, Artefakte, Freigaben, Retries und Workspace-/Brand-Scope." : "Generic workflow foundation: steps, statuses, artifacts, approval gates, retries, and workspace/brand scope."} />
      <div className="flex justify-between items-center gap-3"><CreateWorkflow brands={brands} lang={lang} onCreated={(wf) => { setWorkflows((p) => [wf, ...p]); setSelectedId(wf.id); }} /><button onClick={load} className="text-zinc-400 hover:text-white text-sm flex items-center gap-2"><RefreshCw size={14} /> {loading ? "Loading..." : "Refresh"}</button></div>
      <div className="grid lg:grid-cols-[360px_1fr] gap-6">
        <div className="space-y-3">
          {workflows.map((wf) => <button key={wf.id} onClick={() => setSelectedId(wf.id)} className={`w-full text-left p-4 rounded-sm border transition ${selected?.id === wf.id ? "border-[#7C3AED]/60 bg-[#7C3AED]/10" : "border-white/8 bg-[#0A0A0A] hover:border-white/20"}`}><div className="flex justify-between gap-2"><div className="font-semibold text-sm truncate">{wf.name}</div><Pill status={wf.status} /></div><div className="mt-3"><Progress value={wf.progress?.percent || 0} className="h-1" /></div><div className="mt-2 text-xs text-zinc-500">{wf.progress?.completed_steps || 0}/{wf.progress?.total_steps || 0} steps · {wf.progress?.approval_gates_open || 0} approvals</div></button>)}
          {!workflows.length && <div className="text-sm text-zinc-500 border border-dashed border-white/10 rounded-sm p-6">{lang === "DE" ? "Noch keine Workflows." : "No workflows yet."}</div>}
        </div>
        {selected && <div className="bg-[#0A0A0A] border border-white/8 rounded-sm p-5 space-y-5">
          <div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-xl font-bold">{selected.name}</h2><p className="text-sm text-zinc-500 mt-1">{selected.description || "Generic workflow run"}</p></div><div className="text-right"><Pill status={selected.status} /><div className="text-xs text-zinc-500 mt-2">{selected.progress?.percent || 0}% complete</div></div></div>
          <Progress value={selected.progress?.percent || 0} />
          <div className="space-y-3">
            {selected.steps.map((step) => <div key={step.id} className="p-4 rounded-sm border border-white/8 bg-black/25">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-white/5 text-xs flex items-center justify-center">{step.order + 1}</span><h3 className="font-semibold">{step.name}</h3>{step.requires_approval && <ShieldCheck size={15} className="text-amber-300" />}</div><p className="text-sm text-zinc-500 mt-1 ml-8">{step.description}</p></div><Pill status={step.status} /></div>
              <div className="mt-4 flex flex-wrap gap-2 ml-8">
                {step.status === "pending" && <Button size="sm" variant="outline" onClick={() => actStep(selected.id, step.id, "running")}><Clock size={14} /> Start</Button>}
                {step.status === "running" && <Button size="sm" onClick={() => actStep(selected.id, step.id, "completed")} className="bg-emerald-600"><Check size={14} /> Complete</Button>}
                {step.status === "running" && <Button size="sm" variant="outline" onClick={() => actStep(selected.id, step.id, "failed")}><XCircle size={14} /> Fail</Button>}
                {step.status === "waiting_approval" && <Button size="sm" onClick={() => approve(selected.id, step.id, "approved")} className="bg-emerald-600"><Check size={14} /> Approve</Button>}
                {step.status === "waiting_approval" && <Button size="sm" variant="outline" onClick={() => approve(selected.id, step.id, "rejected")}><XCircle size={14} /> Reject</Button>}
                {step.status === "approved" && <Button size="sm" variant="outline" onClick={() => actStep(selected.id, step.id, "running")}>Continue</Button>}
                {step.status === "failed" && step.retry_count < step.max_retries && <Button size="sm" variant="outline" onClick={() => retry(selected.id, step.id)}><RotateCcw size={14} /> Retry {step.retry_count}/{step.max_retries}</Button>}
              </div>
            </div>)}
          </div>
          <div className="border-t border-white/8 pt-4"><h3 className="text-sm font-semibold mb-2">Artifacts</h3>{selected.artifacts?.length ? selected.artifacts.map((a) => <div key={a.id} className="text-sm text-zinc-400">{a.name} · {a.type}</div>) : <div className="text-sm text-zinc-600">No artifacts yet. API foundation is ready for generic artifacts.</div>}</div>
        </div>}
      </div>
    </div>
  );
}

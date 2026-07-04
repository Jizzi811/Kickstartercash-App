import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ShieldCheck, Users, Grid3X3, Crown, Plug, Sparkles, Save, LockKeyhole } from "lucide-react";
import { API, useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/PageHeader";

const V = "#7C3AED";
const Card = ({ children, className = "" }) => <div className={`rounded-sm border border-white/10 bg-white/[0.025] ${className}`}>{children}</div>;
const Toggle = ({ checked, onChange }) => <button onClick={onChange} className={`h-6 w-11 rounded-full border ${checked ? "border-[#7C3AED] bg-[#7C3AED]/30" : "border-white/10 bg-white/5"}`}><span className={`block h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} /></button>;

export default function Permissions() {
  const { lang } = useApp();
  const [registry, setRegistry] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, p] = await Promise.all([axios.get(`${API}/permissions/registry`), axios.get(`${API}/permissions/policy`)]);
      setRegistry(r.data); setPolicy(p.data);
    } catch { toast.error("Permission framework could not be loaded"); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try { const r = await axios.put(`${API}/permissions/policy`, policy); setPolicy(r.data); toast.success("Permissions saved"); }
    catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };
  const setEnabled = (bucket, id) => setPolicy((p) => ({ ...p, [bucket]: { ...(p[bucket] || {}), [id]: { ...(p[bucket]?.[id] || {}), enabled: p[bucket]?.[id]?.enabled === false } } }));
  const setLimit = (key, value) => setPolicy((p) => ({ ...p, usage_limits: { ...p.usage_limits, [key]: Number(value) || 0 } }));
  const setPlan = (plan) => setPolicy((p) => ({ ...p, subscription: { ...p.subscription, plan, ...(registry.subscription_limits[plan] || {}) }, usage_limits: { ...p.usage_limits, ...(registry.subscription_limits[plan] || {}) } }));

  if (!registry || !policy) return <div className="py-20 text-center text-zinc-500">Loading permission framework…</div>;
  const usage = policy.usage_snapshot || {};

  return <div className="space-y-8 pb-10">
    <PageHeader
      icon={ShieldCheck}
      badge="BrandMind Permission Layer"
      title={lang === "DE" ? "Capability & Permission Framework" : "Capability & Permission Framework"}
      subtitle="Workspace → Roles → Agents → Skills → Tools → Providers. Every gateway AI request is preflighted against this workspace-scoped policy before provider execution."
      actions={(
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-sm bg-[#7C3AED] px-5 py-2.5 text-sm font-bold text-black disabled:opacity-50"><Save size={15}/>{saving ? "Saving…" : "Save policy"}</button>
      )}
    />

    <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
      {[{icon: Crown, label:"Plan", value: policy.subscription?.plan}, {icon: LockKeyhole, label:"Daily usage", value:`${usage.daily_requests || 0}/${policy.usage_limits?.daily_requests}`}, {icon: Grid3X3, label:"Monthly usage", value:`${usage.monthly_requests || 0}/${policy.usage_limits?.monthly_requests}`}, {icon: Sparkles, label:"Premium", value: policy.subscription?.premium ? "Enabled" : "Locked"}].map(x => { const I=x.icon; return <Card key={x.label} className="p-4"><I size={16} style={{color:V}}/><div className="mt-3 text-xs text-zinc-500 uppercase tracking-wider">{x.label}</div><div className="mt-1 text-xl font-bold text-white">{x.value}</div></Card>; })}
    </section>

    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-5"><h2 className="mb-4 flex items-center gap-2 font-bold text-white"><Crown size={16} style={{color:V}}/> Subscription Overview</h2><select className="w-full bg-black border border-white/10 p-2 text-sm text-white" value={policy.subscription?.plan} onChange={(e)=>setPlan(e.target.value)}>{Object.keys(registry.subscription_limits).map(p=><option key={p} value={p}>{p}</option>)}</select><div className="mt-4 grid grid-cols-2 gap-3"><label className="text-xs text-zinc-400">Daily limit<input className="mt-1 w-full bg-black border border-white/10 p-2 text-white" value={policy.usage_limits?.daily_requests || 0} onChange={(e)=>setLimit("daily_requests", e.target.value)}/></label><label className="text-xs text-zinc-400">Monthly limit<input className="mt-1 w-full bg-black border border-white/10 p-2 text-white" value={policy.usage_limits?.monthly_requests || 0} onChange={(e)=>setLimit("monthly_requests", e.target.value)}/></label></div></Card>
      <Card className="p-5"><h2 className="mb-4 flex items-center gap-2 font-bold text-white"><Users size={16} style={{color:V}}/> Role Editor</h2><div className="space-y-3">{registry.roles.map(role=><div key={role.id} className="rounded border border-white/10 p-3"><div className="font-semibold text-white">{role.label}</div><div className="mt-1 text-xs text-zinc-500">{role.permissions.join(" • ")}</div></div>)}</div></Card>
    </section>

    <section><h2 className="mb-3 flex items-center gap-2 font-bold text-white"><Grid3X3 size={16} style={{color:V}}/> Capability Matrix</h2><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{registry.capabilities.map(c=><Card key={c.id} className="p-4"><div className="flex items-center justify-between"><div className="font-semibold text-white">{c.label}</div><span className="text-[10px] text-zinc-500">{c.permission}</span></div><div className="mt-2 text-xs text-zinc-500">{c.premium ? "Premium-only" : "Included"}</div></Card>)}</div></section>

    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Access title="Provider Access" icon={Plug} bucket="providers" ids={["openai","anthropic","gemini","grok","freetheai","pollinations","poyo"]} policy={policy} setEnabled={setEnabled}/>
      <Access title="Skill Access" icon={Sparkles} bucket="skills" ids={["content_strategy","seo_brief","email_campaign","image_prompt","financial_analysis","workflow_plan"]} policy={policy} setEnabled={setEnabled}/>
    </section>
  </div>;
}

function Access({ title, icon: Icon, bucket, ids, policy, setEnabled }) {
  return <Card className="p-5"><h2 className="mb-4 flex items-center gap-2 font-bold text-white"><Icon size={16} style={{color:V}}/> {title}</h2><div className="space-y-3">{ids.map(id => <div key={id} className="flex items-center justify-between rounded border border-white/10 p-3"><div><div className="font-medium text-white">{id}</div><div className="text-xs text-zinc-500">{policy[bucket]?.[id]?.enabled === false ? "Blocked" : "Allowed"}</div></div><Toggle checked={policy[bucket]?.[id]?.enabled !== false} onChange={()=>setEnabled(bucket, id)}/></div>)}</div></Card>;
}

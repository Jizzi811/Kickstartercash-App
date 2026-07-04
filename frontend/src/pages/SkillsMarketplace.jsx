import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { Search, Sparkles, Clock, Coins, ShieldCheck, Brain, Dna, Plug, Layers } from "lucide-react";
import { API, useApp } from "@/context/AppContext";

const V = "#7C3AED";
const SORA = "'Sora', sans-serif";
const Card = ({ children, className = "" }) => <div className={`rounded-sm border border-white/10 bg-white/[0.02] ${className}`}>{children}</div>;

export default function SkillsMarketplace() {
  const { skillId } = useParams();
  const { lang } = useApp();
  const [data, setData] = useState({ categories: [], skills: [] });
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [detail, setDetail] = useState(null);

  useEffect(() => { axios.get(`${API}/skills`).then((r) => setData(r.data)).catch(() => {}); }, []);
  useEffect(() => {
    if (skillId) axios.get(`${API}/skills/${skillId}`).then((r) => setDetail(r.data)).catch(() => setDetail(null));
    else setDetail(null);
  }, [skillId]);

  const skills = useMemo(() => data.skills.filter((s) => {
    const hay = `${s.name} ${s.description} ${s.category}`.toLowerCase();
    return (!cat || s.category === cat) && (!q || hay.includes(q.toLowerCase()));
  }), [data.skills, q, cat]);

  return <div className="space-y-8 pb-10">
    <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-sm border border-[#7C3AED]/20 bg-[#7C3AED]/[0.04] px-6 md:px-10 py-9">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-[10px] tracking-[0.2em] uppercase font-semibold border border-[#7C3AED]/30 text-[#7C3AED] bg-[#7C3AED]/10"><Sparkles size={12}/> AI Skill System</div>
      <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: SORA }}><span className="bg-gradient-to-r from-[#7C3AED] via-[#C4B5FD] to-[#6D28D9] bg-clip-text text-transparent">{lang === "DE" ? "Skill Marketplace" : "Skill Marketplace"}</span></h1>
      <p className="text-sm text-zinc-400 max-w-2xl">{lang === "DE" ? "Modulare Fähigkeiten statt fest verdrahteter Agenten-Tools. Jeder Agent lädt Skills dynamisch aus der Registry und führt sie über die Skill Execution Engine und das AI Gateway aus." : "Modular capabilities instead of hardcoded agent tools. Every agent loads skills dynamically from the registry and executes them through the Skill Execution Engine and AI Gateway."}</p>
    </motion.section>

    <div className="grid lg:grid-cols-[280px,1fr] gap-5">
      <aside className="space-y-4">
        <Card className="p-4">
          <div className="relative mb-4"><Search size={14} className="absolute left-3 top-3 text-zinc-600"/><input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search skills…" className="w-full bg-black/40 border border-white/10 rounded-sm py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#7C3AED]/50"/></div>
          <button onClick={()=>setCat("")} className={`w-full text-left px-3 py-2 rounded-sm text-xs mb-1 ${!cat ? "bg-[#7C3AED]/15 text-white" : "text-zinc-500 hover:text-zinc-200"}`}>All categories</button>
          {data.categories.map((c) => <button key={c} onClick={()=>setCat(c)} className={`w-full text-left px-3 py-2 rounded-sm text-xs mb-1 ${cat===c ? "bg-[#7C3AED]/15 text-white" : "text-zinc-500 hover:text-zinc-200"}`}>{c}</button>)}
        </Card>
      </aside>

      <main className="space-y-5">
        {detail && <Card className="p-5 border-[#7C3AED]/30">
          <div className="flex items-start justify-between gap-4"><div><div className="text-[10px] uppercase tracking-[0.18em] text-[#7C3AED] mb-2">{detail.category} · v{detail.version}</div><h2 className="text-xl font-bold text-white" style={{ fontFamily: SORA }}>{detail.name}</h2><p className="text-sm text-zinc-400 mt-2">{detail.description}</p></div><ShieldCheck color={V}/></div>
          <div className="grid md:grid-cols-4 gap-3 mt-5 text-xs">
            <Info icon={Clock} label="Runtime" value={detail.average_runtime}/><Info icon={Coins} label="Cost" value={detail.cost_estimate}/><Info icon={Brain} label="Memory" value={(detail.required_memory||[]).join(", ")}/><Info icon={Dna} label="DNA" value={(detail.required_dna||[]).join(", ")}/>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-5"><Schema title="Input Schema" value={detail.input_schema}/><Schema title="Output Schema" value={detail.output_schema}/></div>
        </Card>}

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {skills.map((s) => <Link key={s.id} to={`/skills/${s.id}`}><Card className="p-4 h-full hover:border-[#7C3AED]/40 transition-colors">
            <div className="flex items-start justify-between gap-3 mb-3"><div className="w-9 h-9 rounded-sm bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center"><Layers size={16} color={V}/></div><span className="text-[10px] text-zinc-500">v{s.version}</span></div>
            <div className="text-sm font-semibold text-white mb-1">{s.name}</div><div className="text-[11px] text-[#7C3AED] mb-2">{s.category}</div><p className="text-xs text-zinc-500 leading-relaxed">{s.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-4">{(s.required_providers||[]).map((p)=><span key={p} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 text-[10px] text-zinc-400"><Plug size={9}/>{p}</span>)}</div>
          </Card></Link>)}
        </div>
      </main>
    </div>
  </div>;
}
function Info({ icon: Icon, label, value }) { return <div className="rounded-sm bg-black/30 border border-white/8 p-3"><div className="flex items-center gap-2 text-zinc-500 mb-1"><Icon size={12}/>{label}</div><div className="text-zinc-200">{value}</div></div>; }
function Schema({ title, value }) { return <div><div className="text-xs text-zinc-400 mb-2">{title}</div><pre className="text-[10px] text-zinc-500 bg-black/40 border border-white/8 rounded-sm p-3 overflow-auto max-h-44">{JSON.stringify(value, null, 2)}</pre></div>; }

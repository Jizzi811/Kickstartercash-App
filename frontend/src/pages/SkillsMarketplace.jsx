import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { Search, Sparkles, Clock, Coins, ShieldCheck, Brain, Dna, Plug, Layers } from "lucide-react";
import { API, useApp } from "@/context/AppContext";
import { V, SORA, Page, Hero, Card, EmptyState, BMBadge } from "@/components/bm";

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

  return <Page>
    <Hero icon={Sparkles} badge="AI Skill System" title="Skill Marketplace"
      description={lang === "DE" ? "Modulare Fähigkeiten statt fest verdrahteter Agenten-Tools. Jeder Agent lädt Skills dynamisch aus der Registry und führt sie über das AI Gateway aus." : "Modular capabilities instead of hardcoded agent tools. Every agent loads skills dynamically from the registry and executes them through the AI Gateway."} />

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

        {data.skills.length === 0 ? (
          <EmptyState icon={Sparkles}
            title={lang === "DE" ? "Noch keine Skills geladen" : "No skills loaded yet"}
            description={lang === "DE" ? "Die Skill-Registry ist nicht erreichbar. Bitte später erneut versuchen." : "The skill registry is unreachable. Please try again later."} />
        ) : skills.length === 0 ? (
          <EmptyState icon={Search}
            title={lang === "DE" ? "Keine Treffer" : "No matches"}
            description={lang === "DE" ? "Kein Skill passt zu deiner Suche oder Kategorie." : "No skill matches your search or category."} />
        ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {skills.map((s) => <Link key={s.id} to={`/skills/${s.id}`}><Card className="p-4 h-full hover:border-[#7C3AED]/40 transition-colors">
            <div className="flex items-start justify-between gap-3 mb-3"><div className="w-9 h-9 rounded-sm bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center"><Layers size={16} color={V}/></div><span className="text-[10px] text-zinc-500">v{s.version}</span></div>
            <div className="text-sm font-semibold text-white mb-1">{s.name}</div><div className="text-[11px] text-[#7C3AED] mb-2">{s.category}</div><p className="text-xs text-zinc-500 leading-relaxed">{s.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-4">{(s.required_providers||[]).map((p)=><span key={p} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 text-[10px] text-zinc-400"><Plug size={9}/>{p}</span>)}</div>
          </Card></Link>)}
        </div>
        )}
      </main>
    </div>
  </Page>;
}
function Info({ icon: Icon, label, value }) { return <div className="rounded-sm bg-black/30 border border-white/8 p-3"><div className="flex items-center gap-2 text-zinc-500 mb-1"><Icon size={12}/>{label}</div><div className="text-zinc-200">{value}</div></div>; }
function Schema({ title, value }) {
  // Human-readable field list – raw JSON is never shown to end users.
  const props = Object.keys(value?.properties || {});
  const required = new Set(value?.required || []);
  return <div><div className="text-xs text-zinc-400 mb-2">{title}</div>
    <div className="flex flex-wrap gap-1.5">
      {props.length ? props.map((k) => <BMBadge key={k} tone={required.has(k) ? "violet" : "neutral"}>{k}</BMBadge>)
        : <span className="text-[11px] text-zinc-600">—</span>}
    </div></div>;
}

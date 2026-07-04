import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
  Brain, Palette, Briefcase, Star, Search, Plus, Trash2, Clock,
  Lightbulb, Loader2, Network,
} from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { V, SORA, fadeUp, GradientHeading, Card, SectionHeader } from "@/components/bm";


const BRAIN_ICON = { brand: Palette, business: Briefcase, experience: Star };
const BRAIN_COLOR = { brand: "#7C3AED", business: "#60A5FA", experience: "#4ade80" };


export default function Memory() {
  const { lang, activeBrandId } = useApp();
  const [reg, setReg] = useState(null);
  const [summary, setSummary] = useState(null);
  const [biz, setBiz] = useState({ categories: [], entries: [] });
  const [insights, setInsights] = useState([]);
  const [tl, setTl] = useState([]);
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState({ category: "goals", title: "", content: "", tags: "" });
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, s, b, i, t] = await Promise.all([
        axios.get(`${API}/memory/registry`),
        axios.get(`${API}/memory/summary`, { params: { language: lang } }),
        axios.get(`${API}/memory/business`),
        axios.get(`${API}/memory/insights`, { params: { language: lang } }),
        axios.get(`${API}/memory/timeline`, { params: { language: lang } }),
      ]);
      setReg(r.data); setSummary(s.data); setBiz(b.data);
      setInsights(i.data.insights || []); setTl(t.data.events || []);
    } catch { toast.error(lang === "DE" ? "Memory laden fehlgeschlagen" : "Failed to load memory"); }
  }, [lang]);

  useEffect(() => { load(); }, [load, activeBrandId]);

  const agentsFor = (brainId) => {
    if (!reg?.agent_brain_map) return [];
    return Object.entries(reg.agent_brain_map).filter(([, v]) => v.includes(brainId)).map(([k]) => k);
  };

  const runSearch = async () => {
    if (!q.trim()) { setResults(null); return; }
    setSearching(true);
    try {
      const r = await axios.get(`${API}/memory/search`, { params: { q: q.trim(), language: lang } });
      setResults(r.data.results || []);
    } catch { toast.error("Fehler"); }
    finally { setSearching(false); }
  };

  const addEntry = async () => {
    if (!form.title.trim() || adding) return;
    setAdding(true);
    try {
      await axios.post(`${API}/memory/business`, {
        category: form.category, title: form.title.trim(), content: form.content.trim(),
        tags: form.tags.split(",").map((x) => x.trim()).filter(Boolean),
        brand_id: activeBrandId,
      });
      setForm({ category: form.category, title: "", content: "", tags: "" });
      const b = await axios.get(`${API}/memory/business`);
      setBiz(b.data);
      toast.success(lang === "DE" ? "Zum Business Brain hinzugefügt" : "Added to Business Brain");
      load();
    } catch { toast.error(lang === "DE" ? "Hinzufügen fehlgeschlagen" : "Add failed"); }
    finally { setAdding(false); }
  };

  const del = async (id) => {
    try {
      await axios.delete(`${API}/memory/business/${id}`);
      setBiz((b) => ({ ...b, entries: b.entries.filter((e) => e.id !== id) }));
      load();
    } catch { toast.error("Fehler"); }
  };

  const catLabel = (id) => {
    const c = (biz.categories || []).find((x) => x.id === id);
    return c ? (lang === "DE" ? c.de : c.en) : id;
  };

  if (!reg || !summary) {
    return <div className="py-20 text-center text-zinc-600 text-sm">{lang === "DE" ? "Lade Gedächtnis…" : "Loading memory…"}</div>;
  }

  return (
    <div className="space-y-10 pb-12">
      {/* HERO */}
      <motion.section {...fadeUp(0)}>
        <div className="relative overflow-hidden rounded-xl" style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(8,8,8,0) 55%, rgba(124,58,237,0.05) 100%)",
          border: "1px solid rgba(124,58,237,0.14)",
        }}>
          <div className="absolute -top-28 -left-28 w-96 h-96 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)" }} />
          <div className="relative px-6 md:px-10 py-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-[10px] tracking-[0.2em] uppercase font-semibold"
              style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.26)", color: V }}>
              <Brain size={11} /> Multi-Brain Memory
            </div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2" style={{ fontFamily: SORA }}>
              <span style={{
                background: "linear-gradient(90deg, #7C3AED 0%, #C4B5FD 45%, #6D28D9 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>{lang === "DE" ? "Das Gedächtnis deiner Agenten" : "Your agents' memory"}</span>
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">
              {lang === "DE"
                ? "Drei Gehirne – Marke, Unternehmen, Erfahrung. Der Memory Router gibt jedem Agenten genau das Wissen, das er braucht."
                : "Three brains – brand, business, experience. The Memory Router gives each agent exactly the knowledge it needs."}
            </p>
          </div>
        </div>
      </motion.section>

      {/* BRAIN CARDS */}
      <motion.section {...fadeUp(0.05)} className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {summary.brains.map((b) => {
          const Icon = BRAIN_ICON[b.id] || Brain;
          const color = BRAIN_COLOR[b.id] || V;
          const agents = agentsFor(b.id);
          return (
            <Card key={b.id} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-sm flex items-center justify-center"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <span className="text-2xl font-bold" style={{ fontFamily: SORA, color }}>{b.count}</span>
              </div>
              <div className="text-[14px] font-semibold text-zinc-100">{b.emoji} {b.label}</div>
              <div className="text-[12px] text-zinc-500 mt-0.5">{b.highlight}</div>
              <div className="mt-3 pt-3 border-t border-white/5">
                <div className="text-[9px] uppercase tracking-widest text-zinc-700 mb-1.5">{lang === "DE" ? "Genutzt von" : "Used by"}</div>
                <div className="flex flex-wrap gap-1">
                  {agents.slice(0, 6).map((a) => (
                    <span key={a} className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{ background: `${color}14`, color }}>{a}</span>
                  ))}
                  {agents.length > 6 && <span className="text-[9px] text-zinc-600">+{agents.length - 6}</span>}
                </div>
              </div>
            </Card>
          );
        })}
      </motion.section>

      {/* SEARCH */}
      <motion.section {...fadeUp(0.1)}>
        <Card className="p-5">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-[#0A0A0A] border border-white/10 rounded-sm px-3">
              <Search size={15} className="text-zinc-600" />
              <input value={q} onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
                placeholder={lang === "DE" ? "Alle Gehirne durchsuchen…" : "Search across all brains…"}
                className="flex-1 bg-transparent py-2.5 text-[13px] text-zinc-200 outline-none placeholder:text-zinc-700" />
            </div>
            <button onClick={runSearch} disabled={searching}
              className="px-4 rounded-sm text-[13px] font-semibold" style={{ background: V, color: "#0A0A0A" }}>
              {searching ? <Loader2 size={15} className="animate-spin" /> : (lang === "DE" ? "Suchen" : "Search")}
            </button>
          </div>
          {results && (
            <div className="mt-3 space-y-1.5">
              {results.length ? results.map((r, i) => {
                const color = BRAIN_COLOR[r.brain] || V;
                return (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-sm"
                    style={{ background: "rgba(255,255,255,0.02)", borderLeft: `3px solid ${color}` }}>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full mt-0.5 flex-shrink-0"
                      style={{ background: `${color}18`, color }}>{r.brain}</span>
                    <div className="min-w-0">
                      <div className="text-[12px] text-zinc-200 font-medium">{r.title}</div>
                      <div className="text-[11px] text-zinc-500 truncate">{r.snippet}</div>
                    </div>
                  </div>
                );
              }) : <p className="text-[12px] text-zinc-600 text-center py-3">{lang === "DE" ? "Keine Treffer." : "No matches."}</p>}
            </div>
          )}
        </Card>
      </motion.section>

      {/* BUSINESS BRAIN EDITOR */}
      <motion.section {...fadeUp(0.14)} className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <SectionHeader icon={Briefcase} title={lang === "DE" ? "Business Brain ergänzen" : "Add to Business Brain"} />
          <Card className="p-4 space-y-2.5">
            <select className="w-full bg-[#0A0A0A] border border-white/10 rounded-sm px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-[#7C3AED]/50"
              value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {biz.categories.map((c) => <option key={c.id} value={c.id}>{lang === "DE" ? c.de : c.en}</option>)}
            </select>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={lang === "DE" ? "Titel" : "Title"}
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-sm px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-[#7C3AED]/50 placeholder:text-zinc-700" />
            <textarea rows={3} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder={lang === "DE" ? "Inhalt / Details" : "Content / details"}
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-sm px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-[#7C3AED]/50 resize-none placeholder:text-zinc-700" />
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder={lang === "DE" ? "Tags (Komma-getrennt)" : "Tags (comma-separated)"}
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-sm px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-[#7C3AED]/50 placeholder:text-zinc-700" />
            <button onClick={addEntry} disabled={adding || !form.title.trim()}
              className="w-full inline-flex items-center justify-center gap-2 text-[13px] font-semibold py-2 rounded-sm disabled:opacity-40"
              style={{ background: V, color: "#0A0A0A" }}>
              {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {lang === "DE" ? "Hinzufügen" : "Add"}
            </button>
          </Card>
        </div>
        <div className="lg:col-span-3">
          <SectionHeader icon={Briefcase} title={lang === "DE" ? "Unternehmenswissen" : "Company knowledge"}
            right={<span className="text-[10px] text-zinc-700 uppercase tracking-widest">{biz.entries.length}</span>} />
          {biz.entries.length ? (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {biz.entries.map((e) => (
                <Card key={e.id} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(96,165,250,0.14)", color: "#60A5FA" }}>{catLabel(e.category)}</span>
                        <span className="text-[13px] font-medium text-zinc-200">{e.title}</span>
                      </div>
                      {e.content && <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed line-clamp-2">{e.content}</p>}
                    </div>
                    <button onClick={() => del(e.id)} className="text-zinc-600 hover:text-red-400 flex-shrink-0"><Trash2 size={13} /></button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6"><p className="text-[13px] text-zinc-600 text-center">{lang === "DE" ? "Noch leer – ergänze Ziele, Strategie, SOPs …" : "Empty – add goals, strategy, SOPs…"}</p></Card>
          )}
        </div>
      </motion.section>

      {/* INSIGHTS + TIMELINE */}
      <motion.section {...fadeUp(0.18)} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6" style={{
          background: "linear-gradient(145deg, rgba(124,58,237,0.05) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid rgba(124,58,237,0.14)",
        }}>
          <SectionHeader icon={Lightbulb} title={lang === "DE" ? "Memory Insights" : "Memory Insights"} />
          {insights.length ? (
            <div className="space-y-2">
              {insights.map((ins, i) => {
                const color = BRAIN_COLOR[ins.brain] || V;
                return (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-sm"
                    style={{ background: "rgba(255,255,255,0.02)", borderLeft: `3px solid ${color}` }}>
                    <Network size={13} style={{ color }} className="mt-0.5 flex-shrink-0" />
                    <span className="text-[12px] text-zinc-300 leading-snug">{ins.text}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[12px] text-zinc-600 py-4 text-center">{lang === "DE" ? "Noch keine Erkenntnisse." : "No insights yet."}</p>
          )}
        </Card>

        <Card className="p-6">
          <SectionHeader icon={Clock} title={lang === "DE" ? "Memory Timeline" : "Memory Timeline"} />
          {tl.length ? (
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {tl.map((e, i) => {
                const color = BRAIN_COLOR[e.brain] || V;
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-zinc-300 leading-snug line-clamp-1">{e.text || "—"}</p>
                      <p className="text-[10px] text-zinc-600">{e.brain} · {e.kind} · {(e.at || "").slice(0, 10)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[12px] text-zinc-600 py-4 text-center">{lang === "DE" ? "Noch keine Ereignisse." : "No events yet."}</p>
          )}
        </Card>
      </motion.section>

      <p className="text-[10px] text-zinc-700 text-center">
        {lang === "DE"
          ? "Agenten lesen keine Datenbank direkt – sie fragen den Memory Router, der pro Rolle nur die passenden Gehirne liefert."
          : "Agents never read the database directly – they ask the Memory Router, which serves only the brains relevant to each role."}
      </p>
    </div>
  );
}

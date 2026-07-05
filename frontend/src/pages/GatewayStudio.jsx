import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
  Plug, Save, Activity, Zap, ShieldCheck, ShieldAlert, CircleDot,
  Server, DollarSign, Gauge, Send, Loader2, CheckCircle2, XCircle,
} from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { V, SORA, fadeUp, GradientHeading, Card, SectionHeader } from "@/components/bm";



const selCls = "min-w-0 max-w-full bg-[#0A0A0A] border border-white/10 rounded-sm px-2.5 py-2 sm:py-1.5 text-[12px] text-zinc-200 outline-none focus:border-[#7C3AED]/50";

export default function GatewayStudio() {
  const { lang } = useApp();
  const [reg, setReg] = useState(null);
  const [cfg, setCfg] = useState(null);
  const [health, setHealth] = useState([]);
  const [usage, setUsage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testMsg, setTestMsg] = useState("");
  const [testTask, setTestTask] = useState("chat");
  const [testOut, setTestOut] = useState(null);
  const [testing, setTesting] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [r, c, h, u] = await Promise.all([
        axios.get(`${API}/gateway/registry`),
        axios.get(`${API}/gateway/config`),
        axios.get(`${API}/gateway/health`),
        axios.get(`${API}/gateway/usage`),
      ]);
      setReg(r.data); setCfg(c.data); setHealth(h.data.providers || []); setUsage(u.data);
    } catch { toast.error(lang === "DE" ? "Gateway laden fehlgeschlagen" : "Failed to load gateway"); }
  }, [lang]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const healthOf = (pid) => health.find((h) => h.id === pid) || {};
  const providersFor = (cap) => (reg?.providers || []).filter((p) => p.capabilities.includes(cap));
  const modelsFor = (pid, cap) => {
    const p = (reg?.providers || []).find((x) => x.id === pid);
    if (!p) return [];
    return p.models.filter((m) => !cap || m.capabilities.includes(cap));
  };

  const toggleProvider = (pid) => {
    setCfg((c) => ({ ...c, enabled: { ...c.enabled, [pid]: !c.enabled[pid] } }));
  };
  const setTaskPick = (task, field, value) => {
    setCfg((c) => {
      const tm = { ...c.task_models };
      const cur = { ...(tm[task] || {}) };
      cur[field] = value;
      if (field === "provider") {
        const meta = reg.tasks.find((t) => t.id === task);
        const ms = modelsFor(value, meta?.capability);
        cur.model = ms[0]?.id || null;
      }
      tm[task] = cur;
      return { ...c, task_models: tm };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/gateway/config`, cfg);
      toast.success(lang === "DE" ? "Gateway-Konfiguration gespeichert" : "Gateway config saved");
      loadAll();
    } catch { toast.error(lang === "DE" ? "Speichern fehlgeschlagen" : "Save failed"); }
    finally { setSaving(false); }
  };

  const runTest = async () => {
    if (!testMsg.trim() || testing) return;
    setTesting(true); setTestOut(null);
    try {
      const r = await axios.post(`${API}/gateway/chat`, { user: testMsg.trim(), task: testTask });
      setTestOut({ ok: true, reply: r.data.reply, meta: r.data.meta });
    } catch (e) {
      setTestOut({ ok: false, error: e?.response?.data?.detail || "failed" });
    } finally { setTesting(false); }
  };

  if (!reg || !cfg) {
    return <div className="py-20 text-center text-zinc-600 text-sm">{lang === "DE" ? "Lade Gateway…" : "Loading gateway…"}</div>;
  }

  const s = usage?.summary || {};

  return (
    <div className="min-w-0 space-y-7 pb-10 sm:space-y-10">
      {/* HERO */}
      <motion.section {...fadeUp(0)}>
        <div className="relative overflow-hidden rounded-xl" style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(8,8,8,0) 55%, rgba(124,58,237,0.05) 100%)",
          border: "1px solid rgba(124,58,237,0.14)",
        }}>
          <div className="absolute -top-28 -left-28 w-96 h-96 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)" }} />
          <div className="relative flex flex-col gap-6 px-4 py-7 sm:px-6 sm:py-10 md:px-10 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-[10px] tracking-[0.2em] uppercase font-semibold"
                style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.26)", color: V }}>
                <Plug size={11} /> AI Provider Gateway
              </div>
              <h1 className="text-2xl font-bold leading-tight mb-3 sm:text-3xl md:text-4xl" style={{ fontFamily: SORA }}>
                <span style={{
                  background: "linear-gradient(90deg, #7C3AED 0%, #C4B5FD 45%, #6D28D9 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>{lang === "DE" ? "Ein Gateway. Alle Anbieter." : "One gateway. Every provider."}</span>
              </h1>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">
                {lang === "DE"
                  ? "Business-Module sprechen nie direkt mit KI-Anbietern. Hier steuerst du Anbieter, Default, Fallback und das bevorzugte Modell pro Aufgabe – mit einem Klick umschaltbar."
                  : "Business modules never talk to providers directly. Control providers, default, fallback and the preferred model per task here – switch with a single click."}
              </p>
            </div>
            <button onClick={save} disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-sm px-5 py-3 text-sm font-bold transition-all disabled:opacity-40 sm:w-auto sm:py-2.5 lg:shrink-0"
              style={{ background: V, color: "#0A0A0A" }}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {lang === "DE" ? "Speichern" : "Save"}
            </button>
          </div>
        </div>
      </motion.section>

      {/* USAGE SUMMARY */}
      <motion.section {...fadeUp(0.05)} className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Activity, label: lang === "DE" ? "Aufrufe" : "Calls", value: s.calls ?? 0, color: V },
          { icon: CheckCircle2, label: lang === "DE" ? "Erfolgsrate" : "Success rate", value: `${s.success_rate ?? 0}%`, color: "#4ade80" },
          { icon: DollarSign, label: lang === "DE" ? "Kosten (geschätzt)" : "Cost (est.)", value: `$${s.cost_usd ?? 0}`, color: "#C084FC" },
          { icon: Gauge, label: lang === "DE" ? "Ø Latenz" : "Avg latency", value: `${s.avg_latency_ms ?? 0}ms`, color: "#F472B6" },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <Card key={t.label} className="p-4">
              <div className="w-8 h-8 rounded-sm flex items-center justify-center mb-2"
                style={{ background: `${t.color}18`, border: `1px solid ${t.color}30` }}>
                <Icon size={14} style={{ color: t.color }} />
              </div>
              <div className="text-2xl font-bold leading-none" style={{
                fontFamily: SORA,
                background: `linear-gradient(135deg,#fff 0%,${t.color} 120%)`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>{t.value}</div>
              <div className="text-[11px] text-zinc-500 mt-1">{t.label}</div>
            </Card>
          );
        })}
      </motion.section>

      {/* ROUTING: default + fallback */}
      <motion.section {...fadeUp(0.1)}>
        <SectionHeader icon={Zap} title={lang === "DE" ? "Routing" : "Routing"} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="p-4">
            <div className="text-[11px] uppercase tracking-widest text-zinc-600 mb-2">{lang === "DE" ? "Standard-Anbieter" : "Default provider"}</div>
            <select className={selCls + " w-full"} value={cfg.default_provider}
              onChange={(e) => setCfg({ ...cfg, default_provider: e.target.value })}>
              {reg.providers.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </Card>
          <Card className="p-4">
            <div className="text-[11px] uppercase tracking-widest text-zinc-600 mb-2">{lang === "DE" ? "Fallback-Anbieter" : "Fallback provider"}</div>
            <select className={selCls + " w-full"} value={cfg.fallback_provider}
              onChange={(e) => setCfg({ ...cfg, fallback_provider: e.target.value })}>
              {reg.providers.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </Card>
        </div>
      </motion.section>

      {/* PROVIDERS */}
      <motion.section {...fadeUp(0.14)}>
        <SectionHeader icon={Server} title={lang === "DE" ? "Anbieter" : "Providers"}
          right={<span className="text-[10px] text-zinc-700 uppercase tracking-widest">{reg.providers.length}</span>} />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {reg.providers.map((p) => {
            const h = healthOf(p.id);
            const on = !!cfg.enabled[p.id];
            return (
              <Card key={p.id} className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {h.configured
                      ? <ShieldCheck size={15} style={{ color: "#4ade80" }} />
                      : <ShieldAlert size={15} style={{ color: "#71717a" }} />}
                    <span className="text-[13px] font-semibold text-zinc-100">{p.label}</span>
                  </div>
                  <button onClick={() => toggleProvider(p.id)}
                    className="relative w-9 h-5 rounded-full transition-colors flex-shrink-0"
                    style={{ background: on ? V : "rgba(255,255,255,0.12)" }}>
                    <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                      style={{ left: on ? "18px" : "2px" }} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {p.capabilities.map((c) => (
                    <span key={c} className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{ background: "rgba(124,58,237,0.1)", color: "#a78bfa" }}>{c}</span>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                  <span className="inline-flex items-center gap-1">
                    <CircleDot size={9} style={{ color: h.configured ? "#4ade80" : "#71717a" }} />
                    {h.configured ? (lang === "DE" ? "konfiguriert" : "configured") : (lang === "DE" ? "kein Key" : "no key")}
                  </span>
                  {h.breaker_open && <span style={{ color: "#fb7185" }}>{lang === "DE" ? "Breaker offen" : "breaker open"}</span>}
                  <span>{p.models.length} {lang === "DE" ? "Modelle" : "models"}</span>
                </div>
                {p.notes && <p className="text-[10px] text-zinc-700 mt-2 leading-relaxed">{p.notes}</p>}
              </Card>
            );
          })}
        </div>
      </motion.section>

      {/* PREFERRED MODEL PER TASK */}
      <motion.section {...fadeUp(0.18)}>
        <SectionHeader icon={CircleDot} title={lang === "DE" ? "Bevorzugtes Modell pro Aufgabe" : "Preferred model per task"} />
        <Card className="p-3 sm:p-2">
          <div className="space-y-3 sm:hidden">
            {reg.tasks.map((t) => {
              const pick = cfg.task_models[t.id] || {};
              const provs = providersFor(t.capability);
              const models = modelsFor(pick.provider, t.capability);
              return (
                <div key={t.id} className="rounded-sm border border-white/8 bg-black/20 p-3">
                  <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="break-words text-[13px] font-semibold text-zinc-200">{lang === "DE" ? t.de : t.en}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-zinc-700">{t.capability}</div>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label className="space-y-1">
                      <span className="block text-[10px] uppercase tracking-widest text-zinc-600">{lang === "DE" ? "Anbieter" : "Provider"}</span>
                      <select className={selCls + " w-full"} value={pick.provider || ""}
                        onChange={(e) => setTaskPick(t.id, "provider", e.target.value)}>
                        {provs.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="block text-[10px] uppercase tracking-widest text-zinc-600">{lang === "DE" ? "Modell" : "Model"}</span>
                      <select className={selCls + " w-full"} value={pick.model || ""}
                        onChange={(e) => setTaskPick(t.id, "model", e.target.value)}>
                        {models.map((m) => <option key={m.id} value={m.id}>{m.label || m.id}</option>)}
                      </select>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="hidden overflow-x-auto rounded-sm sm:block">
          <table className="w-full text-[12px]" style={{ minWidth: 560 }}>
            <thead>
              <tr className="text-zinc-600 text-[10px] uppercase tracking-widest">
                <th className="text-left px-3 py-2">{lang === "DE" ? "Aufgabe" : "Task"}</th>
                <th className="text-left px-3 py-2">{lang === "DE" ? "Anbieter" : "Provider"}</th>
                <th className="text-left px-3 py-2">{lang === "DE" ? "Modell" : "Model"}</th>
              </tr>
            </thead>
            <tbody>
              {reg.tasks.map((t) => {
                const pick = cfg.task_models[t.id] || {};
                const provs = providersFor(t.capability);
                const models = modelsFor(pick.provider, t.capability);
                return (
                  <tr key={t.id} className="border-t border-white/5">
                    <td className="px-3 py-2 text-zinc-300">{lang === "DE" ? t.de : t.en}</td>
                    <td className="px-3 py-2">
                      <select className={selCls} value={pick.provider || ""}
                        onChange={(e) => setTaskPick(t.id, "provider", e.target.value)}>
                        {provs.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select className={selCls} value={pick.model || ""}
                        onChange={(e) => setTaskPick(t.id, "model", e.target.value)}>
                        {models.map((m) => <option key={m.id} value={m.id}>{m.label || m.id}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </Card>
      </motion.section>

      {/* USAGE BY PROVIDER + TEST */}
      <motion.section {...fadeUp(0.22)} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 sm:p-6">
          <SectionHeader icon={Activity} title={lang === "DE" ? "Nutzung pro Anbieter" : "Usage by provider"} />
          {usage?.by_provider?.length ? (
            <div className="space-y-2">
              {usage.by_provider.map((b) => (
                <div key={b.provider} className="flex flex-col gap-2 rounded-sm p-2.5 sm:flex-row sm:items-center sm:justify-between"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-[12px] text-zinc-200">{b.provider}</span>
                  <div className="flex items-center gap-4 text-[11px] text-zinc-500">
                    <span>{b.calls} {lang === "DE" ? "Aufrufe" : "calls"}</span>
                    <span>{b.ok} ok</span>
                    <span style={{ color: "#a78bfa" }}>${b.cost_usd}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-zinc-600 py-4 text-center">{lang === "DE" ? "Noch keine Nutzung." : "No usage yet."}</p>
          )}
        </Card>

        <Card className="p-4 sm:p-6" style={{
          background: "linear-gradient(145deg, rgba(124,58,237,0.05) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid rgba(124,58,237,0.14)",
        }}>
          <SectionHeader icon={Send} title={lang === "DE" ? "Gateway testen" : "Test the gateway"} />
          <div className="mb-2 grid gap-2 sm:grid-cols-[minmax(9rem,auto)_1fr_auto]">
            <select className={selCls + " w-full"} value={testTask} onChange={(e) => setTestTask(e.target.value)}>
              {reg.tasks.filter((t) => ["chat", "structured", "video_prompt"].includes(t.id)).map((t) =>
                <option key={t.id} value={t.id}>{lang === "DE" ? t.de : t.en}</option>)}
            </select>
            <input value={testMsg} onChange={(e) => setTestMsg(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") runTest(); }}
              placeholder={lang === "DE" ? "Testnachricht…" : "Test message…"}
              className="min-w-0 bg-[#0A0A0A] border border-white/10 rounded-sm px-3 py-2 sm:py-1.5 text-[12px] text-zinc-200 outline-none focus:border-[#7C3AED]/50" />
            <button onClick={runTest} disabled={testing || !testMsg.trim()}
              className="flex min-h-9 items-center justify-center rounded-sm px-3 py-2 text-[12px] font-semibold disabled:opacity-40 sm:py-1.5"
              style={{ background: V, color: "#0A0A0A" }}>
              {testing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
          {testOut && (
            <div className="mt-3 p-3 rounded-sm" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {testOut.ok ? (
                <>
                  <div className="flex items-center gap-2 mb-2 text-[10px] text-zinc-500">
                    <CheckCircle2 size={12} style={{ color: "#4ade80" }} />
                    {testOut.meta.provider}/{testOut.meta.model} · {testOut.meta.latency_ms}ms · ${testOut.meta.cost_usd}
                  </div>
                  <p className="text-[12px] text-zinc-300 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">{testOut.reply}</p>
                </>
              ) : (
                <div className="flex items-center gap-2 text-[12px]" style={{ color: "#fb7185" }}>
                  <XCircle size={13} /> {lang === "DE" ? "Alle Anbieter fehlgeschlagen" : "All providers failed"}
                </div>
              )}
            </div>
          )}
        </Card>
      </motion.section>

      <p className="text-[10px] text-zinc-700 text-center">
        {lang === "DE"
          ? "Anbieter-Keys werden serverseitig als Umgebungsvariablen verwaltet. „Kein Key“ bedeutet, dass die Env-Variable des Anbieters (noch) nicht gesetzt ist."
          : "Provider keys are managed server-side as environment variables. \"No key\" means the provider's env var isn't set yet."}
      </p>
    </div>
  );
}

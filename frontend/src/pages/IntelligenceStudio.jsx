import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import {
  BrainCircuit, Layers, Calendar, CheckCircle2, AlertTriangle, Sparkles,
  TrendingUp, Lightbulb, Wrench, ArrowRight, Target, ThumbsUp, ClipboardList,
  Activity, Gauge,
} from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { V, SORA, fadeUp, Card, SectionHeader, Metric } from "@/components/bm";


const ICON = {
  layers: Layers, calendar: Calendar, "check-circle": CheckCircle2,
  "alert-triangle": AlertTriangle, sparkles: Sparkles,
};

const CONF_STYLE = {
  high: { fg: "#4ade80", label_de: "hohe Sicherheit", label_en: "high confidence" },
  medium: { fg: "#a78bfa", label_de: "mittlere Sicherheit", label_en: "medium confidence" },
  low: { fg: "#71717a", label_de: "erste Signale", label_en: "early signal" },
};

const PRIO_STYLE = {
  high: { bg: "rgba(244,63,94,0.14)", fg: "#fb7185" },
  medium: { bg: "rgba(124,58,237,0.14)", fg: "#a78bfa" },
  low: { bg: "rgba(255,255,255,0.05)", fg: "#a1a1aa" },
};

const ACTION_ROUTE = {
  review_tasks: "/", create_plan: "/", open_brand_brain: "/brand-brain",
  open_studio: "/modules", open_calendar: "/calendar",
};




/* mini sparkline from a [{date,value}] series */
function Sparkline({ series, color = V }) {
  const vals = (series || []).map((p) => p.value);
  const max = Math.max(1, ...vals);
  const n = vals.length || 1;
  const pts = vals.map((v, i) => {
    const x = (i / (n - 1 || 1)) * 100;
    const y = 24 - (v / max) * 22 - 1;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 100 24" width="100%" height="24" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </svg>
  );
}


export default function IntelligenceStudio() {
  const { lang, activeBrandId, activeBrand } = useApp();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState("weekly");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/intelligence/insights`, { params: { brand_id: activeBrandId, language: lang } });
      setData(r.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [activeBrandId, lang]);

  const loadSummary = useCallback(async (p) => {
    try {
      const r = await axios.get(`${API}/intelligence/summary`, { params: { period: p, language: lang } });
      setSummary(r.data);
    } catch { /* silent */ }
  }, [lang]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadSummary(period); }, [loadSummary, period]);

  const m = data?.metrics || {};
  const trends = data?.trends || {};

  return (
    <div className="max-w-full space-y-7 overflow-x-hidden pb-8 sm:space-y-10 sm:pb-10">
      {/* ══ HERO ════════════════════════════════════════════════════ */}
      <motion.section {...fadeUp(0)}>
        <div className="relative max-w-full overflow-hidden rounded-xl" style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(8,8,8,0) 55%, rgba(124,58,237,0.05) 100%)",
          border: "1px solid rgba(124,58,237,0.14)",
        }}>
          <div className="absolute -top-20 -left-24 h-72 w-72 rounded-full pointer-events-none sm:-top-28 sm:-left-28 sm:h-96 sm:w-96"
            style={{ background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)" }} />
          <div className="relative px-4 py-7 sm:px-6 sm:py-10 md:px-10">
            <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] sm:mb-5 sm:tracking-[0.2em]"
              style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.26)", color: V }}>
              <BrainCircuit size={11} /> Intelligence Engine
            </div>
            <h1 className="mb-3 text-[clamp(1.85rem,9vw,2.25rem)] font-bold leading-tight sm:text-3xl md:text-4xl" style={{ fontFamily: SORA }}>
              <span style={{
                background: "linear-gradient(90deg, #7C3AED 0%, #C4B5FD 45%, #6D28D9 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>{lang === "DE" ? "Was Brandmind gelernt hat" : "What Brandmind has learned"}</span>
            </h1>
            <p className="max-w-xl break-words text-[13px] leading-relaxed text-zinc-400 sm:text-sm">
              {lang === "DE"
                ? "Deine interne Intelligenzschicht lernt kontinuierlich aus Aktivität, Assets, Kampagnen und Freigaben – ausschließlich aus deinen eigenen Daten, ohne externe Analytics."
                : "Your internal intelligence layer continuously learns from activity, assets, campaigns and approvals – purely from your own data, with no external analytics."}
            </p>
          </div>
        </div>
      </motion.section>

      {/* ══ METRICS ═════════════════════════════════════════════════ */}
      <motion.section {...fadeUp(0.05)} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={ThumbsUp} label={lang === "DE" ? "Freigabequote" : "Approval rate"} value={`${m.approval_rate ?? 0}%`} color="#4ade80" />
        <Metric icon={Layers} label={lang === "DE" ? "Assets generiert" : "Assets generated"} value={m.assets_total ?? 0} />
        <Metric icon={Target} label={lang === "DE" ? "Executive-Pläne" : "Executive plans"} value={m.plans_total ?? 0} color="#C084FC" />
        <Metric icon={ClipboardList} label={lang === "DE" ? "Offene Vorschläge" : "Open proposals"} value={m.proposed_open ?? 0} color="#F472B6" />
      </motion.section>

      {/* ══ INSIGHT CARDS ═══════════════════════════════════════════ */}
      <motion.section {...fadeUp(0.1)}>
        <SectionHeader icon={Sparkles} title={lang === "DE" ? "Erkenntnisse" : "Insights"}
          right={<span className="text-[10px] text-zinc-700 uppercase tracking-widest">{data?.insights?.length || 0}</span>} />
        {loading ? (
          <Card className="p-8"><p className="text-center text-zinc-600 text-sm">{lang === "DE" ? "Analysiere…" : "Analyzing…"}</p></Card>
        ) : data?.insights?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {data.insights.map((c) => {
              const Icon = ICON[c.icon] || Sparkles;
              const conf = CONF_STYLE[c.confidence] || CONF_STYLE.low;
              return (
                <Card key={c.id} className="relative overflow-hidden p-4 sm:p-5">
                  <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none"
                    style={{ background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)" }} />
                  <div className="flex items-start justify-between mb-3 relative">
                    <div className="w-9 h-9 rounded-sm flex items-center justify-center"
                      style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}>
                      <Icon size={16} style={{ color: V }} />
                    </div>
                    {c.metric && (
                      <span className="text-lg font-bold" style={{
                        fontFamily: SORA,
                        background: "linear-gradient(135deg, #C4B5FD, #7C3AED)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                      }}>{c.metric}</span>
                    )}
                  </div>
                  <div className="text-[14px] font-semibold text-zinc-100 leading-snug mb-1.5 relative">{c.title}</div>
                  <p className="text-[12px] text-zinc-500 leading-relaxed relative">{c.detail}</p>
                  <div className="flex items-center gap-1.5 mt-3 relative">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: conf.fg }} />
                    <span className="text-[10px]" style={{ color: conf.fg }}>{lang === "DE" ? conf.label_de : conf.label_en}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-8"><p className="text-center text-zinc-600 text-sm">
            {lang === "DE" ? "Noch nicht genug Daten. Erstelle Assets und Pläne – die Engine lernt mit." : "Not enough data yet. Create assets and plans – the engine learns as you go."}
          </p></Card>
        )}
      </motion.section>

      {/* ══ RECOMMENDATIONS + OPTIMIZATIONS ═════════════════════════ */}
      <motion.section {...fadeUp(0.14)} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 sm:p-6">
          <SectionHeader icon={Lightbulb} title={lang === "DE" ? "Empfehlungen" : "Recommendations"} />
          <div className="space-y-2.5">
            {(data?.recommendations || []).map((r) => {
              const p = PRIO_STYLE[r.priority] || PRIO_STYLE.medium;
              return (
                <button key={r.id} onClick={() => ACTION_ROUTE[r.action] && navigate(ACTION_ROUTE[r.action])}
                  className="group flex w-full min-w-0 items-start gap-2.5 rounded-sm p-3 text-left transition-colors sm:gap-3"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 uppercase tracking-wider flex-shrink-0"
                    style={{ background: p.bg, color: p.fg }}>{r.priority}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-zinc-200 leading-snug">{r.title}</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{r.detail}</div>
                  </div>
                  {ACTION_ROUTE[r.action] && <ArrowRight size={13} className="text-zinc-600 group-hover:text-[#7C3AED] flex-shrink-0 mt-1" />}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-4 sm:p-6" style={{
          background: "linear-gradient(145deg, rgba(124,58,237,0.05) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid rgba(124,58,237,0.14)",
        }}>
          <SectionHeader icon={Wrench} title={lang === "DE" ? "Optimierungen" : "Optimizations"} />
          {data?.optimizations?.length ? (
            <div className="space-y-2.5">
              {data.optimizations.map((o) => (
                <button key={o.id} onClick={() => ACTION_ROUTE[o.action] && navigate(ACTION_ROUTE[o.action])}
                  className="flex w-full min-w-0 items-start gap-2.5 rounded-sm p-3 text-left"
                  style={{ background: "rgba(255,255,255,0.02)", borderLeft: `3px solid ${V}` }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-zinc-200 leading-snug">{o.title}</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{o.detail}</div>
                  </div>
                  {ACTION_ROUTE[o.action] && <ArrowRight size={13} className="text-zinc-600 flex-shrink-0 mt-1" />}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-zinc-600 py-4 text-center">{lang === "DE" ? "Keine offenen Optimierungen." : "No open optimizations."}</p>
          )}
        </Card>
      </motion.section>

      {/* ══ PERFORMANCE TRENDS ══════════════════════════════════════ */}
      <motion.section {...fadeUp(0.18)}>
        <SectionHeader icon={TrendingUp} title={lang === "DE" ? "Performance-Trends" : "Performance Trends"}
          right={<span className="text-[10px] text-zinc-700 uppercase tracking-widest">{trends.window_days || 30} {lang === "DE" ? "Tage" : "days"}</span>} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { key: "assets", label: lang === "DE" ? "Assets / Tag" : "Assets / day", color: V, icon: Layers },
            { key: "approved", label: lang === "DE" ? "Freigaben / Tag" : "Approvals / day", color: "#4ade80", icon: CheckCircle2 },
            { key: "plans", label: lang === "DE" ? "Pläne / Tag" : "Plans / day", color: "#C084FC", icon: Target },
          ].map((t) => {
            const series = trends[t.key] || [];
            const sum = series.reduce((a, p) => a + p.value, 0);
            const Icon = t.icon;
            return (
              <Card key={t.key} className="p-4 sm:p-5">
                <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon size={13} className="flex-shrink-0" style={{ color: t.color }} />
                    <span className="truncate text-[12px] text-zinc-400">{t.label}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ fontFamily: SORA, color: t.color }}>{sum}</span>
                </div>
                <Sparkline series={series} color={t.color} />
              </Card>
            );
          })}
        </div>
      </motion.section>

      {/* ══ SUMMARIES ═══════════════════════════════════════════════ */}
      <motion.section {...fadeUp(0.22)}>
        <SectionHeader icon={Gauge} title={lang === "DE" ? "Zusammenfassungen" : "Summaries"} />
        <div className="mb-4 flex flex-wrap gap-1 sm:justify-end">
          {["daily", "weekly", "monthly"].map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className="rounded-full px-2 py-1 text-[10px] transition-colors sm:px-2.5"
              style={{
                background: period === p ? "rgba(124,58,237,0.16)" : "transparent",
                border: `1px solid ${period === p ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: period === p ? "#a78bfa" : "#71717a",
              }}>
              {p === "daily" ? (lang === "DE" ? "Täglich" : "Daily")
                : p === "weekly" ? (lang === "DE" ? "Wöchentlich" : "Weekly")
                  : (lang === "DE" ? "Monatlich" : "Monthly")}
            </button>
          ))}
        </div>
        {summary ? (
          <Card className="p-4 sm:p-6">
            <div className="mb-4 flex min-w-0 items-center gap-2">
              <Activity size={14} style={{ color: V }} />
              <span className="min-w-0 break-words text-sm font-semibold text-zinc-200" style={{ fontFamily: SORA }}>{summary.label}</span>
            </div>
            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
              {[
                { label: lang === "DE" ? "Generiert" : "Generated", value: summary.generated },
                { label: lang === "DE" ? "Freigegeben" : "Approved", value: summary.approved },
                { label: lang === "DE" ? "Abgelehnt" : "Rejected", value: summary.rejected },
                { label: lang === "DE" ? "Pläne" : "Plans", value: summary.plans },
              ].map((s) => (
                <div key={s.label} className="rounded-sm p-3 text-center"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="text-xl font-bold" style={{ fontFamily: SORA, color: "#e4e4e7" }}>{s.value}</div>
                  <div className="text-[10px] text-zinc-600 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {(summary.highlights || []).map((h, i) => (
                <span key={i} className="inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]"
                  style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.24)", color: "#a78bfa" }}>
                  <Sparkles size={10} className="flex-shrink-0" /><span className="min-w-0 break-words">{h}</span>
                </span>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="p-8"><p className="text-center text-zinc-600 text-sm">{lang === "DE" ? "Lade Zusammenfassung…" : "Loading summary…"}</p></Card>
        )}
      </motion.section>

      <p className="px-2 text-center text-[10px] leading-relaxed text-zinc-700">
        {lang === "DE"
          ? `Alle Erkenntnisse basieren ausschließlich auf den Daten von „${activeBrand?.name || "—"}" in diesem Workspace. Keine externen Analytics.`
          : `All insights are derived solely from "${activeBrand?.name || "—"}" data in this workspace. No external analytics.`}
      </p>
    </div>
  );
}

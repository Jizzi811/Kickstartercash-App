import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2, CheckCircle2, AlertTriangle, XCircle, TrendingUp, Sparkles } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { PageTitle } from "@/components/PageTitle";
import { Textarea } from "@/components/ui/textarea";

const statusMeta = {
  pass: { icon: CheckCircle2, color: "#34D399", bg: "rgba(52,211,153,0.1)" },
  warn: { icon: AlertTriangle, color: "#7C3AED", bg: "rgba(124,58,237,0.1)" },
  fail: { icon: XCircle, color: "#F87171", bg: "rgba(248,113,113,0.1)" },
};

const scoreColor = (s) => (s >= 80 ? "#34D399" : s >= 60 ? "#7C3AED" : "#F87171");

function Gauge({ score }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(Math.max(score, 0), 100) / 100) * c;
  const color = scoreColor(score);
  return (
    <div className="relative w-36 h-36" data-testid="guardian-score-gauge">
      <svg width="144" height="144" className="-rotate-90">
        <circle cx="72" cy="72" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <motion.circle
          cx="72" cy="72" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl" style={{ color }}>{score}</span>
        <span className="text-[10px] tracking-[0.2em] uppercase text-zinc-500">/ 100</span>
      </div>
    </div>
  );
}

function Stars({ score }) {
  const filled = Math.round((score / 100) * 5);
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Sparkles key={`star-${i}`} size={18} fill={i < filled ? "#7C3AED" : "none"} className={i < filled ? "text-[#7C3AED]" : "text-zinc-700"} />
      ))}
    </div>
  );
}

function Bar({ label, value }) {
  const color = scoreColor(value);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-400">{label}</span>
        <span style={{ color }}>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ background: color }} />
      </div>
    </div>
  );
}

export default function Guardian() {
  const { t, lang, model, activeBrandId, activeBrand } = useApp();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const analyze = async () => {
    if (!content.trim()) { toast.error(t("guardian_input")); return; }
    setLoading(true); setResult(null);
    try {
      const res = await axios.post(`${API}/analyze/content`, {
        content, content_type: "Text", brand_id: activeBrandId, model, language: lang,
      });
      setResult(res.data);
    } catch (e) {
      toast.error(t("error_generic"));
    } finally { setLoading(false); }
  };

  const loadLast = async () => {
    try {
      const res = await axios.get(`${API}/history`, { params: { type: "copy", limit: 1 } });
      const last = res.data?.[0];
      if (last) setContent(`${last.title}\n\n${last.body}`);
      else toast.error(t("export_empty"));
    } catch { toast.error(t("error_generic")); }
  };

  return (
    <div>
      <PageTitle title={t("guardian_title")} subtitle={t("guardian_sub")} icon={ShieldCheck} />

      <div className="bg-[#0A0A0A] border border-white/10 rounded-md p-6 md:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs tracking-[0.12em] uppercase text-zinc-500">{t("guardian_input")}</label>
          <button data-testid="guardian-loadlast-btn" onClick={loadLast} className="text-xs text-[#7C3AED] hover:underline">{t("guardian_loadlast")}</button>
        </div>
        <Textarea data-testid="guardian-input" rows={6} value={content} onChange={(e) => setContent(e.target.value)}
          placeholder={t("guardian_input_ph")} className="bg-black/40 border-white/10 focus:border-[#7C3AED] focus-visible:ring-[#7C3AED]/40 text-white" />
        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className="text-xs text-zinc-500">{t("activeBrand")}: <span className="text-[#7C3AED]">{activeBrand?.name}</span></span>
          <button data-testid="guardian-analyze-btn" disabled={loading} onClick={analyze}
            className="inline-flex items-center gap-2 bg-[#7C3AED] text-white px-7 py-2.5 rounded-sm font-bold hover:bg-[#C4B5FD] transition-colors disabled:opacity-60">
            {loading ? <><Loader2 size={16} className="animate-spin" /> {t("generating")}</> : t("guardian_btn")}
          </button>
        </div>
      </div>

      {loading && <div className="h-64 rounded-md shimmer mt-8" />}
      {!loading && !result && <p className="text-center text-zinc-600 text-sm py-10">{t("empty_hint")}</p>}

      {!loading && result && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5" data-testid="guardian-result">
          {/* Score panel */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-md p-6 flex flex-col items-center text-center">
            <div className="text-xs tracking-[0.12em] uppercase text-[#7C3AED] mb-4">{t("guardian_score")}</div>
            <Gauge score={result.score || 0} />
            <div className="mt-4"><Stars score={result.score || 0} /></div>
            <p className="text-sm text-zinc-400 mt-4 leading-relaxed">{result.verdict}</p>
            <div className="w-full mt-6 space-y-3">
              <Bar label={t("guardian_brandmatch")} value={result.brand_match || 0} />
              <Bar label={t("guardian_tonematch")} value={result.tone_match || 0} />
            </div>
          </div>

          {/* Brand checks */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-md p-6">
            <div className="text-xs tracking-[0.12em] uppercase text-[#7C3AED] mb-4">{t("guardian_checks")}</div>
            <div className="space-y-3">
              {(result.checks || []).map((c, i) => {
                const meta = statusMeta[c.status] || statusMeta.warn;
                const Icon = meta.icon;
                return (
                  <div key={`check-${i}-${c.label || ""}`} data-testid={`guardian-check-${i}`} className="flex items-start gap-3 p-2.5 rounded-sm" style={{ background: meta.bg }}>
                    <Icon size={17} style={{ color: meta.color }} className="mt-0.5 shrink-0" />
                    <div>
                      <div className="text-sm text-white font-medium">{c.label}</div>
                      <div className="text-xs text-zinc-400">{c.note}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Improvements + strengths */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-md p-6 space-y-6">
            <div>
              <div className="text-xs tracking-[0.12em] uppercase text-[#7C3AED] mb-3 flex items-center gap-1.5"><TrendingUp size={13} /> {t("guardian_improvements")}</div>
              <ul className="space-y-2">
                {(result.improvements || []).map((imp, i) => (
                  <li key={`imp-${i}-${String(imp).slice(0, 16)}`} className="text-sm text-zinc-300 flex gap-2"><span className="text-[#7C3AED]">→</span> {imp}</li>
                ))}
              </ul>
            </div>
            {result.strengths?.length > 0 && (
              <div className="border-t border-white/10 pt-4">
                <div className="text-xs tracking-[0.12em] uppercase text-zinc-500 mb-3">{t("guardian_strengths")}</div>
                <ul className="space-y-2">
                  {result.strengths.map((s, i) => (
                    <li key={`str-${i}-${String(s).slice(0, 16)}`} className="text-sm text-zinc-400 flex gap-2"><CheckCircle2 size={14} className="text-[#34D399] mt-0.5 shrink-0" /> {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

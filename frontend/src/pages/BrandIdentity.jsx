import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
  Dna, Save, Palette, PenLine, TrendingUp, Brain, Gauge, ShieldCheck,
  AlertTriangle, Loader2, Sparkles, CheckCircle2,
} from "lucide-react";
import { useApp, API } from "@/context/AppContext";

const V = "#7C3AED";
const SORA = "'Sora', sans-serif";
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

const LAYER_ICON = { visual: Palette, communication: PenLine, business: TrendingUp, psychology: Brain };

function GradientHeading({ children, className = "" }) {
  return (
    <h2 className={`font-semibold ${className}`} style={{ fontFamily: SORA }}>
      <span style={{
        background: "linear-gradient(90deg, #C4B5FD 0%, #7C3AED 50%, #6D28D9 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
      }}>{children}</span>
    </h2>
  );
}
function Card({ children, className = "", style = {} }) {
  return (
    <div className={`rounded-sm ${className}`}
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", ...style }}>
      {children}
    </div>
  );
}
function Ring({ pct, size = 64, stroke = 6 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={V} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset .6s ease" }} />
      <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle"
        fill="#fff" fontSize={size * 0.26} fontWeight="700" fontFamily={SORA}>{pct}%</text>
    </svg>
  );
}

export default function BrandIdentity() {
  const { lang, activeBrandId, activeBrand } = useApp();
  const [schema, setSchema] = useState(null);
  const [data, setData] = useState(null);
  const [dna, setDna] = useState({});           // stored (user-authored) DNA being edited
  const [merged, setMerged] = useState({});     // effective DNA (derived + stored) for placeholders
  const [tab, setTab] = useState("visual");
  const [saving, setSaving] = useState(false);
  const [scoreText, setScoreText] = useState("");
  const [score, setScore] = useState(null);
  const [scoring, setScoring] = useState(false);

  const load = useCallback(async () => {
    if (!activeBrandId) return;
    try {
      const [s, d] = await Promise.all([
        axios.get(`${API}/brand-identity/schema`),
        axios.get(`${API}/brand-identity/${activeBrandId}`, { params: { language: lang } }),
      ]);
      setSchema(s.data);
      setData(d.data);
      setDna(d.data.stored_dna || {});
      setMerged(d.data.dna || {});
    } catch { toast.error(lang === "DE" ? "Identität laden fehlgeschlagen" : "Failed to load identity"); }
  }, [activeBrandId, lang]);

  useEffect(() => { load(); }, [load]);

  const setField = (layer, fid, value) => {
    setDna((d) => ({ ...d, [layer]: { ...(d[layer] || {}), [fid]: value } }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await axios.put(`${API}/brand-identity/${activeBrandId}`, { dna });
      setData((prev) => ({ ...prev, completeness: r.data.completeness, validation: r.data.validation }));
      setMerged(r.data.dna || {});
      toast.success(lang === "DE" ? "Marken-DNA gespeichert" : "Brand DNA saved");
    } catch { toast.error(lang === "DE" ? "Speichern fehlgeschlagen" : "Save failed"); }
    finally { setSaving(false); }
  };

  const runScore = async () => {
    if (!scoreText.trim() || scoring) return;
    setScoring(true); setScore(null);
    try {
      const r = await axios.post(`${API}/brand-identity/${activeBrandId}/score`,
        { content: scoreText.trim(), language: lang });
      setScore(r.data);
    } catch { toast.error(lang === "DE" ? "Score fehlgeschlagen" : "Score failed"); }
    finally { setScoring(false); }
  };

  const layers = useMemo(() => schema?.layers || [], [schema]);
  const activeLayer = useMemo(() => layers.find((l) => l.id === tab), [layers, tab]);
  const comp = data?.completeness;

  if (!schema || !data) {
    return <div className="py-20 text-center text-zinc-600 text-sm">{lang === "DE" ? "Lade Marken-Identität…" : "Loading brand identity…"}</div>;
  }

  const scoreColor = (n) => n >= 85 ? "#4ade80" : n >= 65 ? "#a78bfa" : "#fb7185";

  return (
    <div className="space-y-8 pb-10">
      {/* HERO */}
      <motion.section {...fadeUp(0)}>
        <div className="relative overflow-hidden rounded-sm" style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(8,8,8,0) 55%, rgba(124,58,237,0.05) 100%)",
          border: "1px solid rgba(124,58,237,0.18)",
        }}>
          <div className="absolute -top-28 -left-28 w-96 h-96 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)" }} />
          <div className="relative px-6 md:px-10 py-8 md:py-10 flex items-center justify-between gap-6 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-[10px] tracking-[0.2em] uppercase font-semibold"
                style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.26)", color: V }}>
                <Dna size={11} /> Brand Identity Engine
              </div>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2" style={{ fontFamily: SORA }}>
                <span style={{
                  background: "linear-gradient(90deg, #7C3AED 0%, #C4B5FD 45%, #6D28D9 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>{activeBrand?.name || "—"} · DNA</span>
              </h1>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">
                {lang === "DE"
                  ? "Die komplette Identität deiner Marke in vier Ebenen. Jeder KI-Agent bekommt automatisch die passende DNA-Teilmenge."
                  : "Your brand's complete identity in four layers. Every AI agent automatically receives the right DNA subset."}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {comp && <Ring pct={comp.overall} size={76} />}
              <button onClick={save} disabled={saving}
                className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-sm transition-all disabled:opacity-40"
                style={{ background: V, color: "#0A0A0A" }}>
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {lang === "DE" ? "Speichern" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* LAYER TABS + completeness */}
      <motion.section {...fadeUp(0.05)} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {layers.map((l) => {
          const Icon = LAYER_ICON[l.id] || Dna;
          const pct = comp?.layers?.[l.id]?.pct ?? 0;
          const on = tab === l.id;
          return (
            <button key={l.id} onClick={() => setTab(l.id)}
              className="text-left rounded-sm p-4 transition-all"
              style={{
                background: on ? "rgba(124,58,237,0.1)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${on ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.07)"}`,
              }}>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-sm flex items-center justify-center"
                  style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}>
                  <Icon size={15} style={{ color: V }} />
                </div>
                <span className="text-[13px] font-bold" style={{ fontFamily: SORA, color: pct >= 70 ? "#4ade80" : "#a78bfa" }}>{pct}%</span>
              </div>
              <div className="text-[12px] font-semibold text-zinc-200">{lang === "DE" ? l.de : l.en}</div>
              <div className="text-[10px] text-zinc-600 mt-0.5 leading-snug">{lang === "DE" ? l.desc_de : l.desc_en}</div>
            </button>
          );
        })}
      </motion.section>

      {/* EDITOR for active layer */}
      {activeLayer && (
        <motion.section key={tab} {...fadeUp(0.05)}>
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">{activeLayer.emoji}</span>
              <GradientHeading className="text-base">{lang === "DE" ? activeLayer.de : activeLayer.en}</GradientHeading>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeLayer.fields.map((f) => {
                const stored = dna?.[tab]?.[f.id];
                const val = stored !== undefined ? stored : "";
                const placeholder = (() => {
                  const m = merged?.[tab]?.[f.id];
                  if (m && (stored === undefined || stored === "")) {
                    return Array.isArray(m) ? m.join(", ") : String(m);
                  }
                  return lang === "DE" ? f.hint_de : f.hint_en;
                })();
                const label = (
                  <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 mb-1.5">
                    {(lang === "DE" ? f.de : f.en)}
                    {f.required && <span className="text-[8px] px-1 py-0.5 rounded-full" style={{ background: "rgba(124,58,237,0.14)", color: "#a78bfa" }}>{lang === "DE" ? "Kern" : "core"}</span>}
                  </label>
                );
                return (
                  <div key={f.id} className={f.type === "textarea" ? "md:col-span-2" : ""}>
                    {label}
                    {f.type === "select" ? (
                      <select className="w-full bg-[#0A0A0A] border border-white/10 rounded-sm px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-[#7C3AED]/50"
                        value={Array.isArray(val) ? "" : val}
                        onChange={(e) => setField(tab, f.id, e.target.value)}>
                        <option value="">{lang === "DE" ? "— wählen —" : "— select —"}</option>
                        {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : f.type === "list" ? (
                      <input
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-sm px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-[#7C3AED]/50 placeholder:text-zinc-700"
                        value={Array.isArray(val) ? val.join(", ") : val}
                        placeholder={placeholder + (lang === "DE" ? " (Komma-getrennt)" : " (comma-separated)")}
                        onChange={(e) => setField(tab, f.id, e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} />
                    ) : f.type === "textarea" ? (
                      <textarea rows={2}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-sm px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-[#7C3AED]/50 resize-none placeholder:text-zinc-700"
                        value={val} placeholder={placeholder}
                        onChange={(e) => setField(tab, f.id, e.target.value)} />
                    ) : (
                      <input
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-sm px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-[#7C3AED]/50 placeholder:text-zinc-700"
                        value={val} placeholder={placeholder}
                        onChange={(e) => setField(tab, f.id, e.target.value)} />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.section>
      )}

      {/* VALIDATION + BRAND SCORE */}
      <motion.section {...fadeUp(0.1)} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* validation */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-7 h-7 rounded-sm flex items-center justify-center"
              style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
              <ShieldCheck size={13} style={{ color: V }} />
            </div>
            <GradientHeading className="text-sm">{lang === "DE" ? "DNA-Validierung" : "DNA Validation"}</GradientHeading>
          </div>
          {data.validation && Object.keys(data.validation).length ? (
            <div className="space-y-3">
              {Object.entries(data.validation).map(([layerId, gaps]) => {
                const l = layers.find((x) => x.id === layerId);
                return (
                  <div key={layerId}>
                    <div className="flex items-center gap-1.5 text-[12px] text-zinc-300 mb-1.5">
                      <AlertTriangle size={12} style={{ color: "#fbbf24" }} />
                      {l ? (lang === "DE" ? l.de : l.en) : layerId}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {gaps.map((g) => (
                        <button key={g.id} onClick={() => setTab(layerId)}
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}>
                          {lang === "DE" ? g.de : g.en}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[13px] text-zinc-400 py-4">
              <CheckCircle2 size={15} style={{ color: "#4ade80" }} />
              {lang === "DE" ? "Alle Kernfelder ausgefüllt – starke DNA!" : "All core fields filled – strong DNA!"}
            </div>
          )}
        </Card>

        {/* brand consistency score */}
        <Card className="p-6" style={{
          background: "linear-gradient(145deg, rgba(124,58,237,0.05) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid rgba(124,58,237,0.14)",
        }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-7 h-7 rounded-sm flex items-center justify-center"
              style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
              <Gauge size={13} style={{ color: V }} />
            </div>
            <GradientHeading className="text-sm">{lang === "DE" ? "Marken-Konsistenz-Score" : "Brand Consistency Score"}</GradientHeading>
          </div>
          <textarea rows={3} value={scoreText} onChange={(e) => setScoreText(e.target.value)}
            placeholder={lang === "DE" ? "Text einfügen (z.B. einen Post) und gegen die DNA prüfen…" : "Paste content (e.g. a post) to check against the DNA…"}
            className="w-full bg-[#0A0A0A] border border-white/10 rounded-sm px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-[#7C3AED]/50 resize-none placeholder:text-zinc-700 mb-2" />
          <button onClick={runScore} disabled={scoring || !scoreText.trim()}
            className="inline-flex items-center gap-2 text-[13px] font-semibold px-4 py-2 rounded-sm disabled:opacity-40"
            style={{ background: "rgba(124,58,237,0.14)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa" }}>
            {scoring ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {lang === "DE" ? "Score berechnen" : "Compute score"}
          </button>
          {score && (
            <div className="mt-4">
              <div className="flex items-center gap-4 mb-3">
                <Ring pct={score.overall} size={60} />
                <div>
                  <div className="text-[13px] font-semibold" style={{ color: scoreColor(score.overall) }}>
                    {score.overall >= 85 ? (lang === "DE" ? "Stark on-brand" : "Strongly on-brand")
                      : score.overall >= 65 ? (lang === "DE" ? "Weitgehend on-brand" : "Mostly on-brand")
                        : (lang === "DE" ? "Weicht ab" : "Off-brand")}
                  </div>
                  <div className="text-[11px] text-zinc-600">{lang === "DE" ? "Passung zur Markenidentität" : "Fit to brand identity"}</div>
                </div>
              </div>
              <div className="space-y-2">
                {Object.entries(score.layers).map(([lid, l]) => (
                  <div key={lid} className="p-2.5 rounded-sm" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] text-zinc-300">{l.emoji} {lang === "DE" ? l.label_de : l.label_en}</span>
                      <span className="text-[12px] font-bold" style={{ color: scoreColor(l.score) }}>{l.score}%</span>
                    </div>
                    {l.findings?.map((fnd, i) => (
                      <div key={i} className="text-[10px] text-zinc-500 leading-snug">· {fnd}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </motion.section>

      <p className="text-[10px] text-zinc-700 text-center">
        {lang === "DE"
          ? "Die DNA wird automatisch in jede KI-Generierung eingespeist – jeder Agent erhält nur die für ihn relevanten Ebenen."
          : "The DNA is automatically injected into every AI generation – each agent receives only its relevant layers."}
      </p>
    </div>
  );
}

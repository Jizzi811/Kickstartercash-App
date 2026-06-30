import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { BarChart2, ExternalLink, Loader2, Copy, Check } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { ToolCard, AgentChatPanel } from "@/components/StudioLayout";
import { PageHeader } from "@/components/PageHeader";

const COLOR = "#A78BFA";

const TOOLS = [
  { id: "kpis",   label: "KPI-Dashboard",  label_en: "KPI Dashboard",  emoji: "📊", type: "llm", desc: "Wichtigste KPIs, Zielwerte und Mess-Methoden definieren." },
  { id: "report", label: "Report",         label_en: "Report",         emoji: "📋", type: "llm", desc: "Report-Vorlage erstellen und Daten interpretieren." },
  { id: "ab_test",label: "A/B Test",       label_en: "A/B Test",       emoji: "🔬", type: "llm", desc: "A/B-Test-Plan mit Hypothese, Varianten und Erfolgskriterien." },
  { id: "growth", label: "Wachstums-Plan", label_en: "Growth Plan",    emoji: "🚀", type: "llm", desc: "Datengetriebener Wachstumsplan mit konkreten Maßnahmen." },
];

const PLATFORMS = [
  { name: "Google Analytics 4", emoji: "📊", url: "https://analytics.google.com", desc: "Traffic & Conversion" },
  { name: "Meta Ads Manager",   emoji: "📘", url: "https://adsmanager.facebook.com", desc: "Facebook & Instagram Ads" },
  { name: "TikTok Analytics",   emoji: "🎵", url: "https://ads.tiktok.com", desc: "TikTok Performance" },
  { name: "Google Search Console", emoji: "🔍", url: "https://search.google.com/search-console", desc: "Organic Search" },
];

function ResultCard({ result, color }) {
  const [copied, setCopied] = useState(false);
  if (!result) return null;
  return (
    <div className="bg-[#0A0A0A] border border-white/8 rounded-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8">
        <span className="text-xs font-medium" style={{ color }}>{result.label}</span>
        <button onClick={() => { navigator.clipboard.writeText(result.text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white">
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied ? "Kopiert!" : "Kopieren"}
        </button>
      </div>
      <pre className="px-4 py-4 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed overflow-auto max-h-80">{result.text}</pre>
    </div>
  );
}

export default function AnalyticsStudio() {
  const { lang, model } = useApp();
  const [toolLoading, setToolLoading] = useState(null);
  const [context, setContext] = useState("");
  const [result, setResult] = useState(null);

  const runTool = async (tool) => {
    setToolLoading(tool.id); setResult(null);
    try {
      const res = await axios.post(`${API}/agents/tools/run`, { agent_id: "analytics", tool_id: tool.id, context, model, language: lang });
      setResult({ label: lang === "DE" ? tool.label : tool.label_en, text: res.data.reply });
    } catch { toast.error("Fehler"); }
    finally { setToolLoading(null); }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        icon={BarChart2}
        color="#A78BFA"
        title="Analytics"
        subtitle={lang === "DE" ? "GA4 · Meta Ads · TikTok · Search Console" : "GA4 · Meta Ads · TikTok · Search Console"}
        badge="Analytics"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PLATFORMS.map((p) => (
          <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 bg-[#0A0A0A] border border-white/8 rounded-sm hover:border-white/20 transition-all group">
            <span className="text-xl">{p.emoji}</span>
            <div>
              <div className="text-xs font-medium text-zinc-300 group-hover:text-white flex items-center gap-1">
                {p.name} <ExternalLink size={9} className="text-zinc-600" />
              </div>
              <div className="text-[10px] text-zinc-600 mt-0.5">{p.desc}</div>
            </div>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-[#0A0A0A] border border-white/8 rounded-sm p-5 space-y-3">
            <label className="block text-xs text-zinc-500 uppercase tracking-widest">
              {lang === "DE" ? "Kontext / Frage" : "Context / Question"}
            </label>
            <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={3}
              placeholder={lang === "DE" ? "z.B. CTR 1.2%, Conversion 0.8%, 500 Besucher täglich…" : "e.g. CTR 1.2%, Conversion 0.8%, 500 daily visitors…"}
              className="w-full bg-black border border-white/8 rounded-sm px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none focus:border-[#A78BFA]/40" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {TOOLS.map((tool) => (
              <ToolCard key={tool.id} tool={tool} color={COLOR} onRun={runTool}
                isRunning={toolLoading === tool.id} disabled={!!toolLoading} />
            ))}
          </div>
          {toolLoading && <div className="flex items-center gap-3 px-4 py-4 bg-[#0A0A0A] border border-white/8 rounded-sm text-zinc-500 text-sm">
            <Loader2 size={16} className="animate-spin" style={{ color: COLOR }} />
            {lang === "DE" ? "Wird ausgewertet…" : "Analyzing…"}
          </div>}
          <ResultCard result={result} color={COLOR} />
        </div>
        <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/8 rounded-sm flex flex-col" style={{ minHeight: "420px" }}>
          <AgentChatPanel agentId="analytics" agentName="Analytics Agent" agentEmoji="📈" color={COLOR}
            placeholder={lang === "DE" ? "Daten fragen…" : "Ask about data…"} />
        </div>
      </div>
    </div>
  );
}

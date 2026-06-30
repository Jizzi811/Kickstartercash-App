import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { BarChart2, Loader2 } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { AgentChatPanel, ToolCard } from "@/components/StudioLayout";
import { PageHeader } from "@/components/PageHeader";

const COLOR = "#3B82F6";

const TOOLS = [
  { id: "analyst_model", label: "Finanzmodell", label_en: "Financial Model", emoji: "🏗️", type: "llm",
    desc: "Struktur eines robusten Finanzmodells erstellen." },
  { id: "analyst_dcf", label: "DCF-Bewertung", label_en: "DCF Valuation", emoji: "💎", type: "llm",
    desc: "Discounted-Cashflow-Analyse und Unternehmensbewertung." },
  { id: "analyst_scenario", label: "Szenarioanalyse", label_en: "Scenario Analysis", emoji: "🎭", type: "llm",
    desc: "Best/Base/Worst-Case-Szenarien mit Annahmen." },
  { id: "analyst_sensitivity", label: "Sensitivität", label_en: "Sensitivity Analysis", emoji: "🎛️", type: "llm",
    desc: "Schlüsseltreiber und Sensitivitätsanalyse." },
  { id: "analyst_kpi", label: "KPI-Dashboard", label_en: "KPI Dashboard", emoji: "📊", type: "llm",
    desc: "Wichtigste Finanzkennzahlen und Benchmarks definieren." },
  { id: "analyst_report", label: "Analysebericht", label_en: "Analysis Report", emoji: "📄", type: "llm",
    desc: "Executive-ready Analysebericht strukturieren." },
];

export default function FinanceAnalystStudio() {
  const { lang } = useApp();
  const [toolLoading, setToolLoading] = useState(null);
  const [context, setContext] = useState("");

  const runTool = async (tool) => {
    setToolLoading(tool.id);
    try {
      const res = await axios.post(`${API}/agents/tools/run`, {
        agent_id: "financial_analyst", tool_id: tool.id, context, model: "gpt", language: lang,
      });
      if (res.data.reply) {
        setContext((p) => p + (p ? "\n\n---\n\n" : "") + `[${lang === "DE" ? tool.label : tool.label_en}]\n${res.data.reply}`);
      }
    } catch { toast.error("Fehler"); }
    finally { setToolLoading(null); }
  };

  return (
    <div className="space-y-8">
      <PageHeader icon={BarChart2} color={COLOR} title="Financial Analyst Studio" badge="Finance"
        subtitle={lang === "DE" ? "Fiona – Financial Analyst · Modelle · DCF · Szenarien · Berichte" : "Fiona – Financial Analyst · Models · DCF · Scenarios · Reports"} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <div className="border border-white/8 rounded-sm p-5 space-y-4" style={{ background: "rgba(59,130,246,0.03)" }}>
            <label className="block text-xs uppercase tracking-widest" style={{ color: COLOR }}>
              {lang === "DE" ? "Unternehmen / Daten / Kontext" : "Company / Data / Context"}
            </label>
            <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={4}
              placeholder={lang === "DE"
                ? "z.B. E-Commerce-Unternehmen, 500K Umsatz/Monat, 35% Bruttomarge, skalierend…"
                : "e.g. E-commerce company, 500K revenue/month, 35% gross margin, scaling…"}
              className="w-full bg-black border border-white/8 rounded-sm px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"
              onFocus={(e) => { e.target.style.borderColor = `${COLOR}50`; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-700 uppercase tracking-widest mb-3">
              {lang === "DE" ? "Tools — Kontext eingeben, dann klicken" : "Tools — enter context above, then click"}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TOOLS.map((tool) => (
                <motion.div key={tool.id} whileHover={{ y: -2 }} transition={{ duration: 0.18 }}>
                  <ToolCard tool={tool} color={COLOR} onRun={runTool} isRunning={toolLoading === tool.id} disabled={!!toolLoading} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/8 rounded-sm flex flex-col" style={{ minHeight: "520px" }}>
          <AgentChatPanel agentId="financial_analyst" agentName="Fiona – Financial Analyst" agentEmoji="📊" color={COLOR}
            placeholder={lang === "DE" ? "Finanzanalyse fragen…" : "Ask financial analysis questions…"} />
        </div>
      </div>
    </div>
  );
}

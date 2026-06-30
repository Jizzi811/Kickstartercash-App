import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { TrendingUp } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { AgentChatPanel, ToolCard, StudioContextArea } from "@/components/StudioLayout";
import { PageHeader } from "@/components/PageHeader";

const COLOR = "#10B981";

const TOOLS = [
  { id: "cfo_capital", label: "Kapitalallokation", label_en: "Capital Allocation", emoji: "💰", type: "llm",
    desc: "Strategische Empfehlungen zur optimalen Kapitalverteilung." },
  { id: "cfo_cashflow", label: "Cashflow-Analyse", label_en: "Cash Flow Analysis", emoji: "🌊", type: "llm",
    desc: "Cashflow-Prognose und Liquiditätsmanagement-Strategie." },
  { id: "cfo_kpis", label: "Finanz-KPIs", label_en: "Financial KPIs", emoji: "📊", type: "llm",
    desc: "Wichtigste Finanzkennzahlen für Ihr Business definieren." },
  { id: "cfo_investor", label: "Investor Relations", label_en: "Investor Relations", emoji: "🤝", type: "llm",
    desc: "Investoren-Kommunikation und Reporting-Strategie." },
  { id: "cfo_ma", label: "M&A Analyse", label_en: "M&A Analysis", emoji: "🔀", type: "llm",
    desc: "Due-Diligence-Framework und Bewertungsanalyse." },
  { id: "cfo_board", label: "Board Reporting", label_en: "Board Reporting", emoji: "📋", type: "llm",
    desc: "Executive Summary und Boardbericht-Struktur erstellen." },
];

export default function FinanceCFOStudio() {
  const { lang } = useApp();
  const [toolLoading, setToolLoading] = useState(null);
  const [context, setContext] = useState("");

  const runTool = async (tool) => {
    setToolLoading(tool.id);
    try {
      const res = await axios.post(`${API}/agents/tools/run`, {
        agent_id: "cfo", tool_id: tool.id, context, model: "gpt", language: lang,
      });
      if (res.data.reply) {
        setContext((p) => p + (p ? "\n\n---\n\n" : "") + `[${lang === "DE" ? tool.label : tool.label_en}]\n${res.data.reply}`);
      }
    } catch { toast.error("Fehler"); }
    finally { setToolLoading(null); }
  };

  return (
    <div className="space-y-8">
      <PageHeader icon={TrendingUp} color={COLOR} title="CFO Studio" badge="Finance"
        subtitle={lang === "DE" ? "Carl – CFO · Kapitalallokation · Cashflow · M&A · Board Reporting" : "Carl – CFO · Capital Allocation · Cash Flow · M&A · Board Reporting"} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <StudioContextArea color={COLOR} context={context} setContext={setContext}
            label="Unternehmen / Kontext" labelEN="Company / Context" title="CFO Studio"
            placeholder="z.B. SaaS-Startup, 2M ARR, Series A vorbereitung, 18 Monate Runway…"
            placeholderEN="e.g. SaaS startup, 2M ARR, preparing Series A, 18 months runway…" />
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
          <AgentChatPanel agentId="cfo" agentName="Carl – CFO" agentEmoji="💼" color={COLOR}
            placeholder={lang === "DE" ? "CFO-Fragen stellen…" : "Ask CFO questions…"} />
        </div>
      </div>
    </div>
  );
}

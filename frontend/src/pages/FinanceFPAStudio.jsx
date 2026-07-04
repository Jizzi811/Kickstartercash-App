import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { TrendingUp } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { AgentChatPanel, ToolCard, StudioContextArea } from "@/components/StudioLayout";
import { PageHeader } from "@/components/PageHeader";

const COLOR = "#6366F1";

const TOOLS = [
  { id: "fpa_budget", label: "Budgetplanung", label_en: "Budget Planning", emoji: "📅", type: "llm",
    desc: "Jahresbudget-Struktur und Planungsframework erstellen." },
  { id: "fpa_forecast", label: "Rolling Forecast", label_en: "Rolling Forecast", emoji: "🔄", type: "llm",
    desc: "13-Wochen oder Quartals-Rolling-Forecast aufbauen." },
  { id: "fpa_variance", label: "Varianzanalyse", label_en: "Variance Analysis", emoji: "🔍", type: "llm",
    desc: "Plan-/Ist-Vergleich mit Ursachenanalyse." },
  { id: "fpa_kpis", label: "KPI-Governance", label_en: "KPI Governance", emoji: "🎯", type: "llm",
    desc: "KPI-Framework und Reporting-Rhythmus definieren." },
  { id: "fpa_narrative", label: "Financial Narrative", label_en: "Financial Narrative", emoji: "📖", type: "llm",
    desc: "Die Geschichte hinter den Zahlen für das Management." },
  { id: "fpa_opex", label: "OpEx-Optimierung", label_en: "OpEx Optimization", emoji: "✂️", type: "llm",
    desc: "Betriebskosten analysieren und Einsparpotenziale finden." },
];

export default function FinanceFPAStudio() {
  const { lang, activeBrandId } = useApp();
  const [toolLoading, setToolLoading] = useState(null);
  const [context, setContext] = useState("");

  const runTool = async (tool) => {
    setToolLoading(tool.id);
    try {
      const res = await axios.post(`${API}/agents/tools/run`, {
        agent_id: "fpa", tool_id: tool.id, context, model: "gpt", language: lang, brand_id: activeBrandId,
      });
      if (res.data.reply) {
        setContext((p) => p + (p ? "\n\n---\n\n" : "") + `[${lang === "DE" ? tool.label : tool.label_en}]\n${res.data.reply}`);
      }
    } catch { toast.error("Fehler"); }
    finally { setToolLoading(null); }
  };

  return (
    <div className="space-y-8">
      <PageHeader icon={TrendingUp} color={COLOR} title="FP&A Studio" badge="Finance"
        subtitle={lang === "DE" ? "Felix – FP&A · Budget · Forecast · Varianzanalyse · KPI-Governance" : "Felix – FP&A · Budget · Forecast · Variance Analysis · KPI Governance"} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <StudioContextArea color={COLOR} context={context} setContext={setContext}
            label="Unternehmen / Finanzdaten / Kontext" labelEN="Company / Financial Data / Context" title="FP&A Studio"
            placeholder="z.B. 10 Mio. Umsatzziel 2025, aktuell 7 Mio., Q3 unter Plan, Personalkosten gestiegen…"
            placeholderEN="e.g. 10M revenue target 2025, currently 7M, Q3 below plan, headcount costs up…" />
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
          <AgentChatPanel agentId="fpa" agentName="Felix – FP&A Analyst" agentEmoji="📈" color={COLOR}
            placeholder={lang === "DE" ? "FP&A-Fragen stellen…" : "Ask FP&A questions…"} />
        </div>
      </div>
    </div>
  );
}

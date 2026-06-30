import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { AgentChatPanel, ToolCard, StudioContextArea } from "@/components/StudioLayout";
import { PageHeader } from "@/components/PageHeader";

const COLOR = "#F59E0B";

const TOOLS = [
  { id: "tax_strategy", label: "Steueroptimierung", label_en: "Tax Optimization", emoji: "🎯", type: "llm",
    desc: "Legale Steueroptimierungsstrategien für Ihr Business." },
  { id: "tax_international", label: "Int. Steuerplanung", label_en: "International Tax", emoji: "🌍", type: "llm",
    desc: "Internationale Steuerstrukturen und Jurisdiktionen." },
  { id: "tax_transfer", label: "Transfer Pricing", label_en: "Transfer Pricing", emoji: "🔄", type: "llm",
    desc: "Verrechnungspreisstrategien für konzerninterne Transaktionen." },
  { id: "tax_compliance", label: "Compliance-Check", label_en: "Compliance Check", emoji: "✅", type: "llm",
    desc: "Steuerliche Compliance-Anforderungen prüfen." },
  { id: "tax_planning", label: "Jahressteuerplanung", label_en: "Annual Tax Planning", emoji: "📅", type: "llm",
    desc: "Proaktive Steuerplanung für das laufende Geschäftsjahr." },
  { id: "tax_structure", label: "Unternehmensstruktur", label_en: "Entity Structure", emoji: "🏗️", type: "llm",
    desc: "Optimale Unternehmensstruktur für Steuervorteile." },
];

export default function FinanceTaxStudio() {
  const { lang } = useApp();
  const [toolLoading, setToolLoading] = useState(null);
  const [context, setContext] = useState("");

  const runTool = async (tool) => {
    setToolLoading(tool.id);
    try {
      const res = await axios.post(`${API}/agents/tools/run`, {
        agent_id: "tax", tool_id: tool.id, context, model: "gpt", language: lang,
      });
      if (res.data.reply) {
        setContext((p) => p + (p ? "\n\n---\n\n" : "") + `[${lang === "DE" ? tool.label : tool.label_en}]\n${res.data.reply}`);
      }
    } catch { toast.error("Fehler"); }
    finally { setToolLoading(null); }
  };

  return (
    <div className="space-y-8">
      <PageHeader icon={FileText} color={COLOR} title="Tax Studio" badge="Finance"
        subtitle={lang === "DE" ? "Tobias – Steuerstrategist · Optimierung · International · Compliance" : "Tobias – Tax Strategist · Optimization · International · Compliance"} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <StudioContextArea color={COLOR} context={context} setContext={setContext}
            label="Unternehmen / Steuerlicher Kontext" labelEN="Company / Tax Context" title="Tax Studio"
            placeholder="z.B. GmbH & Co. KG, Deutschland + UAE, 3 Mio. Gewinn, Expansion nach Österreich geplant…"
            placeholderEN="e.g. LLC, Germany + UAE, 3M profit, expansion to Austria planned…" />
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
          <AgentChatPanel agentId="tax" agentName="Tobias – Tax Strategist" agentEmoji="🧾" color={COLOR}
            placeholder={lang === "DE" ? "Steuerfragen stellen…" : "Ask tax questions…"} />
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { BookOpen } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { AgentChatPanel, ToolCard, StudioContextArea } from "@/components/StudioLayout";
import { PageHeader } from "@/components/PageHeader";

const COLOR = "#059669";

const TOOLS = [
  { id: "book_reconcile", label: "Kontenabstimmung", label_en: "Account Reconciliation", emoji: "⚖️", type: "llm",
    desc: "Prozess und Checkliste für Kontenabstimmungen." },
  { id: "book_close", label: "Monatsabschluss", label_en: "Month-End Close", emoji: "📅", type: "llm",
    desc: "Monatsabschluss-Checkliste und Prozessoptimierung." },
  { id: "book_controls", label: "Interne Kontrollen", label_en: "Internal Controls", emoji: "🔒", type: "llm",
    desc: "Interne Kontrollsysteme und Compliance-Framework." },
  { id: "book_gaap", label: "GAAP-Compliance", label_en: "GAAP Compliance", emoji: "📜", type: "llm",
    desc: "GAAP-konforme Buchungspraxis und Dokumentation." },
  { id: "book_audit", label: "Audit-Vorbereitung", label_en: "Audit Preparation", emoji: "🔎", type: "llm",
    desc: "Audit-Ready-Checkliste und Dokumentationsstandards." },
  { id: "book_process", label: "Prozessdesign", label_en: "Process Design", emoji: "⚙️", type: "llm",
    desc: "Buchhaltungsprozesse optimieren und automatisieren." },
];

export default function FinanceBookkeeperStudio() {
  const { lang, activeBrandId } = useApp();
  const [toolLoading, setToolLoading] = useState(null);
  const [context, setContext] = useState("");

  const runTool = async (tool) => {
    setToolLoading(tool.id);
    try {
      const res = await axios.post(`${API}/agents/tools/run`, {
        agent_id: "bookkeeper", tool_id: tool.id, context, model: "gpt", language: lang, brand_id: activeBrandId,
      });
      if (res.data.reply) {
        setContext((p) => p + (p ? "\n\n---\n\n" : "") + `[${lang === "DE" ? tool.label : tool.label_en}]\n${res.data.reply}`);
      }
    } catch { toast.error("Fehler"); }
    finally { setToolLoading(null); }
  };

  return (
    <div className="space-y-8">
      <PageHeader icon={BookOpen} color={COLOR} title="Bookkeeper Studio" badge="Finance"
        subtitle={lang === "DE" ? "Bianca – Buchhalterin & Controller · Abschlüsse · Compliance · Audit" : "Bianca – Bookkeeper & Controller · Close · Compliance · Audit"} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <StudioContextArea color={COLOR} context={context} setContext={setContext}
            label="Unternehmen / Buchhaltungskontext" labelEN="Company / Accounting Context" title="Bookkeeper Studio"
            placeholder="z.B. GmbH, 15 Mitarbeiter, QuickBooks, monatlicher Abschluss, nächstes Audit in 3 Monaten…"
            placeholderEN="e.g. LLC, 15 employees, QuickBooks, monthly close, next audit in 3 months…" />
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
          <AgentChatPanel agentId="bookkeeper" agentName="Bianca – Bookkeeper & Controller" agentEmoji="📒" color={COLOR}
            placeholder={lang === "DE" ? "Buchhaltungsfragen stellen…" : "Ask accounting questions…"} />
        </div>
      </div>
    </div>
  );
}

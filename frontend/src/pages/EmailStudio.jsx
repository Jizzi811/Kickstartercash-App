import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { AgentChatPanel, ToolCard } from "@/components/StudioLayout";
import { PageHeader } from "@/components/PageHeader";

const COLOR = "#FBBF24";

const TOOLS = [
  { id: "email_welcome", label: "Willkommens-Serie", label_en: "Welcome Series", emoji: "👋", type: "llm",
    desc: "5-Mail-Willkommens-Sequenz für neue Mitglieder." },
  { id: "email_subject", label: "Betreffzeilen", label_en: "Subject Lines", emoji: "✉️", type: "llm",
    desc: "5 Betreffzeilen-Varianten mit A/B-Test-Empfehlung." },
  { id: "email_nurturing", label: "Nurturing-Sequenz", label_en: "Nurturing Sequence", emoji: "🌱", type: "llm",
    desc: "Lead-Nurturing-Sequenz für optimale Conversion." },
  { id: "email_reengagement", label: "Re-Engagement", label_en: "Re-Engagement", emoji: "🔄", type: "llm",
    desc: "Kampagne zur Reaktivierung inaktiver Kontakte." },
  { id: "email_vip", label: "VIP-Onboarding", label_en: "VIP Onboarding", emoji: "👑", type: "llm",
    desc: "Premium-Onboarding-Sequenz für VIP-Mitglieder." },
  { id: "email_sales", label: "Sales-E-Mail", label_en: "Sales Email", emoji: "💰", type: "llm",
    desc: "Konvertierende Verkaufs-E-Mail mit Psychologie-Triggern." },
];

export default function EmailStudio() {
  const { lang } = useApp();
  const [toolLoading, setToolLoading] = useState(null);
  const [context, setContext] = useState("");

  const runTool = async (tool) => {
    setToolLoading(tool.id);
    try {
      const res = await axios.post(`${API}/agents/tools/run`, {
        agent_id: "email", tool_id: tool.id, context, model: "gpt", language: lang,
      });
      if (res.data.reply) {
        setContext((p) => p + (p ? "\n\n---\n\n" : "") + `[${lang === "DE" ? tool.label : tool.label_en}]\n${res.data.reply}`);
      }
    } catch { toast.error("Fehler"); }
    finally { setToolLoading(null); }
  };

  return (
    <div className="space-y-8">
      <PageHeader icon={Mail} color={COLOR} title="E-Mail Marketing" badge="Email"
        subtitle={lang === "DE" ? "Emma – E-Mail-Strategin · Sequenzen · Betreffzeilen · CRM · Deliverability" : "Emma – Email Strategist · Sequences · Subject Lines · CRM · Deliverability"} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <div className="border border-white/8 rounded-sm p-5 space-y-4" style={{ background: "rgba(251,191,36,0.03)" }}>
            <label className="block text-xs uppercase tracking-widest" style={{ color: COLOR }}>
              {lang === "DE" ? "Ziel / Zielgruppe / Produkt" : "Goal / Audience / Product"}
            </label>
            <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={4}
              placeholder={lang === "DE"
                ? "z.B. Neue KickstarterCash-Mitglieder willkommen heißen, Cashback-Karte vorstellen…"
                : "e.g. Welcome new KickstarterCash members, introduce cashback card…"}
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
          <AgentChatPanel agentId="email" agentName="Emma – Email Strategist" agentEmoji="📧" color={COLOR}
            placeholder={lang === "DE" ? "E-Mail-Strategie fragen…" : "Ask about email strategy…"} />
        </div>
      </div>
    </div>
  );
}

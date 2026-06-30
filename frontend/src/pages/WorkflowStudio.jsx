import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { Workflow } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { AgentChatPanel, ToolCard } from "@/components/StudioLayout";
import { PageHeader } from "@/components/PageHeader";

const COLOR = "#F97316";

const TOOLS = [
  { id: "wf_map", label: "Prozess-Karte", label_en: "Process Map", emoji: "🗺️", type: "llm",
    desc: "Visualisiert Ist-Prozess als Flowchart (Textform)." },
  { id: "wf_sop", label: "SOP erstellen", label_en: "Create SOP", emoji: "📋", type: "llm",
    desc: "Standard Operating Procedure Schritt für Schritt." },
  { id: "wf_automation", label: "Automatisierungs-Plan", label_en: "Automation Plan", emoji: "⚡", type: "llm",
    desc: "Identifiziert Automatisierungspotenzial & Tool-Stack." },
  { id: "wf_funnel", label: "Funnel-Workflow", label_en: "Funnel Workflow", emoji: "🔽", type: "llm",
    desc: "Lead-to-Sale-Workflow mit allen Touchpoints & Automationen." },
  { id: "wf_onboarding", label: "Onboarding-Prozess", label_en: "Onboarding Process", emoji: "🚀", type: "llm",
    desc: "Neukunden-Onboarding-Workflow für KickstarterCash." },
  { id: "wf_kpis", label: "Prozess-KPIs", label_en: "Process KPIs", emoji: "📊", type: "llm",
    desc: "Definiert messbare KPIs für jeden Prozessschritt." },
];

export default function WorkflowStudio() {
  const { lang } = useApp();
  const [toolLoading, setToolLoading] = useState(null);
  const [context, setContext] = useState("");

  const runTool = async (tool) => {
    setToolLoading(tool.id);
    try {
      const res = await axios.post(`${API}/agents/tools/run`, {
        agent_id: "workflow", tool_id: tool.id, context, model: "gpt", language: lang,
      });
      if (res.data.reply) {
        setContext((p) => p + (p ? "\n\n---\n\n" : "") + `[${lang === "DE" ? tool.label : tool.label_en}]\n${res.data.reply}`);
      }
    } catch { toast.error("Fehler"); }
    finally { setToolLoading(null); }
  };

  return (
    <div className="space-y-8">
      <PageHeader icon={Workflow} color={COLOR} title="Workflow Architect" badge="Workflow"
        subtitle={lang === "DE" ? "Wren – Prozessdesign · SOPs · Automatisierungs-Architektur · KPIs · Skalierung" : "Wren – Process Design · SOPs · Automation Architecture · KPIs · Scaling"} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <div className="border border-white/8 rounded-sm p-5 space-y-4" style={{ background: "rgba(249,115,22,0.03)" }}>
            <label className="block text-xs uppercase tracking-widest" style={{ color: COLOR }}>
              {lang === "DE" ? "Prozess / Problem / Ziel" : "Process / Problem / Goal"}
            </label>
            <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={4}
              placeholder={lang === "DE"
                ? "z.B. Unser Mitglieder-Onboarding ist chaotisch – von Anmeldung bis Karte dauert es 2 Wochen…"
                : "e.g. Our member onboarding is chaotic – from registration to card takes 2 weeks…"}
              className="w-full bg-black border border-white/8 rounded-sm px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"
              onFocus={(e) => { e.target.style.borderColor = `${COLOR}50`; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-700 uppercase tracking-widest mb-3">
              {lang === "DE" ? "Tools — Prozess beschreiben, dann klicken" : "Tools — describe process above, then click"}
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
          <AgentChatPanel agentId="workflow" agentName="Wren – Workflow Architect" agentEmoji="⚙️" color={COLOR}
            placeholder={lang === "DE" ? "Workflow-Frage stellen…" : "Ask about workflows…"} />
        </div>
      </div>
    </div>
  );
}

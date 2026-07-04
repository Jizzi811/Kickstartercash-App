import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { Network } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { AgentChatPanel, ToolCard, StudioContextArea } from "@/components/StudioLayout";
import { PageHeader } from "@/components/PageHeader";

const COLOR = "#8B5CF6";

const TOOLS = [
  { id: "orch_decompose", label: "Aufgaben-Zerlegung", label_en: "Task Decomposition", emoji: "🧩", type: "llm",
    desc: "Zerlegt komplexe Aufgaben in atomare Teilschritte." },
  { id: "orch_routing", label: "Agenten-Routing", label_en: "Agent Routing", emoji: "🔀", type: "llm",
    desc: "Weist jedem Teilschritt den optimalen Agenten zu." },
  { id: "orch_workflow", label: "Workflow-Design", label_en: "Workflow Design", emoji: "🗺️", type: "llm",
    desc: "Entwirft sequenzielle, parallele & hierarchische Workflows." },
  { id: "orch_campaign", label: "Kampagnen-Plan", label_en: "Campaign Plan", emoji: "📣", type: "llm",
    desc: "Vollständiger Multi-Agenten-Plan für eine Marketingkampagne." },
  { id: "orch_audit", label: "System-Audit", label_en: "System Audit", emoji: "🔎", type: "llm",
    desc: "Analysiert welche Agenten optimiert oder ergänzt werden sollten." },
  { id: "orch_sprint", label: "Sprint-Plan", label_en: "Sprint Plan", emoji: "⚡", type: "llm",
    desc: "7-Tage-Sprint mit Aufgaben, Agenten & Meilensteinen." },
];

export default function OrchestratorStudio() {
  const { lang, activeBrandId } = useApp();
  const [toolLoading, setToolLoading] = useState(null);
  const [context, setContext] = useState("");

  const runTool = async (tool) => {
    setToolLoading(tool.id);
    try {
      const res = await axios.post(`${API}/agents/tools/run`, {
        agent_id: "orchestrator", tool_id: tool.id, context, model: "gpt", language: lang, brand_id: activeBrandId,
      });
      if (res.data.reply) {
        setContext((p) => p + (p ? "\n\n---\n\n" : "") + `[${lang === "DE" ? tool.label : tool.label_en}]\n${res.data.reply}`);
      }
    } catch { toast.error("Fehler"); }
    finally { setToolLoading(null); }
  };

  return (
    <div className="space-y-8">
      <PageHeader icon={Network} color={COLOR} title="Agents Orchestrator" badge="Orchestrator"
        subtitle={lang === "DE" ? "Orion – Multi-Agenten-Koordination · Workflow-Design · Task-Routing · Sprint-Planung" : "Orion – Multi-Agent Coordination · Workflow Design · Task Routing · Sprint Planning"} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <StudioContextArea color={COLOR} context={context} setContext={setContext}
            label="Aufgabe / Ziel / Projekt" labelEN="Task / Goal / Project" title="Orchestrator Studio"
            placeholder="Aufgabe / Ziel / Projekt"
            placeholderEN="Task / Goal / Project" />
          <div>
            <p className="text-[10px] text-zinc-700 uppercase tracking-widest mb-3">
              {lang === "DE" ? "Tools — Ziel beschreiben, dann klicken" : "Tools — describe goal above, then click"}
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
          <AgentChatPanel agentId="orchestrator" agentName="Orion – Orchestrator" agentEmoji="🧠" color={COLOR}
            placeholder={lang === "DE" ? "Orchestrator fragen…" : "Ask the orchestrator…"} />
        </div>
      </div>
    </div>
  );
}

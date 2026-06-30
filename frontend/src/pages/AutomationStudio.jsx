import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Zap, ExternalLink, Loader2, Copy, Check } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { ToolCard, AgentChatPanel } from "@/components/StudioLayout";
import { PageHeader } from "@/components/PageHeader";

const COLOR = "#F87171";

const TOOLS = [
  { id: "n8n",      label: "n8n Workflow",    label_en: "n8n Workflow",    emoji: "⚙️", type: "llm", desc: "Vollständiger n8n-Workflow mit Nodes, Verbindungen & Config." },
  { id: "email_seq",label: "E-Mail-Sequenz",  label_en: "Email Sequence",  emoji: "📧", type: "llm", desc: "Automatische 7-E-Mail-Onboarding-Sequenz aufbauen." },
  { id: "webhook",  label: "Webhook Setup",   label_en: "Webhook Setup",   emoji: "🔗", type: "llm", desc: "Webhook einrichten, Daten verarbeiten & weiterleiten." },
  { id: "zapier",   label: "Zapier / Make",   label_en: "Zapier / Make",   emoji: "⚡", type: "llm", desc: "Automationsplan für Zapier oder Make (Integromat)." },
  { id: "crm",      label: "CRM-Flow",        label_en: "CRM Flow",        emoji: "🤝", type: "llm", desc: "CRM-Automations-Workflow für Lead-Management." },
];

const PLATFORMS = [
  { name: "n8n",           emoji: "⚙️", url: "https://n8n.io",              desc: "Open-source Automation" },
  { name: "Make (Integromat)", emoji: "🔄", url: "https://make.com",         desc: "No-code Workflows" },
  { name: "Zapier",        emoji: "⚡", url: "https://zapier.com",           desc: "App-Verbindungen" },
  { name: "HTTP Requests", emoji: "🌐", url: "https://reqbin.com",           desc: "API-Tests & Webhooks" },
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

export default function AutomationStudio() {
  const { lang, model } = useApp();
  const [toolLoading, setToolLoading] = useState(null);
  const [context, setContext] = useState("");
  const [result, setResult] = useState(null);

  const runTool = async (tool) => {
    setToolLoading(tool.id); setResult(null);
    try {
      const res = await axios.post(`${API}/agents/tools/run`, { agent_id: "automation", tool_id: tool.id, context, model, language: lang });
      setResult({ label: lang === "DE" ? tool.label : tool.label_en, text: res.data.reply });
    } catch { toast.error("Fehler"); }
    finally { setToolLoading(null); }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Zap}
        color="#F87171"
        title="Automationen"
        subtitle={lang === "DE" ? "n8n · Make · Zapier · HTTP Requests · APIs · Datenbanken" : "n8n · Make · Zapier · HTTP Requests · APIs · Databases"}
        badge="Automation"
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
              {lang === "DE" ? "Was soll automatisiert werden?" : "What should be automated?"}
            </label>
            <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={3}
              placeholder={lang === "DE"
                ? "z.B. Neue Leads aus Typeform → CRM → Willkommens-E-Mail → Slack-Benachrichtigung…"
                : "e.g. New leads from Typeform → CRM → welcome email → Slack notification…"}
              className="w-full bg-black border border-white/8 rounded-sm px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none focus:border-[#F87171]/40" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TOOLS.map((tool) => (
              <ToolCard key={tool.id} tool={tool} color={COLOR} onRun={runTool}
                isRunning={toolLoading === tool.id} disabled={!!toolLoading} />
            ))}
          </div>
          {toolLoading && <div className="flex items-center gap-3 px-4 py-4 bg-[#0A0A0A] border border-white/8 rounded-sm text-zinc-500 text-sm">
            <Loader2 size={16} className="animate-spin" style={{ color: COLOR }} />
            {lang === "DE" ? "Workflow wird erstellt…" : "Building workflow…"}
          </div>}
          <ResultCard result={result} color={COLOR} />
        </div>
        <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/8 rounded-sm flex flex-col" style={{ minHeight: "420px" }}>
          <AgentChatPanel agentId="automation" agentName="Automation Agent" agentEmoji="🤖" color={COLOR}
            placeholder={lang === "DE" ? "Automation Agent fragen…" : "Ask the automation agent…"} />
        </div>
      </div>
    </div>
  );
}

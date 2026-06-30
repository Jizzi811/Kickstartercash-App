import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { Workflow } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { AgentChatPanel, ToolCard, StudioContextArea } from "@/components/StudioLayout";
import { PageHeader } from "@/components/PageHeader";

const COLOR = "#F97316";

const TOOLS = [
  { id: "wf_process",    label: "Prozess-Karte",          label_en: "Process Map",          emoji: "🗺️", type: "llm", desc: "Visualisiert Ist-Prozess als Flowchart (Textform)." },
  { id: "wf_sop",        label: "SOP erstellen",           label_en: "Create SOP",           emoji: "📋", type: "llm", desc: "Standard Operating Procedure Schritt für Schritt." },
  { id: "wf_automation", label: "Automatisierungs-Plan",   label_en: "Automation Plan",      emoji: "⚡", type: "llm", desc: "Identifiziert Automatisierungspotenzial & Tool-Stack." },
  { id: "wf_funnel",     label: "Funnel-Workflow",         label_en: "Funnel Workflow",      emoji: "🔽", type: "llm", desc: "Lead-to-Sale-Workflow mit allen Touchpoints & Automationen." },
  { id: "wf_onboarding", label: "Onboarding-Prozess",      label_en: "Onboarding Process",  emoji: "🚀", type: "llm", desc: "Neukunden-Onboarding-Workflow für Kickstartercash.Club." },
  { id: "wf_kpis",       label: "Prozess-KPIs",            label_en: "Process KPIs",        emoji: "📊", type: "llm", desc: "Definiert messbare KPIs für jeden Prozessschritt." },

  /* ── Kickstartercash.Club spezifische Workflows ──────────────────────── */
  { id: "wf_brand_content",    label: "Brand Content",          label_en: "Brand Content",          emoji: "🎨", type: "llm", desc: "Karte/Produkt → Plattform → Caption, Bildprompt, Reel-Idee, Hashtags, CTA." },
  { id: "wf_card_ads",         label: "Karten-Werbemittel",     label_en: "Card Ad Assets",         emoji: "💳", type: "llm", desc: "Banner-Ideen, Carousel-Struktur & Story-Frames für die schwarze Karte." },
  { id: "wf_week_plan",        label: "7-Tage Contentplan",     label_en: "7-Day Content Plan",     emoji: "📅", type: "llm", desc: "1-Klick → 7 Tage Posts für Instagram, TikTok, Facebook, LinkedIn." },
  { id: "wf_lead_magnet",      label: "Lead-Magnet",            label_en: "Lead Magnet PDF",        emoji: "🧲", type: "llm", desc: "Erstellt PDF-Inhalte: Checkliste, Guide, Ratgeber für Kartenthemen." },
  { id: "wf_faq_content",      label: "FAQ → Content",          label_en: "FAQ to Content",         emoji: "❓", type: "llm", desc: "FAQ rein → Posts, Reels, Story-Fragen, Carousel-Slides, Newsletter." },
  { id: "wf_sales_script",     label: "Sales-Script",           label_en: "Sales Script",           emoji: "📞", type: "llm", desc: "Zielgruppe → Telefonleitfaden, WhatsApp-Text, E-Mail, Einwandbehandlung." },
  { id: "wf_landing_audit",    label: "Landingpage-Audit",      label_en: "Landing Page Audit",     emoji: "🔍", type: "llm", desc: "URL/Text eingeben → Prüft Hero, CTA, Vertrauen, Nutzen, FAQ, Conversion." },
  { id: "wf_campaign_builder", label: "Kampagnen-Builder",      label_en: "Campaign Builder",       emoji: "📣", type: "llm", desc: "Ziel wählen → komplette Kampagne mit Ads, Mails, Posts, Funneltexten." },
  { id: "wf_whatsapp_followup",label: "WhatsApp Follow-up",     label_en: "WhatsApp Follow-up",     emoji: "💬", type: "llm", desc: "Lead-Status → Nachricht: Erstkontakt, Erinnerung, Einwand, Abschluss." },
  { id: "wf_compliance",       label: "Compliance-Check",       label_en: "Compliance Check",       emoji: "✅", type: "llm", desc: "Prüft Werbetexte auf riskante Aussagen & schlägt sichere Varianten vor." },
  { id: "wf_seo_machine",      label: "SEO Content Maschine",   label_en: "SEO Content Machine",    emoji: "🔎", type: "llm", desc: "Keyword → Blogartikel, Meta Title/Description, FAQ-Schema, Linkideen." },
  { id: "wf_partner_onboard",  label: "Partner-Onboarding",     label_en: "Partner Onboarding",     emoji: "🤝", type: "llm", desc: "Plan, Willkommensmail, erste Posts, Verkaufsargumente, Tagesaufgaben." },
  { id: "wf_ticket_solve",     label: "Ticket → Lösung",        label_en: "Ticket to Solution",     emoji: "🎫", type: "llm", desc: "Support-Anfrage → kategorisiert, priorisiert, Antwortvorschlag erstellt." },
  { id: "wf_img_prompt",       label: "Bildprompt Optimierer",  label_en: "Image Prompt Optimizer", emoji: "🖼️", type: "llm", desc: "Rohidee → optimierter Prompt für GPT Image, Leonardo, Flux, Ideogram." },
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
          <StudioContextArea color={COLOR} context={context} setContext={setContext}
            label="Prozess / Problem / Ziel" labelEN="Process / Problem / Goal" title="Workflow Studio"
            placeholder="Prozess / Problem / Ziel"
            placeholderEN="Process / Problem / Goal" />
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

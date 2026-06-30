import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { AgentChatPanel, ToolCard, StudioContextArea } from "@/components/StudioLayout";
import { PageHeader } from "@/components/PageHeader";

const COLOR = "#34D399";

const TOOLS = [
  { id: "seo_keywords", label: "Keyword-Recherche", label_en: "Keyword Research", emoji: "🔑", type: "llm",
    desc: "Tiefe Keyword-Analyse mit Suchvolumen, KD & Intent." },
  { id: "seo_onpage", label: "On-Page-Audit", label_en: "On-Page Audit", emoji: "🔍", type: "llm",
    desc: "Title, Meta, H1-H6, Alt-Tags & interne Verlinkung prüfen." },
  { id: "seo_technical", label: "Technisches SEO", label_en: "Technical SEO", emoji: "⚙️", type: "llm",
    desc: "Core Web Vitals, Crawlability, Schema Markup & Indexierung." },
  { id: "seo_content", label: "Content-Strategie", label_en: "Content Strategy", emoji: "📄", type: "llm",
    desc: "Pillar Pages, Topic Cluster & Content-Kalender für Rankings." },
  { id: "seo_geo", label: "GEO-Optimierung", label_en: "GEO Optimization", emoji: "🤖", type: "llm",
    desc: "Generative Engine Optimization für ChatGPT, Claude & Gemini." },
  { id: "seo_links", label: "Linkbuilding", label_en: "Link Building", emoji: "🔗", type: "llm",
    desc: "Strategien für hochwertige Backlinks & Gastbeiträge." },
];

export default function SeoSpecialistStudio() {
  const { lang } = useApp();
  const [toolLoading, setToolLoading] = useState(null);
  const [context, setContext] = useState("");

  const runTool = async (tool) => {
    setToolLoading(tool.id);
    try {
      const res = await axios.post(`${API}/agents/tools/run`, {
        agent_id: "seo", tool_id: tool.id, context, model: "gpt", language: lang,
      });
      if (res.data.reply) {
        setContext((p) => p + (p ? "\n\n---\n\n" : "") + `[${lang === "DE" ? tool.label : tool.label_en}]\n${res.data.reply}`);
      }
    } catch { toast.error("Fehler"); }
    finally { setToolLoading(null); }
  };

  return (
    <div className="space-y-8">
      <PageHeader icon={Search} color={COLOR} title="SEO Specialist" badge="SEO"
        subtitle={lang === "DE" ? "Sofia – SEO-Direktorin · Keywords · GEO · Technisches SEO · Linkbuilding" : "Sofia – SEO Director · Keywords · GEO · Technical SEO · Link Building"} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <StudioContextArea color={COLOR} context={context} setContext={setContext}
            label="Website / Thema / Keyword" labelEN="Website / Topic / Keyword" title="Seo Specialist Studio"
            placeholder="Website / Thema / Keyword"
            placeholderEN="Website / Topic / Keyword" />
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
          <AgentChatPanel agentId="seo" agentName="Sofia – SEO Director" agentEmoji="🔍" color={COLOR}
            placeholder={lang === "DE" ? "SEO-Frage stellen…" : "Ask about SEO…"} />
        </div>
      </div>
    </div>
  );
}

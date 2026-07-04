import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { Linkedin } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { AgentChatPanel, ToolCard, StudioContextArea } from "@/components/StudioLayout";
import { PageHeader } from "@/components/PageHeader";

const COLOR = "#0A66C2";

const TOOLS = [
  { id: "linkedin_post", label: "LinkedIn-Post", label_en: "LinkedIn Post", emoji: "✍️", type: "llm",
    desc: "Viraler Post mit Hook, Story & CTA für maximale Reichweite." },
  { id: "linkedin_carousel", label: "Karussell", label_en: "Carousel", emoji: "🎠", type: "llm",
    desc: "10-Slide-Karussell-PDF-Konzept für höchste Reichweite." },
  { id: "linkedin_article", label: "Artikel", label_en: "Article", emoji: "📰", type: "llm",
    desc: "Thought-Leadership-Artikel für Authority-Aufbau." },
  { id: "linkedin_profile", label: "Profil-Optimierung", label_en: "Profile Optimization", emoji: "👤", type: "llm",
    desc: "Headline, About, Experience & Keywords optimieren." },
  { id: "linkedin_strategy", label: "Content-Strategie", label_en: "Content Strategy", emoji: "📅", type: "llm",
    desc: "30-Tage-Content-Plan mit Themen & Posting-Zeitplan." },
  { id: "linkedin_hashtags", label: "Hashtag-Set", label_en: "Hashtag Set", emoji: "#️⃣", type: "llm",
    desc: "Optimiertes Hashtag-Set: Nische + Masse + Branded." },
];

export default function LinkedInStudio() {
  const { lang, activeBrandId } = useApp();
  const [toolLoading, setToolLoading] = useState(null);
  const [context, setContext] = useState("");

  const runTool = async (tool) => {
    setToolLoading(tool.id);
    try {
      const res = await axios.post(`${API}/agents/tools/run`, {
        agent_id: "linkedin", tool_id: tool.id, context, model: "gpt", language: lang, brand_id: activeBrandId,
      });
      if (res.data.reply) {
        setContext((p) => p + (p ? "\n\n---\n\n" : "") + `[${lang === "DE" ? tool.label : tool.label_en}]\n${res.data.reply}`);
      }
    } catch { toast.error("Fehler"); }
    finally { setToolLoading(null); }
  };

  return (
    <div className="space-y-8">
      <PageHeader icon={Linkedin} color={COLOR} title="LinkedIn Studio" badge="LinkedIn"
        subtitle={lang === "DE" ? "Leon – LinkedIn-Stratege · Posts · Karussell · Personal Branding · Lead-Gen" : "Leon – LinkedIn Strategist · Posts · Carousels · Personal Branding · Lead Gen"} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <StudioContextArea color={COLOR} context={context} setContext={setContext}
            label="Thema / Idee / Ziel" labelEN="Topic / Idea / Goal" title="LinkedIn Studio"
            placeholder="Thema / Idee / Ziel"
            placeholderEN="Topic / Idea / Goal" />
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
          <AgentChatPanel agentId="linkedin" agentName="Leon – LinkedIn Strategist" agentEmoji="💼" color={COLOR}
            placeholder={lang === "DE" ? "LinkedIn-Frage stellen…" : "Ask about LinkedIn…"} />
        </div>
      </div>
    </div>
  );
}

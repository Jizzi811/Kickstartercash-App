import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { Music } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { AgentChatPanel, ToolCard, StudioContextArea } from "@/components/StudioLayout";
import { PageHeader } from "@/components/PageHeader";

const COLOR = "#FF2D55";

const TOOLS = [
  { id: "tiktok_hook", label: "Hook Generator", label_en: "Hook Generator", emoji: "🎣", type: "llm",
    desc: "Entwickelt 5 unwiderstehliche Hooks für die ersten 3 Sekunden." },
  { id: "tiktok_script", label: "Video-Skript", label_en: "Video Script", emoji: "📝", type: "llm",
    desc: "Vollständiges TikTok-Skript mit Szenenanweisungen." },
  { id: "tiktok_hashtags", label: "Hashtag-Strategie", label_en: "Hashtag Strategy", emoji: "#️⃣", type: "llm",
    desc: "30 optimierte Hashtags: Nischen + Massen + Branded." },
  { id: "tiktok_series", label: "Content-Serie", label_en: "Content Series", emoji: "📅", type: "llm",
    desc: "30-Tage-Content-Plan mit Themen, Formaten & Posting-Zeiten." },
  { id: "tiktok_trend", label: "Trend-Analyse", label_en: "Trend Analysis", emoji: "📈", type: "llm",
    desc: "Aktuelle TikTok-Trends analysieren und adaptieren." },
  { id: "tiktok_cta", label: "CTA-Optimierung", label_en: "CTA Optimization", emoji: "🎯", type: "llm",
    desc: "Call-to-Action für maximale Kommentare & Follows." },
];

export default function TikTokStudio() {
  const { lang } = useApp();
  const [toolLoading, setToolLoading] = useState(null);
  const [context, setContext] = useState("");

  const runTool = async (tool) => {
    setToolLoading(tool.id);
    try {
      const res = await axios.post(`${API}/agents/tools/run`, {
        agent_id: "tiktok", tool_id: tool.id, context, model: "gpt", language: lang,
      });
      if (res.data.reply) {
        setContext((p) => p + (p ? "\n\n---\n\n" : "") + `[${lang === "DE" ? tool.label : tool.label_en}]\n${res.data.reply}`);
      }
    } catch { toast.error("Fehler"); }
    finally { setToolLoading(null); }
  };

  return (
    <div className="space-y-8">
      <PageHeader icon={Music} color={COLOR} title="TikTok Studio" badge="TikTok"
        subtitle={lang === "DE" ? "Tia – TikTok-Strategin · Hooks · Skripte · Hashtags · Viral-Content" : "Tia – TikTok Strategist · Hooks · Scripts · Hashtags · Viral Content"} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <StudioContextArea color={COLOR} context={context} setContext={setContext}
            label="Thema / Kontext" labelEN="Topic / Context" title="TikTok Studio"
            placeholder="z.B. Kickstarcash.Club Cashback-Karte – finanzielle Freiheit für Unternehmer…"
            placeholderEN="e.g. Kickstarcash.Club cashback card – financial freedom for entrepreneurs…" />
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
          <AgentChatPanel agentId="tiktok" agentName="Tia – TikTok Strategist" agentEmoji="🎵" color={COLOR}
            placeholder={lang === "DE" ? "TikTok-Strategie fragen…" : "Ask about TikTok strategy…"} />
        </div>
      </div>
    </div>
  );
}

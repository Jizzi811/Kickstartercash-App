import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { Palette, Download, Loader2, ExternalLink } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { ToolCard, AgentChatPanel } from "@/components/StudioLayout";
import { PageHeader } from "@/components/PageHeader";
import { IMAGE_STYLES } from "@/i18n";

const COLOR = "#C084FC";

const TOOLS = [
  {
    id: "gpt_image", label: "GPT Image", label_en: "GPT Image",
    emoji: "🤖", type: "image", builtIn: true,
    desc: "Generiert sofort ein Werbebild via KI (Gemini Flash Image).",
  },
  {
    id: "canva", label: "Canva Guide", label_en: "Canva Guide",
    emoji: "🎨", type: "llm",
    desc: "Detaillierte Canva-Anleitung mit Farben, Fonts, Layout.",
  },
  {
    id: "leonardo", label: "Leonardo Prompt", label_en: "Leonardo Prompt",
    emoji: "🖼️", type: "llm",
    desc: "Optimierter Prompt für Leonardo.ai (photorealistisch, kommerziell).",
  },
  {
    id: "flux", label: "Flux Prompt", label_en: "Flux Prompt",
    emoji: "⚡", type: "llm",
    desc: "Präziser Flux-Bildgenerierungs-Prompt für Werbebilder.",
  },
  {
    id: "ideogram", label: "Ideogram Prompt", label_en: "Ideogram Prompt",
    emoji: "✏️", type: "llm",
    desc: "Ideogram-Prompt mit Textelementen & Logo-Integration.",
  },
  {
    id: "brand", label: "Brand Guide", label_en: "Brand Guide",
    emoji: "📐", type: "llm",
    desc: "Vollständiger Brand-Guide: Farben, Schriften, Do's & Don'ts.",
  },
];

export default function DesignStudio() {
  const { lang, activeBrandId } = useApp();
  const [toolLoading, setToolLoading] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Luxuriös");
  const [generatedImage, setGeneratedImage] = useState(null);

  const runTool = async (tool) => {
    if (tool.id === "gpt_image") {
      if (!prompt.trim()) { toast.error(lang === "DE" ? "Bitte Prompt eingeben" : "Please enter a prompt"); return; }
      setToolLoading(tool.id);
      setGeneratedImage(null);
      try {
        const res = await axios.post(`${API}/generate/image`, {
          prompt, style, brand_id: activeBrandId, language: lang, apply_logo: false, size: "16:9",
        });
        setGeneratedImage(res.data.image);
      } catch (e) {
        toast.error(e?.response?.data?.detail || "Fehler bei der Bildgenerierung");
      } finally { setToolLoading(null); }
    } else {
      // Delegate to agent tool runner via chat context
      setToolLoading(tool.id);
      try {
        const res = await axios.post(`${API}/agents/tools/run`, {
          agent_id: "designer", tool_id: tool.id, context: prompt, model: "gpt", language: lang,
        });
        if (res.data.reply) {
          setPrompt((p) => p + (p ? "\n\n---\n\n" : "") + `[${lang === "DE" ? tool.label : tool.label_en}]\n${res.data.reply}`);
        }
      } catch { toast.error("Fehler"); }
      finally { setToolLoading(null); }
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Palette}
        color="#C084FC"
        title="Design Studio"
        subtitle={lang === "DE" ? "GPT Image · Canva · Leonardo · Flux · Ideogram" : "GPT Image · Canva · Leonardo · Flux · Ideogram"}
        badge="Design"
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Tools + Generator */}
        <div className="lg:col-span-3 space-y-5">
          {/* Prompt input */}
          <div className="bg-[#0A0A0A] border border-white/8 rounded-sm p-5 space-y-4">
            <label className="block text-xs text-zinc-500 uppercase tracking-widest">
              {lang === "DE" ? "Prompt / Beschreibung" : "Prompt / Description"}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder={lang === "DE"
                ? "z.B. Luxuriöses KickstarterCash Werbebanner, Gold & Schwarz, moderner Business-Stil…"
                : "e.g. Luxurious KickstarterCash advertising banner, gold & black, modern business style…"}
              className="w-full bg-black border border-white/8 rounded-sm px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none focus:border-[#C084FC]/40"
            />
            <div className="flex items-center gap-3">
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="bg-black border border-white/8 rounded-sm px-3 py-2 text-sm text-white focus:outline-none"
              >
                {IMAGE_STYLES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <span className="text-xs text-zinc-600">
                {lang === "DE" ? "Stil für GPT Image" : "Style for GPT Image"}
              </span>
            </div>
          </div>

          {/* Tool Cards */}
          <div>
            <p className="text-[10px] text-zinc-700 uppercase tracking-widest mb-3">
              {lang === "DE" ? "Tools — Prompt oben eingeben, dann klicken" : "Tools — enter prompt above, then click"}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TOOLS.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  color={COLOR}
                  onRun={runTool}
                  isRunning={toolLoading === tool.id}
                  disabled={!!toolLoading}
                />
              ))}
            </div>
          </div>

          {/* Generated Image */}
          {(toolLoading === "gpt_image" || generatedImage) && (
            <div className="bg-[#0A0A0A] border border-white/8 rounded-sm overflow-hidden">
              {toolLoading === "gpt_image" ? (
                <div className="flex items-center justify-center py-16 gap-3 text-zinc-500">
                  <Loader2 size={18} className="animate-spin text-[#C084FC]" />
                  <span className="text-sm">{lang === "DE" ? "Bild wird generiert…" : "Generating image…"}</span>
                </div>
              ) : generatedImage && (
                <>
                  <img src={generatedImage} alt="Generated" className="w-full" />
                  <div className="flex justify-end p-3">
                    <a href={generatedImage} download="design.png"
                      className="flex items-center gap-2 text-xs px-3 py-1.5 border border-white/10 rounded-sm text-zinc-400 hover:text-white transition-colors">
                      <Download size={12} /> Download
                    </a>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: Agent Chat */}
        <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/8 rounded-sm flex flex-col" style={{ minHeight: "520px" }}>
          <AgentChatPanel
            agentId="designer"
            agentName="Designer Agent"
            agentEmoji="🎨"
            color={COLOR}
            placeholder={lang === "DE" ? "Designer fragen…" : "Ask the designer…"}
          />
        </div>
      </div>
    </div>
  );
}

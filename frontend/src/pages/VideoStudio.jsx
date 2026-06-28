import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Film, Copy, Check, Loader2 } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { ToolCard, AgentChatPanel } from "@/components/StudioLayout";

const COLOR = "#F472B6";

const TOOLS = [
  {
    id: "veo",       label: "Veo 3 Prompt",   label_en: "Veo 3 Prompt",
    emoji: "🎥", type: "llm",
    desc: "Google Veo 3 Video-Prompt mit Kamera-Bewegung, Stil & Atmosphäre.",
  },
  {
    id: "kling",     label: "Kling Prompt",    label_en: "Kling Prompt",
    emoji: "🎬", type: "llm",
    desc: "Kling AI Video-Prompt mit Motion-Beschreibung & Szenenaufbau.",
  },
  {
    id: "runway",    label: "Runway ML",       label_en: "Runway ML",
    emoji: "✈️", type: "llm",
    desc: "Runway Gen-3/4 Prompt mit Camera-Moves, Lighting & Motion-Brush.",
  },
  {
    id: "capcut",    label: "CapCut Script",   label_en: "CapCut Script",
    emoji: "✂️", type: "llm",
    desc: "CapCut-optimiertes Script mit Text-Overlays, Cuts & Effekten.",
  },
  {
    id: "script",    label: "Video-Script",    label_en: "Video Script",
    emoji: "📝", type: "llm",
    desc: "Vollständiges Script mit Hook, Story, CTA und Shot-Liste.",
  },
  {
    id: "storyboard",label: "Storyboard",      label_en: "Storyboard",
    emoji: "🎞️", type: "llm",
    desc: "Shot-by-Shot Storyboard mit Kamerawinkel und Bildschirmtext.",
  },
  {
    id: "reels",     label: "Reels-Konzept",   label_en: "Reels Concept",
    emoji: "📱", type: "llm",
    desc: "3 virale Reels-Konzepte für Instagram & TikTok.",
  },
];

function ResultCard({ result, color }) {
  const [copied, setCopied] = useState(false);
  if (!result) return null;
  return (
    <div className="bg-[#0A0A0A] border border-white/8 rounded-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8">
        <span className="text-xs font-medium" style={{ color }}>{result.label}</span>
        <button onClick={() => { navigator.clipboard.writeText(result.text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors">
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied ? "Kopiert!" : "Kopieren"}
        </button>
      </div>
      <pre className="px-4 py-4 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed overflow-auto max-h-96">{result.text}</pre>
    </div>
  );
}

export default function VideoStudio() {
  const { lang, model } = useApp();
  const [toolLoading, setToolLoading] = useState(null);
  const [context, setContext] = useState("");
  const [result, setResult] = useState(null);

  const runTool = async (tool) => {
    if (!context.trim()) { toast.error(lang === "DE" ? "Bitte Kontext/Thema eingeben" : "Please enter context/topic"); return; }
    setToolLoading(tool.id);
    setResult(null);
    try {
      const res = await axios.post(`${API}/agents/tools/run`, {
        agent_id: "video", tool_id: tool.id, context, model, language: lang,
      });
      setResult({ label: lang === "DE" ? tool.label : tool.label_en, text: res.data.reply });
    } catch { toast.error("Fehler"); }
    finally { setToolLoading(null); }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-sm flex items-center justify-center" style={{ backgroundColor: `${COLOR}18` }}>
          <Film size={20} style={{ color: COLOR }} />
        </div>
        <div>
          <h1 className="font-display text-2xl text-white">Video Studio</h1>
          <p className="text-xs text-zinc-500">Veo 3 · Kling · Runway ML · CapCut · Scripts & Storyboards</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left */}
        <div className="lg:col-span-3 space-y-5">
          {/* Context Input */}
          <div className="bg-[#0A0A0A] border border-white/8 rounded-sm p-5 space-y-3">
            <label className="block text-xs text-zinc-500 uppercase tracking-widest">
              {lang === "DE" ? "Video-Thema / Kontext" : "Video Topic / Context"}
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={4}
              placeholder={lang === "DE"
                ? "z.B. KickstarterCash Produkt-Vorstellung, 30 Sekunden, energetisch, Zielgruppe Unternehmer 30-50…"
                : "e.g. KickstarterCash product intro, 30 seconds, energetic, target audience entrepreneurs 30-50…"}
              className="w-full bg-black border border-white/8 rounded-sm px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none focus:border-[#F472B6]/40"
            />
          </div>

          {/* Tools */}
          <div>
            <p className="text-[10px] text-zinc-700 uppercase tracking-widest mb-3">
              {lang === "DE" ? "Video-Tools" : "Video Tools"}
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

          {/* Loading */}
          {toolLoading && !result && (
            <div className="flex items-center gap-3 px-4 py-4 bg-[#0A0A0A] border border-white/8 rounded-sm text-zinc-500 text-sm">
              <Loader2 size={16} className="animate-spin" style={{ color: COLOR }} />
              {lang === "DE" ? "Wird generiert…" : "Generating…"}
            </div>
          )}

          {/* Result */}
          <ResultCard result={result} color={COLOR} />
        </div>

        {/* Right: Agent Chat */}
        <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/8 rounded-sm flex flex-col" style={{ minHeight: "520px" }}>
          <AgentChatPanel
            agentId="video"
            agentName="Video Agent"
            agentEmoji="🎬"
            color={COLOR}
            placeholder={lang === "DE" ? "Video Agent fragen…" : "Ask the video agent…"}
          />
        </div>
      </div>
    </div>
  );
}

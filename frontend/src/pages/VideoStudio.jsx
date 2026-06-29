import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Film, Copy, Check, Loader2, Sparkles, Play, Download, GalleryHorizontal } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { AgentChatPanel } from "@/components/StudioLayout";

const COLOR = "#F472B6";
const BACKEND = process.env.REACT_APP_BACKEND_URL || "";

// ── Remotion Templates ──────────────────────────────────────────────────────
const REMOTION_TEMPLATES = [
  { id: "product_showcase", emoji: "🏆", labelDE: "Produkt-Showcase", labelEN: "Product Showcase",
    descDE: "30s Video mit Produkt-Highlights & CTA", descEN: "30s video with product highlights & CTA" },
  { id: "countdown", emoji: "⏳", labelDE: "Countdown Timer", labelEN: "Countdown Timer",
    descDE: "Urgency-Video mit Countdown & Angebot", descEN: "Urgency video with countdown & offer" },
  { id: "testimonial", emoji: "⭐", labelDE: "Testimonial Slide", labelEN: "Testimonial Slide",
    descDE: "Kundenzitat mit animiertem Branding", descEN: "Customer quote with animated branding" },
  { id: "intro", emoji: "✨", labelDE: "Brand Intro", labelEN: "Brand Intro",
    descDE: "Markantes KickstarterCash Intro (5s)", descEN: "Striking KickstarterCash intro (5s)" },
];

// ── LLM Prompt Tools ────────────────────────────────────────────────────────
const PROMPT_TOOLS = [
  { id: "veo_prompt", emoji: "🎥", labelDE: "Veo 3 Prompt", labelEN: "Veo 3 Prompt",
    descDE: "Optimierter Prompt für Google Veo 3", descEN: "Optimized prompt for Google Veo 3" },
  { id: "script", emoji: "📝", labelDE: "Video-Script", labelEN: "Video Script",
    descDE: "Vollständiges Script mit Hook & CTA", descEN: "Full script with hook & CTA" },
  { id: "storyboard", emoji: "🎞️", labelDE: "Storyboard", labelEN: "Storyboard",
    descDE: "Shot-by-Shot mit Kamerawinkel", descEN: "Shot-by-shot with camera angles" },
  { id: "reels", emoji: "📱", labelDE: "Reels-Konzept", labelEN: "Reels Concept",
    descDE: "3 virale Konzepte für IG & TikTok", descEN: "3 viral concepts for IG & TikTok" },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors">
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      {copied ? "Kopiert!" : "Kopieren"}
    </button>
  );
}

function ResultCard({ result, color }) {
  if (!result) return null;
  return (
    <div className="bg-[#0A0A0A] border border-white/8 rounded-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8">
        <span className="text-xs font-medium" style={{ color }}>{result.label}</span>
        <CopyButton text={result.text} />
      </div>
      <pre className="px-4 py-4 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed overflow-auto max-h-96">{result.text}</pre>
    </div>
  );
}

// ── Veo Video Generation Panel ───────────────────────────────────────────────
function VeoPanel({ lang }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [status, setStatus] = useState("");

  const generate = async () => {
    if (!prompt.trim()) { toast.error(lang === "DE" ? "Bitte Prompt eingeben" : "Please enter a prompt"); return; }
    setLoading(true);
    setVideoUrl(null);
    setStatus(lang === "DE" ? "Veo generiert dein Video… (ca. 2-3 Min)" : "Veo is generating your video… (~2-3 min)");
    try {
      const res = await axios.post(`${BACKEND}/api/video/veo`, { prompt, aspect_ratio: "16:9" });
      if (res.data.video_url) {
        setVideoUrl(res.data.video_url);
        setStatus("");
        toast.success(lang === "DE" ? "Video fertig!" : "Video ready!");
      } else if (res.data.operation_name) {
        // Poll for completion
        setStatus(lang === "DE" ? "Video wird gerendert… bitte warten" : "Rendering video… please wait");
        pollVideo(res.data.operation_name);
      }
    } catch (e) {
      const msg = e.response?.data?.detail || "Fehler";
      toast.error(msg);
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  const pollVideo = async (opName) => {
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 6000));
      try {
        const res = await axios.get(`${BACKEND}/api/video/veo/status?operation=${encodeURIComponent(opName)}&prompt=${encodeURIComponent(prompt)}`);
        if (res.data.video_url) {
          setVideoUrl(res.data.video_url);
          setStatus("");
          toast.success(lang === "DE" ? "Video fertig!" : "Video ready!");
          return;
        }
        setStatus(`${lang === "DE" ? "Noch am Rendern" : "Still rendering"}… (${(i + 1) * 6}s)`);
      } catch { break; }
    }
    setStatus(lang === "DE" ? "Timeout – bitte erneut versuchen" : "Timeout – please try again");
  };

  return (
    <div className="bg-[#0A0A0A] border border-white/8 rounded-sm p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={16} style={{ color: COLOR }} />
        <span className="text-sm font-medium text-white">Veo 2 – KI Video generieren</span>
        <span className="text-[10px] bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full">LIVE</span>
      </div>
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        rows={3}
        placeholder={lang === "DE"
          ? "z.B. Ein elegantes KickstarterCash Produkt-Video, goldene Partikel, Dubai Skyline im Hintergrund, cinematic…"
          : "e.g. An elegant KickstarterCash product video, golden particles, Dubai skyline, cinematic…"}
        className="w-full bg-black border border-white/8 rounded-sm px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none focus:border-pink-500/40"
      />
      <button
        onClick={generate}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-all disabled:opacity-50"
        style={{ background: `${COLOR}20`, color: COLOR, border: `1px solid ${COLOR}40` }}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {loading ? (lang === "DE" ? "Generiert…" : "Generating…") : (lang === "DE" ? "Video generieren" : "Generate Video")}
      </button>
      {status && <p className="text-xs text-zinc-500 animate-pulse">{status}</p>}
      {videoUrl && (
        <div className="space-y-2">
          <video src={videoUrl} controls className="w-full rounded-sm border border-white/8" />
          <a href={`${BACKEND}/api/video/download?url=${encodeURIComponent(videoUrl)}`} download="kashbot-video.mp4" className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white">
            <Download size={12} /> Video herunterladen
          </a>
        </div>
      )}
    </div>
  );
}

// ── Remotion Templates Panel ─────────────────────────────────────────────────
function RemotionPanel({ lang }) {
  const [selected, setSelected] = useState(null);
  const [customText, setCustomText] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);

  const render = async (tpl) => {
    setSelected(tpl.id);
    setLoading(true);
    setVideoUrl(null);
    try {
      const res = await axios.post(`${BACKEND}/api/video/remotion`, {
        template: tpl.id,
        text: customText || (lang === "DE" ? "KickstarterCash – Dein Weg zur finanziellen Freiheit" : "KickstarterCash – Your Path to Financial Freedom"),
        lang,
      });
      if (res.data.video_url) {
        setVideoUrl(res.data.video_url);
        toast.success(lang === "DE" ? "Video fertig!" : "Video ready!");
      } else {
        toast.info(lang === "DE" ? "Rendering gestartet – kommt gleich" : "Rendering started – coming soon");
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || "Fehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0A0A0A] border border-white/8 rounded-sm p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Play size={16} style={{ color: COLOR }} />
        <span className="text-sm font-medium text-white">Remotion – Branded Templates</span>
        <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">BETA</span>
      </div>
      <input
        value={customText}
        onChange={e => setCustomText(e.target.value)}
        placeholder={lang === "DE" ? "Eigener Text (optional)…" : "Custom text (optional)…"}
        className="w-full bg-black border border-white/8 rounded-sm px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500/40"
      />
      <div className="grid grid-cols-2 gap-3">
        {REMOTION_TEMPLATES.map(tpl => (
          <button
            key={tpl.id}
            onClick={() => render(tpl)}
            disabled={loading}
            className="text-left p-3 rounded-sm border transition-all disabled:opacity-50 hover:border-pink-500/40"
            style={{ background: selected === tpl.id ? `${COLOR}10` : "#050505", borderColor: selected === tpl.id ? `${COLOR}40` : "rgba(255,255,255,0.08)" }}
          >
            <div className="text-lg mb-1">{tpl.emoji}</div>
            <div className="text-xs font-medium text-white">{lang === "DE" ? tpl.labelDE : tpl.labelEN}</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">{lang === "DE" ? tpl.descDE : tpl.descEN}</div>
            {loading && selected === tpl.id && <Loader2 size={12} className="animate-spin mt-1" style={{ color: COLOR }} />}
          </button>
        ))}
      </div>
      {videoUrl && (
        <div className="space-y-2">
          <video src={videoUrl} controls className="w-full rounded-sm border border-white/8" />
          <a href={`${BACKEND}/api/video/download?url=${encodeURIComponent(videoUrl)}`} download="kashbot-video.mp4" className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white">
            <Download size={12} /> Video herunterladen
          </a>
        </div>
      )}
    </div>
  );
}

// ── Video Gallery Panel ──────────────────────────────────────────────────────
function GalleryPanel({ lang }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${BACKEND}/api/video/gallery`)
      .then(r => setVideos(r.data.videos || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-zinc-500" /></div>;
  if (!videos.length) return (
    <div className="bg-[#0A0A0A] border border-white/8 rounded-sm p-8 text-center">
      <GalleryHorizontal size={32} className="mx-auto mb-3 text-zinc-600" />
      <p className="text-sm text-zinc-500">{lang === "DE" ? "Noch keine Videos generiert" : "No videos generated yet"}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500">{videos.length} {lang === "DE" ? "Videos gespeichert" : "videos saved"}</p>
      <div className="grid grid-cols-1 gap-4">
        {videos.map((v, i) => (
          <div key={i} className="bg-[#0A0A0A] border border-white/8 rounded-sm overflow-hidden">
            <video src={v.video_url} controls className="w-full" />
            <div className="px-4 py-3 space-y-1">
              {v.prompt && <p className="text-xs text-zinc-400 line-clamp-2">{v.prompt}</p>}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-600">{v.type?.toUpperCase()} · {v.created_at?.slice(0, 10)}</span>
                <a href={`${BACKEND}/api/video/download?url=${encodeURIComponent(v.video_url)}`} download="kashbot-video.mp4" className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white">
                  <Download size={12} /> Download
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Export ──────────────────────────────────────────────────────────────
export default function VideoStudio() {
  const { lang, model } = useApp();
  const [toolLoading, setToolLoading] = useState(null);
  const [context, setContext] = useState("");
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState("ai"); // "ai" | "remotion" | "prompts"

  const runPromptTool = async (tool) => {
    if (!context.trim()) { toast.error(lang === "DE" ? "Bitte Thema eingeben" : "Please enter a topic"); return; }
    setToolLoading(tool.id);
    setResult(null);
    try {
      const res = await axios.post(`${API}/agents/tools/run`, {
        agent_id: "video", tool_id: tool.id, context, model, language: lang,
      });
      setResult({ label: lang === "DE" ? tool.labelDE : tool.labelEN, text: res.data.reply });
    } catch { toast.error("Fehler"); }
    finally { setToolLoading(null); }
  };

  const TABS = [
    { id: "ai", label: "🎥 Veo KI-Video" },
    { id: "remotion", label: "✨ Branded Templates" },
    { id: "prompts", label: "📝 Prompts & Scripts" },
    { id: "gallery", label: "🎞️ Galerie" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-sm flex items-center justify-center" style={{ backgroundColor: `${COLOR}18` }}>
          <Film size={20} style={{ color: COLOR }} />
        </div>
        <div>
          <h1 className="font-display text-2xl text-white">Video Studio</h1>
          <p className="text-xs text-zinc-500">Veo 2 KI-Videos · Remotion Templates · Scripts & Storyboards</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/8 pb-0">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 text-sm transition-all border-b-2 -mb-px"
            style={{ color: tab === t.id ? COLOR : "#71717a", borderColor: tab === t.id ? COLOR : "transparent" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          {tab === "ai" && <VeoPanel lang={lang} />}
          {tab === "remotion" && <RemotionPanel lang={lang} />}
          {tab === "gallery" && <GalleryPanel lang={lang} />}
          {tab === "prompts" && (
            <div className="space-y-4">
              <div className="bg-[#0A0A0A] border border-white/8 rounded-sm p-5 space-y-3">
                <label className="block text-xs text-zinc-500 uppercase tracking-widest">
                  {lang === "DE" ? "Video-Thema / Kontext" : "Video Topic / Context"}
                </label>
                <textarea
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  rows={4}
                  placeholder={lang === "DE"
                    ? "z.B. KickstarterCash Produkt-Vorstellung, 30 Sek, energetisch…"
                    : "e.g. KickstarterCash product intro, 30 sec, energetic…"}
                  className="w-full bg-black border border-white/8 rounded-sm px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none focus:border-pink-500/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {PROMPT_TOOLS.map(tool => (
                  <button key={tool.id} onClick={() => runPromptTool(tool)} disabled={!!toolLoading}
                    className="text-left p-3 rounded-sm border border-white/8 hover:border-pink-500/40 transition-all disabled:opacity-50 bg-[#050505]">
                    <div className="text-lg mb-1">{tool.emoji}</div>
                    <div className="text-xs font-medium text-white">{lang === "DE" ? tool.labelDE : tool.labelEN}</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">{lang === "DE" ? tool.descDE : tool.descEN}</div>
                    {toolLoading === tool.id && <Loader2 size={12} className="animate-spin mt-1" style={{ color: COLOR }} />}
                  </button>
                ))}
              </div>
              <ResultCard result={result} color={COLOR} />
            </div>
          )}
        </div>

        {/* Agent Chat */}
        <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/8 rounded-sm flex flex-col" style={{ minHeight: "520px" }}>
          <AgentChatPanel
            agentId="video"
            agentName="Viktor – Video Director"
            agentEmoji="🎬"
            color={COLOR}
            placeholder={lang === "DE" ? "Viktor fragen…" : "Ask Viktor…"}
          />
        </div>
      </div>
    </div>
  );
}

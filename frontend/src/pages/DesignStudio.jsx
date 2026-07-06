import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { Palette, Download, Loader2, ExternalLink, Copy } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { ToolCard, AgentChatPanel, StudioContextArea, StudioFlowRail } from "@/components/StudioLayout";
import { PageHeader } from "@/components/PageHeader";
import { IMAGE_STYLES } from "@/i18n";

const COLOR = "#C084FC";

// Image models offered by the live generator (maps to backend ImageRequest.model).
const IMAGE_MODELS = [
  { id: "gpt", label: "GPT Image" },
  { id: "flux2", label: "Flux 2" },
  { id: "flux-schnell", label: "Flux.1 schnell" },
  { id: "qwen-image", label: "Qwen Image" },
  { id: "sd3", label: "Stable Diffusion 3.5" },
];

// Output formats (aspect ratios) -> backend `size` label.
const IMAGE_FORMATS = [
  { id: "1:1", label: "1:1", de: "Quadrat", en: "Square" },
  { id: "16:9", label: "16:9", de: "Querformat", en: "Landscape" },
  { id: "9:16", label: "9:16", de: "Hochformat", en: "Portrait" },
  { id: "4:3", label: "4:3", de: "Klassisch", en: "Classic" },
  { id: "3:4", label: "3:4", de: "Porträt", en: "Portrait" },
];

const TOOLS = [
  {
    id: "gpt_image", label: "Bild generieren", label_en: "Generate Image",
    emoji: "🤖", type: "image", builtIn: true,
    desc: "Generiert 3 Werbebild-Varianten mit dem gewählten Modell & Format.",
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
  const { lang, activeBrandId, isAuthenticated, activeWorkspaceId } = useApp();
  const [toolLoading, setToolLoading] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Luxuriös");
  const [imageModel, setImageModel] = useState("gpt");
  const [imageFormat, setImageFormat] = useState("16:9");
  const [generatedImages, setGeneratedImages] = useState([]);
  const [canvaGuide, setCanvaGuide] = useState("");
  const [canvaConnected, setCanvaConnected] = useState(false);
  const [canvaStatusLoading, setCanvaStatusLoading] = useState(false);
  const [canvaConnectLoading, setCanvaConnectLoading] = useState(false);
  const [canvaDisconnectLoading, setCanvaDisconnectLoading] = useState(false);

  const loadCanvaStatus = async () => {
    if (!isAuthenticated || !activeWorkspaceId) return;
    setCanvaStatusLoading(true);
    try {
      const res = await axios.get(`${API}/integrations/canva/status`);
      setCanvaConnected(!!res.data?.connected);
    } catch {
      setCanvaConnected(false);
    } finally {
      setCanvaStatusLoading(false);
    }
  };

  useEffect(() => {
    loadCanvaStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeWorkspaceId]);

  const buildCanvaContext = () => {
    const outputRules = [
      lang === "DE" ? "Ausgabe bitte auf Deutsch." : "Output in English.",
      lang === "DE"
        ? "Strukturiere die Antwort exakt in diesen Abschnitten:"
        : "Structure your response exactly with these sections:",
      "1) Design Goal",
      "2) Canva Size + Layout Grid",
      "3) Color Palette (hex codes)",
      "4) Fonts (headline/body + alternatives)",
      "5) Elements (search terms for Canva elements/photos/icons)",
      "6) Text Blocks (ready to paste copy)",
      "7) Build Steps in Canva (step-by-step)",
      "8) Export Settings (format + use-case)",
      lang === "DE"
        ? "Nutze kurze, konkrete Punkte. Keine Einleitung."
        : "Use concise and concrete bullet points. No introduction.",
    ].join("\n");
    return `${prompt.trim()}\n\n${outputRules}`;
  };

  const copyCanvaGuide = async () => {
    if (!canvaGuide) return;
    try {
      await navigator.clipboard.writeText(canvaGuide);
      toast.success(lang === "DE" ? "Canva-Guide kopiert" : "Canva guide copied");
    } catch {
      toast.error(lang === "DE" ? "Kopieren fehlgeschlagen" : "Copy failed");
    }
  };

  const connectCanva = async () => {
    setCanvaConnectLoading(true);
    try {
      const res = await axios.get(`${API}/integrations/canva/connect`);
      const url = res.data?.authorize_url;
      if (!url) throw new Error("missing authorize_url");
      window.location.href = url;
    } catch (e) {
      toast.error(e?.response?.data?.detail || (lang === "DE" ? "Canva-Verbindung fehlgeschlagen" : "Canva connect failed"));
      setCanvaConnectLoading(false);
    }
  };

  const disconnectCanva = async () => {
    setCanvaDisconnectLoading(true);
    try {
      await axios.post(`${API}/integrations/canva/disconnect`);
      setCanvaConnected(false);
      toast.success(lang === "DE" ? "Canva getrennt" : "Canva disconnected");
    } catch (e) {
      toast.error(e?.response?.data?.detail || (lang === "DE" ? "Trennen fehlgeschlagen" : "Disconnect failed"));
    } finally {
      setCanvaDisconnectLoading(false);
    }
  };

  const runTool = async (tool) => {
    if (tool.id === "gpt_image") {
      if (!prompt.trim()) { toast.error(lang === "DE" ? "Bitte Prompt eingeben" : "Please enter a prompt"); return; }
      setToolLoading(tool.id);
      setGeneratedImages([]);
      try {
        const res = await axios.post(`${API}/generate/image`, {
          prompt, style, brand_id: activeBrandId, language: lang, apply_logo: false,
          size: imageFormat, count: 3, model: imageModel,
        });
        setGeneratedImages(res.data.images || (res.data.image ? [res.data.image] : []));
      } catch (e) {
        toast.error(e?.response?.data?.detail || "Fehler bei der Bildgenerierung");
      } finally { setToolLoading(null); }
    } else {
      // Delegate to agent tool runner via chat context
      setToolLoading(tool.id);
      try {
        const context = tool.id === "canva" ? buildCanvaContext() : prompt;
        const res = await axios.post(`${API}/agents/tools/run`, {
          agent_id: "designer", tool_id: tool.id, context, model: "gpt", language: lang,
        });
        if (res.data.reply) {
          if (tool.id === "canva") {
            setCanvaGuide(res.data.reply);
          }
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
        subtitle={lang === "DE" ? "GPT · Flux 2 · Flux schnell · Qwen · SD 3.5 · Canva · Leonardo" : "GPT · Flux 2 · Flux schnell · Qwen · SD 3.5 · Canva · Leonardo"}
        badge="Design"
      />

      <StudioFlowRail color={COLOR} lang={lang} active="Workspace" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Tools + Generator */}
        <div className="lg:col-span-3 space-y-5">
          {/* Prompt input */}
          <div className="border border-white/8 rounded-sm p-5 space-y-4" style={{ background: "rgba(192,132,252,0.03)" }}>
            <StudioContextArea
              color={COLOR}
              context={prompt}
              setContext={setPrompt}
              label="Prompt / Beschreibung"
              labelEN="Prompt / Description"
              placeholder="z.B. Luxuriöses Brandmind Werbebanner, Violett & dunklem Premium-Kontrast, moderner Business-Stil…"
              placeholderEN="e.g. Luxurious Brandmind advertising banner, violet & dark premium contrast, modern business style…"
              title="Design Studio"
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
                {lang === "DE" ? "Bild-Stil" : "Image style"}
              </span>
            </div>

            {/* Image model selector */}
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2">
                {lang === "DE" ? "Modell" : "Model"}
              </p>
              <div className="flex flex-wrap gap-2">
                {IMAGE_MODELS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setImageModel(m.id)}
                    data-testid={`image-model-${m.id}`}
                    className={`px-3 py-1.5 rounded-sm text-xs border transition-colors ${
                      imageModel === m.id
                        ? "border-[#C084FC] text-white bg-[rgba(192,132,252,0.14)]"
                        : "border-white/8 text-zinc-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Output format (aspect ratio) selector */}
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2">
                {lang === "DE" ? "Format" : "Format"}
              </p>
              <div className="flex flex-wrap gap-2">
                {IMAGE_FORMATS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setImageFormat(f.id)}
                    data-testid={`image-format-${f.id}`}
                    title={lang === "DE" ? f.de : f.en}
                    className={`px-3 py-1.5 rounded-sm text-xs border transition-colors ${
                      imageFormat === f.id
                        ? "border-[#C084FC] text-white bg-[rgba(192,132,252,0.14)]"
                        : "border-white/8 text-zinc-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tool Cards */}
          <div>
            <div className="mb-3 border border-white/8 rounded-sm p-3 bg-black/20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
                    {lang === "DE" ? "Canva Connect" : "Canva Connect"}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {canvaStatusLoading
                      ? (lang === "DE" ? "Status wird geladen…" : "Loading status…")
                      : canvaConnected
                        ? (lang === "DE" ? "Verbunden mit Canva API" : "Connected to Canva API")
                        : (lang === "DE" ? "Nicht verbunden (Guide-Modus aktiv)" : "Not connected (guide mode active)")}
                  </p>
                </div>
                {canvaConnected ? (
                  <button
                    type="button"
                    onClick={disconnectCanva}
                    disabled={canvaDisconnectLoading}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-sm border border-white/15 text-zinc-200 hover:text-white disabled:opacity-50"
                  >
                    {canvaDisconnectLoading ? <Loader2 size={11} className="animate-spin" /> : null}
                    {lang === "DE" ? "Canva trennen" : "Disconnect Canva"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={connectCanva}
                    disabled={canvaConnectLoading}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-sm border border-[#C084FC]/40 text-[#E9D5FF] hover:text-white disabled:opacity-50"
                  >
                    {canvaConnectLoading ? <Loader2 size={11} className="animate-spin" /> : <ExternalLink size={11} />}
                    {lang === "DE" ? "Canva verbinden" : "Connect Canva"}
                  </button>
                )}
              </div>
            </div>
            <p className="text-[10px] text-zinc-700 uppercase tracking-widest mb-3">
              {lang === "DE" ? "Tools — Prompt oben eingeben, dann klicken" : "Tools — enter prompt above, then click"}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TOOLS.map((tool) => (
                <motion.div key={tool.id} whileHover={{ y: -2 }} transition={{ duration: 0.18 }}>
                  <ToolCard
                    tool={tool}
                    color={COLOR}
                    onRun={runTool}
                    isRunning={toolLoading === tool.id}
                    disabled={!!toolLoading}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Canva helper output */}
          {(toolLoading === "canva" || canvaGuide) && (
            <div className="bg-[#0A0A0A] border border-white/8 rounded-sm overflow-hidden p-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest px-1">
                  {lang === "DE" ? "Canva Guide — Copy & in Canva umsetzen" : "Canva guide — copy and implement in Canva"}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyCanvaGuide}
                    disabled={!canvaGuide}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-sm border border-white/15 text-zinc-200 hover:text-white disabled:opacity-50"
                  >
                    <Copy size={11} />
                    {lang === "DE" ? "Kopieren" : "Copy"}
                  </button>
                  <a
                    href="https://www.canva.com/design/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-sm border border-white/15 text-zinc-200 hover:text-white"
                  >
                    <ExternalLink size={11} />
                    {lang === "DE" ? "Canva öffnen" : "Open Canva"}
                  </a>
                </div>
              </div>

              {toolLoading === "canva" ? (
                <div className="flex items-center justify-center py-10 gap-3 text-zinc-500">
                  <Loader2 size={18} className="animate-spin text-[#C084FC]" />
                  <span className="text-sm">{lang === "DE" ? "Canva-Guide wird erstellt…" : "Building Canva guide..."}</span>
                </div>
              ) : (
                <pre className="w-full whitespace-pre-wrap text-sm text-zinc-200 bg-black/40 border border-white/8 rounded-sm p-3">
                  {canvaGuide}
                </pre>
              )}
            </div>
          )}

          {/* Generated variants */}
          {(toolLoading === "gpt_image" || generatedImages.length > 0) && (
            <div className="bg-[#0A0A0A] border border-white/8 rounded-sm overflow-hidden p-3">
              {toolLoading === "gpt_image" ? (
                <div className="flex items-center justify-center py-16 gap-3 text-zinc-500">
                  <Loader2 size={18} className="animate-spin text-[#C084FC]" />
                  <span className="text-sm">{lang === "DE" ? "3 Varianten werden generiert…" : "Generating 3 variants…"}</span>
                </div>
              ) : (
                <>
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2 px-1">
                    {lang === "DE" ? "Varianten — bestes auswählen & laden" : "Variants — pick & download the best"}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {generatedImages.map((img, i) => (
                      <div key={i} className="group relative border border-white/8 rounded-sm overflow-hidden">
                        <img src={img} alt={`Variant ${i + 1}`} className="w-full" />
                        <a href={img} download={`brandmind-design-${i + 1}.png`}
                          className="absolute bottom-2 right-2 flex items-center gap-1 text-[11px] px-2 py-1 rounded-sm bg-black/70 border border-white/15 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <Download size={11} /> {lang === "DE" ? "Laden" : "Save"}
                        </a>
                      </div>
                    ))}
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

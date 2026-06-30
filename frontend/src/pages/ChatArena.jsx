import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Loader2, Trash2, Paperclip, X, Bot, Sparkles, Zap, LayoutGrid,
  FileText
} from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { PageTitle } from "@/components/PageTitle";

const MODELS = [
  {
    id: "gpt",
    label: "GPT-5.2",
    provider: "OpenAI",
    icon: Bot,
    accent: "#10A37F",
    vision: true,
    description: "Leistungsstark & vielseitig",
  },
  {
    id: "gemini",
    label: "Gemini 2.5",
    provider: "Google",
    icon: Sparkles,
    accent: "#8AB4F8",
    vision: true,
    description: "Schnell & multimodal",
  },
  {
    id: "claude-sonnet-4-6",
    label: "Claude Sonnet",
    provider: "Anthropic",
    icon: LayoutGrid,
    accent: "#D4AF37",
    vision: true,
    description: "Präzise & kontextreich",
  },
  {
    id: "grok",
    label: "Grok 3",
    provider: "xAI",
    icon: Zap,
    accent: "#FF6B35",
    vision: false,
    description: "Kostenlos & direkt",
  },
];

const ACCEPT = "image/*,application/pdf,.txt,.md,.csv,.json,.docx";

function FilePreview({ file, onRemove }) {
  const isImage = file.mime.startsWith("image/");
  return (
    <div className="relative inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-xs text-zinc-300 max-w-[220px]">
      {isImage ? (
        <img src={`data:${file.mime};base64,${file.data}`} alt="" className="w-8 h-8 object-cover rounded" />
      ) : (
        <FileText size={20} className="text-[#D4AF37] shrink-0" />
      )}
      <span className="truncate">{file.name}</span>
      <button onClick={onRemove} className="ml-1 text-zinc-500 hover:text-red-400 shrink-0">
        <X size={12} />
      </button>
    </div>
  );
}

function MessageBubble({ msg, accent }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-[#D4AF37] text-black font-medium"
            : "bg-white/5 text-zinc-200 border border-white/10"
        }`}
      >
        {msg.file && msg.file.mime.startsWith("image/") && (
          <img
            src={`data:${msg.file.mime};base64,${msg.file.data}`}
            alt="upload"
            className="max-w-[240px] max-h-[180px] object-contain rounded mb-2"
          />
        )}
        {msg.file && !msg.file.mime.startsWith("image/") && (
          <div className="flex items-center gap-1.5 mb-2 text-xs opacity-70">
            <FileText size={13} /> {msg.file.name}
          </div>
        )}
        {msg.content}
      </div>
    </motion.div>
  );
}

export default function ChatArena() {
  const { t, lang } = useApp();
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [grokExtraData, setGrokExtraData] = useState(null);
  const endRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const readFile = (f) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const b64 = e.target.result.split(",")[1];
        resolve({ name: f.name, mime: f.type || "application/octet-stream", data: b64 });
      };
      reader.readAsDataURL(f);
    });

  const handleFileInput = async (f) => {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { toast.error("Datei zu groß (max. 10 MB)"); return; }
    setFile(await readFile(f));
  };

  const onDrop = async (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) await handleFileInput(f);
  };

  const send = async () => {
    const text = input.trim();
    if (!text && !file) return;
    if (loading) return;

    const userMsg = { role: "user", content: text || "(Datei)", file: file || null, id: Date.now() };
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setFile(null);
    setLoading(true);

    try {
      const payload = {
        message: text || "Analysiere diese Datei.",
        model: selectedModel.id,
        language: lang,
        history,
        file_data: userMsg.file?.data || null,
        file_mime: userMsg.file?.mime || null,
        file_name: userMsg.file?.name || null,
      };
      if (selectedModel.id === "grok" && grokExtraData) payload.grok_extra_data = grokExtraData;

      const res = await axios.post(`${API}/arena/chat`, payload);
      if (res.data.grok_extra_data) setGrokExtraData(res.data.grok_extra_data);
      setMessages((p) => [...p, { role: "assistant", content: res.data.reply, id: Date.now() + 1 }]);
    } catch (e) {
      toast.error(t("error_generic"));
      setMessages((p) => [...p, { role: "assistant", content: "⚠️ " + t("error_generic"), id: Date.now() + 1 }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => { setMessages([]); setFile(null); setGrokExtraData(null); };
  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageTitle
          title={t("nav_arena")}
          subtitle={t("arena_sub")}
          icon={LayoutGrid}
        />
        {messages.length > 0 && (
          <button onClick={clearChat}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm border border-white/10 text-zinc-400 hover:text-red-400 hover:border-red-400/50">
            <Trash2 size={13} /> {t("chat_clear")}
          </button>
        )}
      </div>

      {/* Model selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {MODELS.map((m) => {
          const Icon = m.icon;
          const active = selectedModel.id === m.id;
          return (
            <button
              key={m.id}
              onClick={() => { setSelectedModel(m); setGrokExtraData(null); }}
              className={`flex flex-col items-start gap-1.5 p-3 rounded-md border transition-all text-left ${
                active
                  ? "border-[#D4AF37] bg-[#D4AF37]/8"
                  : "border-white/8 hover:border-white/20 bg-white/2"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-sm flex items-center justify-center"
                  style={{ background: `${m.accent}22`, color: m.accent }}>
                  <Icon size={15} />
                </span>
                <span className="text-sm font-semibold text-white">{m.label}</span>
              </div>
              <span className="text-[11px] text-zinc-500">{m.description}</span>
              {!m.vision && (
                <span className="text-[10px] text-zinc-600 italic">Kein Bild-Upload</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Chat window */}
      <div
        className={`bg-[#0A0A0A] border rounded-md flex flex-col h-[calc(100vh-360px)] min-h-[380px] transition-colors ${
          dragging ? "border-[#D4AF37]" : "border-white/10"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {/* Messages */}
        <div className="relative flex-1 overflow-y-auto p-5 space-y-4">
          {/* Ambient orb — color follows selected model */}
          <motion.div
            aria-hidden
            animate={{ backgroundColor: selectedModel.accent }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 320,
              height: 320,
              borderRadius: "50%",
              filter: "blur(80px)",
              opacity: 0.07,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
          {messages.length === 0 && (
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-zinc-600">
              <motion.span
                animate={{ boxShadow: `0 0 40px 12px ${selectedModel.accent}40` }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                style={{ background: `${selectedModel.accent}1a`, color: selectedModel.accent }}>
                {React.createElement(selectedModel.icon, { size: 26 })}
              </motion.span>
              <p className="text-sm max-w-xs">
                {t("chat_empty")}
                {selectedModel.vision && (
                  <span className="block mt-1 text-xs text-zinc-700">
                    Bilder & Dateien per Klick oder Drag & Drop anhängen
                  </span>
                )}
              </p>
            </div>
          )}
          <div className="relative z-10 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <MessageBubble key={m.id} msg={m} accent={selectedModel.accent} />
            ))}
          </AnimatePresence>
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                <Loader2 size={16} className="animate-spin" style={{ color: selectedModel.accent }} />
              </div>
            </div>
          )}
          <div ref={endRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-white/10 p-4 space-y-2">
          {file && <FilePreview file={file} onRemove={() => setFile(null)} />}
          <div className="flex items-end gap-2">
            {selectedModel.vision && (
              <>
                <input ref={fileRef} type="file" accept={ACCEPT} className="hidden"
                  onChange={(e) => handleFileInput(e.target.files[0])} />
                <button onClick={() => fileRef.current?.click()}
                  title="Datei / Bild anhängen"
                  className="w-10 h-10 shrink-0 flex items-center justify-center rounded-sm border border-white/10 text-zinc-500 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 transition-colors">
                  <Paperclip size={16} />
                </button>
              </>
            )}
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder={t("chat_placeholder")}
              className="flex-1 resize-none bg-black/40 border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D4AF37] max-h-36"
            />
            <button onClick={send} disabled={loading || (!input.trim() && !file)}
              className="w-12 h-12 shrink-0 inline-flex items-center justify-center rounded-sm bg-[#D4AF37] text-black hover:bg-[#F3E5AB] transition-colors disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

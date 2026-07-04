import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Send, Loader2, Copy, Check, Bot, Database, Wrench, X, Trash2, ExternalLink, Paperclip, Download, FileText } from "lucide-react";
import { useApp, API } from "@/context/AppContext";

export function ToolCard({ tool, color, onRun, isRunning, disabled }) {
  const lang = localStorage.getItem("kc_lang") || "DE";
  const label = lang === "DE" ? tool.label : tool.label_en;
  const isBuiltIn = tool.type === "image" || tool.builtIn;
  const isExternal = tool.type === "external";

  return (
    <button
      onClick={() => onRun(tool)}
      disabled={disabled}
      className={`group flex flex-col gap-2 p-4 rounded-sm border text-left transition-all duration-200 disabled:opacity-40 ${
        isBuiltIn
          ? "border-opacity-50 hover:bg-opacity-15"
          : isExternal
          ? "border-white/10 bg-white/2 hover:border-white/20"
          : "border-white/8 bg-[#0A0A0A] hover:border-white/20"
      }`}
      style={isBuiltIn ? { borderColor: `${color}50`, backgroundColor: `${color}08` } : {}}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isRunning ? (
            <Loader2 size={16} className="animate-spin" style={{ color }} />
          ) : (
            <span className="text-lg">{tool.emoji || "🔧"}</span>
          )}
          <span className="text-sm font-medium text-white">{label}</span>
        </div>
        {isBuiltIn && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
            style={{ backgroundColor: `${color}20`, color }}>
            Live
          </span>
        )}
        {isExternal && (
          <ExternalLink size={11} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
        )}
      </div>
      <p className="text-[11px] text-zinc-600 leading-relaxed">{tool.desc}</p>
    </button>
  );
}

const generatePDF = async (content, title) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentW = pageW - margin * 2;

  // Header bar
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 0, pageW, 18, "F");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Brandmind", margin, 12);

  // Title
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title || "Studio Export", margin, 34);

  // Date
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" }), pageW - margin, 34, { align: "right" });

  // Divider
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.3);
  doc.line(margin, 38, pageW - margin, 38);

  // Content
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const lines = doc.splitTextToSize(content, contentW);
  let y = 46;
  const lineH = 5.5;

  for (const line of lines) {
    if (y + lineH > pageH - margin) {
      doc.addPage();
      // mini header on new page
      doc.setFillColor(212, 175, 55);
      doc.rect(0, 0, pageW, 8, "F");
      y = 16;
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
    }
    if (line.startsWith("---") || line.startsWith("===")) {
      doc.setDrawColor(212, 175, 55, 0.4);
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageW - margin, y);
      y += 3;
    } else if (line.startsWith("[") && line.includes("]")) {
      doc.setTextColor(212, 175, 55);
      doc.setFont("helvetica", "bold");
      doc.text(line, margin, y);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "normal");
      y += lineH;
    } else {
      doc.text(line, margin, y);
      y += lineH;
    }
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7);
    doc.text(`Brandmind — Seite ${p} von ${pageCount}`, pageW / 2, pageH - 10, { align: "center" });
  }

  doc.save(`kickstartercash-export-${Date.now()}.pdf`);
};

export function StudioContextArea({ color, context, setContext, label, labelEN, placeholder, placeholderEN, title }) {
  const lang = localStorage.getItem("kc_lang") || "DE";
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("Max 10 MB"); return; }
    setUploading(true);
    try {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => setUploadedFile({ name: file.name, type: "image", url: reader.result });
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target.result;
          if (typeof text === "string") {
            setContext((p) => p + (p ? "\n\n" : "") + `[${file.name}]\n${text.slice(0, 3000)}`);
          }
          setUploadedFile({ name: file.name, type: "file" });
        };
        reader.readAsText(file);
      }
    } finally { setUploading(false); }
  };

  const downloadPDF = async () => {
    if (!context.trim()) return;
    setDownloading(true);
    try { await generatePDF(context, title || "Studio Export"); }
    catch (e) { console.error(e); }
    finally { setDownloading(false); }
  };

  return (
    <div className="border border-white/8 rounded-sm p-5 space-y-3" style={{ background: `${color}08` }}>
      <div className="flex items-center justify-between">
        <label className="block text-xs uppercase tracking-widest" style={{ color }}>
          {lang === "DE" ? (label || "Kontext") : (labelEN || "Context")}
        </label>
        <div className="flex items-center gap-2">
          {uploadedFile && (
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 bg-white/5 border border-white/10 rounded-sm px-2 py-1">
              <FileText size={10} />
              <span className="truncate max-w-[120px]">{uploadedFile.name}</span>
              <button onClick={() => setUploadedFile(null)} className="text-zinc-600 hover:text-red-400">
                <X size={9} />
              </button>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*,.pdf,.txt,.md,.csv,.json,.docx,.xlsx" className="hidden"
            onChange={(e) => handleFile(e.target.files[0])} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            title={lang === "DE" ? "Datei / Bild hochladen" : "Upload file / image"}
            className="flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-sm border border-white/10 text-zinc-500 hover:text-white hover:border-white/25 transition-colors disabled:opacity-40">
            {uploading ? <Loader2 size={11} className="animate-spin" /> : <Paperclip size={11} />}
            {lang === "DE" ? "Upload" : "Upload"}
          </button>
          <button onClick={downloadPDF} disabled={!context.trim() || downloading}
            title={lang === "DE" ? "Als PDF herunterladen" : "Download as PDF"}
            className="flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-sm border transition-colors disabled:opacity-40"
            style={{ borderColor: context.trim() ? `${color}40` : "rgba(255,255,255,0.1)", color: context.trim() ? color : "#555" }}>
            {downloading ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
            PDF
          </button>
        </div>
      </div>
      {uploadedFile?.type === "image" && (
        <img src={uploadedFile.url} alt="upload" className="max-h-32 rounded-sm object-contain border border-white/10" />
      )}
      <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={4}
        placeholder={lang === "DE" ? (placeholder || "Kontext eingeben…") : (placeholderEN || "Enter context…")}
        className="w-full bg-black border border-white/8 rounded-sm px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"
        onFocus={(e) => { e.target.style.borderColor = `${color}50`; }}
        onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }} />
    </div>
  );
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors">
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
    </button>
  );
}

export function AgentChatPanel({ agentId, agentName, agentEmoji, color, tools = [], placeholder }) {
  const { model, activeBrandId } = useApp();
  const lang = localStorage.getItem("kc_lang") || "DE";
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [toolLoading, setToolLoading] = useState(null);
  const [useKb, setUseKb] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading || toolLoading) return;
    setInput("");
    setMessages((p) => [...p, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const res = await axios.post(`${API}/agents/chat`, {
        agent_id: agentId, message: msg,
        history: messages.slice(-10), model, language: lang, use_knowledge: useKb,
        brand_id: activeBrandId,
      });
      setMessages((p) => [...p, { role: "assistant", content: res.data.reply }]);
    } catch {
      setMessages((p) => [...p, { role: "assistant", content: "Fehler. Bitte erneut versuchen." }]);
    } finally { setLoading(false); }
  }, [input, loading, toolLoading, agentId, model, lang, useKb, activeBrandId]); // eslint-disable-line react-hooks/exhaustive-deps

  const runTool = useCallback(async (tool) => {
    const context = input.trim() || "";
    const label = lang === "DE" ? tool.label : tool.label_en;
    setToolLoading(tool.id);
    setMessages((p) => [...p, { role: "user", content: `[${label}]${context ? ` — ${context}` : ""}`, isTool: true }]);
    setInput("");
    try {
      const res = await axios.post(`${API}/agents/tools/run`, {
        agent_id: agentId, tool_id: tool.id, context, model, language: lang,
        brand_id: activeBrandId,
      });
      if (res.data.type === "image") {
        setMessages((p) => [...p, { role: "assistant", toolLabel: label, image: res.data.image_url, prompt: res.data.prompt_used }]);
      } else if (res.data.type === "text") {
        setMessages((p) => [...p, { role: "assistant", content: res.data.reply, toolLabel: label }]);
      }
    } catch {
      setMessages((p) => [...p, { role: "assistant", content: "Tool-Fehler." }]);
    } finally { setToolLoading(null); }
  }, [input, agentId, model, lang, activeBrandId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <span className="text-base">{agentEmoji}</span>
          <div>
            <span className="text-sm font-semibold text-white">{agentName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setUseKb((v) => !v)}
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border transition-all ${useKb ? "border-[#7C3AED]/40 text-[#7C3AED] bg-[#7C3AED]/10" : "border-white/10 text-zinc-600"}`}>
            <Database size={9} /> KB
          </button>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} className="p-1 text-zinc-600 hover:text-zinc-300">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-10 text-zinc-700 text-sm">
            <span className="text-3xl block mb-2">{agentEmoji}</span>
            {lang === "DE" ? "Stelle eine Frage oder nutze ein Tool." : "Ask a question or use a tool."}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-6 h-6 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5 text-sm"
                style={{ backgroundColor: `${color}20` }}>
                {agentEmoji}
              </div>
            )}
            <div className={`group max-w-[85%] space-y-1.5 ${m.role === "user" ? "order-1" : ""}`}>
              {m.toolLabel && (
                <div className="text-[10px] uppercase tracking-widest flex items-center gap-1" style={{ color }}>
                  <Wrench size={8} /> {m.toolLabel}
                </div>
              )}
              {m.content && (
                <div className={`px-3 py-2.5 rounded-sm text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? m.isTool ? "bg-white/3 border border-white/8 text-zinc-500 italic text-xs" : "bg-[#7C3AED]/10 border border-[#7C3AED]/20 text-zinc-200"
                    : "bg-[#0A0A0A] border border-white/8 text-zinc-200"
                }`}>{m.content}</div>
              )}
              {m.image && (
                <div className="rounded-sm overflow-hidden border border-white/10">
                  <img src={m.image} alt="Generated" className="w-full" />
                  {m.prompt && <div className="px-3 py-1.5 bg-black/40 text-[10px] text-zinc-600 italic">{m.prompt}</div>}
                </div>
              )}
              {m.role === "assistant" && m.content && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <CopyBtn text={m.content} />
                </div>
              )}
            </div>
          </div>
        ))}
        {(loading || toolLoading) && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-sm flex items-center justify-center flex-shrink-0 text-sm"
              style={{ backgroundColor: `${color}20` }}>{agentEmoji}</div>
            <div className="px-3 py-2.5 bg-[#0A0A0A] border border-white/8 rounded-sm flex gap-1 items-center">
              {[0,1,2].map((j) => (
                <motion.div key={j} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}
                  animate={{ opacity: [0.3,1,0.3] }} transition={{ duration: 0.7, repeat: Infinity, delay: j * 0.2 }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/8 flex-shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={placeholder || (lang === "DE" ? "Nachricht…" : "Message…")}
            className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-sm px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none"
            style={{ borderColor: input ? `${color}40` : undefined }}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading || !!toolLoading}
            className="w-8 flex items-center justify-center rounded-sm disabled:opacity-30 transition-all"
            style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}>
            {loading ? <Loader2 size={14} style={{ color }} className="animate-spin" /> : <Send size={14} style={{ color }} />}
          </button>
        </div>
      </div>
    </div>
  );
}

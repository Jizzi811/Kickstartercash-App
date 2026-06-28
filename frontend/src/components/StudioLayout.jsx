import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Send, Loader2, Copy, Check, Bot, Database, Wrench, X, Trash2, ExternalLink } from "lucide-react";
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
  const { model } = useApp();
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
      });
      setMessages((p) => [...p, { role: "assistant", content: res.data.reply }]);
    } catch {
      setMessages((p) => [...p, { role: "assistant", content: "Fehler. Bitte erneut versuchen." }]);
    } finally { setLoading(false); }
  }, [input, loading, toolLoading, messages, agentId, model, lang, useKb]);

  const runTool = useCallback(async (tool) => {
    const context = input.trim() || "";
    const label = lang === "DE" ? tool.label : tool.label_en;
    setToolLoading(tool.id);
    setMessages((p) => [...p, { role: "user", content: `[${label}]${context ? ` — ${context}` : ""}`, isTool: true }]);
    setInput("");
    try {
      const res = await axios.post(`${API}/agents/tools/run`, {
        agent_id: agentId, tool_id: tool.id, context, model, language: lang,
      });
      if (res.data.type === "image") {
        setMessages((p) => [...p, { role: "assistant", toolLabel: label, image: res.data.image_url, prompt: res.data.prompt_used }]);
      } else if (res.data.type === "text") {
        setMessages((p) => [...p, { role: "assistant", content: res.data.reply, toolLabel: label }]);
      }
    } catch {
      setMessages((p) => [...p, { role: "assistant", content: "Tool-Fehler." }]);
    } finally { setToolLoading(null); }
  }, [input, messages, agentId, model, lang]);

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
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border transition-all ${useKb ? "border-[#D4AF37]/40 text-[#D4AF37] bg-[#D4AF37]/10" : "border-white/10 text-zinc-600"}`}>
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
                    ? m.isTool ? "bg-white/3 border border-white/8 text-zinc-500 italic text-xs" : "bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-zinc-200"
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

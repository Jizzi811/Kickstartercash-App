import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Send, X, Trash2, Database, ChevronRight, Loader2, Copy, Check,
  Target, PenLine, Palette, Video, Globe, Smartphone, Handshake,
  TrendingUp, Bot, Code2, Sparkles,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { API } from "@/context/AppContext";

const ICON_MAP = {
  ceo:        { Icon: Target,      color: "#D4AF37" },
  content:    { Icon: PenLine,     color: "#60A5FA" },
  designer:   { Icon: Palette,     color: "#C084FC" },
  video:      { Icon: Video,       color: "#F472B6" },
  seo:        { Icon: Globe,       color: "#34D399" },
  social:     { Icon: Smartphone,  color: "#FBBF24" },
  sales:      { Icon: Handshake,   color: "#FB923C" },
  analytics:  { Icon: TrendingUp,  color: "#A78BFA" },
  automation: { Icon: Bot,         color: "#F87171" },
  coding:     { Icon: Code2,       color: "#22D3EE" },
};

const QUICK_PROMPTS = {
  ceo:        ["Erstelle einen Wochenplan für KickstarterCash", "Welche Abteilung soll ich heute priorisieren?", "Analysiere unsere aktuelle Marktposition"],
  content:    ["Schreib einen Hook für Instagram", "Erstelle 5 Headline-Varianten", "Newsletter-Einstieg für unser neues Produkt"],
  designer:   ["Beschreibe ein Werbebanner im Gold-Stil", "Erstelle einen Bild-Prompt für KI-Generator", "Welche Farben passen zu KickstarterCash?"],
  video:      ["Schreib ein 30-Sek TikTok-Script", "Storyboard für einen Produkt-Reel", "Veo-Prompt für ein Luxury-Video"],
  seo:        ["Keyword-Analyse für KickstarterCash", "Optimiere diese Meta-Description", "Welche Long-Tail-Keywords soll ich nutzen?"],
  social:     ["Erstelle 7 Posts für eine Woche", "Bester Posting-Zeitplan für Instagram", "Caption + Hashtags für ein Produkt-Post"],
  sales:      ["Wie behandle ich den Einwand 'zu teuer'?", "Erstelle ein Closing-Script", "Optimiere meinen Funnel-CTA"],
  analytics:  ["Welche KPIs sind für uns wichtig?", "Wie lese ich meinen Meta Ads Report?", "Was bedeutet ein CTR von 2%?"],
  automation: ["Baue einen Lead-Nurturing-Workflow", "n8n-Struktur für Social-Media-Posting", "Automatische Willkommens-E-Mail einrichten"],
  coding:     ["Erstelle eine einfache Landingpage in HTML", "React-Komponente für ein Countdown-Timer", "n8n-Webhook für Formular-Submissions"],
};

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={handle} className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors">
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
    </button>
  );
}

function AgentChat({ agent, onClose }) {
  const { model } = useApp();
  const lang = localStorage.getItem("kc_lang") || "DE";
  const { Icon, color } = ICON_MAP[agent.id] || { Icon: Bot, color: "#D4AF37" };
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [useKb, setUseKb] = useState(true);
  const bottomRef = useRef(null);

  const role = lang === "DE" ? agent.role_de : agent.role_en;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    const userMsg = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await axios.post(`${API}/agents/chat`, {
        agent_id: agent.id,
        message: msg,
        history: messages.slice(-10),
        model,
        language: lang,
        use_knowledge: useKb,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: lang === "DE" ? "Fehler beim Senden. Bitte erneut versuchen." : "Error sending. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, agent.id, model, lang, useKb]);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 260 }}
        className="ml-auto w-full max-w-2xl bg-[#050505] border-l border-white/10 flex flex-col h-full"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8">
          <div className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}20` }}>
            <Icon size={18} style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white flex items-center gap-1.5">
              <span>{agent.emoji}</span> {agent.name}
            </div>
            <div className="text-[11px] text-zinc-500">{role}</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setUseKb((v) => !v)}
              className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-full border transition-all ${
                useKb ? "border-[#D4AF37]/40 text-[#D4AF37] bg-[#D4AF37]/10" : "border-white/10 text-zinc-600"
              }`}
              title={lang === "DE" ? "Wissensdatenbank nutzen" : "Use knowledge base"}
            >
              <Database size={10} />
              {lang === "DE" ? "KB" : "KB"}
            </button>
            {messages.length > 0 && (
              <button onClick={() => setMessages([])} className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors" title="Verlauf löschen">
                <Trash2 size={14} />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-zinc-600 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-sm flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: `${color}15` }}>
                  <Icon size={26} style={{ color }} />
                </div>
                <p className="text-sm text-zinc-400 font-medium">{agent.emoji} {agent.name}</p>
                <p className="text-xs text-zinc-600 mt-1">{role}</p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] text-zinc-700 uppercase tracking-widest text-center">
                  {lang === "DE" ? "Schnellstart" : "Quick start"}
                </p>
                {(QUICK_PROMPTS[agent.id] || []).map((p, i) => (
                  <button
                    key={i}
                    onClick={() => send(p)}
                    className="w-full text-left text-sm px-4 py-2.5 border border-white/8 rounded-sm text-zinc-400 hover:text-white hover:border-white/20 transition-all flex items-center justify-between gap-2"
                  >
                    {p}
                    <ChevronRight size={13} className="flex-shrink-0 text-zinc-600" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: `${color}20` }}>
                  <Icon size={13} style={{ color }} />
                </div>
              )}
              <div className={`group max-w-[85%] ${m.role === "user" ? "order-1" : ""}`}>
                <div className={`px-4 py-3 rounded-sm text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-zinc-200 ml-auto"
                    : "bg-[#0A0A0A] border border-white/8 text-zinc-200"
                }`}>
                  {m.content}
                </div>
                {m.role === "assistant" && (
                  <div className="flex mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyBtn text={m.content} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${color}20` }}>
                <Icon size={13} style={{ color }} />
              </div>
              <div className="px-4 py-3 bg-[#0A0A0A] border border-white/8 rounded-sm">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: color }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-white/8">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              rows={2}
              placeholder={lang === "DE" ? `Nachricht an ${agent.name}…` : `Message to ${agent.name}…`}
              className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-sm px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"
              style={{ borderColor: input ? `${color}40` : undefined }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="flex items-center justify-center w-10 rounded-sm transition-all disabled:opacity-30 flex-shrink-0"
              style={{ backgroundColor: `${color}25`, border: `1px solid ${color}40` }}
            >
              {loading ? <Loader2 size={16} style={{ color }} className="animate-spin" /> : <Send size={16} style={{ color }} />}
            </button>
          </div>
          <p className="text-[10px] text-zinc-700 mt-1.5">
            Enter {lang === "DE" ? "senden" : "to send"} · Shift+Enter {lang === "DE" ? "neue Zeile" : "new line"}
            {useKb && <span className="text-[#D4AF37]/60"> · KB aktiv</span>}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function Specialists() {
  const lang = localStorage.getItem("kc_lang") || "DE";
  const [agents, setAgents] = useState([]);
  const [activeAgent, setActiveAgent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/agents`).then((r) => { setAgents(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-sm bg-[#D4AF37]/10 flex items-center justify-center">
            <Sparkles size={20} className="text-[#D4AF37]" />
          </div>
          <h1 className="font-display text-2xl text-white">
            {lang === "DE" ? "Jarvjis Spezialisten" : "Jarvjis Specialists"}
          </h1>
        </div>
        <p className="text-sm text-zinc-500">
          {lang === "DE"
            ? "10 KI-Agenten mit eigener Persönlichkeit & Expertise – alle verbunden mit deiner Wissensdatenbank."
            : "10 AI agents with their own personality & expertise – all connected to your knowledge base."}
        </p>
      </div>

      {/* Agent Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-[#D4AF37]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {agents.map((agent, i) => {
            const meta = ICON_MAP[agent.id] || { Icon: Bot, color: "#D4AF37" };
            const { Icon, color } = meta;
            const role = lang === "DE" ? agent.role_de : agent.role_en;
            return (
              <motion.button
                key={agent.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setActiveAgent(agent)}
                className="group text-left bg-[#0A0A0A] border border-white/8 rounded-sm p-5 hover:border-opacity-50 transition-all duration-200 hover:shadow-lg"
                style={{ "--hover-color": color }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${color}50`; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = ""; }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-sm flex items-center justify-center transition-colors"
                    style={{ backgroundColor: `${color}18` }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                  <span className="text-xl">{agent.emoji}</span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{agent.name}</h3>
                <p className="text-[11px] text-zinc-500 leading-relaxed">{role}</p>
                <div className="mt-4 flex items-center gap-1 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color }}>
                  {lang === "DE" ? "Chat öffnen" : "Open chat"} <ChevronRight size={11} />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-[#0A0A0A] border border-[#D4AF37]/15 rounded-sm">
        <Database size={15} className="text-[#D4AF37] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-500 leading-relaxed">
          <span className="text-[#D4AF37]">Wissensdatenbank aktiv</span>
          {lang === "DE"
            ? " — Alle Agenten greifen auf deine KB zu. Je mehr du in die Wissensdatenbank einträgst, desto präziser antworten die Agenten."
            : " — All agents access your KB. The more you add to the knowledge base, the more precisely the agents respond."}
        </div>
      </div>

      {/* Agent Chat Drawer */}
      <AnimatePresence>
        {activeAgent && (
          <AgentChat agent={activeAgent} onClose={() => setActiveAgent(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Send, X, Trash2, Database, ChevronRight, Loader2, Copy, Check,
  Target, PenLine, Palette, Video, Globe, Smartphone, Handshake,
  TrendingUp, Bot, Code2, Sparkles, Wrench, Image as ImageIcon,
  Zap, Search, FileText, BarChart2, GitBranch, Hash, Package,
  Film, Layers, Play, MessageSquare, ShieldCheck, Gift, GitMerge,
  RefreshCw, FileBarChart, Map, ListChecks, Type, BookOpen,
  Mail, MousePointer, Layout, Wand2, PenTool, Clapperboard,
  Code, Braces, FileEdit, Calendar, User, Globe2, Workflow,
  Plug, Box, Terminal, Webhook, Activity, Clock3,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { API } from "@/context/AppContext";
import { PageHeader } from "@/components/PageHeader";

const ICON_MAP = {
  ceo:        { Icon: Target,      color: "#7C3AED" },
  content:    { Icon: PenLine,     color: "#60A5FA" },
  designer:   { Icon: Palette,     color: "#C084FC" },
  video:      { Icon: Video,       color: "#F472B6" },
  seo:        { Icon: Globe,       color: "#34D399" },
  social:     { Icon: Smartphone,  color: "#7C3AED" },
  sales:      { Icon: Handshake,   color: "#FB923C" },
  analytics:  { Icon: TrendingUp,  color: "#A78BFA" },
  automation: { Icon: Bot,         color: "#F87171" },
  coding:     { Icon: Code2,       color: "#22D3EE" },
};

const LUCIDE_ICONS = {
  GitBranch, Map, ListChecks, BarChart2, Zap, Type, BookOpen, Mail,
  MousePointer, Image: ImageIcon, Layout, Wand2, Sparkles, PenTool, Palette,
  Film, Clapperboard, Video, Layers, Play, Search, Code, Braces, FileEdit,
  Package, Hash, Calendar, User, TrendingUp, MessageSquare, ShieldCheck,
  Gift, GitMerge, RefreshCw, FileBarChart, FileText, Workflow, Webhook,
  Plug, Box, Terminal, Globe: Globe2, Users: Bot, Target,
};

function ToolIcon({ name, size = 13 }) {
  const Icon = LUCIDE_ICONS[name] || Wrench;
  return <Icon size={size} />;
}

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

function ToolResultCard({ result, color }) {
  if (result.type === "image") {
    return (
      <div className="rounded-sm overflow-hidden border border-white/10">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8 bg-[#0A0A0A]">
          <ImageIcon size={13} style={{ color }} />
          <span className="text-xs text-zinc-400">{result.tool_label}</span>
        </div>
        <img src={result.image_url} alt="Generated" className="w-full" />
        {result.prompt_used && (
          <div className="px-3 py-2 bg-black/40 text-[11px] text-zinc-600 italic">{result.prompt_used}</div>
        )}
      </div>
    );
  }
  if (result.type === "error") {
    return <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-sm text-sm text-red-400">{result.message}</div>;
  }
  return null;
}

function AgentChat({ agent, onClose }) {
  const { model, activeBrandId } = useApp();
  const lang = localStorage.getItem("kc_lang") || "DE";
  const { Icon, color } = ICON_MAP[agent.id] || { Icon: Bot, color: "#7C3AED" };
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [toolLoading, setToolLoading] = useState(null);
  const [useKb, setUseKb] = useState(true);
  const [showTools, setShowTools] = useState(true);
  const bottomRef = useRef(null);

  const role = lang === "DE" ? agent.role_de : agent.role_en;
  const tools = agent.tools || [];

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
        brand_id: activeBrandId,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: lang === "DE" ? "Fehler beim Senden." : "Error sending." }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, agent.id, model, lang, useKb, activeBrandId]);

  const runTool = useCallback(async (tool) => {
    const context = input.trim() || (messages.length > 0 ? messages[messages.length - 1]?.content?.slice(0, 200) : "");
    setToolLoading(tool.id);
    const toolLabel = lang === "DE" ? tool.label : tool.label_en;

    // Show user message indicating tool use
    setMessages((prev) => [...prev, {
      role: "user",
      content: `[Tool: ${toolLabel}]${context ? ` → ${context}` : ""}`,
      isTool: true,
    }]);
    setInput("");

    try {
      const res = await axios.post(`${API}/agents/tools/run`, {
        agent_id: agent.id,
        tool_id: tool.id,
        context,
        model,
        language: lang,
        brand_id: activeBrandId,
      });

      if (res.data.type === "image") {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: `**${toolLabel}** — Bild generiert:`,
          toolResult: res.data,
        }]);
      } else if (res.data.type === "text") {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: res.data.reply,
          toolLabel,
        }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: res.data.message || "Fehler.", toolResult: res.data }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: lang === "DE" ? "Tool-Fehler. Bitte erneut versuchen." : "Tool error. Please try again." }]);
    } finally {
      setToolLoading(null);
    }
  }, [input, messages, agent.id, model, lang, activeBrandId]);

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
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8 flex-shrink-0">
          <div className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}20` }}>
            <Icon size={18} style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white">{agent.emoji} {agent.name}</div>
            <div className="text-[11px] text-zinc-500">{role}</div>
          </div>
          <div className="flex items-center gap-2">
            {tools.length > 0 && (
              <button
                onClick={() => setShowTools((v) => !v)}
                className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-full border transition-all ${
                  showTools ? "text-white border-white/20 bg-white/5" : "border-white/10 text-zinc-600"
                }`}
              >
                <Wrench size={10} />
                {tools.length}
              </button>
            )}
            <button
              onClick={() => setUseKb((v) => !v)}
              className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-full border transition-all ${
                useKb ? "border-[#7C3AED]/40 text-[#7C3AED] bg-[#7C3AED]/10" : "border-white/10 text-zinc-600"
              }`}
              title="Wissensdatenbank"
            >
              <Database size={10} /> KB
            </button>
            {messages.length > 0 && (
              <button onClick={() => setMessages([])} className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors">
                <Trash2 size={14} />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-zinc-600 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tool Palette */}
        <AnimatePresence>
          {showTools && tools.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-b border-white/8 flex-shrink-0"
            >
              <div className="px-4 py-3">
                <p className="text-[10px] text-zinc-700 uppercase tracking-widest mb-2">
                  {lang === "DE" ? "Tools" : "Tools"} — {lang === "DE" ? "klicken zum Ausführen" : "click to run"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tools.map((tool) => {
                    const isRunning = toolLoading === tool.id;
                    const label = lang === "DE" ? tool.label : tool.label_en;
                    const isImage = tool.type === "image";
                    return (
                      <button
                        key={tool.id}
                        onClick={() => runTool(tool)}
                        disabled={!!toolLoading || loading}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border text-[11px] font-medium transition-all disabled:opacity-40 ${
                          isImage
                            ? "border-[#C084FC]/40 text-[#C084FC] bg-[#C084FC]/8 hover:bg-[#C084FC]/15"
                            : "border-white/10 text-zinc-400 bg-white/3 hover:border-white/20 hover:text-white"
                        }`}
                        style={isRunning ? { borderColor: color, color } : {}}
                      >
                        {isRunning
                          ? <Loader2 size={11} className="animate-spin" />
                          : <ToolIcon name={tool.icon} size={11} />
                        }
                        {label}
                        {isImage && <span className="text-[9px] opacity-60 ml-0.5">IMG</span>}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-zinc-700 mt-2">
                  {lang === "DE"
                    ? "Tipp: Text im Eingabefeld wird als Kontext für das Tool genutzt."
                    : "Tip: Text in the input field is used as context for the tool."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-sm flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: `${color}15` }}>
                <Icon size={26} style={{ color }} />
              </div>
              <p className="text-sm text-zinc-400 font-medium">{agent.emoji} {agent.name}</p>
              <p className="text-xs text-zinc-600 mt-1 mb-6">{role}</p>
              {tools.length > 0 && (
                <p className="text-[11px] text-zinc-700">
                  {lang === "DE"
                    ? `${tools.length} Tools verfügbar — direkt oben klicken`
                    : `${tools.length} tools available — click above`}
                </p>
              )}
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: `${color}20` }}>
                  {m.toolLabel ? <Wrench size={12} style={{ color }} /> : <Icon size={13} style={{ color }} />}
                </div>
              )}
              <div className={`group max-w-[88%] space-y-2 ${m.role === "user" ? "order-1" : ""}`}>
                {m.toolLabel && (
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest" style={{ color }}>
                    <Wrench size={9} /> {m.toolLabel}
                  </div>
                )}
                {m.content && (
                  <div className={`px-4 py-3 rounded-sm text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? m.isTool
                        ? "bg-white/3 border border-white/8 text-zinc-500 italic"
                        : "bg-[#7C3AED]/10 border border-[#7C3AED]/20 text-zinc-200"
                      : "bg-[#0A0A0A] border border-white/8 text-zinc-200"
                  }`}>
                    {m.content}
                  </div>
                )}
                {m.toolResult && <ToolResultCard result={m.toolResult} color={color} />}
                {m.role === "assistant" && m.content && !m.toolResult && (
                  <div className="flex mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyBtn text={m.content} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {(loading || toolLoading) && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${color}20` }}>
                {toolLoading ? <Wrench size={12} style={{ color }} /> : <Icon size={13} style={{ color }} />}
              </div>
              <div className="px-4 py-3 bg-[#0A0A0A] border border-white/8 rounded-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: color }}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                  {toolLoading && (
                    <span className="text-[11px] text-zinc-600">
                      {tools.find((t) => t.id === toolLoading)?.[lang === "DE" ? "label" : "label_en"]}…
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-white/8 flex-shrink-0">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              rows={2}
              placeholder={lang === "DE"
                ? `Nachricht oder Kontext für Tools…`
                : `Message or context for tools…`}
              className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-sm px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"
              style={{ borderColor: input ? `${color}40` : undefined }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading || !!toolLoading}
              className="flex items-center justify-center w-10 rounded-sm transition-all disabled:opacity-30 flex-shrink-0"
              style={{ backgroundColor: `${color}25`, border: `1px solid ${color}40` }}
            >
              {loading ? <Loader2 size={16} style={{ color }} className="animate-spin" /> : <Send size={16} style={{ color }} />}
            </button>
          </div>
          <p className="text-[10px] text-zinc-700 mt-1.5">
            Enter {lang === "DE" ? "senden" : "send"} · Shift+Enter {lang === "DE" ? "neue Zeile" : "newline"}
            {useKb && <span className="text-[#7C3AED]/50"> · KB</span>}
            {showTools && tools.length > 0 && <span style={{ color: `${color}60` }}> · {tools.length} Tools</span>}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

const STATUS_META = [
  { key: "active", dot: "🟢", color: "#34D399", labelDE: "Aktiv", labelEN: "Active", activityDE: "nimmt neue Aufgaben an", activityEN: "accepting new work" },
  { key: "working", dot: "🟡", color: "#FBBF24", labelDE: "Arbeitet", labelEN: "Working", activityDE: "bearbeitet einen Auftrag", activityEN: "processing a task" },
  { key: "waiting", dot: "🔵", color: "#60A5FA", labelDE: "Wartet", labelEN: "Waiting", activityDE: "wartet auf Freigabe", activityEN: "waiting for approval" },
  { key: "error", dot: "🔴", color: "#F87171", labelDE: "Fehler", labelEN: "Error", activityDE: "braucht Aufmerksamkeit", activityEN: "needs attention" },
];

export default function Specialists() {
  const lang = localStorage.getItem("kc_lang") || "DE";
  const [agents, setAgents] = useState([]);
  const [activeAgent, setActiveAgent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/agents`)
      .then((r) => { setAgents(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const liveAgents = agents.slice(0, 6).map((agent, index) => ({ agent, status: STATUS_META[index % STATUS_META.length] }));

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Sparkles}
        badge="Brandmind Specialists"
        title={lang === "DE" ? "Brandmind Spezialisten" : "Brandmind Specialists"}
        subtitle={lang === "DE"
          ? "17 KI-Agenten mit eigener Persönlichkeit, spezialisierten Tools & KB-Zugriff."
          : "17 AI agents with their own personality, specialized tools & KB access."}
      />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-sm border border-[#7C3AED]/20 bg-[#0A0A0A] p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><Activity size={16} className="text-[#7C3AED]" />{lang === "DE" ? "Agentenzentrale" : "Agent Command Center"}</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STATUS_META.map((s) => (
              <div key={s.key} className="rounded-sm border border-white/8 bg-white/[0.03] p-3">
                <div className="text-lg">{s.dot}</div>
                <div className="mt-1 text-xs font-medium text-zinc-200">{lang === "DE" ? s.labelDE : s.labelEN}</div>
                <div className="text-[10px] text-zinc-600">{lang === "DE" ? s.activityDE : s.activityEN}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-sm border border-white/8 bg-[#0A0A0A] p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><Clock3 size={16} className="text-[#7C3AED]" />Live-Aktivitäten</div>
          <div className="space-y-3">
            {(liveAgents.length ? liveAgents : []).map(({ agent, status }, index) => (
              <div key={agent.id} className="flex items-center gap-3 text-xs">
                <span className="w-10 text-zinc-600">08:{String(42 + index).padStart(2, "0")}</span>
                <span>{status.dot}</span>
                <span className="min-w-0 flex-1 truncate text-zinc-300">{agent.name} · {lang === "DE" ? status.activityDE : status.activityEN}</span>
              </div>
            ))}
            {!liveAgents.length && <p className="text-xs text-zinc-600">{lang === "DE" ? "Lade Live-Aktivitäten…" : "Loading live activity…"}</p>}
          </div>
        </div>
      </div>

      {/* Agent Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-[#7C3AED]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {agents.map((agent, i) => {
            const meta = ICON_MAP[agent.id] || { Icon: Bot, color: "#7C3AED" };
            const { Icon, color } = meta;
            const role = lang === "DE" ? agent.role_de : agent.role_en;
            const tools = agent.tools || [];
            return (
              <motion.button
                key={agent.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setActiveAgent(agent)}
                className="group text-left bg-[#0A0A0A] border border-white/8 rounded-sm p-5 transition-all duration-200"
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${color}50`; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = ""; }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-sm flex items-center justify-center"
                    style={{ backgroundColor: `${color}18` }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                  <span className="flex items-center gap-1 text-xl">{agent.emoji}<span className="text-xs">{STATUS_META[i % STATUS_META.length].dot}</span></span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{agent.name}</h3>
                <p className="text-[11px] text-zinc-500 leading-relaxed mb-3">{role}</p>
                <div className="mb-3 rounded-sm border border-white/8 bg-white/[0.03] px-2 py-1.5 text-[10px] text-zinc-500">
                  {lang === "DE" ? STATUS_META[i % STATUS_META.length].labelDE : STATUS_META[i % STATUS_META.length].labelEN} · {lang === "DE" ? STATUS_META[i % STATUS_META.length].activityDE : STATUS_META[i % STATUS_META.length].activityEN}
                </div>

                {/* Tool chips preview */}
                {tools.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tools.slice(0, 3).map((t) => (
                      <span key={t.id} className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-white/8 text-zinc-600">
                        <ToolIcon name={t.icon} size={9} />
                        {lang === "DE" ? t.label : t.label_en}
                      </span>
                    ))}
                    {tools.length > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 text-zinc-700">+{tools.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-1 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color }}>
                  {lang === "DE" ? "Chat öffnen" : "Open chat"} <ChevronRight size={11} />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Info */}
      <div className="flex items-start gap-3 p-4 bg-[#0A0A0A] border border-[#7C3AED]/15 rounded-sm">
        <Wrench size={15} className="text-[#7C3AED] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-500 leading-relaxed">
          <span className="text-[#7C3AED]">
            {lang === "DE" ? "Tool-System aktiv" : "Tool system active"}
          </span>
          {lang === "DE"
            ? " — Jeder Agent hat spezialisierte Tools. Designer nutzt GPT Image, Canva, Leonardo, Flux & Ideogram. Video nutzt Veo, Runway & Kling Prompts. Coding generiert sofort einsatzbereiten Code."
            : " — Each agent has specialized tools. Designer uses GPT Image, Canva, Leonardo, Flux & Ideogram. Video uses Veo, Runway & Kling prompts. Coding generates immediately usable code."}
        </div>
      </div>

      <AnimatePresence>
        {activeAgent && (
          <AgentChat agent={activeAgent} onClose={() => setActiveAgent(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

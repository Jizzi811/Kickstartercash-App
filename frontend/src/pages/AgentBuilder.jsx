import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Bot, Trash2, Upload, FileText, X, Send, Loader2,
  ChevronRight, Sparkles, Wand2, Copy, Check
} from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { PageHeader } from "@/components/PageHeader";

const COLOR = "#7C3AED";

const PRESET_CATEGORIES = [
  { label: "Immobilien", emoji: "🏠", role: "Immobilien-Experte", color: "#34D399" },
  { label: "Crypto", emoji: "₿", role: "Crypto & Web3 Berater", color: "#7C3AED" },
  { label: "Coach", emoji: "🎯", role: "Business Coach", color: "#A78BFA" },
  { label: "Steuerberater", emoji: "📊", role: "Steuer & Finanzen", color: "#60A5FA" },
  { label: "Makler", emoji: "🤝", role: "Makler & Vertrieb", color: "#F472B6" },
  { label: "Pflegedienst", emoji: "❤️", role: "Pflege & Soziales", color: "#F87171" },
  { label: "E-Commerce", emoji: "🛒", role: "Online-Shop Experte", color: "#7C3AED" },
  { label: "Fitness", emoji: "💪", role: "Fitness & Ernährung Coach", color: "#34D399" },
];

const EMOJI_OPTIONS = ["🤖","🏠","₿","🎯","📊","🤝","❤️","🛒","💪","🌍","⚡","🎨","📱","🔬","🚀","💼","🎓","🏆"];

function CreateAgentModal({ onClose, onCreated }) {
  const { lang } = useApp();
  const [form, setForm] = useState({ name: "", emoji: "🤖", role: "", personality: "", color: "#7C3AED", category: "" });
  const [saving, setSaving] = useState(false);

  const applyPreset = (preset) => {
    setForm(f => ({ ...f, emoji: preset.emoji, role: preset.role, color: preset.color, category: preset.label }));
  };

  const save = async () => {
    if (!form.name.trim() || !form.role.trim()) {
      toast.error(lang === "DE" ? "Name und Rolle erforderlich" : "Name and role required");
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post(`${API}/custom-agents`, form);
      onCreated(res.data);
      toast.success(lang === "DE" ? "Agent erstellt!" : "Agent created!");
      onClose();
    } catch { toast.error("Fehler"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-[#0A0A0A] border border-white/12 rounded-sm w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h2 className="text-sm font-semibold text-white">
            {lang === "DE" ? "Eigenen Agenten erstellen" : "Create Custom Agent"}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-5">
          {/* Presets */}
          <div>
            <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-2">
              {lang === "DE" ? "Schnellauswahl" : "Quick Select"}
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_CATEGORIES.map(p => (
                <button key={p.label} onClick={() => applyPreset(p)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-white/8 text-xs text-zinc-400 hover:border-[#7C3AED]/40 hover:text-white transition-all">
                  {p.emoji} {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Emoji */}
          <div>
            <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Emoji</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_OPTIONS.map(e => (
                <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  className={`w-9 h-9 rounded-sm text-lg border transition-all ${form.emoji === e ? "border-[#7C3AED] bg-[#7C3AED]/10" : "border-white/8 hover:border-white/20"}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">
              {lang === "DE" ? "Name" : "Name"}
            </label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder={lang === "DE" ? "z.B. Max – Immobilien Experte" : "e.g. Max – Real Estate Expert"}
              className="w-full bg-black border border-white/8 rounded-sm px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#7C3AED]/40" />
          </div>

          {/* Role */}
          <div>
            <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">
              {lang === "DE" ? "Rolle / Expertise" : "Role / Expertise"}
            </label>
            <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              placeholder={lang === "DE" ? "z.B. Immobilien-Experte für München" : "e.g. Real estate expert for Munich"}
              className="w-full bg-black border border-white/8 rounded-sm px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#7C3AED]/40" />
          </div>

          {/* Personality */}
          <div>
            <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">
              {lang === "DE" ? "Persönlichkeit & Stil" : "Personality & Style"}
            </label>
            <textarea value={form.personality} onChange={e => setForm(f => ({ ...f, personality: e.target.value }))}
              rows={3}
              placeholder={lang === "DE"
                ? "z.B. Professionell, direkt, kennt den Münchner Immobilienmarkt seit 15 Jahren…"
                : "e.g. Professional, direct, knows the Munich real estate market for 15 years…"}
              className="w-full bg-black border border-white/8 rounded-sm px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none focus:border-[#7C3AED]/40" />
          </div>

          {/* Color */}
          <div>
            <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">
              {lang === "DE" ? "Farbe" : "Color"}
            </label>
            <div className="flex items-center gap-3">
              {["#7C3AED","#34D399","#F59E0B","#A78BFA","#60A5FA","#F472B6","#F87171","#FBBF24"].map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? "border-white scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <button onClick={save} disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-[#7C3AED] text-white py-2.5 rounded-sm font-bold text-sm hover:bg-[#C4B5FD] transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {lang === "DE" ? "Agent erstellen" : "Create Agent"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function AgentChatDrawer({ agent, onClose }) {
  const { lang, model } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const bottomRef = useRef();

  useEffect(() => {
    const loadDocs = async () => {
      try {
        const res = await axios.get(`${API}/custom-agents/${agent.id}/documents`);
        setDocs(res.data);
      } catch {}
    };
    loadDocs();
  }, [agent.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadDocs = async () => {
    try {
      const res = await axios.get(`${API}/custom-agents/${agent.id}/documents`);
      setDocs(res.data);
    } catch {}
  };

  const uploadDoc = async (file) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await axios.post(`${API}/custom-agents/${agent.id}/documents`, fd);
      toast.success(lang === "DE" ? "Dokument hochgeladen" : "Document uploaded");
      loadDocs();
    } catch { toast.error("Upload fehlgeschlagen"); }
    finally { setUploading(false); }
  };

  const deleteDoc = async (docId) => {
    try {
      await axios.delete(`${API}/custom-agents/${agent.id}/documents/${docId}`);
      loadDocs();
    } catch {}
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const res = await axios.post(`${API}/custom-agents/${agent.id}/chat`, {
        message: msg, history: messages, model, language: lang
      });
      setMessages(m => [...m, { role: "assistant", content: res.data.reply }]);
    } catch { toast.error("Fehler"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="absolute right-0 top-0 h-full w-full max-w-lg bg-[#080808] border-l border-white/8 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm flex items-center justify-center text-xl"
              style={{ backgroundColor: `${agent.color}18` }}>
              {agent.emoji}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{agent.name}</div>
              <div className="text-[10px] text-zinc-500">{agent.role}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18} /></button>
        </div>

        {/* Docs panel */}
        <div className="px-5 py-3 border-b border-white/8 bg-black/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
              {lang === "DE" ? "Wissensdokumente" : "Knowledge Docs"} ({docs.length})
            </span>
            <button onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-sm border border-white/8 text-zinc-400 hover:border-[#7C3AED]/40 hover:text-[#7C3AED] transition-all disabled:opacity-50">
              {uploading ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
              {lang === "DE" ? "Upload" : "Upload"}
            </button>
            <input ref={fileRef} type="file" className="hidden"
              accept=".txt,.md,.pdf,.csv,.json"
              onChange={e => e.target.files?.[0] && uploadDoc(e.target.files[0])} />
          </div>
          {docs.length > 0 && (
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {docs.map(d => (
                <div key={d.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                    <FileText size={10} />
                    <span className="truncate max-w-[200px]">{d.filename}</span>
                  </div>
                  <button onClick={() => deleteDoc(d.id)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all">
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {docs.length === 0 && (
            <p className="text-[10px] text-zinc-700">
              {lang === "DE" ? "Keine Dokumente – Agent antwortet ohne Kontext." : "No documents – agent responds without context."}
            </p>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-3xl mb-3">{agent.emoji}</div>
              <p className="text-sm text-zinc-500">
                {lang === "DE"
                  ? `${agent.name} ist bereit. Stelle eine Frage!`
                  : `${agent.name} is ready. Ask a question!`}
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-sm px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-[#7C3AED]/15 text-white border border-[#7C3AED]/20"
                  : "bg-[#111] text-zinc-200 border border-white/8"
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#111] border border-white/8 rounded-sm px-4 py-3">
                <div className="flex gap-1.5">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
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
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder={lang === "DE" ? `${agent.name} fragen…` : `Ask ${agent.name}…`}
              className="flex-1 bg-black border border-white/8 rounded-sm px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#7C3AED]/40"
            />
            <button onClick={send} disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-sm flex items-center justify-center transition-colors disabled:opacity-40"
              style={{ backgroundColor: `${agent.color}20`, border: `1px solid ${agent.color}40` }}>
              <Send size={14} style={{ color: agent.color }} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AgentBuilderSection({ lang, model }) {
  const { activeBrandId } = useApp();
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!desc.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await axios.post(`${API}/agent-builder/generate`, { description: desc, model, language: lang, brand_id: activeBrandId });
      setResult(res.data.plan);
    } catch { toast.error("Fehler"); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-[#0A0A0A] border border-[#7C3AED]/20 rounded-sm p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-sm flex items-center justify-center" style={{ backgroundColor: "#7C3AED18" }}>
          <Wand2 size={18} style={{ color: COLOR }} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">
            {lang === "DE" ? "Phase 7 – Agent Builder" : "Phase 7 – Agent Builder"}
          </h2>
          <p className="text-[11px] text-zinc-500">
            {lang === "DE"
              ? "Beschreibe deinen Workflow → KI generiert den Automationsplan"
              : "Describe your workflow → AI generates the automation plan"}
          </p>
        </div>
        <div className="ml-auto">
          <span className="text-[10px] px-2 py-1 rounded-full border border-[#7C3AED]/30 text-[#7C3AED]">
            <Sparkles size={9} className="inline mr-1" />BETA
          </span>
        </div>
      </div>

      <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4}
        placeholder={lang === "DE"
          ? "Beschreibe deinen Workflow auf Deutsch, z.B.:\n\"Wenn jemand mein Kontaktformular ausfüllt, soll automatisch eine Willkommens-E-Mail gesendet, ein CRM-Eintrag erstellt und ich per Slack benachrichtigt werden.\""
          : "Describe your workflow, e.g.:\n\"When someone fills my contact form, automatically send a welcome email, create a CRM entry, and notify me via Slack.\""}
        className="w-full bg-black border border-white/8 rounded-sm px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none focus:border-[#7C3AED]/40" />

      <button onClick={generate} disabled={!desc.trim() || loading}
        className="flex items-center gap-2 bg-[#7C3AED] text-white px-5 py-2.5 rounded-sm font-bold text-sm hover:bg-[#C4B5FD] transition-colors disabled:opacity-50">
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
        {lang === "DE" ? "Workflow generieren" : "Generate Workflow"}
      </button>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 size={14} className="animate-spin text-[#7C3AED]" />
          {lang === "DE" ? "Analysiere & erstelle Automationsplan…" : "Analyzing & building automation plan…"}
        </div>
      )}

      {result && (
        <div className="bg-black border border-white/8 rounded-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8">
            <span className="text-xs text-[#7C3AED] font-medium">
              {lang === "DE" ? "Generierter Workflow-Plan" : "Generated Workflow Plan"}
            </span>
            <button onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white">
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copied ? "Kopiert!" : "Kopieren"}
            </button>
          </div>
          <pre className="px-4 py-4 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed overflow-auto max-h-96">{result}</pre>
        </div>
      )}
    </div>
  );
}

export default function AgentBuilder() {
  const { lang, model } = useApp();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);

  useEffect(() => { loadAgents(); }, []);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/custom-agents`);
      setAgents(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  const deleteAgent = async (id) => {
    try {
      await axios.delete(`${API}/custom-agents/${id}`);
      setAgents(a => a.filter(x => x.id !== id));
      toast.success(lang === "DE" ? "Agent gelöscht" : "Agent deleted");
    } catch { toast.error("Fehler"); }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        icon={Bot}
        badge="Agent Builder"
        title={lang === "DE" ? "Eigene Agenten" : "Custom Agents"}
        subtitle={lang === "DE"
          ? "Erstelle personalisierte KI-Agenten mit deinen Dokumenten"
          : "Create personalized AI agents with your documents"}
        actions={(
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[#7C3AED] text-white px-4 py-2.5 rounded-sm font-bold text-sm hover:bg-[#C4B5FD] transition-colors">
            <Plus size={15} />
            {lang === "DE" ? "Neuen Agenten" : "New Agent"}
          </button>
        )}
      />

      {/* Agents grid */}
      {loading ? (
        <div className="flex items-center gap-3 text-zinc-500 text-sm">
          <Loader2 size={16} className="animate-spin" /> Laden…
        </div>
      ) : agents.length === 0 ? (
        <div className="border border-dashed border-white/12 rounded-sm p-12 text-center">
          <div className="text-4xl mb-4">🤖</div>
          <p className="text-sm text-zinc-500 mb-4">
            {lang === "DE"
              ? "Noch keine eigenen Agenten. Erstelle deinen ersten!"
              : "No custom agents yet. Create your first one!"}
          </p>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 mx-auto bg-[#7C3AED] text-white px-5 py-2.5 rounded-sm font-bold text-sm hover:bg-[#C4B5FD] transition-colors">
            <Plus size={14} /> {lang === "DE" ? "Agent erstellen" : "Create Agent"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#0A0A0A] border border-white/8 rounded-sm p-5 group hover:border-white/16 transition-all"
              style={{ borderColor: `${agent.color}15` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-sm flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${agent.color}18` }}>
                  {agent.emoji}
                </div>
                <button onClick={() => deleteAgent(agent.id)}
                  className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{agent.name}</h3>
              <p className="text-[11px] text-zinc-500 mb-1">{agent.role}</p>
              {agent.category && (
                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full border border-white/8 text-zinc-600 mb-3">
                  {agent.category}
                </span>
              )}
              <button
                onClick={() => setActiveAgent(agent)}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-sm border text-xs font-medium transition-all"
                style={{ borderColor: `${agent.color}40`, color: agent.color, backgroundColor: `${agent.color}08` }}
              >
                <Send size={11} /> {lang === "DE" ? "Chat starten" : "Start Chat"}
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Phase 7 – Agent Builder */}
      <AgentBuilderSection lang={lang} model={model} />

      {/* Modals */}
      <AnimatePresence>
        {showCreate && (
          <CreateAgentModal
            onClose={() => setShowCreate(false)}
            onCreated={agent => setAgents(a => [...a, agent])}
          />
        )}
        {activeAgent && (
          <AgentChatDrawer agent={activeAgent} onClose={() => setActiveAgent(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

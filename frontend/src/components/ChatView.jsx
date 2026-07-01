import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Send, Loader2, Trash2 } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { PageTitle } from "@/components/PageTitle";

export const ChatView = ({ model, title, subtitle, icon, accent }) => {
  const { t, lang } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [grokExtraData, setGrokExtraData] = useState(null);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: text, id: Date.now() }]);
    setInput("");
    setLoading(true);
    try {
      const payload = { message: text, history, model, language: lang };
      if (model === "grok" && grokExtraData) payload.grok_extra_data = grokExtraData;
      const res = await axios.post(`${API}/chat`, payload);
      if (res.data.grok_extra_data) setGrokExtraData(res.data.grok_extra_data);
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.reply, id: Date.now() + 1 }]);
    } catch (e) {
      toast.error(t("error_generic"));
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ " + t("error_generic"), id: Date.now() + 1 }]);
    } finally { setLoading(false); }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageTitle title={title} subtitle={subtitle} icon={icon} />
        {messages.length > 0 && (
          <button data-testid="chat-clear-btn" onClick={() => { setMessages([]); setGrokExtraData(null); }}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm border border-white/10 text-zinc-400 hover:text-red-400 hover:border-red-400/50">
            <Trash2 size={13} /> {t("chat_clear")}
          </button>
        )}
      </div>

      <div className="bg-[#0A0A0A] border border-white/10 rounded-md flex flex-col h-[calc(100vh-260px)] min-h-[420px]">
        <div className="flex-1 overflow-y-auto p-5 space-y-4" data-testid="chat-messages">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center text-zinc-600">
              <span className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: `${accent}1a`, color: accent }}>{icon && React.createElement(icon, { size: 26 })}</span>
              <p className="text-sm max-w-sm">{t("chat_empty")}</p>
            </div>
          )}
          {messages.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              data-testid={`chat-msg-${m.role}`}>
              <div className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                m.role === "user" ? "bg-[#7C3AED] text-white font-medium" : "bg-white/5 text-zinc-200 border border-white/10"}`}>
                {m.content}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex justify-start" data-testid="chat-loading">
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                <Loader2 size={16} className="animate-spin" style={{ color: accent }} />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-white/10 p-4 flex items-end gap-3">
          <textarea
            data-testid="chat-input"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={t("chat_placeholder")}
            className="flex-1 resize-none bg-black/40 border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-[#7C3AED] max-h-36"
          />
          <button data-testid="chat-send-btn" onClick={send} disabled={loading || !input.trim()}
            className="inline-flex items-center justify-center w-12 h-12 rounded-sm bg-[#7C3AED] text-white hover:bg-[#C4B5FD] transition-colors disabled:opacity-50 shrink-0">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Minimize2, Sparkles } from "lucide-react";
import { API } from "@/context/AppContext";
import { useApp } from "@/context/AppContext";

const SUGGESTIONS_DE = [
  "Was kann KickstarterCash für mich tun?",
  "Welche KI-Tools sind enthalten?",
  "Wie funktioniert der Agenten-Builder?",
  "Was kostet die Mitgliedschaft?",
];

const SUGGESTIONS_EN = [
  "What can KickstarterCash do for me?",
  "Which AI tools are included?",
  "How does the agent builder work?",
  "What does the membership cost?",
];

export function SalesSupportWidget() {
  const { lang, model } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [sessionId] = useState(() => crypto.randomUUID());
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const suggestions = lang === "DE" ? SUGGESTIONS_DE : SUGGESTIONS_EN;

  useEffect(() => {
    if (open && messages.length === 0) {
      const greeting = lang === "DE"
        ? "Willkommen bei KickstarterCash ✦ Ich bin KASH, dein persönlicher Assistent. Wie kann ich dir heute helfen – hast du Fragen zu unseren Tools oder möchtest du mehr erfahren?"
        : "Welcome to KickstarterCash ✦ I'm KASH, your personal assistant. How can I help you today – do you have questions about our tools or want to learn more?";
      setMessages([{ role: "assistant", content: greeting, id: 0 }]);
    }
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setShowSuggestions(false);
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: msg, id: Date.now() }]);
    setInput("");
    setLoading(true);
    try {
      const effectiveModel = model === "grok" ? "gemini" : model;
      const res = await axios.post(`${API}/homepage/chat`, {
        message: msg,
        history,
        language: lang,
        model: effectiveModel,
        session_id: sessionId,
      });
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: res.data.reply,
        id: Date.now() + 1,
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: lang === "DE"
          ? "⚠️ Entschuldigung, kurzer Verbindungsfehler. Bitte versuche es nochmal."
          : "⚠️ Sorry, brief connection error. Please try again.",
        id: Date.now() + 1,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #D4AF37, #B8972E)",
              boxShadow: "0 0 30px rgba(212,175,55,0.45), 0 8px 32px rgba(0,0,0,0.6)",
            }}
          >
            <MessageCircle size={22} className="text-black" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ background: "#D4AF37" }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] flex flex-col rounded-xl overflow-hidden"
            style={{
              height: "520px",
              background: "#0A0A0A",
              border: "1px solid rgba(212,175,55,0.25)",
              boxShadow: "0 0 60px rgba(212,175,55,0.12), 0 24px 64px rgba(0,0,0,0.8)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
              style={{
                borderColor: "rgba(212,175,55,0.2)",
                background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(0,0,0,0))",
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #D4AF37, #B8972E)" }}
              >
                <Sparkles size={15} className="text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white tracking-wide">KASH</div>
                <div className="text-[10px] text-zinc-500 tracking-widest uppercase">
                  {lang === "DE" ? "Sales & Support · Online" : "Sales & Support · Online"}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { setMessages([]); setShowSuggestions(true); setOpen(false); }}
                  className="w-7 h-7 rounded-sm flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/8 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5"
                      style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)" }}
                    >
                      <Sparkles size={11} style={{ color: "#D4AF37" }} />
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "text-black font-medium rounded-br-sm"
                        : "text-zinc-200 rounded-bl-sm"
                    }`}
                    style={
                      m.role === "user"
                        ? { background: "linear-gradient(135deg, #D4AF37, #C49B2D)" }
                        : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }
                    }
                  >
                    {m.content}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5"
                    style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)" }}
                  >
                    <Sparkles size={11} style={{ color: "#D4AF37" }} />
                  </div>
                  <div
                    className="rounded-lg rounded-bl-sm px-4 py-3 flex gap-1 items-center"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "#D4AF37" }}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {showSuggestions && messages.length <= 1 && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="pt-2 space-y-2"
                >
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest px-1">
                    {lang === "DE" ? "Häufige Fragen" : "Quick questions"}
                  </p>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => send(s)}
                      className="w-full text-left px-3 py-2 rounded-md text-xs text-zinc-400 hover:text-white transition-all duration-150"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)";
                        e.currentTarget.style.background = "rgba(212,175,55,0.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}

              <div ref={endRef} />
            </div>

            {/* Input */}
            <div
              className="px-3 py-3 border-t shrink-0 flex items-end gap-2"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder={lang === "DE" ? "Nachricht schreiben…" : "Write a message…"}
                className="flex-1 resize-none rounded-md px-3 py-2.5 text-[13px] text-white placeholder-zinc-600 focus:outline-none max-h-28"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  lineHeight: "1.5",
                }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(212,175,55,0.5)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 transition-all duration-150 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #D4AF37, #B8972E)" }}
              >
                {loading ? <Loader2 size={15} className="animate-spin text-black" /> : <Send size={15} className="text-black" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

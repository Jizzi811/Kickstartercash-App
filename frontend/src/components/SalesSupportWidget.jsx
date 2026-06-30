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

// Effekt C — Typewriter-Komponente
function TypewriterText({ text, duration }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    let i = 0;
    const speed = duration / text.length;
    const tick = () => {
      if (i < text.length) {
        setDisplayed(text.slice(0, ++i));
        setTimeout(tick, speed);
      } else {
        setDone(true);
      }
    };
    tick();
  }, [text, duration]);
  return (
    <span>
      {displayed}
      {!done && (
        <span
          style={{
            display: "inline-block",
            width: "2px",
            height: "1em",
            background: "#EBCB72",
            marginLeft: "2px",
            verticalAlign: "middle",
            animation: "twBlink 0.7s step-end infinite",
          }}
        />
      )}
    </span>
  );
}

// Effekt D — Driftende Gold-Partikel
function ChatParticles() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const particles = Array.from({ length: 15 }, () => ({
      x: Math.random() * 360,
      y: Math.random() * 480,
      r: Math.random() * 1.5 + 0.4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      o: Math.random() * 0.35 + 0.08,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, 360, 480);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = 360;
        if (p.x > 360) p.x = 0;
        if (p.y < 0) p.y = 480;
        if (p.y > 480) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${p.o})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={480}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.6,
      }}
    />
  );
}

export function SalesSupportWidget() {
  const { lang, model } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [sessionId] = useState(() => crypto.randomUUID());
  // Effekt B — Reactions
  const [reactions, setReactions] = useState({});
  // Effekt C — Typewriter IDs
  const [typingIds, setTypingIds] = useState(new Set());
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const suggestions = lang === "DE" ? SUGGESTIONS_DE : SUGGESTIONS_EN;

  useEffect(() => {
    if (open && messages.length === 0) {
      const greeting =
        lang === "DE"
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
      const effectiveModel =
        model === "grok" || model === "gemini" ? "claude-sonnet-4-6" : model;
      const res = await axios.post(`${API}/homepage/chat`, {
        message: msg,
        history,
        language: lang,
        model: effectiveModel,
        session_id: sessionId,
      });
      const newMsg = {
        role: "assistant",
        content: res.data.reply,
        id: Date.now() + 1,
      };
      setMessages((prev) => [...prev, newMsg]);
      // Effekt C — Typewriter starten
      setTypingIds((prev) => new Set([...prev, newMsg.id]));
      const duration = Math.max(800, Math.min(3000, res.data.reply.length * 18));
      setTimeout(() => {
        setTypingIds((prev) => {
          const s = new Set(prev);
          s.delete(newMsg.id);
          return s;
        });
      }, duration);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            lang === "DE"
              ? "⚠️ Entschuldigung, kurzer Verbindungsfehler. Bitte versuche es nochmal."
              : "⚠️ Sorry, brief connection error. Please try again.",
          id: Date.now() + 1,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Effekt A + C + D — globale Keyframes */}
      <style>{`
        @keyframes kashAvatarGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(212,175,55,0.4); }
          50%       { box-shadow: 0 0 24px rgba(251,233,166,0.9), 0 0 48px rgba(212,175,55,0.5); }
        }
        @keyframes kashPanelPulse {
          0%, 100% { border-color: rgba(212,175,55,0.25); }
          50%       { border-color: rgba(212,175,55,0.6); }
        }
        @keyframes twBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        .kash-reaction-bar { opacity: 0 !important; transition: opacity 0.2s; }
        .group:hover .kash-reaction-bar { opacity: 1 !important; }
      `}</style>

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
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] flex flex-col rounded-xl overflow-hidden"
            style={{
              height: "520px",
              background: "#0A0A0A",
              border: "1px solid rgba(212,175,55,0.25)",
              // Effekt A — Panel Glow bei loading
              boxShadow: loading
                ? "0 0 0 2px rgba(212,175,55,0.5), 0 0 40px rgba(212,175,55,0.15), 0 24px 64px rgba(0,0,0,0.8)"
                : "0 0 60px rgba(212,175,55,0.12), 0 24px 64px rgba(0,0,0,0.8)",
              transition: "box-shadow 0.4s ease",
              animation: loading ? "kashPanelPulse 1.4s ease-in-out infinite" : "none",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
              style={{
                borderColor: "rgba(212,175,55,0.2)",
                background:
                  "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(0,0,0,0))",
              }}
            >
              {/* Effekt A — Avatar Glow bei loading */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #B8972E)",
                  animation: loading ? "kashAvatarGlow 1.2s ease-in-out infinite" : "none",
                }}
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
                  onClick={() => {
                    setMessages([]);
                    setShowSuggestions(true);
                    setOpen(false);
                  }}
                  className="w-7 h-7 rounded-sm flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/8 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-3"
              style={{ position: "relative" }}
            >
              {/* Effekt D — Partikel-Canvas */}
              <ChatParticles />

              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  // Effekt B — group class für Hover-Reaktionen (nur assistant)
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start group"}`}
                  style={{ position: "relative", zIndex: 1 }}
                >
                  {m.role === "assistant" && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5"
                      style={{
                        background: "rgba(212,175,55,0.15)",
                        border: "1px solid rgba(212,175,55,0.3)",
                      }}
                    >
                      <Sparkles size={11} style={{ color: "#D4AF37" }} />
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", maxWidth: "78%" }}>
                    <div
                      className={`rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                        m.role === "user"
                          ? "text-black font-medium rounded-br-sm"
                          : "text-zinc-200 rounded-bl-sm"
                      }`}
                      style={
                        m.role === "user"
                          ? { background: "linear-gradient(135deg, #D4AF37, #C49B2D)" }
                          : {
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.08)",
                            }
                      }
                    >
                      {/* Effekt C — Typewriter für neue assistant-Nachrichten */}
                      {m.role === "assistant" && typingIds.has(m.id) ? (
                        <TypewriterText
                          text={m.content}
                          duration={Math.max(800, Math.min(3000, m.content.length * 18))}
                        />
                      ) : (
                        m.content
                      )}
                    </div>

                    {/* Effekt B — Reaction-Bar unter assistant-Bubbles */}
                    {m.role === "assistant" && (
                      <div
                        className="kash-reaction-bar"
                        style={{
                          display: "flex",
                          gap: "4px",
                          marginTop: "4px",
                        }}
                      >
                        {["👍", "✦", "💡"].map((e) => (
                          <button
                            key={e}
                            onClick={() =>
                              setReactions((r) => ({ ...r, [m.id]: e }))
                            }
                            style={{
                              background:
                                reactions[m.id] === e
                                  ? "rgba(212,175,55,0.25)"
                                  : "rgba(212,175,55,0.08)",
                              border: "1px solid rgba(212,175,55,0.25)",
                              borderRadius: "10px",
                              padding: "2px 7px",
                              fontSize: "0.72rem",
                              cursor: "pointer",
                              color: "#EBCB72",
                              transform:
                                reactions[m.id] === e ? "scale(1.15)" : "scale(1)",
                              transition: "all 0.15s",
                            }}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex justify-start" style={{ position: "relative", zIndex: 1 }}>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5"
                    style={{
                      background: "rgba(212,175,55,0.15)",
                      border: "1px solid rgba(212,175,55,0.3)",
                    }}
                  >
                    <Sparkles size={11} style={{ color: "#D4AF37" }} />
                  </div>
                  <div
                    className="rounded-lg rounded-bl-sm px-4 py-3 flex gap-1 items-center"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
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
                  style={{ position: "relative", zIndex: 1 }}
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

              <div ref={endRef} style={{ position: "relative", zIndex: 1 }} />
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
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(212,175,55,0.5)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.1)";
                }}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 transition-all duration-150 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #D4AF37, #B8972E)" }}
              >
                {loading ? (
                  <Loader2 size={15} className="animate-spin text-black" />
                ) : (
                  <Send size={15} className="text-black" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

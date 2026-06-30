import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Sparkles, Ticket, Trash2 } from "lucide-react";
import { API, useApp } from "@/context/AppContext";

const SUGGESTIONS_DE = [
  "Was kann Kickstarcash.Club für mich tun?",
  "Welche KI-Tools sind enthalten?",
  "Wie funktioniert der Agenten-Builder?",
  "Was kostet die Mitgliedschaft?",
];

const SUGGESTIONS_EN = [
  "What can Kickstarcash.Club do for me?",
  "Which AI tools are included?",
  "How does the agent builder work?",
  "What does the membership cost?",
];

function TicketModal({ onClose, lang }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("support");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  const submit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/tickets`, {
        title: title.trim(),
        description: desc.trim(),
        category: cat,
        priority: "medium",
        email: "",
      });
      setDone(res.data.ticket_id);
    } catch {
      setDone("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.7)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: "16px",
    }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#111", border: "1px solid rgba(212,175,55,0.3)",
          borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "400px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <Ticket size={16} style={{ color: "#D4AF37" }} />
          <span style={{ color: "#fff", fontWeight: 600, fontSize: "15px" }}>
            {lang === "DE" ? "Support-Ticket erstellen" : "Create Support Ticket"}
          </span>
        </div>

        {done ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            {done === "error" ? (
              <p style={{ color: "#f87171" }}>Fehler. Bitte erneut versuchen.</p>
            ) : (
              <>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>✅</div>
                <p style={{ color: "#D4AF37", fontWeight: 600 }}>
                  {lang === "DE" ? `Ticket #${done} erstellt!` : `Ticket #${done} created!`}
                </p>
                <p style={{ color: "#888", fontSize: "12px", marginTop: "4px" }}>
                  {lang === "DE" ? "Wir melden uns persönlich." : "We'll reach out personally."}
                </p>
                <button onClick={onClose} style={{
                  marginTop: "16px", padding: "8px 20px",
                  background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)",
                  borderRadius: "6px", color: "#D4AF37", cursor: "pointer",
                }}>OK</button>
              </>
            )}
          </div>
        ) : (
          <>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={lang === "DE" ? "Betreff *" : "Subject *"}
              style={{
                width: "100%", padding: "10px 12px", marginBottom: "10px",
                background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "6px", color: "#fff", fontSize: "13px",
                outline: "none", boxSizing: "border-box",
              }}
            />
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", marginBottom: "10px",
                background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "6px", color: "#888", fontSize: "13px",
                outline: "none", boxSizing: "border-box",
              }}
            >
              <option value="support">{lang === "DE" ? "Support" : "Support"}</option>
              <option value="billing">{lang === "DE" ? "Abrechnung" : "Billing"}</option>
              <option value="technical">{lang === "DE" ? "Technisch" : "Technical"}</option>
              <option value="feature">{lang === "DE" ? "Feature-Wunsch" : "Feature Request"}</option>
            </select>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder={lang === "DE" ? "Beschreibung (optional)" : "Description (optional)"}
              rows={3}
              style={{
                width: "100%", padding: "10px 12px", marginBottom: "16px",
                background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "6px", color: "#fff", fontSize: "13px",
                outline: "none", resize: "none", boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={onClose} style={{
                flex: 1, padding: "10px", background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px",
                color: "#666", cursor: "pointer", fontSize: "13px",
              }}>
                {lang === "DE" ? "Abbrechen" : "Cancel"}
              </button>
              <button onClick={submit} disabled={!title.trim() || loading} style={{
                flex: 2, padding: "10px",
                background: loading || !title.trim() ? "rgba(212,175,55,0.2)" : "rgba(212,175,55,0.9)",
                border: "1px solid rgba(212,175,55,0.4)", borderRadius: "6px",
                color: loading || !title.trim() ? "#888" : "#000",
                cursor: !title.trim() || loading ? "not-allowed" : "pointer",
                fontWeight: 600, fontSize: "13px",
              }}>
                {loading ? "…" : (lang === "DE" ? "Ticket erstellen" : "Create Ticket")}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

export function SalesSupportWidget() {
  const { lang } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const suggestions = lang === "DE" ? SUGGESTIONS_DE : SUGGESTIONS_EN;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    const history = messages.slice(-10);
    setMessages((p) => [...p, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const res = await axios.post(`${API}/sales-support/chat`, {
        message: msg, session_id: sessionId,
        history, language: lang,
      });
      setMessages((p) => [...p, { role: "assistant", content: res.data.reply }]);
    } catch {
      setMessages((p) => [...p, { role: "assistant", content: lang === "DE" ? "Verbindungsfehler. Bitte erneut versuchen." : "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, sessionId, lang]);

  const reset = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <>
      {showTicketModal && (
        <TicketModal lang={lang} onClose={() => setShowTicketModal(false)} />
      )}

      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setOpen(true)}
            style={{
              position: "fixed", bottom: "24px", right: "24px", zIndex: 1000,
              width: "52px", height: "52px", borderRadius: "50%",
              background: "linear-gradient(135deg, #D4AF37, #B8972E)",
              border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(212,175,55,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <MessageCircle size={22} color="#000" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed", bottom: "24px", right: "24px", zIndex: 1000,
              width: "360px", height: "540px",
              background: "#0D0D0D", border: "1px solid rgba(212,175,55,0.25)",
              borderRadius: "14px", display: "flex", flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.1)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)",
              background: "linear-gradient(135deg, rgba(212,175,55,0.08), transparent)",
              display: "flex", alignItems: "center", gap: "10px", flexShrink: 0,
            }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #D4AF37, #B8972E)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Sparkles size={15} color="#000" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: "14px" }}>KASH</div>
                <div style={{ color: "#666", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {lang === "DE" ? "Sales & Support · Online" : "Sales & Support · Online"}
                </div>
              </div>
              {/* TICKET BUTTON — always visible */}
              <button
                onClick={() => setShowTicketModal(true)}
                style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "5px 10px", borderRadius: "6px",
                  background: "rgba(212,175,55,0.12)",
                  border: "1px solid rgba(212,175,55,0.35)",
                  color: "#D4AF37", fontSize: "11px", fontWeight: 600,
                  cursor: "pointer", flexShrink: 0, transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(212,175,55,0.22)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(212,175,55,0.12)"; }}
              >
                <Ticket size={11} />
                Ticket
              </button>
              {messages.length > 0 && (
                <button onClick={reset} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#555", padding: "4px", display: "flex",
                }} title="Clear chat">
                  <Trash2 size={13} />
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#555", padding: "4px", display: "flex",
              }}>
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {messages.length === 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {/* Greeting */}
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <div style={{
                      width: "24px", height: "24px", borderRadius: "50%", flexShrink: 0,
                      background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Sparkles size={11} color="#D4AF37" />
                    </div>
                    <div style={{
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "10px", borderTopLeftRadius: "2px",
                      padding: "10px 13px", fontSize: "13px", color: "#d4d4d4", lineHeight: 1.5,
                      maxWidth: "calc(100% - 36px)",
                    }}>
                      {lang === "DE"
                        ? "Willkommen bei Kickstarcash.Club ✦ Ich bin KASH. Wie kann ich dir helfen?"
                        : "Welcome to Kickstarcash.Club ✦ I'm KASH. How can I help you?"}
                    </div>
                  </div>

                  {/* Ticket Banner */}
                  <button
                    onClick={() => setShowTicketModal(true)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: "10px",
                      padding: "10px 14px", marginTop: "4px",
                      background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.2)",
                      borderRadius: "10px", cursor: "pointer", transition: "all 0.15s", textAlign: "left",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(212,175,55,0.13)"; e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(212,175,55,0.07)"; e.currentTarget.style.borderColor = "rgba(212,175,55,0.2)"; }}
                  >
                    <Ticket size={16} color="#D4AF37" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ color: "#D4AF37", fontWeight: 600, fontSize: "12px" }}>
                        {lang === "DE" ? "Mit einem Menschen verbinden" : "Connect with a human"}
                      </div>
                      <div style={{ color: "#888", fontSize: "10px", marginTop: "1px" }}>
                        {lang === "DE" ? "Support-Ticket erstellen — wir melden uns persönlich" : "Create a ticket — we'll reach out personally"}
                      </div>
                    </div>
                  </button>

                  {/* Suggestions */}
                  <div style={{ marginTop: "4px" }}>
                    <p style={{ color: "#444", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                      {lang === "DE" ? "Häufige Fragen" : "Quick questions"}
                    </p>
                    {suggestions.map((s, i) => (
                      <button key={i} onClick={() => send(s)} style={{
                        width: "100%", textAlign: "left", padding: "8px 12px", marginBottom: "5px",
                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "8px", color: "#888", fontSize: "12px", cursor: "pointer",
                        transition: "all 0.15s", display: "block",
                      }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)"; e.currentTarget.style.color = "#ccc"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#888"; }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  {m.role === "assistant" && (
                    <div style={{
                      width: "24px", height: "24px", borderRadius: "50%", flexShrink: 0,
                      background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center", marginTop: "2px",
                    }}>
                      <Sparkles size={11} color="#D4AF37" />
                    </div>
                  )}
                  <div style={{
                    maxWidth: "80%", padding: "10px 13px", fontSize: "13px", lineHeight: 1.5,
                    borderRadius: "10px", whiteSpace: "pre-wrap",
                    ...(m.role === "user" ? {
                      background: "linear-gradient(135deg, #D4AF37, #C49B2D)",
                      color: "#000", fontWeight: 500, borderBottomRightRadius: "2px",
                    } : {
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                      color: "#d4d4d4", borderTopLeftRadius: "2px",
                    }),
                  }}>
                    {m.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <div style={{
                    width: "24px", height: "24px", borderRadius: "50%", flexShrink: 0,
                    background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Sparkles size={11} color="#D4AF37" />
                  </div>
                  <div style={{
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px", borderTopLeftRadius: "2px", padding: "10px 14px",
                    display: "flex", gap: "4px", alignItems: "center",
                  }}>
                    {[0, 1, 2].map((j) => (
                      <motion.div key={j} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#D4AF37" }}
                        animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity, delay: j * 0.2 }} />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "flex", gap: "8px", flexShrink: 0,
            }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder={lang === "DE" ? "Frage stellen…" : "Ask a question…"}
                style={{
                  flex: 1, background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
                  padding: "9px 12px", color: "#fff", fontSize: "13px", outline: "none",
                }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                style={{
                  width: "36px", height: "36px", borderRadius: "8px", flexShrink: 0,
                  background: input.trim() && !loading ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${input.trim() && !loading ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.1)"}`,
                  cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {loading ? <Loader2 size={14} color="#D4AF37" className="animate-spin" /> : <Send size={14} color={input.trim() ? "#D4AF37" : "#444"} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

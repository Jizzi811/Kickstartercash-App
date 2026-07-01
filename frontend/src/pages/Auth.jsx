import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BrainCircuit, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { BRANDMIND } from "@/brandmind";

const C = BRANDMIND.colors;

// A gently pulsing brain mark — the "thinking" whimsy of Brandmind.
function BrainPulse() {
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className="absolute rounded-full"
        style={{ width: 96, height: 96, background: C.glow, filter: "blur(24px)" }}
        animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: `${C.primary}22`, border: `1px solid ${C.primary}55` }}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <BrainCircuit size={30} style={{ color: C.primary }} />
      </motion.div>
    </div>
  );
}

export default function Auth() {
  const { lang, login, register } = useApp();
  const navigate = useNavigate();
  const isDE = lang === "DE";
  const T = (de, en) => (isDE ? de : en);

  const [mode, setMode] = useState("register"); // 'register' | 'login'
  const [form, setForm] = useState({ name: "", company: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Playful, on-brand loading lines.
  const thinkingLine = useMemo(
    () =>
      mode === "register"
        ? T("Das Gehirn wird geboren…", "Growing the brain…")
        : T("Das Gehirn erinnert sich…", "The brain remembers you…"),
    [mode, lang] // eslint-disable-line
  );

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError(T("Passwort braucht mindestens 8 Zeichen.", "Password needs at least 8 characters."));
      return;
    }
    setLoading(true);
    try {
      if (mode === "register") {
        await register({ email: form.email, password: form.password, name: form.name, company: form.company });
      } else {
        await login({ email: form.email, password: form.password });
      }
      navigate("/brand-brain");
    } catch (err) {
      setError(err?.response?.data?.detail || T("Etwas ist schiefgelaufen.", "Something went wrong."));
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-sm text-white " +
    "placeholder:text-zinc-600 focus:outline-none focus:border-[#7C3AED]/60 focus:bg-white/[0.05] transition-all";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: C.base }}
    >
      {/* ambient brand glow */}
      <motion.div
        className="absolute -top-1/3 left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
        style={{ width: 700, height: 700, background: C.glow, filter: "blur(120px)", opacity: 0.25 }}
        animate={{ opacity: [0.18, 0.3, 0.18] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <BrainPulse />
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white">{BRANDMIND.name}</h1>
          <p className="mt-1 text-sm" style={{ color: C.primary }}>
            {BRANDMIND.tagline[lang] || BRANDMIND.tagline.DE}
          </p>
          <p className="mt-2 text-[13px] text-zinc-500 max-w-xs">
            {BRANDMIND.subline[lang] || BRANDMIND.subline.DE}
          </p>
        </div>

        {/* mode switch */}
        <div className="flex p-1 mb-6 rounded-lg bg-white/[0.03] border border-white/8">
          {[
            { id: "register", label: T("Registrieren", "Sign up") },
            { id: "login", label: T("Anmelden", "Log in") },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); setError(""); }}
              className="relative flex-1 py-2 text-sm font-medium rounded-md transition-colors"
              style={{ color: mode === m.id ? "#fff" : "#71717a" }}
            >
              {mode === m.id && (
                <motion.div
                  layoutId="authTab"
                  className="absolute inset-0 rounded-md"
                  style={{ background: C.primary, border: `1px solid ${C.primary}` }}
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">{m.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          <AnimatePresence initial={false}>
            {mode === "register" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                <input
                  className={inputCls}
                  placeholder={T("Dein Name", "Your name")}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                />
                <input
                  className={inputCls}
                  placeholder={T("Firmenname", "Company name")}
                  value={form.company}
                  onChange={(e) => set("company", e.target.value)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <input
            className={inputCls}
            type="email"
            placeholder={T("E-Mail", "Email")}
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            required
            autoComplete="email"
          />
          <input
            className={inputCls}
            type="password"
            placeholder={T("Passwort (min. 8 Zeichen)", "Password (min. 8 chars)")}
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            required
            autoComplete={mode === "register" ? "new-password" : "current-password"}
          />

          {error && (
            <motion.p
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: [0, -5, 5, -3, 3, 0] }}
              className="text-sm text-red-400"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.015 }}
            whileTap={{ scale: 0.985 }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-70 transition-colors"
            style={{ background: C.primary, boxShadow: `0 8px 30px ${C.glow}` }}
          >
            {loading ? (
              <>
                <Loader2 size={17} className="animate-spin" /> {thinkingLine}
              </>
            ) : (
              <>
                {mode === "register" ? (
                  <>
                    <Sparkles size={17} /> {T("Brandmind starten", "Start Brandmind")}
                  </>
                ) : (
                  <>
                    {T("Weiter", "Continue")} <ArrowRight size={17} />
                  </>
                )}
              </>
            )}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-600">
          {mode === "register"
            ? T("Kostenlos starten · keine Kreditkarte nötig", "Start free · no credit card")
            : T("Willkommen zurück", "Welcome back")}
        </p>
      </motion.div>
    </div>
  );
}

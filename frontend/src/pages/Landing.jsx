import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowRight, Sparkles, Check, ShieldCheck, Rocket,
} from "lucide-react";
import { API, useApp } from "@/context/AppContext";
import { BRANDMIND } from "@/brandmind";
import QuantumOrb from "@/components/landing/QuantumOrb";
import StatusBadge from "@/components/StatusBadge";
import { STEPS, FEATURES, BENEFITS, AUDIENCES, OUTPUT_SAMPLES } from "@/pages/landingContent";

const C = BRANDMIND.colors;

// A little burst of sparks — the brain "sparking an idea" when you tap the logo.
function SparkBurst({ triggerKey }) {
  if (!triggerKey) return null;
  const sparks = Array.from({ length: 8 });
  return (
    <AnimatePresence>
      <motion.div key={triggerKey} className="absolute inset-0 pointer-events-none">
        {sparks.map((_, i) => {
          const angle = (i / sparks.length) * Math.PI * 2;
          return (
            <motion.span
              key={i}
              className="absolute rounded-full"
              style={{ width: 4, height: 4, left: "50%", top: "50%", background: C.primary, boxShadow: `0 0 6px ${C.primary}` }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: Math.cos(angle) * 28, y: Math.sin(angle) * 28, opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            />
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}

function Glow({ size = 900 }) {
  return (
    <motion.div
      className="absolute -top-1/4 left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
      style={{ width: size, height: size, background: C.glow, filter: "blur(140px)", opacity: 0.22 }}
      animate={{ opacity: [0.16, 0.28, 0.16] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export default function Landing() {
  const { lang, authReady, isAuthenticated } = useApp();
  const navigate = useNavigate();
  const isDE = lang === "DE";
  const T = (de, en) => (isDE ? de : en);
  const [activeAgent, setActiveAgent] = useState(FEATURES[3].id);
  const [sparkKey, setSparkKey] = useState(0);
  const [earlyAccessForm, setEarlyAccessForm] = useState({
    name: "", email: "", company_or_project: "", audience_status: "",
    marketing_challenge: "", privacy_consent: false, website: "",
  });
  const [earlyAccessState, setEarlyAccessState] = useState({ loading: false, success: "", error: "" });

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.base }}>
        <div className="mx-auto w-10 h-10 rounded-full animate-pulse" style={{ background: C.glow, filter: "blur(4px)" }} />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/app" replace />;

  const requestEarlyAccess = () => {
    document.getElementById("early-access-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const login = () => navigate("/auth");
  const setEarlyAccessField = (key, value) => setEarlyAccessForm((form) => ({ ...form, [key]: value }));
  const submitEarlyAccess = async (event) => {
    event.preventDefault();
    if (earlyAccessState.loading || earlyAccessState.success) return;
    setEarlyAccessState({ loading: false, success: "", error: "" });
    if (!earlyAccessForm.name.trim() || !earlyAccessForm.email.trim() || !earlyAccessForm.audience_status || !earlyAccessForm.marketing_challenge.trim()) {
      setEarlyAccessState({ loading: false, success: "", error: T("Bitte fülle alle Pflichtfelder aus.", "Please complete all required fields.") });
      return;
    }
    if (!earlyAccessForm.privacy_consent) {
      setEarlyAccessState({ loading: false, success: "", error: T("Bitte stimme der Datenschutzerklärung zu.", "Please agree to the privacy notice.") });
      return;
    }
    setEarlyAccessState({ loading: true, success: "", error: "" });
    try {
      const res = await axios.post(`${API}/early-access`, { ...earlyAccessForm, locale: lang, source: "landing_page" });
      setEarlyAccessState({ loading: false, success: res.data?.message || T("Danke, deine Anfrage wurde erfasst.", "Thank you, your request has been received."), error: "" });
    } catch {
      setEarlyAccessState({ loading: false, success: "", error: T("Die Anfrage konnte nicht gesendet werden. Bitte prüfe deine Angaben und versuche es erneut.", "The request could not be sent. Please check your details and try again.") });
    }
  };
  const activeFeature = FEATURES.find((f) => f.id === activeAgent) || FEATURES[0];
  const ActiveIcon = activeFeature.icon;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: C.base, color: "#fff" }}>
      {/* Nav */}
      <header className="relative z-20 flex items-center justify-between px-6 md:px-10 py-5 max-w-7xl mx-auto">
        <div className="relative flex items-center">
          <img
            src="/brand/brandmind-logo.png"
            alt={BRANDMIND.name}
            className="h-7 w-auto cursor-pointer select-none"
            onClick={() => setSparkKey((k) => k + 1)}
          />
          <SparkBurst triggerKey={sparkKey} />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={login} className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-2">
            {T("Anmelden", "Log in")}
          </button>
          <button
            onClick={requestEarlyAccess}
            className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-transform hover:scale-[1.02]"
            style={{ background: C.primary, boxShadow: `0 6px 24px ${C.glow}` }}
          >
            {T("Early Access anfragen", "Request early access")}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-6 md:px-10 pt-10 md:pt-16 pb-20 max-w-7xl mx-auto">
        <Glow />
        <div className="relative grid grid-cols-1 lg:grid-cols-[1.05fr,0.95fr] items-center gap-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center lg:text-left flex flex-col items-center lg:items-start"
          >
            <div
              className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: `${C.primary}18`, border: `1px solid ${C.primary}40`, color: C.primary }}
            >
              <Sparkles size={13} /> {T("Angetrieben von Quantum, deinem KI-Orchestrator", "Powered by Quantum, your AI orchestrator")}
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.03]">
              {T("Das Betriebssystem für deine Marke.", "The operating system for your brand.")}
            </h1>
            <p className="mt-6 text-lg md:text-xl text-zinc-400 max-w-xl leading-relaxed">
              {T(
                "Brandmind verbindet Strategie, Content, Design, Automatisierung und KI-Agenten in einem System — statt Tool-Chaos, Freelancer-Chaos und Abstimmungs-Chaos.",
                "Brandmind connects strategy, content, design, automation and AI agents in one system — instead of tool chaos, freelancer chaos and endless back-and-forth."
              )}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={requestEarlyAccess}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-white"
                style={{ background: C.primary, boxShadow: `0 10px 40px ${C.glow}` }}
              >
                {T("Early Access anfragen", "Request early access")} <ArrowRight size={18} />
              </motion.button>
              <button
                onClick={login}
                className="px-7 py-3.5 rounded-xl text-base font-medium text-zinc-300 border border-white/10 hover:bg-white/[0.04] transition-colors"
              >
                {T("Ich habe bereits ein Konto", "I already have an account")}
              </button>
            </div>
            <div className="mt-7 flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5"><Check size={13} style={{ color: C.primary }} /> {T("Transparentes Early-Access-Angebot", "Transparent early-access offer")}</span>
              <span className="flex items-center gap-1.5"><Check size={13} style={{ color: C.primary }} /> {T("Erste Workflows als Beta gekennzeichnet", "First workflows clearly marked beta")}</span>
              <span className="flex items-center gap-1.5"><Check size={13} style={{ color: C.primary }} /> {T("Markenwissen als Kontext", "Brand knowledge as context")}</span>
              <span className="flex items-center gap-1.5"><Check size={13} style={{ color: C.primary }} /> {T("Für Gründer, Teams & Agenturen", "For founders, teams & agencies")}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="flex items-center justify-center mx-auto lg:mx-0 relative"
          >
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ background: C.glow, filter: "blur(90px)", opacity: 0.5 }}
            />
            <motion.img
              src="/brand/hero-brain.jpg"
              alt="Brandmind — die KI-Zentrale deiner Marke"
              className="relative w-full max-w-md lg:max-w-lg"
              style={{
                mixBlendMode: "screen",
                WebkitMaskImage: "radial-gradient(ellipse 62% 68% at 50% 46%, black 55%, transparent 88%)",
                maskImage: "radial-gradient(ellipse 62% 68% at 50% 46%, black 55%, transparent 88%)",
              }}
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </div>
      </section>

      {/* Product sneak-peek */}
      <section className="relative px-6 md:px-10 py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl md:text-3xl font-bold">{T("Von der Idee zu prüfbaren Marken-Outputs.", "From idea to review-ready brand outputs.")}</h2>
            <p className="mt-3 text-zinc-400">
              {T("Ein Ausschnitt dessen, was dein KI-Team in Minuten liefert.", "A slice of what your AI team ships in minutes.")}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {OUTPUT_SAMPLES.map((o, i) => {
              const Icon = o.icon;
              return (
                <motion.div
                  key={o.tag.DE}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                  className="rounded-2xl p-5 bg-white/[0.03] border border-white/8"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${C.primary}18`, border: `1px solid ${C.primary}40` }}>
                      <Icon size={15} style={{ color: C.primary }} />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{o.tag[lang] || o.tag.DE}</span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{isDE ? o.de : o.en}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative px-6 md:px-10 py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-14">
            {T("In drei Schritten zum eigenen KI-Marketing-Team", "Your AI marketing team in three steps")}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl p-6 bg-white/[0.03] border border-white/8">
                <span className="text-3xl font-extrabold" style={{ color: C.primary }}>{s.n}</span>
                <h3 className="mt-4 text-lg font-semibold">{isDE ? s.de.title : s.en.title}</h3>
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{isDE ? s.de.body : s.en.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quantum + agent system */}
      <section className="relative px-6 md:px-10 py-20 border-t border-white/5">
        <Glow size={700} />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl md:text-3xl font-bold">{T("Quantum orchestriert dein gesamtes KI-Team", "Quantum orchestrates your entire AI team")}</h2>
            <p className="mt-3 text-zinc-400">
              {T("Jeder Agent kennt deine Marke und arbeitet im gleichen Ton, Design und Stil. Fahr über ein Studio, um zu sehen, was es übernimmt.", "Every agent knows your brand and works in the same tone, design and style. Hover a studio to see what it takes off your plate.")}
            </p>
          </div>

          <div className="grid lg:grid-cols-[0.9fr,1.1fr] items-center gap-10">
            <div className="flex items-center justify-center">
              <QuantumOrb
                size={420}
                agents={FEATURES}
                interactive
                activeId={activeAgent}
                onAgentHover={(id) => id && setActiveAgent(id)}
              />
            </div>

            <div>
              <motion.div
                key={activeFeature.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl p-6 bg-white/[0.03] border border-white/8 mb-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${C.primary}18`, border: `1px solid ${C.primary}40` }}>
                    <ActiveIcon size={18} style={{ color: C.primary }} />
                  </div>
                  <h3 className="font-semibold text-lg">{isDE ? activeFeature.de[0] : activeFeature.en[0]}</h3>
                  {activeFeature.status && <StatusBadge status={activeFeature.status} lang={lang} />}
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">{isDE ? activeFeature.de[1] : activeFeature.en[1]}</p>
              </motion.div>

              <div className="flex flex-wrap gap-2">
                {FEATURES.map((f) => (
                  <button
                    key={f.id}
                    onMouseEnter={() => setActiveAgent(f.id)}
                    onClick={() => setActiveAgent(f.id)}
                    className="px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors"
                    style={{
                      color: activeAgent === f.id ? "#fff" : "#a1a1aa",
                      background: activeAgent === f.id ? C.primary : "rgba(255,255,255,0.03)",
                      borderColor: activeAgent === f.id ? C.primary : "rgba(255,255,255,0.1)",
                    }}
                  >
                    <span className="inline-flex items-center gap-2">{isDE ? f.de[0] : f.en[0]} {f.status && <StatusBadge status={f.status} lang={lang} />}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="relative px-6 md:px-10 py-20 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            {T("Warum Teams zu Brandmind wechseln", "Why teams switch to Brandmind")}
          </h2>
          <div className="grid md:grid-cols-2 gap-x-10 gap-y-5">
            {BENEFITS[lang || "DE"].map((b) => (
              <div key={b} className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: `${C.primary}22` }}>
                  <Check size={12} style={{ color: C.primary }} />
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="relative px-6 md:px-10 py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-14">{T("Für wen ist Brandmind?", "Who is Brandmind for?")}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {AUDIENCES.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.de.title} className="rounded-2xl p-6 bg-white/[0.03] border border-white/8 text-center">
                  <div className="mx-auto w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `${C.primary}18`, border: `1px solid ${C.primary}40` }}>
                    <Icon size={19} style={{ color: C.primary }} />
                  </div>
                  <h3 className="font-semibold">{isDE ? a.de.title : a.en.title}</h3>
                  <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{isDE ? a.de.body : a.en.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Early Access */}
      <section id="early-access-form" className="relative scroll-mt-6 px-6 md:px-10 py-20 border-t border-white/5">
        <div className="max-w-4xl mx-auto rounded-3xl p-8 md:p-10 bg-white/[0.03] border border-white/8">
          <div className="text-center">
            <StatusBadge status="beta" lang={lang} className="mb-5" />
            <h2 className="text-2xl md:text-3xl font-bold">
              {T("Werde Teil der ersten Brandmind-Pioniere", "Become one of the first Brandmind pioneers")}
            </h2>
            <p className="mt-4 text-zinc-400 leading-relaxed max-w-2xl mx-auto">
              {T("Teste Brandmind frühzeitig, teile dein Feedback und hilf mit, die KI-Zentrale für moderne Marken weiterzuentwickeln.", "Test Brandmind early, share your feedback and help evolve the AI command center for modern brands.")}
            </p>
          </div>

          <form onSubmit={submitEarlyAccess} className="mt-8 grid gap-4 text-left" noValidate>
            <input aria-hidden="true" tabIndex="-1" autoComplete="off" className="hidden" value={earlyAccessForm.website} onChange={(e) => setEarlyAccessField("website", e.target.value)} />
            <div className="grid md:grid-cols-2 gap-4">
              <label className="grid gap-2 text-sm text-zinc-300">
                {T("Name *", "Name *")}
                <input required maxLength="120" value={earlyAccessForm.name} onChange={(e) => setEarlyAccessField("name", e.target.value)} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-[#7C3AED]" />
              </label>
              <label className="grid gap-2 text-sm text-zinc-300">
                {T("E-Mail-Adresse *", "Email address *")}
                <input required type="email" maxLength="254" value={earlyAccessForm.email} onChange={(e) => setEarlyAccessField("email", e.target.value)} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-[#7C3AED]" />
              </label>
            </div>
            <label className="grid gap-2 text-sm text-zinc-300">
              {T("Unternehmen oder Projekt", "Company or project")}
              <input maxLength="160" value={earlyAccessForm.company_or_project} onChange={(e) => setEarlyAccessField("company_or_project", e.target.value)} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-[#7C3AED]" />
            </label>
            <label className="grid gap-2 text-sm text-zinc-300">
              {T("Aktueller Status *", "Current status *")}
              <select required value={earlyAccessForm.audience_status} onChange={(e) => setEarlyAccessField("audience_status", e.target.value)} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-[#7C3AED]">
                <option value="">{T("Bitte auswählen", "Please choose")}</option>
                <option value="founding">{T("Ich gründe gerade", "I am currently founding")}</option>
                <option value="self_employed">{T("Ich bin selbstständig", "I am self-employed")}</option>
                <option value="company">{T("Ich arbeite in einem Unternehmen", "I work at a company")}</option>
                <option value="agency">{T("Ich führe eine Agentur", "I run an agency")}</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm text-zinc-300">
              {T("Größte Marketing-Herausforderung *", "Biggest marketing challenge *")}
              <textarea required maxLength="1200" rows="4" value={earlyAccessForm.marketing_challenge} onChange={(e) => setEarlyAccessField("marketing_challenge", e.target.value)} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-[#7C3AED]" />
            </label>
            <label className="flex gap-3 text-sm leading-6 text-zinc-300">
              <input type="checkbox" checked={earlyAccessForm.privacy_consent} onChange={(e) => setEarlyAccessField("privacy_consent", e.target.checked)} className="mt-1 h-4 w-4" />
              <span>{T("Ich stimme der Datenschutzerklärung zu. *", "I agree to the privacy notice. *")} <Link className="text-violet-300 underline" to={isDE ? "/datenschutz" : "/privacy"}>{T("Datenschutz öffnen", "Open privacy notice")}</Link></span>
            </label>
            {earlyAccessState.error && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{earlyAccessState.error}</p>}
            {earlyAccessState.success && <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">{earlyAccessState.success}</p>}
            <button type="submit" disabled={earlyAccessState.loading || !!earlyAccessState.success} className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white disabled:opacity-60" style={{ background: C.primary, boxShadow: `0 10px 40px ${C.glow}` }}>
              {earlyAccessState.loading ? T("Wird gesendet…", "Sending…") : T("Early Access anfragen", "Request early access")} <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative px-6 md:px-10 py-24 border-t border-white/5 text-center">
        <Glow />
        <div className="relative max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4 text-xs font-medium" style={{ color: C.primary }}>
            <Rocket size={14} /> {T("Bereit, wenn du es bist", "Ready when you are")}
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {T("Bereit für Early Access?", "Ready for early access?")}
          </h2>
          <p className="mt-4 text-zinc-400">
            {T("Fordere Zugang an und hilf uns, Brandmind produktreif weiterzuentwickeln.", "Request access and help us evolve Brandmind toward product readiness.")}
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={requestEarlyAccess}
            className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white"
            style={{ background: C.primary, boxShadow: `0 10px 40px ${C.glow}` }}
          >
            {T("Early Access anfragen", "Request early access")} <ArrowRight size={18} />
          </motion.button>
          <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-zinc-600">
            <ShieldCheck size={13} /> {T("Beta-Funktionen werden transparent gekennzeichnet", "Beta features are marked transparently")}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative px-6 md:px-10 py-8 border-t border-white/5 overflow-hidden">
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
          style={{
            bottom: -260,
            width: "150%",
            maxWidth: 1400,
            height: 320,
            background: `radial-gradient(ellipse at center, ${C.primary}66 0%, ${C.primary}22 40%, transparent 72%)`,
            filter: "blur(50px)",
          }}
          animate={{ opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
          <div className="flex items-center">
            <img src="/brand/brandmind-logo.png" alt={BRANDMIND.name} className="h-5 w-auto opacity-80" />
          </div>
          <span>© {new Date().getFullYear()} {BRANDMIND.name}</span>
          <div className="flex items-center gap-4">
            <Link to="/impressum" className="hover:text-zinc-300 transition-colors">{T("Impressum", "Imprint")}</Link>
            <Link to={isDE ? "/datenschutz" : "/privacy"} className="hover:text-zinc-300 transition-colors">{T("Datenschutz", "Privacy")}</Link>
            <Link to={isDE ? "/kontakt" : "/contact"} className="hover:text-zinc-300 transition-colors">{T("Kontakt", "Contact")}</Link>
            <Link to="/auth" className="hover:text-zinc-300 transition-colors">{T("Anmelden", "Log in")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

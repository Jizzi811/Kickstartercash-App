import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight, Sparkles, Check, BrainCircuit, Star, Quote, ShieldCheck, Rocket,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { BRANDMIND } from "@/brandmind";
import QuantumOrb from "@/components/landing/QuantumOrb";
import { STEPS, FEATURES, BENEFITS, AUDIENCES, OUTPUT_SAMPLES, TESTIMONIALS } from "@/pages/landingContent";

const C = BRANDMIND.colors;

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

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.base }}>
        <div className="mx-auto w-10 h-10 rounded-full animate-pulse" style={{ background: C.glow, filter: "blur(4px)" }} />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/app" replace />;

  const startFree = () => navigate("/auth");
  const login = () => navigate("/auth");
  const activeFeature = FEATURES.find((f) => f.id === activeAgent) || FEATURES[0];
  const ActiveIcon = activeFeature.icon;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: C.base, color: "#fff" }}>
      {/* Nav */}
      <header className="relative z-20 flex items-center justify-between px-6 md:px-10 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <BrainCircuit size={22} style={{ color: C.primary }} />
          <span className="font-bold tracking-tight text-lg">{BRANDMIND.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={login} className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-2">
            {T("Anmelden", "Log in")}
          </button>
          <button
            onClick={startFree}
            className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-transform hover:scale-[1.02]"
            style={{ background: C.primary, boxShadow: `0 6px 24px ${C.glow}` }}
          >
            {T("Kostenlos starten", "Start free")}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-6 md:px-10 pt-10 md:pt-16 pb-20 max-w-7xl mx-auto">
        <Glow />
        <div className="relative grid lg:grid-cols-[1.05fr,0.95fr] items-center gap-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
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
            <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startFree}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-white"
                style={{ background: C.primary, boxShadow: `0 10px 40px ${C.glow}` }}
              >
                {T("Kostenlos starten", "Start free")} <ArrowRight size={18} />
              </motion.button>
              <button
                onClick={login}
                className="px-7 py-3.5 rounded-xl text-base font-medium text-zinc-300 border border-white/10 hover:bg-white/[0.04] transition-colors"
              >
                {T("Ich habe bereits ein Konto", "I already have an account")}
              </button>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5"><Check size={13} style={{ color: C.primary }} /> {T("Ohne Kreditkarte", "No credit card")}</span>
              <span className="flex items-center gap-1.5"><Check size={13} style={{ color: C.primary }} /> {T("In Minuten startklar", "Ready in minutes")}</span>
              <span className="flex items-center gap-1.5"><Check size={13} style={{ color: C.primary }} /> {T("Markenkonform auf jedem Kanal", "On-brand on every channel")}</span>
              <span className="flex items-center gap-1.5"><Check size={13} style={{ color: C.primary }} /> {T("Für Gründer, Teams & Agenturen", "For founders, teams & agencies")}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="flex items-center justify-center"
          >
            <QuantumOrb size={380} agents={FEATURES.slice(0, 6)} />
          </motion.div>
        </div>
      </section>

      {/* Product sneak-peek */}
      <section className="relative px-6 md:px-10 py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl md:text-3xl font-bold">{T("Nicht nur denken — produzieren.", "Not just thinking — producing.")}</h2>
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
                    {isDE ? f.de[0] : f.en[0]}
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

      {/* Testimonials */}
      <section className="relative px-6 md:px-10 py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-1 mb-10">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={16} fill={C.primary} style={{ color: C.primary }} />
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl p-6 bg-white/[0.03] border border-white/8">
                <Quote size={20} style={{ color: C.primary }} className="mb-3 opacity-70" />
                <p className="text-sm text-zinc-300 leading-relaxed">{t.q[lang] || t.q.DE}</p>
                <div className="mt-5 text-xs">
                  <span className="font-semibold text-white">{t.name}</span>
                  <span className="text-zinc-500"> · {t.role[lang] || t.role.DE}</span>
                </div>
              </div>
            ))}
          </div>
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
            {T("Bereit für dein KI-Marketing-Team?", "Ready for your AI marketing team?")}
          </h2>
          <p className="mt-4 text-zinc-400">
            {T("Starte in Minuten — ohne Setup-Aufwand.", "Get started in minutes — no setup required.")}
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startFree}
            className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white"
            style={{ background: C.primary, boxShadow: `0 10px 40px ${C.glow}` }}
          >
            {T("Kostenlos starten", "Start free")} <ArrowRight size={18} />
          </motion.button>
          <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-zinc-600">
            <ShieldCheck size={13} /> {T("Markenkonformität automatisch geprüft", "Automatic brand-consistency checks")}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative px-6 md:px-10 py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
          <div className="flex items-center gap-2">
            <BrainCircuit size={16} style={{ color: C.primary }} />
            <span>{BRANDMIND.name}</span>
          </div>
          <span>© {new Date().getFullYear()} {BRANDMIND.name}</span>
          <Link to="/auth" className="hover:text-zinc-300 transition-colors">
            {T("Anmelden", "Log in")}
          </Link>
        </div>
      </footer>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { useApp, API } from "@/context/AppContext";
import {
  ArrowRight, Sparkles, Bot, Palette, Film, Smartphone,
  Globe, BarChart2, Zap, Database, Wrench, MessageSquare,
  TrendingUp, Users, FileText, Cpu, Crown, ChevronRight,
  Activity, Clock, Layers, BrainCircuit,
} from "lucide-react";


/* ─── animation variants ─────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

/* ─── KPI data ───────────────────────────────────────────────────── */
const KPI_CARDS = [
  {
    icon: Bot,
    labelDE: "KI-Agenten",
    labelEN: "AI Agents",
    value: "17",
    subDE: "Aktiv & einsatzbereit",
    subEN: "Active & ready",
    color: "#7C3AED",
    trend: "+2",
    sparkPath: "M0,20 C10,18 20,8 30,10 C40,12 50,4 60,6 C70,8 80,2 90,0",
  },
  {
    icon: Cpu,
    labelDE: "Generierte Assets",
    labelEN: "Generated Assets",
    value: "2.4K",
    subDE: "Diese Woche",
    subEN: "This week",
    color: "#C084FC",
    trend: "+18%",
    sparkPath: "M0,20 C15,16 25,12 40,8 C55,4 65,10 80,6 C85,4 88,2 90,0",
  },
  {
    icon: TrendingUp,
    labelDE: "Reichweite",
    labelEN: "Reach",
    value: "+38%",
    subDE: "Letzter Monat",
    subEN: "Last month",
    color: "#34D399",
    trend: "+38%",
    sparkPath: "M0,20 C10,17 20,14 35,10 C50,6 60,8 75,4 C82,2 87,1 90,0",
  },
  {
    icon: FileText,
    labelDE: "Projekte",
    labelEN: "Projects",
    value: "14",
    subDE: "In Bearbeitung",
    subEN: "In progress",
    color: "#F472B6",
    trend: "+3",
    sparkPath: "M0,18 C12,16 22,20 36,14 C50,8 62,12 76,6 C84,3 88,1 90,0",
  },
];

/* ─── quick actions ──────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  {
    to: "/brand-brain",
    icon: BrainCircuit,
    labelDE: "Brand Brain",
    labelEN: "Brand Brain",
    descDE: "Marke einrichten – Basis für alles",
    descEN: "Set up your brand – the base for all",
    color: "#7C3AED",
    featured: true,
  },
  {
    to: "/agents",
    icon: Bot,
    labelDE: "Agenten",
    labelEN: "Agents",
    descDE: "KI-Spezialisten starten",
    descEN: "Launch your AI specialists",
    color: "#7C3AED",
  },
  {
    to: "/design",
    icon: Palette,
    labelDE: "Design Studio",
    labelEN: "Design Studio",
    descDE: "GPT · Canva · Leonardo",
    descEN: "GPT · Canva · Leonardo",
    color: "#C084FC",
  },
  {
    to: "/video",
    icon: Film,
    labelDE: "Video Studio",
    labelEN: "Video Studio",
    descDE: "Veo 3 · Kling · Runway ML",
    descEN: "Veo 3 · Kling · Runway ML",
    color: "#F472B6",
  },
  {
    to: "/social",
    icon: Smartphone,
    labelDE: "Social Media",
    labelEN: "Social Media",
    descDE: "Posts · Reels · Strategie",
    descEN: "Posts · Reels · Strategy",
    color: "#7C3AED",
  },
  {
    to: "/seo",
    icon: Globe,
    labelDE: "SEO",
    labelEN: "SEO",
    descDE: "Keywords · Audit · Schema",
    descEN: "Keywords · Audit · Schema",
    color: "#34D399",
  },
  {
    to: "/analytics",
    icon: BarChart2,
    labelDE: "Analytics",
    labelEN: "Analytics",
    descDE: "KPIs · Reports · A/B-Tests",
    descEN: "KPIs · Reports · A/B Tests",
    color: "#A78BFA",
  },
  {
    to: "/automation",
    icon: Zap,
    labelDE: "Automationen",
    labelEN: "Automations",
    descDE: "n8n · Make · Zapier",
    descEN: "n8n · Make · Zapier",
    color: "#F87171",
  },
  {
    to: "/knowledge",
    icon: Database,
    labelDE: "Wissensdatenbank",
    labelEN: "Knowledge Base",
    descDE: "Produkte · FAQs · CI",
    descEN: "Products · FAQs · CI",
    color: "#60A5FA",
  },
  {
    to: "/builder",
    icon: Wrench,
    labelDE: "Eigene Agenten",
    labelEN: "Custom Agents",
    descDE: "Agenten-Builder & Vorlagen",
    descEN: "Agent builder & templates",
    color: "#FB923C",
  },
  {
    to: "/arena",
    icon: MessageSquare,
    labelDE: "Chat Arena",
    labelEN: "Chat Arena",
    descDE: "Modelle vergleichen",
    descEN: "Compare models",
    color: "#38BDF8",
  },
];

/* Activity feed is loaded live from /mission/overview – no fabricated entries. */

/* ─── tips data ──────────────────────────────────────────────────── */
const TIPS = [
  {
    titleDE: "Neuer Veo 3 Agent",
    titleEN: "New Veo 3 Agent",
    descDE: "Videos in Kinoqualität mit Google Veo 3 generieren.",
    descEN: "Generate cinema-quality videos with Google Veo 3.",
    badge: "NEW",
    color: "#F472B6",
  },
  {
    titleDE: "Wissensdatenbank",
    titleEN: "Knowledge Base",
    descDE: "Lade deine Marken-Assets hoch für bessere Ergebnisse.",
    descEN: "Upload your brand assets for better AI results.",
    badge: "TIP",
    color: "#60A5FA",
  },
  {
    titleDE: "Automatisierungen",
    titleEN: "Automations",
    descDE: "Verbinde n8n mit deinen KI-Agenten per Webhook.",
    descEN: "Connect n8n to your AI agents via webhook.",
    badge: "PRO",
    color: "#7C3AED",
  },
];

/* ─── shimmer keyframes injected once ───────────────────────────── */
const SHIMMER_CSS = `
@keyframes shimmer-border {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(0.7); }
}
@keyframes mesh-drift {
  0%   { transform: translateY(0px) translateX(0px); }
  50%  { transform: translateY(-8px) translateX(4px); }
  100% { transform: translateY(0px) translateX(0px); }
}
`;

/* ═══════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { lang, activeBrand, user } = useApp();
  const navigate = useNavigate();
  const firstName = (user?.name || user?.email?.split("@")[0] || "").split(" ")[0];
  const [hovered, setHovered] = useState(null);
  const [tick, setTick] = useState(0);
  const [stats, setStats] = useState(null);
  const [activityFeed, setActivityFeed] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    axios.get(`${API}/stats`).then(r => setStats(r.data)).catch(() => {});
    // Real activity from Mission Control – no fabricated feed entries.
    axios.get(`${API}/mission/overview`).then(r => setActivityFeed(r.data?.activity || [])).catch(() => setActivityFeed([]));
  }, []);

  const fmt = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n ?? 0);

  const liveKpis = stats ? [
    {
      icon: Bot,
      labelDE: "KI-Agenten",
      labelEN: "AI Agents",
      value: String(stats.agents),
      subDE: "Aktiv & einsatzbereit",
      subEN: "Active & ready",
      color: "#7C3AED",
      trend: stats.custom_agents > 0 ? `+${stats.custom_agents}` : "Live",
      sparkPath: "M0,20 C10,18 20,8 30,10 C40,12 50,4 60,6 C70,8 80,2 90,0",
    },
    {
      icon: Cpu,
      labelDE: "Generierte Assets",
      labelEN: "Generated Assets",
      value: fmt(stats.assets_this_week),
      subDE: "Diese Woche",
      subEN: "This week",
      color: "#C084FC",
      trend: stats.assets_growth_pct >= 0 ? `+${stats.assets_growth_pct}%` : `${stats.assets_growth_pct}%`,
      sparkPath: "M0,20 C15,16 25,12 40,8 C55,4 65,10 80,6 C85,4 88,2 90,0",
    },
    {
      icon: Users,
      labelDE: "Leads",
      labelEN: "Leads",
      value: fmt(stats.leads_qualified),
      subDE: "Qualifizierte Kontakte",
      subEN: "Qualified contacts",
      color: "#34D399",
      trend: stats.tickets_open > 0 ? `${stats.tickets_open} offen` : "Live",
      sparkPath: "M0,20 C10,17 20,14 35,10 C50,6 60,8 75,4 C82,2 87,1 90,0",
    },
    {
      icon: FileText,
      labelDE: "Gespräche",
      labelEN: "Sessions",
      value: fmt(stats.sessions_total),
      subDE: "KASH Chat-Sessions",
      subEN: "KASH chat sessions",
      color: "#F472B6",
      trend: `${stats.knowledge_docs} KB-Docs`,
      sparkPath: "M0,18 C12,16 22,20 36,14 C50,8 62,12 76,6 C84,3 88,1 90,0",
    },
  // While loading (or if stats are unavailable) show em-dashes – never invented numbers.
  ] : KPI_CARDS.map((c) => ({ ...c, value: "—", trend: "…" }));

  const greetDE = () => {
    const h = new Date().getHours();
    if (h < 12) return "Guten Morgen";
    if (h < 18) return "Guten Tag";
    return "Guten Abend";
  };

  return (
    <>
      {/* inject shimmer keyframes */}
      <style>{SHIMMER_CSS}</style>

      <div className="space-y-12 pb-8">

        {/* ══ HERO ════════════════════════════════════════════════════ */}
        <motion.section {...fadeUp(0)}>
          <div
            className="relative overflow-hidden rounded-sm"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.07) 0%, rgba(8,8,8,0) 55%, rgba(124,58,237,0.05) 100%)",
              border: "1px solid rgba(124,58,237,0.18)",
            }}
          >
            {/* SVG mesh grid background */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ animation: "mesh-drift 18s ease-in-out infinite", opacity: 1 }}
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="mesh" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
                  <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(124,58,237,0.03)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#mesh)" />
            </svg>

            {/* ambient glows */}
            <div className="absolute -top-28 -left-28 w-96 h-96 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)" }} />
            <div className="absolute -bottom-24 right-0 w-[28rem] h-[28rem] rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)" }} />

            <div className="relative px-7 md:px-12 py-11 md:py-16">
              {/* animated badge */}
              <div
                className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full mb-7 text-[10px] tracking-[0.22em] uppercase font-semibold"
                style={{
                  background: "rgba(124,58,237,0.08)",
                  border: "1px solid rgba(124,58,237,0.26)",
                  color: "#7C3AED",
                }}
              >
                {/* pulsing dot */}
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: "#7C3AED",
                    animation: "pulse-dot 2s ease-in-out infinite",
                  }}
                />
                {lang === "DE" ? "KI-Agentur System" : "AI Agency System"}
              </div>

              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-10">
                <div className="max-w-xl">
                  <h1
                    className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4"
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    <span
                      style={{
                        background: "linear-gradient(90deg, #fff 0%, #e8e8e8 40%, #fff 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {lang === "DE" ? greetDE() : "Welcome back"},
                    </span>{" "}
                    <span
                      style={{
                        background: "linear-gradient(90deg, #7C3AED 0%, #C4B5FD 45%, #6D28D9 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {firstName || (lang === "DE" ? "willkommen" : "there")}
                    </span>
                  </h1>
                  <p className="text-sm md:text-base text-zinc-400 leading-relaxed mb-8">
                    {lang === "DE"
                      ? "Deine spezialisierten KI-Agenten arbeiten für dich – mit echten Tools, deiner Wissensdatenbank und ohne Halluzinieren."
                      : "Your specialized AI agents work for you – with real tools, your knowledge base, and zero hallucinations."}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => navigate("/agents")}
                      className="inline-flex items-center gap-2.5 font-bold text-sm tracking-wide px-6 py-3 rounded-sm transition-all duration-200"
                      style={{ background: "#7C3AED", color: "#050505" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#C4B5FD"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#7C3AED"; }}
                    >
                      <Bot size={15} />
                      {lang === "DE" ? "Agenten starten" : "Launch Agents"}
                      <ArrowRight size={14} />
                    </button>
                    <button
                      onClick={() => navigate("/quantum")}
                      className="inline-flex items-center gap-2.5 text-sm px-6 py-3 rounded-sm transition-all duration-200"
                      style={{ border: "1px solid rgba(255,255,255,0.12)", color: "#a1a1aa" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)";
                        e.currentTarget.style.color = "#7C3AED";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                        e.currentTarget.style.color = "#a1a1aa";
                      }}
                    >
                      <Sparkles size={14} />
                      Quantum
                    </button>
                  </div>
                </div>

                {/* hero stats strip with vertical dividers */}
                <div className="flex gap-0 flex-wrap">
                  {[
                    { numDE: String(stats?.agents ?? "—"), numEN: String(stats?.agents ?? "—"), labelDE: "Agenten", labelEN: "Agents" },
                    { numDE: String(QUICK_ACTIONS.length), numEN: String(QUICK_ACTIONS.length), labelDE: "Module", labelEN: "Modules" },
                    { numDE: "∞", numEN: "∞", labelDE: "Möglichkeiten", labelEN: "Possibilities" },
                  ].map((s, idx) => (
                    <div key={s.labelDE} className="flex items-stretch">
                      {idx > 0 && (
                        <div className="w-px mx-6 self-stretch" style={{ background: "rgba(124,58,237,0.15)" }} />
                      )}
                      <div className="text-center">
                        <div
                          className="text-2xl md:text-3xl font-bold"
                          style={{
                            fontFamily: "'Sora', sans-serif",
                            background: "linear-gradient(180deg, #C4B5FD 0%, #7C3AED 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                          }}
                        >
                          {s.numDE}
                        </div>
                        <div className="text-[11px] text-zinc-600 uppercase tracking-widest mt-1">
                          {lang === "DE" ? s.labelDE : s.labelEN}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ══ KPI CARDS ═══════════════════════════════════════════════ */}
        <motion.section {...fadeUp(0.08)}>
          {/* section header */}
          <div className="flex items-center gap-4 mb-6">
            <h2
              className="text-base font-semibold text-zinc-300 whitespace-nowrap"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {lang === "DE" ? "Übersicht" : "Overview"}
            </h2>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, rgba(124,58,237,0.3), transparent)" }} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {liveKpis.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="relative rounded-sm p-5 overflow-hidden group"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    /* animated shimmer border via background-image trick */
                    padding: "1px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.querySelector(".kpi-inner").style.boxShadow = `0 0 32px ${card.color}18`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.querySelector(".kpi-inner").style.boxShadow = "none";
                  }}
                >
                  {/* shimmer border wrapper */}
                  <div
                    className="absolute inset-0 rounded-sm pointer-events-none"
                    style={{
                      background: `linear-gradient(110deg, rgba(255,255,255,0.06) 0%, ${card.color}55 40%, rgba(255,255,255,0.06) 60%, ${card.color}30 100%)`,
                      backgroundSize: "200% 100%",
                      animation: "shimmer-border 4s linear infinite",
                      animationDelay: `${i * 0.7}s`,
                    }}
                  />
                  <div
                    className="kpi-inner relative rounded-sm p-5 h-full transition-all duration-300"
                    style={{ background: "rgba(10,10,10,0.92)" }}
                  >
                    <div className="flex items-start justify-between mb-5">
                      {/* gem-shaped icon */}
                      <div
                        className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${card.color}22 0%, ${card.color}08 100%)`,
                          border: `1px solid ${card.color}30`,
                          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                        }}
                      >
                        <Icon size={16} style={{ color: card.color }} />
                      </div>
                      {/* trend badge */}
                      <span
                        className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full"
                        style={{
                          background: `${card.color}18`,
                          color: card.color,
                          border: `1px solid ${card.color}30`,
                        }}
                      >
                        {card.trend}
                      </span>
                    </div>

                    {/* big number */}
                    <div
                      className="text-3xl font-bold mb-1 leading-none"
                      style={{
                        fontFamily: "'Sora', sans-serif",
                        background: `linear-gradient(135deg, #fff 0%, ${card.color} 100%)`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {card.value}
                    </div>
                    <div className="text-[11px] font-medium text-zinc-300 mt-1">
                      {lang === "DE" ? card.labelDE : card.labelEN}
                    </div>
                    <div className="text-[10px] text-zinc-600 mt-0.5">
                      {lang === "DE" ? card.subDE : card.subEN}
                    </div>

                    {/* sparkline SVG decoration */}
                    <div className="mt-4 overflow-hidden" style={{ height: 22 }}>
                      <svg viewBox="0 0 90 22" width="100%" height="22" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id={`spark-grad-${i}`} x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor={card.color} stopOpacity="0.15" />
                            <stop offset="100%" stopColor={card.color} stopOpacity="0.7" />
                          </linearGradient>
                        </defs>
                        <path
                          d={card.sparkPath}
                          fill="none"
                          stroke={`url(#spark-grad-${i})`}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* ══ QUICK ACTIONS GRID ══════════════════════════════════════ */}
        <motion.section {...fadeUp(0.14)}>
          <div className="flex items-center gap-4 mb-7">
            <h2
              className="text-base font-semibold text-zinc-300 whitespace-nowrap"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {lang === "DE" ? "Module" : "Modules"}
            </h2>
            <div
              className="flex-1 h-px"
              style={{ background: "linear-gradient(to right, rgba(124,58,237,0.3), transparent)" }}
            />
            <span className="text-[11px] text-zinc-700 uppercase tracking-widest whitespace-nowrap">
              {QUICK_ACTIONS.length} {lang === "DE" ? "verfügbar" : "available"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {QUICK_ACTIONS.map((m, i) => {
              const Icon = m.icon;
              const isHov = hovered === i;
              const isFeatured = m.featured;
              return (
                <motion.button
                  key={m.to}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16 + i * 0.035, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => navigate(m.to)}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  className="group text-left rounded-sm relative overflow-hidden transition-all duration-300"
                  style={{
                    background: isHov
                      ? `linear-gradient(135deg, rgba(10,10,10,0.98) 0%, rgba(20,20,20,0.98) 100%)`
                      : "rgba(255,255,255,0.025)",
                    border: `1px solid ${isHov ? `${m.color}50` : "rgba(255,255,255,0.07)"}`,
                    boxShadow: isHov
                      ? `0 0 40px ${m.color}18, 0 0 0 1px ${m.color}20 inset`
                      : "none",
                    padding: isFeatured ? "20px" : "16px",
                    gridColumn: isFeatured ? "span 2" : "span 1",
                  }}
                >
                  {/* animated glow blob */}
                  <div
                    className="absolute pointer-events-none transition-all duration-500"
                    style={{
                      inset: 0,
                      background: `radial-gradient(ellipse at 15% 15%, ${m.color}14, transparent 65%)`,
                      opacity: isHov ? 1 : 0,
                    }}
                  />

                  <div className="relative flex flex-col h-full min-h-[100px]">
                    {/* icon in gem shape */}
                    <div
                      className="mb-3 flex items-center justify-center transition-transform duration-300"
                      style={{
                        width: isFeatured ? 44 : 38,
                        height: isFeatured ? 44 : 38,
                        background: `linear-gradient(135deg, ${m.color}28 0%, ${m.color}10 100%)`,
                        border: `1px solid ${m.color}35`,
                        borderRadius: isFeatured ? "10px" : "8px",
                        transform: isHov ? "scale(1.08)" : "scale(1)",
                      }}
                    >
                      <Icon size={isFeatured ? 20 : 16} style={{ color: m.color }} />
                    </div>

                    <div
                      className="font-semibold text-zinc-100 leading-tight mb-1"
                      style={{ fontSize: isFeatured ? "15px" : "13px" }}
                    >
                      {lang === "DE" ? m.labelDE : m.labelEN}
                    </div>
                    <div className="text-[10px] text-zinc-600 leading-relaxed flex-1">
                      {lang === "DE" ? m.descDE : m.descEN}
                    </div>

                    {/* slide-in CTA */}
                    <div
                      className="flex items-center gap-1 text-[10px] font-semibold mt-3 transition-all duration-250"
                      style={{
                        color: m.color,
                        opacity: isHov ? 1 : 0,
                        transform: isHov ? "translateX(0)" : "translateX(-6px)",
                      }}
                    >
                      → {lang === "DE" ? "Öffnen" : "Open"}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        {/* ══ BOTTOM ROW: Activity + Tips ═════════════════════════════ */}
        <motion.section {...fadeUp(0.22)} className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Activity feed — timeline style */}
          <div
            className="lg:col-span-2 rounded-sm p-6"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {/* section header */}
            <div className="flex items-center gap-3 mb-7">
              <div
                className="w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}
              >
                <Clock size={13} style={{ color: "#7C3AED" }} />
              </div>
              <h3
                className="text-sm font-semibold text-zinc-200"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                {lang === "DE" ? "Letzte Aktivitäten" : "Recent Activity"}
              </h3>
              <div className="flex-1 h-px ml-2" style={{ background: "linear-gradient(to right, rgba(124,58,237,0.15), transparent)" }} />
            </div>

            {/* timeline */}
            <div className="relative">
              {/* vertical connector line */}
              <div
                className="absolute left-[13px] top-2 bottom-2 w-px"
                style={{ background: "linear-gradient(to bottom, rgba(124,58,237,0.25), rgba(255,255,255,0.04))" }}
              />

              <div className="space-y-0">
                {(activityFeed || []).slice(0, 6).map((item, i) => (
                  <div key={i} className="flex items-start gap-4 pb-5 group cursor-default">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 transition-transform duration-200 group-hover:scale-110"
                      style={{ background: "rgba(124,58,237,0.10)", border: "1px solid rgba(124,58,237,0.28)" }}
                    >
                      <Activity size={12} style={{ color: "#7C3AED" }} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-[13px] text-zinc-300 leading-snug line-clamp-1">{item.text || "—"}</p>
                      <p className="text-[10px] text-zinc-700">{item.meta} · {item.status}</p>
                    </div>
                    <div className="text-[10px] text-zinc-700 whitespace-nowrap pt-0.5 flex-shrink-0">
                      {(item.at || "").slice(0, 10)}
                    </div>
                  </div>
                ))}
                {activityFeed !== null && activityFeed.length === 0 && (
                  <p className="text-[13px] text-zinc-600 py-4 text-center">
                    {lang === "DE"
                      ? "Noch keine Aktivität – starte einen Plan in Mission Control."
                      : "No activity yet – start a plan in Mission Control."}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tips / What's New */}
          <div
            className="rounded-sm p-6 flex flex-col"
            style={{
              background: "linear-gradient(145deg, rgba(124,58,237,0.05) 0%, rgba(255,255,255,0.02) 100%)",
              border: "1px solid rgba(124,58,237,0.14)",
            }}
          >
            <div className="flex items-center gap-3 mb-7">
              <div
                className="w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.22)" }}
              >
                <Layers size={13} style={{ color: "#7C3AED" }} />
              </div>
              <h3
                className="text-sm font-semibold text-zinc-200"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                {lang === "DE" ? "Tipps & Neuigkeiten" : "Tips & What's New"}
              </h3>
            </div>

            <div className="space-y-0 flex-1">
              {TIPS.map((tip, i) => (
                <div key={i}>
                  <div
                    className="flex items-start gap-0 rounded-sm overflow-hidden"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      borderLeft: `3px solid ${tip.color}`,
                      padding: "10px 12px",
                      marginBottom: i < TIPS.length - 1 ? "8px" : 0,
                    }}
                  >
                    {/* badge top-left */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded-sm"
                          style={{ background: `${tip.color}20`, color: tip.color }}
                        >
                          {tip.badge}
                        </span>
                        <div className="text-[12px] font-semibold text-zinc-200 leading-snug">
                          {lang === "DE" ? tip.titleDE : tip.titleEN}
                        </div>
                      </div>
                      <div className="text-[11px] text-zinc-600 leading-relaxed">
                        {lang === "DE" ? tip.descDE : tip.descEN}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate("/agents")}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-sm transition-all duration-200"
              style={{
                background: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.22)",
                color: "#7C3AED",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(124,58,237,0.18)";
                e.currentTarget.style.borderColor = "rgba(124,58,237,0.42)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(124,58,237,0.1)";
                e.currentTarget.style.borderColor = "rgba(124,58,237,0.22)";
              }}
            >
              {lang === "DE" ? "Alle Agenten öffnen" : "Open All Agents"}
              <ArrowRight size={13} />
            </button>
          </div>
        </motion.section>

      </div>
    </>
  );
}

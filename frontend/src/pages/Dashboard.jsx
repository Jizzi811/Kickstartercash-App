import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Sparkles, Bot, Palette, Film, Smartphone,
  Globe, BarChart2, Zap, Database, Wrench, MessageSquare,
  TrendingUp, Users, FileText, Cpu, Crown, ChevronRight,
  Star, Activity, Clock, Layers,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

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
    value: "10",
    subDE: "Aktiv & einsatzbereit",
    subEN: "Active & ready",
    color: "#D4AF37",
  },
  {
    icon: Cpu,
    labelDE: "Generierte Assets",
    labelEN: "Generated Assets",
    value: "2.4K",
    subDE: "Diese Woche",
    subEN: "This week",
    color: "#C084FC",
  },
  {
    icon: TrendingUp,
    labelDE: "Reichweite",
    labelEN: "Reach",
    value: "+38%",
    subDE: "Letzter Monat",
    subEN: "Last month",
    color: "#34D399",
  },
  {
    icon: FileText,
    labelDE: "Projekte",
    labelEN: "Projects",
    value: "14",
    subDE: "In Bearbeitung",
    subEN: "In progress",
    color: "#F472B6",
  },
];

/* ─── quick actions ──────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  {
    to: "/agents",
    icon: Bot,
    labelDE: "Agenten",
    labelEN: "Agents",
    descDE: "10 KI-Spezialisten starten",
    descEN: "Launch 10 AI specialists",
    color: "#D4AF37",
    featured: true,
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
    color: "#FBBF24",
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

/* ─── activity feed ──────────────────────────────────────────────── */
const FEED = [
  {
    icon: Star,
    color: "#D4AF37",
    textDE: "KickstarterCash-System gestartet",
    textEN: "KickstarterCash system launched",
    timeDE: "Gerade eben",
    timeEN: "Just now",
  },
  {
    icon: Bot,
    color: "#C084FC",
    textDE: "Agenten-Wissensdatenbank aktualisiert",
    textEN: "Agent knowledge base updated",
    timeDE: "Vor 5 Min.",
    timeEN: "5 min ago",
  },
  {
    icon: Palette,
    color: "#F472B6",
    textDE: "3 neue Design-Assets generiert",
    textEN: "3 new design assets generated",
    timeDE: "Vor 18 Min.",
    timeEN: "18 min ago",
  },
  {
    icon: TrendingUp,
    color: "#34D399",
    textDE: "SEO-Report: +12 Ranking-Positionen",
    textEN: "SEO report: +12 ranking positions",
    timeDE: "Vor 1 Std.",
    timeEN: "1 hr ago",
  },
  {
    icon: Zap,
    color: "#F87171",
    textDE: "Automatisierungs-Workflow ausgeführt",
    textEN: "Automation workflow executed",
    timeDE: "Vor 2 Std.",
    timeEN: "2 hrs ago",
  },
];

/* ─── glass card helper ──────────────────────────────────────────── */
const glassBase = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
};

/* ═══════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { lang, activeBrand } = useApp();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const [tick, setTick] = useState(0);

  /* subtle pulse on the hero crown icon */
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const greetDE = () => {
    const h = new Date().getHours();
    if (h < 12) return "Guten Morgen";
    if (h < 18) return "Guten Tag";
    return "Guten Abend";
  };

  return (
    <div className="space-y-10 pb-6">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <motion.section {...fadeUp(0)}>
        <div
          className="relative overflow-hidden rounded-sm"
          style={{
            background: "linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(8,8,8,0) 60%, rgba(184,151,46,0.04) 100%)",
            border: "1px solid rgba(212,175,55,0.14)",
          }}
        >
          {/* ambient glow */}
          <div
            className="absolute -top-24 -left-24 w-80 h-80 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute -bottom-20 right-0 w-96 h-96 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(184,151,46,0.05) 0%, transparent 70%)",
            }}
          />

          <div className="relative px-7 md:px-12 py-10 md:py-14">
            {/* badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 text-[10px] tracking-[0.22em] uppercase"
              style={{
                background: "rgba(212,175,55,0.08)",
                border: "1px solid rgba(212,175,55,0.22)",
                color: "#D4AF37",
              }}
            >
              <Crown
                size={11}
                style={{
                  transition: "transform 0.6s ease",
                  transform: tick % 2 === 0 ? "scale(1)" : "scale(1.15)",
                }}
              />
              {lang === "DE" ? "KI-Agentur System" : "AI Agency System"}
            </div>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
              <div className="max-w-xl">
                <h1
                  className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#fff" }}
                >
                  {lang === "DE" ? greetDE() : "Welcome back"},{" "}
                  <span style={{ color: "#D4AF37" }}>
                    {activeBrand?.name || "KickstarterCash"}
                  </span>
                </h1>
                <p className="text-sm md:text-base text-zinc-400 leading-relaxed mb-8">
                  {lang === "DE"
                    ? "10 spezialisierte KI-Agenten arbeiten für dich – mit echten Tools, deiner Wissensdatenbank und ohne Halluzinieren."
                    : "10 specialized AI agents work for you – with real tools, your knowledge base, and zero hallucinations."}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate("/agents")}
                    className="inline-flex items-center gap-2.5 font-bold text-sm tracking-wide px-6 py-3 rounded-sm transition-all duration-200"
                    style={{
                      background: "#D4AF37",
                      color: "#050505",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#F3E5AB"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#D4AF37"; }}
                  >
                    <Bot size={15} />
                    {lang === "DE" ? "Agenten starten" : "Launch Agents"}
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => navigate("/jarvjis")}
                    className="inline-flex items-center gap-2.5 text-sm px-6 py-3 rounded-sm transition-all duration-200"
                    style={{
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "#a1a1aa",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)";
                      e.currentTarget.style.color = "#D4AF37";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                      e.currentTarget.style.color = "#a1a1aa";
                    }}
                  >
                    <Sparkles size={14} />
                    CEO Kashbot
                  </button>
                </div>
              </div>

              {/* hero stats strip */}
              <div className="flex gap-6 md:gap-8 flex-wrap">
                {[
                  { numDE: "10", numEN: "10", labelDE: "Agenten", labelEN: "Agents" },
                  { numDE: "8", numEN: "8", labelDE: "Module", labelEN: "Modules" },
                  { numDE: "∞", numEN: "∞", labelDE: "Möglichkeiten", labelEN: "Possibilities" },
                ].map((s) => (
                  <div key={s.labelDE} className="text-center">
                    <div
                      className="text-2xl md:text-3xl font-bold"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#D4AF37" }}
                    >
                      {s.numDE}
                    </div>
                    <div className="text-[11px] text-zinc-600 uppercase tracking-widest mt-0.5">
                      {lang === "DE" ? s.labelDE : s.labelEN}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── KPI CARDS ────────────────────────────────────────────── */}
      <motion.section {...fadeUp(0.08)}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {KPI_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="rounded-sm p-5 transition-all duration-300"
                style={{
                  ...glassBase,
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${card.color}35`;
                  e.currentTarget.style.boxShadow = `0 0 24px ${card.color}0d`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-9 h-9 rounded-sm flex items-center justify-center"
                    style={{ background: `${card.color}14` }}
                  >
                    <Icon size={17} style={{ color: card.color }} />
                  </div>
                  <Activity size={13} className="text-zinc-800 mt-1" />
                </div>
                <div
                  className="text-2xl font-bold mb-1"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", color: card.color }}
                >
                  {card.value}
                </div>
                <div className="text-[11px] font-medium text-zinc-300">
                  {lang === "DE" ? card.labelDE : card.labelEN}
                </div>
                <div className="text-[10px] text-zinc-700 mt-0.5">
                  {lang === "DE" ? card.subDE : card.subEN}
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* ── QUICK ACTIONS GRID ───────────────────────────────────── */}
      <motion.section {...fadeUp(0.14)}>
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-lg md:text-xl font-semibold"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#e4e4e7" }}
          >
            {lang === "DE" ? "Module" : "Modules"}
          </h2>
          <div
            className="h-px flex-1 mx-5"
            style={{ background: "linear-gradient(to right, rgba(212,175,55,0.2), transparent)" }}
          />
          <span className="text-[11px] text-zinc-700 uppercase tracking-widest">
            {QUICK_ACTIONS.length} {lang === "DE" ? "verfügbar" : "available"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {QUICK_ACTIONS.map((m, i) => {
            const Icon = m.icon;
            const isHov = hovered === i;
            return (
              <motion.button
                key={m.to}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 + i * 0.035, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => navigate(m.to)}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="group text-left rounded-sm p-4 transition-all duration-200 relative overflow-hidden"
                style={{
                  ...glassBase,
                  borderColor: isHov ? `${m.color}40` : "rgba(255,255,255,0.07)",
                  boxShadow: isHov ? `0 0 20px ${m.color}0f` : "none",
                  ...(m.featured ? { gridColumn: "span 1" } : {}),
                }}
              >
                {/* subtle color bleed on hover */}
                <div
                  className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(ellipse at 20% 20%, ${m.color}09, transparent 70%)`,
                    opacity: isHov ? 1 : 0,
                  }}
                />

                <div className="relative">
                  <div
                    className="w-9 h-9 rounded-sm flex items-center justify-center mb-3 transition-colors duration-200"
                    style={{ background: `${m.color}16` }}
                  >
                    <Icon size={17} style={{ color: m.color }} />
                  </div>
                  <div className="text-[13px] font-semibold text-zinc-200 mb-1 leading-tight">
                    {lang === "DE" ? m.labelDE : m.labelEN}
                  </div>
                  <div className="text-[10px] text-zinc-600 leading-relaxed">
                    {lang === "DE" ? m.descDE : m.descEN}
                  </div>
                  <div
                    className="flex items-center gap-1 text-[10px] mt-3 transition-all duration-200"
                    style={{
                      color: m.color,
                      opacity: isHov ? 1 : 0,
                      transform: isHov ? "translateX(0)" : "translateX(-4px)",
                    }}
                  >
                    {lang === "DE" ? "Öffnen" : "Open"} <ChevronRight size={11} />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      {/* ── BOTTOM ROW: Activity + Tips ──────────────────────────── */}
      <motion.section {...fadeUp(0.22)} className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Activity feed */}
        <div
          className="lg:col-span-2 rounded-sm p-6"
          style={glassBase}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-7 h-7 rounded-sm flex items-center justify-center"
              style={{ background: "rgba(212,175,55,0.1)" }}
            >
              <Clock size={14} style={{ color: "#D4AF37" }} />
            </div>
            <h3
              className="text-sm font-semibold text-zinc-200"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {lang === "DE" ? "Letzte Aktivitäten" : "Recent Activity"}
            </h3>
          </div>

          <div className="space-y-4">
            {FEED.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 pb-4 transition-colors duration-150 group cursor-default"
                  style={{
                    borderBottom: i < FEED.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${item.color}14` }}
                  >
                    <Icon size={13} style={{ color: item.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-zinc-300 leading-snug">
                      {lang === "DE" ? item.textDE : item.textEN}
                    </p>
                    <p className="text-[11px] text-zinc-700 mt-0.5">
                      {lang === "DE" ? item.timeDE : item.timeEN}
                    </p>
                  </div>
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2"
                    style={{ background: item.color, opacity: 0.5 }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Tips / What's new */}
        <div
          className="rounded-sm p-6 flex flex-col"
          style={{
            background: "linear-gradient(145deg, rgba(212,175,55,0.05) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(212,175,55,0.12)",
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-7 h-7 rounded-sm flex items-center justify-center"
              style={{ background: "rgba(212,175,55,0.12)" }}
            >
              <Layers size={14} style={{ color: "#D4AF37" }} />
            </div>
            <h3
              className="text-sm font-semibold text-zinc-200"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {lang === "DE" ? "Tipps & Neuigkeiten" : "Tips & What's New"}
            </h3>
          </div>

          <div className="space-y-4 flex-1">
            {[
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
                color: "#D4AF37",
              },
            ].map((tip, i) => (
              <div key={i} className="group">
                <div className="flex items-start gap-2.5">
                  <span
                    className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                    style={{ background: `${tip.color}20`, color: tip.color }}
                  >
                    {tip.badge}
                  </span>
                  <div>
                    <div className="text-[12px] font-semibold text-zinc-300 leading-snug">
                      {lang === "DE" ? tip.titleDE : tip.titleEN}
                    </div>
                    <div className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">
                      {lang === "DE" ? tip.descDE : tip.descEN}
                    </div>
                  </div>
                </div>
                {i < 2 && (
                  <div
                    className="mt-3 h-px"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  />
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate("/agents")}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-sm transition-all duration-200"
            style={{
              background: "rgba(212,175,55,0.1)",
              border: "1px solid rgba(212,175,55,0.2)",
              color: "#D4AF37",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(212,175,55,0.18)";
              e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(212,175,55,0.1)";
              e.currentTarget.style.borderColor = "rgba(212,175,55,0.2)";
            }}
          >
            {lang === "DE" ? "Alle Agenten öffnen" : "Open All Agents"}
            <ArrowRight size={13} />
          </button>
        </div>
      </motion.section>

    </div>
  );
}

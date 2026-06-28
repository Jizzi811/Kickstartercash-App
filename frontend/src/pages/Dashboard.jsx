import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Bot, Palette, Film, Smartphone, Globe, BarChart2, Zap, Database } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { BANNER_URL } from "@/i18n";

const MODULES = [
  {
    to: "/agents", icon: Bot, emoji: "🤖",
    labelDE: "Agenten", labelEN: "Agents",
    descDE: "10 KI-Spezialisten mit eigener Persönlichkeit, Tools & KB-Zugriff.",
    descEN: "10 AI specialists with their own personality, tools & KB access.",
    color: "#D4AF37",
  },
  {
    to: "/design", icon: Palette, emoji: "🎨",
    labelDE: "Design Studio", labelEN: "Design Studio",
    descDE: "GPT Image · Canva · Leonardo · Flux · Ideogram",
    descEN: "GPT Image · Canva · Leonardo · Flux · Ideogram",
    color: "#C084FC",
  },
  {
    to: "/video", icon: Film, emoji: "🎬",
    labelDE: "Video Studio", labelEN: "Video Studio",
    descDE: "Veo 3 · Kling · Runway ML · CapCut · Scripts & Storyboards",
    descEN: "Veo 3 · Kling · Runway ML · CapCut · Scripts & Storyboards",
    color: "#F472B6",
  },
  {
    to: "/social", icon: Smartphone, emoji: "📱",
    labelDE: "Social Media", labelEN: "Social Media",
    descDE: "Posts, Reels, Hashtags & Plattform-Strategie für alle Kanäle.",
    descEN: "Posts, reels, hashtags & platform strategy for all channels.",
    color: "#FBBF24",
  },
  {
    to: "/seo", icon: Globe, emoji: "🌍",
    labelDE: "SEO", labelEN: "SEO",
    descDE: "Keywords, Meta-Texte, Audit, Schema Markup & SEO-Artikel.",
    descEN: "Keywords, meta texts, audit, schema markup & SEO articles.",
    color: "#34D399",
  },
  {
    to: "/analytics", icon: BarChart2, emoji: "📈",
    labelDE: "Analytics", labelEN: "Analytics",
    descDE: "KPIs, Reports, A/B-Tests & datengetriebene Wachstumspläne.",
    descEN: "KPIs, reports, A/B tests & data-driven growth plans.",
    color: "#A78BFA",
  },
  {
    to: "/automation", icon: Zap, emoji: "⚙️",
    labelDE: "Automationen", labelEN: "Automations",
    descDE: "n8n, Make, Zapier, Webhooks & KI-Workflows automatisieren.",
    descEN: "n8n, Make, Zapier, webhooks & AI workflows automated.",
    color: "#F87171",
  },
  {
    to: "/knowledge", icon: Database, emoji: "📚",
    labelDE: "Wissensdatenbank", labelEN: "Knowledge Base",
    descDE: "Produkte, FAQs, Corporate Design – Jarvjis echtes Wissen.",
    descEN: "Products, FAQs, corporate design – Jarvjis real knowledge.",
    color: "#60A5FA",
  },
];

export default function Dashboard() {
  const { lang, activeBrand } = useApp();
  const navigate = useNavigate();

  return (
    <div className="space-y-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-sm border border-white/8"
      >
        <img src={BANNER_URL} alt="Jarvjis" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        <div className="relative px-8 md:px-14 py-12 md:py-16 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] tracking-[0.2em] uppercase mb-6">
            <Sparkles size={11} /> AI Agent System
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-white mb-3 leading-tight">
            JARVJIS<br />
            <span className="text-[#D4AF37]">KickstarterCash</span>
          </h1>
          <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
            {lang === "DE"
              ? "10 spezialisierte KI-Agenten. Echte Tools. Deine Wissensdatenbank. Kein Halluzinieren."
              : "10 specialized AI agents. Real tools. Your knowledge base. No hallucinations."}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => navigate("/agents")}
              className="inline-flex items-center gap-2 bg-[#D4AF37] text-black px-6 py-3 rounded-sm font-bold text-sm tracking-wide hover:bg-[#F3E5AB] transition-colors">
              🤖 {lang === "DE" ? "Agenten starten" : "Launch Agents"} <ArrowRight size={15} />
            </button>
            <button onClick={() => navigate("/jarvjis")}
              className="inline-flex items-center gap-2 border border-white/15 text-zinc-300 px-6 py-3 rounded-sm text-sm hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition-colors">
              🎯 {lang === "DE" ? "CEO Jarvjis" : "CEO Jarvjis"}
            </button>
            <span className="text-xs text-zinc-600">
              {lang === "DE" ? "Marke:" : "Brand:"} <span className="text-[#D4AF37]">{activeBrand?.name}</span>
            </span>
          </div>
        </div>
      </motion.div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MODULES.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.button
              key={m.to}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => navigate(m.to)}
              className="group text-left bg-[#0A0A0A] border border-white/8 rounded-sm p-5 transition-all duration-200"
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${m.color}45`; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = ""; }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-sm flex items-center justify-center"
                  style={{ backgroundColor: `${m.color}18` }}>
                  <Icon size={18} style={{ color: m.color }} />
                </div>
                <span className="text-lg">{m.emoji}</span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1.5">
                {lang === "DE" ? m.labelDE : m.labelEN}
              </h3>
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                {lang === "DE" ? m.descDE : m.descEN}
              </p>
              <div className="mt-4 flex items-center gap-1 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: m.color }}>
                {lang === "DE" ? "Öffnen" : "Open"} <ArrowRight size={11} />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Palette, Share2, ImageIcon, PenLine, BookOpen, ArrowRight, Sparkles, Zap, LayoutTemplate, CalendarDays, FolderDown, ShieldCheck, Rocket } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { BANNER_URL } from "@/i18n";

const modules = [
  { to: "/campaign", icon: Zap, titleKey: "nav_campaign", descKey: "mod_campaign_desc", n: "★" },
  { to: "/funnel", icon: Rocket, titleKey: "nav_funnel", descKey: "mod_funnel_desc", n: "★" },
  { to: "/brand", icon: Palette, titleKey: "nav_brand", descKey: "mod_brand_desc", n: "01" },
  { to: "/social", icon: Share2, titleKey: "nav_social", descKey: "mod_social_desc", n: "02" },
  { to: "/image", icon: ImageIcon, titleKey: "nav_image", descKey: "mod_image_desc", n: "03" },
  { to: "/copy", icon: PenLine, titleKey: "nav_copy", descKey: "mod_copy_desc", n: "04" },
  { to: "/landing", icon: LayoutTemplate, titleKey: "nav_landing", descKey: "mod_landing_desc", n: "05" },
  { to: "/calendar", icon: CalendarDays, titleKey: "nav_calendar", descKey: "mod_calendar_desc", n: "06" },
  { to: "/guardian", icon: ShieldCheck, titleKey: "nav_guardian", descKey: "mod_guardian_desc", n: "07" },
  { to: "/prompts", icon: BookOpen, titleKey: "nav_prompts", descKey: "mod_prompts_desc", n: "08" },
  { to: "/export", icon: FolderDown, titleKey: "nav_export", descKey: "mod_export_desc", n: "09" },
];

export default function Dashboard() {
  const { t, activeBrand } = useApp();
  const navigate = useNavigate();

  return (
    <div className="space-y-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-md border border-white/10"
        data-testid="dashboard-hero"
      >
        <img src={BANNER_URL} alt="KickstarterCash" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/40" />
        <div className="relative px-7 md:px-12 py-12 md:py-16 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4AF37]/30 text-[#D4AF37] text-xs tracking-[0.15em] uppercase mb-5">
            <Sparkles size={13} /> {t("tagline")}
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-light leading-[1.05] tracking-tight">
            <span className="gold-text">{t("dash_hero_title")}</span>
          </h1>
          <p className="mt-5 text-zinc-400 text-base md:text-lg max-w-2xl leading-relaxed">{t("dash_hero_sub")}</p>
          <div className="mt-7 flex items-center gap-3">
            <button
              data-testid="hero-start-social"
              onClick={() => navigate("/campaign")}
              className="inline-flex items-center gap-2 bg-[#D4AF37] text-black px-6 py-3 rounded-sm font-bold tracking-wide hover:bg-[#F3E5AB] transition-colors"
            >
              {t("nav_campaign")} <ArrowRight size={16} />
            </button>
            <span className="text-sm text-zinc-500">{t("activeBrand")}: <span className="text-[#D4AF37]">{activeBrand?.name}</span></span>
          </div>
        </div>
      </motion.div>

      {/* Module grid */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((m, i) => (
            <motion.button
              key={m.to}
              data-testid={`module-card-${m.to.slice(1)}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * i }}
              onClick={() => navigate(m.to)}
              className="group text-left bg-[#0A0A0A] border border-white/5 rounded-md p-7 hover:border-[#D4AF37]/50 transition-all duration-300 hover:gold-glow"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-sm bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black transition-colors">
                  <m.icon size={22} strokeWidth={1.6} />
                </div>
                <span className="font-mono text-xs text-zinc-700">{m.n}</span>
              </div>
              <h3 className="font-display text-xl text-white mb-2">{t(m.titleKey)}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{t(m.descKey)}</p>
              <div className="mt-5 inline-flex items-center gap-1.5 text-xs text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity">
                {t("dash_open")} <ArrowRight size={13} />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutGrid, Palette, Share2, ImageIcon, PenLine, BookOpen, ChevronDown, Zap, CalendarDays, FolderDown, ShieldCheck, Rocket, Bot, Sparkles } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { LOGO_URL } from "@/i18n";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { to: "/", key: "nav_dashboard", icon: LayoutGrid, end: true },
  { to: "/campaign", key: "nav_campaign", icon: Zap },
  { to: "/brand", key: "nav_brand", icon: Palette },
  { to: "/social", key: "nav_social", icon: Share2 },
  { to: "/image", key: "nav_image", icon: ImageIcon },
  { to: "/copy", key: "nav_copy", icon: PenLine },
  { to: "/funnel", key: "nav_funnel", icon: Rocket },
  { to: "/calendar", key: "nav_calendar", icon: CalendarDays },
  { to: "/guardian", key: "nav_guardian", icon: ShieldCheck },
  { to: "/chat-gpt", key: "nav_gptchat", icon: Bot },
  { to: "/chat-gemini", key: "nav_geminichat", icon: Sparkles },
  { to: "/prompts", key: "nav_prompts", icon: BookOpen },
  { to: "/export", key: "nav_export", icon: FolderDown },
];

export const Layout = ({ children }) => {
  const { t, lang, setLang, brands, activeBrand, setActiveBrandId, model, setModel } = useApp();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-[#050505]">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/10 bg-[#0A0A0A] fixed h-screen z-20">
        <div
          className="flex items-center gap-3 px-6 py-6 cursor-pointer"
          onClick={() => navigate("/")}
          data-testid="sidebar-logo"
        >
          <img src={LOGO_URL} alt="KickstarterCash" className="w-11 h-11 object-contain" />
          <div className="leading-tight">
            <div className="font-display text-[15px] gold-text font-semibold">Content Maschine</div>
            <div className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">KickstarterCash</div>
          </div>
        </div>

        <nav className="flex-1 px-3 mt-2 space-y-1">
          {navItems.map(({ to, key, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              data-testid={`nav-${key}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-sm text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-[#D4AF37]/10 text-[#D4AF37] border-l-2 border-[#D4AF37]"
                    : "text-zinc-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                }`
              }
            >
              <Icon size={18} strokeWidth={1.6} />
              {t(key)}
            </NavLink>
          ))}
        </nav>

        <div className="px-6 py-5 border-t border-white/10">
          <div className="text-[10px] tracking-[0.18em] uppercase text-zinc-600">{t("tagline")}</div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-black/60 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-5 md:px-8 h-16 gap-3">
            <div className="md:hidden flex items-center gap-2">
              <img src={LOGO_URL} alt="logo" className="w-9 h-9 object-contain" />
            </div>

            <div className="flex items-center gap-3 ml-auto">
              {/* Active brand selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    data-testid="active-brand-trigger"
                    className="flex items-center gap-2 px-3 py-2 rounded-sm border border-white/10 hover:border-[#D4AF37]/50 text-sm transition-colors"
                  >
                    <span className="w-3 h-3 rounded-full border border-white/20" style={{ background: activeBrand?.primary_color || "#D4AF37" }} />
                    <span className="hidden sm:inline text-zinc-400">{t("activeBrand")}:</span>
                    <span className="text-white max-w-[120px] truncate">{activeBrand?.name || "—"}</span>
                    <ChevronDown size={14} className="text-zinc-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#0A0A0A] border-white/10 text-white">
                  {brands.map((b) => (
                    <DropdownMenuItem
                      key={b.id}
                      data-testid={`brand-option-${b.id}`}
                      onClick={() => setActiveBrandId(b.id)}
                      className="cursor-pointer focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]"
                    >
                      <span className="w-3 h-3 rounded-full mr-2 border border-white/20" style={{ background: b.primary_color }} />
                      {b.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Model toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    data-testid="model-trigger"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-sm border border-white/10 hover:border-[#D4AF37]/50 text-sm transition-colors text-zinc-300"
                  >
                    {model === "gemini" ? "Gemini 2.5" : "GPT-5.2"}
                    <ChevronDown size={14} className="text-zinc-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#0A0A0A] border-white/10 text-white">
                  <DropdownMenuItem data-testid="model-gpt" onClick={() => setModel("gpt")} className="cursor-pointer focus:bg-[#D4AF37]/10">GPT-5.2</DropdownMenuItem>
                  <DropdownMenuItem data-testid="model-gemini" onClick={() => setModel("gemini")} className="cursor-pointer focus:bg-[#D4AF37]/10">Gemini 2.5 Flash</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Language toggle */}
              <div className="flex items-center rounded-sm border border-white/10 overflow-hidden text-sm">
                {["DE", "EN"].map((l) => (
                  <button
                    key={l}
                    data-testid={`lang-${l}`}
                    onClick={() => setLang(l)}
                    className={`px-3 py-2 transition-colors ${lang === l ? "bg-[#D4AF37] text-black font-semibold" : "text-zinc-400 hover:text-white"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile nav */}
          <div className="md:hidden flex overflow-x-auto gap-1 px-3 pb-2 border-t border-white/5">
            {navItems.map(({ to, key, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-sm text-xs whitespace-nowrap ${isActive ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "text-zinc-400"}`
                }
              >
                <Icon size={14} /> {t(key)}
              </NavLink>
            ))}
          </div>
        </header>

        <main className="flex-1 px-5 md:px-10 py-8 max-w-[1500px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutGrid, Bot, Palette, Film, Smartphone, Globe, BarChart2,
  Zap, Database, Wrench, ChevronDown, ChevronRight, Menu, X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { LOGO_URL } from "@/i18n";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/",           icon: LayoutGrid, labelDE: "Dashboard",       labelEN: "Dashboard",       end: true },
  { to: "/agents",     icon: Bot,        labelDE: "Agenten",          labelEN: "Agents" },
  { to: "/design",     icon: Palette,    labelDE: "Design Studio",    labelEN: "Design Studio" },
  { to: "/video",      icon: Film,       labelDE: "Video Studio",     labelEN: "Video Studio" },
  { to: "/social",     icon: Smartphone, labelDE: "Social Media",     labelEN: "Social Media" },
  { to: "/seo",        icon: Globe,      labelDE: "SEO",              labelEN: "SEO" },
  { to: "/analytics",  icon: BarChart2,  labelDE: "Analytics",        labelEN: "Analytics" },
  { to: "/automation", icon: Zap,        labelDE: "Automationen",     labelEN: "Automations" },
  { to: "/knowledge",  icon: Database,   labelDE: "Wissensdatenbank", labelEN: "Knowledge Base" },
  { to: "/builder",   icon: Wrench,     labelDE: "Eigene Agenten",   labelEN: "Custom Agents" },
];

export const Layout = ({ children }) => {
  const { t, lang, setLang, model, setModel } = useApp();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#050505]">
      {/* Sidebar – desktop */}
      <aside className="hidden md:flex flex-col w-60 border-r border-white/8 bg-[#080808] fixed h-screen z-20">
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5 py-5 cursor-pointer border-b border-white/8"
          onClick={() => navigate("/")}
        >
          <img src={LOGO_URL} alt="Kashbot" className="w-9 h-9 object-contain" />
          <div className="leading-tight">
            <div className="text-[13px] font-bold text-[#D4AF37] tracking-wide">KASHBOT</div>
            <div className="text-[9px] tracking-[0.2em] uppercase text-zinc-600">KickstarterCash</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, labelDE, labelEN, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-sm text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-[#D4AF37]/12 text-[#D4AF37] border-l-2 border-[#D4AF37]"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-white/4 border-l-2 border-transparent"
                }`
              }
            >
              <Icon size={16} strokeWidth={1.6} />
              {lang === "DE" ? labelDE : labelEN}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/8">
          <div className="text-[9px] tracking-[0.2em] uppercase text-zinc-700">AI Agent System</div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-[#080808] border-r border-white/8 flex flex-col z-50">
            <div className="flex items-center justify-between px-5 py-5 border-b border-white/8">
              <div className="flex items-center gap-3">
                <img src={LOGO_URL} alt="Kashbot" className="w-8 h-8 object-contain" />
                <span className="text-sm font-bold text-[#D4AF37]">KASHBOT</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-zinc-500 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-0.5">
              {NAV.map(({ to, icon: Icon, labelDE, labelEN, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-sm text-[13px] font-medium transition-all ${
                      isActive
                        ? "bg-[#D4AF37]/12 text-[#D4AF37] border-l-2 border-[#D4AF37]"
                        : "text-zinc-500 hover:text-zinc-200 hover:bg-white/4 border-l-2 border-transparent"
                    }`
                  }
                >
                  <Icon size={16} strokeWidth={1.6} />
                  {lang === "DE" ? labelDE : labelEN}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-xl border-b border-white/8 h-14 flex items-center px-5 md:px-8 gap-3">
          {/* Mobile hamburger */}
          <button
            className="md:hidden text-zinc-500 hover:text-white mr-1"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>

          {/* Current page breadcrumb hint (mobile logo) */}
          <div className="md:hidden flex items-center gap-2">
            <img src={LOGO_URL} alt="logo" className="w-7 h-7 object-contain" />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Model */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-white/8 hover:border-[#D4AF37]/40 text-xs transition-colors text-zinc-400">
                  {model === "gemini" ? "Gemini 2.5" : "GPT-5.2"}
                  <ChevronDown size={12} className="text-zinc-600" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#0A0A0A] border-white/10 text-white">
                <DropdownMenuItem onClick={() => setModel("gpt")} className="text-sm cursor-pointer focus:bg-[#D4AF37]/10">GPT-5.2</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setModel("gemini")} className="text-sm cursor-pointer focus:bg-[#D4AF37]/10">Gemini 2.5 Flash</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Lang */}
            <div className="flex items-center rounded-sm border border-white/8 overflow-hidden text-xs">
              {["DE", "EN"].map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1.5 transition-colors ${lang === l ? "bg-[#D4AF37] text-black font-bold" : "text-zinc-500 hover:text-white"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 md:px-10 py-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

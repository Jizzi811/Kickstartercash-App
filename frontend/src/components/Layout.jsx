import React, { useState, useRef, useEffect, useCallback } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutGrid, Building2, Bot, Palette, Film, Smartphone, Globe, BarChart2,
  Zap, Database, Wrench, ChevronDown, ChevronRight, Menu, X, MessageSquare, ShieldCheck,
  Music, Mail, Linkedin, Network, Workflow, Search, Ticket,
  TrendingUp, BookOpen, FileText, Megaphone, BrainCircuit, Crown, LogOut, Check, Volume2, Target, Factory, Plug, Dna, Brain, Sparkles,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SalesSupportWidget } from "@/components/SalesSupportWidget";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CursorTrail } from "@/components/CursorTrail";
import { AmbientOrb } from "@/components/AmbientOrb";

const NAV = [
  { to: "/",           icon: Building2,  labelDE: "BrandMind HQ",    labelEN: "BrandMind HQ", end: true },
  { to: "/mission",    icon: Target,     labelDE: "Mission Control",  labelEN: "Mission Control" },
  { to: "/intelligence", icon: TrendingUp, labelDE: "Intelligence",  labelEN: "Intelligence" },
  { to: "/gateway",    icon: Plug,       labelDE: "AI Gateway",       labelEN: "AI Gateway" },
  { to: "/modules",    icon: LayoutGrid, labelDE: "Module",           labelEN: "Modules" },
  { to: "/brand-brain", icon: BrainCircuit, labelDE: "Brand Brain",   labelEN: "Brand Brain" },
  { to: "/brand-identity", icon: Dna,       labelDE: "Brand Identity",  labelEN: "Brand Identity" },
  { to: "/memory",     icon: Brain,      labelDE: "Memory",           labelEN: "Memory" },
  { to: "/skills",     icon: Sparkles,   labelDE: "Skills",           labelEN: "Skills" },
  { to: "/output-factory", icon: Factory, labelDE: "Output Factory", labelEN: "Output Factory" },
  { to: "/billing",    icon: Crown,      labelDE: "Preise & Plan",    labelEN: "Pricing & Plan" },
  { to: "/permissions", icon: ShieldCheck, labelDE: "Berechtigungen", labelEN: "Permissions" },
  { to: "/agents",     icon: Bot,        labelDE: "Agenten",          labelEN: "Agents" },
  { to: "/design",     icon: Palette,    labelDE: "Design Studio",    labelEN: "Design Studio" },
  { to: "/video",      icon: Film,       labelDE: "Video Studio",     labelEN: "Video Studio" },
  { to: "/social",     icon: Smartphone, labelDE: "Social Media",     labelEN: "Social Media" },
  { to: "/seo",        icon: Globe,      labelDE: "SEO",              labelEN: "SEO" },
  { to: "/analytics",  icon: BarChart2,  labelDE: "Analytics",        labelEN: "Analytics" },
  { to: "/automation", icon: Zap,        labelDE: "Automationen",     labelEN: "Automations" },
  { to: "/knowledge",  icon: Database,   labelDE: "Wissensdatenbank", labelEN: "Knowledge Base" },
  { to: "/tickets",    icon: Ticket,     labelDE: "Tickets",          labelEN: "Tickets" },
  { to: "/builder",    icon: Wrench,     labelDE: "Eigene Agenten",   labelEN: "Custom Agents" },
  { to: "/arena",      icon: MessageSquare, labelDE: "Chat Arena",    labelEN: "Chat Arena" },
  { to: "/tiktok",     icon: Music,      labelDE: "TikTok Studio",    labelEN: "TikTok Studio" },
  { to: "/seo-specialist", icon: Search, labelDE: "SEO Specialist",   labelEN: "SEO Specialist" },
  { to: "/email",      icon: Mail,       labelDE: "E-Mail Marketing",  labelEN: "Email Marketing" },
  { to: "/linkedin",   icon: Linkedin,   labelDE: "LinkedIn Studio",  labelEN: "LinkedIn Studio" },
  { to: "/orchestrator", icon: Network,  labelDE: "Orchestrator",     labelEN: "Orchestrator" },
  { to: "/workflow-architect", icon: Workflow, labelDE: "Workflow Architect", labelEN: "Workflow Architect" },
  { to: "/finance-cfo", icon: TrendingUp, labelDE: "CFO Studio", labelEN: "CFO Studio" },
  { to: "/finance-analyst", icon: BarChart2, labelDE: "Financial Analyst", labelEN: "Financial Analyst" },
  { to: "/finance-fpa", icon: TrendingUp, labelDE: "FP&A Studio", labelEN: "FP&A Studio" },
  { to: "/finance-bookkeeper", icon: BookOpen, labelDE: "Buchhaltung", labelEN: "Bookkeeper" },
  { to: "/finance-tax", icon: FileText, labelDE: "Tax Studio", labelEN: "Tax Studio" },
  { to: "/workflow", icon: Megaphone, labelDE: "Kampagnen-Flow", labelEN: "Campaign Flow" },
  { to: "/tts", icon: Volume2, labelDE: "TTS Studio", labelEN: "TTS Studio" },
];

const PAGE_NAMES = {
  "/": "BrandMind HQ",
  "/mission": "Mission Control",
  "/intelligence": "Intelligence",
  "/gateway": "AI Gateway",
  "/modules": "Module",
  "/brand-brain": "Brand Brain",
  "/brand-identity": "Brand Identity",
  "/memory": "Memory",
  "/skills": "Skills",
  "/output-factory": "Output Factory",
  "/billing": "Preise & Plan",
  "/permissions": "Permissions",
  "/agents": "Agenten",
  "/design": "Design Studio",
  "/video": "Video Studio",
  "/social": "Social Media",
  "/seo": "SEO",
  "/analytics": "Analytics",
  "/automation": "Automationen",
  "/knowledge": "Wissensdatenbank",
  "/tickets": "Tickets",
  "/builder": "Eigene Agenten",
  "/arena": "Chat Arena",
  "/jarvjis": "Quantum",
  "/tiktok": "TikTok Studio",
  "/seo-specialist": "SEO Specialist",
  "/email": "E-Mail Marketing",
  "/linkedin": "LinkedIn Studio",
  "/orchestrator": "Orchestrator",
  "/workflow-architect": "Workflow Architect",
  "/finance-cfo": "CFO Studio",
  "/finance-analyst": "Financial Analyst",
  "/finance-fpa": "FP&A Studio",
  "/finance-bookkeeper": "Buchhaltung",
  "/finance-tax": "Tax Studio",
  "/workflow": "Kampagnen-Flow",
  "/tts": "TTS Studio",
};

// ── Page-enter particles ──────────────────────────────────────────────────────
const PAGE_PARTICLE_COUNT = 7;

const PageParticles = ({ locationKey }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const list = Array.from({ length: PAGE_PARTICLE_COUNT }, (_, i) => ({
      id: `${locationKey}-${i}-${Date.now()}`,
      left: 10 + Math.random() * 80,
      delay: i * 80,
      size: 3 + Math.random() * 4,
      duration: 600 + Math.random() * 200,
    }));
    setParticles(list);

    const timer = setTimeout(() => setParticles([]), 900);
    return () => clearTimeout(timer);
  }, [locationKey]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 9998,
        overflow: "hidden",
      }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            top: "-10px",
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: "rgba(124,58,237,0.75)",
            boxShadow: "0 0 6px rgba(124,58,237,0.5)",
            animation: `pageParticleFall ${p.duration}ms ease-in forwards`,
            animationDelay: `${p.delay}ms`,
          }}
        />
      ))}
      <style>{`
        @keyframes pageParticleFall {
          0%   { transform: translateY(0) scale(1);   opacity: 0.9; }
          60%  { opacity: 0.6; }
          100% { transform: translateY(180px) scale(0.4); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// ── Easter egg toast ──────────────────────────────────────────────────────────
const CEOModeToast = ({ lang, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 99999,
        background: "linear-gradient(135deg, #1a1400 0%, #2a1f00 100%)",
        border: "1px solid rgba(124,58,237,0.5)",
        borderRadius: 10,
        padding: "14px 28px",
        color: "#7C3AED",
        fontWeight: 700,
        fontSize: 15,
        letterSpacing: "0.04em",
        boxShadow: "0 0 40px rgba(124,58,237,0.2), 0 8px 32px rgba(0,0,0,0.6)",
        animation: "ceoToastIn 0.35s cubic-bezier(0.23,1,0.32,1)",
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      {lang === "DE"
        ? "✦ Du hast den CEO-Modus entdeckt 🏆"
        : "✦ You found CEO mode 🏆"}
      <style>{`
        @keyframes ceoToastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(16px) scale(0.92); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1); }
        }
      `}</style>
    </div>
  );
};

// ── Layout ────────────────────────────────────────────────────────────────────
export const Layout = ({ children }) => {
  const {
    t, lang, setLang, model, setModel,
    isAuthenticated, activeWorkspace, workspaces, activeWorkspaceId,
    switchWorkspace, createWorkspace, logout,
  } = useApp();

  const handleNewWorkspace = async () => {
    const name = window.prompt(lang === "DE" ? "Name des neuen Workspace / Unternehmens:" : "New workspace / company name:");
    if (!name || !name.trim()) return;
    try {
      await createWorkspace({ name: name.trim() });
      navigate("/brand-brain");
    } catch {
      /* ignore */
    }
  };
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Easter egg state
  const logoClickTimes = useRef([]);
  const [ceoMode, setCeoMode] = useState(false);

  const handleLogoClick = useCallback(() => {
    navigate("/");
    const now = Date.now();
    logoClickTimes.current = logoClickTimes.current
      .filter((t) => now - t < 3000)
      .concat(now);

    if (logoClickTimes.current.length >= 5) {
      logoClickTimes.current = [];
      setCeoMode(true);
    }
  }, [navigate]);

  const currentPageName = PAGE_NAMES[location.pathname] ?? null;

  return (
    <div className="min-h-screen flex bg-[#050505]">
      {/* Global whimsy layers */}
      <AmbientOrb />
      <CursorTrail />
      <PageParticles locationKey={location.key} />
      {ceoMode && (
        <CEOModeToast lang={lang} onDone={() => setCeoMode(false)} />
      )}

      {/* Sidebar – desktop */}
      <aside className="hidden md:flex flex-col w-60 border-r border-white/8 bg-[#080808] fixed h-screen z-20">
        {/* Logo – Easter egg trigger */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, transparent 60%)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
          className="cursor-pointer"
          onClick={handleLogoClick}
        >
          <div className="flex items-center gap-3 px-5 py-5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "#7C3AED22", border: "1px solid #7C3AED55" }}
            >
              <BrainCircuit size={20} style={{ color: "#7C3AED" }} />
            </div>
            <div className="leading-tight">
              <div
                className="text-[14px] font-bold tracking-wide"
                style={{
                  background: "linear-gradient(135deg, #C4B5FD, #7C3AED)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                BRANDMIND
              </div>
              <div className="text-[9px] tracking-[0.2em] uppercase text-zinc-600">
                {lang === "DE" ? "Das Gehirn deiner Marke" : "The brain of your brand"}
              </div>
            </div>
          </div>
          {/* Gold divider line */}
          <div
            style={{
              height: "1px",
              background: "linear-gradient(to right, rgba(124,58,237,0.4), transparent)",
            }}
          />
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
                    ? "text-[#7C3AED] border-l-2 border-[#7C3AED]"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-white/4 border-l-2 border-transparent"
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      background: "rgba(124,58,237,0.1)",
                      boxShadow: "inset 3px 0 0 #7C3AED, inset 0 0 20px rgba(124,58,237,0.05)",
                    }
                  : {}
              }
            >
              <Icon size={16} strokeWidth={1.6} />
              {lang === "DE" ? labelDE : labelEN}
            </NavLink>
          ))}
        </nav>

        {/* Footer – status badge */}
        <div className="px-5 py-4 border-t border-white/8">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#4ade80",
                boxShadow: "0 0 6px rgba(74,222,128,0.6)",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "9px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#3f3f46",
              }}
            >
              System Online
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-[#080808] border-r border-white/8 flex flex-col z-50">
            <div className="flex items-center justify-between px-5 py-5 border-b border-white/8">
              <div className="flex items-center gap-2.5" onClick={handleLogoClick}>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "#7C3AED22", border: "1px solid #7C3AED55" }}
                >
                  <BrainCircuit size={17} style={{ color: "#7C3AED" }} />
                </div>
                <span
                  className="text-sm font-bold"
                  style={{
                    background: "linear-gradient(135deg, #C4B5FD, #7C3AED)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  BRANDMIND
                </span>
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
                        ? "text-[#7C3AED] border-l-2 border-[#7C3AED]"
                        : "text-zinc-500 hover:text-zinc-200 hover:bg-white/4 border-l-2 border-transparent"
                    }`
                  }
                  style={({ isActive }) =>
                    isActive
                      ? {
                          background: "rgba(124,58,237,0.1)",
                          boxShadow: "inset 3px 0 0 #7C3AED, inset 0 0 20px rgba(124,58,237,0.05)",
                        }
                      : {}
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
        <header
          className="sticky top-0 z-30 h-14 flex items-center px-5 md:px-8 gap-3"
          style={{
            background: "rgba(5,5,5,0.9)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(124,58,237,0.08)",
          }}
        >
          {/* Mobile hamburger */}
          <button
            className="md:hidden text-zinc-500 hover:text-white mr-1"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>

          {/* Mobile logo */}
          <div className="md:hidden flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: "#7C3AED22", border: "1px solid #7C3AED55" }}
            >
              <BrainCircuit size={15} style={{ color: "#7C3AED" }} />
            </div>
          </div>

          {/* Desktop breadcrumb */}
          {currentPageName && (
            <div
              className="hidden md:block"
              style={{
                fontSize: "11px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#52525b",
              }}
            >
              {currentPageName}
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {/* Model dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs transition-colors"
                  style={{
                    border: "1px solid rgba(124,58,237,0.15)",
                    color: "#7C3AED",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.border = "1px solid rgba(124,58,237,0.35)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.border = "1px solid rgba(124,58,237,0.15)";
                  }}
                >
                  {model === "gemini" ? "Gemini 2.5" : model === "grok" ? "Grok 3" : "GPT-5.2"}
                  <ChevronDown size={12} className="text-zinc-600" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#0A0A0A] border-white/10 text-white">
                <DropdownMenuItem onClick={() => setModel("gpt")} className="text-sm cursor-pointer focus:bg-[#7C3AED]/10">GPT-5.2</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setModel("gemini")} className="text-sm cursor-pointer focus:bg-[#7C3AED]/10">Gemini 2.5 Flash</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setModel("grok")} className="text-sm cursor-pointer focus:bg-[#7C3AED]/10">Grok 3 (xAI)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setModel("freetheai")} className="text-sm cursor-pointer focus:bg-[#7C3AED]/10">FreeTheAi (Gratis)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Lang toggle */}
            <div className="flex items-center rounded-sm border border-white/8 overflow-hidden text-xs">
              {["DE", "EN"].map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1.5 transition-colors ${lang === l ? "text-white font-bold" : "text-zinc-500 hover:text-white"}`}
                  style={
                    lang === l
                      ? { background: "linear-gradient(135deg, #7C3AED, #6D28D9)" }
                      : {}
                  }
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Workspace switcher + logout */}
            {isAuthenticated && (
              <div className="flex items-center gap-2">
                {activeWorkspace && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs text-white/80 border border-white/8 hover:border-white/20 transition-colors"
                        title={lang === "DE" ? "Workspace wechseln" : "Switch workspace"}
                      >
                        <BrainCircuit size={13} style={{ color: "#7C3AED" }} />
                        <span className="max-w-[140px] truncate">{activeWorkspace.name}</span>
                        <ChevronDown size={12} className="text-zinc-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#0A0A0A] border-white/10 text-white min-w-[220px]">
                      {workspaces.map((w) => (
                        <DropdownMenuItem
                          key={w.id}
                          onClick={() => switchWorkspace(w.id)}
                          className="text-sm cursor-pointer focus:bg-[#7C3AED]/15 flex items-center justify-between gap-2"
                        >
                          <span className="truncate">{w.name}</span>
                          {w.id === activeWorkspaceId && <Check size={13} style={{ color: "#7C3AED" }} />}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem
                        onClick={handleNewWorkspace}
                        className="text-sm cursor-pointer focus:bg-[#7C3AED]/15 text-[#7C3AED] mt-1 border-t border-white/5"
                      >
                        + {lang === "DE" ? "Neuer Workspace" : "New workspace"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <button
                  onClick={() => { logout(); navigate("/auth"); }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs text-zinc-400 hover:text-white border border-white/8 hover:border-white/20 transition-colors"
                  title={lang === "DE" ? "Abmelden" : "Log out"}
                >
                  <LogOut size={13} />
                  <span className="hidden sm:inline">{lang === "DE" ? "Abmelden" : "Log out"}</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 px-5 md:px-10 py-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>

      <SalesSupportWidget />
    </div>
  );
};

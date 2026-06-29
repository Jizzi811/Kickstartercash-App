import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Bot, TrendingUp, Palette, Video, ShoppingCart, Search, Zap, Headphones,
  ChevronDown, ArrowDown, User, Cpu, GitBranch,
} from "lucide-react";

const DEPARTMENTS = [
  {
    id: "marketing",
    icon: TrendingUp,
    labelDE: "Marketing",
    labelEN: "Marketing",
    color: "#D4AF37",
    descDE: "Kampagnen, Social Media, Content-Strategie & Wachstum",
    descEN: "Campaigns, social media, content strategy & growth",
  },
  {
    id: "design",
    icon: Palette,
    labelDE: "Design",
    labelEN: "Design",
    color: "#C084FC",
    descDE: "Branding, Grafiken, Logos & visuelle Identität",
    descEN: "Branding, graphics, logos & visual identity",
  },
  {
    id: "video",
    icon: Video,
    labelDE: "Video",
    labelEN: "Video",
    color: "#F472B6",
    descDE: "Scripts, Reels, YouTube & Video-Produktion",
    descEN: "Scripts, reels, YouTube & video production",
  },
  {
    id: "sales",
    icon: ShoppingCart,
    labelDE: "Sales",
    labelEN: "Sales",
    color: "#34D399",
    descDE: "Funnels, Angebote, Verkaufstexte & Conversion",
    descEN: "Funnels, offers, sales copy & conversion",
  },
  {
    id: "seo",
    icon: Search,
    labelDE: "SEO",
    labelEN: "SEO",
    color: "#60A5FA",
    descDE: "Keyword-Recherche, Meta-Texte & Ranking",
    descEN: "Keyword research, meta copy & ranking",
  },
  {
    id: "automation",
    icon: Zap,
    labelDE: "Automation",
    labelEN: "Automation",
    color: "#FBBF24",
    descDE: "Workflows, E-Mail-Sequenzen & KI-Automatisierung",
    descEN: "Workflows, email sequences & AI automation",
  },
  {
    id: "support",
    icon: Headphones,
    labelDE: "Support",
    labelEN: "Support",
    color: "#FB923C",
    descDE: "Kundenkommunikation, FAQs & Community",
    descEN: "Customer communication, FAQs & community",
  },
];

const TASKS_DE = {
  marketing: [
    "Instagram-Kampagne für Produkt-Launch erstellen",
    "Content-Kalender für nächsten Monat planen",
    "Zielgruppen-Analyse durchführen",
    "Engagement-Strategie entwickeln",
  ],
  design: [
    "Logo-Varianten für Social Media erstellen",
    "Story-Template im Brand-Design erstellen",
    "Werbebanner für Facebook Ads gestalten",
    "Farbpalette & Markenstil erweitern",
  ],
  video: [
    "TikTok-Hook-Script schreiben (15 Sek.)",
    "YouTube-Thumbnail-Konzept entwickeln",
    "Reel-Storyboard für Instagram erstellen",
    "Video-Sales-Letter Script verfassen",
  ],
  sales: [
    "Verkaufs-Funnel optimieren",
    "Angebot & Preisstruktur überarbeiten",
    "Upsell-Sequenz entwickeln",
    "Conversion-Analyse durchführen",
  ],
  seo: [
    "Keyword-Recherche für Nische",
    "Meta-Titles & Descriptions optimieren",
    "Blog-Artikel für Google Ranking planen",
    "Backlink-Strategie entwickeln",
  ],
  automation: [
    "E-Mail-Willkommenssequenz aufbauen",
    "Lead-Nurturing-Workflow erstellen",
    "Social-Media-Posting automatisieren",
    "CRM-Integration planen",
  ],
  support: [
    "FAQ-Dokument erstellen",
    "Onboarding-Checkliste entwickeln",
    "Community-Guidelines schreiben",
    "Support-Template-Antworten vorbereiten",
  ],
};

const TASKS_EN = {
  marketing: [
    "Create Instagram campaign for product launch",
    "Plan content calendar for next month",
    "Conduct target audience analysis",
    "Develop engagement strategy",
  ],
  design: [
    "Create logo variants for social media",
    "Design story template in brand style",
    "Create advertising banner for Facebook Ads",
    "Extend color palette & brand style",
  ],
  video: [
    "Write TikTok hook script (15 sec)",
    "Develop YouTube thumbnail concept",
    "Create reel storyboard for Instagram",
    "Write video sales letter script",
  ],
  sales: [
    "Optimize sales funnel",
    "Revise offer & pricing structure",
    "Develop upsell sequence",
    "Conduct conversion analysis",
  ],
  seo: [
    "Keyword research for niche",
    "Optimize meta titles & descriptions",
    "Plan blog articles for Google ranking",
    "Develop backlink strategy",
  ],
  automation: [
    "Build email welcome sequence",
    "Create lead nurturing workflow",
    "Automate social media posting",
    "Plan CRM integration",
  ],
  support: [
    "Create FAQ document",
    "Develop onboarding checklist",
    "Write community guidelines",
    "Prepare support template responses",
  ],
};

export default function JarvjisAgent() {
  const [activeDept, setActiveDept] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [ceoResponse, setCeoResponse] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const lang = localStorage.getItem("kc_lang") || "DE";

  const tasks = lang === "DE" ? TASKS_DE : TASKS_EN;

  const ceoResponsesDE = {
    marketing: "Verstanden. Ich delegiere diese Aufgabe an das Marketing-Team. Strategie wird analysiert und ein detaillierter Aktionsplan wird entwickelt.",
    design: "Klar. Das Design-Team übernimmt. Alle Materialien werden im Corporate Design von KickstarterCash erstellt.",
    video: "Ausgezeichnet. Video-Produktion wird gestartet. Das Team erstellt professionelle Inhalte für maximale Reichweite.",
    sales: "Perfekt. Sales-Optimierung beginnt jetzt. Der Funnel wird auf höchste Conversion-Rate ausgerichtet.",
    seo: "Verstanden. SEO-Analyse läuft. Keywords werden identifiziert und eine Ranking-Strategie wird entwickelt.",
    automation: "Gut. Automation-Workflow wird konfiguriert. Alle Prozesse werden optimiert für maximale Effizienz.",
    support: "Notiert. Support-Inhalte werden erstellt. Kundenbetreuung auf höchstem Niveau wird sichergestellt.",
  };

  const ceoResponsesEN = {
    marketing: "Understood. Delegating to the marketing team. Strategy is being analyzed and a detailed action plan will be developed.",
    design: "Clear. Design team is taking over. All materials will be created in KickstarterCash corporate design.",
    video: "Excellent. Video production is starting. The team will create professional content for maximum reach.",
    sales: "Perfect. Sales optimization begins now. The funnel will be aligned for the highest conversion rate.",
    seo: "Understood. SEO analysis running. Keywords will be identified and a ranking strategy will be developed.",
    automation: "Good. Automation workflow is being configured. All processes will be optimized for maximum efficiency.",
    support: "Noted. Support content will be created. Top-level customer care will be ensured.",
  };

  const handleTaskSelect = (dept, task) => {
    setActiveTask(task);
    setActiveDept(dept);
    setIsThinking(true);
    setCeoResponse(null);
    setTimeout(() => {
      setIsThinking(false);
      const responses = lang === "DE" ? ceoResponsesDE : ceoResponsesEN;
      setCeoResponse(responses[dept]);
    }, 1800);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-sm bg-[#D4AF37]/10 flex items-center justify-center">
            <Cpu size={20} className="text-[#D4AF37]" />
          </div>
          <h1 className="font-display text-2xl text-white">
            {lang === "DE" ? "Kashbot — KI Agent System" : "Kashbot — AI Agent System"}
          </h1>
        </div>
        <p className="text-sm text-zinc-500 ml-13">
          {lang === "DE"
            ? "Dein intelligentes Multi-Agenten-System für KickstarterCash. Wähle eine Abteilung und delegiere Aufgaben."
            : "Your intelligent multi-agent system for KickstarterCash. Select a department and delegate tasks."}
        </p>
      </div>

      {/* Workflow Diagram */}
      <div className="flex flex-col items-center gap-0">

        {/* User Node */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center"
        >
          <div className="flex items-center gap-3 px-6 py-3 bg-[#0A0A0A] border border-white/10 rounded-sm">
            <User size={18} className="text-zinc-300" />
            <span className="text-sm font-medium text-zinc-300">
              {lang === "DE" ? "Benutzer" : "User"}
            </span>
          </div>
          <div className="flex flex-col items-center py-1">
            <div className="w-px h-5 bg-white/20" />
            <ArrowDown size={14} className="text-zinc-500 -mt-1" />
          </div>
        </motion.div>

        {/* CEO Agent Node */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col items-center"
        >
          <div className="relative flex items-center gap-4 px-8 py-4 bg-[#D4AF37]/10 border-2 border-[#D4AF37]/60 rounded-sm min-w-[240px] justify-center">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#D4AF37] text-black text-[10px] font-bold tracking-widest uppercase rounded-full">
              CEO
            </div>
            <Bot size={22} className="text-[#D4AF37]" />
            <div>
              <div className="text-base font-semibold text-[#D4AF37]">Kashbot Agent</div>
              <div className="text-[11px] text-zinc-400">
                {lang === "DE" ? "Orchestrator & Entscheider" : "Orchestrator & Decision Maker"}
              </div>
            </div>
            {isThinking && (
              <div className="absolute right-4 flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* CEO Response */}
          {ceoResponse && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 max-w-sm px-4 py-2.5 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-sm text-xs text-zinc-300 text-center italic"
            >
              "{ceoResponse}"
            </motion.div>
          )}

          <div className="flex flex-col items-center py-1">
            <div className="w-px h-5 bg-white/20" />
            <GitBranch size={14} className="text-zinc-500 -mt-1" />
          </div>
        </motion.div>

        {/* Decision label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center"
        >
          <div className="px-5 py-1.5 border border-white/10 rounded-full text-xs text-zinc-500 tracking-widest uppercase">
            {lang === "DE" ? "Entscheidung & Delegation" : "Decision & Delegation"}
          </div>
          <div className="w-px h-5 bg-white/20" />
        </motion.div>

        {/* Department Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mt-2">
            {DEPARTMENTS.map((dept, i) => {
              const Icon = dept.icon;
              const isActive = activeDept === dept.id;
              return (
                <motion.button
                  key={dept.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  onClick={() => setActiveDept(isActive ? null : dept.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-sm border transition-all duration-200 ${
                    isActive
                      ? "border-opacity-80 bg-opacity-10"
                      : "border-white/8 bg-[#0A0A0A] hover:border-white/20"
                  }`}
                  style={
                    isActive
                      ? { borderColor: dept.color, backgroundColor: `${dept.color}15` }
                      : {}
                  }
                >
                  <div
                    className="w-9 h-9 rounded-sm flex items-center justify-center"
                    style={{ backgroundColor: `${dept.color}20` }}
                  >
                    <Icon size={18} style={{ color: dept.color }} />
                  </div>
                  <span className="text-xs font-medium text-zinc-300 text-center leading-tight">
                    {lang === "DE" ? dept.labelDE : dept.labelEN}
                  </span>
                  <ChevronDown
                    size={12}
                    className="text-zinc-600 transition-transform duration-200"
                    style={{ transform: isActive ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Task Panel */}
      {activeDept && (
        <motion.div
          key={activeDept}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="border border-white/10 rounded-sm bg-[#0A0A0A] overflow-hidden"
        >
          {(() => {
            const dept = DEPARTMENTS.find((d) => d.id === activeDept);
            const Icon = dept.icon;
            return (
              <>
                <div
                  className="flex items-center gap-3 px-6 py-4 border-b border-white/8"
                  style={{ borderLeftColor: dept.color, borderLeftWidth: 3 }}
                >
                  <Icon size={18} style={{ color: dept.color }} />
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {lang === "DE" ? dept.labelDE : dept.labelEN}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {lang === "DE" ? dept.descDE : dept.descEN}
                    </div>
                  </div>
                  <div className="ml-auto text-[10px] text-zinc-600 uppercase tracking-widest">
                    {lang === "DE" ? "Aufgabe wählen" : "Select task"}
                  </div>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {tasks[activeDept].map((task, i) => (
                    <button
                      key={i}
                      onClick={() => handleTaskSelect(activeDept, task)}
                      className={`text-left px-4 py-3 rounded-sm border text-sm transition-all duration-200 ${
                        activeTask === task && !isThinking
                          ? "text-white"
                          : "border-white/8 text-zinc-400 hover:border-white/20 hover:text-white bg-black/20"
                      }`}
                      style={
                        activeTask === task && !isThinking
                          ? { borderColor: dept.color, backgroundColor: `${dept.color}12`, color: "white" }
                          : {}
                      }
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: dept.color }}
                        />
                        {task}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            );
          })()}
        </motion.div>
      )}

      {/* Active task status */}
      {activeTask && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 px-5 py-3 bg-[#0A0A0A] border border-white/8 rounded-sm"
        >
          <div className={`w-2 h-2 rounded-full ${isThinking ? "bg-yellow-400 animate-pulse" : "bg-emerald-400"}`} />
          <span className="text-xs text-zinc-400">
            {isThinking
              ? (lang === "DE" ? "Kashbot analysiert die Aufgabe…" : "Kashbot is analyzing the task…")
              : (lang === "DE" ? "Aufgabe delegiert & in Bearbeitung" : "Task delegated & in progress")}
          </span>
          <span className="ml-auto text-xs text-zinc-600 truncate max-w-[200px]">{activeTask}</span>
        </motion.div>
      )}
    </div>
  );
}

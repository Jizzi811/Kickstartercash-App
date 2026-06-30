import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Bot, TrendingUp, Palette, Video, ShoppingCart, Search, Zap, Headphones,
  ChevronDown, ArrowDown, User, Cpu, GitBranch, Crown, Music, Mail, Linkedin,
  Network, Workflow, BarChart2, BookOpen, FileText,
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
  {
    id: "tiktok",
    icon: Music,
    labelDE: "TikTok",
    labelEN: "TikTok",
    color: "#FF2D55",
    descDE: "Viral-Content, Hooks, Skripte & Hashtag-Strategie",
    descEN: "Viral content, hooks, scripts & hashtag strategy",
  },
  {
    id: "seo_specialist",
    icon: Search,
    labelDE: "SEO Specialist",
    labelEN: "SEO Specialist",
    color: "#34D399",
    descDE: "On-Page, Technisches SEO, GEO & Keyword-Strategie",
    descEN: "On-page, technical SEO, GEO & keyword strategy",
  },
  {
    id: "email",
    icon: Mail,
    labelDE: "E-Mail Marketing",
    labelEN: "Email Marketing",
    color: "#FBBF24",
    descDE: "Newsletter, Sequenzen, CRM & Deliverability",
    descEN: "Newsletter, sequences, CRM & deliverability",
  },
  {
    id: "linkedin",
    icon: Linkedin,
    labelDE: "LinkedIn",
    labelEN: "LinkedIn",
    color: "#0A66C2",
    descDE: "Posts, Karussell, Personal Branding & Lead-Gen",
    descEN: "Posts, carousels, personal branding & lead gen",
  },
  {
    id: "orchestrator",
    icon: Network,
    labelDE: "Orchestrator",
    labelEN: "Orchestrator",
    color: "#8B5CF6",
    descDE: "Multi-Agenten-Koordination & Workflow-Design",
    descEN: "Multi-agent coordination & workflow design",
  },
  {
    id: "workflow",
    icon: Workflow,
    labelDE: "Workflow",
    labelEN: "Workflow",
    color: "#F97316",
    descDE: "Prozessdesign, SOPs & Automatisierungs-Architektur",
    descEN: "Process design, SOPs & automation architecture",
  },
  {
    id: "cfo",
    icon: TrendingUp,
    labelDE: "CFO",
    labelEN: "CFO",
    color: "#10B981",
    descDE: "Kapitalallokation, Treasury, M&A & Investor Relations",
    descEN: "Capital allocation, treasury, M&A & investor relations",
  },
  {
    id: "financial_analyst",
    icon: BarChart2,
    labelDE: "Finanzanalyse",
    labelEN: "Financial Analysis",
    color: "#3B82F6",
    descDE: "Finanzmodelle, DCF-Bewertung & Szenarioanalysen",
    descEN: "Financial models, DCF valuation & scenario analysis",
  },
  {
    id: "fpa",
    icon: TrendingUp,
    labelDE: "FP&A",
    labelEN: "FP&A",
    color: "#6366F1",
    descDE: "Budgetplanung, Rolling Forecast & KPI-Governance",
    descEN: "Budget planning, rolling forecast & KPI governance",
  },
  {
    id: "bookkeeper",
    icon: BookOpen,
    labelDE: "Buchhaltung",
    labelEN: "Bookkeeping",
    color: "#059669",
    descDE: "Buchführung, Monatsabschluss & Compliance",
    descEN: "Bookkeeping, month-end close & compliance",
  },
  {
    id: "tax",
    icon: FileText,
    labelDE: "Steuer",
    labelEN: "Tax",
    color: "#F59E0B",
    descDE: "Steueroptimierung, int. Steuerplanung & Compliance",
    descEN: "Tax optimization, international planning & compliance",
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
  tiktok: [
    "Viralen TikTok-Hook entwickeln (0-3 Sek.)",
    "Vollständiges TikTok-Skript mit Szenen schreiben",
    "Trending Sounds & Hashtag-Strategie erstellen",
    "Content-Serie für 30 Tage planen",
  ],
  seo_specialist: [
    "Keyword-Recherche mit Suchvolumen & KD",
    "Technisches SEO-Audit durchführen",
    "GEO-Optimierung für ChatGPT & Gemini",
    "Backlink-Strategie & Content-Cluster planen",
  ],
  email: [
    "Willkommens-E-Mail-Serie (5 Mails) schreiben",
    "Re-Engagement-Kampagne für Inaktive erstellen",
    "Betreffzeilen A/B-Test-Varianten entwickeln",
    "VIP-Member-Onboarding-Sequenz aufbauen",
  ],
  linkedin: [
    "Viralen LinkedIn-Post mit Hook schreiben",
    "Karussell-Präsentation (10 Slides) erstellen",
    "Thought-Leadership-Artikel verfassen",
    "LinkedIn-Profil-Optimierung durchführen",
  ],
  orchestrator: [
    "Komplexe Aufgabe auf alle Agenten verteilen",
    "Multi-Agenten-Workflow für Kampagne entwerfen",
    "Content-Pipeline koordinieren (Idee → Live)",
    "Parallele Agenten-Ausführung planen",
  ],
  workflow: [
    "Lead-to-Sale-Workflow kartografieren",
    "SOP für Karten-Onboarding erstellen",
    "Content-Produktions-Workflow designen",
    "Affiliate-Tracking-Prozess aufbauen",
  ],
  cfo: [
    "Kapitalallokation für Q3 optimieren",
    "Cashflow-Prognose für 12 Monate erstellen",
    "M&A-Due-Diligence-Framework aufsetzen",
    "Boardbericht strukturieren & vorbereiten",
  ],
  financial_analyst: [
    "DCF-Bewertungsmodell aufbauen",
    "Szenarioanalyse (Best/Base/Worst) erstellen",
    "Finanzmodell für Investorpräsentation",
    "KPI-Dashboard für Management definieren",
  ],
  fpa: [
    "Jahresbudget-Struktur entwickeln",
    "Rolling Forecast (13 Wochen) erstellen",
    "Varianzanalyse Q2 Plan vs. Ist",
    "OpEx-Optimierungspotenziale identifizieren",
  ],
  bookkeeper: [
    "Monatsabschluss-Checkliste erstellen",
    "Kontenabstimmungsprozess optimieren",
    "Interne Kontrollen implementieren",
    "Audit-Vorbereitung koordinieren",
  ],
  tax: [
    "Steueroptimierungsstrategie entwickeln",
    "Internationale Steuerstruktur analysieren",
    "Transfer-Pricing-Dokumentation erstellen",
    "Jahressteuerplanung durchführen",
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
  tiktok: [
    "Develop viral TikTok hook (0-3 sec)",
    "Write full TikTok script with scenes",
    "Create trending sounds & hashtag strategy",
    "Plan 30-day content series",
  ],
  seo_specialist: [
    "Keyword research with volume & KD",
    "Conduct technical SEO audit",
    "GEO optimization for ChatGPT & Gemini",
    "Plan backlink strategy & content clusters",
  ],
  email: [
    "Write welcome email series (5 emails)",
    "Create re-engagement campaign for inactive users",
    "Develop subject line A/B test variants",
    "Build VIP member onboarding sequence",
  ],
  linkedin: [
    "Write viral LinkedIn post with hook",
    "Create carousel presentation (10 slides)",
    "Write thought leadership article",
    "Optimize LinkedIn profile",
  ],
  orchestrator: [
    "Distribute complex task across all agents",
    "Design multi-agent workflow for campaign",
    "Coordinate content pipeline (idea → live)",
    "Plan parallel agent execution",
  ],
  workflow: [
    "Map lead-to-sale workflow",
    "Create SOP for card onboarding",
    "Design content production workflow",
    "Build affiliate tracking process",
  ],
  cfo: [
    "Optimize capital allocation for Q3",
    "Create 12-month cash flow forecast",
    "Set up M&A due diligence framework",
    "Structure and prepare board report",
  ],
  financial_analyst: [
    "Build DCF valuation model",
    "Create scenario analysis (Best/Base/Worst)",
    "Financial model for investor presentation",
    "Define KPI dashboard for management",
  ],
  fpa: [
    "Develop annual budget structure",
    "Create rolling forecast (13 weeks)",
    "Variance analysis Q2 plan vs. actual",
    "Identify OpEx optimization opportunities",
  ],
  bookkeeper: [
    "Create month-end close checklist",
    "Optimize account reconciliation process",
    "Implement internal controls",
    "Coordinate audit preparation",
  ],
  tax: [
    "Develop tax optimization strategy",
    "Analyze international tax structure",
    "Create transfer pricing documentation",
    "Conduct annual tax planning",
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
    design: "Klar. Das Design-Team übernimmt. Alle Materialien werden im Corporate Design von Kickstarcash.Club erstellt.",
    video: "Ausgezeichnet. Video-Produktion wird gestartet. Das Team erstellt professionelle Inhalte für maximale Reichweite.",
    sales: "Perfekt. Sales-Optimierung beginnt jetzt. Der Funnel wird auf höchste Conversion-Rate ausgerichtet.",
    seo: "Verstanden. SEO-Analyse läuft. Keywords werden identifiziert und eine Ranking-Strategie wird entwickelt.",
    automation: "Gut. Automation-Workflow wird konfiguriert. Alle Prozesse werden optimiert für maximale Effizienz.",
    support: "Notiert. Support-Inhalte werden erstellt. Kundenbetreuung auf höchstem Niveau wird sichergestellt.",
    tiktok: "Perfekt. Tia übernimmt. TikTok-Content mit maximalem Viralitätspotenzial wird jetzt entwickelt — Hook, Skript, Hashtags, alles.",
    seo_specialist: "Verstanden. Sofia startet die SEO-Analyse. Keywords, technisches Audit und GEO-Optimierung laufen parallel.",
    email: "Notiert. Emma erstellt die E-Mail-Sequenz. Personalisierung, Segmentierung und Deliverability werden sichergestellt.",
    linkedin: "Exzellent. Leon übernimmt LinkedIn. Hochwertiger Content für maximale organische Reichweite und Lead-Generierung.",
    orchestrator: "Perfekt. Orion koordiniert alle Agenten. Der optimale Multi-Agenten-Workflow wird jetzt entworfen und ausgeführt.",
    workflow: "Verstanden. Wren kartografiert den Prozess. Ein skalierbarer, effizienter Workflow mit SOP wird entwickelt.",
    cfo: "Verstanden. Carl übernimmt die Finanzstrategie. Kapitalallokation, Cashflow und strategische Planung werden analysiert.",
    financial_analyst: "Exzellent. Fiona startet die Analyse. Finanzmodell, DCF-Bewertung und Szenarien werden detailliert ausgearbeitet.",
    fpa: "Notiert. Felix beginnt mit der FP&A-Arbeit. Budget, Forecast und Varianzanalyse werden präzise durchgeführt.",
    bookkeeper: "Klar. Bianca übernimmt die Buchhaltung. Alle Bücher werden auf höchstem Compliance-Niveau geführt.",
    tax: "Verstanden. Tobias entwickelt die Steuerstrategie. Legale Optimierung und internationale Planung werden umgesetzt.",
  };

  const ceoResponsesEN = {
    marketing: "Understood. Delegating to the marketing team. Strategy is being analyzed and a detailed action plan will be developed.",
    design: "Clear. Design team is taking over. All materials will be created in Kickstarcash.Club corporate design.",
    video: "Excellent. Video production is starting. The team will create professional content for maximum reach.",
    sales: "Perfect. Sales optimization begins now. The funnel will be aligned for the highest conversion rate.",
    seo: "Understood. SEO analysis running. Keywords will be identified and a ranking strategy will be developed.",
    automation: "Good. Automation workflow is being configured. All processes will be optimized for maximum efficiency.",
    support: "Noted. Support content will be created. Top-level customer care will be ensured.",
    tiktok: "Perfect. Tia is on it. TikTok content with maximum virality potential — hook, script, hashtags, everything.",
    seo_specialist: "Understood. Sofia starts the SEO analysis. Keywords, technical audit and GEO optimization run in parallel.",
    email: "Noted. Emma is crafting the email sequence. Personalization, segmentation and deliverability guaranteed.",
    linkedin: "Excellent. Leon takes LinkedIn. High-quality content for maximum organic reach and lead generation.",
    orchestrator: "Perfect. Orion coordinates all agents. The optimal multi-agent workflow is being designed and executed.",
    workflow: "Understood. Wren maps the process. A scalable, efficient workflow with SOP will be delivered.",
    cfo: "Understood. Carl takes over the financial strategy. Capital allocation, cash flow and strategic planning will be analyzed.",
    financial_analyst: "Excellent. Fiona starts the analysis. Financial model, DCF valuation and scenarios will be detailed.",
    fpa: "Noted. Felix begins the FP&A work. Budget, forecast and variance analysis will be executed precisely.",
    bookkeeper: "Clear. Bianca handles the bookkeeping. All books will be maintained at the highest compliance level.",
    tax: "Understood. Tobias develops the tax strategy. Legal optimization and international planning will be executed.",
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

  const activeDeptObj = DEPARTMENTS.find((d) => d.id === activeDept);
  const activeDeptColor = activeDeptObj ? activeDeptObj.color : "#D4AF37";

  return (
    <div className="space-y-8">

      {/* Premium Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "8px",
          padding: "32px",
          marginBottom: "8px",
          background: "linear-gradient(135deg, rgba(212,175,55,0.07) 0%, rgba(8,8,8,0) 60%)",
          border: "1px solid rgba(212,175,55,0.15)",
        }}
      >
        {/* Ambient glow */}
        <div style={{ position: "absolute", top: "-40px", left: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Animated Crown Orb */}
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg, #D4AF37, #B8972E)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 30px rgba(212,175,55,0.4)", flexShrink: 0 }}>
            <Crown size={26} style={{ color: "#050505" }} />
          </div>
          <div>
            <div style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#D4AF37", marginBottom: "4px" }}>
              KI-Agentur · CEO Modus
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 700, color: "#fff", margin: 0 }}>
              {lang === "DE" ? "Dein CEO-Assistent" : "Your CEO Assistant"}
            </h1>
            <p style={{ fontSize: "13px", color: "#71717a", marginTop: "4px", marginBottom: 0 }}>
              {lang === "DE" ? "Delegiere Aufgaben an 18 KI-Spezialisten" : "Delegate tasks to 18 AI specialists"}
            </p>
          </div>
        </div>
      </motion.div>

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
          </div>

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

        {/* Department Cards — Premium Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full"
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px", marginTop: "8px" }}>
            {DEPARTMENTS.map((dept, i) => {
              const isActive = activeDept === dept.id;
              return (
                <motion.button
                  key={dept.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  whileHover={{ y: -2 }}
                  onClick={() => setActiveDept(isActive ? null : dept.id)}
                  style={{
                    background: isActive ? `${dept.color}12` : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isActive ? dept.color + "50" : "rgba(255,255,255,0.07)"}`,
                    borderRadius: "8px",
                    padding: "16px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: isActive ? `0 0 20px ${dept.color}18` : "none",
                  }}
                >
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: `${dept.color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
                    <dept.icon size={18} style={{ color: dept.color }} />
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#e4e4e7", marginBottom: "4px" }}>
                    {lang === "DE" ? dept.labelDE : dept.labelEN}
                  </div>
                  <div style={{ fontSize: "11px", color: "#52525b", lineHeight: 1.4 }}>
                    {lang === "DE" ? dept.descDE : dept.descEN}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Task Pills — Active Department */}
      {activeDept && (
        <motion.div
          key={activeDept}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            border: `1px solid ${activeDeptColor}25`,
            borderRadius: "10px",
            background: "rgba(255,255,255,0.015)",
            padding: "20px",
          }}
        >
          {/* Dept header */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", paddingBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {activeDeptObj && (
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${activeDeptColor}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <activeDeptObj.icon size={16} style={{ color: activeDeptColor }} />
              </div>
            )}
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#e4e4e7" }}>
                {activeDeptObj && (lang === "DE" ? activeDeptObj.labelDE : activeDeptObj.labelEN)}
              </div>
              <div style={{ fontSize: "11px", color: "#52525b" }}>
                {activeDeptObj && (lang === "DE" ? activeDeptObj.descDE : activeDeptObj.descEN)}
              </div>
            </div>
            <div style={{ marginLeft: "auto", fontSize: "10px", color: "#3f3f46", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              {lang === "DE" ? "Aufgabe wählen" : "Select task"}
            </div>
          </div>

          {/* Task Pills */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "16px" }}
          >
            {tasks[activeDept]?.map((task) => (
              <button
                key={task}
                onClick={() => handleTaskSelect(activeDept, task)}
                style={{
                  background: activeTask === task ? `${activeDeptColor}18` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${activeTask === task ? activeDeptColor + "40" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: "20px",
                  padding: "7px 14px",
                  fontSize: "12px",
                  color: activeTask === task ? "#e4e4e7" : "#71717a",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {task}
              </button>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* Thinking Indicator */}
      {isThinking && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", borderRadius: "12px", background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.12)" }}
        >
          <div style={{ display: "flex", gap: "5px" }}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#D4AF37" }}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
          <span style={{ fontSize: "13px", color: "#71717a" }}>
            {lang === "DE" ? "CEO analysiert die Aufgabe…" : "CEO is analyzing the task…"}
          </span>
        </motion.div>
      )}

      {/* CEO Response Box */}
      {ceoResponse && !isThinking && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            padding: "20px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(212,175,55,0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #D4AF37, #B8972E)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Crown size={13} style={{ color: "#050505" }} />
            </div>
            <span style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#D4AF37" }}>CEO Response</span>
          </div>
          <p style={{ fontSize: "14px", color: "#d4d4d8", lineHeight: 1.7, margin: 0 }}>{ceoResponse}</p>
        </motion.div>
      )}

      {/* Active task status */}
      {activeTask && !isThinking && ceoResponse && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 px-5 py-3 bg-[#0A0A0A] border border-white/8 rounded-sm"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-zinc-400">
            {lang === "DE" ? "Aufgabe delegiert & in Bearbeitung" : "Task delegated & in progress"}
          </span>
          <span className="ml-auto text-xs text-zinc-600 truncate max-w-[200px]">{activeTask}</span>
        </motion.div>
      )}
    </div>
  );
}

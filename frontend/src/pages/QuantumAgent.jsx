import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "@/context/AppContext";
import { AGENT_REGISTRY, DEMO_PROMPTS, orchestrateQuantumWorkflow } from "@/lib/quantumOrchestrator";
import { createMemoryPreviewFromWorkflow, memoryManager } from "@/lib/memory/memoryManager";
import { MEMORY_TYPE_DEFINITIONS } from "@/lib/memory/memoryTypes";
import { completeNextWorkflowStep, createWorkflow, startWorkflow, WORKFLOW_STATUSES } from "@/lib/workflowEngine";
import { clearQuantumHomePrompt, readQuantumHomePrompt } from "@/lib/quantumPromptTransfer";
import ActivityFeed from "@/components/quantum/ActivityFeed";
import OutputSummary from "@/components/quantum/OutputSummary";
import WorkflowInspector from "@/components/quantum/WorkflowInspector";
import WorkflowTimeline from "@/components/quantum/WorkflowTimeline";
import {
  Bot, TrendingUp, Palette, Video, ShoppingCart, Search, Zap, Headphones,
  ChevronDown, ArrowDown, User, Cpu, GitBranch, Crown, Music, Mail, Linkedin,
  Network, Workflow, BarChart2, BookOpen, FileText, CheckCircle2, Gauge, Coins, Sparkles,
  PlayCircle, Clock3, Target, Database, ShieldCheck, ToggleLeft, Megaphone, PenTool,
  MessageCircle, Settings, BarChart3, MessagesSquare,
} from "lucide-react";

// Agent identity (name, role, avatar, color) comes from the backend AGENTS
// registry (GET /agents) — the single source of truth also used by /agents
// (Specialists.jsx). Only the display icon per agent id is a frontend concern.
const AGENT_ICON_BY_ID = {
  ceo: Crown,
  marketing: Megaphone,
  designer: PenTool,
  content: FileText,
  video: Video,
  seo: Search,
  seo_specialist: Search,
  social: MessageCircle,
  sales: TrendingUp,
  analytics: BarChart3,
  automation: Settings,
  cfo: Coins,
  financial_analyst: BarChart2,
  fpa: TrendingUp,
  bookkeeper: BookOpen,
  tax: ShieldCheck,
  tiktok: Music,
  email: Mail,
  linkedin: Linkedin,
  orchestrator: Network,
  workflow: Workflow,
  coding: Cpu,
};

function AgentAvatar({ agent }) {
  const [hasImageError, setHasImageError] = useState(false);

  if (!agent.avatar || hasImageError) return null;

  return (
    <img
      src={agent.avatar}
      alt={`${agent.name} Avatar`}
      className="h-28 w-28 rounded-full object-cover sm:h-32 sm:w-32"
      style={{ filter: `drop-shadow(0 0 22px ${agent.color}66)` }}
      onError={() => setHasImageError(true)}
    />
  );
}

const DEPARTMENTS = [
  {
    id: "marketing",
    icon: TrendingUp,
    labelDE: "Marketing",
    labelEN: "Marketing",
    color: "#7C3AED",
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
    color: "#7C3AED",
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
    color: "#7C3AED",
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
    color: "#7C3AED",
    descDE: "Steueroptimierung, int. Steuerplanung & Compliance",
    descEN: "Tax optimization, international planning & compliance",
  },
];



const SPRINT_STAGES = [
  { id: "6.1", titleDE: "Agent Registry", titleEN: "Agent Registry", textDE: "Fähigkeiten, Rollen, Tools, Modelle, Kosten, Prioritäten sowie Ein- und Ausgaben erfassen.", textEN: "Capture capabilities, roles, tools, models, costs, priorities plus inputs and outputs." },
  { id: "6.2", titleDE: "Quantum Orchestrator", titleEN: "Quantum Orchestrator", textDE: "Nutzeranfrage analysieren, passende Agenten auswählen, Auswahl erklären und Ausführungsplan erstellen.", textEN: "Analyze the user request, select agents, explain the choice and create an execution plan." },
  { id: "6.3", titleDE: "Quantum Memory", titleEN: "Quantum Memory", textDE: "Markenwissen, Nutzerpräferenzen, Kampagnenhistorie, Performance und Empfehlungen speichern.", textEN: "Store brand knowledge, user preferences, campaign history, performance and recommendations." },
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

export default function QuantumAgent() {
  const [activeDept, setActiveDept] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [ceoResponse, setCeoResponse] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [orchestratorPrompt, setOrchestratorPrompt] = useState(DEMO_PROMPTS[0]);
  const [orchestratorResult, setOrchestratorResult] = useState(null);
  const [orchestratorThinking, setOrchestratorThinking] = useState(false);
  const [workflow, setWorkflow] = useState(null);
  const [autoMemory, setAutoMemory] = useState(false);
  const [memoryApprovalReady, setMemoryApprovalReady] = useState(false);
  const [agents, setAgents] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const transferredPromptConsumed = useRef(false);
  const lang = localStorage.getItem("kc_lang") || "DE";

  useEffect(() => {
    axios.get(`${API}/agents`).then((res) => setAgents(res.data || [])).catch(() => setAgents([]));
  }, []);

  useEffect(() => {
    if (transferredPromptConsumed.current) return;
    const transfer = readQuantumHomePrompt(location.state);
    if (!transfer?.prompt) return;
    transferredPromptConsumed.current = true;
    setOrchestratorPrompt(transfer.prompt);
    clearQuantumHomePrompt();
    if (location.state?.quantumPrompt) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);


  const tasks = lang === "DE" ? TASKS_DE : TASKS_EN;
  const memoryProvider = memoryManager.getProvider();
  const memoryFoundationCards = Object.entries(MEMORY_TYPE_DEFINITIONS);
  const memoryPreview = useMemo(() => createMemoryPreviewFromWorkflow(orchestratorResult), [orchestratorResult]);

  const ceoResponsesDE = {
    marketing: "Verstanden. Ich delegiere diese Aufgabe an das Marketing-Team. Strategie wird analysiert und ein detaillierter Aktionsplan wird entwickelt.",
    design: "Klar. Das Design-Team übernimmt. Alle Materialien werden im Corporate Design von Brandmind erstellt.",
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
    design: "Clear. Design team is taking over. All materials will be created in Brandmind corporate design.",
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

  const registryPreview = useMemo(() => AGENT_REGISTRY.map((agent) => ({
    ...agent,
    match: 90,
    personaDE: `${agent.name} orchestriert ${agent.role} mit ${agent.skills.slice(0, 3).join(", ")}.`,
    personaEN: `${agent.name} orchestrates ${agent.role} with ${agent.skills.slice(0, 3).join(", ")}.`,
    reasonDE: `${agent.name} passt, weil die Registry Skills und Outputs strukturiert bereitstellt.`,
    reasonEN: `${agent.name} fits because the registry exposes skills and outputs in a structured way.`,
    tools: agent.outputs,
  })), []);

  const handleOrchestrate = (prompt = orchestratorPrompt) => {
    setOrchestratorPrompt(prompt);
    setOrchestratorThinking(true);
    setOrchestratorResult(null);
    setWorkflow(null);
    setMemoryApprovalReady(false);
    setTimeout(() => {
      const result = orchestrateQuantumWorkflow(prompt);
      setOrchestratorResult(result);
      setWorkflow(createWorkflow(result));
      setMemoryApprovalReady(true);
      setOrchestratorThinking(false);
    }, 900);
  };


  const handleStartWorkflow = () => {
    if (!workflow || workflow.status === WORKFLOW_STATUSES.RUNNING) return;
    setWorkflow((currentWorkflow) => startWorkflow(currentWorkflow));
  };

  useEffect(() => {
    if (!workflow || workflow.status !== WORKFLOW_STATUSES.RUNNING) return undefined;
    const timer = setTimeout(() => {
      setWorkflow((currentWorkflow) => completeNextWorkflowStep(currentWorkflow));
    }, 700);
    return () => clearTimeout(timer);
  }, [workflow]);

  const activeDeptObj = DEPARTMENTS.find((d) => d.id === activeDept);
  const activeDeptColor = activeDeptObj ? activeDeptObj.color : "#7C3AED";

  return (
    <div className="max-w-full space-y-6 overflow-x-hidden sm:space-y-8">

      {/* Premium Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "8px",
          padding: "clamp(20px, 5vw, 32px)",
          marginBottom: "8px",
          background: "linear-gradient(135deg, rgba(124,58,237,0.07) 0%, rgba(8,8,8,0) 60%)",
          border: "1px solid rgba(124,58,237,0.15)",
        }}
      >
        {/* Ambient glow */}
        <div style={{ position: "absolute", top: "-40px", left: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", minWidth: 0 }}>
          {/* Animated Crown Orb */}
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg, #7C3AED, #6D28D9)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 30px rgba(124,58,237,0.4)", flexShrink: 0 }}>
            <Crown size={26} style={{ color: "#050505" }} />
          </div>
          <div style={{ minWidth: 0, flex: "1 1 220px" }}>
            <div style={{ fontSize: "10px", letterSpacing: "clamp(0.16em, 0.7vw, 0.3em)", textTransform: "uppercase", color: "#7C3AED", marginBottom: "4px" }}>
              KI-Agentur · Quantum Command
            </div>
            <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 700, color: "#fff", margin: 0 }}>
              {lang === "DE" ? "Dein Quantum Intelligence Core" : "Your Quantum Intelligence Core"}
            </h1>
            <p style={{ fontSize: "13px", color: "#71717a", marginTop: "4px", marginBottom: 0 }}>
              {lang === "DE" ? "Delegiere Aufgaben an 18 KI-Spezialisten" : "Delegate tasks to 18 AI specialists"}
            </p>
          </div>
        </div>
      </motion.div>

      <section className="min-w-0 rounded-sm border border-[#7C3AED]/20 bg-[#070707] p-4 sm:p-5">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#A78BFA]">BrandMind Quantum</div>
            <h2 className="mt-1 text-2xl font-bold text-white">{lang === "DE" ? "Agenten" : "Agents"}</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {lang === "DE" ? "BrandMind Agenten arbeiten zusammen, um deine Ziele zu erreichen." : "BrandMind agents work together to achieve your goals."}
            </p>
          </div>
          <span className="rounded-full border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[#C4B5FD]">
            {agents.length} {lang === "DE" ? "aktive Agenten" : "active agents"}
          </span>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {agents.map((agent) => {
            const Icon = AGENT_ICON_BY_ID[agent.id] || Bot;

            return (
              <motion.article
                key={agent.id}
                whileHover={{ y: -4, scale: 1.01 }}
                className="group relative min-w-0 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 text-center shadow-2xl shadow-black/30 transition-colors hover:border-[#7C3AED]/50"
              >
                <div className="pointer-events-none absolute inset-x-8 top-6 h-24 rounded-full blur-3xl opacity-25 transition-opacity group-hover:opacity-45" style={{ backgroundColor: agent.color }} />
                <div className="relative mx-auto mb-4 flex justify-center">
                  <AgentAvatar agent={agent} />
                  <div
                    className="absolute bottom-0 right-[calc(50%-68px)] flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${agent.color}, #4C1D95)` }}
                  >
                    <Icon size={22} />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                <p className="mx-auto mt-2 max-w-[15rem] text-sm leading-6 text-zinc-400">{lang === "DE" ? agent.role_de : agent.role_en}</p>
              </motion.article>
            );
          })}
        </div>
      </section>




      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { labelDE: "Prioritäten", labelEN: "Priorities", itemsDE: ["Kampagnenziel schärfen", "Team-Agenten auswählen"], itemsEN: ["Sharpen campaign goal", "Select team agents"] },
          { labelDE: "Chancen", labelEN: "Opportunities", itemsDE: ["Facebook-Kampagne bündeln", "Design + Copy parallelisieren"], itemsEN: ["Bundle Facebook campaign", "Parallelize design + copy"] },
          { labelDE: "Risiken", labelEN: "Risks", itemsDE: ["Briefing-Lücken vermeiden", "Freigaben früh setzen"], itemsEN: ["Avoid briefing gaps", "Set approvals early"] },
          { labelDE: "Automationen", labelEN: "Automations", itemsDE: ["Asset-Export vorbereiten", "Analytics-Check anhängen"], itemsEN: ["Prepare asset export", "Attach analytics check"] },
        ].map((block) => (
          <div key={block.labelDE} className="rounded-sm border border-[#7C3AED]/20 bg-[#0A0A0A] p-4">
            <div className="mb-3 text-[10px] uppercase tracking-[0.2em] text-[#A78BFA]">
              {lang === "DE" ? block.labelDE : block.labelEN}
            </div>
            <ul className="space-y-2 text-xs text-zinc-400">
              {(lang === "DE" ? block.itemsDE : block.itemsEN).map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
        ))}
      </div>



      <div className="min-w-0 rounded-sm border border-[#7C3AED]/20 bg-[#070707] p-4 sm:p-5">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-semibold text-white"><Database size={16} className="text-[#7C3AED]" /> Quantum Memory Foundation</div>
            <p className="mt-1 text-xs text-zinc-500">{lang === "DE" ? "Austauschbare Memory-Schicht für BrandMind-Wissen, Projektlernen und spätere agimem/MCP-Anbindung." : "Swappable memory layer for BrandMind knowledge, project learning and future agimem/MCP integration."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="max-w-full rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-emerald-300 sm:tracking-[0.18em]">Status: {memoryProvider.label}</span>
            <span className="max-w-full rounded-full border border-[#7C3AED]/25 bg-[#7C3AED]/10 px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-[#C4B5FD] sm:tracking-[0.18em]">Future: agimem / MCP-ready</span>
          </div>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {memoryFoundationCards.map(([type, definition]) => (
            <div key={type} className="min-w-0 overflow-hidden rounded-sm border border-white/8 bg-black/35 p-4">
              <div className="mb-2 text-sm font-semibold text-white">{definition.label}</div>
              <p className="mb-3 text-xs leading-5 text-zinc-500">{definition.description}</p>
              <div className="mb-3 flex flex-wrap gap-1.5">{definition.fields.slice(0, 4).map((field) => <span key={field} className="max-w-full break-words rounded-full border border-white/10 px-2 py-1 text-[10px] text-zinc-400">{field}</span>)}</div>
              <ul className="space-y-1 text-[11px] text-zinc-500">{definition.examples.map((example) => <li key={example}>• {example}</li>)}</ul>
              <div className="mt-4 space-y-1 text-[10px] uppercase tracking-[0.16em] text-[#A78BFA]"><div>Status: Local Demo Provider</div><div>Zukunft: agimem / MCP-ready</div></div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-sm border border-white/8 bg-white/[0.02] p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-white"><ShieldCheck size={14} className="text-[#A78BFA]" /> Human Approval Vorbereitung</div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-zinc-500">{lang === "DE" ? "Memory wird in diesem Sprint nur als Vorschau erzeugt. Speichern ist später erst nach Nutzerfreigabe oder aktivem Auto Memory vorgesehen." : "This sprint only generates memory previews. Later saves require user approval or enabled Auto Memory."}</p>
            <button type="button" onClick={() => setAutoMemory((value) => !value)} className={`flex max-w-full shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] ${autoMemory ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-black/30 text-zinc-400"}`}><ToggleLeft size={14} /> Auto Memory: {autoMemory ? "On" : "Off"}</button>
          </div>
        </div>
      </div>

      <div className="min-w-0 rounded-sm border border-[#7C3AED]/20 bg-[#070707] p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-semibold text-white"><PlayCircle size={16} className="text-[#7C3AED]" /> Quantum Orchestrator Engine</div>
            <p className="mt-1 text-xs text-zinc-500">{lang === "DE" ? "Beschreibe eine Aufgabe. Quantum analysiert Ziel, Kontext, Output, Plattform und baut einen Workflow-Vorschlag." : "Describe a task. Quantum analyzes goal, context, output, platform and builds a workflow proposal."}</p>
          </div>
          <div className="flex flex-wrap gap-2">{DEMO_PROMPTS.map((prompt) => <button key={prompt} onClick={() => handleOrchestrate(prompt)} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-zinc-300 hover:border-[#7C3AED]/50">{prompt}</button>)}</div>
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
          <textarea value={orchestratorPrompt} onChange={(event) => setOrchestratorPrompt(event.target.value)} className="min-h-[92px] flex-1 rounded-sm border border-white/10 bg-black/40 p-3 text-sm text-zinc-200 outline-none focus:border-[#7C3AED]/60" placeholder={lang === "DE" ? "z. B. Erstelle eine Facebook-Kampagne für BrandMind." : "e.g. Create a Facebook campaign for BrandMind."} />
          <div className="flex min-w-0 flex-col gap-2 md:w-[190px] md:shrink-0"><button onClick={() => handleOrchestrate()} className="rounded-sm border border-[#7C3AED]/40 bg-[#7C3AED]/20 px-5 py-3 text-sm font-semibold text-[#DDD6FE] hover:bg-[#7C3AED]/30">{lang === "DE" ? "Workflow-Vorschlag erstellen" : "Create workflow proposal"}</button><button onClick={handleStartWorkflow} disabled={!workflow || workflow.status === WORKFLOW_STATUSES.RUNNING || workflow.status === WORKFLOW_STATUSES.COMPLETED} className="rounded-sm border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40">{workflow?.status === WORKFLOW_STATUSES.RUNNING ? (lang === "DE" ? "Workflow wird ausgeführt…" : "Workflow executing…") : (lang === "DE" ? "Vorbereiteten Workflow starten" : "Start prepared workflow")}</button></div>
        </div>
        {orchestratorThinking && <div className="mt-4 flex items-center gap-3 rounded-sm border border-[#7C3AED]/20 bg-[#7C3AED]/10 p-3 text-sm text-[#C4B5FD]"><Clock3 size={16} className="animate-pulse" /> {lang === "DE" ? "Analyse läuft… Ziel, Skills und Agenten werden gematcht." : "Analysis running… matching goal, skills and agents."}</div>}
        {orchestratorResult && !orchestratorThinking && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-4">
          <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3">{[[lang === "DE" ? "Ziel erkannt" : "Detected goal", orchestratorResult.analysis.goal], [lang === "DE" ? "Kontext" : "Context", orchestratorResult.analysis.industry], [lang === "DE" ? "Output / Plattform" : "Output / platform", `${orchestratorResult.analysis.desiredOutput} · ${orchestratorResult.analysis.platform}`]].map(([label, value]) => <div key={label} className="min-w-0 overflow-hidden rounded-sm border border-white/8 bg-black/35 p-4"><div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[#A78BFA]"><Target size={12} />{label}</div><div className="break-words text-sm text-zinc-200">{value}</div></div>)}</div>
          <div className="min-w-0 overflow-hidden rounded-sm border border-white/8 bg-black/35 p-4"><div className="mb-3 text-xs font-semibold text-white">{lang === "DE" ? "Benötigte Fähigkeiten" : "Required skills"}</div><div className="flex flex-wrap gap-2">{orchestratorResult.analysis.requiredSkills.map((skill) => <span key={skill} className="max-w-full break-words rounded-full border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-3 py-1 text-xs text-[#C4B5FD]">{skill}</span>)}</div></div>
          <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2">{orchestratorResult.selectedAgents.map((agent) => <div key={agent.id} className="rounded-sm border border-white/8 bg-white/[0.02] p-4"><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><div className="min-w-0 break-words font-semibold text-white">{agent.name}</div><span className="shrink-0 text-xs text-[#A78BFA]">{agent.matchScore}% match</span></div><div className="mb-2 break-words text-xs text-zinc-400">{agent.selectionReason}</div><div className="break-words text-[11px] text-zinc-500">{lang === "DE" ? "Rolle" : "Role"}: {agent.recommendedRole} · {lang === "DE" ? "Passend" : "Matching"}: {agent.matchingSkills.join(", ") || "—"}</div></div>)}</div>
          <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"><WorkflowTimeline workflow={workflow} /><ActivityFeed workflow={workflow} /></div>
          <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2"><OutputSummary workflow={workflow} /><WorkflowInspector workflow={workflow} /></div>
          {memoryPreview.length > 0 && <div className="rounded-sm border border-[#7C3AED]/25 bg-[#7C3AED]/5 p-4">
            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div><div className="text-sm font-semibold text-white">{lang === "DE" ? "Was Quantum daraus speichern würde" : "What Quantum would store from this"}</div><div className="mt-1 text-xs text-zinc-500">Preview only · {memoryApprovalReady ? "Human Approval pending" : "No workflow preview"} · Auto Memory {autoMemory ? "On" : "Off"}</div></div>
              <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-amber-200">Nicht automatisch gespeichert</span>
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3">{memoryPreview.map((block) => <div key={block.type} className="rounded-sm border border-white/8 bg-black/35 p-3"><div className="mb-2 text-xs font-semibold text-[#C4B5FD]">{block.title}</div><ul className="space-y-1 text-xs text-zinc-500">{block.items.map((item) => <li key={item}>• {item}</li>)}</ul></div>)}</div>
          </div>}
        </motion.div>}
      </div>

      <div className="min-w-0 rounded-sm border border-[#7C3AED]/20 bg-[#070707] p-4 sm:p-5">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-semibold text-white">
              <Cpu size={16} className="text-[#7C3AED]" /> Agent Capability Engine
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {lang === "DE"
                ? "Quantum entscheidet nicht aus fest codierten Regeln, sondern aus einer strukturierten Agent Registry."
                : "Quantum does not decide from hard-coded rules, but from a structured agent registry."}
            </p>
          </div>
          <div className="max-w-full rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-emerald-300 sm:tracking-[0.18em]">
            {lang === "DE" ? "Sprint 6 Fundament" : "Sprint 6 foundation"}
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {SPRINT_STAGES.map((stage) => (
            <div key={stage.id} className="min-w-0 overflow-hidden rounded-sm border border-white/8 bg-black/35 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-white">
                <span className="rounded-full bg-[#7C3AED]/15 px-2 py-0.5 text-[#A78BFA]">Sprint {stage.id}</span>
                {lang === "DE" ? stage.titleDE : stage.titleEN}
              </div>
              <p className="text-xs leading-5 text-zinc-500">{lang === "DE" ? stage.textDE : stage.textEN}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {registryPreview.map((agent) => (
            <div key={agent.id} className="rounded-sm border border-white/8 bg-white/[0.02] p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{agent.name}</div>
                  <div className="mt-1 text-[11px] leading-4 text-zinc-500">{lang === "DE" ? agent.personaDE : agent.personaEN}</div>
                </div>
                <div className="rounded-full bg-[#7C3AED]/15 px-2 py-1 text-[11px] font-semibold text-[#C4B5FD]">{agent.match}%</div>
              </div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {agent.skills.slice(0, 4).map((skill) => <span key={skill} className="max-w-full break-words rounded-full border border-white/10 px-2 py-1 text-[10px] text-zinc-400">{skill}</span>)}
              </div>
              <div className="space-y-2 text-[11px] text-zinc-500">
                <div className="flex items-center gap-2"><Gauge size={12} className="text-[#A78BFA]" /> {agent.priority} priority</div>
                <div className="flex items-center gap-2"><Coins size={12} className="text-[#A78BFA]" /> {agent.cost} cost</div>
                <div className="flex items-center gap-2"><Sparkles size={12} className="text-[#A78BFA]" /> {agent.tools.slice(0, 2).join(" · ")}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-sm border border-[#7C3AED]/20 bg-black/30 p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <CheckCircle2 size={16} className="text-[#7C3AED]" /> {lang === "DE" ? "Quantum erklärt seine Auswahl" : "Quantum explains its selection"}
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {registryPreview.slice(0, 4).map((agent) => (
            <div key={agent.id} className="rounded-sm border border-white/8 bg-[#0A0A0A] p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="min-w-0 break-words font-semibold text-white">✔ {agent.name}</div>
                <span className="text-[10px] text-[#A78BFA]">{agent.match}% match</span>
              </div>
              <p className="text-xs leading-5 text-zinc-500"><span className="text-zinc-300">{lang === "DE" ? "Grund:" : "Reason:"}</span> {lang === "DE" ? agent.reasonDE : agent.reasonEN}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-sm border border-white/8 bg-black/30 p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <GitBranch size={16} className="text-[#7C3AED]" /> Agent Timeline
        </div>
        <div className="space-y-3 text-xs">
          {[
            ["08:42", "🟢 Quantum AI", lang === "DE" ? "Aufgabe analysiert" : "Task analyzed"],
            ["08:43", "✔ Marketing Agent", lang === "DE" ? "Kampagnenstruktur erstellt" : "Campaign structure drafted"],
            ["08:44", "✔ Design Agent", lang === "DE" ? "Grafik-Briefing vorbereitet" : "Design brief prepared"],
            ["08:45", "… Video Agent", lang === "DE" ? "Reel wird geplant" : "Planning reel"],
            ["08:46", "🔵 Analytics Agent", lang === "DE" ? "wartet auf Zielgruppe" : "waiting for audience"],
          ].map(([time, agent, state]) => (
            <div key={time} className="grid grid-cols-1 gap-1 border-l border-[#7C3AED]/25 pl-4 text-zinc-500 sm:grid-cols-[52px_minmax(0,1fr)_minmax(0,1.4fr)] sm:gap-3">
              <span>{time}</span><span className="text-zinc-200">{agent}</span><span>{state}</span>
            </div>
          ))}
        </div>
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

        {/* Quantum Node */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col items-center"
        >
          <div className="relative flex w-full max-w-[240px] items-center justify-center gap-3 rounded-sm border-2 border-[#7C3AED]/60 bg-[#7C3AED]/10 px-5 py-4 sm:gap-4 sm:px-8">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#7C3AED] text-white text-[10px] font-bold tracking-widest uppercase rounded-full">
              CORE
            </div>
            <Bot size={22} className="text-[#7C3AED]" />
            <div>
              <div className="text-base font-semibold text-[#7C3AED]">Quantum</div>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(160px, 100%), 1fr))", gap: "12px", marginTop: "8px" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", paddingBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap", minWidth: 0 }}>
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
          style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", borderRadius: "12px", background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.12)" }}
        >
          <div style={{ display: "flex", gap: "5px" }}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#7C3AED" }}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
          <span style={{ fontSize: "13px", color: "#71717a" }}>
            {lang === "DE" ? "Quantum analysiert die Aufgabe…" : "Quantum is analyzing the task…"}
          </span>
        </motion.div>
      )}

      {/* Quantum Response Box */}
      {ceoResponse && !isThinking && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            padding: "20px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(124,58,237,0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #7C3AED, #6D28D9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Crown size={13} style={{ color: "#050505" }} />
            </div>
            <span style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#7C3AED" }}>Quantum Response</span>
          </div>
          <p style={{ fontSize: "14px", color: "#d4d4d8", lineHeight: 1.7, margin: 0 }}>{ceoResponse}</p>
        </motion.div>
      )}

      {/* Active task status */}
      {activeTask && !isThinking && ceoResponse && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex min-w-0 flex-wrap items-center gap-3 rounded-sm border border-white/8 bg-[#0A0A0A] px-4 py-3 sm:px-5"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-zinc-400">
            {lang === "DE" ? "Aufgabe delegiert & in Bearbeitung" : "Task delegated & in progress"}
          </span>
          <span className="min-w-0 text-xs text-zinc-600 sm:ml-auto sm:max-w-[200px] sm:truncate">{activeTask}</span>
        </motion.div>
      )}
    </div>
  );
}

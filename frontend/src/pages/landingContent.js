import {
  Palette, Film, Search, Megaphone, BarChart2, Workflow, Wallet, BrainCircuit,
  Sparkles, FileText, Rocket, Building2, Users,
} from "lucide-react";

export const STEPS = [
  {
    n: "01",
    de: { title: "Marke aufsetzen", body: "Lege Tonalität, Design, Zielgruppe und Ziele einmal fest — Quantum lernt deine Marke bis ins Detail." },
    en: { title: "Set up your brand", body: "Define tone, design, audience and goals once — Quantum learns your brand down to the details." },
  },
  {
    n: "02",
    de: { title: "Quantum briefen", body: "Sag Brandmind, was du brauchst. Quantum erstellt nachvollziehbare Vorschläge und koordiniert passende Spezialagenten." },
    en: { title: "Brief Quantum", body: "Tell Brandmind what you need. Quantum creates transparent proposals and coordinates matching specialist agents." },
  },
  {
    n: "03",
    de: { title: "Ergebnisse prüfen", body: "Erhalte markenkonforme Entwürfe, Skripte, Prompts und Kampagnenpläne, die du prüfen und weiterverwenden kannst." },
    en: { title: "Review results", body: "Get on-brand drafts, scripts, prompts and campaign plans that you can review and reuse." },
  },
];

export const FEATURES = [
  { id: "design", icon: Palette, de: ["Design Studio", "Anzeigen, Grafiken & Vorlagen im Markenstil."], en: ["Design Studio", "On-brand ads, graphics & templates."] },
  { id: "social", icon: Megaphone, de: ["Social Media", "Posts für jede Plattform aus einem Prompt."], en: ["Social Media", "Platform-ready posts from a single prompt."] },
  { id: "video", icon: Film, status: "development", de: ["Video Studio", "Skripte, Storyboards und Prompts für Kurzvideos."], en: ["Video Studio", "Scripts, storyboards and prompts for short-form video."] },
  { id: "seo", icon: Search, de: ["SEO Studio", "Keyword-Strategie & Content, das rankt."], en: ["SEO Studio", "Keyword strategy & content that ranks."] },
  { id: "analytics", icon: BarChart2, status: "beta", de: ["Analytics", "Auswertungen, sobald echte Datenquellen verbunden sind."], en: ["Analytics", "Insights once real data sources are connected."] },
  { id: "automation", icon: Workflow, status: "beta", de: ["Automation", "Workflow-Entwürfe und Übergaben mit menschlicher Freigabe."], en: ["Automation", "Workflow drafts and handoffs with human approval."] },
  { id: "finance", icon: Wallet, status: "development", de: ["Finance Studio", "Strukturierende Finanz- und Steuer-Vorbereitung, keine Beratung."], en: ["Finance Studio", "Structured finance and tax preparation, not advice."] },
  { id: "quantum", icon: BrainCircuit, de: ["Quantum Orchestrator", "Ein Agent delegiert an dein gesamtes KI-Team."], en: ["Quantum Orchestrator", "One agent that delegates across your whole AI team."] },
];

export const BENEFITS = {
  DE: [
    "Ein System statt 12 Einzellösungen — kein Tool-Chaos mehr.",
    "Schneller von der Idee zu prüfbaren Entwürfen.",
    "Alle Inhalte in einem konsistenten Markenton, auf jedem Kanal.",
    "Skalierbar ohne mehr Personal — vom Solo-Gründer bis zur Agentur.",
    "Weniger Abstimmung, mehr Umsetzung.",
  ],
  EN: [
    "One system instead of 12 point solutions — no more tool chaos.",
    "Faster from idea to review-ready drafts.",
    "Every piece of content in one consistent brand voice, on every channel.",
    "Scales without more headcount — from solo founder to agency.",
    "Less back-and-forth, more shipping.",
  ],
};

export const AUDIENCES = [
  {
    icon: Rocket,
    de: { title: "Für Gründer", body: "Baue Marke, Content und Sichtbarkeit auf — ganz ohne großes Team." },
    en: { title: "For founders", body: "Build brand, content and visibility — without a big team." },
  },
  {
    icon: Building2,
    de: { title: "Für Unternehmen", body: "Standardisiere Marketingprozesse und halte deine Marke über alle Kanäle konsistent." },
    en: { title: "For companies", body: "Standardize marketing processes and keep your brand consistent across every channel." },
  },
  {
    icon: Users,
    de: { title: "Für Agenturen", body: "Skaliere Kundenarbeit schneller mit KI-gestützten Workflows und mehr Kapazität pro Kopf." },
    en: { title: "For agencies", body: "Scale client work faster with AI-powered workflows and more output per head." },
  },
];

export const OUTPUT_SAMPLES = [
  { icon: Megaphone, tag: { DE: "Social Post", EN: "Social post" }, de: "„Dein Montag beginnt anders. 3 Schritte, ein System, null Chaos.“", en: "“Your Monday starts differently. 3 steps, one system, zero chaos.”" },
  { icon: Search, tag: { DE: "SEO-Briefing", EN: "SEO brief" }, de: "Fokus-Keyword: „KI Marketing System“ · Suchintention: informational · 6 H2-Vorschläge", en: "Focus keyword: “AI marketing system” · Intent: informational · 6 H2 suggestions" },
  { icon: Film, tag: { DE: "Reel-Script", EN: "Reel script" }, de: "Hook (0-2s): „So sieht dein Marketing-Team 2027 aus.“ → 3 Cuts → CTA", en: "Hook (0-2s): “This is what your marketing team looks like in 2027.” → 3 cuts → CTA" },
  { icon: FileText, tag: { DE: "Landingpage", EN: "Landing page" }, de: "Headline, Nutzenblöcke, FAQ und CTA als prüfbarer Entwurf im Markenton.", en: "Headline, benefit blocks, FAQ and CTA as a review-ready on-brand draft." },
  { icon: Sparkles, tag: { DE: "Kampagne", EN: "Campaign" }, de: "1 Thema → Vorschläge für Posts, Werbetext und visuelle Prompts.", en: "1 topic → suggestions for posts, ad copy and visual prompts." },
];

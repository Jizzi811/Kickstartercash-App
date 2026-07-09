import {
  Palette, Film, Search, Megaphone, BarChart2, Workflow, Wallet, BrainCircuit,
  Sparkles, FileText, TrendingUp, Rocket, Building2, Users,
} from "lucide-react";

export const STEPS = [
  {
    n: "01",
    de: { title: "Marke aufsetzen", body: "Lege Tonalität, Design, Zielgruppe und Ziele einmal fest — Quantum lernt deine Marke bis ins Detail." },
    en: { title: "Set up your brand", body: "Define tone, design, audience and goals once — Quantum learns your brand down to the details." },
  },
  {
    n: "02",
    de: { title: "Quantum briefen", body: "Sag Brandmind, was du brauchst. Dein KI-Mitarbeiterstab übernimmt Content, Design, SEO, Video & mehr — sofort." },
    en: { title: "Brief Quantum", body: "Tell Brandmind what you need. Your AI staff takes over content, design, SEO, video & more — instantly." },
  },
  {
    n: "03",
    de: { title: "Ergebnisse veröffentlichen", body: "Erhalte markenkonformen Content, Designs und Kampagnen — exportfertig oder direkt live." },
    en: { title: "Publish results", body: "Get on-brand content, designs and campaigns — export-ready or published directly." },
  },
];

export const FEATURES = [
  { id: "design", icon: Palette, de: ["Design Studio", "Anzeigen, Grafiken & Vorlagen im Markenstil."], en: ["Design Studio", "On-brand ads, graphics & templates."] },
  { id: "social", icon: Megaphone, de: ["Social Media", "Posts für jede Plattform aus einem Prompt."], en: ["Social Media", "Platform-ready posts from a single prompt."] },
  { id: "video", icon: Film, de: ["Video Studio", "Kurzvideos & Schnitt für TikTok, Reels & Shorts."], en: ["Video Studio", "Short-form video & editing for TikTok, Reels & Shorts."] },
  { id: "seo", icon: Search, de: ["SEO Studio", "Keyword-Strategie & Content, das rankt."], en: ["SEO Studio", "Keyword strategy & content that ranks."] },
  { id: "analytics", icon: BarChart2, de: ["Analytics", "Marketing-Score & Performance auf einen Blick."], en: ["Analytics", "Marketing score & performance at a glance."] },
  { id: "automation", icon: Workflow, de: ["Automation", "Workflows, die Kampagnen selbst weiterlaufen lassen."], en: ["Automation", "Workflows that keep campaigns running on their own."] },
  { id: "finance", icon: Wallet, de: ["Finance Studio", "CFO-, Buchhaltungs- & Steuer-Agenten für dein Business."], en: ["Finance Studio", "CFO, bookkeeping & tax agents for your business."] },
  { id: "quantum", icon: BrainCircuit, de: ["Quantum Orchestrator", "Ein Agent delegiert an dein gesamtes KI-Team."], en: ["Quantum Orchestrator", "One agent that delegates across your whole AI team."] },
];

export const BENEFITS = {
  DE: [
    "Ein System statt 12 Einzellösungen — kein Tool-Chaos mehr.",
    "Schneller von der Idee zur Veröffentlichung.",
    "Alle Inhalte in einem konsistenten Markenton, auf jedem Kanal.",
    "Skalierbar ohne mehr Personal — vom Solo-Gründer bis zur Agentur.",
    "Weniger Abstimmung, mehr Umsetzung.",
  ],
  EN: [
    "One system instead of 12 point solutions — no more tool chaos.",
    "Faster from idea to publish.",
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
  { icon: FileText, tag: { DE: "Landingpage", EN: "Landing page" }, de: "Headline, 3 Benefit-Blöcke, Social Proof & CTA — vollständig im Markenton.", en: "Headline, 3 benefit blocks, social proof & CTA — fully on brand voice." },
  { icon: TrendingUp, tag: { DE: "Marketing-Score", EN: "Marketing score" }, de: "92/100 · Markenkonformität ✓ · Tonalität ✓ · CTA-Stärke ✓", en: "92/100 · Brand match ✓ · Tone match ✓ · CTA strength ✓" },
  { icon: Sparkles, tag: { DE: "Kampagne", EN: "Campaign" }, de: "1 Thema → Posts, Werbetext & Markenbild gleichzeitig erzeugt.", en: "1 topic → posts, ad copy & brand image generated at once." },
];

export const TESTIMONIALS = [
  {
    q: {
      DE: "„Wir haben unsere Content-Erstellung von drei Tagen auf wenige Stunden reduziert — und alles bleibt endlich in einer einheitlichen Markenlinie, auch wenn drei Leute gleichzeitig arbeiten.“",
      EN: "“We cut our content production from three days to a few hours — and everything finally stays on one brand line, even with three people creating at once.”",
    },
    name: "Lena K.", role: { DE: "Gründerin, D2C-Marke", EN: "Founder, D2C brand" },
  },
  {
    q: {
      DE: "„Statt fünf Tools zu jonglieren, briefe ich einen Agenten. Design, Copy und SEO kommen im gleichen Ton zurück — das spart uns pro Kampagne locker einen Arbeitstag.“",
      EN: "“Instead of juggling five tools, I brief one agent. Design, copy and SEO all come back in the same voice — that saves us a full workday per campaign.”",
    },
    name: "Marco T.", role: { DE: "Marketing Lead, Agentur", EN: "Marketing lead, agency" },
  },
  {
    q: {
      DE: "„Als Solo-Gründerin fühlt es sich an, als hätte ich ein ganzes Marketing-Team eingestellt — ohne die Gehaltsliste.“",
      EN: "“As a solo founder it feels like I hired an entire marketing team — without the payroll.”",
    },
    name: "Sophie R.", role: { DE: "Founder, Coaching-Business", EN: "Founder, coaching business" },
  },
];

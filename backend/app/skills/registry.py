"""BrandMind AI Skill Registry.

Skills are reusable capabilities that agents load dynamically. Agents no longer
own hardcoded tool lists; they receive skill references from this registry.
"""
from __future__ import annotations

from typing import Dict, List, Optional

CATEGORIES = [
    "Marketing", "Research", "Copywriting", "SEO", "Image", "Video", "Voice",
    "Automation", "Analytics", "Business", "Planning", "Review", "Quality Assurance",
    "Product", "Pricing", "Paid Media", "Legal", "Support", "UX",
]

_BASE_INPUT = {"type": "object", "required": ["context"], "properties": {"context": {"type": "string"}}}
_TEXT_OUTPUT = {"type": "object", "properties": {"reply": {"type": "string"}, "meta": {"type": "object"}}}

SKILLS: Dict[str, dict] = {}

def _skill(id: str, name: str, category: str, description: str, prompt_de: str, prompt_en: str,
           agents: List[str], icon: str = "Sparkles", version: str = "1.0.0",
           required_memory: Optional[List[str]] = None, required_dna: Optional[List[str]] = None,
           required_tools: Optional[List[str]] = None, required_providers: Optional[List[str]] = None,
           cost: str = "low", runtime: str = "20-45s", permission: str = "execute",
           skill_type: str = "llm"):
    SKILLS[id] = {
        "id": id, "name": name, "label": name, "label_en": name, "description": description,
        "category": category, "input_schema": _BASE_INPUT, "output_schema": _TEXT_OUTPUT,
        "required_memory": required_memory or ["brand", "business", "experience"],
        "required_dna": required_dna or ["tone", "visual_style", "audience"],
        "required_tools": required_tools or [], "required_providers": required_providers or ["chat", "structured_output"],
        "cost_estimate": cost, "average_runtime": runtime, "version": version,
        "permissions": [permission], "prompt_de": prompt_de, "prompt_en": prompt_en,
        "agent_ids": agents, "icon": icon, "type": skill_type, "status": "active",
    }

_skill("campaign_planner", "Campaign Planner", "Marketing", "Plans a complete campaign from objective to channel mix, funnel and KPI plan.", "Erstelle einen vollständigen Kampagnenplan mit Ziel, Zielgruppe, Funnel, Kanälen, Budget, Content-Plan, KPIs und nächsten Schritten für: ", "Create a complete campaign plan with objective, audience, funnel, channels, budget, content plan, KPIs and next steps for: ", ["ceo", "content", "orchestrator"], "Map")
_skill("brand_audit", "Brand Audit", "Review", "Audits brand positioning, consistency, message clarity and trust signals.", "Führe ein Brand-Audit durch: Positionierung, Tonalität, Visual DNA, Vertrauen, Differenzierung, Risiken und Quick Wins für: ", "Run a brand audit: positioning, tone, visual DNA, trust, differentiation, risks and quick wins for: ", ["ceo", "designer", "content"], "ShieldCheck")
_skill("seo_audit", "SEO Audit", "SEO", "Reviews on-page, technical and GEO readiness and returns prioritized fixes.", "Erstelle ein SEO-Audit mit Technical SEO, On-Page, Content, Schema, GEO und priorisierten Maßnahmen für: ", "Create an SEO audit covering technical SEO, on-page, content, schema, GEO and prioritized fixes for: ", ["seo"], "Search", required_memory=["business", "experience"])
_skill("keyword_expansion", "Keyword Expansion", "SEO", "Expands seed topics into keyword clusters, intent and content opportunities.", "Erweitere diese Seed-Keywords zu Clustern, Suchintentionen, Longtails und Content-Ideen: ", "Expand these seed keywords into clusters, search intents, long tails and content ideas: ", ["seo", "content"], "Hash", required_memory=["business", "experience"])
_skill("competitor_analysis", "Competitor Analysis", "Research", "Compares competitors, positioning, offers, channels and gaps.", "Analysiere Wettbewerber, Positionierung, Angebote, Kanäle, Stärken/Schwächen und Chancen für: ", "Analyze competitors, positioning, offers, channels, strengths/weaknesses and opportunities for: ", ["ceo", "marketing", "seo", "orchestrator"], "BarChart2")
_skill("hook_generator", "Hook Generator", "Copywriting", "Generates high-performing hooks for ads, reels, posts and landing pages.", "Generiere 20 starke Hooks in verschiedenen Stilen (Neugier, Problem, Kontrast, Benefit, Story) für: ", "Generate 20 strong hooks in different styles (curiosity, problem, contrast, benefit, story) for: ", ["content", "social", "tiktok", "copywriter"], "Type")
_skill("cta_optimizer", "CTA Optimizer", "Copywriting", "Improves calls to action for clarity, urgency and conversion.", "Optimiere diese CTA-Idee. Liefere 15 Varianten nach Funnel-Stufe und psychologischem Trigger für: ", "Optimize this CTA idea. Provide 15 variants by funnel stage and psychological trigger for: ", ["content", "email", "linkedin", "sales"], "MousePointer")
_skill("image_critique", "Image Critique", "Image", "Critiques visuals against brand DNA, message clarity and conversion purpose.", "Bewerte dieses Bild-/Visual-Konzept nach Brand-Fit, Klarheit, Blickführung, Conversion und Verbesserungen: ", "Critique this visual concept for brand fit, clarity, eye flow, conversion and improvements: ", ["designer", "content"], "Image", required_providers=["chat", "vision"])
_skill("video_critique", "Video Critique", "Video", "Reviews video concepts for hook, pacing, story, brand fit and CTA.", "Bewerte dieses Video-Konzept nach Hook, Pacing, Story, Brand-Fit, CTA und konkreten Verbesserungen: ", "Review this video concept for hook, pacing, story, brand fit, CTA and concrete improvements: ", ["video", "tiktok"], "Video", required_providers=["chat", "vision"])
_skill("image_generate_live", "Generate Image (Live)", "Image", "Generates production image variants directly with the backend image pipeline.", "Generiere ein hochwertiges Werbebild basierend auf: ", "Generate a high-quality production image based on: ", ["designer"], "Image", skill_type="image", required_providers=["image"])
_skill("video_generate_live", "Generate Video (Live)", "Video", "Starts a real Veo video generation job from the given context.", "Erzeuge ein kurzes Video basierend auf: ", "Generate a short video based on: ", ["video"], "Film", skill_type="video", required_providers=["video"])
_skill("prompt_optimizer", "Prompt Optimizer", "Quality Assurance", "Transforms rough prompts into provider-ready production prompts.", "Optimiere diesen Prompt für bessere KI-Ergebnisse. Liefere eine finale Version plus Begründung: ", "Optimize this prompt for better AI results. Return a final version plus rationale: ", ["ceo", "designer", "video", "coding", "orchestrator"], "Wand2")
_skill("landingpage_review", "Landingpage Review", "Review", "Reviews a landing page for structure, copy, friction, SEO and conversion.", "Reviewe diese Landingpage: Hero, Nutzenversprechen, Trust, Einwände, CTA, SEO, mobile UX und Quick Wins: ", "Review this landing page: hero, value prop, trust, objections, CTA, SEO, mobile UX and quick wins: ", ["content", "seo", "coding", "sales"], "Layout")
_skill("storytelling_review", "Storytelling Review", "Review", "Improves narrative arc, emotional clarity and proof points.", "Reviewe das Storytelling: Zielgruppe, Konflikt, Transformation, Beweise, Emotion, Klarheit und bessere Version: ", "Review the storytelling: audience, conflict, transformation, proof, emotion, clarity and better version: ", ["content", "linkedin", "email"], "BookOpen")
_skill("brand_compliance_check", "Brand Compliance Check", "Quality Assurance", "Checks whether output follows brand identity, tone and rules.", "Prüfe diesen Output auf Brand Compliance: Tonalität, Werte, Visual DNA, No-Gos, Konsistenz. Gib Freigabe oder Korrekturen: ", "Check this output for brand compliance: tone, values, visual DNA, no-gos, consistency. Give approval or corrections: ", ["ceo", "designer", "content", "orchestrator"], "ShieldCheck")
_skill("output_optimizer", "Output Optimizer", "Quality Assurance", "Refines existing output for usefulness, structure, conversion and polish.", "Optimiere diesen Output auf Klarheit, Struktur, Umsetzbarkeit, Conversion und Premium-Wirkung: ", "Optimize this output for clarity, structure, actionability, conversion and premium polish: ", ["ceo", "content", "orchestrator", "seo", "email", "linkedin"], "Sparkles")
_skill("ai_citation_strategist", "AI Citation Strategist", "SEO", "Improves visibility in AI answers (ChatGPT, Claude, Gemini, Perplexity) and GEO/AEO citations.", "Analysiere die Sichtbarkeit in KI-Suchen (ChatGPT, Claude, Gemini, Perplexity) und liefere eine priorisierte GEO/AEO-Strategie inkl. Quellen-, Entitäten- und Zitier-Optimierung für: ", "Analyze visibility across AI answer engines (ChatGPT, Claude, Gemini, Perplexity) and provide a prioritized GEO/AEO strategy including source, entity and citation optimization for: ", ["seo", "ceo"], "Quote", required_memory=["business", "experience"], required_dna=["audience", "positioning"], cost="medium", runtime="45-90s")
_skill("aeo_foundations_architect", "AEO Foundations Architect", "SEO", "Defines llms.txt, AI-aware robots rules and retrieval-ready content foundations.", "Erstelle die AEO-Basisarchitektur mit llms.txt, AI-fähigem robots-Konzept, strukturierter Entitätslogik, FAQ-Schema und priorisiertem Implementierungsplan für: ", "Design the AEO foundations with llms.txt, AI-aware robots strategy, entity structure, FAQ schema and a prioritized implementation plan for: ", ["seo", "coding"], "FileCog", required_memory=["business", "experience"], required_dna=["audience", "positioning"], cost="medium", runtime="45-90s")
_skill("agentic_search_optimizer", "Agentic Search Optimizer", "SEO", "Optimizes pages so AI agents can discover, parse and complete tasks reliably.", "Optimiere die Website für agentische Suche (AI-Browser/Agents): Crawlbarkeit, Task-Completeness, strukturierte Inhalte, Navigation und Prompt-freundliche Informationsarchitektur für: ", "Optimize the website for agentic search (AI browsers/agents): crawlability, task completeness, structured content, navigation and prompt-friendly information architecture for: ", ["seo", "coding", "automation"], "Bot", required_memory=["business", "experience"], required_dna=["audience", "tone"], cost="medium", runtime="45-90s")
_skill("video_optimization_specialist", "Video Optimization Specialist", "Video", "Optimizes YouTube/Reels videos for hook strength, retention, chapters, thumbnail angle and CTA.", "Optimiere dieses Video-/Channel-Konzept für Hook, Retention, Watchtime, Kapitelstruktur, Thumbnail-Ideen, Titel/Description-SEO und CTA-System: ", "Optimize this video/channel concept for hook strength, retention, watch time, chaptering, thumbnail angles, title/description SEO and CTA system: ", ["video", "seo", "content"], "Clapperboard", required_memory=["business", "experience"], required_dna=["audience", "tone"], cost="medium", runtime="45-90s")
_skill("email_marketing_strategist", "Email Marketing Strategist", "Marketing", "Builds lifecycle email systems with segmentation, automation, deliverability and offer sequencing.", "Entwickle eine Lifecycle-Email-Strategie mit Segmenten, Automationen, Kampagnenstruktur, Betreff-Ansätzen, Angebotssequenz und Deliverability-Absicherung für: ", "Build a lifecycle email strategy with segmentation, automations, campaign structure, subject-line angles, offer sequencing and deliverability safeguards for: ", ["content", "sales", "automation"], "Mail", required_memory=["business", "experience"], required_dna=["audience", "tone"], cost="medium", runtime="45-90s")
_skill("pr_communications_manager", "PR & Communications Manager", "Marketing", "Creates PR narratives, launch messaging, media angles and trust-building communication plans.", "Erstelle einen PR- und Kommunikationsplan mit Kernnarrativ, Pressewinkeln, Messaging-Hierarchie, Stakeholder-Plan, Krisenreaktionslinien und Veröffentlichungsfahrplan für: ", "Create a PR and communications plan with core narrative, press angles, messaging hierarchy, stakeholder plan, crisis response lines and publishing roadmap for: ", ["ceo", "content", "sales"], "Megaphone", required_memory=["brand", "business"], required_dna=["tone", "positioning", "audience"], cost="medium", runtime="45-90s")

# --- Skills for the 20 specialist personas added in the roster expansion ---------
# Bea – Brand Guardian
_skill("consistency_guard", "Consistency Guard", "Review", "Scans a batch of assets or messages for brand drift against the identity system.", "Prüfe die folgenden Assets/Texte auf Markenkonsistenz (Farben, Typografie, Ton, Logo-Nutzung, Botschaft). Liste Abweichungen mit Schweregrad und konkreten Korrekturen für: ", "Check the following assets/texts for brand consistency (colors, typography, tone, logo usage, message). List deviations with severity and concrete fixes for: ", ["brand_guardian", "designer"], "ShieldCheck")
_skill("reputation_risk_scan", "Reputation Risk Scan", "Review", "Flags reputation, cultural-sensitivity and trademark risks before something ships.", "Bewerte dieses Material auf Reputations-, Kultur- und Markenrechtsrisiken. Stufe jedes Risiko ein und gib eine Freigabe-Empfehlung (Ja/Nein/Mit Änderungen) für: ", "Assess this material for reputation, cultural-sensitivity and trademark risk. Rate each risk and give an approval recommendation (yes/no/with changes) for: ", ["brand_guardian"], "AlertTriangle")
# Ravi – Reality Check
_skill("persona_walkthrough", "Persona Walkthrough", "Review", "Simulates how a target persona experiences a page using LIFT, Cialdini and Fogg.", "Simuliere, wie eine konkrete Zielperson diese Seite/diesen Funnel erlebt (Fold für Fold, Persona-Monolog getrennt von Analyse, LIFT/Cialdini/Fogg). Nenne den kritischen Absprungmoment und priorisierte Fixes für: ", "Simulate how a specific target persona experiences this page/funnel (fold by fold, persona monologue separate from analysis, LIFT/Cialdini/Fogg). Name the critical drop-off moment and prioritized fixes for: ", ["reality_check", "content", "sales"], "Drama")
_skill("five_second_test", "5-Second Test", "Review", "Judges whether a page communicates what/for-whom/next-step in the first 5 seconds.", "Führe einen Fünf-Sekunden-Test durch: Was ist das? Ist es für mich? Was soll ich tun? Bewerte Klarheit und Vertrauen und gib 3 Sofort-Verbesserungen für: ", "Run a five-second test: what is this? is it for me? what should I do? Rate clarity and trust and give 3 immediate improvements for: ", ["reality_check", "designer"], "Timer")
# Ida – UX Research
_skill("usability_review", "Usability Review", "UX", "Reviews a flow for task success, friction points and accessibility.", "Reviewe diesen Flow/dieses Interface auf Aufgaben-Erfolg, Reibungspunkte, kognitive Last und Barrierefreiheit. Gib Befunde mit Schweregrad und priorisierten Empfehlungen für: ", "Review this flow/interface for task success, friction points, cognitive load and accessibility. Give findings with severity and prioritized recommendations for: ", ["ux_research", "designer"], "Accessibility")
_skill("ux_research_plan", "UX Research Plan", "UX", "Designs a research study: question, method, sample and success metric.", "Entwirf eine UX-Research-Studie: Forschungsfrage, passende Methodik (qualitativ/quantitativ), Stichprobe, Bias-Vermeidung und Erfolgsmetrik für: ", "Design a UX research study: research question, fitting methodology (qual/quant), sample, bias avoidance and success metric for: ", ["ux_research", "product_manager"], "Microscope")
# Bruno – Business Strategist
_skill("market_entry_analysis", "Market Entry Analysis", "Business", "Sizes the market (TAM/SAM/SOM) and evaluates entry or growth options.", "Analysiere Markteintritt/Wachstum: TAM/SAM/SOM, Wettbewerbslandschaft, Eintrittsbarrieren, Szenarien (Base/Upside/Downside) und eine priorisierte Empfehlung für: ", "Analyze market entry/growth: TAM/SAM/SOM, competitive landscape, entry barriers, scenarios (base/upside/downside) and a prioritized recommendation for: ", ["business_strategist", "ceo"], "Globe2", cost="medium", runtime="45-90s")
_skill("swot_strategy", "SWOT & Strategy Options", "Business", "Builds a SWOT and derives SO/ST/WO/WT strategy options with trade-offs.", "Erstelle eine SWOT-Analyse und leite Strategieoptionen (SO/ST/WO/WT) mit Trade-offs und den 3-5 wichtigsten Maßnahmen inkl. Owner/Zeitrahmen ab für: ", "Build a SWOT and derive strategy options (SO/ST/WO/WT) with trade-offs and the 3-5 most important moves incl. owner/timeframe for: ", ["business_strategist", "ceo"], "GitBranch")
# Petra – Product Manager
_skill("prd_writer", "PRD Writer", "Product", "Writes a product requirements doc: problem, goals, non-goals, stories, risks.", "Schreibe ein PRD: Problemstatement mit Evidenz, Ziele & Erfolgsmetriken, Non-Goals, User Stories, Lösungsskizze, Risiken und Rollout-Plan für: ", "Write a PRD: evidence-backed problem statement, goals & success metrics, non-goals, user stories, solution outline, risks and rollout plan for: ", ["product_manager"], "ClipboardList", cost="medium", runtime="45-90s")
_skill("roadmap_prioritizer", "Roadmap Prioritizer", "Product", "Scores and orders opportunities with RICE and outcome focus.", "Priorisiere diese Feature-/Opportunity-Liste mit RICE (Reach, Impact, Confidence, Effort), begründe die Reihenfolge und definiere je Position Owner und Erfolgsmetrik für: ", "Prioritize this feature/opportunity list with RICE (reach, impact, confidence, effort), justify the order and define owner and success metric per item for: ", ["product_manager", "orchestrator"], "ListChecks")
# Paul – Pricing Analyst
_skill("pricing_model", "Pricing Model Builder", "Pricing", "Builds a pricing model from cost, competitor and willingness-to-pay analysis.", "Entwickle ein Preismodell: Kostenstruktur, Wettbewerbspreise, Value-Metric und Zahlungsbereitschaft. Empfiehl Modell und Preispunkte mit ±20% Sensitivitätsanalyse für: ", "Build a pricing model: cost structure, competitor prices, value metric and willingness to pay. Recommend a model and price points with a ±20% sensitivity analysis for: ", ["pricing_analyst", "cfo"], "Coins", cost="medium", runtime="45-90s")
_skill("offer_packaging", "Offer & Tier Packaging", "Pricing", "Designs offers, packages and tiers that capture different willingness-to-pay.", "Entwirf Angebote, Pakete und Tiers, die unterschiedliche Zahlungsbereitschaften erfassen. Definiere Feature-Zuschnitt, Ankerpreis und Upgrade-Pfad für: ", "Design offers, packages and tiers that capture different willingness to pay. Define feature split, anchor price and upgrade path for: ", ["pricing_analyst", "product_manager", "sales"], "Package")
# Priya – Performance Ads
_skill("ppc_campaign_architecture", "PPC Campaign Architecture", "Paid Media", "Designs account and campaign structure for search/shopping/performance max.", "Entwirf die PPC-Konto- und Kampagnen-Architektur (Brand/Non-Brand/Konkurrenz, Anzeigengruppen, Isolationsstrategie), Kampagnentypen-Mix und Audience-Strategie für: ", "Design the PPC account and campaign architecture (brand/non-brand/competitor, ad groups, isolation strategy), campaign-type mix and audience strategy for: ", ["performance_ads"], "Rocket", cost="medium", runtime="45-90s")
_skill("bidding_budget_strategy", "Bidding & Budget Strategy", "Paid Media", "Recommends bidding strategy, budget allocation and a monthly testing roadmap.", "Empfiehl Gebotsstrategie (tCPA/tROAS/Max Conversions) basierend auf Datenreife, Budgetallokation, Pacing-Modell und 2-4 strukturierte Tests pro Monat für: ", "Recommend a bidding strategy (tCPA/tROAS/max conversions) based on data maturity, budget allocation, pacing model and 2-4 structured monthly tests for: ", ["performance_ads"], "Gauge")
# Tarek – Tracking & Measurement
_skill("tracking_audit", "Tracking Audit", "Analytics", "Audits GTM/GA4/CAPI setup and finds conversion-count discrepancies.", "Prüfe das Tracking-Setup (GTM, GA4-Events, Enhanced Conversions, Meta CAPI, Consent Mode). Liste Diskrepanzen und priorisierte Fixes mit Aufwandsschätzung für: ", "Audit the tracking setup (GTM, GA4 events, Enhanced Conversions, Meta CAPI, consent mode). List discrepancies and prioritized fixes with effort estimates for: ", ["tracking_specialist", "automation"], "Radar", cost="medium", runtime="45-90s")
_skill("attribution_model", "Attribution Model Design", "Analytics", "Recommends an attribution model and a cross-platform measurement plan.", "Empfiehl ein Attributionsmodell und einen Messplan, der Plattform-Conversions gegen tatsächliche API-/CRM-Daten abgleicht, inkl. Consent- und DSGVO-Absicherung für: ", "Recommend an attribution model and a measurement plan that reconciles platform conversions against actual API/CRM data, incl. consent and GDPR safeguards for: ", ["tracking_specialist", "analytics"], "GitMerge")
# Ines – Investment Researcher
_skill("valuation_model", "Valuation Model", "Business", "Builds a DCF/comparables valuation with bull/base/bear scenarios.", "Erstelle ein Bewertungsmodell (DCF und Comparables) mit Bull-/Base-/Bear-Szenarien, Kernannahmen und Sensitivitäten für: ", "Build a valuation model (DCF and comparables) with bull/base/bear scenarios, key assumptions and sensitivities for: ", ["investment_researcher", "cfo"], "TrendingUp", cost="medium", runtime="45-90s")
_skill("investment_thesis", "Investment Thesis & DD", "Business", "Writes an investment thesis with bull/bear cases and thesis breakers.", "Formuliere eine Investmentthese: Bull Case mit Katalysatoren, gleich rigoroser Bear Case, Risikofaktoren, Konviktionslevel, Anlagehorizont und konkrete Thesenbrecher für: ", "Write an investment thesis: bull case with catalysts, an equally rigorous bear case, risk factors, conviction level, horizon and concrete thesis breakers for: ", ["investment_researcher"], "FileBarChart", cost="medium", runtime="45-90s")
# Pia – Project Shepherd
_skill("project_plan", "Project Plan & Timeline", "Planning", "Builds a project charter, critical-path timeline and risk mitigations.", "Erstelle ein Projekt-Charter mit Zielen und Erfolgskriterien, eine Timeline mit Abhängigkeiten und kritischem Pfad, Risiken mit Mitigationen und Meilensteinen für: ", "Build a project charter with goals and success criteria, a timeline with dependencies and critical path, risks with mitigations and milestones for: ", ["project_shepherd", "orchestrator"], "Calendar")
_skill("status_report", "Status Report", "Planning", "Produces a red/yellow/green status report with blockers and decisions needed.", "Erstelle einen Statusbericht (Grün/Gelb/Rot): Fortschritt seit letztem Update, nächste Meilensteine, Risiken & offene Probleme, benötigte Entscheidungen und nächste Schritte für: ", "Produce a status report (green/yellow/red): progress since last update, next milestones, risks & open issues, decisions needed and next steps for: ", ["project_shepherd"], "Activity")
# Caspar – Chief of Staff
_skill("decision_brief", "Decision Brief", "Planning", "Prepares a decision with context, options and a clear recommendation.", "Bereite eine Entscheidung vor: Kontext, 2-3 Optionen mit Trade-offs, eine klare Empfehlung und die offene Frage, die der Gründer beantworten muss für: ", "Prepare a decision: context, 2-3 options with trade-offs, a clear recommendation and the open question the founder must answer for: ", ["chief_of_staff", "ceo"], "GitBranch")
_skill("priority_triage", "Priority Triage", "Planning", "Triages inputs into escalate-now / handle-and-brief / park.", "Sortiere die folgenden Aufgaben/Signale in: sofort eskalieren, selbst erledigen und später briefen, zurückstellen. Nenne die eine wichtigste Priorität für heute für: ", "Triage the following tasks/signals into: escalate now, handle and brief later, park. Name the single most important priority for today for: ", ["chief_of_staff"], "ListFilter")
# Clara – Customer Success
_skill("onboarding_plan", "Onboarding Plan", "Business", "Designs an onboarding plan with a 30-day time-to-value target.", "Entwirf einen Onboarding-Plan mit schriftlichen Erfolgskriterien, einem Time-to-Value-Ziel (erster Nutzen in 30 Tagen), Meilensteinen und Health-Score-Check-ins für: ", "Design an onboarding plan with written success criteria, a time-to-value target (first value in 30 days), milestones and health-score check-ins for: ", ["customer_success", "support_responder"], "Users")
_skill("churn_save_play", "Churn Risk & Save Play", "Business", "Reads early warning signals and produces a save play by risk level.", "Analysiere Frühwarnsignale (sinkende Nutzung, Ticket-Spitzen, verschwundener Ansprechpartner) und entwickle ein passendes Save Play nach Risikostufe für: ", "Read early warning signals (declining usage, ticket spikes, vanished champion) and produce a fitting save play by risk level for: ", ["customer_success"], "HeartPulse")
# Sam – Support Responder
_skill("support_reply", "Support Reply Draft", "Support", "Drafts an empathetic, solution-focused multi-channel support reply.", "Formuliere eine einfühlsame, konkret lösungsorientierte Support-Antwort mit systematischer Diagnose, klaren Lösungsschritten und Eskalationshinweis falls nötig für: ", "Draft an empathetic, solution-focused support reply with systematic diagnosis, clear resolution steps and an escalation note if needed for: ", ["support_responder"], "MessageCircle", cost="low", runtime="10-30s")
_skill("faq_builder", "FAQ Builder", "Support", "Turns recurring questions into a structured, knowledge-base-ready FAQ.", "Erstelle aus diesen wiederkehrenden Fragen eine strukturierte, wissensdatenbank-fähige FAQ mit klaren Antworten und Kategorien für: ", "Turn these recurring questions into a structured, knowledge-base-ready FAQ with clear answers and categories for: ", ["support_responder", "content"], "BookOpen")
# Lena – Legal & Compliance
_skill("compliance_check", "Compliance Check", "Legal", "Reviews content/flows for GDPR/CCPA and advertising-claim compliance.", "Prüfe Inhalte/Prozesse auf Konformität (DSGVO, CCPA, Werbeaussagen). Stufe Befunde nach Schweregrad ein, nenne Rechtsgrundlage und konkrete Korrekturen mit Frist für: ", "Review content/flows for compliance (GDPR, CCPA, advertising claims). Rate findings by severity, cite the legal basis and give concrete fixes with deadlines for: ", ["legal_compliance", "ceo"], "Scale", cost="medium", runtime="45-90s")
_skill("policy_review", "Privacy Policy Review", "Legal", "Reviews a privacy policy / data flow and flags gaps and risks.", "Reviewe diese Datenschutzerklärung/diesen Datenfluss: Rechtsgrundlagen, Datenkategorien, Einwilligung, Aufbewahrung, Drittanbieter. Nenne Lücken und Nachbesserungen für: ", "Review this privacy policy/data flow: legal bases, data categories, consent, retention, third parties. List gaps and remediations for: ", ["legal_compliance"], "FileText")
# Mara – Paid Media Auditor
_skill("paid_media_audit", "Paid Media Account Audit", "Paid Media", "Runs a severity-scored audit across Google/Microsoft/Meta ad accounts.", "Führe ein strukturiertes Paid-Media-Audit durch (Kontostruktur, Tracking, Gebote, Keywords/Audiences, Creatives, Wettbewerb). Stufe jeden Befund nach Schweregrad und Geschäftsauswirkung ein für: ", "Run a structured paid-media audit (account structure, tracking, bidding, keywords/audiences, creatives, competition). Score each finding by severity and business impact for: ", ["paid_media_auditor", "performance_ads"], "Search", cost="medium", runtime="45-90s")
# Finn – Feedback Synthesizer
_skill("feedback_synthesis", "Feedback Synthesis", "Research", "Turns multi-channel feedback into prioritized, quoted insights.", "Verdichte dieses Multichannel-Feedback: Sentiment, thematische Cluster, Häufigkeit vs. Geschäftsimpact, RICE-Priorisierung und repräsentative Originalzitate je Erkenntnis für: ", "Synthesize this multi-channel feedback: sentiment, thematic clusters, frequency vs. business impact, RICE prioritization and representative quotes per insight for: ", ["feedback_synthesizer", "product_manager"], "MessagesSquare")
# Mia – Meeting Notes
_skill("meeting_summary", "Meeting Summary", "Planning", "Extracts decisions, action items and open questions from raw notes.", "Verwandle diesen Input (Transkript/Notizen) in ein sauberes 4-Abschnitte-Protokoll: Datum & Teilnehmer, Entscheidungen, Aufgaben (Owner/Frist), offene Fragen. Erfinde nichts. Input: ", "Turn this input (transcript/notes) into a clean 4-section record: date & attendees, decisions, action items (owner/due), open questions. Invent nothing. Input: ", ["meeting_notes", "chief_of_staff"], "FileEdit", cost="low", runtime="10-30s")
# Aaron – App Store Optimizer
_skill("aso_optimization", "App Store Optimization", "SEO", "Optimizes app metadata, keywords and store conversion assets.", "Optimiere den App-Store-Auftritt: Keyword-Strategie (iOS/Android), Titel/Untertitel/Beschreibung, Screenshot-Story, Preview-Video-Hook und A/B-Test-Roadmap für: ", "Optimize the app store presence: keyword strategy (iOS/Android), title/subtitle/description, screenshot story, preview-video hook and A/B testing roadmap for: ", ["aso_specialist", "seo"], "Smartphone", cost="medium", runtime="45-90s")
# Greta – Podcast Strategist
_skill("podcast_strategy", "Podcast Strategy", "Marketing", "Defines show positioning, content engine, distribution and monetization.", "Entwickle eine Podcast-Strategie: Ziel-Hörer und Positionierung, Show-Bibel (Format/Ton/Rhythmus), Distributions- und Clip-Strategie sowie Monetarisierungs-Roadmap für: ", "Develop a podcast strategy: target listener and positioning, show bible (format/tone/cadence), distribution and clip strategy plus monetization roadmap for: ", ["podcast_strategist", "content"], "Mic", cost="medium", runtime="45-90s")
_skill("episode_brief", "Episode Brief", "Marketing", "Writes an episode brief with hook, promise, guest angle and repurposing plan.", "Schreibe ein Episode-Brief: Hook (erste 60-90 Sek.), Kernversprechen, Gästewinkel, Struktur und Repurposing-Plan (Clips, Show Notes, Social) für: ", "Write an episode brief: hook (first 60-90s), core promise, guest angle, structure and repurposing plan (clips, show notes, social) for: ", ["podcast_strategist"], "Mic")
# Xander – Social Intelligence
_skill("social_listening", "Social Listening Brief", "Research", "Produces an evidence-based social listening brief with sources preserved.", "Erstelle einen Social-Listening-Bericht: Leitfrage, Keyword-/Account-Set, Kernerkenntnisse mit Beleg und Konfidenzgrad, Risikoeinstufung und empfohlene Maßnahmen für: ", "Produce a social listening brief: guiding question, keyword/account set, key findings with evidence and confidence, risk classification and recommended actions for: ", ["social_intelligence", "analytics"], "Satellite", cost="medium", runtime="45-90s")
_skill("trend_detection", "Trend Detection", "Research", "Separates noise from real trends by velocity and source diversity.", "Analysiere die folgenden Signale und unterscheide Rauschen von echten Trends anhand von Geschwindigkeit, Quellenvielfalt und Zeitverlauf. Kartiere Wettbewerber-Aktivität und leite 3 Handlungsempfehlungen ab für: ", "Analyze the following signals and separate noise from real trends by velocity, source diversity and timeline. Map competitor activity and derive 3 recommendations for: ", ["social_intelligence", "marketing"], "TrendingUp")

# Extend a few existing shared skills to the new specialists where they genuinely fit.
for _sid, _extra in {
    "brand_audit": ["brand_guardian"],
    "brand_compliance_check": ["brand_guardian"],
    "landingpage_review": ["reality_check", "ux_research"],
    "competitor_analysis": ["business_strategist", "investment_researcher", "social_intelligence"],
    "output_optimizer": ["chief_of_staff"],
    "storytelling_review": ["podcast_strategist"],
}.items():
    for _aid in _extra:
        if _aid not in SKILLS[_sid]["agent_ids"]:
            SKILLS[_sid]["agent_ids"].append(_aid)

AGENT_SKILL_MAP = {aid: [s["id"] for s in SKILLS.values() if aid in s.get("agent_ids", [])] for aid in sorted({a for s in SKILLS.values() for a in s.get("agent_ids", [])})}

def list_skills(category: Optional[str] = None, q: str = "") -> List[dict]:
    q = (q or "").lower().strip()
    rows = list(SKILLS.values())
    if category:
        rows = [s for s in rows if s["category"].lower() == category.lower()]
    if q:
        rows = [s for s in rows if q in (s["name"] + s["description"] + s["category"]).lower()]
    return sorted(rows, key=lambda s: (s["category"], s["name"]))

def get_skill(skill_id: str) -> Optional[dict]:
    return SKILLS.get(skill_id)

def skills_for_agent(agent_id: str) -> List[dict]:
    return [SKILLS[sid] for sid in AGENT_SKILL_MAP.get(agent_id, []) if sid in SKILLS]

def registry_payload() -> dict:
    return {"categories": CATEGORIES, "skills": list_skills(), "agent_skill_map": AGENT_SKILL_MAP}


def suggest_skill_for_task(task: str, preferred_agent_id: Optional[str] = None) -> Optional[dict]:
    """Heuristic matcher that maps free-form tasks to the best skill.

    We deliberately keep this lightweight and deterministic so it can run before
    any expensive model call.
    """
    text = (task or "").strip().lower()
    if not text:
        return None

    best = None
    best_score = -1.0
    for skill in SKILLS.values():
        if preferred_agent_id and preferred_agent_id not in skill.get("agent_ids", []):
            continue

        haystack = " ".join([
            skill.get("name", ""),
            skill.get("description", ""),
            skill.get("category", ""),
            skill.get("prompt_de", ""),
            skill.get("prompt_en", ""),
        ]).lower()

        # Basic token-overlap score
        tokens = [t for t in text.replace("/", " ").replace("-", " ").split() if len(t) >= 3]
        overlap = sum(1 for t in tokens if t in haystack)
        score = float(overlap)

        # Small boosts for obvious media intents.
        if any(k in text for k in ("bild", "image", "visual", "grafik")) and skill.get("type") == "image":
            score += 8.0
        if any(k in text for k in ("video", "reel", "veo", "clip")) and skill.get("type") == "video":
            score += 8.0

        # Targeted boosts for newly integrated agency-agent style skills.
        if skill.get("id") == "ai_citation_strategist" and any(
            k in text for k in ("geo", "aeo", "citation", "citations", "ai overview", "perplexity", "chatgpt", "claude", "gemini")
        ):
            score += 6.0
        if skill.get("id") == "aeo_foundations_architect" and any(
            k in text for k in ("llms.txt", "robots", "schema", "structured data", "entity", "entities")
        ):
            score += 6.0
        if skill.get("id") == "agentic_search_optimizer" and any(
            k in text for k in ("agentic", "ai browser", "webmcp", "crawlability", "task completeness")
        ):
            score += 6.0
        if skill.get("id") == "video_optimization_specialist" and any(
            k in text for k in ("watchtime", "retention", "thumbnail", "chapter", "youtube seo")
        ):
            score += 6.0
        if skill.get("id") == "email_marketing_strategist" and any(
            k in text for k in ("email", "newsletter", "deliverability", "lifecycle", "sequence")
        ):
            score += 6.0
        if skill.get("id") == "pr_communications_manager" and any(
            k in text for k in ("pr", "press", "communications", "media", "reputation")
        ):
            score += 6.0

        if score > best_score:
            best_score = score
            best = skill

    if best_score <= 0:
        # Fallback preference: orchestrator-safe planning skill for unknown tasks.
        return SKILLS.get("campaign_planner")
    return best

import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AppProvider, useApp } from "@/context/AppContext";
import { BRANDMIND } from "@/brandmind";
import { Layout } from "@/components/Layout";

function AppFallback({ title, message, error }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 text-center"
      style={{ background: BRANDMIND.colors.base, color: "#fff" }}
    >
      <div className="max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
        <div
          className="mx-auto mb-5 h-12 w-12 rounded-full"
          style={{ background: BRANDMIND.colors.glow, boxShadow: `0 0 40px ${BRANDMIND.colors.glow}` }}
        />
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{message}</p>
        {error && (
          <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-black/40 p-3 text-left text-xs text-red-300">
            {error}
          </pre>
        )}
      </div>
    </div>
  );
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep the failure visible instead of leaving users on a black screen.
    console.error("Brandmind app render failed", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <AppFallback
          title="Brandmind konnte nicht geladen werden"
          message="Bitte lade die Seite neu. Falls das Problem bleibt, kopiere die Fehlermeldung unten an den Support."
          error={this.state.error?.message || String(this.state.error)}
        />
      );
    }

    return this.props.children;
  }
}

// Core pages
import BrandMindHQ from "@/pages/BrandMindHQ";
import MissionControl from "@/pages/MissionControl";
import IntelligenceStudio from "@/pages/IntelligenceStudio";
import GatewayStudio from "@/pages/GatewayStudio";
import BrandIdentity from "@/pages/BrandIdentity";
import Memory from "@/pages/Memory";
import SkillsMarketplace from "@/pages/SkillsMarketplace";
import Dashboard from "@/pages/Dashboard";
import KnowledgeBase from "@/pages/KnowledgeBase";
import KnowledgeExplorer from "@/pages/KnowledgeExplorer";
import BrandBrain from "@/pages/BrandBrain";
import Auth from "@/pages/Auth";
import Billing from "@/pages/Billing";
import Permissions from "@/pages/Permissions";

// Agent system
import QuantumAgent from "@/pages/QuantumAgent";   // Quantum Command
import Specialists from "@/pages/Specialists";       // Agents overview

// Studios
import DesignStudio from "@/pages/DesignStudio";
import VideoStudio from "@/pages/VideoStudio";
import SeoStudio from "@/pages/SeoStudio";
import AnalyticsStudio from "@/pages/AnalyticsStudio";
import AutomationStudio from "@/pages/AutomationStudio";
import TicketSystem from "@/pages/TicketSystem";
import TikTokStudio from "@/pages/TikTokStudio";
import SeoSpecialistStudio from "@/pages/SeoSpecialistStudio";
import EmailStudio from "@/pages/EmailStudio";
import LinkedInStudio from "@/pages/LinkedInStudio";
import OrchestratorStudio from "@/pages/OrchestratorStudio";
import WorkflowStudio from "@/pages/WorkflowStudio";
import FinanceCFOStudio from "@/pages/FinanceCFOStudio";
import FinanceAnalystStudio from "@/pages/FinanceAnalystStudio";
import FinanceFPAStudio from "@/pages/FinanceFPAStudio";
import FinanceBookkeeperStudio from "@/pages/FinanceBookkeeperStudio";
import FinanceTaxStudio from "@/pages/FinanceTaxStudio";

// Existing tools (kept for legacy routes)
import SocialMedia from "@/pages/SocialMedia";
import ImageGenerator from "@/pages/ImageGenerator";
import Copywriter from "@/pages/Copywriter";
import Funnel from "@/pages/Funnel";
import ContentCalendar from "@/pages/ContentCalendar";
import Guardian from "@/pages/Guardian";
import PromptLibrary from "@/pages/PromptLibrary";
import GPTChat from "@/pages/GPTChat";
import GeminiChat from "@/pages/GeminiChat";
import GrokChat from "@/pages/GrokChat";
import ChatArena from "@/pages/ChatArena";
import ExportCenter from "@/pages/ExportCenter";
import Campaign from "@/pages/Campaign";
import CampaignWorkflow from "@/pages/CampaignWorkflow";
import AgentBuilder from "@/pages/AgentBuilder";
import CharacterStudio from "@/pages/CharacterStudio";
import TTSStudio from "@/pages/TTSStudio";
import OutputFactory from "@/pages/OutputFactory";
import AIBusinessCard, { PublicBusinessCard } from "@/pages/AIBusinessCard";
import Landing from "@/pages/Landing";
import LegalPlaceholder from "@/pages/LegalPlaceholder";
import FounderPathSelect from "@/pages/FounderPathSelect";
import FounderIntake from "@/pages/FounderIntake";
import FounderIdeas from "@/pages/FounderIdeas";
import FounderBrandDevelopment from "@/pages/FounderBrandDevelopment";
import FounderOffers from "@/pages/FounderOffers";
import FounderBusinessPlan from "@/pages/FounderBusinessPlan";
import FounderFinancePlan from "@/pages/FounderFinancePlan";
import FounderOperations from "@/pages/FounderOperations";

function App() {
  return (
    <div className="App">
      <AppErrorBoundary>
        <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* Public product/sales page – shown before authentication */}
            <Route path="/" element={<Landing />} />
            {/* Brandmind auth – standalone, no app chrome */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/impressum" element={<LegalPlaceholder type="imprint" />} />
            <Route path="/privacy" element={<LegalPlaceholder type="privacy" />} />
            <Route path="/datenschutz" element={<LegalPlaceholder type="privacy" />} />
            <Route path="/contact" element={<LegalPlaceholder type="contact" />} />
            <Route path="/kontakt" element={<LegalPlaceholder type="contact" />} />
            <Route path="/card/:hash" element={<PublicBusinessCard />} />
            {/* Everything else runs inside the app shell */}
            <Route path="/*" element={<AppShell />} />
          </Routes>
        </BrowserRouter>
        <Toaster theme="dark" position="top-right" richColors />
      </AppProvider>
      </AppErrorBoundary>
    </div>
  );
}

function AppShell() {
  const { authReady, isAuthenticated } = useApp();

  // Avoid a flash of the app before we know the auth state.
  if (!authReady) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: BRANDMIND.colors.base }}
      >
        <div className="text-center">
          <div
            className="mx-auto mb-4 w-10 h-10 rounded-full animate-pulse"
            style={{ background: BRANDMIND.colors.glow, filter: "blur(4px)" }}
          />
          <p className="text-sm text-zinc-400">Brandmind wird geladen…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <Routes>
              {/* Phase 5 – Main Navigation */}
              <Route path="/app" element={<BrandMindHQ />} />
              <Route path="/mission" element={<MissionControl />} />
              <Route path="/intelligence" element={<IntelligenceStudio />} />
              <Route path="/gateway" element={<GatewayStudio />} />
              <Route path="/mission/plans/:planId" element={<MissionControl />} />
              <Route path="/modules" element={<Dashboard />} />
              <Route path="/output-factory" element={<OutputFactory />} />
              <Route path="/ai-business-card" element={<AIBusinessCard />} />
              <Route path="ai-business-card" element={<AIBusinessCard />} />
              <Route path="/business-card" element={<Navigate to="/ai-business-card" replace />} />
              <Route path="business-card" element={<Navigate to="/ai-business-card" replace />} />
              <Route path="/brand-brain" element={<BrandBrain />} />
              <Route path="/brand-identity" element={<BrandIdentity />} />
              <Route path="/memory" element={<Memory />} />
              <Route path="/skills" element={<SkillsMarketplace />} />
              <Route path="/skills/:skillId" element={<SkillsMarketplace />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/permissions" element={<Permissions />} />
              <Route path="/onboarding/select-path" element={<FounderPathSelect />} />
              <Route path="/onboarding/founder/intake" element={<FounderIntake />} />
              <Route path="/onboarding/founder/ideas" element={<FounderIdeas />} />
              <Route path="/onboarding/founder/brand" element={<FounderBrandDevelopment />} />
              <Route path="/onboarding/founder/offers" element={<FounderOffers />} />
              <Route path="/onboarding/founder/business-plan" element={<FounderBusinessPlan />} />
              <Route path="/onboarding/founder/finance" element={<FounderFinancePlan />} />
              <Route path="/ops" element={<FounderOperations />} />
              <Route path="/onboarding/founder/operations" element={<Navigate to="/ops" replace />} />
              <Route path="/agents" element={<Specialists />} />
              <Route path="/design" element={<DesignStudio />} />
              <Route path="/video" element={<VideoStudio />} />
              <Route path="/social" element={<SocialMedia />} />
              <Route path="/seo" element={<SeoStudio />} />
              <Route path="/analytics" element={<AnalyticsStudio />} />
              <Route path="/automation" element={<AutomationStudio />} />
              <Route path="/knowledge" element={<KnowledgeBase />} />
              <Route path="/knowledge-graph" element={<KnowledgeExplorer />} />

              {/* Quantum Command – bleibt */}
              <Route path="/quantum" element={<QuantumAgent />} />
              <Route path="/builder" element={<AgentBuilder />} />
              <Route path="/character-studio" element={<CharacterStudio />} />

              {/* Ticket System */}
              <Route path="/tickets" element={<TicketSystem />} />

              {/* New marketing specialist agents */}
              <Route path="/tiktok" element={<TikTokStudio />} />
              <Route path="/seo-specialist" element={<SeoSpecialistStudio />} />
              <Route path="/email" element={<EmailStudio />} />
              <Route path="/linkedin" element={<LinkedInStudio />} />
              <Route path="/orchestrator" element={<OrchestratorStudio />} />
              <Route path="/workflow-architect" element={<WorkflowStudio />} />
              <Route path="/finance-cfo" element={<FinanceCFOStudio />} />
              <Route path="/finance-analyst" element={<FinanceAnalystStudio />} />
              <Route path="/finance-fpa" element={<FinanceFPAStudio />} />
              <Route path="/finance-bookkeeper" element={<FinanceBookkeeperStudio />} />
              <Route path="/finance-tax" element={<FinanceTaxStudio />} />

              {/* Legacy routes – still accessible */}
              <Route path="/image" element={<ImageGenerator />} />
              <Route path="/copy" element={<Copywriter />} />
              <Route path="/funnel" element={<Funnel />} />
              <Route path="/calendar" element={<ContentCalendar />} />
              <Route path="/guardian" element={<Guardian />} />
              <Route path="/prompts" element={<PromptLibrary />} />
              <Route path="/chat-gpt" element={<GPTChat />} />
              <Route path="/chat-gemini" element={<GeminiChat />} />
              <Route path="/chat-grok" element={<GrokChat />} />
              <Route path="/arena" element={<ChatArena />} />
              <Route path="/export" element={<ExportCenter />} />
              <Route path="/campaign" element={<Campaign />} />
              <Route path="/tts" element={<TTSStudio />} />
              <Route path="/workflow" element={<CampaignWorkflow />} />
              <Route path="/specialists" element={<Specialists />} />
      </Routes>
    </Layout>
  );
}

export default App;

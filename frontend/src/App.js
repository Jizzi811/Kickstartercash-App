import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AppProvider, useApp } from "@/context/AppContext";
import { BRANDMIND } from "@/brandmind";
import { Layout } from "@/components/Layout";

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
import BrandBrain from "@/pages/BrandBrain";
import Auth from "@/pages/Auth";
import Billing from "@/pages/Billing";
import Permissions from "@/pages/Permissions";

// Agent system
import JarvjisAgent from "@/pages/JarvjisAgent";   // CEO Orb – bleibt
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
import TTSStudio from "@/pages/TTSStudio";
import OutputFactory from "@/pages/OutputFactory";

function App() {
  return (
    <div className="App">
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* Brandmind auth – standalone, no app chrome */}
            <Route path="/auth" element={<Auth />} />
            {/* Everything else runs inside the app shell */}
            <Route path="/*" element={<AppShell />} />
          </Routes>
        </BrowserRouter>
        <Toaster theme="dark" position="top-right" richColors />
      </AppProvider>
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
        <div
          className="w-10 h-10 rounded-full animate-pulse"
          style={{ background: BRANDMIND.colors.glow, filter: "blur(4px)" }}
        />
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
              <Route path="/" element={<BrandMindHQ />} />
              <Route path="/mission" element={<MissionControl />} />
              <Route path="/intelligence" element={<IntelligenceStudio />} />
              <Route path="/gateway" element={<GatewayStudio />} />
              <Route path="/mission/plans/:planId" element={<MissionControl />} />
              <Route path="/modules" element={<Dashboard />} />
              <Route path="/output-factory" element={<OutputFactory />} />
              <Route path="/brand-brain" element={<BrandBrain />} />
              <Route path="/brand-identity" element={<BrandIdentity />} />
              <Route path="/memory" element={<Memory />} />
              <Route path="/skills" element={<SkillsMarketplace />} />
              <Route path="/skills/:skillId" element={<SkillsMarketplace />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/permissions" element={<Permissions />} />
              <Route path="/agents" element={<Specialists />} />
              <Route path="/design" element={<DesignStudio />} />
              <Route path="/video" element={<VideoStudio />} />
              <Route path="/social" element={<SocialMedia />} />
              <Route path="/seo" element={<SeoStudio />} />
              <Route path="/analytics" element={<AnalyticsStudio />} />
              <Route path="/automation" element={<AutomationStudio />} />
              <Route path="/knowledge" element={<KnowledgeBase />} />

              {/* Jarvjis CEO Orb – bleibt */}
              <Route path="/jarvjis" element={<JarvjisAgent />} />
              <Route path="/builder" element={<AgentBuilder />} />

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

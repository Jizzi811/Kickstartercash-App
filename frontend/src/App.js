import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AppProvider } from "@/context/AppContext";
import { Layout } from "@/components/Layout";

// Core pages
import Dashboard from "@/pages/Dashboard";
import KnowledgeBase from "@/pages/KnowledgeBase";

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
import AgentBuilder from "@/pages/AgentBuilder";

function App() {
  return (
    <div className="App">
      <AppProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              {/* Phase 5 – Main Navigation */}
              <Route path="/" element={<Dashboard />} />
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
              <Route path="/specialists" element={<Specialists />} />
            </Routes>
          </Layout>
        </BrowserRouter>
        <Toaster theme="dark" position="top-right" richColors />
      </AppProvider>
    </div>
  );
}

export default App;

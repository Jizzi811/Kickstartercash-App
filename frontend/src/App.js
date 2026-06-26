import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AppProvider } from "@/context/AppContext";
import { Layout } from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Campaign from "@/pages/Campaign";
import BrandDesigner from "@/pages/BrandDesigner";
import SocialMedia from "@/pages/SocialMedia";
import ImageGenerator from "@/pages/ImageGenerator";
import Copywriter from "@/pages/Copywriter";
import Landingpage from "@/pages/Landingpage";
import ContentCalendar from "@/pages/ContentCalendar";
import Guardian from "@/pages/Guardian";
import PromptLibrary from "@/pages/PromptLibrary";
import ExportCenter from "@/pages/ExportCenter";

function App() {
  return (
    <div className="App">
      <AppProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/campaign" element={<Campaign />} />
              <Route path="/brand" element={<BrandDesigner />} />
              <Route path="/social" element={<SocialMedia />} />
              <Route path="/image" element={<ImageGenerator />} />
              <Route path="/copy" element={<Copywriter />} />
              <Route path="/landing" element={<Landingpage />} />
              <Route path="/calendar" element={<ContentCalendar />} />
              <Route path="/guardian" element={<Guardian />} />
              <Route path="/prompts" element={<PromptLibrary />} />
              <Route path="/export" element={<ExportCenter />} />
            </Routes>
          </Layout>
        </BrowserRouter>
        <Toaster theme="dark" position="top-right" richColors />
      </AppProvider>
    </div>
  );
}

export default App;

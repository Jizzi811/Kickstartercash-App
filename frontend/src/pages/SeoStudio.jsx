import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Globe, Copy, Check, Loader2, ExternalLink } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { ToolCard, AgentChatPanel } from "@/components/StudioLayout";
import { PageHeader } from "@/components/PageHeader";

const COLOR = "#34D399";

const TOOLS = [
  {
    id: "keywords",  label: "Keyword-Recherche", label_en: "Keyword Research",
    emoji: "🔍", type: "llm",
    desc: "Short-Tail, Long-Tail & LSI-Keywords mit Suchvolumen-Einschätzung.",
  },
  {
    id: "meta",      label: "Meta-Texte",        label_en: "Meta Texts",
    emoji: "📄", type: "llm",
    desc: "Optimierte Meta-Title (60 Z.) & Description (155 Z.) für Google.",
  },
  {
    id: "audit",     label: "SEO-Audit",         label_en: "SEO Audit",
    emoji: "🔎", type: "llm",
    desc: "Vollständige SEO-Checkliste und Optimierungsplan.",
  },
  {
    id: "schema",    label: "Schema Markup",     label_en: "Schema Markup",
    emoji: "🧩", type: "llm",
    desc: "JSON-LD Schema (Organization, Product, FAQ) für Rich Snippets.",
  },
  {
    id: "blog_seo",  label: "SEO-Artikel",       label_en: "SEO Article",
    emoji: "✍️", type: "llm",
    desc: "Vollständiger SEO-Blogartikel mit H1/H2/H3, Keywords, 800+ Wörter.",
  },
];

const EXTERNAL_TOOLS = [
  { name: "Firecrawl", emoji: "🔥", desc: "Web-Crawling & Content-Extraktion", url: "https://firecrawl.dev" },
  { name: "Google Search Console", emoji: "📊", desc: "Ranking & Impressionen analysieren", url: "https://search.google.com/search-console" },
  { name: "Ahrefs", emoji: "📈", desc: "Backlink-Analyse & Keyword-Tracking", url: "https://ahrefs.com" },
  { name: "Google Analytics 4", emoji: "📉", desc: "Traffic & Nutzerverhalten", url: "https://analytics.google.com" },
];

function ResultCard({ result, color }) {
  const [copied, setCopied] = useState(false);
  if (!result) return null;
  return (
    <div className="bg-[#0A0A0A] border border-white/8 rounded-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8">
        <span className="text-xs font-medium" style={{ color }}>{result.label}</span>
        <button onClick={() => { navigator.clipboard.writeText(result.text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white">
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied ? "Kopiert!" : "Kopieren"}
        </button>
      </div>
      <pre className="px-4 py-4 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed overflow-auto max-h-96">{result.text}</pre>
    </div>
  );
}

export default function SeoStudio() {
  const { lang, model } = useApp();
  const [toolLoading, setToolLoading] = useState(null);
  const [context, setContext] = useState("");
  const [result, setResult] = useState(null);

  const runTool = async (tool) => {
    if (!context.trim()) { toast.error(lang === "DE" ? "Bitte Thema/URL eingeben" : "Please enter topic/URL"); return; }
    setToolLoading(tool.id);
    setResult(null);
    try {
      const res = await axios.post(`${API}/agents/tools/run`, {
        agent_id: "seo", tool_id: tool.id, context, model, language: lang,
      });
      setResult({ label: lang === "DE" ? tool.label : tool.label_en, text: res.data.reply });
    } catch { toast.error("Fehler"); }
    finally { setToolLoading(null); }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Globe}
        color="#34D399"
        title="SEO Studio"
        subtitle={lang === "DE" ? "Firecrawl · Google Search Console · Ahrefs · Analytics" : "Firecrawl · Google Search Console · Ahrefs · Analytics"}
        badge="SEO"
      />

      {/* External Tool Integrations */}
      <div>
        <p className="text-[10px] text-zinc-700 uppercase tracking-widest mb-3">
          {lang === "DE" ? "Externe Tools" : "External Tools"}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {EXTERNAL_TOOLS.map((t) => (
            <a key={t.name} href={t.url} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-3 p-3 bg-[#0A0A0A] border border-white/8 rounded-sm hover:border-white/20 transition-all group">
              <span className="text-xl">{t.emoji}</span>
              <div>
                <div className="text-xs font-medium text-zinc-300 group-hover:text-white flex items-center gap-1">
                  {t.name} <ExternalLink size={9} className="text-zinc-600" />
                </div>
                <div className="text-[10px] text-zinc-600 mt-0.5">{t.desc}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-[#0A0A0A] border border-white/8 rounded-sm p-5 space-y-3">
            <label className="block text-xs text-zinc-500 uppercase tracking-widest">
              {lang === "DE" ? "Thema / URL / Nische" : "Topic / URL / Niche"}
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
              placeholder={lang === "DE"
                ? "z.B. kickstartercash.club – Affiliate-Marketing, passives Einkommen, MLM-Alternative…"
                : "e.g. kickstartercash.club – affiliate marketing, passive income, MLM alternative…"}
              className="w-full bg-black border border-white/8 rounded-sm px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none focus:border-[#34D399]/40"
            />
          </div>

          <div>
            <p className="text-[10px] text-zinc-700 uppercase tracking-widest mb-3">
              {lang === "DE" ? "KI-SEO-Tools" : "AI SEO Tools"}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TOOLS.map((tool) => (
                <ToolCard key={tool.id} tool={tool} color={COLOR} onRun={runTool}
                  isRunning={toolLoading === tool.id} disabled={!!toolLoading} />
              ))}
            </div>
          </div>

          {toolLoading && !result && (
            <div className="flex items-center gap-3 px-4 py-4 bg-[#0A0A0A] border border-white/8 rounded-sm text-zinc-500 text-sm">
              <Loader2 size={16} className="animate-spin" style={{ color: COLOR }} />
              {lang === "DE" ? "Wird analysiert…" : "Analyzing…"}
            </div>
          )}

          <ResultCard result={result} color={COLOR} />
        </div>

        <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/8 rounded-sm flex flex-col" style={{ minHeight: "480px" }}>
          <AgentChatPanel agentId="seo" agentName="SEO Agent" agentEmoji="🌍" color={COLOR}
            placeholder={lang === "DE" ? "SEO Agent fragen…" : "Ask the SEO agent…"} />
        </div>
      </div>
    </div>
  );
}

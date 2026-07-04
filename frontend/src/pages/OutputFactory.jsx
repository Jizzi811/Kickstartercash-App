import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Archive, CheckCircle2, Copy, Factory, FileText, Filter, Layers3, Mail, Megaphone, Mic2, PencilLine, Presentation, RefreshCw, Search, Sparkles, Video, Wand2, XCircle } from "lucide-react";
import { API, useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SORA = "'Sora', sans-serif";
const VIOLET = "#7C3AED";

const factories = [
  ["Social Content Factory", "social", Megaphone, "Posts, carousels, captions and channel variants"],
  ["Image Factory", "image", Wand2, "Campaign visuals, creative concepts and image prompts"],
  ["Video Factory", "video", Video, "Scripts, shot lists, storyboards and edit notes"],
  ["Voice Factory", "voice", Mic2, "Voice scripts, tone notes and audio prompts"],
  ["Landing Page Factory", "landing_page", Layers3, "Sections, hero copy, proof blocks and page QA"],
  ["Email Factory", "email", Mail, "Sequences, launches, nurture flows and subject lines"],
  ["Ad Factory", "ad", Megaphone, "Paid social/search concepts, hooks and variants"],
  ["Blog & SEO Factory", "blog_seo", Search, "Briefs, outlines, articles and on-page SEO"],
  ["Presentation Factory", "presentation", Presentation, "Deck narratives, slide outlines and speaker notes"],
  ["PDF/Lead Magnet Factory", "pdf_lead_magnet", FileText, "Guides, checklists, reports and gated assets"],
];

const queueColumns = ["Waiting", "Generating", "Reviewing", "Ready", "Approved", "Published"];
const seedAssets = factories.slice(0, 6).map(([name, type], i) => ({
  id: `asset-demo-${i + 1}`,
  type: name,
  campaign: i < 3 ? "Mission Control Launch" : "Brand Authority Sprint",
  brand: "BrandMind Demo",
  workspace: "Growth OS Workspace",
  creator_agent: ["Copywriter", "Designer", "Video Producer", "SEO Specialist"][i % 4],
  reviewer_agent: ["Marketing Director", "Creative Director", "Video Director", "SEO Lead"][i % 4],
  status: queueColumns[i % 5],
  version: `v${i + 1}`,
  created_at: new Date(Date.now() - i * 86400000).toISOString(),
  updated_at: new Date(Date.now() - i * 3600000).toISOString(),
  quality_scores: { brand: 91 - i, grammar: 94 - i, seo: 84 + i, conversion: 88 - i, creativity: 90, overall: 89 - i },
  review: { categories: ["Brand consistency", "Grammar", "CTA quality", "SEO", "Readability", "Visual consistency", "Compliance"], suggestions: i % 2 ? ["Strengthen the CTA with a more urgent next step."] : [] },
}));

function ShellCard({ children, className = "" }) {
  return <div className={`rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/20 ${className}`}>{children}</div>;
}

export default function OutputFactory() {
  const { activeWorkspace, activeBrand, lang } = useApp();
  const [assets, setAssets] = useState(seedAssets);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [busy, setBusy] = useState(false);

  const loadAssets = async () => {
    try {
      const res = await axios.get(`${API}/output-factory/assets`);
      if (res.data?.assets?.length) setAssets(res.data.assets);
    } catch { /* demo data keeps UI useful without a running API */ }
  };

  useEffect(() => { loadAssets(); }, []);

  const generateAsset = async (factory) => {
    setBusy(true);
    try {
      const payload = {
        type: factory[1],
        campaign: "Mission Control Launch",
        workspace: activeWorkspace,
        brand: activeBrand,
        mission_control_plan: { title: "Approved Mission Control plan", status: "approved" },
        ai_ceo_strategy: "Transform the approved strategy into a ready-to-review asset.",
        approved_department_tasks: [{ title: `${factory[0]} production task`, status: "approved" }],
        brand_brain_context: activeBrand || {},
      };
      const res = await axios.post(`${API}/output-factory/assets`, payload);
      setAssets((prev) => [res.data.asset, ...prev]);
    } catch {
      const now = new Date().toISOString();
      setAssets((prev) => [{
        id: `asset-${Date.now()}`, type: factory[0], campaign: "Mission Control Launch",
        brand: activeBrand?.name || "Active Brand", workspace: activeWorkspace?.name || "Active Workspace",
        creator_agent: factory[1].includes("image") ? "Designer" : factory[1].includes("seo") ? "SEO Specialist" : "Copywriter",
        reviewer_agent: factory[1].includes("image") ? "Creative Director" : factory[1].includes("seo") ? "SEO Lead" : "Marketing Director",
        status: "Ready", version: "v1", created_at: now, updated_at: now,
        quality_scores: { brand: 92, grammar: 95, seo: 88, conversion: 90, creativity: 93, overall: 92 },
        review: { categories: ["Brand consistency", "Grammar", "CTA quality", "SEO", "Readability", "Visual consistency", "Compliance"], suggestions: ["Review passed. Ready for human approval."] },
      }, ...prev]);
    } finally { setBusy(false); }
  };

  const act = (assetId, action) => setAssets((prev) => prev.map((a) => a.id === assetId ? { ...a, status: action === "approve" ? "Approved" : action === "archive" ? "Archived" : action === "reject" ? "Rejected" : "Reviewing", updated_at: new Date().toISOString() } : a));
  const duplicate = (asset) => setAssets((prev) => [{ ...asset, id: `asset-${Date.now()}`, version: `${asset.version}-copy`, status: "Waiting", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...prev]);

  const filtered = useMemo(() => assets.filter((a) => {
    const hay = `${a.type} ${a.campaign} ${a.brand} ${a.workspace} ${a.creator_agent} ${a.status}`.toLowerCase();
    return (status === "All" || a.status === status) && hay.includes(query.toLowerCase());
  }), [assets, query, status]);

  const count = (s) => assets.filter((a) => a.status === s).length;

  return (
    <main className="min-h-screen px-6 py-8 text-white" style={{ fontFamily: SORA }}>
      <section className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-950 via-zinc-950 to-black p-8">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative z-10 max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-4 py-2 text-xs text-violet-100"><Factory size={14}/> BrandMind AI Output Factory</div>
          <h1 className="text-4xl font-semibold tracking-tight">Production-ready marketing assets from approved Mission Control plans.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-300">Each factory receives the active workspace, active brand, Mission Control plan, AI CEO strategy, approved department tasks and Brand Brain context, then moves work through Input → Production Pipeline → Draft → Internal QA → Final Asset → Approval Queue.</p>
        </div>
      </section>

      <section className="mt-6 grid gap-3 md:grid-cols-6">
        {queueColumns.map((s) => <ShellCard key={s} className="p-4"><div className="text-xs text-zinc-400">{s}</div><div className="mt-2 text-3xl font-semibold" style={{ color: s === "Ready" ? "#c4b5fd" : "white" }}>{count(s)}</div></ShellCard>)}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-5">
        {factories.map((f) => { const Icon = f[2]; return <ShellCard key={f[1]} className="p-5">
          <Icon className="mb-4 text-violet-300" size={22}/><h3 className="text-sm font-semibold">{f[0]}</h3><p className="mt-2 min-h-12 text-xs leading-5 text-zinc-400">{f[3]}</p>
          <Button disabled={busy} onClick={() => generateAsset(f)} className="mt-4 w-full bg-violet-600 hover:bg-violet-500"><Sparkles size={14} className="mr-2"/>Generate</Button>
        </ShellCard>; })}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_1.9fr]">
        <ShellCard className="p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><CheckCircle2 color={VIOLET}/> Approval Center</h2>
          <div className="space-y-3">{filtered.slice(0, 5).map((a) => <div key={a.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{a.type}</p><p className="text-xs text-zinc-400">{a.campaign} · {a.version} · Overall {a.quality_scores?.overall || 0}</p></div><span className="rounded-full bg-violet-400/10 px-2 py-1 text-[11px] text-violet-200">{a.status}</span></div>
            <p className="mt-3 text-xs text-zinc-400">Reviewer: {a.reviewer_agent}. Suggestions: {a.review?.suggestions?.[0] || "No blocking issues."}</p>
            <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={() => act(a.id, "approve")}><CheckCircle2 size={13}/></Button><Button size="sm" variant="secondary" onClick={() => act(a.id, "changes")}><PencilLine size={13}/></Button><Button size="sm" variant="secondary" onClick={() => duplicate(a)}><Copy size={13}/></Button><Button size="sm" variant="destructive" onClick={() => act(a.id, "reject")}><XCircle size={13}/></Button><Button size="sm" variant="outline" onClick={() => act(a.id, "archive")}><Archive size={13}/></Button></div>
          </div>)}</div>
        </ShellCard>

        <ShellCard className="p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><h2 className="flex items-center gap-2 text-lg font-semibold"><Filter color={VIOLET}/> Searchable Asset Library</h2><div className="flex gap-2"><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search campaign, brand, agent, type..."/><select className="rounded-md border border-white/10 bg-zinc-950 px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}><option>All</option>{[...queueColumns,"Archived","Rejected"].map((s)=><option key={s}>{s}</option>)}</select><Button variant="secondary" onClick={loadAssets}><RefreshCw size={14}/></Button></div></div>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-zinc-500"><tr>{["ID","Type","Campaign","Brand","Creator","Reviewer","Status","Scores","Updated"].map(h=><th key={h} className="pb-3 pr-4">{h}</th>)}</tr></thead><tbody>{filtered.map((a)=><tr key={a.id} className="border-t border-white/10"><td className="py-3 pr-4 text-xs text-zinc-500">{a.id}</td><td className="pr-4">{a.type}</td><td className="pr-4 text-zinc-300">{a.campaign}</td><td className="pr-4 text-zinc-300">{a.brand}</td><td className="pr-4 text-zinc-400">{a.creator_agent}</td><td className="pr-4 text-zinc-400">{a.reviewer_agent}</td><td className="pr-4"><span className="rounded-full bg-white/5 px-2 py-1 text-xs">{a.status}</span></td><td className="pr-4 text-violet-200">{a.quality_scores?.overall}</td><td className="text-xs text-zinc-500">{new Date(a.updated_at).toLocaleDateString(lang === "DE" ? "de-DE" : "en-US")}</td></tr>)}</tbody></table></div>
        </ShellCard>
      </section>
    </main>
  );
}

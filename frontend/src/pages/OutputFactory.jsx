import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Archive, CheckCircle2, Factory, FileText, Filter, Layers3, Mail,
  Megaphone, Mic2, PencilLine, Presentation, RefreshCw, Search, Sparkles,
  Video, Wand2, XCircle, Loader2,
} from "lucide-react";
import { API, useApp } from "@/context/AppContext";
import {
  Page, Hero, Section, Card, Metric, StatGrid, Btn, BMBadge, EmptyState, SORA,
} from "@/components/bm";

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

export default function OutputFactory() {
  const navigate = useNavigate();
  const { activeWorkspace, activeBrand, lang } = useApp();
  const de = lang === "DE";
  // Real data only – no seeded demo assets. Empty means empty.
  const [assets, setAssets] = useState(null); // null = loading, [] = none
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [busy, setBusy] = useState(false);

  const loadAssets = async () => {
    try {
      const res = await axios.get(`${API}/output-factory/assets`);
      setAssets(res.data?.assets || []);
    } catch {
      setAssets([]);
    }
  };

  useEffect(() => { loadAssets(); }, []);

  const generateAsset = async (factory) => {
    setBusy(true);
    try {
      const payload = {
        type: factory[1],
        campaign: activeBrand?.name ? `${activeBrand.name} Campaign` : "Campaign",
        workspace: activeWorkspace,
        brand: activeBrand,
        brand_brain_context: activeBrand || {},
      };
      const res = await axios.post(`${API}/output-factory/assets`, payload);
      setAssets((prev) => [res.data.asset, ...(prev || [])]);
      toast.success(de ? "Asset erstellt – wartet auf Review" : "Asset created – awaiting review");
    } catch {
      // Never fabricate an asset or scores on failure.
      toast.error(de ? "Generierung fehlgeschlagen. Bitte erneut versuchen." : "Generation failed. Please try again.");
    } finally { setBusy(false); }
  };

  const act = async (assetId, action) => {
    const next = action === "approve" ? "Approved" : action === "archive" ? "Archived" : action === "reject" ? "Rejected" : "Reviewing";
    try {
      await axios.patch(`${API}/output-factory/assets/${assetId}`, { status: next });
      setAssets((prev) => prev.map((a) => a.id === assetId ? { ...a, status: next, updated_at: new Date().toISOString() } : a));
    } catch { toast.error(de ? "Aktion fehlgeschlagen" : "Action failed"); }
  };

  const list = useMemo(() => assets || [], [assets]);
  const filtered = useMemo(() => list.filter((a) => {
    const hay = `${a.type} ${a.campaign} ${a.brand} ${a.creator_agent} ${a.status}`.toLowerCase();
    return (status === "All" || a.status === status) && hay.includes(query.toLowerCase());
  }), [list, query, status]);

  const count = (s) => list.filter((a) => a.status === s).length;
  const hasAssets = list.length > 0;

  return (
    <Page>
      <Hero
        icon={Factory}
        badge="AI Output Factory"
        title={de ? "Produktionsreife Marketing-Assets" : "Production-ready marketing assets"}
        description={de
          ? "Jede Factory erhält Workspace, Marke, Mission-Control-Plan und Brand Brain – und führt die Arbeit durch Produktion, QA und Freigabe."
          : "Each factory receives your workspace, brand, Mission Control plan and Brand Brain – moving work through production, QA and approval."}
        chips={<>
          <BMBadge>{activeBrand?.name || "—"}</BMBadge>
          <BMBadge tone="neutral">{activeWorkspace?.name || "—"}</BMBadge>
        </>}
      />

      {/* Queue stats – real counts, or zeros with a hint */}
      <Section title={de ? "Pipeline" : "Pipeline"} icon={Filter}
        right={!hasAssets && assets !== null && (
          <span className="text-[11px] text-zinc-600">{de ? "Keine aktiven Workflows." : "No active workflows."}</span>
        )}>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {queueColumns.map((s) => (
            <Metric key={s} label={s} value={assets === null ? "—" : count(s)} />
          ))}
        </div>
      </Section>

      {/* Factories – product capabilities (static), generation is real */}
      <Section title={de ? "Factories" : "Factories"} icon={Sparkles}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {factories.map((f) => {
            const Icon = f[2];
            return (
              <Card key={f[1]} size="s" className="flex flex-col">
                <Icon className="mb-3" size={20} style={{ color: "#a78bfa" }} />
                <h3 className="text-sm font-semibold text-zinc-100" style={{ fontFamily: SORA }}>{f[0]}</h3>
                <p className="mt-2 flex-1 text-xs leading-5 text-zinc-500">{f[3]}</p>
                <Btn size="sm" disabled={busy} onClick={() => generateAsset(f)} className="mt-4 w-full">
                  {busy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Generate
                </Btn>
              </Card>
            );
          })}
        </div>
      </Section>

      {/* Assets – real data or a premium empty state */}
      {assets !== null && !hasAssets ? (
        <EmptyState
          icon={Factory}
          title={de ? "Noch keine Marketing-Assets erstellt" : "No marketing assets yet"}
          description={de
            ? "Starte eine Kampagne in Mission Control oder erzeuge dein erstes Asset direkt über eine Factory."
            : "Start a campaign in Mission Control or generate your first asset directly from a factory."}
          actionLabel={de ? "Erste Kampagne starten" : "Start first campaign"}
          onAction={() => navigate("/mission")}
          secondaryLabel={de ? "Aktualisieren" : "Refresh"}
          onSecondary={loadAssets}
        />
      ) : hasAssets && (
        <Section title={de ? "Freigabe & Bibliothek" : "Approval & Library"} icon={CheckCircle2}>
          <div className="grid gap-6 xl:grid-cols-[1.1fr_1.9fr]">
            <Card>
              <div className="mb-4 text-sm font-semibold text-zinc-200" style={{ fontFamily: SORA }}>
                {de ? "Freigabe-Center" : "Approval Center"}
              </div>
              <div className="space-y-3">
                {filtered.slice(0, 5).map((a) => (
                  <Card key={a.id} size="s">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">{a.type}</p>
                        <p className="text-xs text-zinc-500">{a.campaign} · {a.version}{a.quality_scores?.overall ? ` · Score ${a.quality_scores.overall}` : ""}</p>
                      </div>
                      <BMBadge tone={a.status === "Approved" ? "success" : "violet"}>{a.status}</BMBadge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Btn size="sm" onClick={() => act(a.id, "approve")}><CheckCircle2 size={13} /></Btn>
                      <Btn size="sm" variant="secondary" onClick={() => act(a.id, "changes")}><PencilLine size={13} /></Btn>
                      <Btn size="sm" variant="ghost" onClick={() => act(a.id, "archive")}><Archive size={13} /></Btn>
                      <Btn size="sm" variant="danger" onClick={() => act(a.id, "reject")}><XCircle size={13} /></Btn>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            <Card>
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm font-semibold text-zinc-200" style={{ fontFamily: SORA }}>
                  {de ? "Asset-Bibliothek" : "Asset Library"}
                </div>
                <div className="flex gap-2">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={de ? "Suchen…" : "Search…"}
                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#7C3AED]/50"
                  />
                  <select
                    className="rounded-lg border border-white/10 bg-zinc-950 px-3 text-sm"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option>All</option>
                    {[...queueColumns, "Archived", "Rejected"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <Btn variant="secondary" size="sm" onClick={loadAssets}><RefreshCw size={14} /></Btn>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-zinc-500">
                    <tr>{["Type", "Campaign", "Creator", "Status", "Score", "Updated"].map((h) => <th key={h} className="pb-3 pr-4 font-medium h-8">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filtered.map((a) => (
                      <tr key={a.id} className="border-t border-white/5">
                        <td className="py-3 pr-4 text-zinc-200">{a.type}</td>
                        <td className="pr-4 text-zinc-400">{a.campaign}</td>
                        <td className="pr-4 text-zinc-400">{a.creator_agent}</td>
                        <td className="pr-4"><BMBadge tone="neutral">{a.status}</BMBadge></td>
                        <td className="pr-4 text-violet-300">{a.quality_scores?.overall ?? "—"}</td>
                        <td className="text-xs text-zinc-500">{a.updated_at ? new Date(a.updated_at).toLocaleDateString(de ? "de-DE" : "en-US") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </Section>
      )}
    </Page>
  );
}

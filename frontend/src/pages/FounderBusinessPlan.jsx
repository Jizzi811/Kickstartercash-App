import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { FileText, Loader2, Sparkles, CheckCircle2, ShieldAlert, Flag } from "lucide-react";
import { API } from "@/context/AppContext";
import { Page, Hero, Card, Btn, BMBadge, FieldLabel, Input } from "@/components/bm";

function Block({ title, children }) {
  return (
    <div>
      <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">{title}</div>
      <div className="text-sm leading-relaxed text-zinc-300">{children || "—"}</div>
    </div>
  );
}

export default function FounderBusinessPlan() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [focus, setFocus] = useState("");
  const [plan, setPlan] = useState({});

  const load = async () => {
    const { data } = await axios.get(`${API}/founder/business-plan`);
    setPlan(data.plan || {});
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try { await load(); } catch (e) { console.warn(e); } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      const { data } = await axios.post(`${API}/founder/business-plan/generate`, { language: "DE", focus });
      setPlan(data.plan || {});
      toast.success("Businessplan erstellt");
    } catch (e) {
      console.warn(e);
      toast.error("Businessplan konnte nicht erstellt werden");
    } finally {
      setGenerating(false);
    }
  };

  const apply = async () => {
    if (!plan.executive_summary && !plan.business_model) return toast.error("Bitte zuerst generieren");
    setApplying(true);
    try {
      await axios.post(`${API}/founder/business-plan/apply`, { plan });
      toast.success("Businessplan im Decision Memory gespeichert");
      navigate("/onboarding/founder/finance");
    } catch (e) {
      console.warn(e);
      toast.error("Businessplan konnte nicht übernommen werden");
    } finally {
      setApplying(false);
    }
  };

  const has = plan.executive_summary || plan.business_model;
  const m = plan.market_analysis || {};
  const c = plan.competition || {};
  const g = plan.go_to_market || {};

  return (
    <Page>
      <Hero
        icon={FileText}
        badge="Founder Flow · Phase 6 · Carl (CFO)"
        title="Businessplan"
        description="Carl leitet aus deiner Idee, Marke und deinen Angeboten einen investorentauglichen Businessplan ab."
        actions={(
          <>
            <Btn variant="ghost" onClick={() => navigate("/onboarding/founder/offers")}>Zurück zu Produkten</Btn>
            <Btn variant="ghost" onClick={() => navigate("/onboarding/founder/finance")}>Weiter zum Finanzplan</Btn>
            <Btn onClick={generate} disabled={generating}>
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {has ? "Erneut generieren" : "Businessplan erstellen"}
            </Btn>
          </>
        )}
      />

      <Card>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <FieldLabel>Fokus (optional)</FieldLabel>
            <Input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="z. B. Bootstrapping / schnelle Skalierung / B2B-Fokus" />
          </div>
          <Btn onClick={generate} disabled={generating}>
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Generieren
          </Btn>
        </div>
      </Card>

      {loading ? (
        <Card><div className="inline-flex items-center gap-2 text-sm text-zinc-400"><Loader2 size={14} className="animate-spin" />Wird geladen…</div></Card>
      ) : !has ? (
        <Card><p className="text-sm text-zinc-400">Noch kein Businessplan vorhanden. Klicke oben auf „Businessplan erstellen".</p></Card>
      ) : (
        <>
          <Card className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Executive Summary</h3>
            <p className="text-sm leading-relaxed text-zinc-300">{plan.executive_summary}</p>
            <div className="grid gap-4 md:grid-cols-2">
              <Block title="Problem">{plan.problem}</Block>
              <Block title="Lösung">{plan.solution}</Block>
            </div>
            <Block title="Geschäftsmodell">{plan.business_model}</Block>
          </Card>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Marktanalyse</h3>
              <Block title="Zielmarkt">{m.target_market}</Block>
              <Block title="Marktgröße">{m.market_size}</Block>
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Trends</div>
                <div className="flex flex-wrap gap-1.5">{(m.trends || []).map((t, i) => <BMBadge key={i} tone="neutral">{t}</BMBadge>)}</div>
              </div>
            </Card>
            <Card className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Wettbewerb</h3>
              <Block title="Landschaft">{c.landscape}</Block>
              <Block title="Wettbewerbsvorteil">{c.advantage}</Block>
            </Card>
          </section>

          <Card className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Go-to-Market</h3>
            <Block title="Strategie">{g.strategy}</Block>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Kanäle</div>
                <ul className="space-y-1">{(g.channels || []).map((x, i) => <li key={i} className="text-xs text-zinc-400">• {x}</li>)}</ul>
              </div>
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Erste Schritte</div>
                <ul className="space-y-1">{(g.first_steps || []).map((x, i) => <li key={i} className="text-xs text-zinc-400">• {x}</li>)}</ul>
              </div>
            </div>
          </Card>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-300"><Flag size={14} /> Meilensteine</h3>
              {(plan.milestones || []).map((ms, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <BMBadge tone="info">{ms.timeframe}</BMBadge>
                  <p className="mt-1.5 text-sm text-zinc-300">{ms.goal}</p>
                </div>
              ))}
            </Card>
            <Card className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-300"><ShieldAlert size={14} /> Risiken</h3>
              {(plan.risks || []).map((r, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-sm font-semibold text-zinc-200">{r.risk}</p>
                  <p className="mt-1 text-xs text-zinc-400">↳ {r.mitigation}</p>
                </div>
              ))}
              <Block title="Team">{plan.team}</Block>
            </Card>
          </section>

          <Card className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-400">Speichert den Businessplan als gelockte Entscheidung — der Finanzplan (Phase 7) baut darauf auf.</p>
            <Btn onClick={apply} disabled={applying}>
              {applying ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Übernehmen & weiter
            </Btn>
          </Card>
        </>
      )}
    </Page>
  );
}

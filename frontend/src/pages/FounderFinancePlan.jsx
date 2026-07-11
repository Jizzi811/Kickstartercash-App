import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { LineChart, Loader2, Sparkles, CheckCircle2, Wallet, Target } from "lucide-react";
import FounderProgress from "@/components/FounderProgress";
import { API } from "@/context/AppContext";
import { Page, Hero, Card, Btn, BMBadge, FieldLabel, Input } from "@/components/bm";

export default function FounderFinancePlan() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [capital, setCapital] = useState("");
  const [focus, setFocus] = useState("");
  const [plan, setPlan] = useState({});

  const load = async () => {
    const { data } = await axios.get(`${API}/founder/finance-plan`);
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
      const { data } = await axios.post(`${API}/founder/finance-plan/generate`, {
        language: "DE", currency: "EUR", starting_capital: capital, focus,
      });
      setPlan(data.plan || {});
      toast.success("Finanzplan erstellt");
    } catch (e) {
      console.warn(e);
      toast.error("Finanzplan konnte nicht erstellt werden");
    } finally {
      setGenerating(false);
    }
  };

  const apply = async () => {
    if (!(plan.revenue_projection || []).length && !plan.profitability) return toast.error("Bitte zuerst generieren");
    setApplying(true);
    try {
      await axios.post(`${API}/founder/finance-plan/apply`, { plan });
      toast.success("Finanzplan im Decision Memory gespeichert");
      navigate("/ops");
    } catch (e) {
      console.warn(e);
      toast.error("Finanzplan konnte nicht übernommen werden");
    } finally {
      setApplying(false);
    }
  };

  const has = (plan.revenue_projection || []).length || plan.profitability;
  const be = plan.break_even || {};
  const fn = plan.funding_need || {};

  return (
    <Page>
      <FounderProgress current="finance" />
      <Hero
        icon={LineChart}
        badge="Founder Flow · Phase 7 · Ines"
        title="Finanzplan"
        description="Ines baut aus deinem Businessplan und deiner Preisstrategie eine realistische 3-Jahres-Finanzplanung mit Break-even und Kapitalbedarf."
        actions={(
          <>
            <Btn variant="ghost" onClick={() => navigate("/onboarding/founder/business-plan")}>Zurück zum Businessplan</Btn>
            <Btn onClick={generate} disabled={generating}>
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {has ? "Erneut generieren" : "Finanzplan erstellen"}
            </Btn>
          </>
        )}
      />

      <Card>
        <p className="mb-3 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">Die erstellten Inhalte sind Entwürfe zur Planung und allgemeinen Information. Sie ersetzen keine individuelle Steuer-, Rechts-, Finanz- oder Anlageberatung.<br />The generated content is a planning draft for general information. It does not replace individual tax, legal, financial, or investment advice.</p>
        <div className="grid gap-4 md:grid-cols-3 md:items-end">
          <div>
            <FieldLabel>Startkapital (optional)</FieldLabel>
            <Input value={capital} onChange={(e) => setCapital(e.target.value)} placeholder="z. B. 20.000 €" />
          </div>
          <div>
            <FieldLabel>Fokus (optional)</FieldLabel>
            <Input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="z. B. schnelle Profitabilität" />
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
        <Card><p className="text-sm text-zinc-400">Noch kein Finanzplan vorhanden. Klicke oben auf „Finanzplan erstellen".</p></Card>
      ) : (
        <>
          {(plan.assumptions || []).length > 0 && (
            <Card className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Annahmen</h3>
              <ul className="space-y-1">{plan.assumptions.map((a, i) => <li key={i} className="text-sm text-zinc-400">• {a}</li>)}</ul>
            </Card>
          )}

          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Umsatzprognose</h3>
              {(plan.revenue_projection || []).map((r, i) => (
                <div key={i} className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
                  <div>
                    <div className="text-sm font-semibold text-zinc-200">{r.period}</div>
                    {r.note && <div className="text-xs text-zinc-500">{r.note}</div>}
                  </div>
                  <div className="text-sm font-semibold text-violet-300">{r.revenue}</div>
                </div>
              ))}
            </Card>
            <Card className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Kostenstruktur</h3>
              {(plan.cost_structure || []).map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs">
                  <span className="text-zinc-300">{c.item}</span>
                  <span className="text-zinc-500">{c.monthly && `${c.monthly}/M`}{c.yearly ? ` · ${c.yearly}/J` : ""}</span>
                </div>
              ))}
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-300"><Target size={14} /> Break-even</h3>
              <div className="flex flex-wrap gap-1.5">
                {be.timeframe && <BMBadge tone="info">{be.timeframe}</BMBadge>}
                {be.units_or_customers && <BMBadge tone="neutral">{be.units_or_customers}</BMBadge>}
              </div>
              {be.explanation && <p className="text-sm leading-relaxed text-zinc-400">{be.explanation}</p>}
            </Card>
            <Card className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-300"><Wallet size={14} /> Kapitalbedarf</h3>
              <div className="flex flex-wrap gap-1.5">
                {fn.amount && <BMBadge tone="info">{fn.amount}</BMBadge>}
                {fn.runway && <BMBadge tone="neutral">Runway: {fn.runway}</BMBadge>}
              </div>
              {(fn.use_of_funds || []).length > 0 && (
                <ul className="space-y-1">{fn.use_of_funds.map((u, i) => <li key={i} className="text-xs text-zinc-400">• {u}</li>)}</ul>
              )}
            </Card>
          </section>

          <Card className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Weg zur Profitabilität</h3>
            <p className="text-sm leading-relaxed text-zinc-300">{plan.profitability || "—"}</p>
            {(plan.kpis || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">{plan.kpis.map((k, i) => <BMBadge key={i} tone="neutral">{k}</BMBadge>)}</div>
            )}
          </Card>

          <Card className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-400">Speichert den Finanzplan als gelockte Entscheidung — Website & Marketing (Phase 8+) bauen darauf auf.</p>
            <Btn onClick={apply} disabled={applying}>
              {applying ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Übernehmen
            </Btn>
          </Card>
        </>
      )}
    </Page>
  );
}

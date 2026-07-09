import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Package, Loader2, Sparkles, CheckCircle2, Tag } from "lucide-react";
import { API } from "@/context/AppContext";
import { Page, Hero, Card, Btn, BMBadge, FieldLabel, Input } from "@/components/bm";

function OfferCard({ offer }) {
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <BMBadge tone="info">{offer.type}</BMBadge>
        <h3 className="text-base font-semibold text-zinc-100">{offer.name}</h3>
        {offer.price && <span className="ml-auto text-sm font-semibold text-violet-300">{offer.price}</span>}
      </div>
      <p className="text-sm leading-relaxed text-zinc-400">{offer.summary}</p>
      {offer.value_proposition && (
        <p className="text-xs italic text-zinc-500">{offer.value_proposition}</p>
      )}
      {offer.target_segment && (
        <div className="text-xs text-zinc-500">Zielsegment: <span className="text-zinc-300">{offer.target_segment}</span></div>
      )}
      {(offer.deliverables || []).length > 0 && (
        <ul className="space-y-1">
          {offer.deliverables.map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
              <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0 text-violet-300" /> {d}
            </li>
          ))}
        </ul>
      )}
      {offer.price_model && (
        <div className="text-[10px] uppercase tracking-wide text-zinc-600">Preismodell: {offer.price_model}</div>
      )}
    </Card>
  );
}

function PackageCard({ pkg }) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-zinc-100">{pkg.name}</h3>
        {pkg.price && <span className="text-sm font-semibold text-violet-300">{pkg.price}</span>}
      </div>
      {pkg.best_for && <p className="text-xs text-zinc-500">Ideal für: {pkg.best_for}</p>}
      <ul className="space-y-1">
        {(pkg.includes || []).map((d, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
            <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0 text-violet-300" /> {d}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function FounderOffers() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [focus, setFocus] = useState("");
  const [positioning, setPositioning] = useState("");
  const [offers, setOffers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [pricing, setPricing] = useState({});

  const load = async () => {
    const { data } = await axios.get(`${API}/founder/offers`);
    setPositioning(data.positioning || "");
    setOffers(data.offers || []);
    setPackages(data.packages || []);
    setPricing(data.pricing_strategy || {});
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await load();
      } catch (error) {
        console.warn(error);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      const { data } = await axios.post(`${API}/founder/offers/generate`, { language: "DE", focus });
      setPositioning(data.positioning || "");
      setOffers(data.offers || []);
      setPackages(data.packages || []);
      setPricing(data.pricing_strategy || {});
      toast.success("Produkte & Angebote erstellt");
    } catch (error) {
      console.warn(error);
      toast.error("Angebote konnten nicht erstellt werden");
    } finally {
      setGenerating(false);
    }
  };

  const apply = async () => {
    if (!offers.length) return toast.error("Bitte zuerst Angebote generieren");
    setApplying(true);
    try {
      await axios.post(`${API}/founder/offers/apply`, {
        offers,
        packages,
        pricing_strategy: pricing,
        positioning,
      });
      toast.success("Produkt-Portfolio & Preisstrategie im Decision Memory gespeichert");
      navigate("/onboarding/founder/business-plan");
    } catch (error) {
      console.warn(error);
      toast.error("Angebote konnten nicht übernommen werden");
    } finally {
      setApplying(false);
    }
  };

  return (
    <Page>
      <Hero
        icon={Package}
        badge="Founder Flow · Phase 5"
        title="Produkte & Angebote"
        description="Brandmind leitet aus deiner Marke, Idee und deinen Entscheidungen ein verkaufsfertiges Angebots-Portfolio samt Preisstrategie ab."
        actions={(
          <>
            <Btn variant="ghost" onClick={() => navigate("/onboarding/founder/brand")}>Zurück zur Marke</Btn>
            <Btn variant="ghost" onClick={() => navigate("/onboarding/founder/business-plan")}>Weiter zum Businessplan</Btn>
            <Btn onClick={generate} disabled={generating}>
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {offers.length ? "Erneut generieren" : "Angebote entwickeln"}
            </Btn>
          </>
        )}
      />

      <Card>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <FieldLabel>Fokus (optional)</FieldLabel>
            <Input
              value={focus}
              onChange={(event) => setFocus(event.target.value)}
              placeholder="z. B. Fokus auf wiederkehrende Umsätze / Premium-Positionierung"
            />
          </div>
          <Btn onClick={generate} disabled={generating}>
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Generieren
          </Btn>
        </div>
      </Card>

      {loading ? (
        <Card>
          <div className="inline-flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 size={14} className="animate-spin" />
            Wird geladen…
          </div>
        </Card>
      ) : !offers.length ? (
        <Card>
          <p className="text-sm text-zinc-400">
            Noch keine Angebote vorhanden. Klicke oben auf "Angebote entwickeln", um aus deiner Marke ein
            Produkt-Portfolio mit Paketen und Preisstrategie zu generieren.
          </p>
        </Card>
      ) : (
        <>
          {positioning && (
            <Card className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Positionierung</h3>
              <p className="text-sm leading-relaxed text-zinc-400">{positioning}</p>
            </Card>
          )}

          <section className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Angebote</h3>
            <div className="grid gap-4 lg:grid-cols-2">
              {offers.map((offer, idx) => <OfferCard key={offer.name + idx} offer={offer} />)}
            </div>
          </section>

          {packages.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Pakete</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {packages.map((pkg, idx) => <PackageCard key={pkg.name + idx} pkg={pkg} />)}
              </div>
            </section>
          )}

          {(pricing.model || pricing.rationale) && (
            <Card className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-300">
                <Tag size={14} /> Preisstrategie
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {pricing.model && <BMBadge tone="info">{pricing.model}</BMBadge>}
                {pricing.positioning && <BMBadge tone="neutral">{pricing.positioning}</BMBadge>}
              </div>
              {pricing.rationale && <p className="text-sm leading-relaxed text-zinc-400">{pricing.rationale}</p>}
            </Card>
          )}

          <Card className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-400">
              Speichert Produkt-Portfolio und Preisstrategie als gelockte Entscheidungen — alle Agenten und
              späteren Phasen (Businessplan, Website) bauen darauf auf.
            </p>
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

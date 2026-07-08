import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Sparkles, Loader2, CheckCircle2, Palette } from "lucide-react";
import { API, useApp } from "@/context/AppContext";
import { Page, Hero, Card, Btn, BMBadge } from "@/components/bm";

function NameCard({ candidate, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-4 text-left transition-colors ${
        selected ? "border-violet-400/50 bg-violet-500/10" : "border-white/10 bg-black/20 hover:border-white/20"
      }`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-base font-semibold text-zinc-100">{candidate.name}</span>
        {selected && <CheckCircle2 size={16} className="text-violet-300" />}
      </div>
      {candidate.claim && <p className="text-sm italic text-zinc-400">"{candidate.claim}"</p>}
      {candidate.reasoning && <p className="mt-2 text-xs leading-relaxed text-zinc-500">{candidate.reasoning}</p>}
    </button>
  );
}

function Swatch({ label, hex }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
      <span className="h-6 w-6 flex-shrink-0 rounded-full border border-white/20" style={{ background: hex }} />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
        <div className="truncate text-xs text-zinc-300">{hex}</div>
      </div>
    </div>
  );
}

export default function FounderBrandDevelopment() {
  const navigate = useNavigate();
  const { setActiveBrandId } = useApp();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [names, setNames] = useState([]);
  const [story, setStory] = useState({});
  const [design, setDesign] = useState({});
  const [selectedIdx, setSelectedIdx] = useState(0);

  const load = async () => {
    const { data } = await axios.get(`${API}/founder/brand-development`);
    setNames(data.names || []);
    setStory(data.story || {});
    setDesign(data.design || {});
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
      const { data } = await axios.post(`${API}/founder/brand-development/generate`, { language: "DE" });
      setNames(data.names || []);
      setStory(data.story || {});
      setDesign(data.design || {});
      setSelectedIdx(0);
      toast.success("Markenentwicklung erstellt");
    } catch (error) {
      console.warn(error);
      toast.error("Markenentwicklung konnte nicht erstellt werden");
    } finally {
      setGenerating(false);
    }
  };

  const apply = async () => {
    const chosen = names[selectedIdx];
    if (!chosen) return toast.error("Bitte zuerst einen Markennamen wählen");
    setApplying(true);
    try {
      const { data } = await axios.post(`${API}/founder/brand-development/apply`, {
        name: chosen.name,
        claim: chosen.claim,
        reasoning: chosen.reasoning,
        mission: story.mission || "",
        vision: story.vision || "",
        values: story.values || [],
        brand_story: story.brand_story || "",
        primary_color: design.primary_color,
        secondary_color: design.secondary_color,
        accent_color: design.accent_color,
        font_heading: design.font_heading,
        font_body: design.font_body,
        image_style: design.image_style,
        logo_concept: design.logo_concept,
      });
      if (data?.brand?.id) setActiveBrandId(data.brand.id);
      toast.success("Marke übernommen — Brand-Identity ist jetzt aktiv");
      navigate("/brand-identity");
    } catch (error) {
      console.warn(error);
      toast.error("Marke konnte nicht übernommen werden");
    } finally {
      setApplying(false);
    }
  };

  return (
    <Page>
      <Hero
        icon={Sparkles}
        badge="Founder Flow · Phase 3 & 4"
        title="Markenentwicklung & Corporate Design"
        description="Brandmind schlägt Markennamen, Story und Design-Richtung vor. Wähle einen Namen, dann übernimm alles in deine Brand Identity."
        actions={(
          <>
            <Btn variant="ghost" onClick={() => navigate("/onboarding/founder/ideas")}>Zurück zu Ideen</Btn>
            <Btn onClick={generate} disabled={generating}>
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {names.length ? "Erneut generieren" : "Marke entwickeln"}
            </Btn>
          </>
        )}
      />

      {loading ? (
        <Card>
          <div className="inline-flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 size={14} className="animate-spin" />
            Wird geladen…
          </div>
        </Card>
      ) : !names.length ? (
        <Card>
          <p className="text-sm text-zinc-400">
            Noch keine Markenentwicklung vorhanden. Klicke oben auf "Marke entwickeln", um Namen, Markenstory
            und eine Design-Richtung generieren zu lassen.
          </p>
        </Card>
      ) : (
        <>
          <Card className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Markenname wählen</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {names.map((candidate, idx) => (
                <NameCard
                  key={candidate.name + idx}
                  candidate={candidate}
                  selected={selectedIdx === idx}
                  onSelect={() => setSelectedIdx(idx)}
                />
              ))}
            </div>
          </Card>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Markenstory</h3>
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Mission</div>
                <p className="text-sm text-zinc-300">{story.mission || "—"}</p>
              </div>
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Vision</div>
                <p className="text-sm text-zinc-300">{story.vision || "—"}</p>
              </div>
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Werte</div>
                <div className="flex flex-wrap gap-1.5">
                  {(story.values || []).map((v) => <BMBadge key={v} tone="neutral">{v}</BMBadge>)}
                </div>
              </div>
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Story</div>
                <p className="text-sm leading-relaxed text-zinc-400">{story.brand_story || "—"}</p>
              </div>
            </Card>

            <Card className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-300">
                <Palette size={14} /> Corporate Design
              </h3>
              <div className="grid gap-2 sm:grid-cols-3">
                <Swatch label="Primär" hex={design.primary_color} />
                <Swatch label="Sekundär" hex={design.secondary_color} />
                <Swatch label="Akzent" hex={design.accent_color} />
              </div>
              <div className="text-sm text-zinc-300">
                Schrift: <span className="text-zinc-100">{design.font_heading}</span> / {design.font_body}
              </div>
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Bildstil</div>
                <p className="text-sm leading-relaxed text-zinc-400">{design.image_style || "—"}</p>
              </div>
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Logo-Konzept</div>
                <p className="text-sm leading-relaxed text-zinc-400">{design.logo_concept || "—"}</p>
              </div>
            </Card>
          </section>

          <Card className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-400">
              Übernimmt Name, Story und Design als deine aktive Brand Identity — sofort nutzbar von allen Agenten.
            </p>
            <Btn onClick={apply} disabled={applying}>
              {applying ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Marke übernehmen
            </Btn>
          </Card>
        </>
      )}
    </Page>
  );
}

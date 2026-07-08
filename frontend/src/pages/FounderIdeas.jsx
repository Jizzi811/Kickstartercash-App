import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Lightbulb, Loader2, Sparkles, Lock, CheckCircle2 } from "lucide-react";
import { API } from "@/context/AppContext";
import { Page, Hero, Card, Btn, FieldLabel, Input, Textarea, BMBadge } from "@/components/bm";

function Score({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-300">
      <span>{label}</span>
      <span className="font-semibold text-zinc-100">{value}</span>
    </div>
  );
}

export default function FounderIdeas() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [focus, setFocus] = useState("");
  const [marketHint, setMarketHint] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [briefing, setBriefing] = useState(false);

  const selectedIdeaId = profile?.selected_idea_id || "";

  const load = async () => {
    const [intakeRes, ideasRes, decisionsRes] = await Promise.all([
      axios.get(`${API}/founder/intake`),
      axios.get(`${API}/founder/ideas`),
      axios.get(`${API}/decisions`, { params: { category: "business_idea" } }),
    ]);
    setProfile(intakeRes.data);
    setIdeas(ideasRes.data.ideas || []);
    setDecisions(decisionsRes.data.decisions || []);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await load();
      } catch (error) {
        toast.error("Founder-Ideen konnten nicht geladen werden");
        console.warn(error);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const selectedDecision = useMemo(
    () => decisions.find((decision) => decision.status === "locked") || decisions[0],
    [decisions]
  );

  const generateIdeas = async () => {
    setGenerating(true);
    try {
      const { data } = await axios.post(`${API}/founder/ideas/generate`, {
        focus,
        market_hint: marketHint,
        language: "DE",
      });
      setIdeas(data.ideas || []);
      toast.success("Neue Ideen wurden erstellt");
    } catch (error) {
      toast.error("Ideen konnten nicht erstellt werden");
      console.warn(error);
    } finally {
      setGenerating(false);
    }
  };

  const selectIdea = async (idea) => {
    try {
      await axios.post(`${API}/founder/ideas/select`, { idea_id: idea.id });
      await axios.post(`${API}/decisions`, {
        category: "business_idea",
        selected_option: idea.title,
        alternatives: ideas.filter((item) => item.id !== idea.id).slice(0, 3).map((item) => item.title),
        why_text: idea.summary || "Ausgewählte Founder-Idee.",
        evidence_refs: [idea.target_audience || "", idea.first_offer || ""].filter(Boolean),
        confidence: 74,
        decided_by: "user",
      });
      await load();
      toast.success("Idee ausgewählt und als Decision gespeichert");
    } catch (error) {
      toast.error("Idee konnte nicht gespeichert werden");
      console.warn(error);
    }
  };

  const lockDecision = async (decisionId) => {
    try {
      await axios.post(`${API}/decisions/${decisionId}/lock`);
      await load();
      toast.success("Decision wurde gelockt");
    } catch (error) {
      toast.error("Decision konnte nicht gelockt werden");
      console.warn(error);
    }
  };

  const generateBrief = async () => {
    setBriefing(true);
    try {
      await axios.post(`${API}/brand-brief/generate`, { language: "DE" });
      toast.success("Brand Brief erstellt");
      navigate("/brand-brain");
    } catch (error) {
      toast.error("Brand Brief konnte nicht erstellt werden");
      console.warn(error);
    } finally {
      setBriefing(false);
    }
  };

  return (
    <Page>
      <Hero
        icon={Lightbulb}
        badge="Founder Flow · Phase 2 & 3"
        title="Ideenfindung & Entscheidungen"
        description="Generiere Geschäftsideen, wähle eine Richtung und speichere die Begründung im Decision Memory."
        actions={(
          <>
            <Btn variant="ghost" onClick={() => navigate("/onboarding/founder/intake")}>Zurück zur Vision</Btn>
            <Btn variant="ghost" onClick={() => navigate("/ops")}>Content Ops Hub</Btn>
            <Btn onClick={generateBrief} disabled={briefing || !selectedDecision}>
              {briefing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Brand Brief generieren
            </Btn>
          </>
        )}
      />

      {loading ? (
        <Card>
          <div className="inline-flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 size={14} className="animate-spin" />
            Founder-Ideen werden geladen…
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Fokus (optional)</FieldLabel>
                <Input
                  value={focus}
                  onChange={(event) => setFocus(event.target.value)}
                  placeholder="z. B. AI-Beratung für Coaches"
                />
              </div>
              <div>
                <FieldLabel>Markt-Hinweis (optional)</FieldLabel>
                <Input
                  value={marketHint}
                  onChange={(event) => setMarketHint(event.target.value)}
                  placeholder="z. B. DACH, B2B, digitale Produkte"
                />
              </div>
              <div className="md:col-span-2">
                <Btn onClick={generateIdeas} disabled={generating}>
                  {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Ideen generieren
                </Btn>
              </div>
            </div>
          </Card>

          <section className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {(ideas || []).map((idea) => {
                const isSelected = selectedIdeaId && selectedIdeaId === idea.id;
                return (
                  <Card key={idea.id} className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <BMBadge tone={isSelected ? "success" : "info"}>
                        {isSelected ? "Ausgewählt" : "Vorschlag"}
                      </BMBadge>
                      <h3 className="text-base font-semibold text-zinc-100">{idea.title}</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-zinc-400">{idea.summary}</p>
                    <div className="grid gap-2 md:grid-cols-3">
                      <Score label="Demand" value={idea.scores?.demand ?? 0} />
                      <Score label="Competition" value={idea.scores?.competition ?? 0} />
                      <Score label="Founder Fit" value={idea.scores?.founder_fit ?? 0} />
                    </div>
                    <div className="text-xs text-zinc-500">
                      Zielgruppe: {idea.target_audience || "n/a"} · Erstes Angebot: {idea.first_offer || "n/a"}
                    </div>
                    <Btn variant={isSelected ? "secondary" : "primary"} onClick={() => selectIdea(idea)}>
                      <CheckCircle2 size={14} />
                      {isSelected ? "Erneut speichern" : "Als Richtung wählen"}
                    </Btn>
                  </Card>
                );
              })}
              {!ideas.length && (
                <Card>
                  <p className="text-sm text-zinc-400">Noch keine Ideen vorhanden. Starte oben die Generierung.</p>
                </Card>
              )}
            </div>

            <Card className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Decision Memory</h3>
              {(decisions || []).length ? (
                <div className="space-y-3">
                  {decisions.map((decision) => (
                    <div key={decision.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-zinc-100">{decision.selected_option || "Ohne Titel"}</span>
                        <BMBadge tone={decision.status === "locked" ? "success" : "neutral"}>{decision.status}</BMBadge>
                      </div>
                      <p className="text-xs leading-relaxed text-zinc-400">{decision.why_text || "Keine Begründung gespeichert."}</p>
                      {decision.status !== "locked" && (
                        <Btn size="sm" variant="ghost" className="mt-2" onClick={() => lockDecision(decision.id)}>
                          <Lock size={13} />
                          Lock
                        </Btn>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">Noch keine Decisions vorhanden.</p>
              )}
              <div>
                <FieldLabel>Kurznotiz</FieldLabel>
                <Textarea rows={3} disabled value={profile?.vision || ""} />
              </div>
            </Card>
          </section>
        </>
      )}
    </Page>
  );
}

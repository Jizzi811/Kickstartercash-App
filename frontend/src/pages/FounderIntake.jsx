import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Compass, Loader2, Save, ArrowRight } from "lucide-react";
import FounderProgress from "@/components/FounderProgress";
import { API } from "@/context/AppContext";
import { Page, Hero, Card, Btn, FieldLabel, Input, Textarea } from "@/components/bm";

const EMPTY_FORM = {
  vision: "",
  motivation: "",
  target_audience: "",
  budget_range: "",
  values: "",
  skills: "",
};

export default function FounderIntake() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accessAllowed, setAccessAllowed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [{ data }, { data: ideasData }] = await Promise.all([axios.get(`${API}/founder/intake`), axios.get(`${API}/founder/ideas`)]);
        if (!alive) return;
        const founderPath = data.founder_path || "";
        const selectedIdeaId = data.selected_idea_id || "";
        const selectedIdea = data.selected_idea || {};
        const hasConfirmedProfileIdea = Boolean(selectedIdeaId && selectedIdea?.id === selectedIdeaId && selectedIdea?.user_confirmed);
        const hasConfirmedStoredIdea = (ideasData.ideas || []).some((idea) => idea.user_confirmed && idea.favorite && (!selectedIdeaId || idea.id === selectedIdeaId));
        if (!founderPath) { navigate("/onboarding/founder/start", { replace: true }); return; }
        if (!hasConfirmedProfileIdea && !hasConfirmedStoredIdea) { navigate("/onboarding/founder/ideas", { replace: true }); return; }
        setAccessAllowed(true);
        setForm({
          vision: data.vision || "",
          motivation: data.motivation || "",
          target_audience: data.target_audience || "",
          budget_range: data.budget_range || "",
          values: (data.values || []).join(", "),
          skills: (data.skills || []).join(", "),
        });
      } catch (error) {
        toast.error("Founder-Profil konnte nicht geladen werden");
        console.warn(error);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [navigate]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (nextRoute = "") => {
    setSaving(true);
    try {
      await axios.put(`${API}/founder/intake`, {
        vision: form.vision,
        motivation: form.motivation,
        target_audience: form.target_audience,
        budget_range: form.budget_range,
        values: form.values.split(",").map((item) => item.trim()).filter(Boolean),
        skills: form.skills.split(",").map((item) => item.trim()).filter(Boolean),
      });
      toast.success("Founder-Profil gespeichert");
      if (nextRoute) navigate(nextRoute);
    } catch (error) {
      toast.error("Speichern fehlgeschlagen");
      console.warn(error);
    } finally {
      setSaving(false);
    }
  };

  if (!accessAllowed) {
    return (
      <Page>
        <Card>
          <div className="inline-flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 size={14} className="animate-spin" />
            Founder-Daten werden geprüft…
          </div>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <FounderProgress current="intake" />
      <Hero
        icon={Compass}
        badge="Founder Flow · Phase 1"
        title="Vision & Grundlagen"
        description="Brandmind speichert deine Gründungsentscheidung als Basis für spätere Inhalte, Designs und Strategien."
        actions={(
          <>
            <Btn variant="ghost" onClick={() => navigate("/onboarding/founder/start")}>Pfad wechseln</Btn>
            <Btn onClick={() => save("/onboarding/founder/ideas")} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
              Speichern & weiter
            </Btn>
          </>
        )}
      />

      <Card>
        {loading ? (
          <div className="inline-flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 size={14} className="animate-spin" />
            Founder-Daten werden geladen…
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <FieldLabel>Vision</FieldLabel>
              <Textarea
                rows={4}
                value={form.vision}
                onChange={(event) => setField("vision", event.target.value)}
                placeholder="Welche Veränderung möchtest du mit deinem Unternehmen erreichen?"
              />
            </div>
            <div className="md:col-span-2">
              <FieldLabel>Motivation</FieldLabel>
              <Textarea
                rows={3}
                value={form.motivation}
                onChange={(event) => setField("motivation", event.target.value)}
                placeholder="Warum gründest du?"
              />
            </div>
            <div>
              <FieldLabel>Zielgruppe</FieldLabel>
              <Input
                value={form.target_audience}
                onChange={(event) => setField("target_audience", event.target.value)}
                placeholder="z. B. Coaches, lokale Shops, B2B SaaS"
              />
            </div>
            <div>
              <FieldLabel>Budgetrahmen</FieldLabel>
              <Input
                value={form.budget_range}
                onChange={(event) => setField("budget_range", event.target.value)}
                placeholder="z. B. 1.000–3.000 €/Monat"
              />
            </div>
            <div>
              <FieldLabel>Werte (Komma-getrennt)</FieldLabel>
              <Input
                value={form.values}
                onChange={(event) => setField("values", event.target.value)}
                placeholder="z. B. transparent, mutig, zuverlässig"
              />
            </div>
            <div>
              <FieldLabel>Skills / Stärken (Komma-getrennt)</FieldLabel>
              <Input
                value={form.skills}
                onChange={(event) => setField("skills", event.target.value)}
                placeholder="z. B. Sales, Design, Coaching"
              />
            </div>
            <div className="md:col-span-2">
              <Btn onClick={() => save()} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Speichern
              </Btn>
            </div>
          </div>
        )}
      </Card>
    </Page>
  );
}

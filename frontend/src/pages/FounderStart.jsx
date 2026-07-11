import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Compass, ArrowRight, Loader2 } from "lucide-react";
import FounderProgress from "@/components/FounderProgress";
import { API, useApp } from "@/context/AppContext";
import { Page, Hero, Card, Btn, BMBadge } from "@/components/bm";

const COPY = {
  DE: { title: "Wo stehst du gerade?", sub: "Du musst noch keinen perfekten Plan haben. Sag uns einfach, wie weit du aktuell bist.", cta: "Weiter zum Gründerprofil", resume: "Speichern und später fortsetzen", options: [
    ["no_idea", "Ich habe noch keine Geschäftsidee", "Ich weiß nur, dass ich etwas Eigenes aufbauen möchte."],
    ["rough_direction", "Ich habe eine grobe Richtung", "Ich kenne ein Thema oder eine Branche, aber noch kein klares Geschäftsmodell."],
    ["concrete_idea", "Ich habe bereits eine konkrete Idee", "Ich weiß, was ich anbieten möchte, und will die Idee jetzt prüfen und umsetzen."],
  ]},
  EN: { title: "Where are you right now?", sub: "You do not need a perfect plan yet. Just tell us how far along you are.", cta: "Continue to founder profile", resume: "Save and continue later", options: [
    ["no_idea", "I do not have a business idea yet", "I only know that I want to build something of my own."],
    ["rough_direction", "I have a rough direction", "I know a topic or industry, but not a clear business model yet."],
    ["concrete_idea", "I already have a concrete idea", "I know what I want to offer and want to check and implement the idea now."],
  ]},
};

export default function FounderStart() {
  const navigate = useNavigate();
  const { language } = useApp();
  const copy = COPY[language === "EN" ? "EN" : "DE"];
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { let alive = true; (async () => { try { const { data } = await axios.get(`${API}/founder/profile`); if (alive) setSelected(data.founder_path || ""); } catch { toast.error("Founder-Start konnte nicht geladen werden"); } finally { if (alive) setLoading(false); } })(); return () => { alive = false; }; }, []);
  const save = async (next = true) => { if (!selected) return; setSaving(true); try { await axios.put(`${API}/founder/profile`, { founder_path: selected }); await axios.put(`${API}/onboarding/status`, { status: "in_progress", selected_path: "founder", current_step: "start" }); toast.success("Auswahl gespeichert"); if (next) navigate("/onboarding/founder/profile"); } catch { toast.error("Auswahl konnte nicht gespeichert werden"); } finally { setSaving(false); } };

  return <Page><FounderProgress current="start" /><Hero icon={Compass} badge="Founder Entry" title={copy.title} description={copy.sub} actions={<Btn onClick={() => save(true)} disabled={!selected || saving}>{saving ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}{copy.cta}</Btn>} />
    <div className="grid gap-4 md:grid-cols-3">{copy.options.map(([value, title, desc]) => <button key={value} type="button" onClick={() => setSelected(value)} className="text-left rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-400" aria-pressed={selected === value}><Card tinted={selected === value} className="h-full space-y-3"><BMBadge tone={selected === value ? "success" : "info"}>{value}</BMBadge><h2 className="text-lg font-semibold text-zinc-100">{title}</h2><p className="text-sm leading-relaxed text-zinc-400">{desc}</p></Card></button>)}</div>
    <Card><p className="text-sm text-zinc-400">Gründungs-KI-Experte: Die Vorschläge dienen der Orientierung und Planung. Markt, Nachfrage, rechtliche Anforderungen und Finanzierbarkeit werden in späteren Schritten gesondert geprüft.</p><Btn variant="ghost" className="mt-4" disabled={!selected || saving} onClick={() => save(false)}>{copy.resume}</Btn></Card>
  </Page>;
}

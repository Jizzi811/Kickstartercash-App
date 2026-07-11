import React from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Compass, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { Page, Hero, Card, Btn, GradientHeading, BMBadge } from "@/components/bm";

function PathCard({ icon: Icon, title, description, outcome, steps, cta, onClick }) {
  return (
    <Card className="flex h-full flex-col justify-between gap-5">
      <div>
        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-400/20">
          <Icon size={18} className="text-violet-300" />
        </div>
        <GradientHeading as="h3" className="mb-2 text-xl">{title}</GradientHeading>
        <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
        <div className="mt-4 space-y-2 text-xs text-zinc-500">
          <p><span className="text-zinc-300">{outcome.label}:</span> {outcome.text}</p>
          <p><span className="text-zinc-300">{steps.label}:</span> {steps.text}</p>
        </div>
      </div>
      <Btn className="w-fit" onClick={onClick}>{cta}<ArrowRight size={14} /></Btn>
    </Card>
  );
}

export default function FounderPathSelect() {
  const navigate = useNavigate();
  const { lang, updateOnboardingStatus } = useApp();
  const de = lang === "DE";
  const choose = async (selected_path, current_step, route) => {
    try {
      await updateOnboardingStatus({ status: "path_selected", selected_path, current_step, completed_steps: [] });
      navigate(route);
    } catch (e) { toast.error(de ? "Auswahl konnte nicht gespeichert werden" : "Could not save selection"); }
  };
  const skip = async () => {
    await updateOnboardingStatus({ status: "skipped", selected_path: "explore", current_step: "home" }).catch(() => null);
    navigate("/app");
  };
  const copy = de ? {
    title: "Wähle deinen Einstieg in Brandmind",
    desc: "Drei klare Wege, ohne Demo-Daten als echten Fortschritt zu speichern.",
    outcome: "Ergebnis", steps: "Schritte",
    existing: ["Ich habe bereits eine Marke", "Hinterlege Positionierung, Zielgruppe, Angebote und Markenidentität. Brandmind verwendet diese Informationen anschließend als Grundlage für Quantum und deine KI-Agenten.", "Eine gespeicherte Markenbasis für Quantum und die Agenten.", "Brand Brain, Brand Identity und optional Knowledge Base.", "Marke einrichten"],
    founder: ["Ich möchte eine neue Marke aufbauen", "Entwickle aus deiner Idee Schritt für Schritt Positionierung, Angebot, Markenidentität, Geschäftsmodell und erste Maßnahmen.", "Ein Gründerpfad mit bestätigten Entscheidungen und Entwürfen.", "Intake, Ideen, Marke, Angebote, Businessplan, Finanzplan und Operations.", "Gründerpfad starten"],
    explore: ["Ich möchte Brandmind zunächst erkunden", "Sieh dir die wichtigsten Bereiche an und starte eine erste Aufgabe, ohne bereits alle Markeninformationen zu hinterlegen.", "Eine kompakte Produktübersicht ohne Änderung echter Markendaten.", "Home, Quantum, Meine Marke, Erstellen und Projekte.", "Brandmind erkunden"],
    skip: "Überspringen und zur Home"
  } : {
    title: "Choose your Brandmind starting point", desc: "Three clear paths without storing demo data as real progress.", outcome: "Outcome", steps: "Steps",
    existing: ["I already have a brand", "Add positioning, audience, offers and brand identity. Brandmind uses this foundation for Quantum and your AI agents.", "A saved brand foundation for Quantum and agents.", "Brand Brain, Brand Identity and optional Knowledge Base.", "Set up brand"],
    founder: ["I want to build a new brand", "Develop positioning, offer, brand identity, business model and first actions from your idea step by step.", "A founder journey with confirmed decisions and drafts.", "Intake, ideas, brand, offers, business plan, finance plan and operations.", "Start founder journey"],
    explore: ["I want to explore Brandmind first", "Explore key areas and start a first task without entering all brand details yet.", "A compact product overview without changing real brand data.", "Home, Quantum, My Brand, Create and Projects.", "Explore Brandmind"],
    skip: "Skip and go Home"
  };
  return <Page><Hero icon={Sparkles} badge="Brandmind Onboarding" title={copy.title} description={copy.desc} actions={<Btn variant="ghost" onClick={skip}>{copy.skip}</Btn>} />
    <section className="grid gap-4 lg:grid-cols-3">
      <PathCard icon={Building2} title={copy.existing[0]} description={copy.existing[1]} outcome={{ label: copy.outcome, text: copy.existing[2] }} steps={{ label: copy.steps, text: copy.existing[3] }} cta={copy.existing[4]} onClick={() => choose("existing_brand", "brand_brain", "/brand-brain")} />
      <PathCard icon={Sparkles} title={copy.founder[0]} description={copy.founder[1]} outcome={{ label: copy.outcome, text: copy.founder[2] }} steps={{ label: copy.steps, text: copy.founder[3] }} cta={copy.founder[4]} onClick={() => choose("founder", "intake", "/onboarding/founder/intake")} />
      <PathCard icon={Compass} title={copy.explore[0]} description={copy.explore[1]} outcome={{ label: copy.outcome, text: copy.explore[2] }} steps={{ label: copy.steps, text: copy.explore[3] }} cta={copy.explore[4]} onClick={() => choose("explore", "home", "/app")} />
    </section>
    <div className="mt-4"><BMBadge tone="neutral">{de ? "Du kannst später neu starten oder fortsetzen." : "You can restart or resume later."}</BMBadge></div>
  </Page>;
}

import React from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Sparkles, ArrowRight } from "lucide-react";
import { Page, Hero, Card, Btn, GradientHeading } from "@/components/bm";

function PathCard({ icon: Icon, title, description, cta, onClick }) {
  return (
    <Card className="flex h-full flex-col justify-between gap-5">
      <div>
        <div
          className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}
        >
          <Icon size={18} style={{ color: "#a78bfa" }} />
        </div>
        <GradientHeading as="h3" className="mb-2 text-xl">{title}</GradientHeading>
        <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
      </div>
      <Btn className="w-fit" onClick={onClick}>
        {cta}
        <ArrowRight size={14} />
      </Btn>
    </Card>
  );
}

export default function FounderPathSelect() {
  const navigate = useNavigate();

  return (
    <Page>
      <Hero
        icon={Sparkles}
        badge="Brandmind Co-Founder"
        title="Was möchtest du heute erschaffen?"
        description="Wähle den passenden Einstieg. Brandmind unterstützt bestehende Unternehmen und begleitet Neugründer von der Vision bis zum Launch."
      />

      <section className="grid gap-4 md:grid-cols-2">
        <PathCard
          icon={Building2}
          title="Ich habe bereits ein Unternehmen"
          description="Analysiere Website, Marken-DNA und bestehende Assets. Nutze die bekannten Brandmind-Module für Content, Design und Wachstum."
          cta="Zur Unternehmens-Zentrale"
          onClick={() => navigate("/")}
        />
        <PathCard
          icon={Sparkles}
          title="Ich möchte ein Unternehmen gründen"
          description="Starte den Founder-Flow: Vision, Ideen, Positionierung und erste Markenentscheidungen mit Decision Memory."
          cta="Founder-Flow starten"
          onClick={() => navigate("/onboarding/founder/intake")}
        />
      </section>
    </Page>
  );
}

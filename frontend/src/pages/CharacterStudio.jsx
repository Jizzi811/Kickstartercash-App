import React, { useMemo, useState } from "react";
import { Bot, Dna, Image, Sparkles, Wand2, Download, Copy, Check, Palette } from "lucide-react";
import { Page, Hero, Section, Card, Btn, BMBadge, Metric, StatGrid, V } from "@/components/bm";

const ROLES = ["Creative Director", "TikTok Expert", "SEO Strategist", "Video Producer", "Sales Coach", "Automation Architect"];
const STYLES = ["Premium 3D", "Premium Pixar", "Dark Glass", "Cinematic Realism", "Neon Mascot"];
const ACCENTS = ["Purple", "Violet", "Emerald", "Sky", "Rose"];
const PERSONALITIES = ["Creative", "Friendly", "Confident", "Strategic", "Analytical", "Bold"];

const presets = {
  "Creative Director": { name: "Dina", gender: "Female", age: 29, hair: "Purple", accent: "Purple", expression: "Smiling" },
  "TikTok Expert": { name: "Tia", gender: "Female", age: 24, hair: "Black", accent: "Rose", expression: "Energetic" },
  "SEO Strategist": { name: "Soren", gender: "Male", age: 34, hair: "Dark brown", accent: "Emerald", expression: "Focused" },
  "Video Producer": { name: "Vera", gender: "Female", age: 31, hair: "Silver", accent: "Sky", expression: "Cinematic" },
  "Sales Coach": { name: "Leo", gender: "Male", age: 38, hair: "Brown", accent: "Violet", expression: "Confident" },
  "Automation Architect": { name: "Nia", gender: "Non-binary", age: 32, hair: "Blue", accent: "Purple", expression: "Calm" },
};

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

function inputClass() {
  return "w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-[#7C3AED]/60";
}

export default function CharacterStudio() {
  const [copied, setCopied] = useState(false);
  const [dna, setDna] = useState({
    name: "Dina",
    role: "Creative Director",
    gender: "Female",
    age: 29,
    hair: "Purple",
    personality: ["Creative", "Friendly", "Confident"],
    style: "Premium Pixar",
    accent: "Purple",
    background: "Dark Glass",
    expression: "Smiling",
    glow: "Purple",
  });

  const prompt = useMemo(() => (
    `BrandMind agent avatar, ${dna.name}, ${dna.gender}, age ${dna.age}, role ${dna.role}, ${dna.style} style, ${dna.hair} hair, ${dna.expression} expression, ${dna.personality.join(", ").toLowerCase()} personality, ${dna.accent} accent color, ${dna.background} background, ${dna.glow} glow ring, premium SaaS character, centered bust portrait, 1024x1024, clean icon-safe silhouette`
  ), [dna]);

  const assetPaths = [
    `/agents/avatars/${dna.name.toLowerCase()}-avatar-1024.png`,
    `/agents/avatars/${dna.name.toLowerCase()}-avatar-512.png`,
    `/agents/avatars/${dna.name.toLowerCase()}-thumbnail.png`,
    `/agents/avatars/${dna.name.toLowerCase()}-icon.png`,
  ];

  const applyRole = (role) => setDna((current) => ({ ...current, role, ...(presets[role] || {}) }));
  const togglePersonality = (trait) => setDna((current) => ({
    ...current,
    personality: current.personality.includes(trait)
      ? current.personality.filter((item) => item !== trait)
      : [...current.personality, trait].slice(-4),
  }));

  const copyPrompt = async () => {
    await navigator.clipboard?.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Page>
      <Hero
        icon={Dna}
        badge="Character Studio"
        title="Agenten mit eigener Character DNA erzeugen"
        description="Entwirf Namen, Persönlichkeit, Avatar-Briefing, Glow-Ring, Icons und Exportpfade für neue BrandMind Agenten – bereit für OpenAI Images, FLUX, Stable Diffusion oder ComfyUI."
        actions={<Btn onClick={copyPrompt}><Wand2 size={16} /> Generate Avatar Prompt</Btn>}
        chips={<><BMBadge icon={Bot}>Create Agent</BMBadge><BMBadge tone="info" icon={Image}>Avatar Pipeline</BMBadge><BMBadge tone="success" icon={Sparkles}>Premium Feature</BMBadge></>}
      />

      <StatGrid>
        <Metric icon={Dna} label="DNA Felder" value="11" hint="Rolle, Look, Stimme, Stil" />
        <Metric icon={Image} label="Exports" value="4" hint="1024, 512, Thumbnail, Icon" />
        <Metric icon={Palette} label="Brand Accent" value={dna.accent} hint="Glow & Hintergrund" />
        <Metric icon={Bot} label="Agent Preview" value={dna.name} hint={dna.role} />
      </StatGrid>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Section icon={Dna} title="Character DNA Generator">
          <Card tinted className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name"><input className={inputClass()} value={dna.name} onChange={(e) => setDna({ ...dna, name: e.target.value })} /></Field>
              <Field label="Role"><select className={inputClass()} value={dna.role} onChange={(e) => applyRole(e.target.value)}>{ROLES.map((role) => <option key={role}>{role}</option>)}</select></Field>
              <Field label="Gender"><input className={inputClass()} value={dna.gender} onChange={(e) => setDna({ ...dna, gender: e.target.value })} /></Field>
              <Field label="Age"><input className={inputClass()} type="number" value={dna.age} onChange={(e) => setDna({ ...dna, age: e.target.value })} /></Field>
              <Field label="Hair"><input className={inputClass()} value={dna.hair} onChange={(e) => setDna({ ...dna, hair: e.target.value })} /></Field>
              <Field label="Style"><select className={inputClass()} value={dna.style} onChange={(e) => setDna({ ...dna, style: e.target.value })}>{STYLES.map((style) => <option key={style}>{style}</option>)}</select></Field>
              <Field label="Accent"><select className={inputClass()} value={dna.accent} onChange={(e) => setDna({ ...dna, accent: e.target.value, glow: e.target.value })}>{ACCENTS.map((accent) => <option key={accent}>{accent}</option>)}</select></Field>
              <Field label="Background"><input className={inputClass()} value={dna.background} onChange={(e) => setDna({ ...dna, background: e.target.value })} /></Field>
            </div>
            <div>
              <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Personality</span>
              <div className="flex flex-wrap gap-2">{PERSONALITIES.map((trait) => <button key={trait} onClick={() => togglePersonality(trait)} className={`rounded-full border px-3 py-1.5 text-xs transition ${dna.personality.includes(trait) ? "border-[#7C3AED] bg-[#7C3AED]/20 text-white" : "border-white/10 text-zinc-500 hover:text-white"}`}>{trait}</button>)}</div>
            </div>
          </Card>
        </Section>

        <Section icon={Image} title="Avatar Preview & Export">
          <Card className="space-y-6">
            <div className="relative mx-auto flex aspect-square max-w-[320px] items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_50%_25%,rgba(124,58,237,0.35),rgba(10,10,10,0.95)_58%)]">
              <div className="absolute h-52 w-52 rounded-full blur-3xl" style={{ background: V, opacity: 0.24 }} />
              <div className="relative flex h-44 w-44 items-center justify-center rounded-full border border-white/15 bg-black/50 shadow-[0_0_80px_rgba(124,58,237,0.45)]">
                <div className="text-center"><div className="text-6xl">🤖</div><div className="mt-3 text-xl font-bold text-white">{dna.name}</div><div className="text-xs text-zinc-500">{dna.role}</div></div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/30 p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Generation Prompt</div>
              <p className="text-sm leading-6 text-zinc-300">{prompt}</p>
              <Btn variant="secondary" className="mt-4" onClick={copyPrompt}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy prompt"}</Btn>
            </div>
            <div className="grid gap-2">{assetPaths.map((path) => <div key={path} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-zinc-400"><span>{path}</span><Download size={13} /></div>)}</div>
          </Card>
        </Section>
      </div>
    </Page>
  );
}

import React, { useState, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, Bot, FileText, ImageIcon, CalendarDays, Download,
  ChevronRight, ChevronLeft, Check, Loader2, Copy, Sparkles,
  Upload, X, Globe, Instagram, Linkedin, Mail, Video,
} from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { PageHeader } from "@/components/PageHeader";
import jsPDF from "jspdf";

const COLOR = "#7C3AED";

/* ── Step definitions ─────────────────────────────────────────────── */
const STEPS = [
  { id: "briefing",  icon: Megaphone,    labelDE: "Briefing",         labelEN: "Briefing" },
  { id: "agent",     icon: Bot,          labelDE: "Agent wählen",     labelEN: "Choose Agent" },
  { id: "content",   icon: FileText,     labelDE: "Content",          labelEN: "Content" },
  { id: "media",     icon: ImageIcon,    labelDE: "Bild / Video",     labelEN: "Image / Video" },
  { id: "calendar",  icon: CalendarDays, labelDE: "Kalender",         labelEN: "Calendar" },
  { id: "export",    icon: Download,     labelDE: "Export",           labelEN: "Export" },
];

const AGENTS = [
  { id: "copywriter",  emoji: "✍️", labelDE: "Copywriter",           labelEN: "Copywriter",           color: "#7C3AED" },
  { id: "social",      emoji: "📱", labelDE: "Social Media Agent",   labelEN: "Social Media Agent",   color: "#C084FC" },
  { id: "seo",         emoji: "🌍", labelDE: "SEO Agent",            labelEN: "SEO Agent",            color: "#34D399" },
  { id: "email",       emoji: "📧", labelDE: "E-Mail Agent",         labelEN: "Email Agent",          color: "#F472B6" },
  { id: "linkedin",    emoji: "💼", labelDE: "LinkedIn Agent",       labelEN: "LinkedIn Agent",       color: "#60A5FA" },
  { id: "tiktok",      emoji: "🎵", labelDE: "TikTok Agent",         labelEN: "TikTok Agent",         color: "#FB7185" },
];

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram, color: "#E1306C" },
  { id: "linkedin",  label: "LinkedIn",  icon: Linkedin,  color: "#0A66C2" },
  { id: "web",       label: "Website",   icon: Globe,     color: "#34D399" },
  { id: "email",     label: "E-Mail",    icon: Mail,      color: "#F472B6" },
  { id: "tiktok",    label: "TikTok",    icon: Video,     color: "#FB7185" },
];

const IMAGE_STYLES = ["Professionell", "Minimalistisch", "Luxuriös", "Verspielt", "Vintage", "Modern"];

function StepDot({ step, idx, current }) {
  const done = idx < current;
  const active = idx === current;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all"
        style={{
          borderColor: active || done ? COLOR : "#333",
          background: done ? COLOR : active ? "#111" : "#0A0A0A",
        }}
      >
        {done ? (
          <Check size={14} className="text-black" />
        ) : (
          <step.icon size={14} style={{ color: active ? COLOR : "#555" }} />
        )}
      </div>
      <span className="text-[9px] uppercase tracking-widest hidden sm:block"
        style={{ color: active ? COLOR : done ? "#888" : "#444" }}>
        {step.labelDE}
      </span>
    </div>
  );
}

function CopyBtn({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }}
      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors">
      {done ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      {done ? "Kopiert" : "Kopieren"}
    </button>
  );
}

export default function CampaignWorkflow() {
  const { lang, model, activeBrandId } = useApp();
  const [step, setStep] = useState(0);
  const fileRef = useRef(null);

  /* Briefing */
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("");
  const [audience, setAudience] = useState("");
  const [platforms, setPlatforms] = useState(["instagram"]);
  const [uploadedFile, setUploadedFile] = useState(null);

  /* Agent */
  const [selectedAgent, setSelectedAgent] = useState("copywriter");

  /* Content */
  const [contentLoading, setContentLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");

  /* Media */
  const [imageStyle, setImageStyle] = useState("Professionell");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);

  /* Calendar */
  const [calendarDays, setCalendarDays] = useState([
    { day: "Mo", active: true }, { day: "Mi", active: true },
    { day: "Fr", active: true }, { day: "So", active: false },
  ]);
  const [postTime, setPostTime] = useState("09:00");

  const t = (de, en) => lang === "DE" ? de : en;

  /* ── Handlers ──────────────────────────────────────────────────── */
  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f) setUploadedFile(f);
  };

  const generateContent = async () => {
    if (!topic.trim()) { toast.error(t("Bitte Thema eingeben", "Please enter a topic")); return; }
    setContentLoading(true);
    setGeneratedContent("");
    try {
      const context = [
        `Thema: ${topic}`,
        goal ? `Ziel: ${goal}` : "",
        audience ? `Zielgruppe: ${audience}` : "",
        `Plattformen: ${platforms.join(", ")}`,
      ].filter(Boolean).join("\n");

      const res = await axios.post(`${API}/agents/tools/run`, {
        agent_id: selectedAgent,
        tool_id: "post",
        context,
        model,
        language: lang,
        brand_id: activeBrandId,
      });
      setGeneratedContent(res.data.reply || "");
    } catch {
      toast.error(t("Fehler beim Generieren", "Generation failed"));
    } finally {
      setContentLoading(false);
    }
  };

  const generateImage = async () => {
    if (!topic.trim()) { toast.error(t("Kein Thema", "No topic")); return; }
    setImageLoading(true);
    setImageUrl(null);
    try {
      const res = await axios.post(`${API}/image/generate`, {
        prompt: `${topic}. Stil: ${imageStyle}. Professionell, hochwertig.`,
        style: imageStyle,
      });
      setImageUrl(res.data.url || res.data.image_url);
    } catch {
      toast.error(t("Bildgenerierung fehlgeschlagen", "Image generation failed"));
    } finally {
      setImageLoading(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, 210, 297, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(212, 175, 55);
    doc.setFontSize(20);
    doc.text("Brandmind – Kampagnen-Report", 20, 25);
    doc.setTextColor(180, 180, 180);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const lines = [
      `Datum: ${new Date().toLocaleDateString("de-DE")}`,
      "",
      `Thema: ${topic}`,
      goal ? `Ziel: ${goal}` : "",
      audience ? `Zielgruppe: ${audience}` : "",
      `Plattformen: ${platforms.join(", ")}`,
      `Agent: ${AGENTS.find(a => a.id === selectedAgent)?.labelDE}`,
      "",
      "─── Generierter Content ───",
      "",
      ...doc.splitTextToSize(generatedContent, 170),
    ].filter(l => l !== undefined);
    doc.text(lines, 20, 40);
    doc.save(`kampagne-${Date.now()}.pdf`);
  };

  const next = () => { if (step < STEPS.length - 1) setStep(s => s + 1); };
  const prev = () => { if (step > 0) setStep(s => s - 1); };

  const canNext = () => {
    if (step === 0) return topic.trim().length > 0;
    if (step === 2) return !contentLoading;
    return true;
  };

  /* ── Step panels ───────────────────────────────────────────────── */
  const renderStep = () => {
    switch (step) {
      case 0: return (
        <div className="space-y-5">
          <p className="text-[10px] text-zinc-700 uppercase tracking-widest">
            {t("Schritt 1 – Kampagnen-Briefing", "Step 1 – Campaign Briefing")}
          </p>
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-zinc-400 mb-1.5 block">{t("Thema / Produkt *", "Topic / Product *")}</span>
              <input value={topic} onChange={e => setTopic(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-sm px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#7C3AED]/60"
                placeholder={t("z.B. Brandmind Black Card Launch…", "e.g. Brandmind Black Card Launch…")} />
            </label>
            <label className="block">
              <span className="text-xs text-zinc-400 mb-1.5 block">{t("Kampagnenziel", "Campaign Goal")}</span>
              <input value={goal} onChange={e => setGoal(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-sm px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#7C3AED]/60"
                placeholder={t("z.B. Leads generieren, Produkt vorstellen…", "e.g. generate leads, product launch…")} />
            </label>
            <label className="block">
              <span className="text-xs text-zinc-400 mb-1.5 block">{t("Zielgruppe", "Target Audience")}</span>
              <input value={audience} onChange={e => setAudience(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-sm px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#7C3AED]/60"
                placeholder={t("z.B. Unternehmer 25–45, Deutschland…", "e.g. entrepreneurs 25–45, Germany…")} />
            </label>
          </div>

          <div>
            <span className="text-xs text-zinc-400 mb-2 block">{t("Plattformen", "Platforms")}</span>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => {
                const active = platforms.includes(p.id);
                return (
                  <button key={p.id}
                    onClick={() => setPlatforms(prev => active ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs border transition-all"
                    style={{ borderColor: active ? p.color : "#333", background: active ? `${p.color}18` : "#111", color: active ? p.color : "#666" }}>
                    <p.icon size={11} /> {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="text-xs text-zinc-400 mb-2 block">{t("Referenz-Datei (optional)", "Reference file (optional)")}</span>
            <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt" className="hidden" onChange={handleFile} />
            {uploadedFile ? (
              <div className="flex items-center gap-2 p-2.5 bg-[#111] border border-white/10 rounded-sm">
                <Upload size={13} className="text-[#7C3AED]" />
                <span className="text-xs text-zinc-300 flex-1 truncate">{uploadedFile.name}</span>
                <button onClick={() => setUploadedFile(null)}><X size={13} className="text-zinc-500 hover:text-white" /></button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#111] border border-dashed border-white/15 rounded-sm text-xs text-zinc-500 hover:text-white hover:border-white/30 transition-all w-full">
                <Upload size={13} /> {t("Datei / Bild hochladen", "Upload file / image")}
              </button>
            )}
          </div>
        </div>
      );

      case 1: return (
        <div className="space-y-5">
          <p className="text-[10px] text-zinc-700 uppercase tracking-widest">
            {t("Schritt 2 – KI-Agent auswählen", "Step 2 – Select AI Agent")}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {AGENTS.map(a => (
              <button key={a.id} onClick={() => setSelectedAgent(a.id)}
                className="p-4 rounded-sm border text-left transition-all"
                style={{
                  borderColor: selectedAgent === a.id ? a.color : "#222",
                  background: selectedAgent === a.id ? `${a.color}12` : "#0A0A0A",
                }}>
                <div className="text-2xl mb-2">{a.emoji}</div>
                <div className="text-xs font-medium" style={{ color: selectedAgent === a.id ? a.color : "#aaa" }}>
                  {lang === "DE" ? a.labelDE : a.labelEN}
                </div>
                {selectedAgent === a.id && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px]" style={{ color: a.color }}>
                    <Check size={10} /> {t("Ausgewählt", "Selected")}
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="p-3 bg-[#0A0A0A] border border-white/8 rounded-sm text-xs text-zinc-500">
            {t("Der Agent verarbeitet dein Briefing und generiert optimierten Content für die gewählten Plattformen.", "The agent processes your briefing and generates optimized content for the selected platforms.")}
          </div>
        </div>
      );

      case 2: return (
        <div className="space-y-5">
          <p className="text-[10px] text-zinc-700 uppercase tracking-widest">
            {t("Schritt 3 – Content generieren", "Step 3 – Generate Content")}
          </p>
          <div className="p-3 bg-[#0A0A0A] border border-white/8 rounded-sm space-y-1">
            <div className="text-xs text-zinc-500">{t("Thema:", "Topic:")} <span className="text-zinc-300">{topic}</span></div>
            {goal && <div className="text-xs text-zinc-500">{t("Ziel:", "Goal:")} <span className="text-zinc-300">{goal}</span></div>}
            <div className="text-xs text-zinc-500">{t("Agent:", "Agent:")} <span className="text-zinc-300">{AGENTS.find(a => a.id === selectedAgent)?.labelDE}</span></div>
          </div>

          {!generatedContent && !contentLoading && (
            <button onClick={generateContent}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-sm text-sm font-medium transition-all"
              style={{ background: COLOR, color: "#000" }}>
              <Sparkles size={15} />
              {t("Content jetzt generieren", "Generate Content Now")}
            </button>
          )}

          {contentLoading && (
            <div className="flex items-center gap-3 p-4 bg-[#0A0A0A] border border-white/8 rounded-sm text-zinc-500 text-sm">
              <Loader2 size={16} className="animate-spin" style={{ color: COLOR }} />
              {t("Wird generiert…", "Generating…")}
            </div>
          )}

          {generatedContent && (
            <div className="bg-[#0A0A0A] border border-white/8 rounded-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8">
                <span className="text-xs font-medium" style={{ color: COLOR }}>{t("Generierter Content", "Generated Content")}</span>
                <div className="flex items-center gap-3">
                  <CopyBtn text={generatedContent} />
                  <button onClick={generateContent} className="text-xs text-zinc-500 hover:text-white">
                    {t("Neu generieren", "Regenerate")}
                  </button>
                </div>
              </div>
              <pre className="px-4 py-4 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed overflow-auto max-h-80">
                {generatedContent}
              </pre>
            </div>
          )}
        </div>
      );

      case 3: return (
        <div className="space-y-5">
          <p className="text-[10px] text-zinc-700 uppercase tracking-widest">
            {t("Schritt 4 – Bild / Video", "Step 4 – Image / Video")}
          </p>

          <div>
            <span className="text-xs text-zinc-400 mb-2 block">{t("Bildstil", "Image Style")}</span>
            <div className="flex flex-wrap gap-2">
              {IMAGE_STYLES.map(s => (
                <button key={s} onClick={() => setImageStyle(s)}
                  className="px-3 py-1.5 rounded-sm text-xs border transition-all"
                  style={{ borderColor: imageStyle === s ? COLOR : "#333", background: imageStyle === s ? `${COLOR}15` : "#111", color: imageStyle === s ? COLOR : "#666" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button onClick={generateImage} disabled={imageLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-sm text-sm font-medium transition-all disabled:opacity-50"
            style={{ background: imageLoading ? "#222" : COLOR, color: imageLoading ? "#666" : "#000" }}>
            {imageLoading ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
            {imageLoading ? t("Wird generiert…", "Generating…") : t("Bild generieren", "Generate Image")}
          </button>

          {imageUrl && (
            <div className="rounded-sm overflow-hidden border border-white/10">
              <img src={imageUrl} alt="generated" className="w-full object-cover" />
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#0A0A0A] border-t border-white/8">
                <span className="text-xs text-zinc-500">{t("Generiertes Bild", "Generated Image")}</span>
                <a href={imageUrl} download className="text-xs text-[#7C3AED] hover:text-white flex items-center gap-1.5">
                  <Download size={12} /> {t("Download", "Download")}
                </a>
              </div>
            </div>
          )}

          {!imageUrl && !imageLoading && (
            <div className="p-6 border border-dashed border-white/10 rounded-sm text-center text-xs text-zinc-600">
              {t("Kein Bild generiert – optional überspringen", "No image generated — skip if not needed")}
            </div>
          )}
        </div>
      );

      case 4: return (
        <div className="space-y-5">
          <p className="text-[10px] text-zinc-700 uppercase tracking-widest">
            {t("Schritt 5 – Posting-Kalender", "Step 5 – Posting Calendar")}
          </p>

          <div>
            <span className="text-xs text-zinc-400 mb-2 block">{t("Wochentage", "Days of the Week")}</span>
            <div className="flex gap-2 flex-wrap">
              {calendarDays.map((d, i) => (
                <button key={d.day}
                  onClick={() => setCalendarDays(prev => prev.map((x, j) => j === i ? { ...x, active: !x.active } : x))}
                  className="w-10 h-10 rounded-sm text-sm border font-medium transition-all"
                  style={{ borderColor: d.active ? COLOR : "#333", background: d.active ? `${COLOR}15` : "#111", color: d.active ? COLOR : "#555" }}>
                  {d.day}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs text-zinc-400 mb-2 block">{t("Uhrzeit", "Posting Time")}</span>
            <input type="time" value={postTime} onChange={e => setPostTime(e.target.value)}
              className="bg-[#111] border border-white/10 rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7C3AED]/60" />
          </div>

          <div className="p-4 bg-[#0A0A0A] border border-white/8 rounded-sm space-y-2">
            <div className="text-xs font-medium" style={{ color: COLOR }}>{t("Kampagnen-Zeitplan", "Campaign Schedule")}</div>
            {calendarDays.filter(d => d.active).map(d => (
              <div key={d.day} className="flex items-center justify-between text-xs text-zinc-400">
                <span>{d.day}</span>
                <span>{postTime} Uhr</span>
                <span className="text-[#34D399]">{platforms.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>
      );

      case 5: return (
        <div className="space-y-5">
          <p className="text-[10px] text-zinc-700 uppercase tracking-widest">
            {t("Schritt 6 – Export & Veröffentlichen", "Step 6 – Export & Publish")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-[#0A0A0A] border border-white/8 rounded-sm space-y-2">
              <div className="text-xs font-medium text-zinc-300">{t("Kampagnen-Zusammenfassung", "Campaign Summary")}</div>
              <div className="text-xs text-zinc-500 space-y-1">
                <div>{t("Thema:", "Topic:")} <span className="text-zinc-300">{topic || "–"}</span></div>
                {goal && <div>{t("Ziel:", "Goal:")} <span className="text-zinc-300">{goal}</span></div>}
                {audience && <div>{t("Zielgruppe:", "Audience:")} <span className="text-zinc-300">{audience}</span></div>}
                <div>{t("Plattformen:", "Platforms:")} <span className="text-zinc-300">{platforms.join(", ")}</span></div>
                <div>{t("Agent:", "Agent:")} <span className="text-zinc-300">{AGENTS.find(a => a.id === selectedAgent)?.labelDE}</span></div>
                <div>{t("Posting-Tage:", "Post Days:")} <span className="text-zinc-300">{calendarDays.filter(d => d.active).map(d => d.day).join(", ")}</span></div>
                <div>{t("Uhrzeit:", "Time:")} <span className="text-zinc-300">{postTime}</span></div>
              </div>
            </div>

            {generatedContent && (
              <div className="p-4 bg-[#0A0A0A] border border-white/8 rounded-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-zinc-300">{t("Content", "Content")}</div>
                  <CopyBtn text={generatedContent} />
                </div>
                <pre className="text-xs text-zinc-500 whitespace-pre-wrap line-clamp-6">{generatedContent}</pre>
              </div>
            )}
          </div>

          {imageUrl && (
            <img src={imageUrl} alt="" className="w-full max-h-48 object-cover rounded-sm border border-white/8" />
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={exportPDF}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-sm text-sm font-medium border border-[#7C3AED]/40 text-[#7C3AED] hover:bg-[#7C3AED]/10 transition-all">
              <Download size={15} /> {t("Als PDF exportieren", "Export as PDF")}
            </button>
            {generatedContent && (
              <button onClick={() => navigator.clipboard.writeText(generatedContent).then(() => toast.success(t("Content kopiert!", "Content copied!")))}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-sm text-sm font-medium border border-white/15 text-zinc-400 hover:text-white hover:border-white/30 transition-all">
                <Copy size={15} /> {t("Content kopieren", "Copy Content")}
              </button>
            )}
          </div>

          <button onClick={() => { setStep(0); setTopic(""); setGoal(""); setAudience(""); setPlatforms(["instagram"]); setGeneratedContent(""); setImageUrl(null); }}
            className="w-full py-2.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            {t("Neue Kampagne starten", "Start New Campaign")}
          </button>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Megaphone}
        color={COLOR}
        title={t("Kampagnen-Workflow", "Campaign Workflow")}
        subtitle={t("Briefing → Agent → Content → Bild → Kalender → Export", "Briefing → Agent → Content → Image → Calendar → Export")}
        badge="Workflow"
      />

      {/* Step progress */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <StepDot step={s} idx={i} current={step} />
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px mx-1 transition-all"
                style={{ background: i < step ? COLOR : "#222" }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Panel */}
      <div className="bg-[#0A0A0A] border border-white/8 rounded-sm p-6 min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}>
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prev} disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-sm text-sm border border-white/15 text-zinc-400 hover:text-white hover:border-white/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft size={15} /> {t("Zurück", "Back")}
        </button>

        <span className="text-xs text-zinc-600">{step + 1} / {STEPS.length}</span>

        {step < STEPS.length - 1 ? (
          <button onClick={next} disabled={!canNext()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-sm text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: canNext() ? COLOR : "#333", color: canNext() ? "#000" : "#666" }}>
            {t("Weiter", "Next")} <ChevronRight size={15} />
          </button>
        ) : (
          <div className="w-24" />
        )}
      </div>
    </div>
  );
}

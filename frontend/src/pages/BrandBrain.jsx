import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  BrainCircuit, ChevronRight, ChevronLeft, Loader2, Check, Sparkles,
  Building2, Palette, Users, Package, Database, ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useApp } from "@/context/AppContext";
import { API } from "@/context/AppContext";

const ACCENT = "#D4AF37";

const STEPS = [
  { icon: Building2, de: "Unternehmen", en: "Company" },
  { icon: Palette, de: "Design", en: "Design" },
  { icon: Users, de: "Zielgruppe", en: "Audience" },
  { icon: Package, de: "Angebot", en: "Offering" },
];

const EMPTY = {
  name: "",
  industry: "",
  website: "",
  primary_color: "#D4AF37",
  secondary_color: "#050505",
  logo_url: "",
  target_audience: "",
  tone: "",
  products: "",
  social_accounts: "",
};

function Field({ label, children }) {
  return (
    <label className="block mb-4">
      <span className="block text-[11px] uppercase tracking-[0.15em] text-zinc-500 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full bg-black/40 border border-white/10 rounded-sm px-3 py-2.5 text-sm text-white " +
  "placeholder:text-zinc-600 focus:outline-none focus:border-[#D4AF37]/50 transition-colors";

export default function BrandBrain() {
  const { lang, model, loadBrands, setActiveBrandId } = useApp();
  const isDE = lang === "DE";
  const T = (de, en) => (isDE ? de : en);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const canNext = step > 0 || form.name.trim().length > 0;

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API}/brand-brain/onboard`, {
        ...form,
        model,
        language: lang,
      });
      setResult(res.data);
      await loadBrands();
      if (res.data?.brand?.id) setActiveBrandId(res.data.brand.id);
    } catch (e) {
      setError(
        e?.response?.data?.detail ||
          T("Erstellung fehlgeschlagen. Bitte erneut versuchen.", "Generation failed. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  // ---- Result view -------------------------------------------------------
  if (result) {
    const b = result.brand;
    return (
      <div className="max-w-3xl mx-auto">
        <PageHeader
          icon={BrainCircuit}
          color={ACCENT}
          badge={T("Brand Brain aktiv", "Brand Brain active")}
          title={b.name}
          subtitle={T(
            "Deine Marken-Identität steht. Alle Agenten greifen ab jetzt darauf zu.",
            "Your brand identity is ready. Every agent now builds on it."
          )}
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-sm border border-white/10 bg-[#0A0A0A] p-6 mb-5"
        >
          <div className="flex items-center gap-2 mb-4 text-[#D4AF37]">
            <Sparkles size={16} />
            <h3 className="text-sm font-semibold text-white">
              {T("Generierte Marken-Identität", "Generated brand identity")}
            </h3>
          </div>
          {b.slogan && <p className="text-lg text-white/90 italic mb-4">&ldquo;{b.slogan}&rdquo;</p>}
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <Info label={T("Tonalität", "Tone")} value={b.tone} />
            <Info label={T("Zielgruppe", "Target audience")} value={b.target_audience} />
            <Info label={T("Bildstil", "Image style")} value={b.image_style} />
            <Info label={T("Fonts", "Fonts")} value={`${b.font_heading} / ${b.font_body}`} />
          </div>
          <div className="flex items-center gap-3 mt-5">
            {[b.primary_color, b.secondary_color, b.accent_color].map((c) => (
              <div key={c} className="flex items-center gap-2">
                <span
                  className="w-7 h-7 rounded-sm border border-white/15"
                  style={{ background: c }}
                />
                <span className="text-xs text-zinc-500">{c}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-sm border border-white/10 bg-[#0A0A0A] p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4 text-[#34D399]">
            <Database size={16} />
            <h3 className="text-sm font-semibold text-white">
              {result.knowledge_count}{" "}
              {T("Einträge im Gehirnspeicher angelegt", "entries seeded into the brand brain")}
            </h3>
          </div>
          <ul className="space-y-2">
            {(result.knowledge || []).map((k) => (
              <li key={k.id} className="flex items-start gap-3 text-sm">
                <Check size={15} className="text-[#34D399] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-white/90">{k.title}</span>
                  <span className="text-zinc-600 ml-2 text-xs uppercase tracking-wider">{k.category}</span>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>

        <div className="flex flex-wrap gap-3">
          <a
            href="/campaign"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-[#D4AF37] text-black text-sm font-semibold hover:bg-[#e5c04a] transition-colors"
          >
            {T("Jetzt Marketing machen", "Do marketing now")} <ArrowRight size={16} />
          </a>
          <a
            href="/knowledge"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm border border-white/15 text-sm text-white hover:bg-white/5 transition-colors"
          >
            {T("Gehirnspeicher öffnen", "Open brand brain")}
          </a>
          <button
            onClick={() => {
              setResult(null);
              setForm(EMPTY);
              setStep(0);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm border border-white/10 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            {T("Weitere Marke", "Another brand")}
          </button>
        </div>
      </div>
    );
  }

  // ---- Wizard ------------------------------------------------------------
  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        icon={BrainCircuit}
        color={ACCENT}
        badge={T("Modul 1 · Brand Brain", "Module 1 · Brand Brain")}
        title={T("Erzähl der KI von deinem Unternehmen", "Tell the AI about your company")}
        subtitle={T(
          "Ein paar Fragen – danach kennt die KI deine Marke dauerhaft und arbeitet automatisch.",
          "A few questions – then the AI knows your brand permanently and works automatically."
        )}
      />

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i === step;
          const done = i < step;
          return (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center border transition-colors"
                  style={{
                    background: active || done ? `${ACCENT}18` : "transparent",
                    borderColor: active || done ? `${ACCENT}` : "rgba(255,255,255,0.12)",
                    color: active || done ? ACCENT : "#71717a",
                  }}
                >
                  {done ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <span
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: active ? ACCENT : "#71717a" }}
                >
                  {isDE ? s.de : s.en}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="flex-1 h-px mx-2"
                  style={{ background: i < step ? ACCENT : "rgba(255,255,255,0.1)" }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="rounded-sm border border-white/10 bg-[#0A0A0A] p-6 min-h-[280px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && (
              <>
                <Field label={T("Wie heißt dein Unternehmen? *", "Company name? *")}>
                  <input
                    className={inputCls}
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder={T("z. B. Kickstartercash.Club", "e.g. Kickstartercash.Club")}
                    autoFocus
                  />
                </Field>
                <Field label={T("Branche", "Industry")}>
                  <input
                    className={inputCls}
                    value={form.industry}
                    onChange={(e) => set("industry", e.target.value)}
                    placeholder={T("z. B. Immobilien, Coaching, Gastronomie", "e.g. Real estate, coaching, restaurant")}
                  />
                </Field>
                <Field label={T("Website", "Website")}>
                  <input
                    className={inputCls}
                    value={form.website}
                    onChange={(e) => set("website", e.target.value)}
                    placeholder="https://..."
                  />
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <Field label={T("Logo-URL", "Logo URL")}>
                  <input
                    className={inputCls}
                    value={form.logo_url}
                    onChange={(e) => set("logo_url", e.target.value)}
                    placeholder="https://.../logo.png"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label={T("Primärfarbe", "Primary color")}>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.primary_color}
                        onChange={(e) => set("primary_color", e.target.value)}
                        className="w-10 h-10 rounded-sm bg-transparent border border-white/10 cursor-pointer"
                      />
                      <input
                        className={inputCls}
                        value={form.primary_color}
                        onChange={(e) => set("primary_color", e.target.value)}
                      />
                    </div>
                  </Field>
                  <Field label={T("Sekundärfarbe", "Secondary color")}>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.secondary_color}
                        onChange={(e) => set("secondary_color", e.target.value)}
                        className="w-10 h-10 rounded-sm bg-transparent border border-white/10 cursor-pointer"
                      />
                      <input
                        className={inputCls}
                        value={form.secondary_color}
                        onChange={(e) => set("secondary_color", e.target.value)}
                      />
                    </div>
                  </Field>
                </div>
                {form.logo_url && (
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-[11px] uppercase tracking-wider text-zinc-500">
                      {T("Vorschau", "Preview")}
                    </span>
                    <img
                      src={form.logo_url}
                      alt="logo"
                      className="h-10 object-contain"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <Field label={T("Wer ist deine Zielgruppe?", "Who is your target audience?")}>
                  <textarea
                    className={inputCls + " min-h-[90px] resize-none"}
                    value={form.target_audience}
                    onChange={(e) => set("target_audience", e.target.value)}
                    placeholder={T(
                      "z. B. Selbstständige 30–50, die finanziell unabhängig werden wollen",
                      "e.g. Self-employed 30–50 who want financial freedom"
                    )}
                  />
                </Field>
                <Field label={T("Tonalität / Schreibstil", "Tone of voice")}>
                  <input
                    className={inputCls}
                    value={form.tone}
                    onChange={(e) => set("tone", e.target.value)}
                    placeholder={T("z. B. premium, motivierend, direkt", "e.g. premium, motivating, direct")}
                  />
                </Field>
              </>
            )}

            {step === 3 && (
              <>
                <Field label={T("Produkte / Angebote", "Products / services")}>
                  <textarea
                    className={inputCls + " min-h-[90px] resize-none"}
                    value={form.products}
                    onChange={(e) => set("products", e.target.value)}
                    placeholder={T(
                      "Kurz beschreiben, was du anbietest",
                      "Briefly describe what you offer"
                    )}
                  />
                </Field>
                <Field label={T("Social-Media-Accounts", "Social media accounts")}>
                  <input
                    className={inputCls}
                    value={form.social_accounts}
                    onChange={(e) => set("social_accounts", e.target.value)}
                    placeholder="@instagram, @tiktok, linkedin.com/company/..."
                  />
                </Field>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || loading}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-sm text-sm text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
        >
          <ChevronLeft size={16} /> {T("Zurück", "Back")}
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-sm bg-[#D4AF37] text-black text-sm font-semibold hover:bg-[#e5c04a] disabled:opacity-40 transition-colors"
          >
            {T("Weiter", "Next")} <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={loading || !form.name.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-sm bg-[#D4AF37] text-black text-sm font-semibold hover:bg-[#e5c04a] disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {T("Erstelle Marken-Identität…", "Building brand identity…")}
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {T("Brand Brain erstellen", "Create Brand Brain")}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <span className="block text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-1">{label}</span>
      <span className="text-white/85">{value}</span>
    </div>
  );
}

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { API } from "@/context/AppContext";
import { PageHeader } from "@/components/PageHeader";
import {
  Bot,
  Copy,
  Download,
  ExternalLink,
  Github,
  Globe,
  Instagram,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Upload,
  Send,
  Trash2,
  Twitter,
  Users,
  Wand2,
  X,
  Youtube,
} from "lucide-react";

const emptyCard = {
  name: "",
  title: "",
  company: "",
  bio: "",
  logo_url: "",
  avatar: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  social_links: { linkedin: "", instagram: "", x: "", github: "", youtube: "" },
  template_id: "spotlight",
  show_ai_assistant: true,
  assistant_mode: "avatar",
  assistant_avatar: "",
  assistant_label: "Ask AI",
  assistant_greeting: "Hi, ask me anything about this profile.",
  assistant_knowledge: "",
};

const templates = [
  { id: "aurora", name: "Aurora Glass", bg: "from-violet-600/40 via-fuchsia-500/20 to-cyan-400/20" },
  { id: "executive", name: "Executive Dark", bg: "from-slate-800 via-violet-950/60 to-black" },
  { id: "creator", name: "Creator Pulse", bg: "from-pink-500/40 via-purple-600/30 to-orange-400/20" },
  { id: "spotlight", name: "Spotlight Signature", bg: "from-indigo-950 via-[#0a0418] to-black" },
];

const publicUrl = (hash) => `${window.location.origin}/card/${hash}`;
const qrUrl = (url) => `https://api.qrserver.com/v1/create-qr-code/?size=480x480&margin=18&data=${encodeURIComponent(url)}`;

const normalizeCard = (card = {}) => ({
  ...emptyCard,
  ...card,
  social_links: { ...emptyCard.social_links, ...(card.social_links || {}) },
});

const socialIconByKey = {
  linkedin: Linkedin,
  instagram: Instagram,
  x: Twitter,
  github: Github,
  youtube: Youtube,
};

const normalizeUrl = (url = "") => (/^https?:\/\//i.test(url) ? url : `https://${url}`);
const normalizePhoneForTel = (phone = "") => phone.replace(/[^\d+]/g, "");

function CardPreview({ card, compact = false, publicMode = false }) {
  const template = templates.find((t) => t.id === card.template_id) || templates[0];
  const assistantModeLabel = card.assistant_mode === "avatar" ? "avatar mode" : "panel mode";
  const socials = Object.entries(card.social_links || {}).filter(([, v]) => !!(v || "").trim());
  const logoSrc = (card.logo_url || "").trim() || "/brandmind-logo.svg";
  const contactItems = [
    { key: "email", value: card.email, icon: Mail },
    { key: "phone", value: card.phone, icon: Phone },
    { key: "website", value: card.website, icon: Globe },
    { key: "address", value: card.address, icon: MapPin },
  ].filter((item) => !!(item.value || "").trim());

  const renderContactValue = (key, value) => {
    if (!publicMode) return <span>{value}</span>;
    if (key === "email") {
      return (
        <a href={`mailto:${value}`} className="hover:text-white transition-colors underline-offset-2 hover:underline">
          {value}
        </a>
      );
    }
    if (key === "phone") {
      return (
        <a href={`tel:${normalizePhoneForTel(value)}`} className="hover:text-white transition-colors underline-offset-2 hover:underline">
          {value}
        </a>
      );
    }
    if (key === "website") {
      return (
        <a href={normalizeUrl(value)} target="_blank" rel="noreferrer" className="hover:text-white transition-colors underline-offset-2 hover:underline">
          {value}
        </a>
      );
    }
    return <span>{value}</span>;
  };

  const cardPublicLink = card.url_hash ? publicUrl(card.url_hash) : "";

  if (card.template_id === "spotlight") {
    return (
      <div className="relative overflow-hidden rounded-sm border border-violet-300/25 bg-gradient-to-br from-[#140726] via-[#0b0517] to-[#04030c] p-6 shadow-2xl">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -left-16 bottom-[-60px] h-44 w-44 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center rounded-sm border border-violet-300/25 bg-black/20 px-2 py-1">
            <img src={logoSrc} alt="Brand logo" className="h-6 w-auto object-contain" />
          </div>
          <p className="text-xs uppercase tracking-[0.35em] text-violet-300/80">Professional Card</p>
          <h3 className="mt-2 text-3xl font-semibold text-white">{card.name || "Your Name"}</h3>
          <p className="text-violet-200/90 text-sm">{card.title || "Title"}{card.company ? ` · ${card.company}` : ""}</p>

          <div className="mt-5 grid grid-cols-[1fr_110px] gap-4 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-violet-300/70">Mehr Zeit · Mehr Impact</p>
              <p className="mt-2 text-sm leading-6 text-zinc-200">
                {card.bio || "Professionelle KI-gestützte Marketing-Unterstützung für mehr Wachstum und bessere Automatisierung."}
              </p>
            </div>
            <div className="h-28 w-28 overflow-hidden rounded-sm border border-violet-300/30 bg-white/10">
              {card.avatar ? (
                <img src={card.avatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-3xl font-bold text-white">
                  {(card.name || "AI").slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 text-[11px]">
            {["KI Agenten", "Content", "Marketing", "Automation"].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1.5 text-zinc-200">{item}</div>
            ))}
          </div>

          {socials.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {socials.map(([k, v]) => {
                const Icon = socialIconByKey[k] || ExternalLink;
                return (
                  <a
                    key={k}
                    href={normalizeUrl(v)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/30 bg-violet-500/10 px-2.5 py-1 text-[11px] text-violet-100 hover:border-violet-200/60 transition-colors"
                  >
                    <Icon className="h-3 w-3" />
                    {k}
                  </a>
                );
              })}
            </div>
          )}

          <div className="mt-5 grid gap-2 text-sm text-zinc-200">
            {contactItems.map(({ key, value, icon: Icon }) => (
            <div key={key} className="inline-flex min-w-0 items-center gap-2 rounded-sm border border-violet-300/20 bg-black/20 px-2.5 py-1.5">
                <Icon className="h-3.5 w-3.5 text-violet-200/80 shrink-0" />
                <div className="truncate">{renderContactValue(key, value)}</div>
              </div>
            ))}
          </div>

          {publicMode && cardPublicLink && (
            <div className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-violet-300/25 bg-black/30 p-2">
              <img src={qrUrl(cardPublicLink)} alt="QR code" className="h-20 w-20 rounded-md bg-white p-1" />
              <div className="text-xs text-zinc-300">
                <p className="text-violet-200 uppercase tracking-wide">Vernetze dich mit mir</p>
                <p className="mt-1 break-all text-zinc-400">{cardPublicLink}</p>
              </div>
            </div>
          )}

          {card.show_ai_assistant && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-violet-500/15 px-3 py-1 text-xs text-violet-100">
              <MessageCircle className="h-3 w-3" /> AI assistant enabled ({assistantModeLabel})
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-sm border border-white/15 bg-gradient-to-br ${template.bg} p-6 shadow-2xl`}>
      <div className="absolute -right-20 -top-20 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_45%)]" />
      <div className="relative mb-4 inline-flex items-center rounded-sm border border-white/20 bg-black/30 px-2 py-1">
        <img src={logoSrc} alt="Brand logo" className="h-6 w-auto object-contain" />
      </div>
      <div className="relative flex items-start gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-sm border border-white/25 bg-black/25">
          {card.avatar ? (
            <img src={card.avatar} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl font-bold text-white">
              {(card.name || "AI").slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 text-left">
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">Professional Card</p>
          <h3 className="mt-2 truncate text-2xl font-semibold text-white">{card.name || "Your Name"}</h3>
          <p className="text-sm text-violet-100/95">
            {card.title || "Title"}
            {card.company ? ` · ${card.company}` : ""}
          </p>
        </div>
      </div>
      <p className={`relative mt-5 text-sm leading-6 text-white/80 ${compact ? "line-clamp-3" : ""}`}>
        {card.bio || "Add a short profile bio so visitors understand who you are and how you help."}
      </p>
      {contactItems.length > 0 && (
        <div className="relative mt-6 grid gap-2 text-sm text-white/85">
          {contactItems.map(({ key, value, icon: Icon }) => (
            <div key={key} className="inline-flex min-w-0 items-center gap-2 rounded-sm border border-white/10 bg-black/25 px-2.5 py-1.5">
              <Icon className="h-3.5 w-3.5 shrink-0 text-white/70" />
              <div className="truncate">{renderContactValue(key, value)}</div>
            </div>
          ))}
        </div>
      )}
      {socials.length > 0 && (
        <div className="relative mt-4 flex flex-wrap gap-2">
          {socials.map(([k, v]) => {
            const Icon = socialIconByKey[k] || ExternalLink;
            const href = normalizeUrl(v);
            return (
              <a
                key={k}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-sm border border-white/20 bg-black/25 px-2.5 py-1 text-[11px] text-white/90 transition-colors hover:border-white/40 hover:text-white"
              >
                <Icon className="h-3 w-3" />
                {k}
              </a>
            );
          })}
        </div>
      )}
      {card.show_ai_assistant && (
        <div className="relative mt-5 inline-flex items-center gap-2 rounded-sm border border-white/15 bg-black/30 px-3 py-1 text-xs text-white">
          <MessageCircle className="h-3 w-3" />
          AI assistant enabled ({assistantModeLabel})
        </div>
      )}
    </div>
  );
}

function AssistantPanel({ card, messages, q, setQ, ask, asking }) {
  const quickQuestions = [
    "What services do you offer?",
    "How can I contact you?",
    "What is your website?",
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <h2 className="mb-2 font-semibold">Ask about {card.name || "this profile"}</h2>
      <p className="text-xs text-zinc-400">{card.assistant_greeting}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {quickQuestions.map((qText) => (
          <button
            key={qText}
            type="button"
            disabled={asking}
            onClick={() => ask(qText)}
            className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] text-zinc-300 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
          >
            {qText}
          </button>
        ))}
      </div>
      <div className="mt-3 max-h-64 space-y-2 overflow-auto text-sm">
        {messages.map((m, i) => (
          <div key={`${m.role}-${i}`} className={`flex ${m.role === "ai" ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${
              m.role === "ai"
                ? "border border-white/10 bg-white/[0.06] text-violet-100"
                : "bg-violet-600/90 text-white"
            }`}>
              <div className="text-[10px] uppercase tracking-wider mb-1 opacity-80">
                {m.role === "ai" ? card.assistant_label || "AI Assistant" : "You"}
              </div>
              <div>{m.text}</div>
            </div>
          </div>
        ))}
        {asking && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-violet-100">
              <div className="text-[10px] uppercase tracking-wider mb-1 opacity-80">{card.assistant_label || "AI Assistant"}</div>
              <div className="inline-flex items-center gap-2 text-xs">
                <Loader2 className="h-3 w-3 animate-spin" /> thinking...
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
          placeholder="What services are offered?"
        />
        <button
          onClick={ask}
          disabled={asking}
          className="inline-flex items-center gap-1 rounded-xl bg-violet-600 px-4 text-sm disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {asking ? "..." : "Ask"}
        </button>
      </div>
    </div>
  );
}

function FloatingAvatarAssistant({ card, messages, q, setQ, ask, asking }) {
  const [open, setOpen] = useState(false);
  const assistantAvatar = card.assistant_avatar || card.avatar || "";

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-3 rounded-full border border-white/20 bg-[#120a1f] px-3 py-2 text-left text-white shadow-[0_0_25px_rgba(168,85,247,0.45)]"
      >
        <span className="relative h-12 w-12 overflow-hidden rounded-full border border-white/20 bg-violet-500/30">
          {assistantAvatar ? (
            <img src={assistantAvatar} alt="Assistant avatar" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center">
              <Bot className="h-5 w-5" />
            </span>
          )}
          <span className="absolute inset-0 rounded-full border border-violet-300/80 animate-ping" />
        </span>
        <span className="pr-2 text-sm font-medium">{card.assistant_label || "Ask AI"}</span>
      </motion.button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="fixed bottom-6 right-6 w-[min(92vw,28rem)] rounded-3xl border border-white/15 bg-[#090611] p-4 text-white shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-violet-300" />
                <h3 className="font-semibold">{card.assistant_label || "Ask AI"}</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-white/10 p-1 text-white/80 transition hover:text-white"
                aria-label="Close assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <AssistantPanel card={card} messages={messages} q={q} setQ={setQ} ask={ask} asking={asking} />
          </div>
        </div>
      )}
    </>
  );
}

export function PublicBusinessCard() {
  const hash = window.location.pathname.split("/").pop();
  const [card, setCard] = useState(null);
  const [q, setQ] = useState("");
  const [messages, setMessages] = useState([]);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    axios.get(`${API}/business-cards/public/${hash}`).then((r) => setCard(normalizeCard(r.data)));
  }, [hash]);

  const ask = async (overrideQuestion = null) => {
    if (asking || !card) return;
    const question = (overrideQuestion || q).trim();
    if (!question) return;
    setQ("");
    setMessages((m) => [...m, { role: "you", text: question }]);
    setAsking(true);
    try {
      const r = await axios.post(`${API}/business-cards/public/${hash}/chat`, { question });
      setMessages((m) => [...m, { role: "ai", text: r.data.answer }]);
    } catch {
      setMessages((m) => [...m, { role: "ai", text: "Assistant unavailable right now. Please try again." }]);
    } finally {
      setAsking(false);
    }
  };

  if (!card) {
    return <div className="min-h-screen bg-[#08040f] p-8 text-white">Loading card…</div>;
  }

  const useAvatarMode = card.show_ai_assistant && card.assistant_mode !== "panel";

  return (
    <div className="min-h-screen bg-[#08040f] px-5 py-10 text-white">
      <div className="mx-auto max-w-xl space-y-6">
        <CardPreview card={card} publicMode />
        {card.show_ai_assistant && card.assistant_mode === "panel" && (
          <AssistantPanel card={card} messages={messages} q={q} setQ={setQ} ask={ask} asking={asking} />
        )}
      </div>
      {useAvatarMode && <FloatingAvatarAssistant card={card} messages={messages} q={q} setQ={setQ} ask={ask} asking={asking} />}
    </div>
  );
}

export default function AIBusinessCard() {
  const [cards, setCards] = useState([]);
  const [current, setCurrent] = useState(emptyCard);
  const [saving, setSaving] = useState(false);
  const avatarFileInputRef = useRef(null);
  const logoFileInputRef = useRef(null);

  const link = useMemo(() => (current.url_hash ? publicUrl(current.url_hash) : "Save to generate link"), [current.url_hash]);

  const load = async () => {
    const r = await axios.get(`${API}/business-cards`);
    const next = (r.data || []).map((card) => normalizeCard(card));
    setCards(next);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = normalizeCard(current);
      const r = current.id
        ? await axios.put(`${API}/business-cards/${current.id}`, payload)
        : await axios.post(`${API}/business-cards`, payload);
      setCurrent(normalizeCard(r.data));
      await load();
      toast.success("Business card saved");
    } finally {
      setSaving(false);
    }
  };

  const duplicate = async (id) => {
    const r = await axios.post(`${API}/business-cards/${id}/duplicate`);
    setCurrent(normalizeCard(r.data));
    await load();
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this business card?")) return;
    await axios.delete(`${API}/business-cards/${id}`);
    setCurrent(emptyCard);
    await load();
  };

  const update = (k, v) => setCurrent((c) => ({ ...c, [k]: v }));
  const social = (k, v) => setCurrent((c) => ({ ...c, social_links: { ...(c.social_links || {}), [k]: v } }));

  const copy = async (text) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  const downloadQr = () => {
    if (!current.url_hash) return;
    const a = document.createElement("a");
    a.href = qrUrl(link);
    a.download = `${current.name || "business-card"}-qr.png`;
    a.click();
  };

  const onAvatarUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      toast.error("Image too large (max 6MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      update("avatar", String(reader.result || ""));
      toast.success("Profile image uploaded");
    };
    reader.onerror = () => toast.error("Image upload failed");
    reader.readAsDataURL(file);
  };

  const onLogoUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      toast.error("Image too large (max 6MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      update("logo_url", String(reader.result || ""));
      toast.success("Logo uploaded");
    };
    reader.onerror = () => toast.error("Logo upload failed");
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Users}
        title="AI Business Card"
        subtitle="Create Brandmind-native digital business cards with public links, QR codes, templates and a profile-bounded AI assistant."
        badge="Brandmind Module"
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <div className="bg-[#0A0A0A] border border-white/10 rounded-sm p-6">
          <div className="mb-4 flex flex-wrap gap-3">
            <button onClick={() => setCurrent(emptyCard)} className="rounded-sm bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white hover:bg-[#C4B5FD] transition-colors">
              <Plus className="mr-2 inline h-4 w-4" />
              New card
            </button>
            <button onClick={save} disabled={saving} className="rounded-sm border border-white/10 px-4 py-2 text-sm text-zinc-200 hover:text-white hover:border-white/20 transition-colors disabled:opacity-60">
              {saving ? "Saving..." : "Save card"}
            </button>
            {current.url_hash && (
              <>
                <button onClick={() => copy(link)} className="rounded-sm border border-white/10 px-4 py-2 text-sm text-zinc-200 hover:text-white hover:border-white/20 transition-colors">
                  <Copy className="mr-2 inline h-4 w-4" />
                  Copy link
                </button>
                <button onClick={downloadQr} className="rounded-sm border border-white/10 px-4 py-2 text-sm text-zinc-200 hover:text-white hover:border-white/20 transition-colors">
                  <Download className="mr-2 inline h-4 w-4" />
                  QR
                </button>
              </>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {["name", "title", "company", "logo_url", "avatar", "phone", "email", "website", "address"].map((f) => (
              <input
                key={f}
                value={current[f] || ""}
                onChange={(e) => update(f, e.target.value)}
                placeholder={f.replace("_", " ")}
                className="rounded-sm border border-white/10 bg-black px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#7C3AED]/50"
              />
            ))}
            <div className="md:col-span-2 flex items-center gap-2">
              <input
                ref={logoFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onLogoUpload(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => logoFileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-sm border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:border-white/20 transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload logo
              </button>
              <button
                type="button"
                onClick={() => update("logo_url", "")}
                className="inline-flex items-center gap-2 rounded-sm border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:border-white/20 transition-colors"
              >
                Reset to default logo
              </button>
              <span className="text-[11px] text-zinc-500">Default: BrandMind logo</span>
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onAvatarUpload(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-sm border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:border-white/20 transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload your real photo
              </button>
              <span className="text-[11px] text-zinc-500">JPG/PNG/WebP, max 6MB</span>
            </div>
            <textarea
              value={current.bio || ""}
              onChange={(e) => update("bio", e.target.value)}
              placeholder="Bio"
              className="min-h-28 rounded-sm border border-white/10 bg-black px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#7C3AED]/50 md:col-span-2"
            />
            {Object.keys(emptyCard.social_links).map((k) => (
              <input
                key={k}
                value={(current.social_links || {})[k] || ""}
                onChange={(e) => social(k, e.target.value)}
                placeholder={`${k} URL`}
                className="rounded-sm border border-white/10 bg-black px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#7C3AED]/50"
              />
            ))}
            <select
              value={current.template_id}
              onChange={(e) => update("template_id", e.target.value)}
              className="rounded-sm border border-white/10 bg-black px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7C3AED]/50"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <label className="flex items-center gap-3 rounded-sm border border-white/10 bg-black px-3 py-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={!!current.show_ai_assistant}
                onChange={(e) => update("show_ai_assistant", e.target.checked)}
              />
              Enable AI assistant
            </label>
            <select
              value={current.assistant_mode || "avatar"}
              onChange={(e) => update("assistant_mode", e.target.value)}
              className="rounded-sm border border-white/10 bg-black px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7C3AED]/50"
            >
              <option value="avatar">Assistant mode: Floating avatar</option>
              <option value="panel">Assistant mode: Inline panel</option>
            </select>
            <input
              value={current.assistant_label || ""}
              onChange={(e) => update("assistant_label", e.target.value)}
              placeholder="Assistant button label (e.g. Ask AI)"
              className="rounded-sm border border-white/10 bg-black px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#7C3AED]/50"
            />
            <input
              value={current.assistant_avatar || ""}
              onChange={(e) => update("assistant_avatar", e.target.value)}
              placeholder="Assistant avatar URL (optional)"
              className="rounded-sm border border-white/10 bg-black px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#7C3AED]/50 md:col-span-2"
            />
            <textarea
              value={current.assistant_greeting || ""}
              onChange={(e) => update("assistant_greeting", e.target.value)}
              placeholder="Assistant greeting"
              className="rounded-sm border border-white/10 bg-black px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#7C3AED]/50 md:col-span-2"
            />
            <textarea
              value={current.assistant_knowledge || ""}
              onChange={(e) => update("assistant_knowledge", e.target.value)}
              placeholder="Assistant knowledge (private notes/FAQ for bot answers)"
              className="min-h-32 rounded-sm border border-white/10 bg-black px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#7C3AED]/50 md:col-span-2"
            />
          </div>
        </div>

        <div className="space-y-5">
          <CardPreview card={current} />
          {current.url_hash && (
            <div className="bg-[#0A0A0A] border border-white/10 rounded-sm p-5 text-center">
              <img src={qrUrl(link)} alt="QR code" className="mx-auto h-44 w-44 rounded-sm bg-white p-2" />
              <p className="mt-3 break-all text-xs text-zinc-400">{link}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-white/10 rounded-sm p-6">
        <h2 className="mb-5 flex items-center gap-2 text-xl font-semibold text-white">
          <Users className="h-5 w-5 text-violet-300" />
          Saved card gallery
        </h2>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <div key={card.id} className="space-y-3">
              <CardPreview card={card} compact />
              <div className="flex flex-wrap gap-2 text-xs">
                <button onClick={() => setCurrent(normalizeCard(card))} className="rounded-lg border border-white/10 px-3 py-2">Edit</button>
                <button onClick={() => duplicate(card.id)} className="rounded-lg border border-white/10 px-3 py-2">
                  <Wand2 className="inline h-3 w-3" /> Duplicate
                </button>
                <button onClick={() => copy(publicUrl(card.url_hash))} className="rounded-lg border border-white/10 px-3 py-2">
                  <Copy className="inline h-3 w-3" /> Link
                </button>
                <a href={publicUrl(card.url_hash)} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 px-3 py-2">
                  <ExternalLink className="inline h-3 w-3" /> View
                </a>
                <button onClick={() => remove(card.id)} className="rounded-lg border border-red-400/30 px-3 py-2 text-red-200">
                  <Trash2 className="inline h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { API } from "@/context/AppContext";
import { Copy, Download, ExternalLink, MessageCircle, Plus, Sparkles, Trash2, Users, Wand2 } from "lucide-react";

const emptyCard = {
  name: "", title: "", company: "", bio: "", avatar: "", phone: "", email: "", website: "", address: "",
  social_links: { linkedin: "", instagram: "", x: "", github: "", youtube: "" },
  template_id: "aurora", show_ai_assistant: true,
};

const templates = [
  { id: "aurora", name: "Aurora Glass", bg: "from-violet-600/40 via-fuchsia-500/20 to-cyan-400/20" },
  { id: "executive", name: "Executive Dark", bg: "from-slate-800 via-violet-950/60 to-black" },
  { id: "creator", name: "Creator Pulse", bg: "from-pink-500/40 via-purple-600/30 to-orange-400/20" },
];

const publicUrl = (hash) => `${window.location.origin}/card/${hash}`;
const qrUrl = (url) => `https://api.qrserver.com/v1/create-qr-code/?size=480x480&margin=18&data=${encodeURIComponent(url)}`;

function CardPreview({ card, compact = false }) {
  const template = templates.find((t) => t.id === card.template_id) || templates[0];
  return (
    <div className={`relative overflow-hidden rounded-[2rem] border border-white/15 bg-gradient-to-br ${template.bg} p-6 shadow-2xl backdrop-blur-xl`}>
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
      <div className="relative flex items-start gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-3xl border border-white/20 bg-white/10">
          {card.avatar ? <img src={card.avatar} alt="Avatar" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-2xl font-bold text-white">{(card.name || "AI").slice(0,2).toUpperCase()}</div>}
        </div>
        <div className="min-w-0 text-left">
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">AI Business Card</p>
          <h3 className="mt-2 truncate text-2xl font-semibold text-white">{card.name || "Your Name"}</h3>
          <p className="text-sm text-violet-100">{card.title || "Title"}{card.company ? ` · ${card.company}` : ""}</p>
        </div>
      </div>
      <p className={`relative mt-5 text-sm leading-6 text-white/80 ${compact ? "line-clamp-3" : ""}`}>{card.bio || "Add a short profile bio so visitors understand who you are and how you help."}</p>
      <div className="relative mt-6 grid gap-2 text-sm text-white/80">
        {card.email && <span>{card.email}</span>}{card.phone && <span>{card.phone}</span>}{card.website && <span>{card.website}</span>}{card.address && <span>{card.address}</span>}
      </div>
      {card.show_ai_assistant && <div className="relative mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white"><MessageCircle className="h-3 w-3" /> AI assistant enabled</div>}
    </div>
  );
}

export function PublicBusinessCard() {
  const hash = window.location.pathname.split("/").pop();
  const [card, setCard] = useState(null); const [q, setQ] = useState(""); const [messages, setMessages] = useState([]);
  useEffect(() => { axios.get(`${API}/business-cards/public/${hash}`).then((r) => setCard(r.data)); }, [hash]);
  const ask = async () => { if (!q.trim()) return; const question = q; setQ(""); setMessages((m) => [...m, { role: "you", text: question }]); const r = await axios.post(`${API}/business-cards/public/${hash}/chat`, { question }); setMessages((m) => [...m, { role: "ai", text: r.data.answer }]); };
  if (!card) return <div className="min-h-screen bg-[#08040f] p-8 text-white">Loading card…</div>;
  return <div className="min-h-screen bg-[#08040f] px-5 py-10 text-white"><div className="mx-auto max-w-xl"><CardPreview card={card} />{card.show_ai_assistant && <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-4"><h2 className="mb-3 font-semibold">Ask about {card.name}</h2><div className="max-h-56 space-y-2 overflow-auto text-sm">{messages.map((m,i)=><div key={i} className={m.role === "ai" ? "text-violet-100" : "text-white/60"}><b>{m.role}:</b> {m.text}</div>)}</div><div className="mt-3 flex gap-2"><input value={q} onChange={(e)=>setQ(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&ask()} className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2" placeholder="What services are offered?"/><button onClick={ask} className="rounded-xl bg-violet-600 px-4">Ask</button></div></div>}</div></div>;
}

export default function AIBusinessCard() {
  const [cards, setCards] = useState([]); const [current, setCurrent] = useState(emptyCard); const [saving, setSaving] = useState(false);
  const link = useMemo(() => current.url_hash ? publicUrl(current.url_hash) : "Save to generate link", [current.url_hash]);
  const load = async () => { const r = await axios.get(`${API}/business-cards`); setCards(r.data); if (!current.id && r.data[0]) setCurrent(r.data[0]); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);
  const save = async () => { setSaving(true); try { const r = current.id ? await axios.put(`${API}/business-cards/${current.id}`, current) : await axios.post(`${API}/business-cards`, current); setCurrent(r.data); await load(); toast.success("Business card saved"); } finally { setSaving(false); } };
  const duplicate = async (id) => { const r = await axios.post(`${API}/business-cards/${id}/duplicate`); setCurrent(r.data); await load(); };
  const remove = async (id) => { if (!window.confirm("Delete this business card?")) return; await axios.delete(`${API}/business-cards/${id}`); setCurrent(emptyCard); await load(); };
  const update = (k, v) => setCurrent((c) => ({ ...c, [k]: v }));
  const social = (k, v) => setCurrent((c) => ({ ...c, social_links: { ...(c.social_links || {}), [k]: v } }));
  const copy = async (text) => { await navigator.clipboard.writeText(text); toast.success("Copied"); };
  const downloadQr = () => { if (!current.url_hash) return; const a = document.createElement("a"); a.href = qrUrl(link); a.download = `${current.name || "business-card"}-qr.png`; a.click(); };
  return <div className="space-y-8"><motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8"><p className="flex items-center gap-2 text-sm uppercase tracking-[0.35em] text-violet-300"><Sparkles className="h-4 w-4"/> Brandmind module</p><h1 className="mt-3 bg-gradient-to-r from-white via-violet-200 to-fuchsia-300 bg-clip-text text-4xl font-semibold text-transparent">AI Business Card</h1><p className="mt-3 max-w-3xl text-zinc-400">Create Brandmind-native digital business cards with public links, QR codes, templates and a profile-bounded AI assistant.</p></motion.div>
  <div className="grid gap-6 xl:grid-cols-[1fr_420px]"><div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6"><div className="mb-4 flex flex-wrap gap-3"><button onClick={()=>setCurrent(emptyCard)} className="rounded-xl bg-violet-600 px-4 py-2 text-sm"><Plus className="mr-2 inline h-4 w-4"/>New card</button><button onClick={save} disabled={saving} className="rounded-xl border border-white/10 px-4 py-2 text-sm">{saving ? "Saving…" : "Save card"}</button>{current.url_hash && <><button onClick={()=>copy(link)} className="rounded-xl border border-white/10 px-4 py-2 text-sm"><Copy className="mr-2 inline h-4 w-4"/>Copy link</button><button onClick={downloadQr} className="rounded-xl border border-white/10 px-4 py-2 text-sm"><Download className="mr-2 inline h-4 w-4"/>QR</button></>}</div><div className="grid gap-4 md:grid-cols-2">{["name","title","company","avatar","phone","email","website","address"].map(f=><input key={f} value={current[f]||""} onChange={(e)=>update(f,e.target.value)} placeholder={f.replace('_',' ')} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-violet-400"/>)}<textarea value={current.bio||""} onChange={(e)=>update("bio",e.target.value)} placeholder="Bio" className="min-h-28 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-violet-400 md:col-span-2"/>{Object.keys(emptyCard.social_links).map(k=><input key={k} value={(current.social_links||{})[k]||""} onChange={(e)=>social(k,e.target.value)} placeholder={`${k} URL`} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-violet-400"/>)}<select value={current.template_id} onChange={(e)=>update("template_id",e.target.value)} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white">{templates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select><label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm"><input type="checkbox" checked={!!current.show_ai_assistant} onChange={(e)=>update("show_ai_assistant",e.target.checked)}/> Enable AI assistant</label></div></div><div className="space-y-5"><CardPreview card={current}/>{current.url_hash && <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-center"><img src={qrUrl(link)} alt="QR code" className="mx-auto h-44 w-44 rounded-2xl bg-white p-2"/><p className="mt-3 break-all text-xs text-zinc-400">{link}</p></div>}</div></div>
  <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6"><h2 className="mb-5 flex items-center gap-2 text-xl font-semibold text-white"><Users className="h-5 w-5 text-violet-300"/> Saved card gallery</h2><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{cards.map(card=><div key={card.id} className="space-y-3"><CardPreview card={card} compact/><div className="flex flex-wrap gap-2 text-xs"><button onClick={()=>setCurrent(card)} className="rounded-lg border border-white/10 px-3 py-2">Edit</button><button onClick={()=>duplicate(card.id)} className="rounded-lg border border-white/10 px-3 py-2"><Wand2 className="inline h-3 w-3"/> Duplicate</button><button onClick={()=>copy(publicUrl(card.url_hash))} className="rounded-lg border border-white/10 px-3 py-2"><Copy className="inline h-3 w-3"/> Link</button><a href={publicUrl(card.url_hash)} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 px-3 py-2"><ExternalLink className="inline h-3 w-3"/> View</a><button onClick={()=>remove(card.id)} className="rounded-lg border border-red-400/30 px-3 py-2 text-red-200"><Trash2 className="inline h-3 w-3"/></button></div></div>)}</div></div></div>;
}

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Rocket, Loader2, ExternalLink, Copy, Check, Trash2, Pencil, Inbox, Plus, Upload, X } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { PageTitle } from "@/components/PageTitle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const empty = {
  reflink: "", name: "", role: "", city: "", phone: "", whatsapp: "",
  email: "", telegram: "", instagram: "", cta_text: "", photo: "",
};

const inputCls = "bg-black/40 border-white/10 focus:border-[#7C3AED] focus-visible:ring-[#7C3AED]/40 text-white";

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs tracking-[0.12em] uppercase text-zinc-500">{label}</Label>
    {children}
  </div>
);

export default function Funnel() {
  const { t } = useApp();
  const [funnels, setFunnels] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [leadsFor, setLeadsFor] = useState(null);
  const [leads, setLeads] = useState([]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const pageUrl = (id) => `${API}/funnel/${id}/page`;

  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error(t("error_generic")); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const max = 400;
        let { width, height } = img;
        if (width > height && width > max) { height = (height * max) / width; width = max; }
        else if (height > max) { width = (width * max) / height; height = max; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        set("photo", canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const load = useCallback(async () => {
    const res = await axios.get(`${API}/funnel`);
    setFunnels(res.data);
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.reflink.trim() || !form.name.trim() || !form.email.trim()) {
      toast.error(`${t("funnel_reflink")}, ${t("funnel_name")}, ${t("funnel_email")}`); return;
    }
    setSaving(true);
    try {
      if (editing) await axios.put(`${API}/funnel/${editing}`, form);
      else await axios.post(`${API}/funnel`, form);
      await load();
      toast.success(t("funnel_created"));
      setForm(empty); setEditing(null);
    } catch { toast.error(t("error_generic")); }
    finally { setSaving(false); }
  };

  const startEdit = (f) => { setForm({ ...empty, ...f }); setEditing(f.id); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const remove = async (id) => { await axios.delete(`${API}/funnel/${id}`); await load(); toast.success("OK"); };

  const copyLink = async (id) => {
    await navigator.clipboard.writeText(pageUrl(id));
    setCopiedId(id); toast.success(t("copied")); setTimeout(() => setCopiedId(null), 1800);
  };

  const showLeads = async (id) => {
    if (leadsFor === id) { setLeadsFor(null); return; }
    const res = await axios.get(`${API}/funnel/${id}/leads`);
    setLeads(res.data); setLeadsFor(id);
  };

  return (
    <div>
      <PageTitle title={t("funnel_title")} subtitle={t("funnel_sub")} icon={Rocket} />

      <div className="bg-[#7C3AED]/5 border border-[#7C3AED]/20 rounded-md p-4 text-sm text-zinc-300 mb-6 leading-relaxed">
        {t("funnel_intro")}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-md p-6 md:p-7 space-y-5" data-testid="funnel-form">
          <div className="flex items-center gap-2 text-[#7C3AED]">
            {editing ? <Pencil size={16} /> : <Plus size={16} />}
            <span className="font-display text-lg">{editing ? t("funnel_update") : t("funnel_new")}</span>
          </div>
          <Field label={t("funnel_reflink")}>
            <Input data-testid="funnel-reflink" className={inputCls} value={form.reflink} onChange={(e) => set("reflink", e.target.value)} placeholder="https://portal.kickstartercash.club/?ref=DEINNAME" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t("funnel_name")}><Input data-testid="funnel-name" className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field label={t("funnel_role")}><Input data-testid="funnel-role" className={inputCls} value={form.role} onChange={(e) => set("role", e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t("funnel_email")}><Input data-testid="funnel-email" type="email" className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
            <Field label={t("funnel_city")}><Input data-testid="funnel-city" className={inputCls} value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t("funnel_phone")}><Input data-testid="funnel-phone" className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+49 170 1234567" /></Field>
            <Field label={t("funnel_whatsapp")}><Input data-testid="funnel-whatsapp" className={inputCls} value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="491701234567" /></Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t("funnel_telegram")}><Input data-testid="funnel-telegram" className={inputCls} value={form.telegram} onChange={(e) => set("telegram", e.target.value)} placeholder="@username" /></Field>
            <Field label={t("funnel_instagram")}><Input data-testid="funnel-instagram" className={inputCls} value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@username" /></Field>
          </div>
          <Field label={t("funnel_cta")}><Input data-testid="funnel-cta" className={inputCls} value={form.cta_text} onChange={(e) => set("cta_text", e.target.value)} placeholder="Jetzt kostenlos teilnehmen" /></Field>

          <Field label={t("funnel_photo")}>
            <div className="flex items-center gap-4">
              {form.photo ? (
                <div className="relative">
                  <img src={form.photo} alt="Berater" className="w-20 h-20 rounded-full object-cover border-2 border-[#7C3AED]" data-testid="funnel-photo-preview" />
                  <button type="button" data-testid="funnel-photo-remove" onClick={() => set("photo", "")}
                    className="absolute -top-1.5 -right-1.5 bg-black border border-white/20 rounded-full p-0.5 text-zinc-300 hover:text-red-400">
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/15 flex items-center justify-center text-zinc-600 text-[10px] text-center">{t("funnel_photo_ph")}</div>
              )}
              <label data-testid="funnel-photo-label" className="inline-flex items-center gap-2 cursor-pointer text-sm px-4 py-2.5 rounded-sm border border-[#7C3AED]/40 text-[#7C3AED] hover:bg-[#7C3AED]/10 transition-colors">
                <Upload size={15} /> {t("funnel_photo_btn")}
                <input data-testid="funnel-photo-input" type="file" accept="image/*" className="hidden" onChange={onPhoto} />
              </label>
            </div>
          </Field>

          <div className="flex gap-3 pt-1">
            <button data-testid="funnel-save-btn" disabled={saving} onClick={save}
              className="inline-flex items-center gap-2 bg-[#7C3AED] text-white px-7 py-2.5 rounded-sm font-bold hover:bg-[#C4B5FD] transition-colors disabled:opacity-60">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
              {editing ? t("funnel_update") : t("funnel_create")}
            </button>
            {editing && <button onClick={() => { setForm(empty); setEditing(null); }} className="px-5 py-2.5 rounded-sm border border-white/10 text-zinc-300 hover:bg-white/5">{t("brand_cancel")}</button>}
          </div>
          <p className="text-xs text-zinc-600">{t("funnel_email_hint")}</p>
        </div>

        {/* Funnel list */}
        <div className="space-y-4">
          <div className="text-xs tracking-[0.12em] uppercase text-zinc-500">{t("funnel_yourfunnels")}</div>
          {funnels.length === 0 && <p className="text-zinc-600 text-sm">—</p>}
          {funnels.map((f) => (
            <div key={f.id} data-testid={`funnel-card-${f.id}`} className="bg-[#0A0A0A] border border-white/10 rounded-md p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-white font-medium truncate">{f.name}</div>
                  <div className="text-xs text-zinc-500 truncate">{f.email}</div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button data-testid={`funnel-edit-${f.id}`} onClick={() => startEdit(f)} className="p-2 rounded border border-white/10 text-zinc-400 hover:text-[#7C3AED] hover:border-[#7C3AED]/50"><Pencil size={13} /></button>
                  <button data-testid={`funnel-delete-${f.id}`} onClick={() => remove(f.id)} className="p-2 rounded border border-white/10 text-zinc-400 hover:text-red-400 hover:border-red-400/50"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 bg-black/40 border border-white/10 rounded-sm px-3 py-2">
                <span className="text-xs text-zinc-400 truncate flex-1">{pageUrl(f.id)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a data-testid={`funnel-open-${f.id}`} href={pageUrl(f.id)} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm bg-[#7C3AED] text-white font-semibold hover:bg-[#C4B5FD]">
                  <ExternalLink size={13} /> {t("funnel_open")}
                </a>
                <button data-testid={`funnel-copy-${f.id}`} onClick={() => copyLink(f.id)}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm border border-white/10 text-zinc-300 hover:border-[#7C3AED]/50 hover:text-[#7C3AED]">
                  {copiedId === f.id ? <Check size={13} /> : <Copy size={13} />} {t("funnel_copy")}
                </button>
                <button data-testid={`funnel-leads-${f.id}`} onClick={() => showLeads(f.id)}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm border border-white/10 text-zinc-300 hover:border-[#7C3AED]/50 hover:text-[#7C3AED]">
                  <Inbox size={13} /> {t("funnel_leads")}
                </button>
              </div>
              {leadsFor === f.id && (
                <div className="mt-4 border-t border-white/10 pt-3 space-y-2" data-testid={`funnel-leads-list-${f.id}`}>
                  {leads.length === 0 && <p className="text-xs text-zinc-600">{t("funnel_noleads")}</p>}
                  {leads.map((l) => (
                    <div key={l.id} className="text-xs bg-black/30 rounded-sm p-2.5">
                      <div className="text-white">{l.vorname} {l.nachname} · <span className="text-[#7C3AED]">{l.email}</span></div>
                      <div className="text-zinc-500">{l.telefon} {l.land && `· ${l.land}`}</div>
                      {l.nachricht && <div className="text-zinc-400 mt-1">{l.nachricht}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Palette, Plus, Trash2, Check, Pencil } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { PageTitle } from "@/components/PageTitle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const empty = {
  name: "", slogan: "", primary_color: "#D4AF37", secondary_color: "#050505",
  accent_color: "#F3E5AB", font_heading: "Playfair Display", font_body: "Manrope",
  tone: "", image_style: "", logo_url: "",
};

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs tracking-[0.12em] uppercase text-zinc-500">{label}</Label>
    {children}
  </div>
);

const inputCls = "bg-black/40 border-white/10 focus:border-[#D4AF37] focus-visible:ring-[#D4AF37]/40 text-white";

export default function BrandDesigner() {
  const { t, brands, loadBrands, activeBrandId, setActiveBrandId } = useApp();
  const [editing, setEditing] = useState(null); // null | "new" | brandId
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const startNew = () => { setForm(empty); setEditing("new"); };
  const startEdit = (b) => { setForm({ ...b }); setEditing(b.id); };
  const cancel = () => { setEditing(null); setForm(empty); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) { toast.error(t("brand_name")); return; }
    setSaving(true);
    try {
      if (editing === "new") {
        const res = await axios.post(`${API}/brands`, form);
        setActiveBrandId(res.data.id);
      } else {
        await axios.put(`${API}/brands/${editing}`, form);
      }
      await loadBrands();
      toast.success(t("brand_saved"));
      cancel();
    } catch (e) {
      toast.error(t("error_generic"));
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    try {
      await axios.delete(`${API}/brands/${id}`);
      await loadBrands();
      if (activeBrandId === id) setActiveBrandId("kickstartercash");
      toast.success("OK");
    } catch (e) {
      toast.error(e?.response?.data?.detail || t("error_generic"));
    }
  };

  return (
    <div>
      <PageTitle title={t("brand_title")} subtitle={t("brand_sub")} icon={Palette} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Brand list */}
        <div className="space-y-3">
          <button
            data-testid="brand-new-btn"
            onClick={startNew}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-[#D4AF37]/40 text-[#D4AF37] rounded-md py-3.5 hover:bg-[#D4AF37]/5 transition-colors"
          >
            <Plus size={16} /> {t("brand_new")}
          </button>
          {brands.map((b) => (
            <div
              key={b.id}
              data-testid={`brand-card-${b.id}`}
              className={`rounded-md border p-4 transition-all ${activeBrandId === b.id ? "border-[#D4AF37]/60 bg-[#D4AF37]/5" : "border-white/10 bg-[#0A0A0A]"}`}
            >
              <div className="flex items-center gap-3">
                {b.logo_url
                  ? <img src={b.logo_url} alt={b.name} className="w-10 h-10 object-contain rounded" />
                  : <span className="w-10 h-10 rounded" style={{ background: b.primary_color }} />}
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">{b.name}</div>
                  {b.is_default && <div className="text-[10px] uppercase tracking-wider text-[#D4AF37]">{t("brand_default")}</div>}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {b.colors_preview}
                <span className="flex gap-1.5 items-center mr-auto">
                  {[b.primary_color, b.secondary_color, b.accent_color].map((c, i) => (
                    <span key={`${b.id}-color-${i}`} className="w-4 h-4 rounded-full border border-white/15" style={{ background: c }} />
                  ))}
                </span>
                {activeBrandId !== b.id && (
                  <button data-testid={`brand-select-${b.id}`} onClick={() => setActiveBrandId(b.id)} className="text-xs px-2.5 py-1 rounded border border-white/10 text-zinc-300 hover:border-[#D4AF37]/50">{t("brand_select")}</button>
                )}
                {activeBrandId === b.id && (
                  <span className="text-xs px-2.5 py-1 rounded bg-[#D4AF37] text-black flex items-center gap-1"><Check size={12} /> </span>
                )}
                <button data-testid={`brand-edit-${b.id}`} onClick={() => startEdit(b)} className="p-1.5 rounded border border-white/10 text-zinc-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/50"><Pencil size={13} /></button>
                {!b.is_default && (
                  <button data-testid={`brand-delete-${b.id}`} onClick={() => remove(b.id)} className="p-1.5 rounded border border-white/10 text-zinc-400 hover:text-red-400 hover:border-red-400/50"><Trash2 size={13} /></button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Editor */}
        <div className="lg:col-span-2">
          {editing ? (
            <div className="bg-[#0A0A0A] border border-white/10 rounded-md p-6 md:p-8 space-y-5 animate-fade-up" data-testid="brand-editor">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label={t("brand_name")}><Input data-testid="brand-input-name" className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
                <Field label={t("brand_slogan")}><Input data-testid="brand-input-slogan" className={inputCls} value={form.slogan} onChange={(e) => set("slogan", e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-3 gap-5">
                {["primary_color", "secondary_color", "accent_color"].map((k) => (
                  <Field key={k} label={t(k === "primary_color" ? "brand_primary" : k === "secondary_color" ? "brand_secondary" : "brand_accent")}>
                    <div className="flex items-center gap-2">
                      <input type="color" data-testid={`brand-input-${k}`} value={form[k]} onChange={(e) => set(k, e.target.value)} className="w-10 h-10 rounded border border-white/10 bg-transparent cursor-pointer" />
                      <Input className={inputCls} value={form[k]} onChange={(e) => set(k, e.target.value)} />
                    </div>
                  </Field>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label={t("brand_font_h")}><Input data-testid="brand-input-fonth" className={inputCls} value={form.font_heading} onChange={(e) => set("font_heading", e.target.value)} /></Field>
                <Field label={t("brand_font_b")}><Input data-testid="brand-input-fontb" className={inputCls} value={form.font_body} onChange={(e) => set("font_body", e.target.value)} /></Field>
              </div>
              <Field label={t("brand_tone")}><Textarea data-testid="brand-input-tone" className={inputCls} rows={2} value={form.tone} onChange={(e) => set("tone", e.target.value)} /></Field>
              <Field label={t("brand_imgstyle")}><Textarea data-testid="brand-input-imgstyle" className={inputCls} rows={2} value={form.image_style} onChange={(e) => set("image_style", e.target.value)} /></Field>
              <Field label={t("brand_logo")}><Input data-testid="brand-input-logo" className={inputCls} value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://..." /></Field>

              <div className="flex gap-3 pt-2">
                <button data-testid="brand-save-btn" disabled={saving} onClick={save} className="bg-[#D4AF37] text-black px-6 py-2.5 rounded-sm font-bold hover:bg-[#F3E5AB] transition-colors disabled:opacity-50">
                  {editing === "new" ? t("brand_save") : t("brand_update")}
                </button>
                <button data-testid="brand-cancel-btn" onClick={cancel} className="px-6 py-2.5 rounded-sm border border-white/10 text-zinc-300 hover:bg-white/5">{t("brand_cancel")}</button>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[300px] flex items-center justify-center bg-[#0A0A0A] border border-dashed border-white/10 rounded-md text-zinc-600 text-sm">
              {t("brand_new")} →
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

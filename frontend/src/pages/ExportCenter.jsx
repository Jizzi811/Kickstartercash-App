import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FolderDown, Download, Trash2, FileText, FileJson, Image as ImageIcon, Share2, PenLine, Zap, LayoutTemplate, CalendarDays } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { PageTitle } from "@/components/PageTitle";

const typeMeta = {
  campaign: { icon: Zap, label: "Kampagne" },
  social: { icon: Share2, label: "Social" },
  copy: { icon: PenLine, label: "Copy" },
  image: { icon: ImageIcon, label: "Bild" },
  landingpage: { icon: LayoutTemplate, label: "Landingpage" },
  calendar: { icon: CalendarDays, label: "Kalender" },
};

function itemToText(it) {
  if (it.type === "copy") return `${it.title}\n\n${it.body}`;
  if (it.type === "social" || it.type === "campaign") {
    const posts = (it.posts || []).map((p) => `[${p.platform}]\n${p.caption}\n${(p.hashtags || []).map((h) => "#" + h).join(" ")}\n${p.cta || ""}`).join("\n\n");
    const copy = it.copy ? `\n\n=== Werbetext ===\n${it.copy.title}\n${it.copy.body}` : "";
    return `Thema: ${it.topic}\n\n${posts}${copy}`;
  }
  if (it.type === "calendar") return (it.items || []).map((x) => `Tag ${x.day} | ${x.platform} | ${x.post_time}\n${x.title}\n${x.caption}`).join("\n\n");
  if (it.type === "landingpage") {
    const c = it.content || {};
    return `${c.headline}\n${c.subtitle}\n\nCTA: ${c.cta}`;
  }
  return JSON.stringify(it, null, 2);
}

function download(name, content, type) {
  const blob = new Blob([content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  URL.revokeObjectURL(a.href);
}

export default function ExportCenter() {
  const { t, lang } = useApp();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    const params = { limit: 100 };
    if (filter !== "all") params.type = filter;
    const res = await axios.get(`${API}/history`, { params });
    setItems(res.data);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    await axios.delete(`${API}/history/${id}`);
    setItems((s) => s.filter((x) => x.id !== id));
    toast.success("OK");
  };

  const exportImage = (it) => {
    const a = document.createElement("a");
    a.href = it.image; a.download = `image-${it.id}.png`; a.click();
  };

  const title = (it) => it.topic || it.prompt || (it.content?.headline) || it.type;

  return (
    <div>
      <PageTitle title={t("export_title")} subtitle={t("export_sub")} icon={FolderDown} />

      <div className="flex flex-wrap gap-2 mb-6">
        {["all", "campaign", "social", "copy", "image", "landingpage", "calendar"].map((f) => (
          <button key={f} data-testid={`export-filter-${f}`} onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-sm text-sm border transition-all ${filter === f ? "bg-[#D4AF37] text-black border-[#D4AF37] font-semibold" : "border-white/10 text-zinc-400 hover:border-[#D4AF37]/40"}`}>
            {f === "all" ? t("filter_all") : (typeMeta[f]?.label || f)}
          </button>
        ))}
      </div>

      {items.length === 0 && <p className="text-center text-zinc-600 text-sm py-10">{t("export_empty")}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => {
          const Meta = typeMeta[it.type] || { icon: FileText, label: it.type };
          const Icon = Meta.icon;
          return (
            <div key={it.id} data-testid={`export-item-${it.id}`} className="bg-[#0A0A0A] border border-white/10 rounded-md p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-sm bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]"><Icon size={15} /></span>
                <span className="text-[10px] tracking-[0.15em] uppercase text-[#D4AF37]/80">{Meta.label}</span>
                <span className="text-[10px] text-zinc-600 ml-auto">{(it.created_at || "").slice(0, 10)}</span>
              </div>
              {it.type === "image" && it.image && (
                <img src={it.image} alt="" className="w-full h-32 object-cover rounded-sm mb-3" />
              )}
              <p className="text-sm text-white font-medium line-clamp-2 mb-3 flex-1">{title(it)}</p>
              <div className="flex flex-wrap gap-2">
                {it.type === "image" ? (
                  <button data-testid={`export-png-${it.id}`} onClick={() => exportImage(it)} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-sm border border-white/10 text-zinc-300 hover:border-[#D4AF37]/50 hover:text-[#D4AF37]">
                    <Download size={13} /> PNG
                  </button>
                ) : (
                  <button data-testid={`export-txt-${it.id}`} onClick={() => download(`${it.type}-${it.id}.txt`, itemToText(it), "text/plain")} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-sm border border-white/10 text-zinc-300 hover:border-[#D4AF37]/50 hover:text-[#D4AF37]">
                    <FileText size={13} /> {t("export_txt")}
                  </button>
                )}
                <button data-testid={`export-json-${it.id}`} onClick={() => download(`${it.type}-${it.id}.json`, JSON.stringify(it, null, 2), "application/json")} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-sm border border-white/10 text-zinc-300 hover:border-[#D4AF37]/50 hover:text-[#D4AF37]">
                  <FileJson size={13} /> {t("export_json")}
                </button>
                <button data-testid={`export-delete-${it.id}`} onClick={() => remove(it.id)} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-sm border border-white/10 text-zinc-400 hover:border-red-400/50 hover:text-red-400 ml-auto">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

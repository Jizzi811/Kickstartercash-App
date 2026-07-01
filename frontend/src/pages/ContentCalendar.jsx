import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CalendarDays, Loader2, Clock } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { PageTitle } from "@/components/PageTitle";
import { CopyButton } from "@/components/CopyButton";
import { SOCIAL_PLATFORMS } from "@/i18n";
import { Textarea } from "@/components/ui/textarea";

const platformColor = (p) => {
  const map = { Instagram: "#E1306C", Facebook: "#1877F2", TikTok: "#69C9D0", X: "#fff", LinkedIn: "#0A66C2", Pinterest: "#E60023", Threads: "#aaa" };
  return map[p] || "#7C3AED";
};

export default function ContentCalendar() {
  const { t, lang, model, activeBrandId, activeBrand } = useApp();
  const [topic, setTopic] = useState("");
  const [days, setDays] = useState(30);
  const [selected, setSelected] = useState(["Instagram", "Facebook", "LinkedIn"]);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const toggle = (p) => setSelected((s) => s.includes(p) ? s.filter((x) => x !== p) : [...s, p]);

  const generate = async () => {
    if (!topic.trim()) { toast.error(t("topic")); return; }
    if (selected.length === 0) { toast.error(t("platforms")); return; }
    setLoading(true); setItems([]);
    try {
      const res = await axios.post(`${API}/generate/calendar`, {
        topic, days, platforms: selected, brand_id: activeBrandId, model, language: lang,
      });
      setItems(res.data.items || []);
      if (!res.data.items?.length) toast.error(t("error_generic"));
    } catch (e) {
      toast.error(t("error_generic"));
    } finally { setLoading(false); }
  };

  const exportAll = () => {
    const txt = items.map((it) => `${t("day")} ${it.day} | ${it.platform} | ${it.post_time}\n${it.title}\n${it.caption}\n${(it.hashtags || []).map((h) => "#" + h).join(" ")}`).join("\n\n———\n\n");
    const blob = new Blob([txt], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "content-kalender.txt"; a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      <PageTitle title={t("calendar_title")} subtitle={t("calendar_sub")} icon={CalendarDays} />

      <div className="bg-[#0A0A0A] border border-white/10 rounded-md p-6 md:p-7 space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs tracking-[0.12em] uppercase text-zinc-500">{t("topic")}</label>
          <Textarea data-testid="calendar-topic-input" rows={2} value={topic} onChange={(e) => setTopic(e.target.value)}
            placeholder={t("topic_ph")} className="bg-black/40 border-white/10 focus:border-[#7C3AED] focus-visible:ring-[#7C3AED]/40 text-white" />
        </div>
        <div className="flex flex-wrap gap-6">
          <div>
            <label className="text-xs tracking-[0.12em] uppercase text-zinc-500">{t("duration")}</label>
            <div className="flex gap-2 mt-2">
              {[30, 60, 90].map((d) => (
                <button key={d} data-testid={`calendar-days-${d}`} onClick={() => setDays(d)}
                  className={`px-4 py-1.5 rounded-sm text-sm border transition-all ${days === d ? "bg-[#7C3AED] text-white border-[#7C3AED] font-semibold" : "border-white/10 text-zinc-400 hover:border-[#7C3AED]/40"}`}>
                  {d} {t("day")}e
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 min-w-[240px]">
            <label className="text-xs tracking-[0.12em] uppercase text-zinc-500">{t("platforms")}</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {SOCIAL_PLATFORMS.map((p) => (
                <button key={p} data-testid={`calendar-platform-${p}`} onClick={() => toggle(p)}
                  className={`px-3 py-1.5 rounded-sm text-sm border transition-all ${selected.includes(p) ? "bg-[#7C3AED] text-white border-[#7C3AED] font-semibold" : "border-white/10 text-zinc-400 hover:border-[#7C3AED]/40"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className="text-xs text-zinc-500">{t("activeBrand")}: <span className="text-[#7C3AED]">{activeBrand?.name}</span></span>
          <button data-testid="calendar-generate-btn" disabled={loading} onClick={generate}
            className="inline-flex items-center gap-2 bg-[#7C3AED] text-white px-7 py-2.5 rounded-sm font-bold hover:bg-[#C4B5FD] transition-colors disabled:opacity-60">
            {loading ? <><Loader2 size={16} className="animate-spin" /> {t("generating")}</> : t("generate")}
          </button>
        </div>
      </div>

      {loading && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">{[...Array(6)].map((_, i) => <div key={i} className="h-40 rounded-md shimmer" />)}</div>}
      {!loading && items.length === 0 && <p className="text-center text-zinc-600 text-sm py-10">{t("empty_hint")}</p>}

      {!loading && items.length > 0 && (
        <div className="mt-8" data-testid="calendar-result">
          <div className="flex justify-end mb-4">
            <CopyButton testid="calendar-export-txt" text={items.map((it) => `Tag ${it.day} | ${it.platform} | ${it.post_time}\n${it.title}\n${it.caption}`).join("\n\n")} label={t("export_txt")} copiedLabel={t("copied")} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((it, i) => (
              <motion.div key={`${it.day}-${it.platform}-${i}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                data-testid={`calendar-item-${i}`}
                className="bg-[#0A0A0A] border border-white/10 rounded-md p-4 hover:border-[#7C3AED]/40 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-zinc-500">{t("day")} {it.day}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: platformColor(it.platform), background: "rgba(255,255,255,0.05)" }}>{it.platform}</span>
                </div>
                <h3 className="text-white text-sm font-medium mb-1.5">{it.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{it.caption}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(it.hashtags || []).slice(0, 4).map((h, j) => <span key={`${h}-${j}`} className="text-[10px] text-[#7C3AED]/80 bg-[#7C3AED]/10 px-1.5 py-0.5 rounded">#{h}</span>)}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500"><Clock size={12} /> {it.post_time}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

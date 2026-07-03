import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Zap, Loader2, Download, Megaphone, ImageIcon } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { PageTitle } from "@/components/PageTitle";
import { CopyButton } from "@/components/CopyButton";
import { SOCIAL_PLATFORMS, IMAGE_STYLES } from "@/i18n";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export default function Campaign() {
  const { t, lang, model, activeBrandId, activeBrand } = useApp();
  const [topic, setTopic] = useState("");
  const [selected, setSelected] = useState(["Instagram", "Facebook", "LinkedIn"]);
  const [style, setStyle] = useState("Luxuriös");
  const [applyLogo, setApplyLogo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const toggle = (p) => setSelected((s) => s.includes(p) ? s.filter((x) => x !== p) : [...s, p]);

  const generate = async () => {
    if (!topic.trim()) { toast.error(t("topic")); return; }
    setLoading(true); setResult(null);
    try {
      const res = await axios.post(`${API}/generate/campaign`, {
        topic, platforms: selected, brand_id: activeBrandId, model, language: lang,
        apply_logo: applyLogo, image_style: style,
      });
      setResult(res.data);
    } catch (e) {
      toast.error(t("error_generic"));
    } finally { setLoading(false); }
  };

  const downloadImg = () => {
    if (!result?.image) return;
    const a = document.createElement("a");
    a.href = result.image; a.download = `campaign-${Date.now()}.png`; a.click();
  };

  return (
    <div>
      <PageTitle title={t("campaign_title")} subtitle={t("campaign_sub")} icon={Zap} />

      <div className="bg-[#0A0A0A] border border-[#7C3AED]/30 rounded-md p-6 md:p-7 space-y-5 gold-glow">
        <div className="space-y-1.5">
          <label className="text-xs tracking-[0.12em] uppercase text-zinc-500">{t("topic")}</label>
          <Textarea
            data-testid="campaign-topic-input"
            rows={2}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t("topic_ph")}
            className="bg-black/40 border-white/10 focus:border-[#7C3AED] focus-visible:ring-[#7C3AED]/40 text-white"
          />
        </div>
        <div>
          <label className="text-xs tracking-[0.12em] uppercase text-zinc-500">{t("platforms")}</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {SOCIAL_PLATFORMS.map((p) => (
              <button key={p} data-testid={`campaign-platform-${p}`} onClick={() => toggle(p)}
                className={`px-3.5 py-1.5 rounded-sm text-sm border transition-all ${selected.includes(p) ? "bg-[#7C3AED] text-white border-[#7C3AED] font-semibold" : "border-white/10 text-zinc-400 hover:border-[#7C3AED]/40"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs tracking-[0.12em] uppercase text-zinc-500">{t("style")}</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {IMAGE_STYLES.slice(0, 8).map((s) => (
              <button key={s} data-testid={`campaign-style-${s}`} onClick={() => setStyle(s)}
                className={`px-3 py-1.5 rounded-sm text-sm border transition-all ${style === s ? "bg-[#7C3AED] text-white border-[#7C3AED] font-semibold" : "border-white/10 text-zinc-400 hover:border-[#7C3AED]/40"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 pt-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Switch data-testid="campaign-logo-switch" checked={applyLogo} onCheckedChange={setApplyLogo} />
            <span className="text-sm text-zinc-300">{t("apply_logo")}</span>
            <span className="text-xs text-zinc-600 ml-2">{t("activeBrand")}: <span className="text-[#7C3AED]">{activeBrand?.name}</span></span>
          </div>
          <button data-testid="campaign-generate-btn" disabled={loading} onClick={generate}
            className="inline-flex items-center gap-2 bg-[#7C3AED] text-white px-7 py-2.5 rounded-sm font-bold hover:bg-[#C4B5FD] transition-colors disabled:opacity-60">
            {loading ? <><Loader2 size={16} className="animate-spin" /> {t("generating")}</> : t("campaign_btn")}
          </button>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-8">
          {[0, 1, 2].map((i) => <div key={i} className="h-64 rounded-md shimmer" />)}
        </div>
      )}

      {!loading && result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-8" data-testid="campaign-result">
          {/* Image */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0A0A0A] border border-white/10 rounded-md p-4 flex flex-col">
            <div className="text-xs tracking-[0.12em] uppercase text-[#7C3AED] mb-3 flex items-center gap-1.5"><ImageIcon size={13} /> {t("campaign_image")}</div>
            <div className="flex-1 flex items-center justify-center min-h-[220px] rounded-sm bg-black/40 overflow-hidden">
              {result.image
                ? <img data-testid="campaign-image" src={result.image} alt="brand" className="w-full h-full object-contain" />
                : result.image_error
                  ? <span className="text-red-400/80 text-xs p-3 text-center break-words">{result.image_error}</span>
                  : <span className="text-zinc-700 text-sm">—</span>}
            </div>
            {result.image && (
              <button data-testid="campaign-image-download" onClick={downloadImg} className="mt-3 inline-flex items-center justify-center gap-2 border border-[#7C3AED]/50 text-[#7C3AED] py-2 rounded-sm hover:bg-[#7C3AED]/10 text-sm">
                <Download size={14} /> {t("download")}
              </button>
            )}
          </motion.div>

          {/* Copy */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="bg-[#0A0A0A] border border-white/10 rounded-md p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs tracking-[0.12em] uppercase text-[#7C3AED] flex items-center gap-1.5"><Megaphone size={13} /> {t("campaign_copy")}</span>
              <CopyButton testid="campaign-copy-copy" text={`${result.copy?.title}\n\n${result.copy?.body}`} label={t("copy")} copiedLabel={t("copied")} />
            </div>
            <h3 className="font-display text-lg text-white mb-2">{result.copy?.title}</h3>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{result.copy?.body}</p>
          </motion.div>

          {/* Posts */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="bg-[#0A0A0A] border border-white/10 rounded-md p-5">
            <div className="text-xs tracking-[0.12em] uppercase text-[#7C3AED] mb-3">{t("campaign_posts")}</div>
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {(result.posts || []).map((p, i) => (
                <div key={`${p.platform}-${i}`} className="border-b border-white/5 pb-3 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-[#7C3AED]">{p.platform}</span>
                    <CopyButton testid={`campaign-post-copy-${p.platform}`} text={`${p.caption}\n\n${(p.hashtags || []).map((h) => "#" + h).join(" ")}`} label="" copiedLabel={t("copied")} />
                  </div>
                  <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">{p.caption}</p>
                  {p.hashtags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.hashtags.slice(0, 6).map((h, j) => <span key={`${h}-${j}`} className="text-[10px] text-[#7C3AED]/80 bg-[#7C3AED]/10 px-1.5 py-0.5 rounded">#{h}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {!loading && !result && <p className="text-center text-zinc-600 text-sm py-10">{t("empty_hint")}</p>}
    </div>
  );
}

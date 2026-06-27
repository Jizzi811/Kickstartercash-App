import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Image as ImageIcon, Loader2, Download, Stamp } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { PageTitle } from "@/components/PageTitle";
import { IMAGE_STYLES } from "@/i18n";
import { Textarea } from "@/components/ui/textarea";

export default function ImageGenerator() {
  const { t, lang, activeBrandId, activeBrand } = useApp();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Luxuriös");
  const [ratio, setRatio] = useState("1:1");
  const [applyLogo, setApplyLogo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);

  const generate = async () => {
    if (!prompt.trim()) { toast.error(t("topic")); return; }
    setLoading(true); setImage(null);
    try {
      const res = await axios.post(`${API}/generate/image`, {
        prompt, style, brand_id: activeBrandId, language: lang, apply_logo: applyLogo, size: ratio,
      });
      setImage(res.data.image);
    } catch (e) {
      toast.error(e?.response?.data?.detail || t("error_generic"));
    } finally { setLoading(false); }
  };

  const download = () => {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image;
    a.download = `kickstartercash-${Date.now()}.png`;
    a.click();
  };

  return (
    <div>
      <PageTitle title={t("image_title")} subtitle={t("image_sub")} icon={ImageIcon} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0A0A0A] border border-white/10 rounded-md p-6 md:p-7 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs tracking-[0.12em] uppercase text-zinc-500">{t("topic")}</label>
            <Textarea
              data-testid="image-prompt-input"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t("img_prompt_ph")}
              className="bg-black/40 border-white/10 focus:border-[#D4AF37] focus-visible:ring-[#D4AF37]/40 text-white"
            />
          </div>
          <div>
            <label className="text-xs tracking-[0.12em] uppercase text-zinc-500">{t("style")}</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {IMAGE_STYLES.map((s) => (
                <button
                  key={s}
                  data-testid={`style-${s}`}
                  onClick={() => setStyle(s)}
                  className={`px-3.5 py-1.5 rounded-sm text-sm border transition-all ${style === s ? "bg-[#D4AF37] text-black border-[#D4AF37] font-semibold" : "border-white/10 text-zinc-400 hover:border-[#D4AF37]/40"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs tracking-[0.12em] uppercase text-zinc-500">{t("aspect_ratio")}</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                { v: "1:1", label: "1:1", desc: t("ratio_square") },
                { v: "16:9", label: "16:9", desc: t("ratio_landscape") },
                { v: "9:16", label: "9:16", desc: t("ratio_portrait") },
              ].map((r) => (
                <button
                  key={r.v}
                  data-testid={`ratio-${r.v.replace(":", "x")}`}
                  onClick={() => setRatio(r.v)}
                  className={`px-3.5 py-1.5 rounded-sm text-sm border transition-all ${ratio === r.v ? "bg-[#D4AF37] text-black border-[#D4AF37] font-semibold" : "border-white/10 text-zinc-400 hover:border-[#D4AF37]/40"}`}
                >
                  {r.label} <span className="opacity-60 text-xs">· {r.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-xs text-zinc-500">Nano Banana · Gemini 2.5 Flash</span>
            <button
              data-testid="image-apply-logo-toggle"
              onClick={() => setApplyLogo((v) => !v)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs border transition-all ${applyLogo ? "bg-[#D4AF37] text-black border-[#D4AF37] font-semibold" : "border-white/10 text-zinc-400 hover:border-[#D4AF37]/40"}`}
            >
              <Stamp size={13} /> {t("image_apply_logo")}
            </button>
          </div>
          <button
            data-testid="image-generate-btn"
            disabled={loading}
            onClick={generate}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#D4AF37] text-black px-7 py-3 rounded-sm font-bold hover:bg-[#F3E5AB] transition-colors disabled:opacity-60"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> {t("generating")}</> : t("generate")}
          </button>
          <p className="text-xs text-zinc-600">{t("activeBrand")}: <span className="text-[#D4AF37]">{activeBrand?.name}</span></p>
        </div>

        {/* Output */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-md p-4 flex flex-col">
          <div className="flex-1 flex items-center justify-center min-h-[340px] rounded-sm bg-black/40 overflow-hidden">
            {loading && <div className="w-full h-[340px] shimmer rounded-sm" />}
            {!loading && image && (
              <motion.img
                data-testid="generated-image"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                src={image}
                alt="Generated"
                className="w-full h-full object-contain rounded-sm"
              />
            )}
            {!loading && !image && <span className="text-zinc-700 text-sm">{t("empty_hint")}</span>}
          </div>
          {image && (
            <button
              data-testid="image-download-btn"
              onClick={download}
              className="mt-4 inline-flex items-center justify-center gap-2 border border-[#D4AF37]/50 text-[#D4AF37] py-2.5 rounded-sm hover:bg-[#D4AF37]/10 transition-colors"
            >
              <Download size={16} /> {t("download")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

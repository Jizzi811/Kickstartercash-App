import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { PenLine, Loader2 } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { PageTitle } from "@/components/PageTitle";
import { CopyButton } from "@/components/CopyButton";
import { COPY_FORMATS } from "@/i18n";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function Copywriter() {
  const { t, lang, model, activeBrandId, activeBrand } = useApp();
  const formats = COPY_FORMATS[lang];
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState(formats[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async () => {
    if (!topic.trim()) { toast.error(t("topic")); return; }
    setLoading(true); setResult(null);
    try {
      const res = await axios.post(`${API}/generate/copy`, {
        topic, format, brand_id: activeBrandId, model, language: lang,
      });
      setResult(res.data);
    } catch (e) {
      toast.error(t("error_generic"));
    } finally { setLoading(false); }
  };

  return (
    <div>
      <PageTitle title={t("copy_title")} subtitle={t("copy_sub")} icon={PenLine} />

      <div className="bg-[#0A0A0A] border border-white/10 rounded-md p-6 md:p-7 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs tracking-[0.12em] uppercase text-zinc-500">{t("topic")}</label>
            <Textarea
              data-testid="copy-topic-input"
              rows={2}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t("topic_ph")}
              className="bg-black/40 border-white/10 focus:border-[#D4AF37] focus-visible:ring-[#D4AF37]/40 text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs tracking-[0.12em] uppercase text-zinc-500">{t("format")}</label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger data-testid="copy-format-select" className="bg-black/40 border-white/10 text-white focus:ring-[#D4AF37]/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0A0A] border-white/10 text-white">
                {formats.map((f) => (
                  <SelectItem key={f} value={f} className="focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]">{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className="text-xs text-zinc-500">{t("activeBrand")}: <span className="text-[#D4AF37]">{activeBrand?.name}</span></span>
          <button
            data-testid="copy-generate-btn"
            disabled={loading}
            onClick={generate}
            className="inline-flex items-center gap-2 bg-[#D4AF37] text-black px-7 py-2.5 rounded-sm font-bold hover:bg-[#F3E5AB] transition-colors disabled:opacity-60"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> {t("generating")}</> : t("generate")}
          </button>
        </div>
      </div>

      <div className="mt-8">
        {loading && <div className="h-64 rounded-md shimmer" />}
        {!loading && !result && <p className="text-center text-zinc-600 text-sm py-10">{t("empty_hint")}</p>}
        {!loading && result && (
          <motion.div
            data-testid="copy-result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0A0A0A] border border-white/10 rounded-md p-6 md:p-8"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 className="font-display text-2xl text-white leading-snug">{result.title}</h2>
              <CopyButton testid="copy-result-copy" text={`${result.title}\n\n${result.body}`} label={t("copy")} copiedLabel={t("copied")} />
            </div>
            <p className="text-zinc-200 whitespace-pre-wrap leading-relaxed">{result.body}</p>
            {result.variants?.length > 0 && (
              <div className="mt-6 border-t border-white/10 pt-4">
                <div className="text-xs tracking-[0.12em] uppercase text-zinc-500 mb-2">{t("variants")}</div>
                <ul className="space-y-2">
                  {result.variants.map((v, i) => (
                    <li key={i} className="text-sm text-zinc-300 flex gap-2">
                      <span className="text-[#D4AF37]">→</span> {v}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

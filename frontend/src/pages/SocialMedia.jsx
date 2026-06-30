import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Share2, Loader2, Hash, Megaphone, Image as ImgIcon } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { PageTitle } from "@/components/PageTitle";
import { PageHeader } from "@/components/PageHeader";
import { CopyButton } from "@/components/CopyButton";
import { SOCIAL_PLATFORMS } from "@/i18n";
import { Textarea } from "@/components/ui/textarea";

export default function SocialMedia() {
  const { t, lang, model, activeBrandId, activeBrand } = useApp();
  const [topic, setTopic] = useState("");
  const [selected, setSelected] = useState(["Instagram", "Facebook", "LinkedIn", "TikTok"]);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);

  const toggle = (p) => setSelected((s) => s.includes(p) ? s.filter((x) => x !== p) : [...s, p]);

  const generate = async () => {
    if (!topic.trim()) { toast.error(t("topic")); return; }
    if (selected.length === 0) { toast.error(t("platforms")); return; }
    setLoading(true); setPosts([]);
    try {
      const res = await axios.post(`${API}/generate/social`, {
        topic, platforms: selected, brand_id: activeBrandId, model, language: lang,
      });
      setPosts(res.data.posts || []);
      if (!res.data.posts?.length) toast.error(t("error_generic"));
    } catch (e) {
      toast.error(t("error_generic"));
    } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader
        icon={Share2}
        color="#FBBF24"
        title={t("social_title")}
        subtitle={t("social_sub")}
        badge="Social"
      />

      <div className="bg-[#0A0A0A] border border-white/10 rounded-md p-6 md:p-7 space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs tracking-[0.12em] uppercase text-zinc-500">{t("topic")}</label>
          <Textarea
            data-testid="social-topic-input"
            rows={2}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t("topic_ph")}
            className="bg-black/40 border-white/10 focus:border-[#D4AF37] focus-visible:ring-[#D4AF37]/40 text-white"
          />
        </div>
        <div>
          <label className="text-xs tracking-[0.12em] uppercase text-zinc-500">{t("platforms")}</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {SOCIAL_PLATFORMS.map((p) => (
              <button
                key={p}
                data-testid={`platform-${p}`}
                onClick={() => toggle(p)}
                className={`px-4 py-2 rounded-sm text-sm border transition-all ${selected.includes(p) ? "bg-[#D4AF37] text-black border-[#D4AF37] font-semibold" : "border-white/10 text-zinc-400 hover:border-[#D4AF37]/40"}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className="text-xs text-zinc-500">{t("activeBrand")}: <span className="text-[#D4AF37]">{activeBrand?.name}</span></span>
          <button
            data-testid="social-generate-btn"
            disabled={loading}
            onClick={generate}
            className="inline-flex items-center gap-2 bg-[#D4AF37] text-black px-7 py-2.5 rounded-sm font-bold hover:bg-[#F3E5AB] transition-colors disabled:opacity-60"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> {t("generating")}</> : t("generate")}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="mt-8">
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[0, 1].map((i) => <div key={i} className="h-52 rounded-md shimmer" />)}
          </div>
        )}
        {!loading && posts.length === 0 && (
          <p className="text-center text-zinc-600 text-sm py-10">{t("empty_hint")}</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {posts.map((p, i) => (
            <motion.div
              key={`${p.platform}-${i}`}
              data-testid={`social-post-${p.platform}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-[#0A0A0A] border border-white/10 rounded-md p-5 hover:border-[#D4AF37]/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-display text-lg text-[#D4AF37]">{p.platform}</span>
                <CopyButton testid={`social-copy-${p.platform}`} text={`${p.caption}\n\n${(p.hashtags || []).map((h) => "#" + h).join(" ")}\n\n${p.cta}`} label={t("copy")} copiedLabel={t("copied")} />
              </div>
              <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{p.caption}</p>
              {p.hashtags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {p.hashtags.map((h, j) => (
                    <span key={`${h}-${j}`} className="text-xs text-[#D4AF37]/80 bg-[#D4AF37]/10 px-2 py-0.5 rounded">#{h}</span>
                  ))}
                </div>
              )}
              {p.cta && (
                <div className="mt-3 flex items-start gap-2 text-sm text-zinc-300">
                  <Megaphone size={14} className="text-[#D4AF37] mt-0.5 shrink-0" /> {p.cta}
                </div>
              )}
              {p.image_idea && (
                <div className="mt-2 flex items-start gap-2 text-xs text-zinc-500">
                  <ImgIcon size={13} className="mt-0.5 shrink-0" /> {p.image_idea}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

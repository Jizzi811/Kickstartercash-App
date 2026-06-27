import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { LayoutTemplate, Loader2, Download, Check } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { PageTitle } from "@/components/PageTitle";
import { Textarea } from "@/components/ui/textarea";

function buildHtml(c, brand) {
  const gold = brand?.primary_color || "#D4AF37";
  const benefits = (c.benefits || []).map((b) => `<div class="card"><h3>${b.title}</h3><p>${b.text}</p></div>`).join("");
  const testimonials = (c.testimonials || []).map((tm) => `<div class="card"><p>"${tm.text}"</p><strong>— ${tm.name}</strong></div>`).join("");
  const faq = (c.faq || []).map((f) => `<div class="faq"><h4>${f.q}</h4><p>${f.a}</p></div>`).join("");
  const features = (c.pricing?.features || []).map((f) => `<li>${f}</li>`).join("");
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${c.seo?.title || c.headline || ""}</title>
<meta name="description" content="${c.seo?.description || ""}">
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:'Helvetica Neue',Arial,sans-serif}
body{background:#050505;color:#fff;line-height:1.6}
.wrap{max-width:1100px;margin:0 auto;padding:0 24px}
.hero{text-align:center;padding:120px 24px;background:radial-gradient(circle at 50% 0%,rgba(212,175,55,.15),#050505)}
.hero h1{font-size:48px;margin-bottom:20px;background:linear-gradient(135deg,#F3E5AB,${gold});-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero p{font-size:20px;color:#aaa;max-width:700px;margin:0 auto 32px}
.btn{display:inline-block;background:${gold};color:#000;padding:16px 40px;font-weight:700;text-decoration:none;border-radius:4px}
section{padding:80px 0}
h2{font-size:34px;text-align:center;margin-bottom:48px;color:${gold}}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px}
.card{background:#0e0e0e;border:1px solid #222;border-radius:8px;padding:28px}
.card h3{color:${gold};margin-bottom:10px}
.faq{border-bottom:1px solid #222;padding:20px 0}
.faq h4{color:#fff;margin-bottom:8px}.faq p{color:#aaa}
.pricing{max-width:420px;margin:0 auto;text-align:center;background:#0e0e0e;border:1px solid ${gold};border-radius:12px;padding:48px}
.pricing .price{font-size:48px;color:${gold};margin:16px 0}
.pricing ul{list-style:none;margin:24px 0;text-align:left}
.pricing li{padding:8px 0;border-bottom:1px solid #1a1a1a}
footer{text-align:center;padding:48px;color:#666;border-top:1px solid #222}
</style></head><body>
<div class="hero"><div class="wrap"><h1>${c.headline || ""}</h1><p>${c.subtitle || ""}</p><a class="btn" href="#">${c.cta || ""}</a></div></div>
<section class="wrap"><h2>Vorteile</h2><div class="grid">${benefits}</div></section>
<section class="wrap"><h2>Testimonials</h2><div class="grid">${testimonials}</div></section>
<section class="wrap"><h2>FAQ</h2>${faq}</section>
<section class="wrap"><div class="pricing"><h3>${c.pricing?.name || ""}</h3><div class="price">${c.pricing?.price || ""}</div><ul>${features}</ul><a class="btn" href="#">${c.pricing?.cta || c.cta || ""}</a></div></section>
<footer>${c.footer || ""}</footer>
</body></html>`;
}

export default function Landingpage() {
  const { t, lang, model, activeBrandId, activeBrand } = useApp();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState(null);

  const generate = async () => {
    if (!topic.trim()) { toast.error(t("topic")); return; }
    setLoading(true); setContent(null);
    try {
      const res = await axios.post(`${API}/generate/landingpage`, {
        topic, brand_id: activeBrandId, model, language: lang,
      });
      setContent(res.data.content);
    } catch (e) {
      toast.error(t("error_generic"));
    } finally { setLoading(false); }
  };

  const exportHtml = () => {
    const html = buildHtml(content, activeBrand);
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "landingpage.html"; a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      <PageTitle title={t("landing_title")} subtitle={t("landing_sub")} icon={LayoutTemplate} />

      <div className="bg-[#0A0A0A] border border-white/10 rounded-md p-6 md:p-7 space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs tracking-[0.12em] uppercase text-zinc-500">{t("topic")}</label>
          <Textarea data-testid="landing-topic-input" rows={2} value={topic} onChange={(e) => setTopic(e.target.value)}
            placeholder={t("topic_ph")} className="bg-black/40 border-white/10 focus:border-[#D4AF37] focus-visible:ring-[#D4AF37]/40 text-white" />
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className="text-xs text-zinc-500">{t("activeBrand")}: <span className="text-[#D4AF37]">{activeBrand?.name}</span></span>
          <button data-testid="landing-generate-btn" disabled={loading} onClick={generate}
            className="inline-flex items-center gap-2 bg-[#D4AF37] text-black px-7 py-2.5 rounded-sm font-bold hover:bg-[#F3E5AB] transition-colors disabled:opacity-60">
            {loading ? <><Loader2 size={16} className="animate-spin" /> {t("generating")}</> : t("generate")}
          </button>
        </div>
      </div>

      {loading && <div className="h-96 rounded-md shimmer mt-8" />}
      {!loading && !content && <p className="text-center text-zinc-600 text-sm py-10">{t("empty_hint")}</p>}

      {!loading && content && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8" data-testid="landing-result">
          <div className="flex justify-end mb-4">
            <button data-testid="landing-export-html" onClick={exportHtml}
              className="inline-flex items-center gap-2 border border-[#D4AF37]/50 text-[#D4AF37] px-5 py-2.5 rounded-sm hover:bg-[#D4AF37]/10">
              <Download size={16} /> {t("landing_export_html")}
            </button>
          </div>

          {/* Live preview */}
          <div className="rounded-md overflow-hidden border border-white/10">
            <div className="text-center py-16 px-6" style={{ background: "radial-gradient(circle at 50% 0%, rgba(212,175,55,0.15), #050505)" }}>
              <h1 className="font-display text-3xl md:text-5xl gold-text font-light mb-4">{content.headline}</h1>
              <p className="text-zinc-400 max-w-2xl mx-auto mb-6">{content.subtitle}</p>
              <span className="inline-block bg-[#D4AF37] text-black px-7 py-3 rounded-sm font-bold">{content.cta}</span>
            </div>

            <div className="bg-[#0A0A0A] p-6 md:p-10 space-y-10">
              <div>
                <h2 className="font-display text-2xl text-[#D4AF37] mb-5 text-center">{t("benefits")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(content.benefits || []).map((b, i) => (
                    <div key={`benefit-${b.title || i}`} className="bg-black/40 border border-white/10 rounded-md p-5">
                      <h3 className="text-white font-semibold mb-2">{b.title}</h3>
                      <p className="text-sm text-zinc-400">{b.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {content.testimonials?.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl text-[#D4AF37] mb-5 text-center">{t("testimonials")}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {content.testimonials.map((tm, i) => (
                      <div key={`tm-${tm.name || i}`} className="bg-black/40 border border-white/10 rounded-md p-5">
                        <p className="text-sm text-zinc-300 italic">"{tm.text}"</p>
                        <p className="text-xs text-[#D4AF37] mt-2">— {tm.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {content.faq?.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl text-[#D4AF37] mb-5 text-center">{t("faq")}</h2>
                  <div className="max-w-2xl mx-auto divide-y divide-white/10">
                    {content.faq.map((f, i) => (
                      <div key={`faq-${f.q || i}`} className="py-4">
                        <h4 className="text-white font-medium mb-1">{f.q}</h4>
                        <p className="text-sm text-zinc-400">{f.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {content.pricing && (
                <div className="max-w-md mx-auto bg-black/40 border border-[#D4AF37]/40 rounded-md p-8 text-center">
                  <h3 className="text-white text-lg">{content.pricing.name}</h3>
                  <div className="text-4xl text-[#D4AF37] font-display my-3">{content.pricing.price}</div>
                  <ul className="text-left space-y-2 my-5">
                    {(content.pricing.features || []).map((f, i) => (
                      <li key={`feat-${i}-${f.slice(0, 16)}`} className="flex items-start gap-2 text-sm text-zinc-300"><Check size={15} className="text-[#D4AF37] mt-0.5 shrink-0" /> {f}</li>
                    ))}
                  </ul>
                  <span className="inline-block bg-[#D4AF37] text-black px-6 py-2.5 rounded-sm font-bold">{content.pricing.cta || content.cta}</span>
                </div>
              )}

              {content.seo && (
                <div className="border-t border-white/10 pt-5">
                  <div className="text-xs tracking-[0.12em] uppercase text-zinc-500 mb-2">{t("seo")}</div>
                  <p className="text-sm text-zinc-300"><strong className="text-white">{content.seo.title}</strong></p>
                  <p className="text-sm text-zinc-500 mt-1">{content.seo.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(content.seo.keywords || []).map((k, i) => <span key={`kw-${i}-${k}`} className="text-[10px] text-[#D4AF37]/80 bg-[#D4AF37]/10 px-2 py-0.5 rounded">{k}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

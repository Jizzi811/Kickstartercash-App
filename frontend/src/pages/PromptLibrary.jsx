import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Search, BookOpen } from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { PageTitle } from "@/components/PageTitle";
import { CopyButton } from "@/components/CopyButton";
import { Input } from "@/components/ui/input";

export default function PromptLibrary() {
  const { t, lang } = useApp();
  const [categories, setCategories] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [active, setActive] = useState("Alle");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const params = {};
    if (active !== "Alle") params.category = active;
    if (q.trim()) params.q = q.trim();
    const res = await axios.get(`${API}/prompts`, { params });
    setCategories(res.data.categories);
    setPrompts(res.data.prompts);
  }, [active, q]);

  useEffect(() => {
    const id = setTimeout(load, 250);
    return () => clearTimeout(id);
  }, [load]);

  return (
    <div>
      <PageTitle title={t("prompts_title")} subtitle={t("prompts_sub")} icon={BookOpen} />

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="relative md:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            data-testid="prompt-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search")}
            className="pl-9 bg-black/40 border-white/10 focus:border-[#7C3AED] focus-visible:ring-[#7C3AED]/40 text-white"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["Alle", ...categories].map((c) => (
            <button
              key={c}
              data-testid={`prompt-cat-${c}`}
              onClick={() => setActive(c)}
              className={`px-3.5 py-1.5 rounded-sm text-sm border transition-all ${active === c ? "bg-[#7C3AED] text-white border-[#7C3AED] font-semibold" : "border-white/10 text-zinc-400 hover:border-[#7C3AED]/40"}`}
            >
              {c === "Alle" ? t("all") : c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {prompts.map((p) => {
          const title = lang === "DE" ? p.title_de : p.title_en;
          const text = lang === "DE" ? p.prompt_de : p.prompt_en;
          return (
            <div
              key={p.id}
              data-testid={`prompt-card-${p.id}`}
              className="bg-[#0A0A0A] border border-white/10 rounded-md p-5 hover:border-[#7C3AED]/40 transition-colors flex flex-col"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] tracking-[0.15em] uppercase text-[#7C3AED]/80 bg-[#7C3AED]/10 px-2 py-0.5 rounded">{p.category}</span>
              </div>
              <h3 className="font-display text-lg text-white mb-2">{title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed flex-1">{text}</p>
              <div className="mt-4">
                <CopyButton testid={`prompt-copy-${p.id}`} text={text} label={t("copy")} copiedLabel={t("copied")} />
              </div>
            </div>
          );
        })}
      </div>
      {prompts.length === 0 && <p className="text-center text-zinc-600 text-sm py-10">—</p>}
    </div>
  );
}

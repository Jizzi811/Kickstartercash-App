import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Database, Plus, Search, Trash2, Edit3, X, Check, Tag,
  BookOpen, FileText, Palette, Megaphone, ShoppingBag, CreditCard,
  HelpCircle, BarChart2, Bot, ChevronRight, Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useApp } from "@/context/AppContext";
import { API } from "@/context/AppContext";

const CATEGORY_META = {
  "Produkte":              { icon: ShoppingBag,  color: "#7C3AED" },
  "Exclusive Cards":       { icon: CreditCard,   color: "#C084FC" },
  "FAQs":                  { icon: HelpCircle,   color: "#60A5FA" },
  "PDFs & Schulung":       { icon: FileText,     color: "#34D399" },
  "Corporate Design":      { icon: Palette,      color: "#F472B6" },
  "Texte & Landingpages":  { icon: BookOpen,     color: "#FBBF24" },
  "Blogartikel":           { icon: Megaphone,    color: "#FB923C" },
  "Marketingstrategien":   { icon: BarChart2,    color: "#A78BFA" },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_META);

function EntryModal({ entry, categories, onSave, onClose }) {
  const [form, setForm] = useState(
    entry
      ? { category: entry.category, title: entry.title, content: entry.content, tags: entry.tags.join(", ") }
      : { category: categories[0], title: "", content: "", tags: "" }
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    onSave({
      category: form.category,
      title: form.title.trim(),
      content: form.content.trim(),
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-sm shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h3 className="text-sm font-semibold text-white">
            {entry ? "Eintrag bearbeiten" : "Neuer Eintrag"}
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Kategorie</label>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="w-full bg-black border border-white/10 rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7C3AED]/50"
            >
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Titel</label>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="z.B. Brandmind Produkt-Übersicht"
              className="w-full bg-black border border-white/10 rounded-sm px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#7C3AED]/50"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Inhalt / Wissen</label>
            <textarea
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              rows={7}
              placeholder="Füge hier den vollständigen Text, die Beschreibung, FAQ-Antwort, etc. ein..."
              className="w-full bg-black border border-white/10 rounded-sm px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#7C3AED]/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Tags (kommagetrennt)</label>
            <input
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="z.B. produkt, preis, provision"
              className="w-full bg-black border border-white/10 rounded-sm px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#7C3AED]/50"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-white/8">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={!form.title.trim() || !form.content.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-[#7C3AED] text-white text-sm font-semibold rounded-sm hover:bg-[#C4B5FD] transition-colors disabled:opacity-40"
          >
            <Check size={14} /> Speichern
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function KnowledgeBase() {
  const { model } = useApp();
  const [entries, setEntries] = useState([]);
  const [categories, setCategories] = useState(ALL_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState("Alle");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "new" | entry-object
  const [deleteId, setDeleteId] = useState(null);

  // AI Search
  const [aiQuery, setAiQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState(null);
  const [aiSources, setAiSources] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/knowledge`, {
        params: { category: activeCategory === "Alle" ? undefined : activeCategory, q: q || undefined },
      });
      setEntries(res.data.entries);
      setCategories(res.data.categories);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [activeCategory, q]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data) => {
    if (modal && modal.id) {
      await axios.put(`${API}/knowledge/${modal.id}`, data);
    } else {
      await axios.post(`${API}/knowledge`, data);
    }
    setModal(null);
    load();
  };

  const handleDelete = async (id) => {
    await axios.delete(`${API}/knowledge/${id}`);
    setDeleteId(null);
    load();
  };

  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiAnswer(null);
    try {
      const res = await axios.post(`${API}/knowledge/search`, { query: aiQuery, model });
      setAiAnswer(res.data.answer);
      setAiSources(res.data.sources);
    } catch {
      setAiAnswer("Fehler beim Abrufen der Antwort.");
    } finally {
      setAiLoading(false);
    }
  };

  const filtered = entries;
  const countByCategory = ALL_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = entries.filter((e) => e.category === cat).length;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          icon={Database}
          color="#60A5FA"
          title="Brandmind Wissensdatenbank"
          subtitle="Alles, was Brandmind über deine Marke wissen muss — kein Halluzinieren, nur echtes Wissen."
          badge="Knowledge"
        />
        <button
          onClick={() => setModal("new")}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7C3AED] text-white text-sm font-semibold rounded-sm hover:bg-[#C4B5FD] transition-colors whitespace-nowrap flex-shrink-0 mt-1"
        >
          <Plus size={15} /> Eintrag hinzufügen
        </button>
      </div>

      {/* Category Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ALL_CATEGORIES.map((cat) => {
          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          const count = countByCategory[cat] || 0;
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(isActive ? "Alle" : cat)}
              className={`flex items-center gap-3 p-3 rounded-sm border text-left transition-all ${
                isActive
                  ? "border-opacity-60"
                  : "border-white/8 bg-[#0A0A0A] hover:border-white/20"
              }`}
              style={isActive ? { borderColor: meta.color, backgroundColor: `${meta.color}12` } : {}}
            >
              <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${meta.color}20` }}>
                <Icon size={15} style={{ color: meta.color }} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-zinc-300 truncate">{cat}</div>
                <div className="text-[11px] text-zinc-600">{count} {count === 1 ? "Eintrag" : "Einträge"}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* AI Search Panel */}
      <div className="bg-[#0A0A0A] border border-[#7C3AED]/20 rounded-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Bot size={16} className="text-[#7C3AED]" />
          <span className="text-sm font-semibold text-[#7C3AED]">Brandmind fragen</span>
          <span className="text-[10px] text-zinc-600 ml-1">— antwortet nur aus deiner Wissensdatenbank</span>
        </div>
        <div className="flex gap-2">
          <input
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAiSearch()}
            placeholder="z.B. Was kostet die Exclusive Card? Wie hoch ist die Provision?"
            className="flex-1 bg-black border border-white/10 rounded-sm px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#7C3AED]/40"
          />
          <button
            onClick={handleAiSearch}
            disabled={aiLoading || !aiQuery.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED]/10 border border-[#7C3AED]/30 text-[#7C3AED] text-sm rounded-sm hover:bg-[#7C3AED]/20 transition-colors disabled:opacity-40"
          >
            {aiLoading ? <Loader2 size={15} className="animate-spin" /> : <Bot size={15} />}
            Fragen
          </button>
        </div>

        {(aiAnswer || aiLoading) && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-black/40 border border-white/8 rounded-sm"
          >
            {aiLoading ? (
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <Loader2 size={14} className="animate-spin text-[#7C3AED]" />
                Brandmind durchsucht die Wissensdatenbank…
              </div>
            ) : (
              <>
                <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{aiAnswer}</p>
                {aiSources.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-[11px] text-zinc-600">Quellen:</span>
                    {aiSources.map((s, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 bg-white/5 border border-white/8 rounded-full text-zinc-400">
                        {s.category} · {s.title}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Filter & Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Einträge durchsuchen…"
            className="w-full bg-[#0A0A0A] border border-white/10 rounded-sm pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#7C3AED]/40"
          />
        </div>
        {activeCategory !== "Alle" && (
          <button
            onClick={() => setActiveCategory("Alle")}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-zinc-400 border border-white/10 rounded-sm hover:text-white"
          >
            <X size={12} /> {activeCategory}
          </button>
        )}
        <span className="ml-auto text-xs text-zinc-600">
          {filtered.length} {filtered.length === 1 ? "Eintrag" : "Einträge"}
        </span>
      </div>

      {/* Entry List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin text-[#7C3AED]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-600 text-sm">
          <Database size={32} className="mx-auto mb-3 opacity-30" />
          Noch keine Einträge. Klicke „Eintrag hinzufügen" um zu starten.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((entry) => {
            const meta = CATEGORY_META[entry.category] || { icon: FileText, color: "#7C3AED" };
            const Icon = meta.icon;
            return (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-[#0A0A0A] border border-white/8 rounded-sm p-5 hover:border-white/15 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: `${meta.color}18` }}>
                    <Icon size={14} style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest" style={{ color: meta.color }}>
                          {entry.category}
                        </span>
                        <h3 className="text-sm font-semibold text-white mt-0.5 leading-snug">{entry.title}</h3>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => setModal(entry)}
                          className="p-1.5 text-zinc-600 hover:text-white transition-colors"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteId(entry.id)}
                          className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2 leading-relaxed line-clamp-3">{entry.content}</p>
                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {entry.tags.map((tag) => (
                          <span key={tag} className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-white/5 border border-white/8 rounded-full text-zinc-500">
                            <Tag size={9} /> {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {modal && (
          <EntryModal
            entry={modal === "new" ? null : modal}
            categories={categories}
            onSave={handleSave}
            onClose={() => setModal(null)}
          />
        )}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#0A0A0A] border border-white/10 rounded-sm p-6 text-center"
            >
              <Trash2 size={24} className="text-red-400 mx-auto mb-3" />
              <p className="text-sm text-white mb-1">Eintrag löschen?</p>
              <p className="text-xs text-zinc-500 mb-5">Diese Aktion kann nicht rückgängig gemacht werden.</p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-zinc-400 border border-white/10 rounded-sm hover:text-white">
                  Abbrechen
                </button>
                <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 text-sm bg-red-500/20 text-red-400 border border-red-500/30 rounded-sm hover:bg-red-500/30">
                  Löschen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

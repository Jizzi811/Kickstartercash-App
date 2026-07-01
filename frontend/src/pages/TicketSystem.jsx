import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
  Ticket, Plus, Search, Filter, ChevronDown, X, Check,
  Clock, AlertTriangle, Zap, Circle, User, Mail, Phone,
  MessageSquare, Tag, Trash2, RefreshCw, ChevronRight,
  Headphones, ShoppingCart, Inbox,
} from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { PageHeader } from "@/components/PageHeader";

const COLOR = "#7C3AED";

const STATUS_CONFIG = {
  open:        { label: "Offen",         labelEN: "Open",        color: "#60A5FA", icon: Circle },
  in_progress: { label: "In Bearbeitung", labelEN: "In Progress", color: "#FBBF24", icon: Clock },
  resolved:    { label: "Gelöst",        labelEN: "Resolved",    color: "#34D399", icon: Check },
  closed:      { label: "Geschlossen",   labelEN: "Closed",      color: "#71717a", icon: X },
};

const PRIORITY_CONFIG = {
  low:    { label: "Niedrig",  labelEN: "Low",    color: "#71717a", icon: Circle },
  medium: { label: "Mittel",   labelEN: "Medium", color: "#60A5FA", icon: ChevronDown },
  high:   { label: "Hoch",     labelEN: "High",   color: "#FBBF24", icon: AlertTriangle },
  urgent: { label: "Dringend", labelEN: "Urgent", color: "#F87171", icon: Zap },
};

const CATEGORY_CONFIG = {
  support: { label: "Support", labelEN: "Support", icon: Headphones, color: "#60A5FA" },
  sales:   { label: "Sales",   labelEN: "Sales",   icon: ShoppingCart, color: "#34D399" },
  general: { label: "Allgemein", labelEN: "General", icon: Inbox, color: "#C084FC" },
};

function StatusBadge({ status, lang }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
      style={{ backgroundColor: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
      <Icon size={9} /> {lang === "DE" ? cfg.label : cfg.labelEN}
    </span>
  );
}

function PriorityBadge({ priority, lang }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
      style={{ backgroundColor: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
      <Icon size={9} /> {lang === "DE" ? cfg.label : cfg.labelEN}
    </span>
  );
}

function CreateTicketModal({ onClose, onCreated, lang }) {
  const [form, setForm] = useState({
    title: "", description: "", category: "support",
    priority: "medium", name: "", email: "", phone: "", source: "studio",
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error(lang === "DE" ? "Titel und Beschreibung sind Pflichtfelder" : "Title and description are required");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/tickets`, { ...form, language: lang });
      toast.success(lang === "DE" ? `Ticket #${res.data.ticket_id} erstellt` : `Ticket #${res.data.ticket_id} created`);
      onCreated(res.data);
      onClose();
    } catch { toast.error("Fehler beim Erstellen"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-lg bg-[#0D0D0D] border border-white/10 rounded-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <Ticket size={16} style={{ color: COLOR }} />
            <span className="text-sm font-semibold text-white">
              {lang === "DE" ? "Neues Ticket erstellen" : "Create New Ticket"}
            </span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">
                {lang === "DE" ? "Kategorie" : "Category"}
              </label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)}
                className="w-full bg-black border border-white/10 rounded-sm px-3 py-2 text-sm text-white focus:outline-none">
                <option value="support">{lang === "DE" ? "Support" : "Support"}</option>
                <option value="sales">{lang === "DE" ? "Sales" : "Sales"}</option>
                <option value="general">{lang === "DE" ? "Allgemein" : "General"}</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">
                {lang === "DE" ? "Priorität" : "Priority"}
              </label>
              <select value={form.priority} onChange={(e) => set("priority", e.target.value)}
                className="w-full bg-black border border-white/10 rounded-sm px-3 py-2 text-sm text-white focus:outline-none">
                <option value="low">{lang === "DE" ? "Niedrig" : "Low"}</option>
                <option value="medium">{lang === "DE" ? "Mittel" : "Medium"}</option>
                <option value="high">{lang === "DE" ? "Hoch" : "High"}</option>
                <option value="urgent">{lang === "DE" ? "Dringend" : "Urgent"}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">
              {lang === "DE" ? "Titel *" : "Title *"}
            </label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)}
              placeholder={lang === "DE" ? "Kurze Beschreibung des Problems…" : "Brief description of the issue…"}
              className="w-full bg-black border border-white/10 rounded-sm px-3 py-2 text-sm text-white focus:outline-none"
              style={{ borderColor: form.title ? `${COLOR}40` : undefined }} />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">
              {lang === "DE" ? "Beschreibung *" : "Description *"}
            </label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4}
              placeholder={lang === "DE" ? "Detaillierte Beschreibung des Anliegens…" : "Detailed description of the issue…"}
              className="w-full bg-black border border-white/10 rounded-sm px-3 py-2.5 text-sm text-white focus:outline-none resize-none"
              style={{ borderColor: form.description ? `${COLOR}40` : undefined }} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { k: "name", icon: User, ph_de: "Name", ph_en: "Name" },
              { k: "email", icon: Mail, ph_de: "E-Mail", ph_en: "Email" },
              { k: "phone", icon: Phone, ph_de: "Telefon", ph_en: "Phone" },
            ].map(({ k, icon: Icon, ph_de, ph_en }) => (
              <div key={k} className="relative">
                <Icon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input value={form[k]} onChange={(e) => set(k, e.target.value)}
                  placeholder={lang === "DE" ? ph_de : ph_en}
                  className="w-full bg-black border border-white/10 rounded-sm pl-8 pr-3 py-2 text-xs text-white focus:outline-none" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-white/8">
          <button onClick={onClose} className="text-sm px-4 py-2 border border-white/10 rounded-sm text-zinc-400 hover:text-white transition-colors">
            {lang === "DE" ? "Abbrechen" : "Cancel"}
          </button>
          <button onClick={submit} disabled={loading}
            className="text-sm px-5 py-2 rounded-sm font-medium text-black transition-all disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${COLOR}, #6D28D9)` }}>
            {loading ? (lang === "DE" ? "Erstelle…" : "Creating…") : (lang === "DE" ? "Ticket erstellen" : "Create Ticket")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function TicketDetail({ ticket, lang, onUpdate, onClose }) {
  const [note, setNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const update = async (patch) => {
    setUpdating(true);
    try {
      const res = await axios.patch(`${API}/tickets/${ticket.ticket_id}`, patch);
      onUpdate(res.data);
      if (patch.note) setNote("");
    } catch { toast.error("Fehler"); }
    finally { setUpdating(false); }
  };

  const catCfg = CATEGORY_CONFIG[ticket.category] || CATEGORY_CONFIG.general;
  const CatIcon = catCfg.icon;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
        <div className="flex items-center gap-2">
          <CatIcon size={14} style={{ color: catCfg.color }} />
          <span className="text-xs font-mono text-zinc-500">#{ticket.ticket_id}</span>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={15} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-white mb-2">{ticket.title}</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            <StatusBadge status={ticket.status} lang={lang} />
            <PriorityBadge priority={ticket.priority} lang={lang} />
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border border-white/10 text-zinc-500">
              <Tag size={9} /> {lang === "DE" ? catCfg.label : catCfg.labelEN}
            </span>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {(ticket.name || ticket.email || ticket.phone) && (
          <div className="bg-white/3 border border-white/8 rounded-sm p-4 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">
              {lang === "DE" ? "Kontakt" : "Contact"}
            </p>
            {ticket.name && <p className="text-sm text-zinc-300 flex items-center gap-2"><User size={12} className="text-zinc-600" /> {ticket.name}</p>}
            {ticket.email && <p className="text-sm text-zinc-300 flex items-center gap-2"><Mail size={12} className="text-zinc-600" /> {ticket.email}</p>}
            {ticket.phone && <p className="text-sm text-zinc-300 flex items-center gap-2"><Phone size={12} className="text-zinc-600" /> {ticket.phone}</p>}
          </div>
        )}

        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">
            {lang === "DE" ? "Status ändern" : "Change Status"}
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(STATUS_CONFIG).map(([k, cfg]) => (
              <button key={k} onClick={() => update({ status: k })} disabled={ticket.status === k || updating}
                className="text-xs px-3 py-1.5 rounded-sm border transition-all disabled:opacity-40"
                style={ticket.status === k ? { borderColor: `${cfg.color}60`, backgroundColor: `${cfg.color}18`, color: cfg.color } : { borderColor: "rgba(255,255,255,0.08)", color: "#71717a" }}>
                {lang === "DE" ? cfg.label : cfg.labelEN}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">
            {lang === "DE" ? "Priorität ändern" : "Change Priority"}
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRIORITY_CONFIG).map(([k, cfg]) => (
              <button key={k} onClick={() => update({ priority: k })} disabled={ticket.priority === k || updating}
                className="text-xs px-3 py-1.5 rounded-sm border transition-all disabled:opacity-40"
                style={ticket.priority === k ? { borderColor: `${cfg.color}60`, backgroundColor: `${cfg.color}18`, color: cfg.color } : { borderColor: "rgba(255,255,255,0.08)", color: "#71717a" }}>
                {lang === "DE" ? cfg.label : cfg.labelEN}
              </button>
            ))}
          </div>
        </div>

        {ticket.notes && ticket.notes.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">
              {lang === "DE" ? "Notizen" : "Notes"}
            </p>
            <div className="space-y-2">
              {ticket.notes.map((n, i) => (
                <div key={i} className="bg-white/3 border border-white/8 rounded-sm px-3 py-2.5">
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{n.text}</p>
                  <p className="text-[10px] text-zinc-600 mt-1">{n.created_at?.slice(0, 16).replace("T", " ")}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">
            {lang === "DE" ? "Notiz hinzufügen" : "Add Note"}
          </p>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
            placeholder={lang === "DE" ? "Interne Notiz…" : "Internal note…"}
            className="w-full bg-black border border-white/10 rounded-sm px-3 py-2 text-sm text-white focus:outline-none resize-none" />
          <button onClick={() => update({ note })} disabled={!note.trim() || updating}
            className="mt-2 text-xs px-4 py-1.5 rounded-sm border border-white/10 text-zinc-400 hover:text-white disabled:opacity-40 transition-colors">
            {lang === "DE" ? "Notiz speichern" : "Save Note"}
          </button>
        </div>

        <p className="text-[10px] text-zinc-700">
          {lang === "DE" ? "Erstellt" : "Created"}: {ticket.created_at?.slice(0, 16).replace("T", " ")} ·{" "}
          {lang === "DE" ? "Quelle" : "Source"}: {ticket.source}
        </p>
      </div>
    </div>
  );
}

export default function TicketSystem() {
  const { lang } = useApp();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterCategory) params.category = filterCategory;
      if (filterPriority) params.priority = filterPriority;
      const [tRes, sRes] = await Promise.all([
        axios.get(`${API}/tickets`, { params }),
        axios.get(`${API}/tickets/stats/summary`),
      ]);
      setTickets(tRes.data.tickets || []);
      setStats(sRes.data || {});
    } catch { toast.error("Fehler beim Laden"); }
    finally { setLoading(false); }
  }, [filterStatus, filterCategory, filterPriority]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const filtered = tickets.filter((t) =>
    !search || t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.ticket_id?.toLowerCase().includes(search.toLowerCase()) ||
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase())
  );

  const updateTicketInList = (updated) => {
    setTickets((p) => p.map((t) => t.ticket_id === updated.ticket_id ? updated : t));
    if (selectedTicket?.ticket_id === updated.ticket_id) setSelectedTicket(updated);
  };

  const deleteTicket = async (id) => {
    if (!window.confirm(lang === "DE" ? "Ticket wirklich löschen?" : "Really delete this ticket?")) return;
    await axios.delete(`${API}/tickets/${id}`);
    setTickets((p) => p.filter((t) => t.ticket_id !== id));
    if (selectedTicket?.ticket_id === id) setSelectedTicket(null);
    toast.success(lang === "DE" ? "Ticket gelöscht" : "Ticket deleted");
  };

  const statCards = [
    { label: lang === "DE" ? "Gesamt" : "Total",       value: stats.total || 0,                          color: COLOR },
    { label: lang === "DE" ? "Offen" : "Open",         value: stats.by_status?.open || 0,                color: "#60A5FA" },
    { label: lang === "DE" ? "In Arbeit" : "Active",   value: stats.by_status?.in_progress || 0,         color: "#FBBF24" },
    { label: lang === "DE" ? "Dringend" : "Urgent",    value: stats.by_priority?.urgent || 0,            color: "#F87171" },
    { label: lang === "DE" ? "Gelöst" : "Resolved",    value: stats.by_status?.resolved || 0,            color: "#34D399" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader icon={Ticket} color={COLOR} title={lang === "DE" ? "Ticket-System" : "Ticket System"} badge="Support"
        subtitle={lang === "DE" ? "Support & Sales Tickets · Status-Tracking · Notizen · Priorisierung" : "Support & Sales Tickets · Status Tracking · Notes · Prioritization"} />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="bg-[#0A0A0A] border border-white/8 rounded-sm px-4 py-3 text-center">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-zinc-600 uppercase tracking-widest mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === "DE" ? "Ticket suchen…" : "Search tickets…"}
            className="w-full bg-[#0A0A0A] border border-white/10 rounded-sm pl-8 pr-3 py-2 text-sm text-white focus:outline-none" />
        </div>
        {[
          { val: filterStatus, set: setFilterStatus, opts: [["", lang === "DE" ? "Alle Status" : "All Status"], ...Object.entries(STATUS_CONFIG).map(([k, c]) => [k, lang === "DE" ? c.label : c.labelEN])] },
          { val: filterCategory, set: setFilterCategory, opts: [["", lang === "DE" ? "Alle Kategorien" : "All Categories"], ...Object.entries(CATEGORY_CONFIG).map(([k, c]) => [k, lang === "DE" ? c.label : c.labelEN])] },
          { val: filterPriority, set: setFilterPriority, opts: [["", lang === "DE" ? "Alle Prioritäten" : "All Priorities"], ...Object.entries(PRIORITY_CONFIG).map(([k, c]) => [k, lang === "DE" ? c.label : c.labelEN])] },
        ].map((f, i) => (
          <select key={i} value={f.val} onChange={(e) => f.set(e.target.value)}
            className="bg-[#0A0A0A] border border-white/10 rounded-sm px-3 py-2 text-sm text-white focus:outline-none">
            {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
        <button onClick={fetchTickets} className="p-2 border border-white/10 rounded-sm text-zinc-400 hover:text-white transition-colors">
          <RefreshCw size={14} />
        </button>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium text-black"
          style={{ background: `linear-gradient(135deg, ${COLOR}, #6D28D9)` }}>
          <Plus size={14} /> {lang === "DE" ? "Neues Ticket" : "New Ticket"}
        </button>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ minHeight: "520px" }}>
        {/* Ticket list */}
        <div className="lg:col-span-2 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-zinc-600 text-sm">
              {lang === "DE" ? "Lädt…" : "Loading…"}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-700">
              <Ticket size={32} className="mb-3 opacity-40" />
              <p className="text-sm">{lang === "DE" ? "Keine Tickets gefunden" : "No tickets found"}</p>
              <button onClick={() => setShowCreate(true)} className="mt-3 text-xs text-zinc-500 hover:text-white underline transition-colors">
                {lang === "DE" ? "Erstes Ticket erstellen" : "Create first ticket"}
              </button>
            </div>
          ) : filtered.map((t) => {
            const catCfg = CATEGORY_CONFIG[t.category] || CATEGORY_CONFIG.general;
            const CatIcon = catCfg.icon;
            const isSelected = selectedTicket?.ticket_id === t.ticket_id;
            return (
              <motion.div key={t.ticket_id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedTicket(t)}
                className={`group cursor-pointer bg-[#0A0A0A] border rounded-sm p-4 transition-all ${
                  isSelected ? "border-[#7C3AED]/40" : "border-white/8 hover:border-white/20"
                }`}
                style={isSelected ? { background: "rgba(124,58,237,0.04)" } : {}}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <CatIcon size={11} style={{ color: catCfg.color }} />
                      <span className="text-[10px] font-mono text-zinc-600">#{t.ticket_id}</span>
                    </div>
                    <p className="text-sm font-medium text-white truncate">{t.title}</p>
                    {t.name && <p className="text-xs text-zinc-600 mt-0.5 truncate">{t.name} {t.email ? `· ${t.email}` : ""}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <StatusBadge status={t.status} lang={lang} />
                    <PriorityBadge priority={t.priority} lang={lang} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-zinc-700">{t.created_at?.slice(0, 10)}</p>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); deleteTicket(t.ticket_id); }}
                      className="p-1 text-zinc-600 hover:text-red-400 transition-colors">
                      <Trash2 size={11} />
                    </button>
                    <ChevronRight size={11} className="text-zinc-600" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Ticket detail */}
        <div className="lg:col-span-3 bg-[#0A0A0A] border border-white/8 rounded-sm">
          {selectedTicket ? (
            <TicketDetail ticket={selectedTicket} lang={lang} onUpdate={updateTicketInList} onClose={() => setSelectedTicket(null)} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-zinc-700 py-16">
              <Ticket size={36} className="mb-3 opacity-30" />
              <p className="text-sm">{lang === "DE" ? "Ticket auswählen, um Details zu sehen" : "Select a ticket to view details"}</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateTicketModal lang={lang} onClose={() => setShowCreate(false)} onCreated={(t) => { setTickets((p) => [t, ...p]); setSelectedTicket(t); fetchTickets(); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

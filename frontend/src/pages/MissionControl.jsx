import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
  Sparkles, Target, ArrowRight, CheckCircle2, Clock, Building2, Palette,
  Users, Megaphone, Search, Film, DollarSign, Zap, BarChart2,
  LifeBuoy, ChevronRight, Loader2, ListChecks, Rocket, CircleDot, History, MessageSquare, FileText, ShieldCheck,
  Send, Bot,
} from "lucide-react";
import { useApp, API } from "@/context/AppContext";
import { V, SORA, fadeUp, GradientHeading, Card, SectionHeader } from "@/components/bm";

/* ─── design tokens ──────────────────────────────────────────────── */

const DEPT_ICON = {
  marketing: Megaphone, design: Palette, seo: Search, video: Film,
  sales: DollarSign, automation: Zap, analytics: BarChart2, support: LifeBuoy,
};

const PRIORITY_STYLE = {
  urgent: { bg: "rgba(244,63,94,0.14)", fg: "#fb7185", label_de: "Dringend", label_en: "Urgent" },
  high: { bg: "rgba(124,58,237,0.16)", fg: "#a78bfa", label_de: "Hoch", label_en: "High" },
  medium: { bg: "rgba(255,255,255,0.06)", fg: "#a1a1aa", label_de: "Mittel", label_en: "Medium" },
  low: { bg: "rgba(255,255,255,0.04)", fg: "#71717a", label_de: "Niedrig", label_en: "Low" },
};

const STATUS_STYLE = {
  planned: { fg: "#a78bfa", label_de: "Geplant", label_en: "Planned" },
  in_progress: { fg: "#60a5fa", label_de: "Läuft", label_en: "In progress" },
  needs_review: { fg: "#c4b5fd", label_de: "Review nötig", label_en: "Needs review" },
  approved: { fg: "#34d399", label_de: "Freigegeben", label_en: "Approved" },
  completed: { fg: "#4ade80", label_de: "Abgeschlossen", label_en: "Completed" },
  rejected: { fg: "#71717a", label_de: "Abgelehnt", label_en: "Rejected" },
};

const TEAM_AVATARS = {
  "Quantum AI": { initials: "QC", gradient: "linear-gradient(135deg,#7C3AED,#C4B5FD)" },
  "Marketing Director": { initials: "MD", gradient: "linear-gradient(135deg,#6D28D9,#A78BFA)" },
  "Creative Director": { initials: "CD", gradient: "linear-gradient(135deg,#8B5CF6,#EC4899)" },
  Copywriter: { initials: "CW", gradient: "linear-gradient(135deg,#7C3AED,#60A5FA)" },
  "SEO Manager": { initials: "SEO", gradient: "linear-gradient(135deg,#4F46E5,#22C55E)" },
  Designer: { initials: "DS", gradient: "linear-gradient(135deg,#9333EA,#F472B6)" },
  "Video Producer": { initials: "VP", gradient: "linear-gradient(135deg,#7C3AED,#38BDF8)" },
  "Sales Expert": { initials: "SE", gradient: "linear-gradient(135deg,#6D28D9,#34D399)" },
  "Analytics Expert": { initials: "AE", gradient: "linear-gradient(135deg,#7C3AED,#818CF8)" },
  "Automation Architect": { initials: "AA", gradient: "linear-gradient(135deg,#5B21B6,#C4B5FD)" },
  Human: { initials: "YOU", gradient: "linear-gradient(135deg,#27272A,#71717A)" },
};

/* ─── small UI atoms ─────────────────────────────────────────────── */



function Pill({ children, tone = "violet", icon: Icon }) {
  const map = {
    violet: { bg: "rgba(124,58,237,0.1)", bd: "rgba(124,58,237,0.28)", fg: "#a78bfa" },
    neutral: { bg: "rgba(255,255,255,0.04)", bd: "rgba(255,255,255,0.1)", fg: "#a1a1aa" },
  };
  const c = map[tone] || map.violet;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
      style={{ background: c.bg, border: `1px solid ${c.bd}`, color: c.fg }}>
      {Icon && <Icon size={11} />}{children}
    </span>
  );
}

/* ─── task row with approval controls ────────────────────────────── */
function TaskRow({ task, lang, onUpdate, detailed = false }) {
  const dept = DEPT_ICON[task.department] || CircleDot;
  const DeptIcon = dept;
  const prio = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.medium;
  const st = STATUS_STYLE[task.status] || STATUS_STYLE.planned;
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const change = async (status, comment = "") => {
    setBusy(true);
    try {
      const res = await axios.patch(`${API}/mission/tasks/${task.id}`, { status, comment });
      onUpdate?.(res.data);
      setNote("");
      // Feed the Intelligence Engine – a human decision is a learning signal.
      axios.post(`${API}/intelligence/event`, {
        kind: `task_${status}`, subject: task.id, label: task.title,
        meta: { department: task.department, priority: task.priority },
      }).catch(() => {});
    } catch { toast.error(lang === "DE" ? "Aktion fehlgeschlagen" : "Action failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-sm"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
        <DeptIcon size={12} style={{ color: V }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-medium text-zinc-100 leading-snug">{task.title}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
            style={{ background: prio.bg, color: prio.fg }}>
            {lang === "DE" ? prio.label_de : prio.label_en}
          </span>
        </div>
        {task.description && (
          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed line-clamp-2">{task.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-600 flex-wrap">
          <span className="uppercase tracking-wider">{task.department}</span>
          <span>{lang === "DE" ? "Agent" : "Agent"}: {task.assigned_agent || task.owner_agent}</span>
          {task.due_date && <span className="inline-flex items-center gap-1"><Clock size={9} />{task.due_date}</span>}
          <span style={{ color: st.fg }}>● {lang === "DE" ? st.label_de : st.label_en}</span>
        </div>
        {detailed && (
          <div className="mt-3 grid md:grid-cols-2 gap-3">
            <div className="p-3 rounded-sm" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.14)" }}>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-500 mb-2"><FileText size={11} />{lang === "DE" ? "Inputs" : "Required inputs"}</div>
              <ul className="space-y-1">{(task.required_inputs || []).map((x, i) => <li key={i} className="text-[11px] text-zinc-400">• {x}</li>)}</ul>
            </div>
            <div className="p-3 rounded-sm" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.14)" }}>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-500 mb-2"><ShieldCheck size={11} />{lang === "DE" ? "Erwartetes Ergebnis" : "Expected output"}</div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">{task.expected_output}</p>
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-500 mb-2"><MessageSquare size={11} />{lang === "DE" ? "Kommentare / Notizen" : "Comments / notes"}</div>
              <div className="space-y-1.5 mb-2">{(task.comments || []).map((c) => <div key={c.id || c.created_at} className="text-[11px] text-zinc-500"><span className="text-zinc-300">{c.author}:</span> {c.text}</div>)}</div>
              {(task.timeline || []).length > 0 && <div className="mb-2 space-y-1">{(task.timeline || []).map((item, i) => <div key={`${item.at}-${i}`} className="text-[10px] text-zinc-600">● {item.text} <span className="text-zinc-700">{(item.at || "").slice(0, 16)}</span></div>)}</div>}
              <div className="flex gap-2"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder={lang === "DE" ? "Interne Notiz hinzufügen…" : "Add internal note…"} className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-sm px-3 py-2 text-[12px] text-zinc-200 outline-none focus:border-[#7C3AED]/50" /><button disabled={!note.trim() || busy} onClick={() => change(task.status, note)} className="px-3 py-2 text-[11px] rounded-sm font-semibold" style={{ background: "rgba(124,58,237,0.16)", color: "#c4b5fd", border: "1px solid rgba(124,58,237,0.3)" }}>{lang === "DE" ? "Notiz" : "Note"}</button></div>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {task.status === "planned" && (
          <>
            <button disabled={busy} onClick={() => change("in_progress")}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-sm transition-colors"
              style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399" }}>
              {lang === "DE" ? "Starten" : "Start"}
            </button>
            <button disabled={busy} onClick={() => change("rejected")}
              className="text-[10px] px-2.5 py-1 rounded-sm transition-colors text-zinc-500"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              {lang === "DE" ? "Ablehnen" : "Reject"}
            </button>
          </>
        )}
        {task.status === "in_progress" && (
          <button disabled={busy} onClick={() => change("needs_review")}
            className="text-[10px] font-semibold px-2.5 py-1 rounded-sm"
            style={{ background: "rgba(196,181,253,0.12)", border: "1px solid rgba(196,181,253,0.3)", color: "#c4b5fd" }}>
            {lang === "DE" ? "Review" : "Review"}
          </button>
        )}
        {task.status === "needs_review" && (
          <button disabled={busy} onClick={() => change("approved")}
            className="text-[10px] font-semibold px-2.5 py-1 rounded-sm"
            style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399" }}>
            {lang === "DE" ? "Freigeben" : "Approve"}
          </button>
        )}
        {task.status === "approved" && (
          <button disabled={busy} onClick={() => change("completed")}
            className="text-[10px] font-semibold px-2.5 py-1 rounded-sm inline-flex items-center gap-1"
            style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80" }}>
            <CheckCircle2 size={11} />{lang === "DE" ? "Abschließen" : "Complete"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── executive plan render ──────────────────────────────────────── */
function PlanView({ plan, tasks, lang, onUpdate, detailed = false }) {
  const Block = ({ title, items }) => (
    items?.length ? (
      <div>
        <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">{title}</div>
        <div className="flex flex-wrap gap-1.5">
          {items.map((it, i) => <Pill key={i} tone="neutral">{it}</Pill>)}
        </div>
      </div>
    ) : null
  );
  return (
    <div className="space-y-6">
      {plan.summary && <p className="text-sm text-zinc-300 leading-relaxed">{plan.summary}</p>}
      {plan.strategy && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">
            {lang === "DE" ? "Strategie" : "Strategy"}
          </div>
          <p className="text-[13px] text-zinc-400 leading-relaxed">{plan.strategy}</p>
        </div>
      )}
      {plan.target_audience && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">
            {lang === "DE" ? "Zielgruppe" : "Target Audience"}
          </div>
          <p className="text-[13px] text-zinc-400 leading-relaxed">{plan.target_audience}</p>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-5">
        <Block title={lang === "DE" ? "Empfohlene Kanäle" : "Channels"} items={plan.channels} />
        <Block title={lang === "DE" ? "Benötigte Assets" : "Required Assets"} items={plan.required_assets} />
      </div>
      {plan.next_steps?.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">
            {lang === "DE" ? "Nächste Schritte" : "Next Steps"}
          </div>
          <ol className="space-y-1.5">
            {plan.next_steps.map((s, i) => (
              <li key={i} className="flex gap-2.5 text-[13px] text-zinc-400">
                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: "rgba(124,58,237,0.14)", color: "#a78bfa" }}>{i + 1}</span>
                <span className="leading-relaxed pt-0.5">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {tasks?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ListChecks size={13} style={{ color: V }} />
            <span className="text-[11px] uppercase tracking-widest text-zinc-500">
              {lang === "DE" ? "Abteilungs-Tasks (Freigabe erforderlich)" : "Department Tasks (approval required)"}
            </span>
          </div>
          <div className="space-y-2">
            {tasks.map((t) => <TaskRow key={t.id} task={t} lang={lang} onUpdate={onUpdate} detailed={detailed} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function TeamChat({ plan, tasks, lang, model }) {
  const [messages, setMessages] = useState([]);
  const [agents, setAgents] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const suggestions = [
    "Verbessert diesen Kampagnenplan",
    "Welche Risiken seht ihr?",
    "Welche Inhalte sollen zuerst produziert werden?",
    "Wie können wir schneller Leads gewinnen?",
    "Welche Assets fehlen noch?",
  ];

  const load = useCallback(async () => {
    if (!plan?.id) return;
    try {
      const r = await axios.get(`${API}/mission/plans/${plan.id}/team-chat`);
      setMessages(r.data.messages || []);
      setAgents(r.data.agents || []);
    } catch {
      toast.error(lang === "DE" ? "Team-Chat konnte nicht geladen werden" : "Could not load team chat");
    }
  }, [plan?.id, lang]);

  useEffect(() => { load(); }, [load]);

  const ask = async (text = input) => {
    const question = (text || "").trim();
    if (!question || busy) return;
    setBusy(true);
    setInput("");
    try {
      const r = await axios.post(`${API}/mission/plans/${plan.id}/team-chat/ask`, {
        question, model, language: lang,
      });
      setMessages((prev) => [...prev, ...(r.data.messages || [])]);
      setAgents(r.data.agents || []);
    } catch {
      toast.error(lang === "DE" ? "Das KI-Team konnte nicht antworten" : "The AI team could not respond");
      setInput(question);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-4 md:p-6 overflow-hidden" style={{
      background: "linear-gradient(145deg, rgba(124,58,237,0.08) 0%, rgba(10,10,10,0.84) 48%, rgba(109,40,217,0.06) 100%)",
      border: "1px solid rgba(124,58,237,0.2)",
    }}>
      <div className="flex flex-col xl:flex-row xl:items-start gap-5">
        <div className="xl:w-64 flex-shrink-0">
          <SectionHeader icon={MessageSquare} title={lang === "DE" ? "AI Team Chat" : "AI Team Chat"} />
          <p className="text-[12px] text-zinc-500 leading-relaxed mb-4">
            {lang === "DE"
              ? "Das Team diskutiert diesen Plan intern. Quantum moderiert, fasst Entscheidungen zusammen und wartet immer auf deine Freigabe."
              : "The team discusses this plan internally. Quantum moderates, summarizes decisions and always waits for your approval."}
          </p>
          <div className="grid grid-cols-2 xl:grid-cols-1 gap-2">
            {(agents.length ? agents : Object.keys(TEAM_AVATARS).filter((a) => a !== "Human").map((agent) => ({ agent, role: "" }))).map((a) => {
              const av = TEAM_AVATARS[a.agent] || TEAM_AVATARS["Quantum AI"];
              return (
                <div key={a.agent} className="flex items-center gap-2 p-2 rounded-sm" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black text-white" style={{ background: av.gradient }}>{av.initials}</div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-zinc-200 font-semibold truncate">{a.agent}</div>
                    <div className="text-[9px] text-zinc-600 truncate">{a.role}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestions.map((s) => (
              <button key={s} onClick={() => ask(s)} disabled={busy}
                className="text-[11px] px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", color: "#c4b5fd" }}>
                {s}
              </button>
            ))}
          </div>

          <div className="max-h-[560px] overflow-y-auto pr-1 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-10 rounded-sm" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(124,58,237,0.22)" }}>
                <Bot size={24} className="mx-auto mb-3 text-[#7C3AED]" />
                <p className="text-sm text-zinc-400">{lang === "DE" ? "Stelle dem ganzen KI-Team eine Frage zum Plan." : "Ask the whole AI team a question about the plan."}</p>
              </div>
            )}
            {messages.map((m) => {
              const av = TEAM_AVATARS[m.agent] || TEAM_AVATARS["Quantum AI"];
              const task = m.linked_task_id ? tasks?.find((t) => t.id === m.linked_task_id) : null;
              const isSummary = m.message_type === "summary";
              const isUser = m.message_type === "user";
              return (
                <div key={m.id || `${m.timestamp}-${m.agent}`} className={`flex gap-3 ${isUser ? "justify-end" : ""}`}>
                  {!isUser && <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0" style={{ background: av.gradient }}>{av.initials}</div>}
                  <div className={`${isUser ? "max-w-[86%] md:max-w-[70%]" : "flex-1"} rounded-sm p-3`}
                    style={{
                      background: isSummary ? "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(196,181,253,0.08))" : (isUser ? "rgba(124,58,237,0.18)" : "rgba(255,255,255,0.03)"),
                      border: isSummary ? "1px solid rgba(196,181,253,0.32)" : "1px solid rgba(255,255,255,0.07)",
                    }}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div>
                        <span className="text-[12px] font-semibold text-zinc-100">{m.agent}</span>
                        {!isUser && <span className="text-[10px] text-zinc-600 ml-2">{m.role}</span>}
                      </div>
                      {isSummary && <Pill icon={ShieldCheck}>{lang === "DE" ? "Quantum Empfehlung" : "Quantum summary"}</Pill>}
                    </div>
                    <p className="text-[13px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    {task && <div className="mt-2 text-[10px] text-zinc-500">↳ {lang === "DE" ? "Task" : "Task"}: {task.title}</div>}
                  </div>
                </div>
              );
            })}
            {busy && <div className="flex items-center gap-2 text-[12px] text-zinc-500"><Loader2 size={13} className="animate-spin" />{lang === "DE" ? "Das Team diskutiert…" : "The team is discussing…"}</div>}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") ask(); }}
              placeholder={lang === "DE" ? "Frage an das ganze Team…" : "Ask the whole team…"}
              className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-sm px-4 py-3 text-sm text-zinc-200 outline-none focus:border-[#7C3AED]/50" />
            <button onClick={() => ask()} disabled={!input.trim() || busy}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-sm text-sm font-bold disabled:opacity-40"
              style={{ background: V, color: "#0A0A0A" }}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {lang === "DE" ? "Fragen" : "Ask"}
            </button>
          </div>
          <p className="mt-2 text-[10px] text-zinc-600">
            {lang === "DE" ? "Internes Brainstorming: keine Veröffentlichung, keine destruktiven Aktionen, menschliche Freigabe erforderlich." : "Internal brainstorming: no publishing, no destructive actions, human approval required."}
          </p>
        </div>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function MissionControl() {
  const { lang, user, activeBrand, activeBrandId, activeWorkspace, model } = useApp();
  const navigate = useNavigate();
  const { planId } = useParams();
  const firstName = (user?.name || user?.email?.split("@")[0] || "").split(" ")[0];

  const [goal, setGoal] = useState("");
  const [planning, setPlanning] = useState(false);
  const [activePlan, setActivePlan] = useState(null);     // {plan, tasks}
  const [overview, setOverview] = useState(null);
  const [plans, setPlans] = useState([]);

  const greet = () => {
    const h = new Date().getHours();
    if (lang !== "DE") return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    return h < 12 ? "Guten Morgen" : h < 18 ? "Guten Tag" : "Guten Abend";
  };

  const loadOverview = useCallback(async () => {
    try { const r = await axios.get(`${API}/mission/overview`); setOverview(r.data); } catch { /* silent */ }
  }, []);
  const loadPlans = useCallback(async () => {
    try { const r = await axios.get(`${API}/mission/plans`); setPlans(r.data.plans || []); } catch { /* silent */ }
  }, []);

  useEffect(() => { loadOverview(); loadPlans(); }, [loadOverview, loadPlans, activeBrandId]);
  useEffect(() => { if (planId) openPlan(planId); }, [planId]); // eslint-disable-line react-hooks/exhaustive-deps

  const createPlan = async () => {
    if (!goal.trim() || planning) return;
    setPlanning(true);
    try {
      const res = await axios.post(`${API}/mission/ceo/plan`, {
        goal: goal.trim(), brand_id: activeBrandId, model, language: lang,
      });
      setActivePlan(res.data);
      setGoal("");
      toast.success(lang === "DE" ? "Executive-Plan erstellt" : "Executive plan created");
      loadOverview(); loadPlans();
    } catch {
      toast.error(lang === "DE" ? "Plan konnte nicht erstellt werden" : "Could not create plan");
    } finally { setPlanning(false); }
  };

  const openPlan = async (id) => {
    try { const r = await axios.get(`${API}/mission/plans/${id}`); setActivePlan(r.data); window.scrollTo({ top: 0, behavior: "smooth" }); }
    catch { toast.error("Fehler"); }
  };

  const onTaskUpdate = (updated) => {
    setActivePlan((p) => p ? { ...p, tasks: p.tasks.map((t) => t.id === updated.id ? updated : t) } : p);
    loadOverview();
  };

  const counts = overview?.counts || {};

  return (
    <div className="space-y-10 pb-10">
      {/* ══ HERO / greeting + context ═══════════════════════════════ */}
      <motion.section {...fadeUp(0)}>
        <div className="relative overflow-hidden rounded-xl" style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(8,8,8,0) 55%, rgba(124,58,237,0.05) 100%)",
          border: "1px solid rgba(124,58,237,0.14)",
        }}>
          <div className="absolute -top-28 -left-28 w-96 h-96 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)" }} />
          <div className="relative px-6 md:px-10 py-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-[10px] tracking-[0.2em] uppercase font-semibold"
              style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.26)", color: V }}>
              <Target size={11} /> Mission Control
            </div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3" style={{ fontFamily: SORA }}>
              <span style={{ color: "#fff" }}>{greet()}, </span>
              <span style={{
                background: "linear-gradient(90deg, #7C3AED 0%, #C4B5FD 45%, #6D28D9 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>{firstName || (lang === "DE" ? "willkommen" : "there")}</span>
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-xl mb-6">
              {lang === "DE"
                ? "Dein Quantum Command Center. Gib ein Geschäftsziel vor – Quantum entwirft den Executive-Plan und verteilt die Aufgaben an dein KI-Team. Nichts wird ohne deine Freigabe ausgeführt."
                : "Your Quantum Command Center. Set a business goal – Quantum drafts the executive plan and delegates tasks to your AI team. Nothing runs without your approval."}
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <Pill icon={Building2}>{activeWorkspace?.name || (lang === "DE" ? "Kein Workspace" : "No workspace")}</Pill>
              <Pill icon={Palette}>{activeBrand?.name || "—"}</Pill>
              {counts.plans != null && <Pill tone="neutral" icon={ListChecks}>{counts.tasks_open || 0} {lang === "DE" ? "offen" : "open"}</Pill>}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ══ Quantum AI composer ═════════════════════════════════════════ */}
      <motion.section {...fadeUp(0.06)}>
        <Card className="p-6" style={{
          background: "linear-gradient(145deg, rgba(124,58,237,0.06) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid rgba(124,58,237,0.16)",
        }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-sm flex items-center justify-center"
              style={{ background: "rgba(124,58,237,0.14)", border: "1px solid rgba(124,58,237,0.28)" }}>
              <Sparkles size={15} style={{ color: V }} />
            </div>
            <div>
              <GradientHeading className="text-base">{lang === "DE" ? "Quantum Command Planung" : "Quantum Command Planning"}</GradientHeading>
              <p className="text-[11px] text-zinc-600">Quantum · {lang === "DE" ? "Quantum AI & Orchestrator" : "Quantum AI & Orchestrator"}</p>
            </div>
          </div>
          <textarea
            value={goal} onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") createPlan(); }}
            rows={3}
            placeholder={lang === "DE"
              ? "Beschreibe dein Geschäftsziel, z.B. „In 30 Tagen 100 qualifizierte Leads für unser neues Coaching-Programm gewinnen.“"
              : "Describe your business goal, e.g. \"Win 100 qualified leads for our new coaching program in 30 days.\""}
            className="w-full bg-[#0A0A0A] border border-white/10 rounded-sm px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-[#7C3AED]/50 transition-colors resize-none"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] text-zinc-600">⌘/Ctrl + Enter</span>
            <button onClick={createPlan} disabled={!goal.trim() || planning}
              className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-sm transition-all disabled:opacity-40"
              style={{ background: V, color: "#0A0A0A" }}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = "#C4B5FD"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = V; }}>
              {planning ? <Loader2 size={15} className="animate-spin" /> : <Target size={15} />}
              {planning ? (lang === "DE" ? "Plane…" : "Planning…") : (lang === "DE" ? "Executive-Plan erstellen" : "Create Executive Plan")}
            </button>
          </div>
        </Card>
      </motion.section>

      {/* ══ Active plan result ══════════════════════════════════════ */}
      <AnimatePresence>
        {activePlan?.plan && (
          <motion.section {...fadeUp(0)} exit={{ opacity: 0, y: -10 }}>
            <Card className="p-6">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">
                    {lang === "DE" ? "Executive-Plan" : "Executive Plan"}
                  </div>
                  <GradientHeading className="text-lg">{activePlan.plan.goal}</GradientHeading>
                </div>
                <Pill tone="neutral" icon={CircleDot}>
                  {lang === "DE" ? "Freigabe ausstehend" : "Awaiting approval"}
                </Pill>
              </div>
              <PlanView plan={activePlan.plan} tasks={activePlan.tasks} lang={lang} onUpdate={onTaskUpdate} detailed={Boolean(planId)} />
            </Card>
            {planId && (
              <div className="mt-5">
                <TeamChat plan={activePlan.plan} tasks={activePlan.tasks} lang={lang} model={model} />
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* ══ Priorities + Suggested actions ══════════════════════════ */}
      <motion.section {...fadeUp(0.1)} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-6">
          <SectionHeader icon={ListChecks} title={lang === "DE" ? "Heutige Prioritäten" : "Today's Priorities"} />
          {overview?.priorities?.length ? (
            <div className="space-y-2">
              {overview.priorities.map((t) => <TaskRow key={t.id} task={t} lang={lang} onUpdate={loadOverview} />)}
            </div>
          ) : (
            <p className="text-[13px] text-zinc-600 py-6 text-center">
              {lang === "DE" ? "Keine dringenden Prioritäten. Erstelle einen Plan, um Tasks zu generieren." : "No urgent priorities. Create a plan to generate tasks."}
            </p>
          )}
        </Card>

        <Card className="p-6" style={{
          background: "linear-gradient(145deg, rgba(124,58,237,0.05) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid rgba(124,58,237,0.14)",
        }}>
          <SectionHeader icon={Rocket} title={lang === "DE" ? "Nächste Aktionen" : "Next Actions"} />
          {overview?.suggestions?.length ? (
            <div className="space-y-2.5">
              {overview.suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-sm"
                  style={{ background: "rgba(255,255,255,0.02)", borderLeft: `3px solid ${V}` }}>
                  <ChevronRight size={14} style={{ color: V }} className="mt-0.5 flex-shrink-0" />
                  <span className="text-[12px] text-zinc-300 leading-snug">{lang === "DE" ? s.text_de : s.text_en}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-zinc-600 py-6 text-center">{lang === "DE" ? "Alles im grünen Bereich." : "All clear."}</p>
          )}
        </Card>
      </motion.section>

      {/* ══ Running campaigns ═══════════════════════════════════════ */}
      <motion.section {...fadeUp(0.14)}>
        <SectionHeader icon={Megaphone} title={lang === "DE" ? "Laufende Kampagnen" : "Running Campaigns"}
          right={<span className="text-[10px] text-zinc-700 uppercase tracking-widest">{overview?.campaigns?.length || 0}</span>} />
        {overview?.campaigns?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {overview.campaigns.map((c) => (
              <Card key={c.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Pill tone="neutral">{c.source === "plan" ? (lang === "DE" ? "Plan" : "Plan") : "Studio"}</Pill>
                  <span className="text-[10px]" style={{ color: c.status === "in_progress" ? "#60a5fa" : "#a78bfa" }}>● {c.status}</span>
                </div>
                <div className="text-[13px] font-medium text-zinc-200 leading-snug line-clamp-2">{c.goal}</div>
                {c.source === "plan" && (
                  <div className="mt-3">
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{
                        width: `${c.task_total ? Math.round((c.task_done / c.task_total) * 100) : 0}%`,
                        background: "linear-gradient(90deg, #7C3AED, #C4B5FD)",
                      }} />
                    </div>
                    <div className="text-[10px] text-zinc-600 mt-1.5">{c.task_done}/{c.task_total} {lang === "DE" ? "Tasks erledigt" : "tasks done"}</div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6"><p className="text-[13px] text-zinc-600 text-center">{lang === "DE" ? "Noch keine laufenden Kampagnen." : "No running campaigns yet."}</p></Card>
        )}
      </motion.section>

      {/* ══ Team status + Activity ══════════════════════════════════ */}
      <motion.section {...fadeUp(0.18)} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Department / team status */}
        <Card className="lg:col-span-2 p-6">
          <SectionHeader icon={Users} title={lang === "DE" ? "Team & Abteilungen" : "Team & Departments"} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(overview?.departments || []).map((d) => {
              const Icon = DEPT_ICON[d.id] || CircleDot;
              return (
                <div key={d.id} className="rounded-sm p-3.5 text-center"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-9 h-9 mx-auto mb-2 rounded-sm flex items-center justify-center relative"
                    style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
                    <Icon size={15} style={{ color: V }} />
                    {d.active && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ background: "#34d399" }} />}
                  </div>
                  <div className="text-[12px] font-medium text-zinc-200">{lang === "DE" ? d.label_de : d.label_en}</div>
                  <div className="text-[10px] text-zinc-600 mt-0.5">
                    {d.open > 0 ? `${d.open} ${lang === "DE" ? "offen" : "open"}` : (lang === "DE" ? "bereit" : "ready")}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent activity */}
        <Card className="p-6">
          <SectionHeader icon={Clock} title={lang === "DE" ? "Aktivität" : "Activity"} />
          {overview?.activity?.length ? (
            <div className="space-y-3">
              {overview.activity.map((a, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: STATUS_STYLE[a.status]?.fg || V }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-zinc-300 leading-snug line-clamp-1">{a.text}</p>
                    <p className="text-[10px] text-zinc-600">{a.meta} · {a.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-zinc-600 py-4 text-center">{lang === "DE" ? "Noch keine Aktivität." : "No activity yet."}</p>
          )}
        </Card>
      </motion.section>

      {/* ══ Plan history ════════════════════════════════════════════ */}
      {plans.length > 0 && (
        <motion.section {...fadeUp(0.22)}>
          <SectionHeader icon={History} title={lang === "DE" ? "Plan-Historie" : "Plan History"}
            right={<span className="text-[10px] text-zinc-700 uppercase tracking-widest">{plans.length}</span>} />
          <div className="space-y-2">
            {plans.map((p) => (
              <button key={p.id} onClick={() => navigate(`/mission/plans/${p.id}`)}
                className="w-full text-left flex items-center gap-3 p-3.5 rounded-sm transition-colors group"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.35)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}>
                <Target size={14} style={{ color: V }} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-zinc-200 font-medium line-clamp-1">{p.goal}</div>
                  <div className="text-[10px] text-zinc-600">{p.brand_name} · {p.task_ids?.length || 0} Tasks · {(p.created_at || "").slice(0, 10)}</div>
                </div>
                <ArrowRight size={14} className="text-zinc-600 group-hover:text-[#7C3AED] transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}

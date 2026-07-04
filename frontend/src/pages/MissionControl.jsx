import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
  Sparkles, Target, ArrowRight, CheckCircle2, Clock, Building2, Palette,
  TrendingUp, Users, Megaphone, Search, Film, DollarSign, Zap, BarChart2,
  LifeBuoy, ChevronRight, Loader2, ListChecks, Rocket, CircleDot, History,
} from "lucide-react";
import { useApp, API } from "@/context/AppContext";

/* ─── design tokens ──────────────────────────────────────────────── */
const V = "#7C3AED";
const SORA = "'Sora', sans-serif";
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

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
  proposed: { fg: "#a78bfa", label_de: "Vorschlag", label_en: "Proposed" },
  approved: { fg: "#34d399", label_de: "Freigegeben", label_en: "Approved" },
  in_progress: { fg: "#60a5fa", label_de: "Läuft", label_en: "In progress" },
  done: { fg: "#4ade80", label_de: "Erledigt", label_en: "Done" },
  rejected: { fg: "#71717a", label_de: "Abgelehnt", label_en: "Rejected" },
};

/* ─── small UI atoms ─────────────────────────────────────────────── */
function GradientHeading({ children, className = "" }) {
  return (
    <h2 className={`font-semibold ${className}`} style={{ fontFamily: SORA }}>
      <span style={{
        background: "linear-gradient(90deg, #C4B5FD 0%, #7C3AED 50%, #6D28D9 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
      }}>{children}</span>
    </h2>
  );
}

function SectionHeader({ icon: Icon, title, right }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
        <Icon size={13} style={{ color: V }} />
      </div>
      <GradientHeading className="text-sm">{title}</GradientHeading>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, rgba(124,58,237,0.18), transparent)" }} />
      {right}
    </div>
  );
}

function Card({ children, className = "", style = {} }) {
  return (
    <div className={`rounded-sm ${className}`}
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", ...style }}>
      {children}
    </div>
  );
}

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
function TaskRow({ task, lang, onUpdate }) {
  const dept = DEPT_ICON[task.department] || CircleDot;
  const DeptIcon = dept;
  const prio = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.medium;
  const st = STATUS_STYLE[task.status] || STATUS_STYLE.proposed;
  const [busy, setBusy] = useState(false);

  const change = async (status) => {
    setBusy(true);
    try {
      const res = await axios.patch(`${API}/mission/tasks/${task.id}`, { status });
      onUpdate?.(res.data);
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
        <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-600">
          <span className="uppercase tracking-wider">{task.department}</span>
          {task.due_date && <span className="inline-flex items-center gap-1"><Clock size={9} />{task.due_date}</span>}
          <span style={{ color: st.fg }}>● {lang === "DE" ? st.label_de : st.label_en}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {task.status === "proposed" && (
          <>
            <button disabled={busy} onClick={() => change("approved")}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-sm transition-colors"
              style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399" }}>
              {lang === "DE" ? "Freigeben" : "Approve"}
            </button>
            <button disabled={busy} onClick={() => change("rejected")}
              className="text-[10px] px-2.5 py-1 rounded-sm transition-colors text-zinc-500"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              {lang === "DE" ? "Ablehnen" : "Reject"}
            </button>
          </>
        )}
        {task.status === "approved" && (
          <button disabled={busy} onClick={() => change("in_progress")}
            className="text-[10px] font-semibold px-2.5 py-1 rounded-sm"
            style={{ background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.3)", color: "#60a5fa" }}>
            {lang === "DE" ? "Starten" : "Start"}
          </button>
        )}
        {task.status === "in_progress" && (
          <button disabled={busy} onClick={() => change("done")}
            className="text-[10px] font-semibold px-2.5 py-1 rounded-sm inline-flex items-center gap-1"
            style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80" }}>
            <CheckCircle2 size={11} />{lang === "DE" ? "Fertig" : "Done"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── executive plan render ──────────────────────────────────────── */
function PlanView({ plan, tasks, lang, onUpdate }) {
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
            {tasks.map((t) => <TaskRow key={t.id} task={t} lang={lang} onUpdate={onUpdate} />)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function MissionControl() {
  const { lang, user, activeBrand, activeBrandId, activeWorkspace, model } = useApp();
  const navigate = useNavigate();
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
        <div className="relative overflow-hidden rounded-sm" style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(8,8,8,0) 55%, rgba(124,58,237,0.05) 100%)",
          border: "1px solid rgba(124,58,237,0.18)",
        }}>
          <div className="absolute -top-28 -left-28 w-96 h-96 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)" }} />
          <div className="relative px-6 md:px-10 py-9 md:py-11">
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
                ? "Dein KI-CEO-Kommandozentrum. Gib ein Geschäftsziel vor – Quantum entwirft den Executive-Plan und verteilt die Aufgaben an dein KI-Team. Nichts wird ohne deine Freigabe ausgeführt."
                : "Your AI CEO command center. Set a business goal – Quantum drafts the executive plan and delegates tasks to your AI team. Nothing runs without your approval."}
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <Pill icon={Building2}>{activeWorkspace?.name || (lang === "DE" ? "Kein Workspace" : "No workspace")}</Pill>
              <Pill icon={Palette}>{activeBrand?.name || "—"}</Pill>
              {counts.plans != null && <Pill tone="neutral" icon={ListChecks}>{counts.tasks_open || 0} {lang === "DE" ? "offen" : "open"}</Pill>}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ══ AI CEO composer ═════════════════════════════════════════ */}
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
              <GradientHeading className="text-base">{lang === "DE" ? "KI-CEO Planung" : "AI CEO Planning"}</GradientHeading>
              <p className="text-[11px] text-zinc-600">Quantum · {lang === "DE" ? "KI-CEO & Orchestrator" : "AI CEO & Orchestrator"}</p>
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
              <PlanView plan={activePlan.plan} tasks={activePlan.tasks} lang={lang} onUpdate={onTaskUpdate} />
            </Card>
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
              <button key={p.id} onClick={() => openPlan(p.id)}
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

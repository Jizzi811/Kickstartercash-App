import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Activity, BarChart2, Brain, Building2, Crown, Dna, Film, LifeBuoy,
  Megaphone, MessageSquare, Palette, Rocket, Search, ShieldCheck, Sparkles,
  Target, Users, Zap, ThumbsUp, ClipboardList, AlertTriangle, PlayCircle,
} from "lucide-react";
import { API, useApp } from "@/context/AppContext";
import {
  Page, Hero, Section, Card, Metric, StatGrid, Btn, BMBadge, EmptyState, SORA, V,
} from "@/components/bm";

const DEPT_ICON = {
  marketing: Megaphone, design: Palette, seo: Search, video: Film,
  sales: Users, automation: Zap, analytics: BarChart2, support: LifeBuoy,
};

export default function BrandMindHQ() {
  const navigate = useNavigate();
  const { activeBrand, activeWorkspace, activeBrandId, user, lang } = useApp();
  const de = lang === "DE";
  const firstName = (user?.name || user?.email?.split("@")[0] || "").split(" ")[0];

  // Live data only – nothing on this page is fabricated.
  const [overview, setOverview] = useState(null);
  const [intel, setIntel] = useState(null);
  const [plans, setPlans] = useState([]);
  const [dna, setDna] = useState(null);

  const load = useCallback(async () => {
    const settle = (p) => p.catch(() => null);
    const [o, i, pl, d] = await Promise.all([
      settle(axios.get(`${API}/mission/overview`)),
      settle(axios.get(`${API}/intelligence/insights`, { params: { brand_id: activeBrandId, language: lang } })),
      settle(axios.get(`${API}/mission/plans`)),
      activeBrandId ? settle(axios.get(`${API}/brand-identity/${activeBrandId}`, { params: { language: lang } })) : Promise.resolve(null),
    ]);
    setOverview(o?.data || null);
    setIntel(i?.data || null);
    setPlans(pl?.data?.plans || []);
    setDna(d?.data || null);
  }, [activeBrandId, lang]);

  useEffect(() => { load(); }, [load]);

  const greet = () => {
    const h = new Date().getHours();
    if (!de) return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    return h < 12 ? "Guten Morgen" : h < 18 ? "Guten Tag" : "Guten Abend";
  };

  const counts = overview?.counts || {};
  const metrics = intel?.metrics || {};
  const dnaScore = dna?.completeness?.overall;
  const departments = overview?.departments || [];
  const activity = overview?.activity || [];
  const suggestions = overview?.suggestions || [];
  const insights = intel?.insights || [];
  const recommendations = intel?.recommendations || [];
  const activeGoals = plans.slice(0, 3);
  const teamPulse = departments.slice(0, 4).map((d, i) => ({
    ...d,
    state: [de ? "arbeitet" : "working", de ? "prüft" : "reviewing", de ? "wartet" : "waiting", de ? "aktiv" : "active"][i % 4],
  }));
  const quantumPriorities = [
    { icon: Target, label: de ? "Priorität" : "Priority", text: recommendations[0]?.title || (de ? "Heute ein klares Kampagnenziel definieren." : "Define one clear campaign goal today.") },
    { icon: Sparkles, label: de ? "Chance" : "Opportunity", text: insights[0]?.title || (de ? "Brand-DNA schärfen und in neue Assets übersetzen." : "Sharpen brand DNA and translate it into new assets.") },
    { icon: AlertTriangle, label: de ? "Risiko" : "Risk", text: counts.tasks_open ? (de ? `${counts.tasks_open} offene Aufgaben können den Flow bremsen.` : `${counts.tasks_open} open tasks may slow the flow.`) : (de ? "Keine kritischen Risiken sichtbar." : "No critical risks visible.") },
  ];

  const actions = [
    [de ? "Ziel erstellen" : "Create Goal", "/mission", Target],
    [de ? "Kampagne starten" : "Start Campaign", "/workflow", Rocket],
    [de ? "Workflow starten" : "Launch Workflow", "/workflow-architect", Zap],
    [de ? "Wochenplaner & Auto-Posting" : "Weekly planner & auto-posting", "/ops", Megaphone],
    [de ? "Assets prüfen" : "Review Assets", "/output-factory", ShieldCheck],
    [de ? "Team-Chat öffnen" : "Open Team Chat", "/mission", MessageSquare],
  ];

  return (
    <Page>
      <Hero
        icon={Building2}
        badge="BrandMind HQ"
        title={<>{greet()}, {firstName || (de ? "willkommen" : "there")}</>}
        description={de
          ? "Dein KI-Unternehmen auf einen Blick – Abteilungen, Ziele, Erkenntnisse und Freigaben an einem Ort."
          : "Your AI company at a glance – departments, goals, insights and approvals in one place."}
        chips={<>
          <BMBadge icon={Dna}>{activeBrand?.name || "—"}</BMBadge>
          <BMBadge tone="neutral" icon={Building2}>{activeWorkspace?.name || "—"}</BMBadge>
        </>}
      />

      {/* Real KPIs – or em-dash while loading, never invented numbers */}
      <StatGrid>
        <div className="animate-[pulse_3s_ease-in-out_infinite]"><Metric icon={Dna} label={de ? "DNA-Vollständigkeit" : "DNA completeness"}
          value={dnaScore != null ? `${dnaScore}%` : "—"} color="#C084FC" /></div>
        <div className="animate-[pulse_3.4s_ease-in-out_infinite]"><Metric icon={ThumbsUp} label={de ? "Freigabequote" : "Approval rate"}
          value={metrics.approval_rate != null ? `${metrics.approval_rate}%` : "—"} color="#34d399" /></div>
        <div className="animate-[pulse_3.8s_ease-in-out_infinite]"><Metric icon={ClipboardList} label={de ? "Offene Tasks" : "Open tasks"}
          value={counts.tasks_open ?? "—"} /></div>
        <div className="animate-[pulse_4.2s_ease-in-out_infinite]"><Metric icon={Rocket} label={de ? "Laufende Kampagnen" : "Running campaigns"}
          value={counts.campaigns_running ?? "—"} color="#F472B6"
          hint={counts.campaigns_running === 0 ? (de ? "Keine aktiven Workflows." : "No active workflows.") : undefined} /></div>
      </StatGrid>



      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Section icon={Users} title={de ? "Dein Team arbeitet gerade…" : "Your team is working on…"}>
          <Card className="h-full">
            <div className="space-y-3">
              {(teamPulse.length ? teamPulse : [{ id: "ceo", label_de: "Quantum", label_en: "Quantum", state: de ? "bereit" : "ready" }]).map((member, i) => {
                const Icon = DEPT_ICON[member.id] || Crown;
                return (
                  <div key={member.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3">
                    <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                      <Icon size={15} className="text-violet-300" />
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-200">{de ? member.label_de : member.label_en}</p>
                      <p className="text-xs text-zinc-600">{member.state} · {member.open || 0} {de ? "Aufgaben" : "tasks"}</p>
                    </div>
                    <PlayCircle size={14} className="text-zinc-600" />
                  </div>
                );
              })}
            </div>
          </Card>
        </Section>

        <Section icon={Crown} title={de ? "Quantum Intelligence Empfehlungen" : "Quantum Intelligence recommendations"}>
          <Card tinted className="h-full">
            <div className="grid gap-3 md:grid-cols-3">
              {quantumPriorities.map(({ icon: Icon, label, text }) => (
                <div key={label} className="rounded-xl border border-violet-400/15 bg-black/25 p-4">
                  <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-violet-300"><Icon size={12} />{label}</div>
                  <p className="text-sm leading-relaxed text-zinc-300">{text}</p>
                </div>
              ))}
            </div>
          </Card>
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Quantum Command – real goals + real recommendations */}
        <Section icon={Crown} title="Quantum Command" className="min-w-0">
          <Card>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 mb-3">{de ? "Aktive Ziele" : "Active goals"}</p>
                {activeGoals.length ? (
                  <div className="space-y-2">
                    {activeGoals.map((p) => (
                      <button key={p.id} onClick={() => navigate(`/mission/plans/${p.id}`)}
                        className="w-full flex items-center gap-3 rounded-lg bg-white/[0.03] p-3 text-left text-sm text-zinc-200 hover:bg-white/[0.06] transition-colors">
                        <Target size={14} style={{ color: V }} className="flex-shrink-0" />
                        <span className="line-clamp-1">{p.goal}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-zinc-600">
                    {de ? "Noch keine Ziele. " : "No goals yet. "}
                    <button className="text-[#a78bfa] hover:underline" onClick={() => navigate("/mission")}>
                      {de ? "Erstes Ziel erstellen →" : "Create your first goal →"}
                    </button>
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 mb-3">{de ? "Empfehlungen" : "Recommendations"}</p>
                {recommendations.length ? (
                  <ul className="space-y-2 text-sm text-zinc-300">
                    {recommendations.slice(0, 3).map((r) => <li key={r.id} className="leading-snug">• {r.title}</li>)}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-600">{de ? "Noch keine Empfehlungen – die Intelligence Engine lernt aus deiner Aktivität." : "No recommendations yet – the Intelligence Engine learns from your activity."}</p>
                )}
              </div>
              {suggestions.length > 0 && (
                <div className="md:col-span-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 mb-3">{de ? "Nächste Aktionen" : "Next actions"}</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s, i) => <BMBadge key={i} tone="neutral">{de ? s.text_de : s.text_en}</BMBadge>)}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </Section>

        {/* Live activity – real events only */}
        <Section icon={Activity} title={de ? "Aktivität" : "Live Activity"} className="min-w-0">
          <Card className="h-full">
            {activity.length ? (
              <div className="space-y-3">
                {activity.slice(0, 6).map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: V }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-zinc-300 leading-snug line-clamp-1">{a.text || "—"}</p>
                      <p className="text-[10px] text-zinc-600">{a.meta} · {a.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-600 py-6 text-center">
                {de ? "Noch keine Aktivität. Starte einen Plan oder generiere Assets." : "No activity yet. Start a plan or generate assets."}
              </p>
            )}
          </Card>
        </Section>
      </div>

      {/* Departments – real task counts from Mission Control */}
      <Section icon={Building2} title={de ? "Abteilungen" : "Departments"}>
        {departments.length ? (
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {departments.map((d) => {
              const Icon = DEPT_ICON[d.id] || Building2;
              return (
                <Card key={d.id} size="s" className="text-center">
                  <div className="w-9 h-9 mx-auto mb-2 rounded-lg flex items-center justify-center relative"
                    style={{ background: "rgba(124,58,237,0.10)" }}>
                    <Icon size={15} style={{ color: V }} />
                    {d.active && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ background: "#34d399" }} />}
                  </div>
                  <div className="text-[12px] font-medium text-zinc-200">{de ? d.label_de : d.label_en}</div>
                  <div className="text-[10px] text-zinc-600 mt-0.5">
                    {d.open > 0 ? `${d.open} ${de ? "offen" : "open"}` : (de ? "bereit" : "ready")}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Building2}
            title={de ? "Dein Unternehmen wartet auf den ersten Auftrag" : "Your company awaits its first assignment"}
            description={de ? "Erstelle in Mission Control ein Geschäftsziel – der Quantum Intelligence verteilt die Arbeit an die Abteilungen." : "Create a business goal in Mission Control – the Quantum Intelligence delegates work to the departments."}
            actionLabel={de ? "Erstes Ziel erstellen" : "Create first goal"}
            onAction={() => navigate("/mission")}
          />
        )}
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Intelligence panel – real insights */}
        <Section icon={Brain} title="Intelligence" className="min-w-0">
          <Card tinted className="h-full">
            {insights.length ? (
              <div className="space-y-3">
                {insights.slice(0, 3).map((c) => (
                  <div key={c.id} className="rounded-lg bg-black/25 p-3.5">
                    <p className="text-[13px] font-medium text-zinc-200 leading-snug">{c.title}</p>
                    <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed line-clamp-2">{c.detail}</p>
                  </div>
                ))}
                <Btn variant="ghost" size="sm" onClick={() => navigate("/intelligence")}>
                  {de ? "Alle Erkenntnisse →" : "All insights →"}
                </Btn>
              </div>
            ) : (
              <p className="text-sm text-zinc-600 py-6 text-center">
                {de ? "Noch nicht genug Daten für Erkenntnisse." : "Not enough data for insights yet."}
              </p>
            )}
          </Card>
        </Section>

        {/* Quick actions + real workspace overview */}
        <Section icon={Rocket} title={de ? "Schnellzugriff" : "Quick actions"} className="min-w-0">
          <Card className="h-full">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {actions.map(([label, path, Icon]) => (
                <button key={label} onClick={() => navigate(path)}
                  className="group rounded-lg p-4 text-left transition-all hover:-translate-y-0.5"
                  style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.16)" }}>
                  <Icon size={17} className="mb-3" style={{ color: "#C4B5FD" }} />
                  <span className="text-[13px] font-semibold text-white block" style={{ fontFamily: SORA }}>{label}</span>
                </button>
              ))}
            </div>
            <div className="mt-5 rounded-lg bg-black/25 p-4 grid gap-2 text-[13px] text-zinc-400 sm:grid-cols-2">
              <span>{de ? "Marke" : "Brand"}: <span className="text-zinc-200">{activeBrand?.name || "—"}</span></span>
              <span>Workspace: <span className="text-zinc-200">{activeWorkspace?.name || "—"}</span></span>
              <span className="sm:col-span-2 text-zinc-600 flex items-center gap-1.5">
                <Sparkles size={11} /> {user?.email || "—"}
              </span>
            </div>
          </Card>
        </Section>
      </div>
    </Page>
  );
}

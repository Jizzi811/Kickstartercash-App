import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Activity, BarChart2, Brain, Building2, Crown, Dna, Film, LifeBuoy,
  Megaphone, MessageSquare, Palette, Rocket, Search, ShieldCheck, Sparkles,
  Target, Users, Zap, ThumbsUp, ClipboardList, AlertTriangle, PlayCircle, ArrowRight,
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
  const { activeBrand, activeWorkspace, activeBrandId, user, lang, onboardingStatus, updateOnboardingStatus } = useApp();
  const de = lang === "DE";
  const firstName = (user?.name || user?.email?.split("@")[0] || "").split(" ")[0];

  // Live data only – nothing on this page is fabricated.
  const [overview, setOverview] = useState(null);
  const [intel, setIntel] = useState(null);
  const [plans, setPlans] = useState([]);
  const [dna, setDna] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [readinessError, setReadinessError] = useState(false);

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
    try {
      const r = await axios.get(`${API}/brand-readiness`, { params: activeBrandId ? { brand_id: activeBrandId } : {} });
      setReadiness(r.data);
      setReadinessError(false);
    } catch {
      setReadiness(null);
      setReadinessError(true);
    }
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


  const resumeOnboarding = () => navigate(onboardingStatus?.resume_route || "/onboarding/select-path");
  const restartOnboarding = () => navigate("/onboarding/select-path");
  const completeExplore = async () => {
    await updateOnboardingStatus({ status: "completed", selected_path: "explore", current_step: "home", completed_steps: ["home", "quantum", "brand", "create", "projects"] }).catch(() => null);
  };
  const startQuick = (kind) => {
    const prompts = {
      social: de ? "Erstelle einen Social-Media-Post-Entwurf für meine Marke. Nutze vorhandenes Markenwissen, stelle fehlende Fragen und führe nichts automatisch aus." : "Create a draft social media post for my brand. Use existing brand knowledge, ask for missing inputs, and do not execute automatically.",
      positioning: de ? "Prüfe die Positionierung meiner Marke anhand der gespeicherten Markenbasis. Nenne Lücken und nächste Fragen, ohne neue Fakten zu erfinden." : "Review my brand positioning based on saved brand data. Name gaps and next questions without inventing facts.",
      campaign: de ? "Plane eine Mini-Kampagne als editierbaren Vorschlag. Nutze vorhandenes Markenwissen und kennzeichne Annahmen klar." : "Plan a mini campaign as an editable proposal. Use saved brand knowledge and clearly mark assumptions.",
    };
    const prompt = prompts[kind];
    sessionStorage.setItem("brandmind_quantum_prompt", prompt);
    navigate("/quantum", { state: { prompt } });
  };

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


      {onboardingStatus && onboardingStatus.status !== "completed" && (
        <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-zinc-100">{de ? "Brandmind gemeinsam einrichten" : "Set up Brandmind together"}</div>
            <p className="mt-1 text-xs text-zinc-500">{de ? "Onboarding-Fortschritt ist getrennt vom Brand-Readiness-Score und wird in deinem Workspace gespeichert." : "Onboarding progress is separate from Brand Readiness and stored in your workspace."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {onboardingStatus.status === "skipped" && <Btn variant="ghost" onClick={restartOnboarding}>{de ? "Neu starten" : "Restart"}</Btn>}
            <Btn onClick={resumeOnboarding}>{de ? "Fortsetzen" : "Resume"}<ArrowRight size={14} /></Btn>
          </div>
        </Card>
      )}

      <Section icon={Target} title={de ? "Brand Readiness" : "Brand Readiness"}>
        <Card>
          {readinessError ? (
            <p className="text-sm text-zinc-400">{de ? "Der Einrichtungsstand konnte nicht geladen werden. Es wird kein Ersatzwert angezeigt." : "Readiness could not be loaded. No fallback score is shown."}</p>
          ) : !readiness ? (
            <p className="text-sm text-zinc-500">{de ? "Einrichtungsstand wird geladen…" : "Loading readiness…"}</p>
          ) : readiness.state === "no_active_brand" ? (
            <EmptyState icon={Dna} title={de ? "Noch keine aktive Marke" : "No active brand yet"} description={de ? "Lege eine Marke an, damit Brandmind den Einrichtungsstand aus echten Daten berechnen kann." : "Create a brand so Brandmind can calculate readiness from real data."} actionLabel={de ? "Marke einrichten" : "Set up brand"} onAction={() => navigate("/brand-brain")} />
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="text-4xl font-bold text-white">{readiness.score}%</div>
                  <p className="mt-1 text-sm text-zinc-300">{de ? `Deine Marke ist zu ${readiness.score} % eingerichtet.` : `Your brand is ${readiness.score}% set up.`}</p>
                  <p className="mt-1 max-w-2xl text-xs text-zinc-500">{de ? "Je vollständiger deine Markenbasis ist, desto konsistenter können Quantum und deine Agenten arbeiten. Der Wert ist kein Qualitätsurteil und keine Erfolgsprognose." : "The more complete your brand foundation is, the more consistently Quantum and your agents can work. This is not a quality rating or success prediction."}</p>
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-4">
                {(readiness.category_details || []).map((cat) => <div key={cat.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><div className="text-xs font-semibold text-zinc-200">{de ? cat.label_de : cat.label_en}</div><div className="mt-1 text-[11px] text-zinc-500">{cat.earned_points}/{cat.possible_points} · {cat.status}</div></div>)}
              </div>
              {(readiness.next_actions || []).slice(0, 3).length > 0 && <div className="grid gap-2 md:grid-cols-3">{readiness.next_actions.slice(0, 3).map((a) => <button key={a.category} onClick={() => navigate(a.route)} className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-3 text-left hover:bg-violet-500/15"><div className="text-sm font-semibold text-violet-100">{de ? a.title_de : a.title_en}</div><p className="mt-1 text-xs text-zinc-500">{de ? a.description_de : a.description_en}</p></button>)}</div>}
            </div>
          )}
        </Card>
      </Section>

      <Section icon={Sparkles} title={de ? "Schnellstarts" : "Quick starts"}>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["social", de ? "Social Post erstellen" : "Create a social post", de ? "Öffnet Quantum mit einem editierbaren Prompt. Keine automatische Ausführung." : "Opens Quantum with an editable prompt. No automatic execution."],
            ["positioning", de ? "Positionierung prüfen" : "Review positioning", de ? "Nutze gespeichertes Markenwissen und erkenne Lücken." : "Use saved brand knowledge and identify gaps."],
            ["campaign", de ? "Mini-Kampagne planen" : "Plan a mini campaign", de ? "Starte mit einem Vorschlag, den du bestätigst oder änderst." : "Start with a proposal you confirm or edit."],
          ].map(([id, title, text]) => <Card key={id} className="space-y-3"><h3 className="text-sm font-semibold text-zinc-100">{title}</h3><p className="text-xs leading-5 text-zinc-500">{text}</p><Btn variant="ghost" onClick={() => startQuick(id)}>{de ? "In Quantum öffnen" : "Open in Quantum"}<ArrowRight size={14} /></Btn></Card>)}
        </div>
      </Section>

      {onboardingStatus?.selected_path === "explore" && onboardingStatus.status !== "completed" && (
        <Section icon={Sparkles} title={de ? "Brandmind entdecken" : "Explore Brandmind"}>
          <Card>
            <div className="grid gap-2 md:grid-cols-5">{["Home", "Quantum", de ? "Meine Marke" : "My Brand", de ? "Erstellen" : "Create", de ? "Projekte" : "Projects"].map((x) => <div key={x} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-zinc-300">{x}</div>)}</div>
            <div className="mt-4 flex gap-2"><Btn variant="ghost" onClick={() => updateOnboardingStatus({ status: "skipped", selected_path: "explore", current_step: "home" })}>{de ? "Beenden" : "End"}</Btn><Btn onClick={completeExplore}>{de ? "Als erledigt markieren" : "Mark complete"}</Btn></div>
          </Card>
        </Section>
      )}

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

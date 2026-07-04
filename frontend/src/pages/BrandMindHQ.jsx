import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, BarChart2, Bot, Brain, Building2, CheckCircle2, Clock, Crown,
  Dna, Film, FlaskConical, HeartPulse, LifeBuoy, Megaphone, MessageSquare,
  Palette, Rocket, Search, ShieldCheck, Sparkles, Target, TrendingUp, Users,
  Zap,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

const SORA = "'Sora', sans-serif";

const departments = [
  { name: "Marketing", icon: Megaphone, workflows: 4, agents: 3, tasks: "Campaign launch kit", status: "Scaling", approvals: 2, tone: "from-violet-500 to-fuchsia-400" },
  { name: "Design", icon: Palette, workflows: 3, agents: 2, tasks: "Carousel + landing visuals", status: "Creating", approvals: 4, tone: "from-fuchsia-500 to-purple-300" },
  { name: "Video", icon: Film, workflows: 2, agents: 2, tasks: "Short-form ad storyboard", status: "Rendering", approvals: 1, tone: "from-indigo-500 to-sky-300" },
  { name: "SEO", icon: Search, workflows: 3, agents: 2, tasks: "Authority audit", status: "Auditing", approvals: 1, tone: "from-violet-600 to-emerald-300" },
  { name: "Sales", icon: Users, workflows: 2, agents: 2, tasks: "Lead follow-up sequence", status: "Queued", approvals: 3, tone: "from-purple-500 to-green-300" },
  { name: "Automation", icon: Zap, workflows: 5, agents: 2, tasks: "Approval routing", status: "Monitoring", approvals: 0, tone: "from-violet-500 to-amber-200" },
  { name: "Analytics", icon: BarChart2, workflows: 2, agents: 2, tasks: "Growth signal report", status: "Analyzing", approvals: 0, tone: "from-indigo-500 to-violet-300" },
  { name: "Support", icon: LifeBuoy, workflows: 1, agents: 1, tasks: "FAQ memory updates", status: "Triaging", approvals: 1, tone: "from-purple-500 to-cyan-300" },
  { name: "Research", icon: FlaskConical, workflows: 2, agents: 2, tasks: "Market signal brief", status: "Investigating", approvals: 2, tone: "from-violet-600 to-pink-300" },
];

const activity = [
  ["Designer created carousel", "2 min ago", Palette],
  ["SEO finished audit", "8 min ago", Search],
  ["Marketing started campaign", "14 min ago", Megaphone],
  ["CEO approved strategy", "22 min ago", Crown],
  ["Workflow completed", "31 min ago", CheckCircle2],
];

const insights = [
  "Audience resonance is strongest around founder-led growth stories.",
  "Two pending creative approvals are blocking campaign velocity.",
  "SEO content depth improved; internal linking still needs attention.",
];

function ShellCard({ children, className = "" }) {
  return <section className={`rounded-[1.35rem] border border-white/10 bg-white/[0.035] shadow-2xl shadow-violet-950/20 backdrop-blur-xl ${className}`}>{children}</section>;
}

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="mb-3 flex items-center justify-between text-zinc-500"><span className="text-[10px] uppercase tracking-[0.22em]">{label}</span><Icon size={15} className="text-violet-300" /></div>
      <div className="text-2xl font-semibold text-white" style={{ fontFamily: SORA }}>{value}</div>
    </div>
  );
}

function BrandMindHQ() {
  const navigate = useNavigate();
  const { activeBrand, activeWorkspace, model, user } = useApp();
  const brandName = activeBrand?.name || "BrandMind Demo";
  const workspaceName = activeWorkspace?.name || "Executive Workspace";

  const actions = [
    ["Create Goal", "/mission", Target],
    ["Start Campaign", "/workflow", Rocket],
    ["Launch Workflow", "/workflow-architect", Zap],
    ["Review Assets", "/output-factory", ShieldCheck],
    ["Open Team Chat", "/mission", MessageSquare],
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07050B] px-4 py-6 text-white sm:px-6 lg:px-8" style={{ fontFamily: SORA }}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(124,58,237,0.42),transparent_34%),radial-gradient(circle_at_80%_12%,rgba(192,132,252,0.22),transparent_30%),linear-gradient(180deg,rgba(12,10,18,0.2),#07050B_70%)]" />
      <div className="relative mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-5 rounded-[1.75rem] border border-violet-300/15 bg-black/30 p-6 shadow-2xl shadow-violet-950/40 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-violet-100"><Sparkles size={14} /> BrandMind HQ Alpha</div>
            <h1 className="max-w-4xl text-4xl font-bold tracking-[-0.05em] sm:text-5xl lg:text-6xl">Enter your AI company.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-300">A new home experience that turns Mission Control, departments, intelligence, memory and approvals into one executive operating floor.</p>
          </div>
          <div className="grid min-w-[260px] grid-cols-2 gap-3">
            <Metric label="Brand Health" value="91%" icon={HeartPulse} />
            <Metric label="DNA Score" value="87" icon={Dna} />
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <ShellCard className="p-6">
            <div className="mb-5 flex items-center gap-3"><Crown className="text-violet-300" /><h2 className="text-xl font-semibold">AI CEO Office</h2></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 p-5 ring-1 ring-violet-200/10"><p className="text-xs uppercase tracking-[0.22em] text-violet-200">Today&apos;s executive summary</p><p className="mt-3 text-sm leading-6 text-zinc-200">{brandName} is in active growth mode. Creative production is moving, SEO has delivered a fresh audit, and the next bottleneck is human approval on campaign assets.</p></div>
              <div className="space-y-3"><p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Active goals</p>{["Launch authority campaign", "Improve offer clarity", "Increase qualified lead flow"].map((x) => <div key={x} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-200"><Target size={14} className="text-violet-300" />{x}</div>)}</div>
              <div><p className="mb-3 text-xs uppercase tracking-[0.22em] text-zinc-500">Recommendations</p><ul className="space-y-2 text-sm text-zinc-300">{["Approve top carousel before campaign launch.", "Turn SEO audit into three content tasks.", "Route sales objections into Brand Brain memory."].map((x) => <li key={x}>• {x}</li>)}</ul></div>
              <div><p className="mb-3 text-xs uppercase tracking-[0.22em] text-zinc-500">Running initiatives</p><div className="space-y-2">{["Campaign Launch", "Brand DNA Refresh", "Workflow QA"].map((x) => <div key={x} className="flex items-center justify-between rounded-xl bg-black/25 p-3 text-sm"><span>{x}</span><span className="text-violet-300">Live</span></div>)}</div></div>
            </div>
          </ShellCard>

          <ShellCard className="p-6">
            <div className="mb-5 flex items-center gap-3"><Activity className="text-violet-300" /><h2 className="text-xl font-semibold">Live Activity Feed</h2></div>
            <div className="space-y-3">{activity.map(([text, time, Icon]) => <div key={text} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-3"><div className="rounded-xl bg-violet-400/10 p-2 text-violet-200"><Icon size={15} /></div><div className="flex-1"><p className="text-sm text-zinc-100">{text}</p><p className="text-xs text-zinc-600">{time}</p></div><span className="h-2 w-2 rounded-full bg-emerald-300" /></div>)}</div>
          </ShellCard>
        </div>

        <ShellCard className="p-6">
          <div className="mb-5 flex items-center gap-3"><Building2 className="text-violet-300" /><h2 className="text-xl font-semibold">Departments</h2></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{departments.map((d) => <div key={d.name} className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-3"><div className={`rounded-2xl bg-gradient-to-br ${d.tone} p-3`}><d.icon size={18} /></div><div><h3 className="font-semibold">{d.name}</h3><p className="text-xs text-zinc-500">{d.status}</p></div></div><Clock size={14} className="text-zinc-600" /></div><div className="grid grid-cols-3 gap-2 text-center"><Metric label="Workflows" value={d.workflows} icon={Zap} /><Metric label="Agents" value={d.agents} icon={Bot} /><Metric label="Approvals" value={d.approvals} icon={ShieldCheck} /></div><p className="mt-4 rounded-xl bg-white/[0.03] p-3 text-xs text-zinc-300"><span className="text-zinc-500">Current task:</span> {d.tasks}</p></div>)}</div>
        </ShellCard>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <ShellCard className="p-6"><div className="mb-5 flex items-center gap-3"><Brain className="text-violet-300" /><h2 className="text-xl font-semibold">Intelligence Panel</h2></div><div className="space-y-4">{insights.map((x) => <p key={x} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-zinc-300">{x}</p>)}<div className="grid grid-cols-2 gap-3"><Metric label="Suggestions" value="7" icon={Sparkles} /><Metric label="Memory Updates" value="12" icon={Brain} /></div></div></ShellCard>
          <ShellCard className="p-6"><div className="mb-5 flex items-center gap-3"><Rocket className="text-violet-300" /><h2 className="text-xl font-semibold">Mission Control Widget</h2></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{actions.map(([label, path, Icon]) => <button key={label} onClick={() => navigate(path)} className="group rounded-2xl border border-violet-300/15 bg-violet-400/10 p-4 text-left transition hover:-translate-y-0.5 hover:border-violet-200/35 hover:bg-violet-400/15"><Icon size={18} className="mb-4 text-violet-200" /><span className="text-sm font-semibold text-white">{label}</span></button>)}</div><div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4"><p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Workspace Overview</p><div className="mt-4 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2"><span>Brand: {brandName}</span><span>Workspace: {workspaceName}</span><span>Subscription: Alpha Pro</span><span>Provider: Operational</span><span className="sm:col-span-2">Active AI models: {model}, brand-safe router, memory reviewer</span><span className="sm:col-span-2 text-zinc-600">Signed in as {user?.email || "workspace owner"}</span></div></div></ShellCard>
        </div>
      </div>
    </main>
  );
}

export default BrandMindHQ;

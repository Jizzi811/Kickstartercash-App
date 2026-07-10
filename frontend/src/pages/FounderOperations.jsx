import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Calendar, Link2, Loader2, Play, Plus, Send, Workflow } from "lucide-react";
import { API } from "@/context/AppContext";
import { Page, Hero, Card, Btn, FieldLabel, Input, Textarea, BMBadge } from "@/components/bm";

const DEFAULT_PLATFORMS = ["LinkedIn", "Instagram", "X", "Facebook"];
const WEEK_DAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

function formatSchedule(value) {
  if (!value) return "Sofort / nächster Slot";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function getWeekdayIndex(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return 0;
  return (date.getDay() + 6) % 7;
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm transition ${active ? "bg-violet-500/20 text-violet-200" : "bg-white/5 text-zinc-400 hover:text-zinc-200"}`}
    >
      {children}
    </button>
  );
}

export default function FounderOperations() {
  const [tab, setTab] = useState("social");
  const [loading, setLoading] = useState(true);

  const [connections, setConnections] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobForm, setJobForm] = useState({ platform: "LinkedIn", content: "", tags: "", scheduled_for: "" });

  const [board, setBoard] = useState({ columns: [], tasks_by_column: {} });
  const [taskForm, setTaskForm] = useState({ title: "", column: "vision", priority: "medium" });

  const [templates, setTemplates] = useState([]);

  const load = async () => {
    const [connRes, jobsRes, boardRes, tplRes] = await Promise.all([
      axios.get(`${API}/social/connections`),
      axios.get(`${API}/social/publish-jobs`),
      axios.get(`${API}/planner/board`),
      axios.get(`${API}/ops/workflow-templates`),
    ]);
    setConnections(connRes.data.connections || []);
    setJobs(jobsRes.data.jobs || []);
    setBoard(boardRes.data || { columns: [], tasks_by_column: {} });
    setTemplates(tplRes.data.templates || []);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await load();
      } catch (error) {
        console.warn(error);
        toast.error("Content Ops konnte nicht geladen werden");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const connectPlatform = async (platform) => {
    try {
      await axios.post(`${API}/social/connections`, { platform, account_handle: "", active: true });
      await load();
      toast.success(`${platform} verbunden`);
    } catch (error) {
      console.warn(error);
      toast.error("Verbindung fehlgeschlagen");
    }
  };

  const queueJob = async () => {
    if (!jobForm.content.trim()) return toast.error("Bitte Content eintragen");
    try {
      await axios.post(`${API}/social/publish-jobs`, {
        platform: jobForm.platform,
        content: jobForm.content,
        tags: jobForm.tags.split(",").map((item) => item.trim()).filter(Boolean),
        scheduled_for: jobForm.scheduled_for ? new Date(jobForm.scheduled_for).toISOString() : "",
      });
      setJobForm((prev) => ({ ...prev, content: "", tags: "", scheduled_for: "" }));
      await load();
      toast.success("Post wurde zur Queue hinzugefügt");
    } catch (error) {
      console.warn(error);
      toast.error("Queue-Eintrag fehlgeschlagen");
    }
  };

  const dispatchJob = async (jobId) => {
    try {
      await axios.post(`${API}/social/publish-jobs/${jobId}/dispatch`);
      await load();
      toast.success("Post als veröffentlicht markiert");
    } catch (error) {
      console.warn(error);
      toast.error("Dispatch fehlgeschlagen");
    }
  };

  const addPlannerTask = async () => {
    if (!taskForm.title.trim()) return toast.error("Bitte Task-Titel eingeben");
    try {
      await axios.post(`${API}/planner/tasks`, taskForm);
      setTaskForm((prev) => ({ ...prev, title: "" }));
      await load();
      toast.success("Task hinzugefügt");
    } catch (error) {
      console.warn(error);
      toast.error("Task konnte nicht erstellt werden");
    }
  };

  const moveTask = async (task, nextColumn) => {
    try {
      await axios.put(`${API}/planner/tasks/${task.id}`, { column: nextColumn });
      await load();
    } catch (error) {
      console.warn(error);
      toast.error("Task konnte nicht verschoben werden");
    }
  };

  const runTemplate = async (templateId) => {
    try {
      await axios.post(`${API}/ops/workflow-templates/${templateId}/run`);
      await load();
      toast.success("Workflow ausgeführt");
    } catch (error) {
      console.warn(error);
      toast.error("Workflow konnte nicht ausgeführt werden");
    }
  };

  const connectedPlatforms = useMemo(() => new Set((connections || []).map((item) => item.platform)), [connections]);
  const jobsByWeekday = useMemo(() => {
    const grouped = WEEK_DAYS.map((day) => ({ day, jobs: [] }));
    (jobs || []).forEach((job) => grouped[getWeekdayIndex(job.scheduled_for)].jobs.push(job));
    grouped.forEach((group) => group.jobs.sort((a, b) => String(a.scheduled_for || "").localeCompare(String(b.scheduled_for || ""))));
    return grouped;
  }, [jobs]);

  return (
    <Page>
      <Hero
        icon={Workflow}
        badge="Content Ops"
        title="Content Ops Hub"
        description="Wochenplaner, Auto-Posting Queue und Workflow-Templates für Gründer, Teams und bestehende Unternehmen."
      />

      <div className="flex flex-wrap gap-2">
        <TabButton active={tab === "social"} onClick={() => setTab("social")}>Auto-Posting</TabButton>
        <TabButton active={tab === "week"} onClick={() => setTab("week")}>Wochenplaner</TabButton>
        <TabButton active={tab === "planner"} onClick={() => setTab("planner")}>Task-Board</TabButton>
        <TabButton active={tab === "workflows"} onClick={() => setTab("workflows")}>Workflow Templates</TabButton>
      </div>

      {loading ? (
        <Card>
          <div className="inline-flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 size={14} className="animate-spin" />
            Content Ops wird geladen…
          </div>
        </Card>
      ) : (
        <>
          {tab === "social" && (
            <section className="grid gap-4 lg:grid-cols-2">
              <Card className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Plattformen verbinden</h3>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_PLATFORMS.map((platform) => (
                    <Btn key={platform} variant={connectedPlatforms.has(platform) ? "secondary" : "ghost"} size="sm" onClick={() => connectPlatform(platform)}>
                      <Link2 size={13} />
                      {platform}
                    </Btn>
                  ))}
                </div>
                <p className="text-xs text-zinc-500">MVP-Connect als vorbereiteter Workspace-Link (OAuth-Follow-up möglich).</p>
              </Card>

              <Card className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Post in Queue legen</h3>
                <div className="grid gap-3">
                  <div>
                    <FieldLabel>Plattform</FieldLabel>
                    <Input value={jobForm.platform} onChange={(event) => setJobForm((prev) => ({ ...prev, platform: event.target.value }))} />
                  </div>
                  <div>
                    <FieldLabel>Content</FieldLabel>
                    <Textarea rows={4} value={jobForm.content} onChange={(event) => setJobForm((prev) => ({ ...prev, content: event.target.value }))} />
                  </div>
                  <div>
                    <FieldLabel>Geplanter Zeitpunkt</FieldLabel>
                    <Input type="datetime-local" value={jobForm.scheduled_for} onChange={(event) => setJobForm((prev) => ({ ...prev, scheduled_for: event.target.value }))} />
                  </div>
                  <div>
                    <FieldLabel>Tags (Komma-getrennt)</FieldLabel>
                    <Input value={jobForm.tags} onChange={(event) => setJobForm((prev) => ({ ...prev, tags: event.target.value }))} />
                  </div>
                  <Btn onClick={queueJob}><Plus size={14} />In Queue legen</Btn>
                </div>
              </Card>

              <Card className="space-y-3 lg:col-span-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Publish Queue</h3>
                {(jobs || []).length ? jobs.map((job) => (
                  <div key={job.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <BMBadge tone={job.status === "published" ? "success" : "info"}>{job.status}</BMBadge>
                      <span className="text-sm font-semibold text-zinc-100">{job.platform}</span>
                    </div>
                    <p className="mb-1 text-[11px] text-violet-300">{formatSchedule(job.scheduled_for)}</p>
                    <p className="text-xs text-zinc-400">{job.content}</p>
                    {job.status !== "published" && (
                      <Btn size="sm" className="mt-2" onClick={() => dispatchJob(job.id)}>
                        <Send size={13} />
                        Dispatch
                      </Btn>
                    )}
                  </div>
                )) : <p className="text-sm text-zinc-500">Noch keine Queue-Einträge.</p>}
              </Card>
            </section>
          )}

          {tab === "week" && (
            <section className="space-y-4">
              <Card className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Wochenplaner für alle Workspaces</h3>
                  <p className="mt-1 text-sm text-zinc-500">Plane Posts zeitlich vor und behalte die Veröffentlichungen der ganzen Woche im Blick.</p>
                </div>
                <Btn variant="ghost" onClick={() => setTab("social")}><Plus size={14} />Post planen</Btn>
              </Card>
              <div className="grid gap-4 lg:grid-cols-7">
                {jobsByWeekday.map((group) => (
                  <Card key={group.day} className="space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-200">{group.day}</h3>
                    {group.jobs.length ? group.jobs.map((job) => (
                      <div key={job.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <BMBadge tone={job.status === "published" ? "success" : "info"}>{job.status}</BMBadge>
                          <span className="text-xs font-semibold text-zinc-200">{job.platform}</span>
                        </div>
                        <p className="mb-1 text-[11px] text-violet-300">{formatSchedule(job.scheduled_for)}</p>
                        <p className="line-clamp-4 text-xs text-zinc-500">{job.content}</p>
                      </div>
                    )) : <p className="text-xs text-zinc-600">Noch nichts geplant.</p>}
                  </Card>
                ))}
              </div>
            </section>
          )}

          {tab === "planner" && (
            <section className="space-y-4">
              <Card>
                <div className="grid gap-3 md:grid-cols-4">
                  <Input placeholder="Neuer Task-Titel" value={taskForm.title} onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))} />
                  <Input placeholder="Column" value={taskForm.column} onChange={(event) => setTaskForm((prev) => ({ ...prev, column: event.target.value }))} />
                  <Input placeholder="Priority" value={taskForm.priority} onChange={(event) => setTaskForm((prev) => ({ ...prev, priority: event.target.value }))} />
                  <Btn onClick={addPlannerTask}><Plus size={14} />Task hinzufügen</Btn>
                </div>
              </Card>

              <div className="grid gap-4 lg:grid-cols-5">
                {(board.columns || []).map((column, columnIndex) => (
                  <Card key={column.id} className="space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-200">{column.title}</h3>
                    {(board.tasks_by_column?.[column.id] || []).map((task) => (
                      <div key={task.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                        <p className="text-sm font-semibold text-zinc-100">{task.title}</p>
                        <p className="mt-1 text-xs text-zinc-500">{task.source}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {columnIndex > 0 && (
                            <Btn size="sm" variant="ghost" onClick={() => moveTask(task, board.columns[columnIndex - 1].id)}>←</Btn>
                          )}
                          {columnIndex < (board.columns.length - 1) && (
                            <Btn size="sm" variant="ghost" onClick={() => moveTask(task, board.columns[columnIndex + 1].id)}>→</Btn>
                          )}
                        </div>
                      </div>
                    ))}
                    {(board.tasks_by_column?.[column.id] || []).length === 0 && (
                      <p className="text-xs text-zinc-600">Keine Tasks.</p>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          )}

          {tab === "workflows" && (
            <section className="grid gap-4 md:grid-cols-3">
              {(templates || []).map((template) => (
                <Card key={template.id} className="space-y-3">
                  <BMBadge tone="violet"><Calendar size={12} />Template</BMBadge>
                  <h3 className="text-base font-semibold text-zinc-100">{template.name}</h3>
                  <p className="text-sm text-zinc-400">{template.description}</p>
                  <Btn onClick={() => runTemplate(template.id)}>
                    <Play size={14} />
                    Ausführen
                  </Btn>
                </Card>
              ))}
            </section>
          )}
        </>
      )}
    </Page>
  );
}

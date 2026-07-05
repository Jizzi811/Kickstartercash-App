export const WORKFLOW_STATUSES = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  SKIPPED: "skipped",
};

const now = () => new Date().toISOString();
const preview = (value, max = 140) => String(value || "").slice(0, max);

export function createSharedContext(analysis, inputs = {}) {
  return {
    campaignGoal: analysis.goal,
    platform: analysis.platform,
    audience: inputs.audience || "Gründer, Creator und kleine Teams mit Wachstumsziel",
    brandContext: inputs.brandContext || "BrandMind: Premium, klar, umsetzungsorientiert und KI-nativ.",
    inputs: { prompt: analysis.prompt, requiredSkills: analysis.requiredSkills, ...inputs },
    outputs: {},
  };
}

export function createOutputBus() {
  return {
    byStepId: {},
    byAgentId: {},
    publish(step, output) {
      this.byStepId[step.id] = output;
      this.byAgentId[step.agentId] = [...(this.byAgentId[step.agentId] || []), output];
      return this.snapshot();
    },
    snapshot() {
      return {
        byStepId: { ...this.byStepId },
        byAgentId: { ...this.byAgentId },
        all: Object.values(this.byStepId),
      };
    },
  };
}

export function createWorkflow({ analysis, selectedAgents, executionPlan, inputs = {} }) {
  const sharedContext = createSharedContext(analysis, inputs);
  const steps = executionPlan.map((planStep, index) => {
    const agent = selectedAgents.find((candidate) => candidate.name === planStep.agent) || selectedAgents[index];
    return {
      ...planStep,
      id: `wf-step-${index + 1}`,
      order: index + 1,
      agentId: agent?.id || `agent-${index + 1}`,
      agentName: planStep.agent,
      status: WORKFLOW_STATUSES.PENDING,
      progress: 0,
      durationMs: 0,
      startedAt: null,
      completedAt: null,
      output: null,
      outputPreview: "",
      dependencies: index === 0 ? [] : [`wf-step-${index}`],
    };
  });

  return {
    id: `workflow-${Date.now()}`,
    status: WORKFLOW_STATUSES.PENDING,
    progress: 0,
    createdAt: now(),
    startedAt: null,
    completedAt: null,
    analysis,
    selectedAgents,
    sharedContext,
    outputBus: createOutputBus().snapshot(),
    activity: [{ id: "activity-created", at: now(), type: "system", message: "Workflow wurde aus Analyse, Agent Matching und Execution Plan erstellt." }],
    steps,
  };
}

export function runMockAgent(step, sharedContext, outputBusSnapshot = {}) {
  const priorOutputs = Object.values(outputBusSnapshot.byStepId || {}).map((item) => item.summary);
  const deliverable = step.expectedOutput;
  const output = {
    id: `output-${step.id}`,
    stepId: step.id,
    agentId: step.agentId,
    agentName: step.agentName,
    title: deliverable,
    summary: `${step.agentName} liefert ${deliverable} für ${sharedContext.campaignGoal} auf ${sharedContext.platform}.`,
    artifacts: [
      `${deliverable}: Kernidee für ${sharedContext.audience}`,
      `Brand-Fit: ${preview(sharedContext.brandContext, 80)}`,
      priorOutputs.length ? `Nutzt Vorarbeit: ${preview(priorOutputs.join(" | "), 100)}` : "Startet mit primärem Briefing.",
    ],
    createdAt: now(),
  };
  return output;
}

const addActivity = (workflow, message, type = "agent") => ({
  ...workflow,
  activity: [...workflow.activity, { id: `activity-${workflow.activity.length + 1}`, at: now(), type, message }],
});

export function startWorkflow(workflow) {
  return addActivity({ ...workflow, status: WORKFLOW_STATUSES.RUNNING, startedAt: now() }, "Workflow gestartet. Quantum koordiniert die Agenten.", "system");
}

export function completeNextWorkflowStep(workflow) {
  const stepIndex = workflow.steps.findIndex((step) => step.status === WORKFLOW_STATUSES.PENDING);
  if (stepIndex === -1) return workflow;

  const outputBus = createOutputBus();
  Object.values(workflow.outputBus.byStepId || {}).forEach((output) => outputBus.publish({ id: output.stepId, agentId: output.agentId }, output));
  const step = { ...workflow.steps[stepIndex], status: WORKFLOW_STATUSES.RUNNING, startedAt: now(), progress: 45 };
  const output = runMockAgent(step, workflow.sharedContext, workflow.outputBus);
  const completedStep = { ...step, status: WORKFLOW_STATUSES.COMPLETED, progress: 100, durationMs: 650 + stepIndex * 180, completedAt: now(), output, outputPreview: preview(output.summary) };
  const outputBusSnapshot = outputBus.publish(completedStep, output);
  const steps = workflow.steps.map((candidate, index) => (index === stepIndex ? completedStep : candidate));
  const completed = steps.filter((candidate) => candidate.status === WORKFLOW_STATUSES.COMPLETED).length;
  const isDone = completed === steps.length;
  const sharedContext = { ...workflow.sharedContext, outputs: outputBusSnapshot.byStepId };

  return addActivity({ ...workflow, steps, outputBus: outputBusSnapshot, sharedContext, progress: Math.round((completed / steps.length) * 100), status: isDone ? WORKFLOW_STATUSES.COMPLETED : WORKFLOW_STATUSES.RUNNING, completedAt: isDone ? now() : null }, `${completedStep.agentName} hat ${completedStep.expectedOutput} erstellt.`, "agent");
}

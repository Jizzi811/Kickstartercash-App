export const AGENT_REGISTRY = [
  { id: "marketing_strategist", name: "Marketing Strategist", priority: "High", cost: "Medium", skills: ["Strategy", "Social", "Campaign", "Audience", "Positioning"], outputs: ["Campaign positioning", "Audience angle", "Channel strategy"], role: "Strategy" },
  { id: "design_director", name: "Design Director", priority: "High", cost: "Medium", skills: ["Design", "Branding", "Visuals", "Banner", "9:16"], outputs: ["Social visuals", "Banner brief", "Visual system"], role: "Visuals" },
  { id: "video_producer", name: "Video Producer", priority: "High", cost: "High", skills: ["Video", "Reel", "Storyboard", "Motion", "9:16"], outputs: ["Reel plan", "Shot list", "Storyboard"], role: "Video Production" },
  { id: "copy_specialist", name: "Copy Specialist", priority: "High", cost: "Low", skills: ["Copy", "Hooks", "Ads", "Landing Copy", "CTA"], outputs: ["Headlines", "Captions", "CTA variants"], role: "Copywriting" },
  { id: "social_manager", name: "Social Media Manager", priority: "Medium", cost: "Medium", skills: ["Social", "Publishing", "Facebook", "Calendar", "Hashtags"], outputs: ["Posting plan", "Channel checklist", "Community prompts"], role: "Publishing" },
  { id: "seo_expert", name: "SEO Expert", priority: "High", cost: "Medium", skills: ["SEO", "Google", "Keywords", "Technical SEO", "Landing Page"], outputs: ["Keyword plan", "SEO audit", "Metadata recommendations"], role: "SEO Optimization" },
  { id: "analytics_expert", name: "Analytics Expert", priority: "Medium", cost: "Low", skills: ["Analytics", "KPIs", "Reporting", "Experiments", "Attribution"], outputs: ["KPI plan", "Tracking checklist", "Optimization agenda"], role: "Analytics" },
];

export const DEMO_PROMPTS = [
  "Erstelle eine Facebook-Kampagne für BrandMind.",
  "Plane ein 9:16 Reel für ein neues Produkt.",
  "Optimiere meine Landingpage für SEO.",
];

const RULES = [
  { test: ["facebook", "kampagne", "campaign", "ad"], goal: "Kampagne erstellen", industry: "Social Marketing", output: "Facebook-Kampagnenplan", platform: "Facebook", skills: ["Social", "Copy", "Design", "Analytics", "Campaign"], priority: "High", complexity: "Medium" },
  { test: ["reel", "9:16", "video", "short"], goal: "Kurzvideo planen", industry: "Video / Social Content", output: "9:16 Reel-Konzept", platform: "Instagram Reels / TikTok", skills: ["Video", "Copy", "Design", "Social", "Reel", "9:16"], priority: "High", complexity: "Medium" },
  { test: ["seo", "google", "landingpage", "website", "ranking"], goal: "Suchmaschinenoptimierung", industry: "SEO / Website Growth", output: "SEO-Optimierungsplan", platform: "Google / Website", skills: ["SEO", "Copy", "Analytics", "Google", "Keywords", "Landing Page"], priority: "High", complexity: "High" },
];

const normalize = (value) => value.toLowerCase();
const unique = (items) => [...new Set(items.filter(Boolean))];

export function analyzeTask(prompt = "") {
  const text = normalize(prompt);
  const hits = RULES.filter((rule) => rule.test.some((token) => text.includes(token)));
  const fallback = { goal: "Workflow ableiten", industry: "Allgemeiner Business-Kontext", output: "Ausführbarer Arbeitsplan", platform: "Noch offen", skills: ["Strategy", "Copy", "Analytics"], priority: "Medium", complexity: "Medium" };
  const base = hits[0] || fallback;
  const hitSkills = unique(hits.flatMap((hit) => hit.skills));

  return {
    prompt,
    goal: base.goal,
    industry: base.industry,
    desiredOutput: base.output,
    platform: base.platform,
    requiredSkills: hitSkills.length ? hitSkills : base.skills,
    priority: hits.some((hit) => hit.priority === "High") ? "High" : base.priority,
    complexity: hits.some((hit) => hit.complexity === "High") ? "High" : base.complexity,
  };
}

export function matchAgents(analysis, registry = AGENT_REGISTRY) {
  const required = analysis.requiredSkills.map(normalize);

  return registry
    .map((agent) => {
      const agentSkills = agent.skills.map(normalize);
      const matchingSkills = agent.skills.filter((skill) => required.includes(normalize(skill)));
      const missingSkills = analysis.requiredSkills.filter((skill) => !agentSkills.includes(normalize(skill)));
      const coverage = matchingSkills.length / Math.max(analysis.requiredSkills.length, 1);
      const matchScore = Math.min(99, Math.round(coverage * 85 + (matchingSkills.length ? 10 : 0) + (agent.priority === "High" ? 4 : 0)));

      return {
        ...agent,
        matchScore,
        matchingSkills,
        missingSkills,
        selectionReason: matchingSkills.length
          ? `Deckt ${matchingSkills.join(", ")} ab und liefert ${agent.outputs[0]}.`
          : `Reserve-Agent für angrenzende Aufgaben im Bereich ${agent.role}.`,
        recommendedRole: agent.role,
      };
    })
    .filter((agent) => agent.matchScore >= 20)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
}

export function createExecutionPlan(analysis, matchedAgents) {
  return matchedAgents.map((agent, index) => ({
    id: `${index + 1}`,
    phase: agent.recommendedRole,
    agent: agent.name,
    task: `${agent.recommendedRole} für: ${analysis.goal}`,
    expectedOutput: agent.outputs[0],
    priority: index < 2 ? "High" : analysis.priority,
    status: index === 0 ? "ready" : "queued",
    dependencies: index === 0 ? [] : [matchedAgents[index - 1].name],
  }));
}

export function orchestrateQuantumWorkflow(prompt) {
  const analysis = analyzeTask(prompt);
  const selectedAgents = matchAgents(analysis);
  const executionPlan = createExecutionPlan(analysis, selectedAgents);

  return {
    analysis,
    selectedAgents,
    executionPlan,
    expectedOutputs: executionPlan.map((step) => step.expectedOutput),
  };
}

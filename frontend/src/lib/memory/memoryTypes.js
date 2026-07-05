export const MEMORY_TYPES = Object.freeze({
  BRAND: "brand",
  USER: "user",
  PROJECT: "project",
  EXPERIENCE: "experience",
});

export const MEMORY_TYPE_DEFINITIONS = Object.freeze({
  [MEMORY_TYPES.BRAND]: {
    label: "Brand Memory",
    description: "Stores long-lived brand identity, positioning and CI knowledge.",
    fields: ["brandName", "colors", "logo", "tone", "audiences", "products", "ciRules"],
    examples: [
      "BrandMind uses premium AI-SaaS positioning.",
      "CI rules define colors, logo usage and tonal guardrails.",
    ],
  },
  [MEMORY_TYPES.USER]: {
    label: "User Memory",
    description: "Stores user preferences that make Quantum interactions more personal.",
    fields: ["preferredLanguage", "preferredPlatforms", "preferredContentFormats", "writingStyle", "frequentAgents"],
    examples: [
      "Preferred language: German.",
      "Preferred formats: campaign plans, reels, checklists.",
    ],
  },
  [MEMORY_TYPES.PROJECT]: {
    label: "Project Memory",
    description: "Stores project context, campaign history and workflow decisions.",
    fields: ["campaigns", "workflows", "agentExecutions", "outputs", "decisions", "files"],
    examples: [
      "Facebook campaign workflow planned.",
      "Marketing, Design, Copy and Analytics agents were selected.",
    ],
  },
  [MEMORY_TYPES.EXPERIENCE]: {
    label: "Experience Memory",
    description: "Stores outcomes, lessons learned and recurring optimization patterns.",
    fields: ["performanceResults", "workedWell", "workedPoorly", "optimizationRecommendations", "recurringPatterns"],
    examples: [
      "No real performance data available yet.",
      "Future runs can compare outputs with conversion KPIs.",
    ],
  },
});

export const MEMORY_TYPE_LIST = Object.values(MEMORY_TYPES);

export function isValidMemoryType(type) {
  return MEMORY_TYPE_LIST.includes(type);
}

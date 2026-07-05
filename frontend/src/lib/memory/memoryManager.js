import { localMemoryAdapter } from "./adapters/localMemoryAdapter";
import { MEMORY_TYPES } from "./memoryTypes";

class MemoryManager {
  constructor(provider = localMemoryAdapter) {
    this.provider = provider;
  }

  setProvider(provider) { this.provider = provider; return this; }
  getProvider() { return this.provider; }
  saveMemory(type, payload) { return this.provider.saveMemory(type, payload); }
  getMemory(type, filters) { return this.provider.getMemory(type, filters); }
  updateMemory(id, payload) { return this.provider.updateMemory(id, payload); }
  deleteMemory(id) { return this.provider.deleteMemory(id); }
  searchMemory(query, options) { return this.provider.searchMemory(query, options); }
  summarizeMemory(type) { return this.provider.summarizeMemory(type); }
  getRelevantMemory(context) { return this.provider.getRelevantMemory(context); }
}

export function createMemoryPreviewFromWorkflow(result) {
  if (!result) return [];
  const agentNames = result.selectedAgents?.map((agent) => agent.name) || [];
  return [
    { type: MEMORY_TYPES.BRAND, title: "Brand Memory", items: ["BrandMind nutzt Premium-AI-SaaS-Positionierung.", `Tonalität bleibt strategisch für ${result.analysis?.industry || "Business-Kontext"}.`] },
    { type: MEMORY_TYPES.PROJECT, title: "Project Memory", items: [`${result.analysis?.platform || "Kampagne"} wurde geplant.`, `${agentNames.join(", ") || "Quantum-Agenten"} wurden ausgewählt.`, `${result.executionPlan?.length || 0} Workflow-Schritte wurden vorbereitet.`] },
    { type: MEMORY_TYPES.EXPERIENCE, title: "Experience Memory", items: ["Noch keine echten Performance-Daten vorhanden.", "Optimierungsempfehlungen werden nach Human Approval und echten Ergebnissen gespeichert."] },
  ];
}

export const memoryManager = new MemoryManager();
export { MemoryManager };

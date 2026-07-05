import { MemoryProvider } from "../memoryProvider";

// Placeholder only: this adapter documents the expected agimem integration shape.
// TODO: Review agimem setup before implementation: https://agimem.dev/setup
// TODO: Keep API keys and secrets outside the repo, e.g. environment variables or secure backend vaults.
// TODO: Consider MCP integration so Quantum can call agimem through an approved server/tool boundary.
// TODO: Map Quantum memory types to agimem collections/namespaces without coupling app code to agimem specifics.
export class AgimemAdapterPlaceholder extends MemoryProvider {
  constructor() {
    super({ id: "agimem-placeholder", label: "agimem / MCP-ready", status: "placeholder" });
  }

  async saveMemory() { throw new Error("agimem adapter is a placeholder. Configure a real provider later."); }
  async getMemory() { throw new Error("agimem adapter is a placeholder. Configure a real provider later."); }
  async updateMemory() { throw new Error("agimem adapter is a placeholder. Configure a real provider later."); }
  async deleteMemory() { throw new Error("agimem adapter is a placeholder. Configure a real provider later."); }
  async searchMemory() { throw new Error("agimem adapter is a placeholder. Configure a real provider later."); }
  async summarizeMemory() { throw new Error("agimem adapter is a placeholder. Configure a real provider later."); }
  async getRelevantMemory() { throw new Error("agimem adapter is a placeholder. Configure a real provider later."); }
}

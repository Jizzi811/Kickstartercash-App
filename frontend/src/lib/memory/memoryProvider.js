export class MemoryProvider {
  constructor({ id, label, status = "inactive" } = {}) {
    this.id = id;
    this.label = label;
    this.status = status;
  }

  async saveMemory() { throw new Error("saveMemory must be implemented by a memory adapter."); }
  async getMemory() { throw new Error("getMemory must be implemented by a memory adapter."); }
  async updateMemory() { throw new Error("updateMemory must be implemented by a memory adapter."); }
  async deleteMemory() { throw new Error("deleteMemory must be implemented by a memory adapter."); }
  async searchMemory() { throw new Error("searchMemory must be implemented by a memory adapter."); }
  async summarizeMemory() { throw new Error("summarizeMemory must be implemented by a memory adapter."); }
  async getRelevantMemory() { throw new Error("getRelevantMemory must be implemented by a memory adapter."); }
}

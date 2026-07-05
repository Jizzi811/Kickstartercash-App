import { MEMORY_TYPES, isValidMemoryType } from "../memoryTypes";
import { MemoryProvider } from "../memoryProvider";

const STORAGE_KEY = "quantum_memory_demo_records";
const canUseLocalStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

const seedRecords = () => [
  { type: MEMORY_TYPES.BRAND, payload: { note: "BrandMind uses premium AI-SaaS positioning.", brandName: "BrandMind", tone: "premium, clear, strategic" } },
  { type: MEMORY_TYPES.USER, payload: { note: "Preferred language is German.", preferredLanguage: "DE", preferredContentFormats: ["campaign plans", "checklists"] } },
  { type: MEMORY_TYPES.PROJECT, payload: { note: "Facebook campaign planning is available as a demo workflow.", campaigns: ["Facebook campaign"] } },
  { type: MEMORY_TYPES.EXPERIENCE, payload: { note: "No real performance data is stored in the demo provider yet.", performanceResults: [] } },
].map((record, index) => ({
  id: `demo-${record.type}-${index + 1}`,
  provider: "local-demo",
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
  ...record,
}));

export class LocalMemoryAdapter extends MemoryProvider {
  constructor({ persist = true } = {}) {
    super({ id: "local-demo", label: "Local Demo Provider", status: "ready" });
    this.persist = persist;
    this.records = seedRecords();
    this.load();
  }

  load() {
    if (!this.persist || !canUseLocalStorage()) return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) this.records = JSON.parse(stored);
    else this.persistRecords();
  }

  persistRecords() {
    if (this.persist && canUseLocalStorage()) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
    }
  }

  async saveMemory(type, payload) {
    if (!isValidMemoryType(type)) throw new Error(`Unsupported memory type: ${type}`);
    const now = new Date().toISOString();
    const record = { id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, type, payload, provider: this.id, createdAt: now, updatedAt: now };
    this.records = [record, ...this.records];
    this.persistRecords();
    return record;
  }

  async getMemory(type, filters = {}) {
    return this.records.filter((record) => (!type || record.type === type) && Object.entries(filters).every(([key, value]) => record.payload?.[key] === value));
  }

  async updateMemory(id, payload) {
    let updatedRecord = null;
    this.records = this.records.map((record) => {
      if (record.id !== id) return record;
      updatedRecord = { ...record, payload: { ...record.payload, ...payload }, updatedAt: new Date().toISOString() };
      return updatedRecord;
    });
    this.persistRecords();
    return updatedRecord;
  }

  async deleteMemory(id) {
    const previousLength = this.records.length;
    this.records = this.records.filter((record) => record.id !== id);
    this.persistRecords();
    return previousLength !== this.records.length;
  }

  async searchMemory(query, options = {}) {
    const needle = String(query || "").toLowerCase();
    const records = options.type ? await this.getMemory(options.type) : this.records;
    return records.filter((record) => JSON.stringify(record.payload).toLowerCase().includes(needle));
  }

  async summarizeMemory(type) {
    const records = await this.getMemory(type);
    return { type, provider: this.id, count: records.length, highlights: records.slice(0, 3).map((record) => record.payload?.note || JSON.stringify(record.payload)) };
  }

  async getRelevantMemory(context = {}) {
    const query = [context.prompt, context.goal, context.platform].filter(Boolean).join(" ");
    return query ? this.searchMemory(query) : this.records.slice(0, 6);
  }
}

export const localMemoryAdapter = new LocalMemoryAdapter();

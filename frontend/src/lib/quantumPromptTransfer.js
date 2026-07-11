export const QUANTUM_HOME_PROMPT_KEY = "brandmind.quantum.homePrompt";

export function saveQuantumHomePrompt(prompt) {
  const value = String(prompt || "").trim();
  if (!value || typeof window === "undefined") return null;
  const payload = { prompt: value, source: "home", createdAt: Date.now() };
  window.sessionStorage.setItem(QUANTUM_HOME_PROMPT_KEY, JSON.stringify(payload));
  return payload;
}

export function readQuantumHomePrompt(locationState) {
  const statePrompt = locationState?.quantumPrompt || locationState?.prompt;
  if (statePrompt && String(statePrompt).trim()) {
    return { prompt: String(statePrompt).trim(), source: "router-state" };
  }
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(QUANTUM_HOME_PROMPT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.prompt || !String(parsed.prompt).trim()) return null;
    return { ...parsed, prompt: String(parsed.prompt).trim(), source: parsed.source || "session-storage" };
  } catch {
    return null;
  }
}

export function clearQuantumHomePrompt() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(QUANTUM_HOME_PROMPT_KEY);
  }
}

export const HOME_QUANTUM_PROMPTS = {
  DE: [
    "Erstelle eine Einführungskampagne für mein neues Produkt.",
    "Analysiere meine Positionierung.",
    "Plane vier Wochen Instagram-Content.",
    "Entwickle aus meiner Geschäftsidee eine Marke.",
    "Prüfe, warum meine Website nicht verkauft.",
  ],
  EN: [
    "Create a launch campaign for my new product.",
    "Analyze my positioning.",
    "Plan four weeks of Instagram content.",
    "Turn my business idea into a brand.",
    "Find out why my website is not selling.",
  ],
};

import fs from "fs";
import path from "path";
import { CENTRAL_APP_ROUTES, NAV_GROUPS, NAV } from "./lib/navigationConfig";
import { clearQuantumHomePrompt, HOME_QUANTUM_PROMPTS, QUANTUM_HOME_PROMPT_KEY, readQuantumHomePrompt, saveQuantumHomePrompt } from "./lib/quantumPromptTransfer";

const group = (id) => NAV_GROUPS.find((item) => item.id === id);
const routesFor = (id) => [
  ...(group(id)?.items || []).map((item) => item.to),
  ...(group(id)?.subgroups || []).flatMap((subgroup) => subgroup.items.map((item) => item.to)),
];

afterEach(() => clearQuantumHomePrompt());

test("Sprint B main navigation contains the primary areas in German and English", () => {
  expect(NAV_GROUPS.map((item) => item.labelDE)).toEqual(["Home", "Quantum", "Gründung", "Meine Marke", "Erstellen", "Projekte", "Mehr"]);
  expect(NAV_GROUPS.map((item) => item.labelEN)).toEqual(["Home", "Quantum", "Founder Journey", "My Brand", "Create", "Projects", "More"]);
});

test("Founder journey group links the wedge flow", () => {
  expect(routesFor("journey")).toEqual(expect.arrayContaining([
    "/onboarding/select-path", "/onboarding/founder/ideas", "/onboarding/founder/ideas/compare",
    "/onboarding/founder/business-plan", "/onboarding/founder/finance", "/onboarding/founder/offers",
  ]));
});

test("Sprint B subpages are assigned to the requested groups", () => {
  expect(routesFor("my-brand")).toEqual(expect.arrayContaining(["/brand-brain", "/brand-identity", "/knowledge", "/knowledge-graph", "/memory"]));
  expect(routesFor("create")).toEqual(expect.arrayContaining(["/social", "/design", "/video", "/seo", "/email", "/linkedin", "/tiktok", "/tts", "/output-factory"]));
  expect(routesFor("projects")).toEqual(expect.arrayContaining(["/mission", "/campaign", "/workflow", "/automation", "/workflow-architect", "/orchestrator", "/ops", "/tickets"]));
});

test("Finance is grouped under Business & Finance in More and not Settings", () => {
  expect(NAV_GROUPS.some((item) => item.id === "settings")).toBe(false);
  const finance = group("more").subgroups.find((item) => item.id === "business-finance");
  expect(finance.labelDE).toBe("Business & Finanzen");
  expect(finance.items.map((item) => item.to)).toEqual(expect.arrayContaining(["/finance-cfo", "/finance-analyst", "/finance-fpa", "/finance-bookkeeper", "/finance-tax"]));
});

test("Existing central routes remain registered in App.js", () => {
  const app = fs.readFileSync(path.join(process.cwd(), "src/App.js"), "utf8");
  CENTRAL_APP_ROUTES.forEach((route) => expect(app).toContain(`path="${route}"`));
});

test("Home Quantum prompt transfer rejects empty submissions", () => {
  expect(saveQuantumHomePrompt("   ")).toBeNull();
  expect(window.sessionStorage.getItem(QUANTUM_HOME_PROMPT_KEY)).toBeNull();
});

test("Home example prompts exist in German and English and can populate the prompt", () => {
  expect(HOME_QUANTUM_PROMPTS.DE).toContain("Plane vier Wochen Instagram-Content.");
  expect(HOME_QUANTUM_PROMPTS.EN).toContain("Plan four weeks of Instagram content.");
  expect(HOME_QUANTUM_PROMPTS.DE[0]).toBe("Erstelle eine Einführungskampagne für mein neues Produkt.");
});

test("Home prompt is passed to Quantum via router state or session storage without URL query params", () => {
  expect(readQuantumHomePrompt({ quantumPrompt: "Analysiere meine Positionierung." }).prompt).toBe("Analysiere meine Positionierung.");
  saveQuantumHomePrompt("Plane vier Wochen Instagram-Content.");
  expect(readQuantumHomePrompt(null).prompt).toBe("Plane vier Wochen Instagram-Content.");
  expect(window.location.search).toBe("");
});

test("Quantum transfer can be consumed exactly once when cleared after takeover", () => {
  saveQuantumHomePrompt("Entwickle aus meiner Geschäftsidee eine Marke.");
  expect(readQuantumHomePrompt(null).prompt).toBe("Entwickle aus meiner Geschäftsidee eine Marke.");
  clearQuantumHomePrompt();
  expect(readQuantumHomePrompt(null)).toBeNull();
});

test("Mock workflow copy is labeled as proposal, not real completed execution", () => {
  const quantum = fs.readFileSync(path.join(process.cwd(), "src/pages/QuantumAgent.jsx"), "utf8");
  const engine = fs.readFileSync(path.join(process.cwd(), "src/lib/workflowEngine.js"), "utf8");
  expect(quantum).toContain("Workflow-Vorschlag");
  expect(quantum).not.toContain("baut einen Mock-Workflow");
  expect(engine).toContain("Vorschau-Output");
});

test("German and English main labels are present", () => {
  expect(NAV.map((item) => item.labelDE)).toEqual(expect.arrayContaining(["Brand Brain", "Social Media", "CFO Studio"]));
  expect(NAV_GROUPS.flatMap((item) => [item.labelDE, item.labelEN])).toEqual(expect.arrayContaining(["Meine Marke", "My Brand", "Erstellen", "Create"]));
});

import fs from "fs";
import path from "path";

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("path selection contains three German and English options", () => {
  const page = read("src/pages/FounderPathSelect.jsx");
  expect(page).toContain("Ich habe bereits eine Marke");
  expect(page).toContain("Ich möchte eine neue Marke aufbauen");
  expect(page).toContain("Ich möchte Brandmind zunächst erkunden");
  expect(page).toContain("I already have a brand");
  expect(page).toContain("I want to build a new brand");
  expect(page).toContain("I want to explore Brandmind first");
});

test("path selection persists status and routes to existing modules", () => {
  const page = read("src/pages/FounderPathSelect.jsx");
  expect(page).toContain('choose("existing_brand", "brand_brain", "/brand-brain")');
  expect(page).toContain('choose("founder", "intake", "/onboarding/founder/intake")');
  expect(page).toContain('choose("explore", "home", "/app")');
  expect(page).toContain('status: "skipped"');
});

test("home renders readiness from API and no fake fallback score", () => {
  const page = read("src/pages/BrandMindHQ.jsx");
  expect(page).toContain("/brand-readiness");
  expect(page).toContain("Es wird kein Ersatzwert angezeigt");
  expect(page).toContain("readiness.next_actions || []");
});

test("quick starts hand editable prompts to Quantum without automatic execution", () => {
  const home = read("src/pages/BrandMindHQ.jsx");
  const quantum = read("src/pages/QuantumAgent.jsx");
  expect(home).toContain("brandmind_quantum_prompt");
  expect(home).toContain("Keine automatische Ausführung");
  expect(quantum).toContain("setOrchestratorPrompt(incoming)");
  expect(quantum).not.toContain("handleOrchestrate(incoming)");
});

test("founder financial disclaimer and progress are present", () => {
  expect(read("src/pages/FounderBusinessPlan.jsx")).toContain("Sie ersetzen keine individuelle Steuer-, Rechts-, Finanz- oder Anlageberatung");
  expect(read("src/pages/FounderFinancePlan.jsx")).toContain("It does not replace individual tax, legal, financial, or investment advice");
  expect(read("src/components/FounderProgress.jsx")).toContain("updateOnboardingStatus");
});

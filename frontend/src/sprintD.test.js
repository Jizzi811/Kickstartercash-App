import fs from "fs";
import path from "path";

const landing = () => fs.readFileSync(path.join(process.cwd(), "src/pages/Landing.jsx"), "utf8");
const app = () => fs.readFileSync(path.join(process.cwd(), "src/App.js"), "utf8");

test("Early Access CTA scrolls to the form instead of auth", () => {
  const src = landing();
  expect(src).toContain('id="early-access-form"');
  expect(src).toContain('scrollIntoView');
  expect(src).not.toContain('const requestEarlyAccess = () => navigate("/auth")');
});

test("Early Access form has required fields and unchecked privacy checkbox", () => {
  const src = landing();
  ["name", "email", "audience_status", "marketing_challenge", "privacy_consent"].forEach((field) => expect(src).toContain(field));
  expect(src).toContain('type="checkbox"');
  expect(src).toContain('privacy_consent: false');
});

test("Loading and success states prevent double submit", () => {
  const src = landing();
  expect(src).toContain('earlyAccessState.loading || earlyAccessState.success');
  expect(src).toContain('disabled={earlyAccessState.loading || !!earlyAccessState.success}');
});

test("API failures show non-technical error text", () => {
  const src = landing();
  expect(src).toContain('Die Anfrage konnte nicht gesendet werden');
  expect(src).not.toContain('stack');
});

test("DE and EN audience labels are present", () => {
  const src = landing();
  ["Ich gründe gerade", "Ich bin selbstständig", "Ich arbeite in einem Unternehmen", "Ich führe eine Agentur", "I am currently founding", "I am self-employed", "I work at a company", "I run an agency"].forEach((label) => expect(src).toContain(label));
});

test("Privacy and auth links are reachable from public routes", () => {
  expect(app()).toContain('path="/privacy"');
  expect(app()).toContain('path="/datenschutz"');
  expect(landing()).toContain('to={isDE ? "/datenschutz" : "/privacy"}');
  expect(landing()).toContain('Log in');
});

test("Core public pages do not include visible legacy campaign terms", () => {
  const files = ["src/pages/Landing.jsx", "src/pages/SeoStudio.jsx", "src/pages/Funnel.jsx", "src/pages/CampaignWorkflow.jsx"];
  const banned = [/kickstartercash\.club/i, /Black Card/i, /Exclusive Card/i];
  for (const file of files) {
    const src = fs.readFileSync(path.join(process.cwd(), file), "utf8");
    banned.forEach((pattern) => expect(src).not.toMatch(pattern));
  }
});

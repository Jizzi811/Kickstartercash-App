const fs = require('fs');
const read = (p) => fs.readFileSync(p, 'utf8');
test('founder start has three DE and EN options', () => {
  const page = read('src/pages/FounderStart.jsx');
  expect(page).toContain('Wo stehst du gerade?');
  expect(page).toContain('Where are you right now?');
  expect(page).toContain('no_idea');
  expect(page).toContain('rough_direction');
  expect(page).toContain('concrete_idea');
});
test('vision question is after start and founder entry route is start', () => {
  expect(read('src/App.js')).toContain('/onboarding/founder/start');
  expect(read('src/pages/FounderPathSelect.jsx')).toContain('choose("founder", "start", "/onboarding/founder/start")');
  expect(read('src/pages/FounderStart.jsx')).not.toContain('Welche Veränderung möchtest du');
});
test('ideas compare has max-three and no success probability', () => {
  const page = read('src/pages/FounderIdeaCompare.jsx');
  expect(page).toContain('Maximal drei Ideen');
  expect(page).not.toMatch(/%|probability/i);
});

test('founder resume routing fix is represented in start and intake UI', () => {
  const start = read('src/pages/FounderStart.jsx');
  const intake = read('src/pages/FounderIntake.jsx');
  expect(start).toContain('Du hast bereits Angaben gespeichert. Sie bleiben erhalten. Wähle bitte, wo du aktuell mit deiner Geschäftsidee stehst.');
  expect(start).toContain('You already have saved information. It will stay in place.');
  expect(intake).toContain('navigate("/onboarding/founder/start", { replace: true })');
  expect(intake).toContain('navigate("/onboarding/founder/ideas", { replace: true })');
  expect(intake).toContain('navigate("/onboarding/founder/start")');
});

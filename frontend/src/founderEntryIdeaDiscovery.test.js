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

const fs = require('fs');
const read = (p) => fs.readFileSync(p, 'utf8');

test('BrainBadge surfaces profile completeness and links into the editor', () => {
  const badge = read('src/components/BrainBadge.jsx');
  expect(badge).toContain('brand-identity/${activeBrandId}/summary');
  expect(badge).toContain('Markenprofil aktiv');
  expect(badge).toContain('Markenprofil fast leer');
  expect(badge).toContain('"/brand-brain"');
  expect(badge).toContain('if (overall === null) return null');
});

test('studios show the brain badge under their header', () => {
  expect(read('src/pages/Copywriter.jsx')).toContain('<BrainBadge />');
  expect(read('src/pages/SocialMedia.jsx')).toContain('<BrainBadge />');
});

test('path selection emits activation events', () => {
  const page = read('src/pages/FounderPathSelect.jsx');
  expect(page).toContain('track("onboarding_path_selected"');
  expect(page).toContain('track("onboarding_skipped"');
});

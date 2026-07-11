const fs = require('fs');

test('existing brand path routes to website import first and manual fallback remains', () => {
  const path = fs.readFileSync('src/pages/FounderPathSelect.jsx','utf8');
  expect(path).toContain('choose("existing_brand", "website_import", "/onboarding/existing-brand/import")');
  const page = fs.readFileSync('src/pages/WebsiteBrandImport.jsx','utf8');
  expect(page).toContain('Lass Brandmind deine Marke kennenlernen');
  expect(page).toContain('Ohne Website manuell einrichten');
  expect(page).toContain('/brand-brain');
});

test('review UI shows sources confidence extraction and no auto-save copy', () => {
  const page = fs.readFileSync('src/pages/WebsiteBrandImport.jsx','utf8');
  expect(page).toContain('source_urls');
  expect(page).toContain('confidence');
  expect(page).toContain('extraction_type');
  expect(page).toContain('Erst nach deiner Bestätigung');
  expect(page).toContain('Ausgewählte Angaben übernehmen');
  expect(page).toContain('Entwurf verwerfen');
});

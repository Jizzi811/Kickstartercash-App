# PRD – Kickstarter Content Maschine

## Original Problem Statement
KI-Marketing-Betriebssystem im Branding von KickstarterCash.club (Schwarz/Gold, KT-Logo).
Mitglieder hinterlegen ihr Branding einmal, die KI erzeugt konsistente Inhalte für alle Kanäle.
MVP: Brand Designer + Social Media Maschine + KI Bildgenerator + KI Copywriter + Prompt Bibliothek.
Web-App (nicht mobil), DE/EN umschaltbar, keine Auth.

## User Choices
- Text-Modelle: Claude Sonnet 4.5 + GPT-5.2 (umschaltbar) via Emergent Universal LLM Key
- Bild: Gemini Nano Banana (gemini-3.1-flash-image-preview)
- Keine Authentifizierung
- Branding: Schwarz/Gold, KT-Logo als Default-Marke "KickstarterCash.club"
- Sprache: DE Standard, EN umschaltbar

## Architecture
- Backend: FastAPI + MongoDB (brands, history collections). emergentintegrations LlmChat.
- Frontend: React + Tailwind, Luxury Dark Theme (Playfair Display + Manrope), framer-motion, shadcn/ui.
- Endpoints: /api/brands (CRUD), /api/generate/{social,copy,image,optimize-prompt}, /api/prompts, /api/history.

## Implemented (2026-06-26)
- Dashboard mit Hero + 5 Modul-Karten
- Modul 1 Brand Designer: Marken CRUD (Logo, Farben, Schriften, Tonalität, Bildstil), aktive Marke wählbar
- Modul 2 Social Media Maschine: Multi-Plattform Posts (IG/FB/TikTok/X/LinkedIn/Pinterest/Threads) mit Hashtags/CTA/Bildidee
- Modul 4 KI Bildgenerator: 13 Stil-Vorlagen, optionale Logo-Integration, Download
- Modul 7 KI Copywriter: 10 Formate, Titel/Body/Varianten, Copy
- Modul 10 Prompt Bibliothek: 20 Prompts, 10 Kategorien, Suche, Copy (DE/EN)
- DE/EN Sprachumschalter, Modell-Umschalter (Claude/GPT), aktive-Marke-Selektor

## Known Issue / Blocker
- EMERGENT_LLM_KEY Budget = 0.0 -> Text-/Bildgenerierung schlägt fehl bis Guthaben aufgeladen ist.
  (Prompt-Bibliothek + Brand Designer funktionieren ohne LLM.)

## Backlog (P1/P2)
- P1: Content-Kalender (Modul 9), Landingpage-Generator (Modul 5), Export-Center (Modul 17)
- P1: Generierungs-Historie UI (Backend /api/history existiert bereits)
- P2: Funnel-Generator, Video-Creator, Markenwächter, Marketing-Score, Ideenmaschine
- P2: Auth/Mitgliederbereich, Speichern/Favoriten von Inhalten

## Next Tasks
1. User: Universal Key aufladen, dann Text/Bild-Generierung via Testing-Agent verifizieren
2. Danach nächste Module nach Priorität ergänzen

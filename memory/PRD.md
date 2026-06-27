# PRD – Kickstarter Content Maschine

## Original Problem Statement
KI-Marketing-Betriebssystem im Branding von KickstarterCash.club (Schwarz/Gold, KT-Logo).
Mitglieder hinterlegen ihr Branding einmal, die KI erzeugt konsistente Inhalte für alle Kanäle.
MVP: Brand Designer + Social Media Maschine + KI Bildgenerator + KI Copywriter + Prompt Bibliothek.
Web-App (nicht mobil), DE/EN umschaltbar, keine Auth.

## User Choices
- Text-Modelle: Claude Sonnet 4.5 + GPT-5.2 (umschaltbar). GPT läuft über eigenen OPENAI_API_KEY (kein Budget-Limit); Claude + Bild (Nano Banana) über Emergent Universal Key. Standardmodell: GPT.
- Bild: Gemini Nano Banana (gemini-3.1-flash-image-preview)
- Keine Authentifizierung
- Branding: Schwarz/Gold, KT-Logo als Default-Marke "KickstarterCash.club"
- Sprache: DE Standard, EN umschaltbar

## Architecture
- Backend: FastAPI + MongoDB (brands, history collections). emergentintegrations LlmChat.
- Frontend: React + Tailwind, Luxury Dark Theme (Playfair Display + Manrope), framer-motion, shadcn/ui.
- Endpoints: /api/brands (CRUD), /api/generate/{social,copy,image,optimize-prompt}, /api/prompts, /api/history.

## Implemented (2026-06-26)
- Dashboard mit Hero + 9 Modul-Karten (Hero-CTA → Ein-Klick-Kampagne)
- Modul 1 Brand Designer: Marken CRUD
- Modul 2 Social Media Maschine: Multi-Plattform Posts
- Modul 4 KI Bildgenerator: 13 Stil-Vorlagen + Logo-Integration
- Modul 7 KI Copywriter: 10 Formate
- Modul 10 Prompt Bibliothek: 20 Prompts, 10 Kategorien, Suche
- NEU Ein-Klick-Kampagne (/campaign): EIN Thema → Social-Posts + Werbetext + Markenbild parallel (asyncio.gather)
- NEU Landingpage-Generator (/landing): Headline/Benefits/Testimonials/FAQ/Pricing/SEO + HTML-Export
- NEU Content-Kalender (/calendar): 30/60/90-Tage-Plan mit Texten/Hashtags/Posting-Zeiten
- NEU Export-Center (/export): Historie aller Inhalte, Filter, Export TXT/JSON/PNG, Löschen
- NEU KI-Markenwächter & Marketing-Score (/guardian): analysiert beliebigen Text gegen die aktive Marke → Score (0-100), Sterne, Markenkonformität/Tonalität-Balken, Marken-Checks (pass/warn/fail), Verbesserungen & Stärken
- NEU Verkaufs-Funnel (/funnel): Member-Funnel auf Basis hochgeladener KickstarterCash-Vorlage (funnel_bundle.html, 28MB). Member trägt Reflink + Kontaktdaten + eigenes Berater-Foto (Upload, client-seitig auf 400px/JPEG verkleinert) ein → personalisierter öffentlicher Funnel unter /api/funnel/{id}/page. Reflink in allen gelben Buttons; "Jetzt unverbindlich anfragen" → Lead gespeichert + E-Mail an Berater (Resend). Lead-Liste je Funnel im Dashboard. Berater-Foto ersetzt den kc-sponsor-photo Slot als runder <img>. Benigner Bundler-Runtime-Konsolenfehler per Error-Suppressor unterdrückt.
- DE/EN Sprachumschalter, Modell-Umschalter (Claude/GPT), aktive-Marke-Selektor
- Verifiziert: iteration_1 (5 Module), iteration_2 (4 Module), iteration_3 (Markenwächter) je 100%; Funnel manuell E2E getestet (Render + Personalisierung + Lead-Erfassung OK)

## Backlog (P1/P2)
- P1: Generierungs-Historie in Module integrieren, Favoriten/Speichern
- P2: Funnel-Generator, Video-Creator, Markenwächter, Marketing-Score, Ideenmaschine, Thumbnail Creator, Werbekampagnen-Generator, Prompt-Optimierer (Backend /api/generate/optimize-prompt existiert), Markenbibliothek-Erweiterung
- P2: Auth/Mitgliederbereich

## Update (2026-06-27)
- Bezahlmodelle entfernt (Claude/Nano Banana raus). Text: GPT-5.2 (OPENAI_API_KEY) + Gemini 2.5 Flash (GEMINI_API_KEY). Bild: Pollinations.ai (kostenlos, kein Key).
- NEU: GPT Chat (/chat-gpt) & Gemini Chat (/chat-gemini) Reiter — interaktiver Chat via POST /api/chat. Verifiziert per curl (GPT & Gemini OK) + UI-Screenshot.
- ENTFERNT: Landingpage-Generator (/landing) komplett (Nav, Route, Page, Dashboard-Karte) auf Userwunsch — funktionierte schlecht (Markenfarben/Buttons/Bilder/Design). i18n-Strings für Chat-Module (DE/EN) ergänzt (waren vorher rohe Keys).

## Next Tasks
1. P1: User muss Domain kickstartercash.club im Resend-Dashboard verifizieren (sonst Funnel-Mails nur an Testadresse).
2. P2: Refactoring großer Komponenten (Funnel.jsx, Guardian.jsx, Campaign.jsx, server.py 909 Zeilen).

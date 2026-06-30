# PRD – Kickstarter Content Maschine

## Original Problem Statement
KI-Marketing-Betriebssystem im Branding von Kickstarcash.Club.club (Schwarz/Gold, KT-Logo).
Mitglieder hinterlegen ihr Branding einmal, die KI erzeugt konsistente Inhalte für alle Kanäle.
MVP: Brand Designer + Social Media Maschine + KI Bildgenerator + KI Copywriter + Prompt Bibliothek.
Web-App (nicht mobil), DE/EN umschaltbar, keine Auth.

## User Choices
- Text-Modelle: Claude Sonnet 4.5 + GPT-5.2 (umschaltbar). GPT läuft über eigenen OPENAI_API_KEY (kein Budget-Limit); Claude + Bild (Nano Banana) über Emergent Universal Key. Standardmodell: GPT.
- Bild: Gemini Nano Banana (gemini-3.1-flash-image-preview)
- Keine Authentifizierung
- Branding: Schwarz/Gold, KT-Logo als Default-Marke "Kickstarcash.Club.club"
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
- NEU Verkaufs-Funnel (/funnel): Member-Funnel auf Basis hochgeladener Kickstarcash.Club-Vorlage (funnel_bundle.html, 28MB). Member trägt Reflink + Kontaktdaten + eigenes Berater-Foto (Upload, client-seitig auf 400px/JPEG verkleinert) ein → personalisierter öffentlicher Funnel unter /api/funnel/{id}/page. Reflink in allen gelben Buttons; "Jetzt unverbindlich anfragen" → Lead gespeichert + E-Mail an Berater (Resend). Lead-Liste je Funnel im Dashboard. Berater-Foto ersetzt den kc-sponsor-photo Slot als runder <img>. Benigner Bundler-Runtime-Konsolenfehler per Error-Suppressor unterdrückt.
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

## Update (2026-06-27) – Teil 2
- Aktive-Marke-Auswahl bereinigt: alle Test-Marken aus DB gelöscht, nur Default "Kickstarcash.Club.club" bleibt.
- Bildgenerator + Ein-Klick-Kampagne nutzen jetzt **Nano Banana (Gemini 2.5 Flash Image) via poyo.ai** (POYO_API_KEY in backend/.env, async submit→poll, gibt base64-PNG zurück). Pollinations & Emergent-Nano-Banana ersetzt. Verifiziert per curl (base64 PNG, ~20s).
- Hinweis: POYO_API_KEY muss bei Production-Redeploy ebenfalls gesetzt sein.

## Update (2026-06-27) – Teil 3
- Dashboard-Hero: Badge bleibt, Headline+Subtitle entfernt, stattdessen transparentes KT-Logo (/brand/logo-kt.png, schwarzer BG entfernt).
- Schriftart projektweit auf **Sora** umgestellt (index.css import + body + .font-display).
- Bildgenerator: Toggle "Logo ins Bild integrieren" (apply_logo) → poyo nano-banana-edit mit LOGO_URL als Referenz. 402-Fehler (kein Guthaben) wird sauber als Meldung ausgegeben.
- BLOCKER: poyo.ai-Konto-Guthaben aufgebraucht → User muss aufladen, damit Bildgenerierung läuft.

## Update (2026-06-27) – Teil 4
- Bildgenerator: Seitenverhältnis-Auswahl (1:1, 16:9, 9:16) → ImageRequest.size an poyo nano-banana weitergereicht. UI verifiziert (Selector rendert). E2E-Generierung wegen poyo-Guthaben nicht testbar.

## Update (2026-06-27) – Teil 5
- SEO/Crawler-Fix in public/index.html: echter Titel, Meta-Description, Open-Graph- & Twitter-Tags (Logo als og:image), canonical, lang=de, robots. Plus statischer Fallback-Inhalt im #root (Produktbeschreibung + Modul-Liste), den JS-lose Clients (Crawler, Link-Previews, KI/web_fetch) lesen. React ersetzt den Fallback beim Mount. Verifiziert in Preview. Production-Redeploy nötig.
- Header: "Aktive Marke"-Dropdown entfernt (nur noch Modell-Toggle + DE/EN).

## Next Tasks
1. P1: User muss Domain kickstartercash.club im Resend-Dashboard verifizieren (sonst Funnel-Mails nur an Testadresse).
2. P2: Refactoring großer Komponenten (Funnel.jsx, Guardian.jsx, Campaign.jsx, server.py 909 Zeilen).

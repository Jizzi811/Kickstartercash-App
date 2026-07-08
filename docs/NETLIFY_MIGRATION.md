# BrandMind auf einen neuen Netlify-Account umziehen

Ziel: Das Frontend (React-App) läuft auf einem **neuen Netlify-Account**,
verbunden mit diesem GitHub-Repo. Das Backend bleibt unverändert auf Render
(`https://brandmind-api.onrender.com`).

Dank der `netlify.toml` im Repo-Root sind **alle Build-Einstellungen bereits
im Code hinterlegt** — im Netlify-Dashboard muss nichts konfiguriert werden.

## Schritt für Schritt (ca. 5 Minuten)

1. **Neuen Netlify-Account anlegen** (oder in den Ziel-Account einloggen):
   https://app.netlify.com → am besten „Sign up with GitHub“, dann ist die
   Repo-Verbindung gleich erledigt.
2. Im Dashboard: **„Add new site“ → „Import an existing project“ → GitHub**.
3. Netlify fragt nach GitHub-Zugriff: das Repo
   **`Jizzi811/Kickstartercash-App`** freigeben (bei „Only select
   repositories“ das Repo auswählen).
4. Das Repo in der Liste anklicken. Netlify liest die `netlify.toml`
   automatisch — die Felder sind vorausgefüllt:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/build`
   - Branch: `main`
5. **„Deploy site“** klicken. Der erste Build dauert ca. 3–5 Minuten.
6. Optional: unter **Site configuration → Site details → Change site name**
   einen sprechenden Namen vergeben (z. B. `brandmind-app` →
   `brandmind-app.netlify.app`). Der alte Name `brandmind811` gehört noch dem
   alten Account und ist erst frei, wenn die Site dort gelöscht wird.

Fertig — jeder Push auf `main` deployt ab jetzt automatisch auf den neuen
Account.

## Was im Code bereits vorbereitet ist

- **`netlify.toml`** (Repo-Root): Base/Build/Publish, SPA-Redirect,
  `REACT_APP_BACKEND_URL`, `CI=false`, `NPM_FLAGS=--legacy-peer-deps`,
  Node 20. Es müssen **keine Environment-Variablen im Netlify-UI** gesetzt
  werden.
- **Absicherung gegen den „weißen Bildschirm“**: Früher stürzte die App mit
  „Brandmind konnte nicht geladen werden“ ab, wenn die Backend-URL im Build
  fehlte (die API-Anfrage bekam dann die eigene index.html als Antwort und
  `brands.find` crashte). Jetzt gilt:
  - Fehlt die Env-Variable, fällt die App auf
    `https://brandmind-api.onrender.com` zurück.
  - Antworten, die keine Liste sind, werden verworfen statt die App zu
    crashen (`AppContext.js`).

## Checkliste nach dem ersten Deploy

- [ ] Neue URL öffnen → Login-Seite erscheint (kein weißer Bildschirm).
- [ ] Einloggen → Dashboard lädt Daten vom Render-Backend.
- [ ] Falls API-Aufrufe mit CORS-Fehlern scheitern: auf Render prüfen, ob die
      Env-Variable `CORS_ORIGINS` gesetzt ist. Ist sie gesetzt, die neue
      Netlify-Domain dort ergänzen (kommagetrennt) — oder die Variable
      entfernen, dann erlaubt das Backend alle Origins (Default `*`).
- [ ] Alte Site im alten Account löschen bzw. Account auflösen, damit der
      Name `brandmind811` frei wird (optional).

## Hintergrund: Warum war brandmind811.netlify.app offline?

Der alte Netlify-Account hatte keine Credits mehr — Netlify sperrt dann das
Hosting der Sites des Accounts. Das war ein Account-Problem, kein Code-Problem.
Der oben beschriebene Crash-Fix behebt zusätzlich einen echten Bug, der beim
Umzug ohne Env-Variable sofort wieder zu einem Fehlerbildschirm geführt hätte.

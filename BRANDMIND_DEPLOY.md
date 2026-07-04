# Brandmind – eigenständiges Deployment (Option B: eigenes Repo)

Diese Anleitung macht aus dem gemeinsamen Code ein **unabhängiges Brandmind-Produkt**
in einem eigenen GitHub-Repo, mit eigenem Backend- und Frontend-Deployment.
Das bestehende Kickstartercash-Repo und seine Netlify-Sites bleiben komplett unberührt.

> **Stack:** Frontend = React (CRA) · Backend = FastAPI + MongoDB · Auth = JWT (stdlib) · Billing = Stripe

---

## 0. Voraussetzungen
- Lokaler Checkout dieses Repos auf dem Branch `claude/ai-growth-os-br0ntf`
- Ein MongoDB (z. B. **MongoDB Atlas** Free Tier)
- Mind. ein LLM-Key (`OPENAI_API_KEY` **oder** `GEMINI_API_KEY`)
- Optional für Bezahlung: **Stripe**-Account

---

## 1. Eigenes Repo erzeugen

```bash
# im Wurzelverzeichnis des kickstartercash-app-Checkouts, auf dem Branch:
bash scripts/spinoff-brandmind.sh ../brandmind
```

Das Skript kopiert den Code (ohne `.git`, `node_modules`, `build`) nach `../brandmind`,
legt `netlify.toml` in die Wurzel und startet eine frische Git-Historie.

Danach auf GitHub ein **leeres** Repo `brandmind` anlegen und pushen:

```bash
cd ../brandmind
git remote add origin git@github.com:<dein-user>/brandmind.git
git push -u origin main
```

---

## 2. Backend deployen (Render – empfohlen)

1. Render → **New** → **Blueprint** → dein `brandmind`-Repo wählen
   (Render liest `deploy/render.yaml`).
   *Alternativ manuell:* New → Web Service, Root `backend`,
   Build `pip install -r requirements-deploy.txt`,
   Start `uvicorn server:app --host 0.0.0.0 --port $PORT`.
2. Env-Variablen setzen (siehe `deploy/backend.env.example`). **Pflicht:**
   - `MONGO_URL`, `DB_NAME`
   - `BRANDMIND_JWT_SECRET` (langer Zufallsstring)
   - mind. ein LLM-Key
   - `BRANDMIND_APP_URL` = spätere Frontend-URL
3. Deploy starten. Health-Check: `GET /api/health` muss `200` liefern.

> Railway geht genauso: `railway.toml` + `nixpacks.toml` liegen schon im Repo.

---

## 3. Frontend deployen (Netlify – neue Site)

1. Netlify → **Add new site** → **Import an existing project** → `brandmind`-Repo.
2. **Branch:** `main`. Build-Settings kommen aus `netlify.toml`
   (Base `frontend`, Build `npm run build`, Publish `frontend/build`).
3. Env-Variable setzen:
   - `REACT_APP_BACKEND_URL` = deine Render-Backend-URL (ohne `/api`, ohne Slash am Ende)
4. Deploy. Öffne `/auth` → registrieren → du landest im Brand-Brain-Onboarding.

---

## 4. Stripe-Billing aktivieren (optional)

1. In Stripe 3 Produkte/Preise anlegen (Starter/Pro/Agency, monatlich).
2. Backend-Env setzen: `STRIPE_API_KEY`, `STRIPE_PRICE_STARTER/PRO/AGENCY`.
3. Webhook in Stripe anlegen → Endpoint `https://<backend>/api/billing/webhook`,
   Event mindestens `checkout.session.completed`; das `whsec_…`-Secret als
   `STRIPE_WEBHOOK_SECRET` setzen.
4. Fertig: `/billing` zeigt die Pläne, „Upgrade" führt in den Stripe-Checkout,
   nach Zahlung wird der Workspace-Plan per Webhook hochgestuft.

---

## 5. Optionale Bereinigung (rein kosmetisch)

Der Spinoff enthält noch Kickstartercash-spezifische Altlasten, die du gefahrlos
entfernen kannst, wenn du sie nicht brauchst:

- `webinar.html`, `jarvjis-orb.html` (große Demo-Dateien)
- `backend/funnel_bundle.html` (28 MB, nur für das KT-Funnel-Feature)
- der Default-Seed „Kickstartercash.Club" in `backend/server.py` (`DEFAULT_BRAND`)

Nicht nötig für den Betrieb – Brandmind läuft auch mit diesen Dateien.

---

## Umgebungsvariablen – Kurzreferenz

| Variable | Wo | Pflicht | Zweck |
|---|---|---|---|
| `MONGO_URL` / `DB_NAME` | Backend | ✅ | Datenbank |
| `BRANDMIND_JWT_SECRET` | Backend | ✅ | Login-Tokens signieren |
| `OPENAI_API_KEY` / `GEMINI_API_KEY` | Backend | ✅ (eines) | Text-Generierung |
| `BRANDMIND_APP_URL` | Backend | ✅ | Stripe-Redirects |
| `POYO_API_KEY` | Backend | – | Bildgenerierung |
| `RESEND_API_KEY` / `SENDER_EMAIL` | Backend | – | E-Mails |
| `STRIPE_API_KEY` / `STRIPE_WEBHOOK_SECRET` | Backend | – | Billing |
| `STRIPE_PRICE_STARTER/PRO/AGENCY` | Backend | – | Plan-Preise |
| `REACT_APP_BACKEND_URL` | Frontend | ✅ | Backend-Adresse |

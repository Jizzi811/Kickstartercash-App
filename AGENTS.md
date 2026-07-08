# AGENTS.md

## Cursor Cloud specific instructions

Brandmind is a single product with two services:

- **Backend** — FastAPI + MongoDB, entrypoint `backend/server.py` (ASGI object `app`). All routes are under `/api`.
- **Frontend** — React 19 CRA app driven by CRACO (`frontend/`), talks to the backend via `REACT_APP_BACKEND_URL`.

### Dependencies / environment (handled by the startup update script)

- The backend runs from a venv at `backend/venv`. Deps come from `backend/requirements-deploy.txt` (the slim set used by CI/deploy), **not** `backend/requirements.txt` — the full file pins `emergentintegrations` (an internal package not on PyPI) and a custom `litellm` wheel, so it will not `pip install` here. The update script also adds `pytest`, `pytest-xdist`, `pyflakes`, `flake8` for lint/test.
- Python is 3.12 in this environment even though `backend/.python-version` says 3.11.9; the deploy deps and `import server` work fine on 3.12.
- Frontend deps require `npm ci --legacy-peer-deps` (there is a known `react-day-picker`/`date-fns` peer mismatch, tracked in ROADMAP).

### Services not installed by the update script (already in the VM snapshot)

- **MongoDB** is installed as a system package (`mongodb-org` 8.0). It is not auto-started. Start it with:
  `mongod --dbpath /data/db --bind_ip 127.0.0.1 --port 27017` (data dir `/data/db` already exists).
- `.env` files are gitignored and live in the snapshot: `backend/.env` (`MONGO_URL=mongodb://127.0.0.1:27017`, `DB_NAME=brandmind`, a dev `BRANDMIND_JWT_SECRET`) and `frontend/.env` (`REACT_APP_BACKEND_URL=http://localhost:8000`). If missing, recreate them from `deploy/backend.env.example` and `deploy/frontend.env.example`. `REACT_APP_BACKEND_URL` must have **no** trailing slash and **no** `/api` (the app appends `/api` itself).

### Running the services (dev)

- Backend: `cd backend && ./venv/bin/uvicorn server:app --host 0.0.0.0 --port 8000`. Health check: `GET /api/health` (reports `db_connected`). The server boots even if `MONGO_URL` is empty (DB features just disabled).
- Frontend: `cd frontend && PORT=3000 BROWSER=none npm start` → http://localhost:3000.

### Lint / test / build

- Backend lint (matches CI): `cd backend && ./venv/bin/python -m pyflakes server.py app` — CI only fails on `undefined name`; other unused-import warnings are pre-existing.
- Backend tests: `cd backend && ./venv/bin/python -m pytest tests/backend_test.py` — these are **integration** tests that hit the running backend (they read `REACT_APP_BACKEND_URL` from `frontend/.env`), so the backend + MongoDB must be running. Tests that call LLM generation (GPT/Gemini/image) fail without provider API keys, and `test_list_brands_has_default` expects the legacy `kickstartercash` seed rather than the `brandmind` DB seed — these failures are data/key-dependent, not setup bugs. `backend/pytest.ini` forces `-n 2 --dist loadscope`; do not change `addopts`.
- Frontend build (CI check): `cd frontend && CI=false npm run build`.

### Frontend runtime notes

- The `ReferenceError: enabled is not defined` crash in `Layout.jsx` mentioned in earlier versions of this doc is fixed on `main`.
- If the app shows "Brandmind konnte nicht geladen werden", check `REACT_APP_BACKEND_URL`: without it the API falls back to the production backend (`frontend/src/context/AppContext.js`), and API responses that are not arrays are discarded instead of crashing the shell.

### LLM / integrations

- Text/image generation needs at least one provider key (`OPENAI_API_KEY` or `GEMINI_API_KEY`, etc.) in `backend/.env`; none are set by default, so those features return errors locally. Auth, workspaces, brand CRUD and other DB-backed flows work without any keys.

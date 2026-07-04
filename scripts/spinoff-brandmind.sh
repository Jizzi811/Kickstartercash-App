#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Spin off a standalone "brandmind" git repo from this codebase.
#
# Run this LOCALLY from the root of your checked-out kickstartercash-app,
# on the branch that contains the Brandmind work (claude/ai-growth-os-br0ntf).
#
#   bash scripts/spinoff-brandmind.sh [target-dir]
#
# Then create an EMPTY GitHub repo named "brandmind" and follow the printed
# instructions to push. Nothing here touches the original repo or its history.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

TARGET="${1:-../brandmind}"
SRC="$(pwd)"

if [ -e "$TARGET" ]; then
  echo "✋ Target '$TARGET' already exists. Choose another path or remove it."
  exit 1
fi

echo "→ Copying working tree to $TARGET (excluding .git, node_modules, build)…"
mkdir -p "$TARGET"
# Copy everything except heavy/generated dirs and the git history.
rsync -a \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'frontend/node_modules' \
  --exclude 'frontend/build' \
  --exclude 'venv' \
  --exclude '.venv' \
  "$SRC"/ "$TARGET"/

cd "$TARGET"

# Promote the Netlify config to the repo root so a fresh Netlify site picks it up.
if [ -f deploy/netlify.toml ] && [ ! -f netlify.toml ]; then
  cp deploy/netlify.toml netlify.toml
  echo "→ Copied deploy/netlify.toml → netlify.toml"
fi

echo "→ Initializing fresh git history…"
git init -b main >/dev/null
git add -A
git commit -q -m "chore: initial Brandmind commit (spun off from the shared engine)"

cat <<EOF

✅ Done. A clean Brandmind repo is ready at: $TARGET

Next steps:
  1) Create an EMPTY GitHub repo (no README) named 'brandmind'.
  2) Connect it and push:

       cd "$TARGET"
       git remote add origin git@github.com:<your-user>/brandmind.git
       git push -u origin main

  3) Deploy the backend (Render/Railway) using deploy/render.yaml or the
     existing railway.toml, and set the env vars from deploy/backend.env.example
     (BRANDMIND_JWT_SECRET is required).
  4) Deploy the frontend on a NEW Netlify site:
       Base: frontend  •  Build: npm run build  •  Publish: frontend/build
       Env:  REACT_APP_BACKEND_URL = <your backend URL>
     (netlify.toml at the repo root already encodes this.)

See BRANDMIND_DEPLOY.md for the full walkthrough.
EOF

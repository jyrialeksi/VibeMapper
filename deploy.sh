#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

SA_FILE="firebase-service-account.json"
ENV_FILE="backend/.env"

# --- Validate required files ---
if [ ! -f "$SA_FILE" ]; then
  echo "Error: $SA_FILE not found. Place your Firebase service account JSON in the project root."
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found. It should contain ENCRYPTION_KEY=..."
  exit 1
fi

if ! command -v fly &> /dev/null; then
  echo "Error: fly CLI not found. Install it: https://fly.io/docs/flyctl/install/"
  exit 1
fi

# --- Read secrets from files ---
ENCRYPTION_KEY=$(grep -E '^ENCRYPTION_KEY=' "$ENV_FILE" | cut -d'=' -f2-)
if [ -z "$ENCRYPTION_KEY" ]; then
  echo "Error: ENCRYPTION_KEY not found in $ENV_FILE"
  exit 1
fi

FIREBASE_PROJECT_ID=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$SA_FILE','utf8')).project_id)")
FIREBASE_CLIENT_EMAIL=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$SA_FILE','utf8')).client_email)")
FIREBASE_PRIVATE_KEY=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$SA_FILE','utf8')).private_key)")

echo "==> Setting Fly.io secrets..."
fly secrets set \
  ENCRYPTION_KEY="$ENCRYPTION_KEY" \
  FIREBASE_PROJECT_ID="$FIREBASE_PROJECT_ID" \
  FIREBASE_CLIENT_EMAIL="$FIREBASE_CLIENT_EMAIL" \
  FIREBASE_PRIVATE_KEY="$FIREBASE_PRIVATE_KEY" \
  VITE_FIREBASE_API_KEY="AIzaSyCoJqt4vMPZkjbf8Pza-e1evbo3A_etSaY" \
  VITE_FIREBASE_AUTH_DOMAIN="user-story-mapper.firebaseapp.com" \
  --stage

echo "==> Deploying to Fly.io..."
fly deploy

echo ""
echo "==> Deployed! App is live at https://app.vibemapper.io"

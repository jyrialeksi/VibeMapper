#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# --- Prompt for environment ---
echo "Which environment?"
echo "  1) Staging"
echo "  2) Production"
read -rp "Choose [1/2]: " env_choice

case "$env_choice" in
  1) FLY_CONFIG="fly.staging.toml"; FLY_APP="user-story-mapper-staging"; APP_URL="https://user-story-mapper-staging.fly.dev" ;;
  2) FLY_CONFIG="fly.toml"; FLY_APP="user-story-mapper"; APP_URL="https://app.vibemapper.io" ;;
  *) echo "Invalid choice. Exiting."; exit 1 ;;
esac

echo ""
echo "Environment: $([ "$env_choice" = "1" ] && echo "STAGING" || echo "PRODUCTION")"
echo ""

# --- Prompt for deploy target ---
echo "What would you like to deploy?"
echo "  1) App (Fly.io → $APP_URL)"
echo "  2) Website (Cloudflare Pages → vibemapper.io)"
echo "  3) Both"
read -rp "Choose [1/2/3]: " choice

deploy_app=false
deploy_website=false

case "$choice" in
  1) deploy_app=true ;;
  2) deploy_website=true ;;
  3) deploy_app=true; deploy_website=true ;;
  *) echo "Invalid choice. Exiting."; exit 1 ;;
esac

# --- Deploy App to Fly.io ---
if [ "$deploy_app" = true ]; then
  SA_FILE="firebase-service-account.json"
  ENV_FILE="backend/.env"

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

  ENCRYPTION_KEY=$(grep -E '^ENCRYPTION_KEY=' "$ENV_FILE" | cut -d'=' -f2-)
  if [ -z "$ENCRYPTION_KEY" ]; then
    echo "Error: ENCRYPTION_KEY not found in $ENV_FILE"
    exit 1
  fi

  FIREBASE_PROJECT_ID=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$SA_FILE','utf8')).project_id)")
  FIREBASE_CLIENT_EMAIL=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$SA_FILE','utf8')).client_email)")
  FIREBASE_PRIVATE_KEY=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$SA_FILE','utf8')).private_key)")

  VITE_FIREBASE_API_KEY=$(grep -E '^VITE_FIREBASE_API_KEY=' "$ENV_FILE" | cut -d'=' -f2-)
  VITE_FIREBASE_AUTH_DOMAIN=$(grep -E '^VITE_FIREBASE_AUTH_DOMAIN=' "$ENV_FILE" | cut -d'=' -f2-)
  if [ -z "$VITE_FIREBASE_API_KEY" ]; then
    echo "Error: VITE_FIREBASE_API_KEY not found in $ENV_FILE"
    exit 1
  fi
  if [ -z "$VITE_FIREBASE_AUTH_DOMAIN" ]; then
    echo "Error: VITE_FIREBASE_AUTH_DOMAIN not found in $ENV_FILE"
    exit 1
  fi

  echo ""
  echo "==> Setting Fly.io secrets for $FLY_APP..."
  fly secrets set \
    ENCRYPTION_KEY="$ENCRYPTION_KEY" \
    FIREBASE_PROJECT_ID="$FIREBASE_PROJECT_ID" \
    FIREBASE_CLIENT_EMAIL="$FIREBASE_CLIENT_EMAIL" \
    FIREBASE_PRIVATE_KEY="$FIREBASE_PRIVATE_KEY" \
    VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY" \
    VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN" \
    --app "$FLY_APP" \
    --stage

  echo "==> Deploying app to Fly.io ($FLY_APP)..."
  fly deploy --config "$FLY_CONFIG"

  echo ""
  echo "==> App deployed! Live at $APP_URL"
fi

# --- Deploy Website to Cloudflare Pages ---
if [ "$deploy_website" = true ]; then
  if ! command -v wrangler &> /dev/null; then
    echo "Error: wrangler CLI not found. Install it: npm install -g wrangler"
    exit 1
  fi

  echo ""
  echo "==> Deploying website to Cloudflare Pages..."
  wrangler pages deploy website/ --project-name=vibemapper-site --branch=main --commit-dirty=true

  echo ""
  echo "==> Website deployed! Live at https://vibemapper.io"
fi

echo ""
echo "==> Done!"

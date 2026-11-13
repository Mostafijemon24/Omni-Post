#!/usr/bin/env bash
# One-time OmniPost setup on an Ubuntu/Debian VPS. Run ON THE SERVER as the user that will run the app:
#   curl -fsSL https://raw.githubusercontent.com/Mostafijemon24/Omni-Post/main/deploy/setup-vps.sh -o setup-vps.sh
#   bash setup-vps.sh
# Secrets are typed here, on the server, into app/.env.local (mode 600). They never leave the machine.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Mostafijemon24/Omni-Post.git}"
APP_DIR="${APP_DIR:-/var/www/omnipost}"
BRANCH="${BRANCH:-main}"
PORT="${PORT:-3000}"
PM2_NAME="${PM2_NAME:-omnipost}"

log() { printf '\n\033[1;32m▶ %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31m✖ %s\033[0m\n' "$*" >&2; exit 1; }

command -v node >/dev/null || die "Install Node.js 20+ first (e.g. via nvm), then re-run."
[ "$(node -p 'process.versions.node.split(".")[0]')" -ge 20 ] || die "Node.js 20+ required, found $(node -v)"
command -v git >/dev/null || die "Install git first: sudo apt-get install -y git"

if ! command -v pm2 >/dev/null; then
  log "Installing pm2"
  npm install -g pm2 || sudo npm install -g pm2
fi

# Refuse to fight an existing process for the port (e.g. the current site started some other way).
if command -v ss >/dev/null && ss -ltn "sport = :$PORT" | grep -q LISTEN && ! pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  die "Port $PORT is already in use by another process. Stop it first (or run with PORT=3001 and point nginx there)."
fi

if [ ! -d "$APP_DIR/.git" ]; then
  log "Cloning into $APP_DIR"
  sudo mkdir -p "$APP_DIR" && sudo chown "$(id -u):$(id -g)" "$APP_DIR"
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR" || die "Clone failed. If the repo is private, add this server's SSH key as a GitHub deploy key and use REPO_URL=git@github.com:Mostafijemon24/Omni-Post.git"
fi

ENV_FILE="$APP_DIR/app/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  log "Creating $ENV_FILE (input is hidden for secrets)"
  read -rp  "Public URL [https://post.avonixai.com]: " BASE;          BASE="${BASE:-https://post.avonixai.com}"
  read -rp  "Supabase URL [https://hmwxsdvhrloxlplfahhk.supabase.co]: " SBURL; SBURL="${SBURL:-https://hmwxsdvhrloxlplfahhk.supabase.co}"
  read -rsp "Supabase service_role key: " SBKEY; echo
  read -rsp "OpenRouter API key (Enter to skip): " ORKEY; echo
  read -rsp "Dashboard password (choose a strong one): " PW; echo
  [ -n "$SBKEY" ] && [ -n "$PW" ] || die "Supabase key and dashboard password are required."
  umask 077
  cat > "$ENV_FILE" <<ENV
PUBLIC_BASE_URL=$BASE
SUPABASE_URL=$SBURL
SUPABASE_SERVICE_ROLE_KEY=$SBKEY
OPENROUTER_API_KEY=$ORKEY
OPENROUTER_MODEL=anthropic/claude-sonnet-4.5
OMNIPOST_ADMIN_PASSWORD=$PW
OMNIPOST_SECRET=$(openssl rand -base64 48 | tr -d '\n')
ENV
  chmod 600 "$ENV_FILE"
  echo "  saved (only readable by $(whoami))"
else
  log "$ENV_FILE already exists — keeping it"
fi

APP_DIR="$APP_DIR" BRANCH="$BRANCH" PORT="$PORT" PM2_NAME="$PM2_NAME" bash "$APP_DIR/deploy/deploy.sh"

log "Making pm2 start on boot"
pm2 startup systemd -u "$(whoami)" --hp "$HOME" | tail -1 | grep -q '^sudo' && echo "  Run the 'sudo env PATH=…' line pm2 printed above once." || true
pm2 save >/dev/null

cat <<NEXT

Done. OmniPost listens on 127.0.0.1:$PORT.
If nginx doesn't already send post.avonixai.com to it, use deploy/nginx-omnipost.conf.
NEXT

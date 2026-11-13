#!/usr/bin/env bash
# Updates OmniPost on the VPS: pull the branch, install, build, (re)start under pm2, health-check.
# Run by GitHub Actions over SSH, or by hand:  APP_DIR=/var/www/omnipost bash deploy/deploy.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/omnipost}"
BRANCH="${BRANCH:-main}"
PM2_NAME="${PM2_NAME:-omnipost}"
PORT="${PORT:-3000}"

log() { printf '\n\033[1;32m▶ %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31m✖ %s\033[0m\n' "$*" >&2; exit 1; }

# Non-interactive SSH sessions often miss nvm/npm-global paths.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
export PATH="$HOME/.npm-global/bin:/usr/local/bin:$PATH"

command -v git >/dev/null || die "git is not installed"
command -v node >/dev/null || die "Node.js is not installed (need 20+)"
[ "$(node -p 'process.versions.node.split(".")[0]')" -ge 20 ] || die "Node.js 20+ required, found $(node -v)"
command -v pm2 >/dev/null || die "pm2 is not installed — run deploy/setup-vps.sh once first"
[ -d "$APP_DIR/.git" ] || die "$APP_DIR is not a git checkout — run deploy/setup-vps.sh once first"
[ -f "$APP_DIR/app/.env.local" ] || die "$APP_DIR/app/.env.local is missing — run deploy/setup-vps.sh once first"

log "Fetching $BRANCH"
cd "$APP_DIR"
git fetch --prune origin "$BRANCH"
git checkout -q -B "$BRANCH" "origin/$BRANCH"   # the server copy always matches GitHub exactly
git reset -q --hard "origin/$BRANCH"
echo "  at $(git log -1 --format='%h %s')"

log "Installing dependencies"
cd "$APP_DIR/app"
npm ci --no-audit --no-fund

log "Building"
npm run build

log "Starting under pm2 ($PM2_NAME, port $PORT)"
# A pm2 app with this name may already exist from an older install in another folder.
# Only reload it when it runs from this checkout; otherwise replace it (the old folder is left untouched).
CURRENT_CWD="$(pm2 jlist 2>/dev/null | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const a=JSON.parse(d).find(p=>p.name===process.argv[1]);process.stdout.write(a?a.pm2_env.pm_cwd||"":"")}catch{}})' "$PM2_NAME")"
if [ -n "$CURRENT_CWD" ] && [ "$(realpath -m "$CURRENT_CWD")" != "$(realpath -m "$APP_DIR/app")" ]; then
  echo "  pm2 app '$PM2_NAME' runs from $CURRENT_CWD — replacing it with $APP_DIR/app (old folder kept)"
  pm2 delete "$PM2_NAME" >/dev/null
fi
if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 reload "$PM2_NAME" --update-env
else
  pm2 start npm --name "$PM2_NAME" --cwd "$APP_DIR/app" -- start -- -p "$PORT"
fi
pm2 save >/dev/null

log "Health check"
for i in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:$PORT/api/v1/openapi.json" >/dev/null 2>&1; then
    echo "  OK — http://127.0.0.1:$PORT is serving"
    # The app is up; say so loudly if its database or login is not usable (MCP connectors fail without them).
    HEALTH="$(curl -sS -m 20 "http://127.0.0.1:$PORT/api/v1/health" 2>/dev/null || true)"
    case "$HEALTH" in
      '{"ok":true'*) echo "  Backend healthy (database and login configured)" ;;
      *) printf '\n\033[1;33m⚠ Backend needs attention:\033[0m %s\n' "$HEALTH" ;;
    esac
    exit 0
  fi
  sleep 2
done
pm2 logs "$PM2_NAME" --lines 40 --nostream || true
die "App did not answer on port $PORT after 40s"

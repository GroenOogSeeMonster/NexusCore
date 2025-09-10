#!/usr/bin/env bash

set -euo pipefail

# DevForge unified management script
# Usage:
#   scripts/devforge.sh --dev        # local dev (minimal footprint)
#   scripts/devforge.sh --prod       # production stack (80/443 via Caddy)
#   scripts/devforge.sh --stop       # stop all stacks
#   scripts/devforge.sh --status     # show status
#   scripts/devforge.sh --help

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DEV_COMPOSE="docker-compose.dev.yml"
PROD_COMPOSE="docker-compose.prod.yml"

info()  { echo -e "[INFO] $*"; }
warn()  { echo -e "[WARN] $*"; }
error() { echo -e "[ERROR] $*" 1>&2; }
success(){ echo -e "[SUCCESS] $*"; }

require() {
  if ! command -v "$1" >/dev/null 2>&1; then
    error "$1 is required. Please install it first."; exit 1;
  fi
}

ensure_env() {
  if [ ! -f .env ]; then
    if [ -f .env.example ]; then
      cp .env.example .env
      warn "Created .env from .env.example. Please review required values."
    else
      warn ".env not found and .env.example missing; proceeding without it."
    fi
  fi
}

health_check() {
  local url="$1"; local tries=${2:-20}; local sleep_s=${3:-2}
  info "Health check: ${url}"
  for i in $(seq 1 "$tries"); do
    if curl -sk --max-time 2 "${url}" >/dev/null; then
      success "Healthy: ${url}"
      return 0
    fi
    sleep "$sleep_s"
  done
  error "Health check failed for ${url}"
  return 1
}

dev() {
  require docker
  require docker compose || true
  require node

  ensure_env

  info "Starting dev infrastructure (Postgres, Redis, Adminer)"
  docker compose -f "$DEV_COMPOSE" up -d --remove-orphans

  # Wait for DB UI (Adminer) as a heuristic
  health_check "http://localhost:8080" 30 2 || true

  info "Installing web dependencies (minimal)"
  (cd apps/web && npm install --no-fund --no-audit --loglevel=error || true)

  success "Dev infra is up. Start the web app in a separate terminal:"
  echo "  cd apps/web && npx next dev --port 3000"
  echo "  Open http://localhost:3000"

  health_check "http://localhost:3000/api/health" 5 1 || true
}

prod() {
  require docker
  require docker compose || true

  ensure_env

  : "${DOMAIN:?Set DOMAIN env var (e.g., export DOMAIN=devforge.example.com)}"
  : "${CADDY_EMAIL:=devnull@example.com}"

  info "Bringing up production stack (this may build images)"
  DOMAIN="$DOMAIN" CADDY_EMAIL="$CADDY_EMAIL" docker compose -f "$PROD_COMPOSE" up -d --build

  info "Waiting for web to be healthy via reverse proxy"
  health_check "https://${DOMAIN}" 60 2 || health_check "http://${DOMAIN}" 60 2 || true
  # Local fallback if DNS not pointed yet
  health_check "http://localhost" 10 2 || true
  health_check "http://localhost:3000/api/health" 10 2 || true

  success "Production stack is up. Verify DNS A/AAAA records point to this host."
  echo "  - Domain: ${DOMAIN}"
  echo "  - TLS managed automatically by Caddy (Let's Encrypt)."
}

stop_all() {
  info "Stopping dev stack"
  docker compose -f "$DEV_COMPOSE" down -v || true
  info "Stopping prod stack"
  docker compose -f "$PROD_COMPOSE" down -v || true
  success "All stacks stopped."
}

status() {
  echo "--- Dev stack ---"; docker compose -f "$DEV_COMPOSE" ps || true
  echo "--- Prod stack ---"; docker compose -f "$PROD_COMPOSE" ps || true
}

case "${1:-}" in
  --dev) dev ;;
  --prod) prod ;;
  --stop) stop_all ;;
  --status) status ;;
  --help|*)
    cat <<USAGE
DevForge Manager

  scripts/devforge.sh --dev
      Start local dev infra (db, redis, adminer). Print web start command.

  scripts/devforge.sh --prod
      Start production stack with Caddy (80/443). Requires env DOMAIN.
      Optional: export CADDY_EMAIL for Let's Encrypt notifications.

  scripts/devforge.sh --stop
      Stop both dev and prod stacks.

  scripts/devforge.sh --status
      Show status of dev and prod stacks.
USAGE
    ;;
esac



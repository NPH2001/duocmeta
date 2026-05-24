#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

DOMAIN="${DOMAIN:-duocmeta.online}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-duocmeta_localprod}"
APP_HTTP_PORT="${APP_HTTP_PORT:-80}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
POSTGRES_DB="${POSTGRES_DB:-duocmeta}"
POSTGRES_USER="${POSTGRES_USER:-duocmeta}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@${DOMAIN}}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin123456!}"
ADMIN_FULL_NAME="${ADMIN_FULL_NAME:-Duocmeta Admin}"
ADMIN_PHONE="${ADMIN_PHONE:-0900000000}"
HOSTS_FILE="${HOSTS_FILE:-/etc/hosts}"
SKIP_HOSTS="${SKIP_HOSTS:-false}"
SKIP_DOCKER="${SKIP_DOCKER:-false}"

ROOT_ENV_FILE="${ROOT_DIR}/.env.local-prod"
BACKEND_ENV_FILE="${ROOT_DIR}/backend/.env.local-prod"
FRONTEND_ENV_FILE="${ROOT_DIR}/frontend/.env.local-prod"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.local-prod.yml"

log() {
  printf '[local-prod] %s\n' "$*"
}

warn() {
  printf '[local-prod][warn] %s\n' "$*" >&2
}

fail() {
  printf '[local-prod][error] %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "missing required command: $1"
}

bool_true() {
  case "${1:-}" in
    1|true|TRUE|yes|YES|on|ON) return 0 ;;
    *) return 1 ;;
  esac
}

read_env_value() {
  local file="$1"
  local key="$2"

  [[ -f "$file" ]] || return 0

  python3 - "$file" "$key" <<'PY'
from pathlib import Path
import sys

file_path = Path(sys.argv[1])
key = sys.argv[2]

for line in file_path.read_text(encoding="utf-8").splitlines():
    if not line or line.lstrip().startswith("#") or "=" not in line:
        continue
    current_key, value = line.split("=", 1)
    if current_key.strip() != key:
        continue
    print(value.strip().strip('"').strip("'"))
    break
PY
}

random_secret() {
  python3 - <<'PY'
import secrets
print(secrets.token_hex(32))
PY
}

ensure_hosts_entry() {
  if bool_true "$SKIP_HOSTS"; then
    log "skipping hosts file update"
    return
  fi

  if grep -Eq "(^|[[:space:]])${DOMAIN}([[:space:]]|\$)" "$HOSTS_FILE" 2>/dev/null; then
    log "hosts entry already present for ${DOMAIN}"
    return
  fi

  if [[ -w "$HOSTS_FILE" ]]; then
    printf '\n127.0.0.1 %s\n' "$DOMAIN" >>"$HOSTS_FILE"
    log "added hosts entry to ${HOSTS_FILE}"
    return
  fi

  if command -v sudo >/dev/null 2>&1; then
    sudo sh -c "printf '\n127.0.0.1 %s\n' '$DOMAIN' >> '$HOSTS_FILE'"
    log "added hosts entry to ${HOSTS_FILE} via sudo"
    return
  fi

  warn "could not update ${HOSTS_FILE}; add this line manually: 127.0.0.1 ${DOMAIN}"
}

write_env_files() {
  local existing_postgres_password existing_secret_key effective_postgres_password effective_secret_key

  existing_postgres_password="$(read_env_value "$ROOT_ENV_FILE" "POSTGRES_PASSWORD")"
  existing_secret_key="$(read_env_value "$BACKEND_ENV_FILE" "SECRET_KEY")"

  effective_postgres_password="${POSTGRES_PASSWORD:-${existing_postgres_password:-}}"
  effective_secret_key="${SECRET_KEY:-${existing_secret_key:-}}"

  if [[ -z "$effective_postgres_password" || "$effective_postgres_password" == "change-me" || "$effective_postgres_password" == "change-me-now" ]]; then
    effective_postgres_password="$(random_secret)"
  fi

  if [[ -z "$effective_secret_key" || "$effective_secret_key" == "replace-with-a-long-random-secret" ]]; then
    effective_secret_key="$(random_secret)"
  fi

  cat >"$ROOT_ENV_FILE" <<EOF
COMPOSE_PROJECT_NAME=${COMPOSE_PROJECT_NAME}
APP_HTTP_PORT=${APP_HTTP_PORT}
POSTGRES_DB=${POSTGRES_DB}
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${effective_postgres_password}
BACKEND_PORT=${BACKEND_PORT}
FRONTEND_PORT=${FRONTEND_PORT}
NGINX_SERVER_NAME=${DOMAIN}
EOF

  cat >"$BACKEND_ENV_FILE" <<EOF
APP_NAME=duocmeta-backend
APP_ENV=production
APP_DEBUG=false
APP_HOST=0.0.0.0
APP_PORT=${BACKEND_PORT}
API_V1_PREFIX=/api/v1
BACKEND_CORS_ORIGINS=["http://${DOMAIN}","https://${DOMAIN}"]
TRUSTED_HOSTS=["${DOMAIN}","localhost","127.0.0.1","backend"]

SECRET_KEY=${effective_secret_key}
ACCESS_TOKEN_TTL_MINUTES=15
REFRESH_TOKEN_TTL_DAYS=30
SECURITY_CONTENT_SECURITY_POLICY=default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'
SECURITY_PERMISSIONS_POLICY=camera=(), microphone=(), geolocation=(), payment=()
SECURITY_REFERRER_POLICY=strict-origin-when-cross-origin
SECURITY_HSTS_ENABLED=false
SECURITY_HSTS_MAX_AGE_SECONDS=31536000

DATABASE_URL=postgresql+psycopg://${POSTGRES_USER}:${effective_postgres_password}@postgres:5432/${POSTGRES_DB}
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

MEDIA_BUCKET_NAME=duocmeta-media
MEDIA_UPLOAD_PREFIX=uploads
MEDIA_UPLOAD_BASE_URL=http://${DOMAIN}/media-upload
MEDIA_PUBLIC_BASE_URL=http://${DOMAIN}/media
MEDIA_LOCAL_STORAGE_PATH=/app/storage/media
MEDIA_PRESIGN_TTL_SECONDS=900
MEDIA_MAX_UPLOAD_BYTES=10485760
MEDIA_OPTIMIZATION_ENABLED=true
MEDIA_OPTIMIZATION_FORMAT=webp
MEDIA_OPTIMIZATION_WIDTHS=[320,1200]

ERROR_TRACKING_ENABLED=true
ERROR_TRACKING_PROVIDER=logging

RATE_LIMIT_ENABLED=true
RATE_LIMIT_USE_REDIS=true
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_AUTH_LIMIT=10
RATE_LIMIT_CART_LIMIT=60
RATE_LIMIT_CHECKOUT_LIMIT=20
RATE_LIMIT_KEY_PREFIX=duocmeta:rate_limit

RUN_DB_MIGRATIONS_ON_START=true
UVICORN_WORKERS=2
EOF

  cat >"$FRONTEND_ENV_FILE" <<EOF
PORT=${FRONTEND_PORT}
NEXT_PUBLIC_SITE_URL=http://${DOMAIN}${APP_HTTP_PORT:+$( [[ "$APP_HTTP_PORT" == "80" ]] || printf ':%s' "$APP_HTTP_PORT" )}
NEXT_PUBLIC_API_BASE_URL=http://${DOMAIN}${APP_HTTP_PORT:+$( [[ "$APP_HTTP_PORT" == "80" ]] || printf ':%s' "$APP_HTTP_PORT" )}/api/v1
NEXT_PUBLIC_MEDIA_BASE_URL=http://${DOMAIN}${APP_HTTP_PORT:+$( [[ "$APP_HTTP_PORT" == "80" ]] || printf ':%s' "$APP_HTTP_PORT" )}/media
INTERNAL_API_BASE_URL=http://backend:${BACKEND_PORT}/api/v1

NEXT_PUBLIC_ERROR_TRACKING_ENABLED=true
NEXT_PUBLIC_ERROR_TRACKING_PROVIDER=console

NEXT_PUBLIC_CONTACT_PHONE_HREF=tel:+84366159814
NEXT_PUBLIC_CONTACT_ZALO_HREF=https://zalo.me/84123456789
NEXT_PUBLIC_CONTACT_MESSENGER_HREF=https://m.me/duocmeta
EOF

  log "wrote local-prod env files"
}

public_base_url() {
  if [[ "$APP_HTTP_PORT" == "80" ]]; then
    printf 'http://%s' "$DOMAIN"
  else
    printf 'http://%s:%s' "$DOMAIN" "$APP_HTTP_PORT"
  fi
}

compose() {
  docker compose --env-file "$ROOT_ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

wait_for_http() {
  local url="$1"
  local description="$2"
  local attempt

  for attempt in $(seq 1 90); do
    if curl -fsS -H "Host: ${DOMAIN}" "$url" >/dev/null 2>&1; then
      log "${description} is ready"
      return 0
    fi

    sleep 2
  done

  warn "${description} did not become ready in time"
  compose logs --tail=200 backend frontend nginx || true
  return 1
}

seed_data() {
  compose exec -T backend python -m app.scripts.seed_roles_permissions
  compose exec -T backend python -m app.scripts.seed_oncology_catalog
  compose exec -T backend python -m app.scripts.seed_saphnelo_article
  log "seeded roles, catalog, and article"
}

ensure_admin_user() {
  compose exec -T \
    -e ADMIN_EMAIL="$ADMIN_EMAIL" \
    -e ADMIN_PASSWORD="$ADMIN_PASSWORD" \
    -e ADMIN_FULL_NAME="$ADMIN_FULL_NAME" \
    -e ADMIN_PHONE="$ADMIN_PHONE" \
    backend python - <<'PY'
from datetime import UTC, datetime
import os

from sqlalchemy import select

from app.core.db import SessionLocal
from app.core.security import hash_password
from app.models.identity import Role, User, UserRole

admin_email = os.environ["ADMIN_EMAIL"].strip().lower()
admin_password = os.environ["ADMIN_PASSWORD"]
admin_full_name = os.environ["ADMIN_FULL_NAME"]
admin_phone = os.environ["ADMIN_PHONE"] or None

with SessionLocal() as session:
    role = session.scalar(select(Role).where(Role.code == "admin"))
    if role is None:
        raise SystemExit("admin role was not found; seed_roles_permissions must succeed first")

    user = session.scalar(select(User).where(User.email == admin_email, User.deleted_at.is_(None)))
    now = datetime.now(UTC)

    if user is None:
        user = User(
            email=admin_email,
            password_hash=hash_password(admin_password),
            full_name=admin_full_name,
            phone=admin_phone,
            status="active",
            email_verified_at=now,
        )
        session.add(user)
        session.flush()
    else:
        user.password_hash = hash_password(admin_password)
        user.full_name = admin_full_name
        user.phone = admin_phone
        user.status = "active"
        user.email_verified_at = user.email_verified_at or now
        session.flush()

    existing = session.scalar(
        select(UserRole).where(
            UserRole.user_id == user.id,
            UserRole.role_id == role.id,
        )
    )
    if existing is None:
        session.add(UserRole(user_id=user.id, role_id=role.id))

    session.commit()
    print(f"admin_ready email={admin_email}")
PY
  log "admin user is ready"
}

run_smoke_checks() {
  local base_url
  base_url="$(public_base_url)"

  curl -fsS -H "Host: ${DOMAIN}" "http://127.0.0.1:${APP_HTTP_PORT}/api/v1/health" >/dev/null
  curl -fsS -H "Host: ${DOMAIN}" "http://127.0.0.1:${APP_HTTP_PORT}/api/v1/ready" >/dev/null
  curl -fsS -H "Host: ${DOMAIN}" "http://127.0.0.1:${APP_HTTP_PORT}/health" >/dev/null
  curl -fsS -H "Host: ${DOMAIN}" "http://127.0.0.1:${APP_HTTP_PORT}/" >/dev/null

  cat <<EOF

✅ Local production-like stack is ready.

URL: ${base_url}
Admin login: ${base_url}/login
Admin panel: ${base_url}/admin
Products: ${base_url}/products
Categories: ${base_url}/categories
Blog: ${base_url}/blog

Admin credentials
  email: ${ADMIN_EMAIL}
  password: ${ADMIN_PASSWORD}

Useful commands
  docker compose --env-file .env.local-prod -f docker-compose.local-prod.yml ps
  docker compose --env-file .env.local-prod -f docker-compose.local-prod.yml logs --tail=200 backend frontend nginx
  docker compose --env-file .env.local-prod -f docker-compose.local-prod.yml down
EOF
}

main() {
  require_command python3

  write_env_files
  ensure_hosts_entry

  if bool_true "$SKIP_DOCKER"; then
    log "SKIP_DOCKER enabled; env/bootstrap files prepared only"
    return 0
  fi

  require_command docker
  require_command curl

  [[ -f "$COMPOSE_FILE" ]] || fail "missing compose file: $COMPOSE_FILE"

  compose up -d --build
  wait_for_http "http://127.0.0.1:${APP_HTTP_PORT}/api/v1/ready" "backend readiness"
  wait_for_http "http://127.0.0.1:${APP_HTTP_PORT}/health" "frontend health"
  seed_data
  ensure_admin_user
  run_smoke_checks
}

main "$@"

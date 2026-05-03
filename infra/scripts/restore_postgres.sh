#!/usr/bin/env bash
set -Eeuo pipefail

# Restore a PostgreSQL custom-format backup using either DATABASE_URL or PG* variables.
# Required: pg_restore on PATH, BACKUP_FILE, and RESTORE_CONFIRM=YES.

BACKUP_FILE="${BACKUP_FILE:?BACKUP_FILE is required}"
RESTORE_JOBS="${RESTORE_JOBS:-1}"

log() {
  printf '[restore-postgres] %s\n' "$*" >&2
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "missing required command: $1"
    exit 127
  fi
}

run_pg_restore() {
  if [[ -n "${DATABASE_URL:-}" ]]; then
    pg_restore --clean --if-exists --no-owner --no-acl --jobs "$RESTORE_JOBS" --dbname "$DATABASE_URL" "$BACKUP_FILE"
    return
  fi

  : "${PGHOST:?PGHOST is required when DATABASE_URL is not set}"
  : "${PGUSER:?PGUSER is required when DATABASE_URL is not set}"
  : "${PGDATABASE:?PGDATABASE is required when DATABASE_URL is not set}"

  pg_restore --clean --if-exists --no-owner --no-acl --jobs "$RESTORE_JOBS" --dbname "$PGDATABASE" "$BACKUP_FILE"
}

require_command pg_restore

if [[ ! -f "$BACKUP_FILE" ]]; then
  log "backup file not found: $BACKUP_FILE"
  exit 2
fi

if [[ "${RESTORE_CONFIRM:-}" != "YES" ]]; then
  log "refusing to restore without RESTORE_CONFIRM=YES"
  exit 3
fi

if [[ -f "$BACKUP_FILE.sha256" ]] && command -v sha256sum >/dev/null 2>&1; then
  sha256sum --check "$BACKUP_FILE.sha256"
fi

log "restoring $BACKUP_FILE"
run_pg_restore
log "restore complete"

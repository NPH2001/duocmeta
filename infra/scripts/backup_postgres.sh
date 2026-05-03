#!/usr/bin/env bash
set -Eeuo pipefail

# Create a PostgreSQL custom-format backup using either DATABASE_URL or PG* variables.
# Required: pg_dump on PATH, and either DATABASE_URL or PGHOST/PGUSER/PGDATABASE.

umask 077

BACKUP_DIR="${BACKUP_DIR:-./backups/postgres}"
BACKUP_NAME="${BACKUP_NAME:-duocmeta-$(date -u +%Y%m%dT%H%M%SZ).dump}"
BACKUP_FILE="${BACKUP_FILE:-${BACKUP_DIR%/}/${BACKUP_NAME}}"

log() {
  printf '[backup-postgres] %s\n' "$*" >&2
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "missing required command: $1"
    exit 127
  fi
}

run_pg_dump() {
  if [[ -n "${DATABASE_URL:-}" ]]; then
    pg_dump --format=custom --no-owner --no-acl --file "$BACKUP_FILE" "$DATABASE_URL"
    return
  fi

  : "${PGHOST:?PGHOST is required when DATABASE_URL is not set}"
  : "${PGUSER:?PGUSER is required when DATABASE_URL is not set}"
  : "${PGDATABASE:?PGDATABASE is required when DATABASE_URL is not set}"

  pg_dump --format=custom --no-owner --no-acl --file "$BACKUP_FILE"
}

require_command pg_dump
mkdir -p "$(dirname "$BACKUP_FILE")"

log "writing custom-format backup to $BACKUP_FILE"
run_pg_dump

if command -v sha256sum >/dev/null 2>&1; then
  sha256sum "$BACKUP_FILE" >"$BACKUP_FILE.sha256"
  log "wrote checksum to $BACKUP_FILE.sha256"
fi

log "backup complete"

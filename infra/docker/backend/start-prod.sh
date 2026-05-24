#!/bin/sh
set -eu

if [ "${RUN_DB_MIGRATIONS_ON_START:-false}" = "true" ]; then
  alembic upgrade head
fi

exec python -m uvicorn app.main:app --host 0.0.0.0 --port "${APP_PORT:-8000}" --workers "${UVICORN_WORKERS:-2}"

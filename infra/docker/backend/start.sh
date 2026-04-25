#!/bin/sh
set -eu

if [ -f /app/.env ]; then
  set -a
  . /app/.env
  set +a
elif [ -f /app/.env.example ]; then
  set -a
  . /app/.env.example
  set +a
fi

if [ -f /app/requirements.txt ]; then
  python -m pip install --no-cache-dir -r /app/requirements.txt
fi

if [ -f /app/app/main.py ]; then
  exec python -m uvicorn app.main:app --host 0.0.0.0 --port "${APP_PORT:-8000}" --reload
fi

echo "Backend scaffold is ready, but app/main.py is not implemented yet."
exec tail -f /dev/null

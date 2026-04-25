#!/bin/sh
set -eu

if [ -f /app/.env.local ]; then
  export $(grep -v '^#' /app/.env.local | xargs)
elif [ -f /app/.env.example ]; then
  export $(grep -v '^#' /app/.env.example | xargs)
fi

if [ -f /app/package.json ]; then
  npm install
  exec npm run dev -- --hostname 0.0.0.0 --port "${PORT:-3000}"
fi

echo "Frontend scaffold is ready, but package.json is not implemented yet."
exec tail -f /dev/null

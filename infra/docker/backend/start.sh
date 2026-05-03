#!/bin/sh
set -eu

load_env_file() {
  env_file="$1"

  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      "" | \#*)
        continue
        ;;
    esac

    case "$line" in
      export\ *)
        line=${line#export }
        ;;
    esac

    key=${line%%=*}
    value=${line#*=}

    if [ "$key" = "$line" ]; then
      continue
    fi

    case "$key" in
      "" | *[!ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_]*)
        continue
        ;;
    esac

    case "$value" in
      \"*\")
        value=${value#\"}
        value=${value%\"}
        ;;
      \'*\')
        value=${value#\'}
        value=${value%\'}
        ;;
    esac

    export "$key=$value"
  done < "$env_file"
}

if [ -f /app/.env ]; then
  load_env_file /app/.env
elif [ -f /app/.env.example ]; then
  load_env_file /app/.env.example
fi

if [ -f /app/requirements.txt ]; then
  python -m pip install --no-cache-dir -r /app/requirements.txt
fi

if [ -f /app/app/main.py ]; then
  exec python -m uvicorn app.main:app --host 0.0.0.0 --port "${APP_PORT:-8000}" --reload
fi

echo "Backend scaffold is ready, but app/main.py is not implemented yet."
exec tail -f /dev/null

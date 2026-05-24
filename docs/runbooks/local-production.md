# Local Production-like Deployment Runbook

This runbook starts the Duocmeta stack on a local machine in a production-like posture:

- immutable application containers,
- Nginx reverse proxy in front,
- Next.js built with `next build`,
- FastAPI started without `--reload`,
- PostgreSQL and Redis running as local containers,
- optional real-domain exposure later via Cloudflare Tunnel or router port-forwarding.

## When to use this runbook

Use this mode when you want to validate a near-production runtime before renting a VPS/cloud server.
It is appropriate for:

- internal QA,
- demoing the site on your own machine,
- checking migrations and startup order,
- validating a domain/tunnel setup.

It is **not** a substitute for a real production host because uptime, security boundaries, backups, and network reliability still depend on the local machine.

## Files used

- `docker-compose.local-prod.yml`
- `.env.local-prod`
- `backend/.env.local-prod`
- `frontend/.env.local-prod`
- `infra/nginx/site.conf.template`
- `infra/scripts/start_local_prod.sh`

## Quick start — one command

If Docker is already available on the machine, the fastest path is:

```bash
bash infra/scripts/start_local_prod.sh
```

What the script does:

- writes or refreshes the three local-prod env files for the active domain,
- tries to add `127.0.0.1 duocmeta.online` to the hosts file,
- builds and starts the local production-like stack,
- seeds roles/permissions, catalog data, and a sample article,
- creates or resets a usable admin account and assigns the `admin` role,
- runs smoke checks and prints the final URLs.

The generated backend env uses JSON arrays for list-shaped variables so it is compatible with `pydantic-settings` when values are injected as container environment variables.

Optional overrides:

```bash
DOMAIN=duocmeta.online ADMIN_EMAIL=admin@duocmeta.online ADMIN_PASSWORD='Admin123456!' bash infra/scripts/start_local_prod.sh
```

## 1. Prepare env files

Copy examples:

```bash
cp .env.local-prod.example .env.local-prod
cp backend/.env.local-prod.example backend/.env.local-prod
cp frontend/.env.local-prod.example frontend/.env.local-prod
```

Required edits before first run:

- set a real `POSTGRES_PASSWORD`
- set a strong `SECRET_KEY`
- confirm `NGINX_SERVER_NAME=duocmeta.online`
- keep `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_BASE_URL`, and backend host/CORS values aligned with the chosen domain

## 2. Map the domain locally

### Option A — local-only browser access

Add a hosts entry on the same machine:

- Linux/macOS: `/etc/hosts`
- Windows: `C:\Windows\System32\drivers\etc\hosts`

Entry:

```text
127.0.0.1 duocmeta.online
```

Then the browser can open:

```text
http://duocmeta.online
```

### Option B — same LAN access from other devices

Point the domain to the machine's LAN IP in your router DNS override or add hosts entries on test devices:

```text
192.168.x.x duocmeta.online
```

### Option C — public temporary access before buying a VPS

Use a tunnel such as Cloudflare Tunnel so the public HTTPS endpoint forwards to local HTTP origin `http://localhost:80`.
This is the safest path when the machine is behind NAT and you do not want to open direct router ports.

## 3. Start the stack

```bash
docker compose \
  --env-file .env.local-prod \
  -f docker-compose.local-prod.yml \
  up -d --build
```

## 4. Verify runtime

```bash
curl -H 'Host: duocmeta.online' http://127.0.0.1/api/v1/health
curl -H 'Host: duocmeta.online' http://127.0.0.1/api/v1/ready
curl -H 'Host: duocmeta.online' http://127.0.0.1/health
curl -H 'Host: duocmeta.online' http://127.0.0.1/
```

If the local hosts file is already configured, the same checks can be run directly against the domain:

```bash
curl http://duocmeta.online/api/v1/health
curl http://duocmeta.online/api/v1/ready
curl http://duocmeta.online/health
```

## 5. Operational notes

- `RUN_DB_MIGRATIONS_ON_START=true` is enabled in the local-prod backend example for convenience.
  For stricter release control later, disable it and run Alembic manually.
- Uploaded media is stored in the named Docker volume `backend_media_data`.
- PostgreSQL data is stored in `postgres_data`.
- Redis data is stored in `redis_data`.
- This runbook intentionally serves HTTP at the origin. Add HTTPS at the tunnel/proxy layer when exposing the site publicly.

## 6. Stop the stack

```bash
docker compose \
  --env-file .env.local-prod \
  -f docker-compose.local-prod.yml \
  down
```

## 7. Rebuild after source changes

```bash
docker compose \
  --env-file .env.local-prod \
  -f docker-compose.local-prod.yml \
  up -d --build
```

## 8. Smoke checklist

- home page loads
- `/products` loads
- `/categories` loads
- `/api/v1/health` returns success envelope
- `/api/v1/ready` reports dependencies ready
- add-to-cart works with a test variant
- checkout preview returns totals
- admin login works for a seeded admin account

## 9. Recommended next step after local stabilization

When the stack is stable on the local machine, move the same production-like setup to a VPS and then:

- terminate HTTPS on the server or Cloudflare,
- replace local Postgres/Redis with managed or isolated services,
- create a backup schedule,
- deploy immutable images from CI.

# Deployment Runbook

This runbook describes staging and production deployment for the Duocmeta ecommerce monorepo.
It assumes the locked stack documented in `/docs`: Next.js frontend, FastAPI backend, PostgreSQL, Redis, S3-compatible media storage, Nginx, Docker, and Alembic.

## Environments

| Environment | Purpose | Deployment posture |
| --- | --- | --- |
| `local` | Developer validation | Docker Compose or direct app processes |
| `staging` | Release candidate validation with production-like data shape | Automated or operator-triggered deploy from a release branch/tag |
| `production` | Customer-facing commerce | Tagged immutable release with backup, migration, rollback, and smoke checks |

## Required references

- Environment variables: `docs/runbooks/environment.md`
- PostgreSQL backup/restore: `docs/runbooks/postgres-backup-restore.md`
- API conventions: `docs/api/conventions.md`
- Architecture/backlog: `docs/architecture/codex-ready-architecture.md`

## Pre-deploy checklist

Complete before staging and production deploys:

- CI is green for backend lint/tests/migrations and frontend lint/typecheck/build.
- Release SHA/tag is identified and immutable.
- Database migrations are reviewed for backward compatibility.
- Required environment variables are present in the target secret manager/runtime.
- Rollback target image/tag is known.
- Operator has access to logs, database backup location, and health endpoints.
- For production, a fresh PostgreSQL backup is created or a recent verified backup is available.

## Environment variable checklist

Validate these categories before starting services:

- Backend runtime: `APP_ENV`, `APP_DEBUG`, `APP_HOST`, `APP_PORT`, `API_V1_PREFIX`
- Security: `SECRET_KEY`, `TRUSTED_HOSTS`, `BACKEND_CORS_ORIGINS`, security header settings
- Data stores: `DATABASE_URL`, `REDIS_URL`, Celery broker/result URLs when workers are enabled
- Media: S3 endpoint/bucket/access credentials and public media base URL
- Frontend: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_MEDIA_BASE_URL`, `INTERNAL_API_BASE_URL`
- Operations: rate-limit settings and error-tracking provider/toggles

Rules:

- Never commit real values.
- Browser-exposed values must use only the `NEXT_PUBLIC_` prefix when intended for clients.
- Production `APP_DEBUG` must be `false`.
- Production `BACKEND_CORS_ORIGINS` and `TRUSTED_HOSTS` must list exact hostnames, not broad wildcards.

## Local deploy

```bash
docker compose up -d --build
```

Then verify:

```bash
curl -fsS http://127.0.0.1:8080/api/v1/health
curl -fsS http://127.0.0.1:8080/health
```

## Staging deployment procedure

1. Pull the selected release branch or tag.
2. Load staging secrets into the runtime environment.
3. Build or pull immutable backend/frontend images for the selected SHA.
4. Start dependencies if they are not managed services:

```bash
docker compose up -d postgres redis
```

5. Run migrations before switching traffic:

```bash
cd backend
alembic upgrade head
```

6. Start or restart backend, frontend, and Nginx:

```bash
docker compose up -d --build backend frontend nginx
```

7. Run smoke checks from this runbook.
8. Watch logs for at least one normal request cycle:

```bash
docker compose logs --tail=200 backend frontend nginx
```

9. If staging smoke checks pass, mark the release candidate ready for production.

## Production deployment procedure

1. Announce maintenance window if the release contains risky migrations or expected write interruptions.
2. Confirm current production version and rollback image/tag.
3. Create or verify a current PostgreSQL backup using `docs/runbooks/postgres-backup-restore.md`.
4. Pull immutable release images for the selected tag/SHA.
5. Run database migrations:

```bash
cd backend
alembic upgrade head
```

6. Deploy backend first and wait for readiness:

```bash
curl -fsS https://api.example.com/api/v1/ready
```

7. Deploy frontend and Nginx/reverse proxy changes.
8. Warm public pages if applicable:

```bash
curl -fsS https://www.example.com/
curl -fsS https://www.example.com/products
curl -fsS https://www.example.com/categories
curl -fsS https://www.example.com/blog
curl -fsS https://www.example.com/sitemap.xml
```

9. Run production smoke checks.
10. Monitor logs/errors, payment webhook processing, and checkout-related metrics.
11. Close the deployment only after smoke checks pass and no new critical errors appear.

## Migration policy

- Prefer backward-compatible migrations.
- Separate schema changes from destructive data cleanup when possible.
- For large tables, use batched backfills instead of long exclusive locks.
- Run migrations on staging before production.
- If a migration is not safely reversible, document the forward-fix and backup restore plan before deployment.

Useful commands:

```bash
cd backend
alembic current
alembic history --verbose
alembic upgrade head
```

Rollback of schema migrations must be handled case-by-case. Prefer application rollback first; restore database only when the migration is destructive or data corruption occurred.

## Rollback strategy

### Application-only rollback

Use when code is faulty but database state is compatible:

1. Repoint backend/frontend services to the previous known-good image/tag.
2. Restart services.
3. Run readiness and smoke checks.
4. Keep the newer database migration in place if it is backward compatible.
5. Create a follow-up fix ticket.

### Database restore rollback

Use only when migration or runtime behavior corrupted data or made the previous application incompatible:

1. Stop write traffic or put the site into maintenance mode.
2. Capture current logs and database state for incident analysis.
3. Restore the selected backup using `docs/runbooks/postgres-backup-restore.md`.
4. Deploy the matching previous application image/tag.
5. Run post-restore verification and smoke checks.
6. Publish an incident note and preserve artifacts.

## Smoke checks

Run at minimum after staging and production deploys:

### Backend

```bash
curl -fsS https://api.example.com/api/v1/health
curl -fsS https://api.example.com/api/v1/ready
```

Expected:

- `/health` returns status `ok`.
- `/ready` returns status `ready` and database/Redis checks are `ok`.
- Responses include `X-Request-ID` and configured security headers.

### Storefront

- Home page loads.
- Product listing page loads.
- Product detail page loads.
- Category page loads.
- Blog page loads when CMS API is available.
- `robots.txt` and `sitemap.xml` load.

### Commerce

- Guest cart add/update/remove works against a test product variant.
- Checkout preview returns backend-owned totals.
- Place-order requires an `Idempotency-Key`.
- Payment initiation returns provider-owned action data in non-production test mode.

### Account/admin

- Login works for a test account.
- Account order history loads for that account.
- Admin RBAC guard allows a known admin and rejects a non-admin.
- Admin product list and orders list load.

## Logs and alerts to watch

- Backend 5xx rate and unhandled exception events.
- Request latency spikes on checkout/cart/payment endpoints.
- Payment webhook failures or duplicate-event anomalies.
- Database connection errors, migration errors, or lock timeouts.
- Redis connection errors affecting rate limiting, readiness, or future queues.
- Nginx upstream errors.

## Deployment completion criteria

A deployment is complete only when:

- target image/tag is running in all expected services,
- migrations are at Alembic head,
- health/readiness checks pass,
- smoke checks pass,
- logs show no new critical errors,
- rollback artifacts and backup references are recorded in the release notes.

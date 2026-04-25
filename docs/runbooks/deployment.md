# Deployment Runbook

## Environments

* local
* staging
* production

## Pre-Deploy Checklist

* CI green
* Tests passing
* Migrations reviewed
* Env vars updated
* Rollback plan ready
* Release notes prepared

## Local

```bash
docker compose up -d
```

## Staging Deploy

1. Pull latest code.
2. Build frontend image.
3. Build backend image.
4. Run database migration.
5. Restart services.
6. Run smoke tests.

## Production Deploy (Recommended)

1. Announce maintenance window if needed.
2. Backup database.
3. Pull tagged release.
4. Build/pull images.
5. Run migrations.
6. Deploy backend.
7. Deploy frontend.
8. Warm caches.
9. Run smoke checks.
10. Monitor logs/errors.

## Rollback Strategy

If severe issue:

1. Revert to previous release image.
2. Restore DB only if migration is destructive and necessary.
3. Re-run smoke checks.
4. Publish incident note.

## Smoke Checks

* Home page loads
* Product page loads
* Login works
* Cart add item works
* Checkout preview works
* Admin login works
* Health endpoint OK

## Health Endpoints

* GET /api/v1/health
* Frontend root page

## Logs to Watch

* 5xx errors
* Payment webhook failures
* DB connection errors
* Timeout spikes

## Secrets Policy

* Never commit secrets.
* Use environment variables or secret manager.

## Migration Policy

* Prefer backward-compatible migrations.
* Large data migrations in batches.
* Test on staging first.

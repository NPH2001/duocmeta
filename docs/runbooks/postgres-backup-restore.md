# PostgreSQL Backup and Restore Runbook

This runbook covers operational PostgreSQL backups for Duocmeta staging and production environments.
It intentionally uses environment variables and never stores credentials in scripts or committed files.

## Scope

- Database: PostgreSQL 16-compatible targets.
- Format: `pg_dump --format=custom` so restores can use `pg_restore` with `--clean --if-exists`.
- Scripts:
  - `infra/scripts/backup_postgres.sh`
  - `infra/scripts/restore_postgres.sh`

## Required tools

Install the PostgreSQL client tools on the operator machine or CI runner:

- `pg_dump`
- `pg_restore`
- `sha256sum` optional but recommended for checksum creation/verification

For local Docker-only workflows, run equivalent commands from the `postgres` container if the host does not have PostgreSQL client tools installed.

## Environment variables

The scripts support either a single connection URL or standard `PG*` variables.

### Connection option A: URL

```bash
export DATABASE_URL='postgresql://USER:PASSWORD@HOST:5432/DBNAME'
```

### Connection option B: libpq variables

```bash
export PGHOST='HOST'
export PGPORT='5432'
export PGDATABASE='DBNAME'
export PGUSER='USER'
export PGPASSWORD='PASSWORD'
```

Do not echo secrets in shell history. Prefer a secret manager, CI protected variables, or an ephemeral `.env` file outside git.

## Backup procedure

1. Confirm target environment and database name.
2. Confirm application write traffic expectations. For production, prefer a planned low-write window or a replica backup if available.
3. Export connection variables.
4. Run the backup script:

```bash
BACKUP_DIR=./backups/postgres ./infra/scripts/backup_postgres.sh
```

Optional explicit filename:

```bash
BACKUP_FILE=./backups/postgres/duocmeta-prod-20260502T120000Z.dump \
  ./infra/scripts/backup_postgres.sh
```

The script writes a custom-format `.dump` file and, when `sha256sum` is available, a `.dump.sha256` checksum file.

## Restore procedure

Restores are destructive because the script uses `pg_restore --clean --if-exists`.
Run restores only against the intended target database.

1. Confirm the target environment is not production unless this is an approved incident recovery.
2. Ensure the target database exists and the role has permission to drop/recreate objects.
3. Export connection variables for the target database.
4. Set `BACKUP_FILE` to the selected backup.
5. Require explicit confirmation:

```bash
BACKUP_FILE=./backups/postgres/duocmeta-prod-20260502T120000Z.dump \
RESTORE_CONFIRM=YES \
./infra/scripts/restore_postgres.sh
```

Optional parallel restore:

```bash
BACKUP_FILE=./backups/postgres/duocmeta-prod-20260502T120000Z.dump \
RESTORE_CONFIRM=YES \
RESTORE_JOBS=4 \
./infra/scripts/restore_postgres.sh
```

If a sibling checksum file exists, the restore script verifies it before restoring.

## Local Docker examples

Host has PostgreSQL client tools:

```bash
export DATABASE_URL='postgresql://duocmeta:123456@127.0.0.1:5432/duocmeta'
./infra/scripts/backup_postgres.sh
```

Using the Compose `postgres` container directly:

```bash
mkdir -p backups/postgres
docker compose exec -T postgres pg_dump \
  -U "${POSTGRES_USER:-duocmeta}" \
  -d "${POSTGRES_DB:-duocmeta}" \
  --format=custom --no-owner --no-acl \
  > backups/postgres/duocmeta-local.dump
```

Restore through Compose after copying/streaming the dump:

```bash
RESTORE_CONFIRM=YES BACKUP_FILE=backups/postgres/duocmeta-local.dump \
DATABASE_URL='postgresql://duocmeta:123456@127.0.0.1:5432/duocmeta' \
./infra/scripts/restore_postgres.sh
```

## Post-restore verification

After every restore:

1. Run Alembic upgrade to ensure schema state is current:

```bash
cd backend
alembic upgrade head
```

2. Run backend readiness:

```bash
curl -fsS http://127.0.0.1:8000/api/v1/ready
```

3. Run a smoke path appropriate to the environment:

- public product listing/detail loads
- cart mutation works with a test cart session
- admin login/RBAC check works with a known non-production admin account
- checkout preview returns backend-owned totals for a seeded cart

4. Inspect application logs for database connection, migration, or integrity errors.

## Retention guidance

- Keep at least 7 daily backups and 4 weekly backups for production unless a stricter business policy applies.
- Store production backups encrypted at rest and outside the primary database host.
- Test restore from a production-like backup at least once per release cycle.
- Delete local backup artifacts after use; `backups/`, `*.dump`, and `*.dump.sha256` are gitignored.

## Failure handling

- If backup fails, do not delete the last known-good backup.
- If restore fails mid-run, capture the terminal output, recreate the target database if needed, and retry from the same verified dump.
- If checksum verification fails, treat the dump as corrupted and select another backup.

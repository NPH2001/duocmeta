# Environment Variable Strategy

## Goals

- Keep secrets out of source control.
- Separate infrastructure, backend, and frontend ownership clearly.
- Support local Docker Compose first, while keeping local non-Docker execution possible.
- Avoid leaking server-only configuration into browser bundles.

## Files

Use the following checked-in example files as the source of truth for required variables:

- `/.env.example` for Docker Compose and shared infrastructure defaults
- `backend/.env.example` for backend runtime variables
- `frontend/.env.example` for frontend runtime variables

Copy them locally as needed:

- `cp .env.example .env`
- `cp backend/.env.example backend/.env`
- `cp frontend/.env.example frontend/.env.local`

Do not commit the copied files.

## Ownership Rules

- Root `.env` is for container orchestration only.
- `backend/.env` is for FastAPI, workers, database, Redis, auth, and storage settings.
- `frontend/.env.local` is for Next.js runtime configuration.
- Any variable exposed to the browser must start with `NEXT_PUBLIC_`.
- Secrets must never use the `NEXT_PUBLIC_` prefix.

## Naming Rules

- Use uppercase snake case for all variables.
- Prefix variables by concern when useful:
  - `APP_` for app runtime
  - `API_` for API routing
  - `POSTGRES_` for database container settings
  - `REDIS_` for Redis container settings
  - `S3_` for object storage
  - `NEXT_PUBLIC_` for browser-visible frontend settings

## Variable Reference

### Root `/.env`

| Variable | Required | Description |
| --- | --- | --- |
| `COMPOSE_PROJECT_NAME` | yes | Docker Compose project name prefix |
| `APP_HTTP_PORT` | yes | Public HTTP port exposed by Nginx |
| `POSTGRES_DB` | yes | Local PostgreSQL database name |
| `POSTGRES_USER` | yes | Local PostgreSQL username |
| `POSTGRES_PASSWORD` | yes | Local PostgreSQL password |
| `POSTGRES_PORT` | yes | Host port mapped to PostgreSQL |
| `REDIS_PORT` | yes | Host port mapped to Redis |
| `BACKEND_PORT` | yes | Internal backend container port |
| `FRONTEND_PORT` | yes | Internal frontend container port |

### `backend/.env`

| Variable | Required | Description |
| --- | --- | --- |
| `APP_NAME` | yes | Backend service name for logs and metadata |
| `APP_ENV` | yes | Runtime environment such as `development` |
| `APP_DEBUG` | yes | Enables debug behavior in development |
| `APP_HOST` | yes | Backend bind host |
| `APP_PORT` | yes | Backend bind port |
| `API_V1_PREFIX` | yes | API prefix, fixed to `/api/v1` |
| `BACKEND_CORS_ORIGINS` | yes | Allowed browser origins for local apps |
| `SECRET_KEY` | yes | Signing secret for auth/session security |
| `ACCESS_TOKEN_TTL_MINUTES` | yes | Access token lifetime |
| `REFRESH_TOKEN_TTL_DAYS` | yes | Refresh token lifetime |
| `DATABASE_URL` | yes | SQLAlchemy connection string |
| `REDIS_URL` | yes | Base Redis connection string |
| `CELERY_BROKER_URL` | yes | Celery broker connection |
| `CELERY_RESULT_BACKEND` | yes | Celery result backend |
| `S3_ENDPOINT_URL` | no | S3-compatible endpoint for media |
| `S3_BUCKET_NAME` | no | Default media bucket |
| `S3_ACCESS_KEY_ID` | no | Storage access key |
| `S3_SECRET_ACCESS_KEY` | no | Storage secret key |
| `S3_REGION` | no | Storage region name |

### `frontend/.env.local`

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | yes | Next.js dev server port |
| `NEXT_PUBLIC_SITE_URL` | yes | Public site base URL |
| `NEXT_PUBLIC_API_BASE_URL` | yes | Browser-facing API base URL |
| `INTERNAL_API_BASE_URL` | yes | Server-side API base URL used inside containers |

## Security Rules

- Never commit real values for `SECRET_KEY`, database passwords, Redis auth, or storage credentials.
- Keep browser-visible configuration minimal.
- If a backend-only variable is needed by frontend server components, use a non-`NEXT_PUBLIC_` variable and read it only on the server side.

## Local Development Rules

- Docker Compose should read root `/.env` for infrastructure values.
- Backend containers and local Python execution should read `backend/.env`.
- Frontend containers and local Next.js execution should read `frontend/.env.local`.
- Keep local defaults aligned so `docker compose up` can work without editing source files.

## Expansion Notes

- Staging and production should inject real secrets through deployment tooling or a secret manager.
- If additional providers are introduced later, extend the same file ownership rules rather than creating ad hoc env files.

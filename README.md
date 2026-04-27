# Ecommerce Monorepo

Production-grade ecommerce platform scaffold following an architecture-first workflow.

## Locked Stack

- Frontend: Next.js App Router + TypeScript + Tailwind CSS
- Backend: FastAPI + Python + SQLAlchemy 2.x
- Database: PostgreSQL
- Cache / Queue: Redis + Celery
- Storage: S3-compatible object storage
- Reverse Proxy: Nginx
- Containers: Docker

## Read First

Before implementing any ticket, read:

1. `AGENTS.md`
2. `docs/architecture/codex_ready_ecommerce_architecture_and_ticket_backlog.md`
3. `docs/tickets/backlog.md`
4. `docs/tickets/WORKLOG.md`
5. `docs/tickets/CURRENT_TASK.md`

## Environment Setup

Environment variable examples live in:

- `.env.example`
- `backend/.env.example`
- `frontend/.env.example`

Detailed rules and variable descriptions are documented in `docs/runbooks/environment.md`.

## Local Docker

The local stack is orchestrated with:

```bash
docker compose up --build
```

For local overrides, create `.env` from `.env.example`. The compose file also includes development fallbacks for required local ports and PostgreSQL credentials.

Current services:

- `nginx`
- `frontend`
- `backend`
- `postgres`
- `redis`

The compose file is designed to stay stable while later tickets add the real FastAPI and Next.js runtime files.

Public local HTTP traffic is expected to go through `http://localhost:8080`, with Nginx proxying:

- `/` to the frontend
- `/api` to the backend

## Bootstrap Status

`INF-001` establishes the repository scaffold only. Application logic, runtime setup, APIs, and UI implementation start in later tickets.

## Project Structure

```text
project-root/
|-- AGENTS.md
|-- README.md
|-- frontend/
|   |-- README.md
|   |-- public/
|   `-- src/
|       |-- app/
|       |-- components/
|       |-- features/
|       |-- hooks/
|       |-- lib/
|       |-- styles/
|       |-- tests/
|       `-- types/
|-- backend/
|   |-- README.md
|   |-- alembic/
|   `-- app/
|       |-- api/
|       |-- core/
|       |-- models/
|       |-- repositories/
|       |-- schemas/
|       |-- services/
|       |-- tasks/
|       |-- tests/
|       `-- utils/
|-- docs/
|   |-- api/
|   |-- architecture/
|   |-- database/
|   |-- product/
|   |-- runbooks/
|   `-- tickets/
|-- infra/
|   |-- README.md
|   |-- docker/
|   |-- nginx/
|   `-- scripts/
`-- .github/
    `-- workflows/
```

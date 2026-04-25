# WORKLOG

Track project execution progress for Codex and human developers.

This file is the operational source of truth for:
- completed tickets
- current work in progress
- next recommended tickets
- blocked items
- decisions made during execution

Update this file after every completed ticket.

---

# Project Status

**Project:** Ecommerce Monorepo  
**Workflow:** Architecture-first + Codex ticket execution  
**Current Phase:** PHASE 1 - Repo Bootstrap & Infrastructure  
**Last Updated:** 2026-04-19

---

# Execution Rules

## Always Follow Order

1. Read `AGENTS.md`
2. Read architecture docs
3. Read backlog
4. Read this WORKLOG
5. Continue from `In Progress` or `Next`

## Never Skip Without Reason

Do not jump to later tickets unless:
- dependency already completed
- blocker exists
- explicit approval given

## After Completing a Ticket

Update:

- move ticket from `In Progress` to `Done`
- promote next ticket
- add notes
- add blockers if found

---

# Completed Tickets

## Phase 0 - Alignment & Docs

- [x] ARC-001 - Finalize MVP ecommerce scope
- [x] ARC-002 - Lock technical stack ADR
- [x] ARC-003 - API conventions and response envelope
- [x] ARC-004 - Database conventions

## Phase 1 - Infrastructure

- [x] INF-001 - Initialize monorepo structure
- [x] INF-003 - Setup environment variable strategy
- [x] INF-002 - Setup Docker Compose local stack
- [x] INF-004 - Setup Nginx reverse proxy

## Phase 2 - Backend Foundation

- [x] BE-001 - Bootstrap FastAPI app structure
- [x] BE-002 - Setup SQLAlchemy + Alembic
- [x] BE-003 - Redis integration
- [x] BE-004 - Base models and mixins

## Phase 5 - Storefront

- [x] FE-003 - Storefront layout shell
- [x] FE-004 - Home page public

---

# In Progress

## Current Active Ticket

- [ ] FE-005 - Category listing page

### Goal

Build the public category listing page.

- category listing route
- filters/sort shell
- SEO-friendly listing structure

### Acceptance Criteria

- category listing page exists
- route is compatible with SSR/hybrid rendering
- implementation stays compatible with the current storefront shell

### Notes

`BE-005` remains deferred because role/permission seeding requires the auth schema introduced later by `BE-006`. Local end-to-end homepage verification is currently blocked by missing `node`, `npm`, and `docker` binaries in this shell environment.

---

# Next Tickets

## Immediate Queue

1. INF-005 - Backend CI pipeline
2. INF-006 - Frontend CI pipeline
3. INF-007 - Logging + correlation id

---

# Upcoming Backend Queue

1. BE-001 - Bootstrap FastAPI app structure
2. BE-002 - SQLAlchemy + Alembic setup
3. BE-003 - Redis integration
4. BE-004 - Base models + mixins
5. BE-005 - Seed roles and permissions

---

# Upcoming Frontend Queue

1. FE-001 - Auth pages foundation
2. FE-002 - Frontend auth state
3. FE-003 - Storefront layout shell

---

# Blocked Items

## Runtime Tooling

- Local end-to-end verification is blocked in the current shell because `node`, `npm`, and `docker` are not installed or not on PATH.
- Backend Python tests can run, but frontend startup and `docker compose up` cannot be executed here yet.

---

# Decisions Log

## ADR Confirmed

- Next.js App Router for frontend
- FastAPI for backend
- PostgreSQL primary database
- Redis cache + queue
- Docker-first local development
- Modular monolith architecture

---

# Notes for Codex

When reading this file:

## If `In Progress` exists

Continue only that ticket unless explicitly told otherwise.

## If no active ticket exists

Take the first ticket from `Next Tickets`.

## If blocked

Do not guess blindly.  
Document blocker and propose options.

---

## Done Today

- INF-001 completed
- INF-003 completed
- INF-002 completed
- INF-004 completed
- BE-001 completed
- BE-002 completed
- BE-003 completed
- BE-004 completed
- FE-003 completed
- FE-004 completed

## New In Progress

- FE-005

## Notes

- Created `frontend/`, `backend/`, `infra/`, and `.github/` root scaffolds
- Added standardized subdirectories from the architecture document
- Updated the root README to match the scaffolded repository layout
- Added env examples for root, backend, and frontend plus environment variable documentation
- Added root Docker Compose plus backend/frontend container bootstrap files
- Added Nginx reverse proxy config and routed public HTTP traffic through it
- Bootstrapped FastAPI app startup, settings module, and the `/api/v1/health` route
- Added SQLAlchemy session wiring, Alembic setup, and an initial migration baseline
- Added Redis client foundation and ping utility for later cache/idempotency work
- Added shared ORM metadata, UUID/timestamp mixins, and soft-delete support
- Bootstrapped the Next.js storefront shell with header, navigation, search shell, footer, and base styling
- Replaced the homepage placeholder with hero, category, and highlight sections using App Router ISR-friendly patterns

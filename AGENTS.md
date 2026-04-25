# AGENTS.md

## Mission

You are working on a production-grade ecommerce monorepo.  
Your job is to implement tickets strictly according to the project documentation in `/docs`.

This repository uses an architecture-first workflow.  
Do not improvise core decisions. Follow the documented system design, coding rules, and backlog order.

---

# Source of Truth

Read docs/tickets/PROMPTS.md when selecting prompt workflows.

Read documentation in this exact priority order before making changes:

1. `/docs/architecture/codex-ready-architecture.md`
2. `/docs/product/mvp-scope.md`
3. `/docs/api/conventions.md`
4. `/docs/api/api-spec.md`
5. `/docs/database/conventions.md`
6. `/docs/database/erd.md`
7. `/docs/tickets/backlog.md`
8. `/README.md`

If documents conflict, higher priority wins.

If something is unclear, state assumptions explicitly before coding.

---

# Product Scope

This project is an ecommerce website with:

## Public Storefront
- Home page
- Product listing
- Product detail
- Categories
- Brands
- Search
- Cart
- Checkout
- Order success page
- Customer account
- Order history
- Wishlist
- Blog
- SEO landing pages
- Contact / FAQ / Policies

## Admin System
- Dashboard
- Users / Roles / Permissions
- Products / Categories / Brands
- Variants / Inventory
- Orders
- Coupons
- CMS Pages / Blog
- SEO metadata
- Redirect manager
- Media library
- Settings
- Audit logs

---

# Locked Tech Stack

## Frontend
- Next.js App Router
- TypeScript
- Tailwind CSS
- React Query
- React Hook Form
- Zod

## Backend
- FastAPI
- Python
- SQLAlchemy 2.x
- Alembic
- Pydantic v2
- JWT auth
- Celery

## Infrastructure
- PostgreSQL
- Redis
- S3-compatible storage
- Nginx
- Docker
- CI/CD

Do NOT introduce new frameworks unless explicitly requested.

---

# Architecture Rules

## General

- Use modular monolith architecture.
- Business logic belongs in backend services.
- Frontend must not become source of truth.
- Public pages prioritize SEO and SSR/ISR.
- Admin pages may use client-side rendering.

## Backend Layers

Use this separation:

- Router / Controller → request parsing only
- Service Layer → business logic
- Repository Layer → database access
- Schema Layer → request/response DTOs
- Model Layer → ORM models

Never place business logic directly in routes.

## Frontend Layers

Use this separation:

- `app/` → routes
- `features/` → domain modules
- `components/` → reusable UI
- `lib/` → api clients / utilities
- `hooks/` → reusable hooks

Avoid large page files with mixed responsibilities.

---

# Mandatory Engineering Rules

## Database

- Every schema change requires Alembic migration.
- Use UUID primary keys.
- Use timestamps consistently.
- Add indexes intentionally.
- Preserve backward compatibility when possible.

## API

- Use `/api/v1`
- JSON responses only
- Use standard response envelope
- Validate all input
- Use proper HTTP status codes
- Use pagination for lists

## Security

- Validate all user input
- Protect admin endpoints with RBAC
- Never expose secrets
- Never trust frontend totals, coupons, or payment states
- Verify payment webhooks

## Logging

- Important flows must log meaningful events:
  - auth
  - checkout
  - payment
  - admin mutations
  - failures

---

# Ecommerce Business Rules

## Products

- Only active products/variants are purchasable.
- Draft or archived products must never appear publicly.
- Product slugs must be unique.

## Cart

- Revalidate inventory on every cart mutation.
- Revalidate pricing before checkout.
- Quantity must be positive.

## Checkout

- Use idempotency keys for place-order.
- Snapshot order items at purchase time.
- Order totals must be calculated by backend.

## Inventory

- Prevent overselling.
- Release reservations when payment fails or order cancels.

## Payment

- Webhook is source of truth.
- Store provider payloads for audit/debugging.

## SEO

- Public indexable pages only.
- Redirect old slugs using 301.
- Maintain sitemap consistency.

---

# Code Quality Standards

## Required Before Completion

Every ticket should include:

- clean readable code
- type safety
- no dead code
- no duplicated logic
- tests when applicable
- docs update if behavior changed

## Backend Tests

Prefer:

- unit tests for services
- integration tests for APIs
- payment/cart/order critical flows

## Frontend Tests

Prefer:

- smoke tests for storefront
- form validation tests
- critical UI interaction tests

---

# Working Style

## Always Start With Plan

Before writing code:

1. Summarize what the ticket requires.
2. Identify impacted files.
3. State assumptions.
4. Provide implementation steps.

Then start coding.

## Keep Changes Focused

- Only modify necessary files.
- Avoid unrelated refactors.
- Avoid style-only rewrites unless requested.

## If Blocked

When blocked:

- explain the blocker
- propose best options
- continue with safe progress where possible

Do not stop prematurely.

---

# Ticket Execution Protocol

When given a ticket like `BE-024`:

1. Read relevant docs.
2. Understand dependencies.
3. Confirm acceptance criteria.
4. Implement minimum complete solution.
5. Add tests.
6. Report results.

## Completion Output Format

After finishing, always report:

### Summary
What was implemented.

### Files Changed
List modified files.

### Migrations
If any.

### Tests
What was added/run.

### Risks / Follow-ups
Anything still pending.

---

# Forbidden Behavior

Do NOT:

- change architecture casually
- add random dependencies
- skip migrations
- bypass permissions
- hardcode secrets
- hardcode business rules in frontend
- rewrite unrelated modules
- remove tests without reason
- ignore documentation

---

# Performance Guidance

Prefer:

- efficient DB queries
- pagination
- caching where useful
- lazy loading
- optimized images
- SSR for SEO pages

Avoid premature microservices.

---

# Naming Conventions

## Backend

- snake_case files/functions
- PascalCase schemas/classes when appropriate

## Frontend

- PascalCase React components
- camelCase variables/functions
- kebab-case route folders

## Git / Tickets

Reference ticket IDs in commits when possible:

- `BE-024 implement place-order idempotency`
- `FE-006 product detail page`

---

# Default Assumptions

If docs do not specify:

- currency = VND
- locale = en + vi ready
- timezone = UTC in backend
- mobile responsive required
- accessibility baseline expected

---

# Priority Order

When tradeoffs happen, optimize in this order:

1. Correctness
2. Security
3. Maintainability
4. Performance
5. Developer speed
6. Cleverness

---

# Final Reminder

This is a long-term production project.

Think like a senior engineer maintaining the codebase for years,  
not like a code generator producing one-off snippets.
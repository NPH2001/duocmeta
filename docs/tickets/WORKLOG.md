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
**Current Phase:** PHASE 12 - Audit, monitoring, quality  
**Last Updated:** 2026-04-28

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
- [x] INF-005 - Backend CI pipeline
- [x] INF-006 - Frontend CI pipeline
- [x] INF-007 - Logging + correlation id

## Phase 2 - Backend Foundation

- [x] BE-001 - Bootstrap FastAPI app structure
- [x] BE-002 - Setup SQLAlchemy + Alembic
- [x] BE-003 - Redis integration
- [x] BE-004 - Base models and mixins
- [x] BE-005 - Roles and permissions seed
- [x] BE-006 - Users schema
- [x] BE-007 - Auth service
- [x] BE-008 - RBAC middleware

## Phase 4 - Catalog

- [x] BE-009 - Brands/Categories
- [x] BE-010 - Media files
- [x] BE-011 - Products core
- [x] BE-012 - Attributes
- [x] BE-013 - Variants
- [x] BE-014 - Inventory
- [x] BE-015 - Admin catalog CRUD
- [x] BE-016 - Public products listing API
- [x] BE-017 - Product detail API
- [x] BE-018 - Category/brand public APIs
- [x] BE-019 - Cart schema
- [x] BE-020 - Cart APIs
- [x] BE-023 - Orders schema
- [x] BE-024 - Place-order flow

## Phase 3 Auth

- [x] FE-001 - Auth pages foundation
- [x] FE-002 - Frontend auth state

## Phase 5 - Storefront

- [x] FE-003 - Storefront layout shell
- [x] FE-004 - Home page public
- [x] FE-005 - Category listing page
- [x] FE-006 - Product detail page
- [x] SEO-001 - Public metadata
- [x] FE-007 - Cart page
- [x] FE-008 - Checkout page
- [x] FE-010 - Success page
- [x] BE-025 - Payments schema
- [x] BE-026 - Payment provider abstraction
- [x] BE-027 - Mock payment provider
- [x] BE-028 - Payment initiation API
- [x] BE-029 - Payment webhook handler
- [x] FE-011 - Integrate payment redirect/return flow
- [x] BE-030 - Customer orders API
- [x] FE-012 - Account overview page
- [x] FE-013 - Order history page
- [x] FE-014 - Order detail page
- [x] FE-015 - Admin layout and guards
- [x] FE-016 - Admin products list/create/edit UI
- [x] FE-017 - Admin variants/inventory UI
- [x] BE-031 - Admin order workflow APIs
- [x] FE-018 - Admin orders list/detail UI
- [x] BE-021 - Implement coupon schema and validation service
- [x] BE-022 - Implement checkout preview service
- [x] FE-009 - Integrate checkout preview/place-order flow
- [x] FE-019 - Admin coupon UI
- [x] BE-032 - Implement pages/posts/tags/seo/redirects schema
- [x] BE-033 - Implement CMS admin CRUD APIs
- [x] FE-020 - Admin CMS UI
- [x] BE-034 - Public CMS APIs
- [x] FE-021 - Blog listing/detail pages
- [x] FE-022 - Generic content page renderer
- [x] SEO-002 - Dynamic sitemap generation
- [x] SEO-003 - robots.txt + noindex rules
- [x] SEO-004 - Redirect manager runtime
- [x] BE-035 - Presigned upload flow
- [x] FE-023 - Reusable media uploader component
- [x] OPS-001 - Image optimization pipeline basic
- [x] BE-036 - Audit logs implementation
- [x] OPS-002 - Health checks and readiness checks

---

# In Progress

## Current Active Ticket

- [ ] OPS-003 - Error tracking integration

### Goal

Add basic frontend/backend error tracking integration.

- backend unhandled exception capture
- frontend error surface if needed
- production-safe error context without secrets

### Acceptance Criteria

- FE/BE capture unhandled exceptions appropriately
- error tracking avoids exposing secrets
- integration fits existing CI/deployment patterns

### Notes

OPS-002 implementation was added with existing backend `/api/v1/health` retained as a lightweight liveness check, new `/api/v1/ready` readiness checks for database and Redis with coarse `ok`/`unavailable` statuses, a frontend `/health` route handler, Docker Compose healthchecks for backend/frontend containers, and focused backend readiness tests. Backend syntax compilation passed for changed health files. Runtime pytest verification is blocked locally because WSL Python does not have pytest installed, and Docker Compose validation is blocked because Docker is not installed/integrated in WSL. Frontend build/typecheck remains blocked by WSL Node v12.22.9 and missing local `tsc`/`eslint` binaries.

BE-036 implementation was added with `audit_logs` ORM model and Alembic migration, audit response schema, repository/service layers, RBAC-protected `GET /api/v1/admin/audit-logs`, and same-transaction audit writes for product create/update/publish/archive, variant create/update, admin order confirm/ship/deliver/cancel/refund, and page/post create/update/delete flows. Audit entries preserve actor, action, entity, old/new data, IP address, user agent, and creation time. Syntax compilation passed for changed backend files. Runtime pytest verification is blocked locally because WSL Python does not have pytest installed.

OPS-001 implementation was added with a `media_derivatives` ORM model and Alembic migration, configurable optimization settings, upload-completion planning for pending image derivatives, original media metadata preservation, derivative response DTOs, and focused model/migration/service/API tests. Syntax compilation passed for changed backend files. Runtime pytest verification is blocked locally because WSL Python does not have pytest installed, and import-level SQLAlchemy checks are blocked because WSL Python does not have SQLAlchemy installed.

BE-024 implementation was added with checkout place-order API, required `Idempotency-Key`, order item snapshots, backend-calculated totals, inventory revalidation/reservation, cart finalization, and focused API/migration/model tests. Runtime verification is blocked locally because PowerShell cannot reach Docker Desktop, WSL does not have Docker integration, and WSL Python does not have pytest/pip installed.

FE-007 implementation was added with `/cart`, client cart API utilities, quantity update/remove actions, estimated subtotal display, noindex cart metadata, and header navigation. Runtime verification is blocked locally because WSL has Node v12.22.9 and `frontend/node_modules` does not contain `tsc` or `eslint`.

FE-008 implementation was added with `/checkout`, customer/shipping/payment form sections, cart-backed checkout preview, noindex metadata, and backend-authority messaging. Runtime verification remains blocked locally because WSL has Node v12.22.9 and `frontend/node_modules` does not contain `tsc` or `eslint`.

FE-010 implementation was added with `/checkout/success`, order-code rendering from search params, noindex metadata, missing-code handling, basic status summary, and storefront/order-history navigation. Runtime verification remains blocked locally because WSL has Node v12.22.9 and `frontend/node_modules` does not contain `tsc` or `eslint`.

BE-025 implementation was added with `payments` and `payment_events` ORM models, JSON provider payload storage, one-payment-per-order constraint, event payload audit storage, Alembic migration, and focused model/migration tests. Runtime verification is blocked locally because WSL Python does not have pytest/pip installed.

BE-026 implementation was added with typed payment initiation, webhook verification, normalized event contracts, a `PaymentProvider` protocol, and a provider registry. Runtime verification is blocked locally because WSL Python does not have pytest/pip installed.

BE-027 implementation was added with a deterministic no-network mock payment provider, mock webhook signature verification, event normalization, default registry wiring, and focused tests. Runtime verification is blocked locally because WSL Python does not have pytest/pip installed.

BE-028 implementation was added with `/api/v1/payments/{order_code}/initiate`, backend-owned order total usage, mock provider initiation, persisted payment records, retry-safe existing payment responses, and focused API tests. Runtime verification is blocked locally because WSL Python does not have pytest/pip installed.

BE-029 implementation was added with `/api/v1/payments/webhooks/{provider_code}`, provider-owned webhook verification, normalized event processing, persisted payment event payloads, payment/order status updates, duplicate event idempotency, and focused API tests. Runtime verification is blocked locally because WSL Python does not have pytest/pip installed.

FE-011 implementation was added with checkout submit integration for backend place-order and payment initiation APIs, idempotency key reuse during submit retries, provider action redirect handling, and success-page fallback. Runtime verification remains blocked locally because WSL has Node v12.22.9 and `frontend/node_modules` does not contain `tsc` or `eslint`.

BE-030 implementation was added with authenticated `/api/v1/orders` list/detail/cancel endpoints, customer ownership scoping, pagination metadata, cancel policy enforcement, reserved inventory release on cancel, and focused API tests. Runtime verification is blocked locally because WSL Python does not have pytest/pip installed.

FE-012 implementation was added with `/account`, authenticated profile loading through existing auth utilities, guest login/register state, account navigation, order-history entry points, noindex metadata, and header navigation. Runtime verification remains blocked locally because WSL has Node v12.22.9 and `frontend/node_modules` does not contain `tsc` or `eslint`.

FE-013 implementation was added with `/account/orders`, authenticated order history loading through a reusable orders API client, guest/login-required state, paginated order rows, order detail links, noindex metadata, and responsive account layout. Runtime verification remains blocked locally because WSL has Node v12.22.9 and `frontend/node_modules` does not contain `tsc` or `eslint`.

FE-014 implementation was added with `/account/orders/[orderCode]`, authenticated order detail loading, backend order snapshot rendering, item/totals/status/timeline sections, optional cancel mutation for pending orders, noindex metadata, and responsive layout. Runtime verification remains blocked locally because WSL has Node v12.22.9 and `frontend/node_modules` does not contain `tsc` or `eslint`.

FE-015 implementation was added with `/admin`, a guarded admin layout/sidebar, backend RBAC access probe through an existing admin API, guest and forbidden states, noindex admin metadata, and a dashboard entry page. Runtime verification remains blocked locally because WSL has Node v12.22.9 and `frontend/node_modules` does not contain `tsc` or `eslint`.

FE-016 implementation was added with `/admin/products`, `/admin/products/new`, and `/admin/products/[productId]/edit`, typed admin catalog API helpers, paginated product listing, publish/archive actions, and create/edit product forms using backend admin APIs. Runtime verification remains blocked locally because WSL has Node v12.22.9 and `frontend/node_modules` does not contain `tsc` or `eslint`.

FE-017 implementation was added with `/admin/variants`, `/admin/variants/new`, `/admin/variants/[variantId]/edit`, and `/admin/variants/[variantId]/inventory`, typed variant API helpers, paginated variant listing, create/edit variant forms, and an inventory adjustment preparation shell that waits for backend inventory mutation support. Runtime verification remains blocked locally because WSL has Node v12.22.9 and `frontend/node_modules` does not contain `tsc` or `eslint`.

BE-031 implementation was added with RBAC-protected `/api/v1/admin/orders` list/detail endpoints and confirm, ship, deliver, cancel, and refund workflow actions. Workflow transitions are validated in the service layer, admin mutations are logged, cancellation/refund can release unfulfilled reservations, and focused API tests were added. Runtime pytest verification is blocked locally because WSL Python does not have pytest/pip installed.

FE-018 implementation was added with `/admin/orders` and `/admin/orders/[orderCode]`, typed admin order API helpers, paginated order listing, order detail snapshot rendering, and workflow action controls that call backend admin order APIs without inferring order/payment authority locally. Runtime verification remains blocked locally because WSL has Node v12.22.9 and `frontend/node_modules` does not contain `tsc` or `eslint`.

BE-021 implementation was added with `coupons` and `coupon_usages` ORM models, Alembic migration, coupon schemas, repository queries, backend coupon validation service, discount calculation, active-window/min-order/usage-limit checks, and focused model/service tests. Runtime pytest verification is blocked locally because WSL Python does not have pytest/pip installed.

BE-022 implementation was added with `POST /api/v1/checkout/preview`, checkout preview schemas, backend preview service, cart pricing and inventory revalidation, coupon-aware discount preview through the coupon service, shipping/tax/total calculation, validation warnings, and focused checkout API tests. Runtime pytest verification is blocked locally because WSL Python does not have pytest/pip installed.

FE-009 implementation was added by wiring checkout to backend preview totals, adding shipping method and coupon code inputs, rendering backend validation warnings, and preserving the existing place-order/payment initiation flow. Runtime verification remains blocked locally because WSL has Node v12.22.9 and `frontend/node_modules` does not contain `tsc` or `eslint`.

FE-019 implementation was added with `/admin/coupons`, `/admin/coupons/new`, and `/admin/coupons/[couponId]/edit`, typed admin coupon API helpers, paginated coupon listing, create/edit coupon definition forms, activate/deactivate controls, and backend-authority messaging for coupon validation and checkout enforcement. Runtime verification remains blocked locally because PowerShell does not expose `npm`, and WSL has Node v12.22.9 without local `tsc` or `eslint` binaries.

BE-032 implementation was added with content/SEO ORM models for pages, posts, tags, post_tags, seo_metadata, and redirects; reversible Alembic migration `20260427_0014_content_seo_schema.py`; model registration; user author/audit relationships; and focused migration/model tests. Syntax compilation passed for new backend files. Runtime pytest/metadata verification is blocked locally because WSL Python does not have SQLAlchemy or pytest installed.

BE-033 implementation was added with RBAC-protected admin CMS CRUD endpoints for pages, posts, tags, SEO metadata, and redirects; CMS schemas, repository, and service layers; soft-delete handling for pages/posts; slug/entity/path conflict checks; pagination envelopes; router registration; and focused API/service tests. Syntax compilation passed for new backend files. Runtime pytest verification is blocked locally because WSL Python does not have pytest installed.

FE-020 implementation was added with `/admin/cms` section navigation, list/create/edit routes for pages, posts, SEO metadata, and redirects, typed admin CMS API helpers, JSON-backed content/schema editors, publication and redirect fields, and backend-authority messaging. Runtime verification remains blocked locally because WSL has Node v12.22.9 without local `tsc` or `eslint` binaries.

BE-034 implementation was added with public `GET /api/v1/pages/{slug}`, `GET /api/v1/posts`, and `GET /api/v1/posts/{slug}` endpoints, published-only visibility rules, public CMS DTOs, SEO metadata inclusion, router registration, and focused public API/service tests. Syntax compilation passed for changed backend files. Runtime pytest verification is blocked locally because WSL Python does not have pytest installed.

FE-021 implementation was added with `/blog`, `/blog/[slug]`, a typed public CMS frontend client for posts, ISR-friendly server rendering, backend SEO metadata integration, breadcrumb/article JSON-LD, responsive listing/detail layouts, empty/unavailable states, and resilient JSON block rendering. Runtime verification remains blocked locally because WSL frontend `node_modules` does not contain `tsc` or `eslint` binaries.

FE-022 implementation was added with `/pages/[slug]`, typed public CMS page fetching, backend SEO metadata integration, shared CMS block rendering for blog/page content, breadcrumb/WebPage JSON-LD, CMS schema JSON-LD passthrough, and responsive public page layout. Runtime verification remains blocked locally because WSL frontend `node_modules` does not contain `tsc` or `eslint` binaries.

SEO-002 implementation was added with `app/sitemap.ts`, public home/products/categories/blog index URLs, static product/category detail URLs from current storefront data, public CMS blog post URLs from the backend posts API, noindex robots filtering for CMS posts, duplicate URL protection, and backend-unavailable fallback behavior for build compatibility. Public CMS pages and brand detail URLs are not listed yet because the current codebase has no public pages list endpoint and no frontend brand detail route. Runtime verification remains blocked locally because WSL frontend `node_modules` does not contain `tsc` or `eslint` binaries.

SEO-003 implementation was added with `app/robots.ts`, sitemap discovery, disallow rules for admin/account/cart/checkout/auth routes, a shared `noIndexRobots` metadata helper, and noindex metadata coverage for cart, checkout, order success, account, account orders, admin, login, register, and forgot-password routes. Runtime verification remains blocked locally because WSL frontend `node_modules` does not contain `tsc` or `eslint` binaries.

SEO-004 implementation was added with a public `GET /api/v1/redirects/resolve` endpoint for active CMS redirects, a service/repository redirect lookup path, public redirect DTO, focused public CMS API tests for active/inactive redirects, and Next middleware that applies backend-owned redirect status codes only on public paths while skipping private/admin/auth/API/static routes. Backend syntax compilation passed. Runtime pytest and frontend verification remain blocked locally because WSL lacks pytest and frontend `node_modules` does not contain `tsc` or `eslint` binaries.

BE-035 implementation was added with RBAC-protected `POST /api/v1/admin/media/presign` and `POST /api/v1/admin/media/complete`, media upload schemas, media repository/service layers, deterministic S3-compatible signed upload target generation, MIME/size validation, backend-owned `media_files` metadata persistence, storage-related settings, router registration, and focused service/API tests. Syntax compilation passed for changed backend files. Runtime pytest verification is blocked locally because WSL Python does not have pytest installed.

FE-023 implementation was added with typed admin media API helpers, a reusable `AdminMediaUploader` component that requests presign, uploads to the signed target, completes backend media metadata, reads image dimensions client-side, and returns the backend media record to callers. It is integrated into variant image and SEO Open Graph image fields while preserving manual media ID entry, and `/admin/media` now provides a standalone upload surface. Runtime verification remains blocked locally because WSL frontend `node_modules` does not contain `tsc` or `eslint` binaries.

OPS-001 implementation was added with a pending derivative planning pipeline for uploaded images. `media_files` remains the original upload record, while `media_derivatives` tracks future thumbnail/web variants with kind, storage key, MIME type, dimensions, status, error, and processing timestamps. The current API schedules derivative records only; it does not transform bytes in-process or expose optimized files as ready assets.

Local Next.js build/lint verification is currently blocked by Node v12.22.9 in WSL; Next 15 dependencies require a newer Node runtime. PowerShell still does not expose `npm` or `git` on PATH. Online Alembic migration checks may fail against the existing Docker PostgreSQL volume if its stored password differs from the current compose defaults; offline Alembic SQL generation is available.

---

# Next Tickets

## Immediate Queue

1. QA-001 - Backend test suite cho auth/catalog/cart/checkout

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

- PowerShell does not expose `node`, `npm`, or `git` on PATH.
- WSL has git available, but Docker is not installed/integrated and its system Python lacks `pip`; backend checks should be run through Docker once Docker Desktop WSL integration is enabled, or after Python tooling is installed locally.
- Frontend startup/build is blocked in WSL by Node v12.22.9; Next 15 requires a newer Node runtime.

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
- FE-005 completed
- FE-006 completed
- SEO-001 completed
- BE-005 completed
- BE-006 completed
- BE-007 completed
- BE-008 completed
- FE-001 completed
- FE-002 completed
- INF-005 completed
- INF-006 completed
- INF-007 completed
- BE-009 completed
- BE-010 completed
- BE-011 completed
- BE-012 completed
- BE-013 completed
- BE-014 completed
- BE-015 completed
- BE-016 completed
- BE-017 completed
- BE-018 completed
- BE-019 completed
- BE-020 completed
- BE-024 completed
- FE-007 completed
- FE-008 completed
- FE-010 completed
- BE-025 completed
- BE-026 completed
- BE-027 completed
- BE-028 completed
- BE-029 completed
- FE-011 completed
- BE-030 completed
- FE-012 completed
- FE-013 completed
- FE-014 completed
- FE-015 completed
- FE-016 completed
- FE-017 completed
- BE-031 completed
- FE-018 completed
- BE-021 completed
- BE-022 completed
- FE-009 completed
- FE-019 completed
- BE-032 completed
- BE-033 completed
- FE-020 completed
- BE-034 completed
- FE-021 completed
- FE-022 completed
- SEO-002 completed
- SEO-003 completed
- SEO-004 completed
- BE-035 completed
- FE-023 completed
- OPS-001 completed
- BE-036 completed
- OPS-002 completed

## New In Progress

- OPS-003

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
- Added SEO-friendly category index and category detail listing routes with filter/sort/pagination shell
- Added backend GitHub Actions CI for lint, tests, and Alembic migration upgrade checks
- Added frontend GitHub Actions CI for lint, typecheck, and production build checks
- Added backend request correlation middleware with `X-Request-ID` propagation and request logging
- Added SEO-friendly product index and product detail routes with gallery and variant selector shell
- Standardized public metadata for home/category/product pages with canonical, robots, Open Graph, and Twitter metadata
- Added identity SQLAlchemy models and Alembic migration for users, roles, permissions, role assignments, refresh tokens, and addresses
- Added idempotent roles and permissions seed service, script, and tests
- Added auth service, repository, schemas, security helpers, and `/api/v1/auth` endpoints for register/login/refresh/me
- Added reusable RBAC dependencies for current user resolution and permission checks
- Added public login, register, and forgot-password page shells compatible with backend auth endpoints
- Added frontend auth API utilities, login/register form submission, and header auth display state
- Added catalog SQLAlchemy models and migration for brands/categories, including category parent tree support and catalog metadata tests
- Added media file SQLAlchemy model and migration with storage metadata, optional uploader relationship, and migration/model tests
- Added product core SQLAlchemy models and migration for products/product_categories, including brand/user/category relationships and partial unique active slugs
- Added product attribute SQLAlchemy models and migration with filterable/variant-axis flags, scoped value-code uniqueness, and migration/model tests
- Added product variant SQLAlchemy models and migration for variants, variant attribute values, product images, and the product default variant FK
- Added inventory SQLAlchemy models and migration for variant snapshots and inventory transactions with movement reference metadata
- Added RBAC-protected admin catalog CRUD APIs and services for brands, categories, products, variants, and product publish/archive workflow
- Added public product listing API with active/published visibility, q/category/brand/price filters, sorting, pagination, and response envelope tests
- Added public product detail API with active/published visibility, variants, images, attributes, breadcrumbs, SEO-ready fields, and response envelope tests
- Added public category and brand APIs with active-only list/detail responses, category breadcrumbs/children, pagination, and visibility tests
- Added cart and cart item SQLAlchemy models, Alembic migration, and tests for metadata, relationships, indexes, and downgrade order
- Added cart APIs for guest/customer carts with add/update/remove item mutations, positive quantity validation, purchasable variant checks, inventory revalidation, and response envelope tests
- Added order and order item SQLAlchemy models, Alembic migration, purchase-time snapshot fields, status/total columns, indexes, and migration/model tests
- Added checkout place-order API with required `Idempotency-Key`, backend-calculated order totals, order item snapshots, inventory revalidation/reservation with transaction logging, cart finalization, and focused API/migration/model tests
- Added cart page with backend cart fetching, quantity updates, item removal, estimated subtotal display, noindex metadata, and header navigation
- Added checkout page with customer, shipping, and payment fields plus a cart-backed preview that keeps final totals and payment state backend-owned
- Added order success page with order-code rendering, noindex metadata, missing-code handling, and basic post-order status summary
- Added payment and payment event schema with provider payload storage, indexes, relationships, Alembic migration, and focused model/migration tests
- Added payment provider abstraction with typed initiation/webhook/event contracts, provider-owned webhook verification, provider normalization, registry, and focused tests
- Added deterministic mock payment provider with no network calls, mock signature verification, normalized events, default registry wiring, and focused tests
- Added payment initiation API with backend-owned order totals, provider action response data, persisted payments, retry-safe existing payment behavior, and focused API tests
- Added payment webhook handler with provider verification, normalized event processing, event payload audit storage, payment/order status updates, duplicate-event idempotency, and focused API tests
- Added frontend payment redirect/return integration by submitting checkout to place-order, initiating payment, reusing idempotency keys for retries, and following provider action URLs without inferring payment success client-side
- Added customer orders API with authenticated own-order listing, detail, cancellation policy, pagination metadata, inventory reservation release on cancel, and focused API tests
- Added account overview page with authenticated profile loading, guest login/register state, order-history navigation, noindex metadata, and header account link
- Added order history page with authenticated customer order fetching, pagination controls, guest state, noindex metadata, and order detail links
- Added order detail page with authenticated order fetching, item snapshot rendering, totals/status/timeline sections, and cancel action using backend authority
- Added guarded admin shell with sidebar navigation, backend RBAC access probe, guest/forbidden states, and admin dashboard route
- Added admin products list/create/edit UI with typed catalog API helpers, product forms, and publish/archive actions
- Added admin variants list/create/edit UI with typed variant helpers and inventory adjustment preparation shell
- Added admin order workflow APIs with RBAC, transition validation, admin mutation logging, reservation release, and focused tests
- Added admin orders list/detail UI with typed admin order helpers and backend-backed workflow action controls
- Added coupon schema, Alembic migration, backend validation service, discount calculation, and focused coupon tests
- Added checkout preview API/service with backend-owned totals, coupon validation, inventory revalidation, and focused tests
- Integrated checkout page with backend preview totals, coupon warning display, and existing place-order/payment flow
- Added admin coupon list/create/edit UI with typed admin coupon helpers and backend-owned validation messaging
- Added pages/posts/tags/SEO/redirects ORM models, Alembic migration, and focused schema tests
- Added admin CMS CRUD APIs with RBAC, service/repository/schema layers, and focused tests
- Added admin CMS UI with backend-backed pages/posts/SEO/redirect helpers and routes
- Added public CMS APIs for published pages/posts with SEO metadata and visibility tests
- Added public blog listing/detail pages backed by public CMS APIs with SEO metadata and structured data
- Added generic public CMS page rendering backed by public CMS APIs with shared content blocks and SEO metadata
- Added dynamic sitemap generation for current public storefront and CMS post URLs with noindex filtering
- Added robots.txt behavior and shared noindex metadata coverage for private, transactional, admin, and auth routes
- Added redirect manager runtime support with public active redirect resolution and frontend middleware application
- Added RBAC-protected presigned media upload preparation and completion APIs with backend-owned media metadata persistence
- Added reusable admin media uploader with presign/complete API integration and form media ID population
- Added image optimization pipeline hooks with pending media derivative records for uploaded images
- Added backend audit log persistence, admin audit log listing, and sensitive mutation audit writes
- Added backend readiness checks, frontend health route, and Docker Compose healthchecks

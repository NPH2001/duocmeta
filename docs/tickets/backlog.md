# Backlog

## Phase 0

* ARC-001 Finalize MVP scope
* ARC-002 Lock technical stack
* ARC-003 API conventions
* ARC-004 Database conventions

## Phase 1 Infrastructure

* INF-001 Initialize monorepo structure
* INF-002 Docker compose local stack
* INF-003 Environment variable strategy
* INF-004 Nginx reverse proxy
* INF-005 Backend CI
* INF-006 Frontend CI

## Phase 2 Backend Foundation

* BE-001 Bootstrap FastAPI app
* BE-002 SQLAlchemy + Alembic
* BE-003 Redis integration
* BE-004 Base models and mixins
* BE-005 Roles and permissions seed

## Phase 3 Auth

* BE-006 Users schema
* BE-007 Auth service
* BE-008 RBAC middleware
* FE-001 Auth pages
* FE-002 Frontend auth state

## Phase 4 Catalog

* BE-009 Brands/Categories
* BE-010 Media files
* BE-011 Products core
* BE-012 Attributes
* BE-013 Variants
* BE-014 Inventory
* BE-015 Admin catalog CRUD

## Phase 5 Storefront

* FE-003 Storefront layout
* FE-004 Home page
* FE-005 Category page
* FE-006 Product detail page
* SEO-001 Public metadata

## Phase 6 Commerce

* BE-019 Cart schema
* BE-020 Cart APIs
* FE-007 Cart page
* BE-023 Orders schema
* BE-024 Place-order flow
* FE-008 Checkout page
* FE-010 Success page


## Phase 13 Performance & hardening

* OPS-003 Error tracking integration
* QA-001 Backend test suite for auth/catalog/cart/checkout
* QA-002 Frontend smoke tests for storefront
* QA-003 Admin smoke tests
* SEO-005 Core Web Vitals optimization pass
* BE-037 Rate limiting for auth and public mutation endpoints
* BE-038 CORS, security headers, trusted host config
* OPS-004 PostgreSQL backup/restore runbook
* OPS-005 Deployment runbook staging/prod
* FE-024 Language switcher EN/VI
* FE-025 Floating contact shortcuts

# Database Conventions

## Primary Keys

* UUID for all business tables

## Timestamps

* created_at timestamptz not null
* updated_at timestamptz not null
* deleted_at timestamptz nullable when soft delete used

## Naming

* snake_case tables
* snake_case columns
* plural table names

## Constraints

* Unique for business identifiers (email, slug, code)
* Foreign keys required unless justified

## Indexing

* Add indexes for filters, joins, sorting
* Avoid unnecessary indexes

## Soft Delete

* Use deleted_at for user-facing entities where restore may be needed

## Money

* numeric(18,2)
* store currency_code separately

## Enums

* Prefer controlled varchar values + application constants

## Migrations

* Use Alembic only
* One logical change per migration
* Reversible when practical

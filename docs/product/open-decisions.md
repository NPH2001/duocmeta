# Open Decisions

Track unresolved product/business decisions. Codex must not hardcode assumptions beyond this file.

## Payments

* Primary payment provider not finalized.
* Default local/dev provider: mock provider.
* Real provider must use abstraction layer.

## Shipping

* Shipping fee formula not finalized.
* Default MVP: flat rate + free shipping threshold optional.
* Carrier integrations deferred.

## Tax

* VAT rules not finalized.
* Default MVP: configurable tax rate disabled by default.

## Inventory Policy

* COD reservation timing not finalized.
* Default MVP: reserve stock at place-order, release on cancel/timeout.

## CMS Editor

* Rich text vs block editor not finalized.
* Default MVP: rich text editor.

## Search

* PostgreSQL full-text vs external search undecided.
* Default MVP: PostgreSQL search.

## Media

* Auto image optimization pipeline may be phase 2.

## Internationalization

* Multi-language deferred.
* Prepare codebase for en/vi later.

## Promotions

* Advanced promotion engine deferred.
* MVP supports single coupon code.

## Rule for Codex

If implementation needs any unresolved item:

1. Use documented default MVP behavior.
2. Keep abstraction layer clean.
3. Add TODO note referencing this file.
4. Do not lock future expansion.

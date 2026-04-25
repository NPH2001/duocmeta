# API Specification

## Base

* Prefix: /api/v1
* JSON only
* UUID ids

## Public Auth

### POST /auth/register

Create customer account.

### POST /auth/login

Return access token and refresh cookie.

### POST /auth/refresh

Rotate refresh token.

### GET /auth/me

Return current user profile.

## Catalog

### GET /products

Filters:

* q
* category_slug
* brand_slug
* min_price
* max_price
* sort
* page
* page_size

### GET /products/{slug}

Return product detail, variants, images, seo.

### GET /categories

### GET /categories/{slug}

### GET /brands

### GET /brands/{slug}

## Cart

### GET /cart

Return current cart.

### POST /cart/items

Body:

* variant_id
* quantity

### PUT /cart/items/{item_id}

Update quantity.

### DELETE /cart/items/{item_id}

Remove item.

### POST /cart/apply-coupon

Body:

* code

## Checkout

### POST /checkout/preview

Return totals.

### POST /checkout/place-order

Requires Idempotency-Key header.
Creates order.

## Orders

### GET /orders

Current user orders.

### GET /orders/{order_code}

Order detail.

### POST /orders/{order_code}/cancel

Cancel if policy allows.

## Payments

### POST /payments/{order_code}/initiate

Create payment intent.

### POST /payments/webhooks/{provider}

Webhook callback.

## Admin Auth Required

Prefix examples: /admin/*

### Products

GET /admin/products
POST /admin/products
GET /admin/products/{id}
PUT /admin/products/{id}
DELETE /admin/products/{id}
POST /admin/products/{id}/publish

### Inventory

GET /admin/inventory
POST /admin/inventory/adjust

### Orders

GET /admin/orders
GET /admin/orders/{id}
POST /admin/orders/{id}/confirm
POST /admin/orders/{id}/ship
POST /admin/orders/{id}/deliver
POST /admin/orders/{id}/cancel
POST /admin/orders/{id}/refund

### CMS

CRUD /admin/pages
CRUD /admin/posts
CRUD /admin/seo
CRUD /admin/redirects

# ERD Overview

## Identity

* users
* roles
* permissions
* user_roles
* refresh_tokens
* addresses

## Catalog

* brands
* categories
* products
* product_categories
* product_variants
* product_attributes
* product_attribute_values
* variant_attribute_values
* media_files
* product_images
* inventory_snapshots
* inventory_transactions

## Commerce

* carts
* cart_items
* coupons
* coupon_usages
* orders
* order_items
* payments
* payment_events
* shipments

## Content / SEO

* pages
* posts
* tags
* post_tags
* seo_metadata
* redirects

## Core Relationships

* user has many addresses/orders
* product belongs to many categories
* product has many variants
* variant has inventory snapshot
* cart has many cart_items
* order has many order_items
* order has one primary payment
* product/page/post can have seo metadata

## Snapshot Rules

* order_items store product name, sku, price at purchase time
* payments store provider payload references

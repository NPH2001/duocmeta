# Bộ tài liệu Codex-ready cho website bán hàng

## 1. Mục tiêu tài liệu

Tài liệu này chuyển bản kiến trúc tổng thể hiện có thành một bộ đặc tả đủ chi tiết để một AI coding agent như Codex có thể triển khai xuyên suốt theo đúng hướng, hạn chế tối đa việc tự suy diễn.

Tài liệu này khóa các quyết định sau:

- FE public phải SEO tốt, dùng SSR/hybrid rendering.
- BE dùng Python API theo kiến trúc monolith tách lớp, sẵn sàng tách service về sau.
- DB dùng PostgreSQL.
- Có Redis cho cache/rate limit/job coordination.
- Có object storage cho media.
- Có admin CMS + admin commerce.
- Có đầy đủ module e-commerce lõi: catalog, cart, checkout, order, payment, shipping, coupon, inventory.
- Có backlog ticket theo phase và dependency để Codex triển khai theo thứ tự.

---

# 2. Phạm vi hệ thống

## 2.1 In scope

### Public storefront

- Trang chủ
- Trang danh mục sản phẩm
- Trang danh sách sản phẩm theo category/brand/tag
- Trang chi tiết sản phẩm
- Tìm kiếm sản phẩm
- Giỏ hàng
- Checkout
- Trang thành công đơn hàng
- Trang tài khoản người dùng
- Lịch sử đơn hàng
- Wishlist cơ bản
- Blog/tin tức
- Landing page SEO
- FAQ
- Liên hệ
- Chính sách giao hàng / đổi trả / bảo mật / điều khoản

### Admin/CMS

- Dashboard
- Quản lý user
- Quản lý role/permission
- Quản lý product/category/brand/attribute/variant
- Quản lý media
- Quản lý inventory
- Quản lý order
- Quản lý coupon
- Quản lý page/blog/category/tag
- Quản lý SEO metadata
- Quản lý redirect
- Quản lý setting hệ thống
- Audit logs

### Tích hợp

- Thanh toán online (thiết kế abstraction, ban đầu mock provider hoặc 1 provider)
- Email transactional
- Object storage
- CDN/WAF/reverse proxy
- Analytics và event tracking cơ bản

## 2.2 Out of scope giai đoạn đầu

- Marketplace nhiều nhà bán
- Loyalty point phức tạp
- Recommendation AI nâng cao
- ERP đồng bộ 2 chiều
- Warehouse nhiều kho nâng cao
- Multi-tenant SaaS
- Mobile app native

---

# 3. Quyết định kỹ thuật khóa cứng

## 3.1 Frontend

- Framework: Next.js App Router
- Ngôn ngữ: TypeScript
- Styling: Tailwind CSS
- Data fetching: server components cho public data read-heavy, React Query cho client state và mutation
- Form: React Hook Form + Zod
- Auth UI state: cookie-based session awareness
- i18n: chưa bật ở phase 1, thiết kế có khả năng mở rộng

## 3.2 Backend

- Framework: FastAPI
- ORM: SQLAlchemy 2.x
- Migration: Alembic
- Validation: Pydantic v2
- Auth: JWT access token ngắn hạn + refresh token xoay vòng, lưu refresh token hash ở DB
- Background jobs: Celery hoặc RQ, giai đoạn đầu ưu tiên Celery
- API style: REST JSON versioned `/api/v1`

## 3.3 Database và cache

- PostgreSQL là source of truth
- Redis cho cache, rate limit, idempotency key, job coordination

## 3.4 Storage và infra

- Media: S3-compatible object storage
- Reverse proxy: Nginx
- CDN/WAF: Cloudflare
- Containerization: Docker + docker compose cho dev/staging nhỏ
- CI/CD: GitHub Actions hoặc GitLab CI

## 3.5 Kiến trúc code

- Monorepo
- FE và BE tách thư mục
- Shared docs/spec nằm trong `/docs`
- Monolith modular, không microservices ở phase đầu

---

# 4. Kiến trúc tổng thể

```text
User
  |
  v
Cloudflare / CDN / WAF
  |
  v
Nginx Reverse Proxy
  |
  +-----------------------------+
  |                             |
  v                             v
Next.js Web App                 Static/Media CDN
  |
  v
FastAPI Backend
  |
  +-------------+-------------+-------------+
  |             |             |             |
  v             v             v             v
PostgreSQL      Redis         Worker        Object Storage
                              (Celery)
```

### Nguyên tắc luồng

- Public pages ưu tiên SSR/ISR cho SEO.
- Admin và các tương tác nặng dùng client-side data fetching.
- BE là nơi duy nhất xử lý business rules.
- FE không tự tính logic giá cuối cùng, tồn kho, coupon hay payment state.
- Payment và inventory phải luôn được xác nhận bởi BE.

---

# 5. Vai trò người dùng và phân quyền

## 5.1 Vai trò hệ thống

- Guest
- Customer
- Support
- ContentEditor
- CatalogManager
- OrderManager
- MarketingManager
- Admin
- SuperAdmin

## 5.2 Permission nhóm chính

- manage\_users
- manage\_roles
- manage\_products
- manage\_inventory
- manage\_orders
- manage\_coupons
- manage\_pages
- manage\_posts
- manage\_seo
- manage\_media
- manage\_redirects
- manage\_settings
- view\_audit\_logs

## 5.3 Quy tắc

- Customer chỉ xem/sửa dữ liệu của chính mình.
- Admin không được bypass audit log.
- Các thao tác nhạy cảm phải ghi audit log: đổi giá, đổi tồn kho, hủy đơn, hoàn tiền, đổi quyền, publish nội dung.

---

# 6. Sitemap và route map

## 6.1 Public routes

- `/`
- `/products`
- `/products/[slug]`
- `/categories/[slug]`
- `/brands/[slug]`
- `/search`
- `/cart`
- `/checkout`
- `/checkout/success`
- `/account`
- `/account/orders`
- `/account/orders/[code]`
- `/wishlist`
- `/blog`
- `/blog/[slug]`
- `/pages/[slug]`
- `/contact`
- `/faq`
- `/login`
- `/register`
- `/forgot-password`

## 6.2 Admin routes

- `/admin`
- `/admin/users`
- `/admin/roles`
- `/admin/products`
- `/admin/products/new`
- `/admin/products/[id]`
- `/admin/categories`
- `/admin/brands`
- `/admin/attributes`
- `/admin/inventory`
- `/admin/orders`
- `/admin/orders/[id]`
- `/admin/coupons`
- `/admin/pages`
- `/admin/posts`
- `/admin/media`
- `/admin/seo`
- `/admin/redirects`
- `/admin/settings`
- `/admin/audit-logs`

---

# 7. User flows chuẩn hóa

## 7.1 Luồng mua hàng guest

1. Người dùng vào home/category/product.
2. Chọn variant.
3. Thêm vào cart.
4. Vào checkout.
5. Nhập thông tin nhận hàng.
6. Chọn vận chuyển.
7. Nhập coupon nếu có.
8. Chọn phương thức thanh toán.
9. Tạo order pending.
10. Chuyển qua payment provider hoặc COD.
11. Nhận callback/webhook.
12. Xác nhận payment.
13. Trừ tồn kho chính thức.
14. Gửi email xác nhận.
15. Điều hướng trang success.

## 7.2 Luồng mua hàng customer đã login

- Giống guest nhưng tự động điền profile/address mặc định.
- Đơn hàng được gắn vào customer account.

## 7.3 Luồng admin quản lý catalog

1. Tạo category/brand/attribute.
2. Tạo product draft.
3. Tạo variants.
4. Upload media.
5. Cập nhật SEO metadata.
6. Publish product.
7. Product xuất hiện ở storefront và sitemap nếu indexable.

## 7.4 Luồng xử lý đơn hàng

1. Order mới vào trạng thái pending\_payment hoặc awaiting\_confirmation.
2. Thanh toán thành công -> paid.
3. Chuẩn bị hàng -> processing.
4. Bàn giao vận chuyển -> shipped.
5. Giao thành công -> delivered.
6. Hoàn tất -> completed.
7. Có thể cancel/refund/return theo rule.

---

# 8. Domain model và ERD logic

## 8.1 Nhóm identity

- users
- roles
- permissions
- role\_permissions
- user\_roles
- refresh\_tokens
- addresses
- audit\_logs

## 8.2 Nhóm catalog

- products
- product\_categories
- brands
- product\_images
- product\_attributes
- product\_attribute\_values
- product\_variants
- variant\_attribute\_values
- inventory\_transactions
- inventory\_snapshots

## 8.3 Nhóm content/SEO

- pages
- posts
- post\_categories
- tags
- post\_tags
- seo\_metadata
- redirects
- media\_files

## 8.4 Nhóm commerce

- carts
- cart\_items
- coupons
- coupon\_usages
- orders
- order\_items
- payments
- payment\_events
- shipments
- shipment\_items
- returns
- return\_items

## 8.5 Quan hệ chính

- Product thuộc nhiều category qua product\_categories.
- Product có nhiều variants.
- Variant map nhiều attribute values.
- Cart có nhiều cart\_items.
- Order có nhiều order\_items.
- Mỗi order có thể có nhiều payment events nhưng chỉ một payment active chính ở phase đầu.
- Shipment có nhiều shipment\_items.
- Seo metadata gắn polymorphic cho page/post/product/category/brand.

---

# 9. Database schema chi tiết

## 9.1 users

- id UUID PK
- email varchar unique not null
- password\_hash varchar null
- full\_name varchar not null
- phone varchar null
- status varchar not null default `active`
- email\_verified\_at timestamptz null
- last\_login\_at timestamptz null
- created\_at timestamptz not null
- updated\_at timestamptz not null
- deleted\_at timestamptz null

Indexes:

- unique(email) where deleted\_at is null
- index(status)

## 9.2 roles

- id UUID PK
- code varchar unique not null
- name varchar not null
- description text null

## 9.3 permissions

- id UUID PK
- code varchar unique not null
- name varchar not null
- description text null

## 9.4 user\_roles

- user\_id UUID FK users.id
- role\_id UUID FK roles.id
- unique(user\_id, role\_id)

## 9.5 addresses

- id UUID PK
- user\_id UUID FK users.id null
- full\_name varchar not null
- phone varchar not null
- country\_code varchar not null
- province varchar not null
- district varchar not null
- ward varchar null
- address\_line1 varchar not null
- address\_line2 varchar null
- postal\_code varchar null
- is\_default boolean not null default false
- address\_type varchar not null default `shipping`
- created\_at timestamptz not null
- updated\_at timestamptz not null

## 9.6 brands

- id UUID PK
- name varchar not null
- slug varchar unique not null
- description text null
- logo\_media\_id UUID FK media\_files.id null
- is\_active boolean not null default true
- created\_at timestamptz not null
- updated\_at timestamptz not null

## 9.7 categories

- id UUID PK
- parent\_id UUID FK categories.id null
- name varchar not null
- slug varchar unique not null
- description text null
- sort\_order int not null default 0
- is\_active boolean not null default true
- created\_at timestamptz not null
- updated\_at timestamptz not null

## 9.8 products

- id UUID PK
- brand\_id UUID FK brands.id null
- name varchar not null
- slug varchar unique not null
- sku varchar unique null
- short\_description text null
- description text null
- status varchar not null default `draft`
- product\_type varchar not null default `simple`
- default\_variant\_id UUID null
- is\_featured boolean not null default false
- currency\_code varchar not null default `VND`
- min\_price numeric(18,2) null
- max\_price numeric(18,2) null
- published\_at timestamptz null
- created\_by UUID FK users.id null
- updated\_by UUID FK users.id null
- created\_at timestamptz not null
- updated\_at timestamptz not null
- deleted\_at timestamptz null

Indexes:

- unique(slug) where deleted\_at is null
- index(status)
- index(brand\_id)
- index(published\_at)
- gin full text cho name + short\_description nếu cần

## 9.9 product\_categories

- product\_id UUID FK products.id
- category\_id UUID FK categories.id
- is\_primary boolean not null default false
- unique(product\_id, category\_id)

## 9.10 media\_files

- id UUID PK
- storage\_key varchar unique not null
- filename varchar not null
- mime\_type varchar not null
- size\_bytes bigint not null
- width int null
- height int null
- alt\_text varchar null
- uploaded\_by UUID FK users.id null
- created\_at timestamptz not null

## 9.11 product\_images

- id UUID PK
- product\_id UUID FK products.id
- variant\_id UUID FK product\_variants.id null
- media\_id UUID FK media\_files.id
- sort\_order int not null default 0
- is\_primary boolean not null default false

## 9.12 product\_attributes

- id UUID PK
- code varchar unique not null
- name varchar not null
- input\_type varchar not null
- is\_filterable boolean not null default true
- is\_variant\_axis boolean not null default false

## 9.13 product\_attribute\_values

- id UUID PK
- attribute\_id UUID FK product\_attributes.id
- value\_code varchar not null
- display\_value varchar not null
- sort\_order int not null default 0
- unique(attribute\_id, value\_code)

## 9.14 product\_variants

- id UUID PK
- product\_id UUID FK products.id
- sku varchar unique not null
- barcode varchar null
- price numeric(18,2) not null
- compare\_at\_price numeric(18,2) null
- cost\_price numeric(18,2) null
- weight\_grams int null
- status varchar not null default `active`
- image\_media\_id UUID FK media\_files.id null
- created\_at timestamptz not null
- updated\_at timestamptz not null

Indexes:

- index(product\_id)
- index(status)

## 9.15 variant\_attribute\_values

- variant\_id UUID FK product\_variants.id
- attribute\_value\_id UUID FK product\_attribute\_values.id
- unique(variant\_id, attribute\_value\_id)

## 9.16 inventory\_snapshots

- variant\_id UUID PK FK product\_variants.id
- available\_quantity int not null default 0
- reserved\_quantity int not null default 0
- updated\_at timestamptz not null

## 9.17 inventory\_transactions

- id UUID PK
- variant\_id UUID FK product\_variants.id
- transaction\_type varchar not null
- quantity int not null
- reference\_type varchar not null
- reference\_id UUID null
- note text null
- created\_by UUID FK users.id null
- created\_at timestamptz not null

## 9.18 carts

- id UUID PK
- user\_id UUID FK users.id null
- session\_id varchar unique null
- status varchar not null default `active`
- currency\_code varchar not null default `VND`
- coupon\_id UUID FK coupons.id null
- created\_at timestamptz not null
- updated\_at timestamptz not null
- expires\_at timestamptz null

## 9.19 cart\_items

- id UUID PK
- cart\_id UUID FK carts.id
- product\_id UUID FK products.id
- variant\_id UUID FK product\_variants.id
- quantity int not null
- unit\_price numeric(18,2) not null
- created\_at timestamptz not null
- updated\_at timestamptz not null
- unique(cart\_id, variant\_id)

## 9.20 coupons

- id UUID PK
- code varchar unique not null
- name varchar not null
- discount\_type varchar not null
- discount\_value numeric(18,2) not null
- min\_order\_value numeric(18,2) null
- max\_discount\_value numeric(18,2) null
- usage\_limit\_total int null
- usage\_limit\_per\_user int null
- starts\_at timestamptz null
- ends\_at timestamptz null
- is\_active boolean not null default true
- created\_at timestamptz not null
- updated\_at timestamptz not null

## 9.21 orders

- id UUID PK
- order\_code varchar unique not null
- user\_id UUID FK users.id null
- cart\_id UUID FK carts.id null
- email varchar not null
- phone varchar not null
- status varchar not null
- payment\_status varchar not null
- fulfillment\_status varchar not null
- currency\_code varchar not null default `VND`
- subtotal\_amount numeric(18,2) not null
- discount\_amount numeric(18,2) not null default 0
- shipping\_amount numeric(18,2) not null default 0
- tax\_amount numeric(18,2) not null default 0
- grand\_total\_amount numeric(18,2) not null
- coupon\_code varchar null
- notes text null
- placed\_at timestamptz null
- cancelled\_at timestamptz null
- completed\_at timestamptz null
- created\_at timestamptz not null
- updated\_at timestamptz not null

Indexes:

- unique(order\_code)
- index(user\_id)
- index(status)
- index(payment\_status)
- index(placed\_at)

## 9.22 order\_items

- id UUID PK
- order\_id UUID FK orders.id
- product\_id UUID FK products.id
- variant\_id UUID FK product\_variants.id
- product\_name varchar not null
- variant\_name varchar null
- sku varchar not null
- unit\_price numeric(18,2) not null
- quantity int not null
- line\_total\_amount numeric(18,2) not null

## 9.23 payments

- id UUID PK
- order\_id UUID FK orders.id unique
- provider\_code varchar not null
- method\_code varchar not null
- status varchar not null
- amount numeric(18,2) not null
- transaction\_reference varchar null
- provider\_payload jsonb null
- paid\_at timestamptz null
- failed\_at timestamptz null
- created\_at timestamptz not null
- updated\_at timestamptz not null

## 9.24 payment\_events

- id UUID PK
- payment\_id UUID FK payments.id
- event\_type varchar not null
- provider\_event\_id varchar null
- payload jsonb not null
- created\_at timestamptz not null

## 9.25 shipments

- id UUID PK
- order\_id UUID FK orders.id
- shipping\_provider varchar null
- tracking\_number varchar null
- status varchar not null
- shipped\_at timestamptz null
- delivered\_at timestamptz null
- address\_snapshot jsonb not null
- created\_at timestamptz not null
- updated\_at timestamptz not null

## 9.26 pages

- id UUID PK
- title varchar not null
- slug varchar unique not null
- content jsonb not null
- status varchar not null default `draft`
- published\_at timestamptz null
- created\_by UUID FK users.id null
- updated\_by UUID FK users.id null
- created\_at timestamptz not null
- updated\_at timestamptz not null

## 9.27 posts

- id UUID PK
- title varchar not null
- slug varchar unique not null
- summary text null
- content jsonb not null
- status varchar not null default `draft`
- published\_at timestamptz null
- author\_id UUID FK users.id null
- created\_at timestamptz not null
- updated\_at timestamptz not null

## 9.28 seo\_metadata

- id UUID PK
- entity\_type varchar not null
- entity\_id UUID not null
- meta\_title varchar null
- meta\_description varchar null
- canonical\_url varchar null
- robots varchar null
- og\_title varchar null
- og\_description varchar null
- og\_image\_media\_id UUID FK media\_files.id null
- schema\_json jsonb null
- unique(entity\_type, entity\_id)

## 9.29 redirects

- id UUID PK
- from\_path varchar unique not null
- to\_path varchar not null
- status\_code int not null default 301
- is\_active boolean not null default true
- created\_at timestamptz not null

## 9.30 audit\_logs

- id UUID PK
- actor\_user\_id UUID FK users.id null
- action\_code varchar not null
- entity\_type varchar not null
- entity\_id UUID null
- old\_data jsonb null
- new\_data jsonb null
- ip\_address varchar null
- user\_agent varchar null
- created\_at timestamptz not null

---

# 10. Trạng thái chuẩn hóa

## 10.1 product.status

- draft
- active
- archived

## 10.2 variant.status

- active
- inactive

## 10.3 order.status

- pending\_payment
- awaiting\_confirmation
- confirmed
- processing
- shipped
- delivered
- completed
- cancelled
- refunded
- failed

## 10.4 payment.status

- pending
- authorized
- paid
- failed
- cancelled
- refunded
- partially\_refunded

## 10.5 shipment.status

- pending
- packed
- shipped
- delivered
- failed
- returned

---

# 11. API design rules

## 11.1 Base rules

- Prefix: `/api/v1`
- Content type: `application/json`
- Tất cả datetime dùng ISO-8601 UTC
- Tất cả id dùng UUID
- Response list dùng pagination thống nhất
- Validation lỗi trả 422 hoặc 400 theo rule chuẩn
- Unauthorized là 401
- Forbidden là 403
- Not found là 404
- Conflict là 409

## 11.2 Response envelope

### Success object

```json
{
  "data": {},
  "meta": {},
  "error": null
}
```

### Error object

```json
{
  "data": null,
  "meta": {},
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found",
    "details": {}
  }
}
```

### Pagination meta

```json
{
  "page": 1,
  "page_size": 20,
  "total": 125,
  "total_pages": 7
}
```

## 11.3 Idempotency

- `POST /checkout/place-order` phải hỗ trợ idempotency key.
- Payment webhook phải idempotent.
- Admin bulk actions nên hỗ trợ request\_id.

---

# 12. API contract chi tiết

## 12.1 Auth

### POST `/api/v1/auth/register`

Request:

```json
{
  "email": "user@example.com",
  "password": "StrongPass123!",
  "full_name": "Nguyen Van A"
}
```

Response:

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "Nguyen Van A"
    }
  },
  "meta": {},
  "error": null
}
```

### POST `/api/v1/auth/login`

Request:

```json
{
  "email": "user@example.com",
  "password": "StrongPass123!"
}
```

Response trả access token + set refresh token cookie httpOnly.

### POST `/api/v1/auth/refresh`

- Dùng refresh cookie.

### POST `/api/v1/auth/logout`

- Revoke refresh token.

### GET `/api/v1/auth/me`

- Trả profile user hiện tại.

## 12.2 Catalog public

### GET `/api/v1/products`

Filters:

- q
- category\_slug
- brand\_slug
- min\_price
- max\_price
- sort
- page
- page\_size

Response item:

```json
{
  "id": "uuid",
  "name": "Áo sơ mi nam",
  "slug": "ao-so-mi-nam",
  "thumbnail": "https://...",
  "min_price": 250000,
  "max_price": 350000,
  "currency_code": "VND",
  "is_in_stock": true,
  "primary_category": {
    "name": "Áo nam",
    "slug": "ao-nam"
  }
}
```

### GET `/api/v1/products/{slug}`

Response gồm:

- product core
- images
- variants
- attributes
- seo
- breadcrumbs
- related\_products

### GET `/api/v1/categories`

### GET `/api/v1/categories/{slug}`

### GET `/api/v1/brands`

### GET `/api/v1/brands/{slug}`

## 12.3 Cart

### GET `/api/v1/cart`

- Lấy cart hiện tại theo user hoặc session.

### POST `/api/v1/cart/items`

Request:

```json
{
  "variant_id": "uuid",
  "quantity": 2
}
```

Rule:

- Không cho vượt available\_quantity.
- Nếu item đã tồn tại thì cộng quantity.

### PUT `/api/v1/cart/items/{item_id}`

```json
{
  "quantity": 3
}
```

### DELETE `/api/v1/cart/items/{item_id}`

### POST `/api/v1/cart/apply-coupon`

```json
{
  "code": "SALE10"
}
```

### DELETE `/api/v1/cart/coupon`

## 12.4 Checkout

### POST `/api/v1/checkout/preview`

Request:

```json
{
  "shipping_address": {
    "full_name": "Nguyen Van A",
    "phone": "0900000000",
    "province": "Hanoi",
    "district": "Cau Giay",
    "ward": "Dich Vong",
    "address_line1": "123 Street"
  },
  "shipping_method": "standard",
  "payment_method": "cod"
}
```

Response:

- subtotal
- discount
- shipping
- tax
- total
- validation\_warnings

### POST `/api/v1/checkout/place-order`

Headers:

- `Idempotency-Key: uuid`

Request:

```json
{
  "customer": {
    "email": "user@example.com",
    "phone": "0900000000",
    "full_name": "Nguyen Van A"
  },
  "shipping_address": {
    "full_name": "Nguyen Van A",
    "phone": "0900000000",
    "province": "Hanoi",
    "district": "Cau Giay",
    "ward": "Dich Vong",
    "address_line1": "123 Street"
  },
  "shipping_method": "standard",
  "payment_method": "cod",
  "notes": "Giao giờ hành chính"
}
```

Response:

- order
- payment\_action nếu cần redirect

## 12.5 Orders customer

### GET `/api/v1/orders`

- Danh sách đơn của customer hiện tại.

### GET `/api/v1/orders/{order_code}`

- Chi tiết đơn.

### POST `/api/v1/orders/{order_code}/cancel`

- Chỉ cho cancel theo policy.

## 12.6 Payment

### POST `/api/v1/payments/{order_code}/initiate`

- Tạo payment intent.

### POST `/api/v1/payments/webhooks/{provider}`

- Provider callback.
- Phải verify signature.
- Phải idempotent.

## 12.7 CMS public

### GET `/api/v1/posts`

### GET `/api/v1/posts/{slug}`

### GET `/api/v1/pages/{slug}`

## 12.8 Admin catalog

### GET `/api/v1/admin/products`

### POST `/api/v1/admin/products`

### GET `/api/v1/admin/products/{id}`

### PUT `/api/v1/admin/products/{id}`

### DELETE `/api/v1/admin/products/{id}`

### POST `/api/v1/admin/products/{id}/publish`

### POST `/api/v1/admin/products/{id}/archive`

### POST `/api/v1/admin/products/{id}/variants`

### PUT `/api/v1/admin/variants/{id}`

### DELETE `/api/v1/admin/variants/{id}`

## 12.9 Admin inventory

### GET `/api/v1/admin/inventory`

### POST `/api/v1/admin/inventory/adjust`

```json
{
  "variant_id": "uuid",
  "transaction_type": "manual_adjustment",
  "quantity": 10,
  "note": "Nhập kho đầu kỳ"
}
```

## 12.10 Admin orders

### GET `/api/v1/admin/orders`

### GET `/api/v1/admin/orders/{id}`

### POST `/api/v1/admin/orders/{id}/confirm`

### POST `/api/v1/admin/orders/{id}/ship`

### POST `/api/v1/admin/orders/{id}/deliver`

### POST `/api/v1/admin/orders/{id}/cancel`

### POST `/api/v1/admin/orders/{id}/refund`

## 12.11 Admin coupon

### GET `/api/v1/admin/coupons`

### POST `/api/v1/admin/coupons`

### PUT `/api/v1/admin/coupons/{id}`

### DELETE `/api/v1/admin/coupons/{id}`

## 12.12 Admin CMS + SEO

### CRUD `/api/v1/admin/pages`

### CRUD `/api/v1/admin/posts`

### CRUD `/api/v1/admin/categories`

### CRUD `/api/v1/admin/brands`

### CRUD `/api/v1/admin/seo`

### CRUD `/api/v1/admin/redirects`

### POST `/api/v1/admin/media/presign`

### POST `/api/v1/admin/media/complete`

---

# 13. Business rules bắt buộc

## 13.1 Cart rules

- Chỉ add variant active.
- Không add variant của product draft/archived.
- Quantity phải > 0.
- Khi cart load lại phải revalidate giá và tồn kho.

## 13.2 Pricing rules

- Giá hiển thị lấy từ variant.
- Product min/max price được denormalize để listing nhanh.
- Coupon áp dụng ở BE, không tin FE.

## 13.3 Inventory rules

- available = on\_hand - reserved.
- Khi place order online có thể reserve tồn kho trước, commit trừ kho sau khi payment thành công hoặc xác nhận COD theo policy.
- Nếu payment fail thì release reserved stock.

## 13.4 Order rules

- order\_code là unique, human-readable.
- Snapshot tên sản phẩm, sku, giá tại thời điểm đặt hàng vào order\_items.
- Không đọc product live để hiển thị lịch sử order.

## 13.5 Payment rules

- Webhook là source of truth ưu tiên hơn redirect return URL.
- Mọi event payment phải log vào payment\_events.
- Provider payload phải lưu raw JSON để đối soát.

## 13.6 SEO rules

- Chỉ index product/category/brand/page/post ở trạng thái active/published.
- Khi đổi slug phải tạo redirect 301.
- Sitemap chỉ chứa URL indexable.

---

# 14. SEO implementation spec

## 14.1 Metadata bắt buộc cho public pages

- title
- meta description
- canonical
- og\:title
- og\:description
- og\:image
- robots
- JSON-LD phù hợp

## 14.2 Structured data

- Product schema cho product detail
- BreadcrumbList cho category/product/post
- Article cho post
- Organization cho global site
- FAQPage cho FAQ page

## 14.3 SEO technical

- robots.txt dynamic hoặc static có kiểm soát
- sitemap.xml index + child sitemaps nếu URL lớn
- Chặn index admin, cart, checkout, account
- Pagination có canonical đúng
- Slug duy nhất
- Redirect 301 khi đổi slug
- 404 page chuẩn

## 14.4 Rendering strategy

- Home/category/product/post/page public: SSR/ISR
- Cart/checkout/account/admin: CSR hoặc dynamic rendering không cần SEO

---

# 15. Repo structure chuẩn hóa

```text
project-root/
  frontend/
    src/
      app/
      components/
      features/
      lib/
      hooks/
      styles/
      types/
      tests/
    public/
    package.json
    tsconfig.json
  backend/
    app/
      api/
      core/
      models/
      repositories/
      schemas/
      services/
      tasks/
      utils/
      tests/
    alembic/
    requirements.txt
    pyproject.toml
  docs/
    architecture/
    api/
    database/
    product/
    runbooks/
  infra/
    docker/
    nginx/
    scripts/
  .github/
    workflows/
```

---

# 16. Coding conventions cho Codex

## 16.1 Chung

- Không tạo business logic trong controller/page route nếu đã có service layer.
- Không query DB trực tiếp từ API handler nếu đã có repository/service.
- Không hardcode enum string rải rác, phải có constants.
- Không để FE tự tính total cuối cùng.
- Không dùng any ở FE nếu tránh được.
- Không bypass schema validation.

## 16.2 FE

- Mỗi module theo feature folder.
- Server component cho read-only SEO pages.
- Client component chỉ dùng khi cần interaction/state/browser APIs.
- Form phải có schema validation.
- API client phải tập trung một chỗ.

## 16.3 BE

- Router chỉ parse request và gọi service.
- Service chứa business rules.
- Repository chứa data access.
- Schema request/response tách riêng models DB.
- Mọi migration phải reversible nếu hợp lý.

## 16.4 Tests

- Unit tests cho service rules quan trọng.
- API integration tests cho auth, cart, checkout, order, payment webhook.
- FE smoke tests cho public critical flows.

---

# 17. Definition of Done

## 17.1 Module được coi là done khi

- Code chạy local bằng docker compose.
- Có migration nếu có thay đổi DB.
- Có seed data nếu cần demo.
- Có API schema/request-response rõ.
- Có test tối thiểu cho happy path và 1-2 edge cases chính.
- Có logging phù hợp.
- Có kiểm tra permission nếu là admin feature.
- Có cập nhật docs liên quan.

## 17.2 Feature storefront done khi

- Responsive cơ bản desktop/mobile.
- Không crash khi data thiếu optional fields.
- Loading/empty/error states rõ.
- Metadata SEO đúng nếu là public page.

---

# 18. Ticket backlog tổng thể

## Quy ước ticket

- Prefix `ARC`: architecture/docs
- Prefix `INF`: infra/devops
- Prefix `BE`: backend
- Prefix `FE`: frontend
- Prefix `SEO`: search/metadata/performance
- Prefix `QA`: testing/quality
- Prefix `OPS`: monitoring/runbook

Mỗi ticket gồm:

- Title
- Mục tiêu
- Phạm vi
- Input/Output
- Phụ thuộc
- Acceptance criteria

---

# 19. Ticket chi tiết theo phase

## PHASE 0 — Alignment & foundation docs

### ARC-001 — Chốt scope MVP website bán hàng

Mục tiêu: khóa phạm vi MVP để Codex không tự thêm bớt tính năng. Phạm vi:

- catalog
- cart
- checkout
- order
- payment abstraction
- CMS/blog
- admin commerce cơ bản Acceptance:
- Có danh sách in-scope/out-of-scope trong `/docs/product/mvp-scope.md`
- Có bảng role và permission cơ bản Phụ thuộc: none

### ARC-002 — Chốt ADR cho stack kỹ thuật

Mục tiêu: khóa Next.js + FastAPI + PostgreSQL + Redis + S3-compatible + Nginx. Acceptance:

- Có file `/docs/architecture/adr-001-stack.md`
- Nêu rõ lý do chọn stack và non-goals Phụ thuộc: ARC-001

### ARC-003 — Viết API conventions và response envelope

Acceptance:

- Có file `/docs/api/conventions.md`
- Có format lỗi và pagination chuẩn Phụ thuộc: ARC-002

### ARC-004 — Viết database conventions

Acceptance:

- Có file `/docs/database/conventions.md`
- Quy định UUID, timestamp, soft delete, index, enum strategy Phụ thuộc: ARC-002

---

## PHASE 1 — Repo bootstrap & infra

### INF-001 — Khởi tạo monorepo structure

Acceptance:

- Có `frontend`, `backend`, `docs`, `infra`
- Có README root hướng dẫn chạy local Phụ thuộc: ARC-002

### INF-002 — Setup Docker Compose local

Acceptance:

- Chạy được frontend, backend, postgres, redis
- Có lệnh một phát để up môi trường local Phụ thuộc: INF-001

### INF-003 — Setup environment variable strategy

Acceptance:

- Có `.env.example` cho FE/BE
- Có docs mô tả từng biến môi trường Phụ thuộc: INF-001

### INF-004 — Setup Nginx reverse proxy local/staging

Acceptance:

- Route được FE/BE qua Nginx
- Có cấu hình proxy cho `/api` Phụ thuộc: INF-002

### INF-005 — Setup CI cho backend

Acceptance:

- Lint + test + migration check chạy được trên CI Phụ thuộc: INF-001

### INF-006 — Setup CI cho frontend

Acceptance:

- Lint + typecheck + build chạy được trên CI Phụ thuộc: INF-001

### INF-007 — Setup logging cơ bản và correlation id

Acceptance:

- Request log có request\_id
- Có logger utility dùng chung Phụ thuộc: INF-002

---

## PHASE 2 — Backend core skeleton

### BE-001 — Bootstrap FastAPI app structure

Acceptance:

- Có app startup
- Có router `/api/v1/health`
- Có config module Phụ thuộc: INF-002

### BE-002 — Setup SQLAlchemy + Alembic

Acceptance:

- Tạo được migration đầu tiên
- Có session management chuẩn Phụ thuộc: BE-001

### BE-003 — Setup Redis integration

Acceptance:

- Ping được Redis
- Có utility cache/idempotency base Phụ thuộc: BE-001

### BE-004 — Tạo base models và mixins dùng chung

Acceptance:

- UUID PK
- timestamp mixin
- soft delete mixin nếu áp dụng Phụ thuộc: BE-002

### BE-005 — Tạo seed roles và permissions

Acceptance:

- Seed được roles/permissions chuẩn
- Có script seed idempotent Phụ thuộc: BE-002

---

## PHASE 3 — Auth & identity

### BE-006 — Implement users/roles/permissions schema

Acceptance:

- Có migration cho users, roles, permissions, user\_roles, refresh\_tokens, addresses Phụ thuộc: BE-004

### BE-007 — Implement auth service

Acceptance:

- register, login, refresh, logout, me
- refresh token rotation Phụ thuộc: BE-006

### BE-008 — Implement RBAC middleware/dependency

Acceptance:

- Bảo vệ được admin endpoints theo permission Phụ thuộc: BE-005, BE-007

### FE-001 — Setup auth pages public

Acceptance:

- login/register/forgot-password UI cơ bản
- form validation Phụ thuộc: INF-001

### FE-002 — Tích hợp auth state ở frontend

Acceptance:

- Hiển thị trạng thái login/logout
- Gọi được `/auth/me` Phụ thuộc: FE-001, BE-007

---

## PHASE 4 — Catalog data model

### BE-009 — Implement brands/categories schema

Acceptance:

- Migration cho brands, categories
- Hỗ trợ category tree Phụ thuộc: BE-004

### BE-010 — Implement media\_files schema

Acceptance:

- Migration + repository cho media files Phụ thuộc: BE-004

### BE-011 — Implement products core schema

Acceptance:

- Migration cho products, product\_categories
- unique slug, status, published fields Phụ thuộc: BE-009

### BE-012 — Implement attributes and values schema

Acceptance:

- product\_attributes, product\_attribute\_values Phụ thuộc: BE-004

### BE-013 — Implement variants schema

Acceptance:

- product\_variants, variant\_attribute\_values, product\_images Phụ thuộc: BE-011, BE-012, BE-010

### BE-014 — Implement inventory schema

Acceptance:

- inventory\_snapshots, inventory\_transactions Phụ thuộc: BE-013

### BE-015 — Implement catalog admin CRUD services

Acceptance:

- CRUD brands/categories/products/variants
- draft/publish/archive product Phụ thuộc: BE-013

---

## PHASE 5 — Catalog public APIs

### BE-016 — Public products listing API

Acceptance:

- filter, sort, pagination
- chỉ trả active/indexable products Phụ thuộc: BE-015

### BE-017 — Product detail API

Acceptance:

- trả variant, images, attributes, seo, breadcrumbs Phụ thuộc: BE-015

### BE-018 — Category/brand public APIs

Acceptance:

- list/detail theo slug Phụ thuộc: BE-009, BE-015

### FE-003 — Setup storefront layout

Acceptance:

- header/footer/navigation/search shell Phụ thuộc: INF-001

### FE-004 — Build home page public

Acceptance:

- SSR/ISR
- section hero/category/product highlights Phụ thuộc: FE-003

### FE-005 — Build category listing page

Acceptance:

- filter/sort/pagination
- SSR/hybrid phù hợp Phụ thuộc: FE-003, BE-016

### FE-006 — Build product detail page

Acceptance:

- gallery, variant selector, price, add-to-cart
- metadata SEO Phụ thuộc: FE-003, BE-017

### SEO-001 — Implement metadata engine for public pages

Acceptance:

- title/description/canonical/OG cho home/category/product Phụ thuộc: FE-004, FE-005, FE-006

---

## PHASE 6 — Cart & checkout

### BE-019 — Implement carts and cart\_items schema

Acceptance:

- migration + service tạo/lấy cart theo user/session Phụ thuộc: BE-013

### BE-020 — Implement cart APIs

Acceptance:

- get cart
- add/update/remove items
- validate inventory và product status Phụ thuộc: BE-019, BE-014

### FE-007 — Build cart page

Acceptance:

- xem cart, sửa quantity, xóa item
- hiển thị subtotal Phụ thuộc: FE-006, BE-020

### BE-021 — Implement coupon schema and validation service

Acceptance:

- coupons, coupon\_usages
- validate min order, active window, usage limit Phụ thuộc: BE-019

### BE-022 — Implement checkout preview service

Acceptance:

- tính subtotal/discount/shipping/tax/total Phụ thuộc: BE-020, BE-021

### FE-008 — Build checkout page

Acceptance:

- form customer + shipping + payment method
- preview order total Phụ thuộc: FE-007, BE-022

### BE-023 — Implement order schema

Acceptance:

- orders, order\_items
- order\_code generation
- snapshot order items Phụ thuộc: BE-019

### BE-024 — Implement place-order service with idempotency

Acceptance:

- tạo order từ cart
- reserve/revalidate inventory
- hỗ trợ Idempotency-Key Phụ thuộc: BE-022, BE-023, BE-014, BE-003

### FE-009 — Integrate place-order flow

Acceptance:

- submit order thành công
- điều hướng success page hoặc payment action Phụ thuộc: FE-008, BE-024

### FE-010 — Build order success page

Acceptance:

- hiển thị order code và summary cơ bản Phụ thuộc: FE-009

---

## PHASE 7 — Payment

### BE-025 — Implement payments schema

Acceptance:

- payments, payment\_events tables Phụ thuộc: BE-023

### BE-026 — Implement payment provider abstraction

Acceptance:

- interface chuẩn `initiate_payment`, `verify_webhook`, `normalize_event` Phụ thuộc: BE-025

### BE-027 — Implement mock payment provider

Acceptance:

- dùng cho local/dev/test Phụ thuộc: BE-026

### BE-028 — Implement payment initiation API

Acceptance:

- trả redirect/action data nếu cần Phụ thuộc: BE-026, BE-024

### BE-029 — Implement payment webhook handler

Acceptance:

- verify signature
- idempotent event processing
- update payment/order status Phụ thuộc: BE-028, BE-003

### FE-011 — Integrate payment redirect/return flow

Acceptance:

- xử lý phương thức online cơ bản Phụ thuộc: FE-009, BE-028

---

## PHASE 8 — Customer account & order history

### BE-030 — Customer orders API

Acceptance:

- list/detail own orders
- cancel by policy Phụ thuộc: BE-023

### FE-012 — Build account overview page

Acceptance:

- menu account cơ bản Phụ thuộc: FE-002

### FE-013 — Build order history page

Acceptance:

- list orders + statuses Phụ thuộc: FE-012, BE-030

### FE-014 — Build order detail page

Acceptance:

- item snapshot, totals, timeline cơ bản Phụ thuộc: FE-013, BE-030

---

## PHASE 9 — Admin commerce

### FE-015 — Bootstrap admin layout and guards

Acceptance:

- admin shell, sidebar, auth guard Phụ thuộc: FE-002

### FE-016 — Admin products list/create/edit UI

Acceptance:

- CRUD product cơ bản Phụ thuộc: FE-015, BE-015

### FE-017 — Admin variants/inventory UI

Acceptance:

- chỉnh variant + tồn kho thủ công Phụ thuộc: FE-016, BE-014

### FE-018 — Admin orders list/detail UI

Acceptance:

- xem đơn và đổi trạng thái theo permission Phụ thuộc: FE-015, BE-030

### BE-031 — Admin order workflow APIs

Acceptance:

- confirm, ship, deliver, cancel, refund
- ghi audit log Phụ thuộc: BE-023, BE-025

### FE-019 — Admin coupon UI

Acceptance:

- CRUD coupon Phụ thuộc: FE-015, BE-021

---

## PHASE 10 — CMS / blog / pages / SEO

### BE-032 — Implement pages/posts/tags/seo/redirects schema

Acceptance:

- migrations đầy đủ Phụ thuộc: BE-004

### BE-033 — Implement CMS admin CRUD APIs

Acceptance:

- pages/posts/tags/seo/redirects CRUD Phụ thuộc: BE-032, BE-008

### FE-020 — Admin CMS UI

Acceptance:

- CRUD page/post/SEO metadata/redirect Phụ thuộc: FE-015, BE-033

### BE-034 — Public CMS APIs

Acceptance:

- list/detail posts
- get page by slug Phụ thuộc: BE-033

### FE-021 — Blog listing/detail pages

Acceptance:

- SSR/ISR + metadata Phụ thuộc: FE-003, BE-034

### FE-022 — Generic content page renderer

Acceptance:

- render page theo slug Phụ thuộc: FE-003, BE-034

### SEO-002 — Dynamic sitemap generation

Acceptance:

- product/category/brand/post/page URLs indexable xuất hiện trong sitemap Phụ thuộc: BE-015, BE-033

### SEO-003 — robots.txt + noindex rules

Acceptance:

- admin/cart/checkout/account noindex đúng Phụ thuộc: FE-003

### SEO-004 — Redirect manager runtime

Acceptance:

- FE/edge hoặc backend áp dụng redirect 301 theo dữ liệu redirects Phụ thuộc: BE-033

---

## PHASE 11 — Media upload

### BE-035 — Presigned upload flow

Acceptance:

- API presign + complete upload metadata Phụ thuộc: BE-010

### FE-023 — Reusable media uploader component

Acceptance:

- upload ảnh và chọn media đã có Phụ thuộc: FE-015, BE-035

### OPS-001 — Image optimization pipeline cơ bản

Acceptance:

- resize thumbnail và web image khi upload hoặc background job Phụ thuộc: BE-035

---

## PHASE 12 — Audit, monitoring, quality

### BE-036 — Audit logs implementation

Acceptance:

- admin sensitive actions được log Phụ thuộc: BE-008, BE-031, BE-033

### OPS-002 — Health checks và readiness checks

Acceptance:

- FE/BE có endpoint check phù hợp Phụ thuộc: BE-001, INF-002

### OPS-003 — Error tracking integration

Acceptance:

- capture unhandled exceptions FE/BE Phụ thuộc: INF-005, INF-006

### QA-001 — Backend test suite cho auth/catalog/cart/checkout

Acceptance:

- integration tests cho các flow chính Phụ thuộc: BE-024

### QA-002 — Frontend smoke tests cho storefront

Acceptance:

- home -> product -> cart -> checkout -> success happy path Phụ thuộc: FE-010

### QA-003 — Admin smoke tests

Acceptance:

- login admin -> create product -> publish -> adjust inventory -> view order Phụ thuộc: FE-019

---

## PHASE 13 — Performance & hardening

### SEO-005 — Core Web Vitals optimization pass

Acceptance:

- tối ưu image loading, caching, script strategy Phụ thuộc: FE-006, FE-021

### BE-037 — Rate limiting cho auth và public mutation endpoints

Acceptance:

- login/register/cart/checkout có rate limit phù hợp Phụ thuộc: BE-003, BE-007, BE-024

### BE-038 — CORS, security headers, trusted host config

Acceptance:

- cấu hình production-safe cơ bản Phụ thuộc: INF-004, BE-001

### OPS-004 — Backup/restore runbook cho PostgreSQL

Acceptance:

- có tài liệu và script mẫu Phụ thuộc: BE-002

### OPS-005 — Deployment runbook staging/prod

Acceptance:

- có hướng dẫn migrate, rollback, env, smoke checks Phụ thuộc: INF-005, INF-006

---

# 20. Thứ tự Codex nên thực thi

## Batch 1

ARC-001 -> ARC-004 -> INF-001 -> INF-003 -> INF-002 -> BE-001 -> BE-002 -> BE-004

## Batch 2

BE-005 -> BE-006 -> BE-007 -> BE-008 -> FE-001 -> FE-002

## Batch 3

BE-009 -> BE-010 -> BE-011 -> BE-012 -> BE-013 -> BE-014 -> BE-015

## Batch 4

BE-016 -> BE-017 -> BE-018 -> FE-003 -> FE-004 -> FE-005 -> FE-006 -> SEO-001

## Batch 5

BE-019 -> BE-020 -> FE-007 -> BE-021 -> BE-022 -> FE-008 -> BE-023 -> BE-024 -> FE-009 -> FE-010

## Batch 6

BE-025 -> BE-026 -> BE-027 -> BE-028 -> BE-029 -> FE-011

## Batch 7

BE-030 -> FE-012 -> FE-013 -> FE-014 -> FE-015 -> FE-016 -> FE-017 -> BE-031 -> FE-018 -> FE-019

## Batch 8

BE-032 -> BE-033 -> FE-020 -> BE-034 -> FE-021 -> FE-022 -> SEO-002 -> SEO-003 -> SEO-004

## Batch 9

BE-035 -> FE-023 -> OPS-001 -> BE-036 -> OPS-002 -> OPS-003 -> QA-001 -> QA-002 -> QA-003

## Batch 10

SEO-005 -> BE-037 -> BE-038 -> OPS-004 -> OPS-005

---

# 21. Prompt mẫu để giao cho Codex

## Prompt tổng quát

Bạn đang làm việc trên monorepo website bán hàng theo đặc tả trong `/docs`. Hãy chỉ triển khai đúng phạm vi ticket được giao. Không tự thêm framework mới ngoài stack đã khóa. Tuân thủ service layer, repository layer, API conventions, database conventions và definition of done. Khi thay đổi schema, phải tạo migration. Khi tạo endpoint admin, phải kiểm tra permission phù hợp. Khi tạo public SEO page, phải thêm metadata/canonical hợp lệ nếu ticket yêu cầu.

## Prompt theo ticket

Hãy thực hiện ticket `BE-024` theo tài liệu trong `/docs`. Yêu cầu:

- đọc `/docs/api/conventions.md`
- đọc `/docs/database/conventions.md`
- đọc đặc tả checkout trong tài liệu chính
- chỉ sửa các file cần thiết
- thêm test cho happy path và 2 edge cases chính
- giải thích ngắn gọn design decisions trước khi output code

---

# 22. Rủi ro còn lại cần quyết định ngoài tài liệu này

Các điểm dưới đây đã được thiết kế abstraction nhưng vẫn cần chốt khi triển khai thực tế:

- Nhà cung cấp thanh toán cụ thể
- Nhà vận chuyển cụ thể
- Cách tính phí ship chi tiết
- Thuế VAT theo bài toán thực tế
- Chính sách reserve inventory trước hay sau payment cho COD
- CMS editor kiểu rich text hay block editor
- Search engine: PostgreSQL full-text hay external search

---

# 23. Kết luận

Bộ tài liệu này đủ để Codex:

- scaffold repo
- dựng backend và frontend chuẩn
- tạo schema DB đúng hướng
- làm public storefront chuẩn SEO
- làm admin commerce + CMS
- triển khai cart, checkout, order, payment abstraction
- đi theo backlog có dependency rõ ràng

Nếu cần nâng tiếp, bước kế tiếp nên là tạo thêm 5 file riêng trong `/docs`:

- `mvp-scope.md`
- `api/conventions.md`
- `database/conventions.md`
- `runbooks/deployment.md`
- `tickets/backlog.md`


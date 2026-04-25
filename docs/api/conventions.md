# API Conventions

## Base

* Prefix: /api/v1
* JSON only
* UTF-8
* ISO-8601 UTC datetime
* UUID ids

## Success Response

```json
{"data":{},"meta":{},"error":null}
```

## Error Response

```json
{"data":null,"meta":{},"error":{"code":"ERROR_CODE","message":"Readable message","details":{}}}
```

## Status Codes

* 200 OK
* 201 Created
* 204 No Content
* 400 Bad Request
* 401 Unauthorized
* 403 Forbidden
* 404 Not Found
* 409 Conflict
* 422 Validation Error
* 500 Internal Server Error

## Pagination

* page
* page_size
* total
* total_pages

## Security

* JWT access token
* Refresh token rotation
* RBAC for admin endpoints

## Idempotency

* Required for place-order
* Required for payment webhook processing

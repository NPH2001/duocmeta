from __future__ import annotations

from dataclasses import dataclass
from http import HTTPStatus
from threading import Lock
from time import time

from fastapi import Request
from redis.exceptions import RedisError

from app.core.config import Settings
from app.core.redis import get_redis_client


class RateLimitExceeded(Exception):
    def __init__(self, *, limit: int, window_seconds: int) -> None:
        self.code = "RATE_LIMIT_EXCEEDED"
        self.message = "Too many requests. Please retry later."
        self.status_code = HTTPStatus.TOO_MANY_REQUESTS
        self.limit = limit
        self.window_seconds = window_seconds
        super().__init__(self.message)


@dataclass(frozen=True)
class RateLimitRule:
    name: str
    limit: int
    window_seconds: int


class InMemoryRateLimiter:
    def __init__(self) -> None:
        self._buckets: dict[str, tuple[int, float]] = {}
        self._lock = Lock()

    def hit(self, key: str, *, limit: int, window_seconds: int) -> bool:
        now = time()
        expires_at = now + window_seconds

        with self._lock:
            count, current_expires_at = self._buckets.get(key, (0, expires_at))

            if current_expires_at <= now:
                count = 0
                current_expires_at = expires_at

            count += 1
            self._buckets[key] = (count, current_expires_at)
            return count <= limit

    def clear(self) -> None:
        with self._lock:
            self._buckets.clear()


_memory_limiter = InMemoryRateLimiter()


def enforce_rate_limit(request: Request, rule: RateLimitRule, settings: Settings) -> None:
    if not settings.rate_limit_enabled or rule.limit <= 0 or rule.window_seconds <= 0:
        return

    key = _rate_limit_key(request=request, rule=rule, settings=settings)

    if settings.rate_limit_use_redis and _hit_redis(key, limit=rule.limit, window_seconds=rule.window_seconds):
        return

    if _memory_limiter.hit(key, limit=rule.limit, window_seconds=rule.window_seconds):
        return

    raise RateLimitExceeded(limit=rule.limit, window_seconds=rule.window_seconds)


def reset_in_memory_rate_limiter() -> None:
    _memory_limiter.clear()


def _hit_redis(key: str, *, limit: int, window_seconds: int) -> bool:
    try:
        client = get_redis_client()
        count = int(client.incr(key))
        if count == 1:
            client.expire(key, window_seconds)
        return count <= limit
    except (RedisError, OSError, ValueError):
        return False


def _rate_limit_key(*, request: Request, rule: RateLimitRule, settings: Settings) -> str:
    return ":".join(
        [
            settings.rate_limit_key_prefix,
            rule.name,
            _client_identifier(request),
        ]
    )


def _client_identifier(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip() or "unknown"

    if request.client and request.client.host:
        return request.client.host

    return "unknown"

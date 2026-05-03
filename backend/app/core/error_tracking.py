import logging
import traceback
from types import TracebackType
from uuid import uuid4

from app.core.config import Settings, get_settings


_SAFE_CONTEXT_KEYS = {
    "component",
    "duration_ms",
    "method",
    "path",
    "request_id",
    "runtime",
    "source",
    "status_code",
}
_SENSITIVE_KEY_PARTS = (
    "address",
    "authorization",
    "cookie",
    "dsn",
    "email",
    "key",
    "password",
    "phone",
    "secret",
    "token",
)

logger = logging.getLogger("app.error_tracking")


def capture_exception(
    exc: BaseException,
    *,
    context: dict[str, object] | None = None,
    settings: Settings | None = None,
) -> str:
    """Capture an exception as a provider-neutral, production-safe error event.

    The default integration writes a structured log event only. It intentionally avoids
    exception messages, query strings, headers, cookies, tokens, and arbitrary context so
    secret-like values cannot be exposed through the tracking sink.
    """

    event_id = str(uuid4())

    resolved_settings = settings or get_settings()
    if not resolved_settings.error_tracking_enabled:
        return event_id

    safe_context = sanitize_context(context or {})
    stack_top = _stack_top(exc.__traceback__)
    logger.error(
        "error_tracking_event event_id=%s provider=%s environment=%s error_type=%s context=%s stack_top=%s",
        event_id,
        resolved_settings.error_tracking_provider,
        resolved_settings.app_env,
        exc.__class__.__name__,
        safe_context,
        stack_top,
    )
    return event_id


def sanitize_context(context: dict[str, object]) -> dict[str, str | int | float | bool | None]:
    """Return only safe, scalar, allow-listed context values."""

    sanitized: dict[str, str | int | float | bool | None] = {}
    for key, value in context.items():
        normalized_key = key.lower()
        if normalized_key not in _SAFE_CONTEXT_KEYS:
            continue
        if any(sensitive in normalized_key for sensitive in _SENSITIVE_KEY_PARTS):
            continue
        if isinstance(value, str | int | float | bool) or value is None:
            sanitized[key] = value
        else:
            sanitized[key] = str(value)

    return sanitized


def _stack_top(traceback_obj: TracebackType | None) -> str:
    if traceback_obj is None:
        return "-"

    extracted = traceback.extract_tb(traceback_obj)
    if not extracted:
        return "-"

    frame = extracted[-1]
    return f"{frame.filename}:{frame.name}:{frame.lineno}"

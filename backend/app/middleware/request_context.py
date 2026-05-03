import time
from collections.abc import Awaitable, Callable
from uuid import UUID, uuid4

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.core.error_tracking import capture_exception
from app.core.logging import get_logger, request_id_context


REQUEST_ID_HEADER = "X-Request-ID"

logger = get_logger(__name__)


def normalize_request_id(raw_request_id: str | None) -> str:
    if not raw_request_id:
        return str(uuid4())

    try:
        return str(UUID(raw_request_id))
    except ValueError:
        return str(uuid4())


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        request_id = normalize_request_id(request.headers.get(REQUEST_ID_HEADER))
        token = request_id_context.set(request_id)
        start_time = time.perf_counter()

        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000
            event_id = capture_exception(
                exc,
                context={
                    "component": "backend",
                    "duration_ms": round(duration_ms, 2),
                    "method": request.method,
                    "path": request.url.path,
                    "request_id": request_id,
                    "runtime": "fastapi",
                    "status_code": 500,
                },
            )
            logger.error(
                "request_failed method=%s path=%s status_code=500 duration_ms=%.2f error_event_id=%s",
                request.method,
                request.url.path,
                duration_ms,
                event_id,
            )
            return JSONResponse(
                status_code=500,
                headers={REQUEST_ID_HEADER: request_id},
                content={
                    "data": None,
                    "meta": {
                        "request_id": request_id,
                        "error_event_id": event_id,
                    },
                    "error": {
                        "code": "INTERNAL_SERVER_ERROR",
                        "message": "An unexpected error occurred.",
                        "details": {},
                    },
                },
            )
        else:
            duration_ms = (time.perf_counter() - start_time) * 1000
            response.headers[REQUEST_ID_HEADER] = request_id
            logger.info(
                "request_completed method=%s path=%s status_code=%s duration_ms=%.2f",
                request.method,
                request.url.path,
                response.status_code,
                duration_ms,
            )
            return response
        finally:
            request_id_context.reset(token)

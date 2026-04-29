from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.db import get_db_session
from app.core.redis import ping_redis


router = APIRouter(tags=["health"])


@router.get("/health")
def read_health(settings: Settings = Depends(get_settings)) -> dict:
    return {
        "data": {
            "status": "ok",
            "service": settings.app_name,
            "environment": settings.app_env,
        },
        "meta": {},
        "error": None,
    }


@router.get("/ready")
def read_readiness(
    settings: Settings = Depends(get_settings),
    session: Session = Depends(get_db_session),
) -> JSONResponse:
    checks = {
        "database": {"status": _database_status(session)},
        "redis": {"status": _redis_status()},
    }
    is_ready = all(check["status"] == "ok" for check in checks.values())
    status_code = 200 if is_ready else 503

    return JSONResponse(
        status_code=status_code,
        content={
            "data": {
                "status": "ready" if is_ready else "not_ready",
                "service": settings.app_name,
                "environment": settings.app_env,
                "checks": checks,
            },
            "meta": {},
            "error": None
            if is_ready
            else {
                "code": "SERVICE_NOT_READY",
                "message": "Service dependencies are not ready.",
                "details": {},
            },
        },
    )


def _database_status(session: Session) -> str:
    try:
        session.execute(text("SELECT 1"))
    except Exception:
        return "unavailable"

    return "ok"


def _redis_status() -> str:
    try:
        return "ok" if ping_redis() else "unavailable"
    except Exception:
        return "unavailable"

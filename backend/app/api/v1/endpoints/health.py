from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings


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

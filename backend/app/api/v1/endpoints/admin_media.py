from http import HTTPStatus

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.api.dependencies.auth import require_permission
from app.core.config import Settings, get_settings
from app.core.db import get_db_session
from app.models.identity import User
from app.schemas.media import MediaCompleteRequest, MediaPresignRequest, MediaPresignResponse, MediaResponse
from app.services.media import MediaService, MediaServiceError


router = APIRouter(prefix="/admin/media", tags=["admin-media"])


@router.post("/presign", status_code=HTTPStatus.CREATED)
def create_presigned_upload(
    request: MediaPresignRequest,
    _: User = Depends(require_permission("manage_media")),
    session: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
):
    try:
        presign = MediaService(session, settings).create_presigned_upload(request)
    except MediaServiceError as exc:
        return _error_response(exc)

    return _success_response(presign.model_dump(mode="json"))


@router.post("/complete", status_code=HTTPStatus.CREATED)
def complete_upload(
    request: MediaCompleteRequest,
    current_user: User = Depends(require_permission("manage_media")),
    session: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
):
    try:
        media_file = MediaService(session, settings).complete_upload(request, current_user)
    except MediaServiceError as exc:
        return _error_response(exc)

    return _success_response(MediaResponse.model_validate(media_file).model_dump(mode="json"))


def _success_response(data: dict):
    return {"data": data, "meta": {}, "error": None}


def _error_response(exc: MediaServiceError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "data": None,
            "meta": {},
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": {},
            },
        },
    )

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import FileResponse

from app.core.config import Settings, get_settings
from app.services.media_storage import MediaStorageService, MediaStorageServiceError


router = APIRouter(tags=["media-storage"])


@router.put("/media-upload/{storage_key:path}", status_code=204)
async def upload_media_object(
    storage_key: str,
    request: Request,
    settings: Settings = Depends(get_settings),
) -> Response:
    _ensure_not_expired(request.query_params.get("expires"))

    try:
        service = MediaStorageService(settings)
        service.verify_upload_signature(
            storage_key=storage_key,
            expires_unix=int(request.query_params["expires"]),
            signature=request.query_params.get("signature"),
        )
        payload = await request.body()
        service.store_object(storage_key=storage_key, payload=payload)
    except MediaStorageServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    return Response(status_code=204)


@router.get("/media/{storage_key:path}")
def read_media_object(
    storage_key: str,
    settings: Settings = Depends(get_settings),
):
    try:
        service = MediaStorageService(settings)
        file_path = service.resolve_public_path(storage_key)
    except MediaStorageServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    return FileResponse(file_path)


def _ensure_not_expired(expires_value: str | None) -> None:
    if expires_value is None:
        raise HTTPException(status_code=400, detail="Missing upload expiry.")

    try:
        expires_unix = int(expires_value)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid upload expiry.") from exc

    if datetime.now(UTC).timestamp() > expires_unix:
        raise HTTPException(status_code=403, detail="Upload URL has expired.")

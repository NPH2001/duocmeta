import hashlib
import hmac
import re
from datetime import UTC, datetime, timedelta
from http import HTTPStatus
from pathlib import PurePosixPath
from uuid import uuid4

from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models.catalog import MediaDerivative, MediaFile
from app.models.identity import User
from app.repositories.media import MediaRepository
from app.schemas.media import MediaCompleteRequest, MediaPresignRequest, MediaPresignResponse


class MediaServiceError(Exception):
    def __init__(self, code: str, message: str, status_code: int) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class MediaService:
    def __init__(self, session: Session, settings: Settings) -> None:
        self.session = session
        self.settings = settings
        self.repository = MediaRepository(session)

    def create_presigned_upload(self, request: MediaPresignRequest) -> MediaPresignResponse:
        _validate_upload_request(
            mime_type=request.mime_type,
            size_bytes=request.size_bytes,
            max_upload_bytes=self.settings.media_max_upload_bytes,
        )

        storage_key = self._build_storage_key(request.filename)
        expires_at = datetime.now(UTC) + timedelta(seconds=self.settings.media_presign_ttl_seconds)
        expires_unix = int(expires_at.timestamp())
        signature = self._sign_upload(storage_key=storage_key, expires_unix=expires_unix)
        upload_url = (
            f"{self.settings.media_upload_base_url.rstrip('/')}/{storage_key}"
            f"?expires={expires_unix}&signature={signature}"
        )

        return MediaPresignResponse(
            storage_key=storage_key,
            bucket=self.settings.media_bucket_name,
            upload_url=upload_url,
            public_url=f"{self.settings.media_public_base_url.rstrip('/')}/{storage_key}",
            method="PUT",
            headers={
                "Content-Type": request.mime_type,
                "x-amz-acl": "public-read",
            },
            expires_at=expires_at,
        )

    def complete_upload(self, request: MediaCompleteRequest, actor: User) -> MediaFile:
        _validate_upload_request(
            mime_type=request.mime_type,
            size_bytes=request.size_bytes,
            max_upload_bytes=self.settings.media_max_upload_bytes,
        )

        if self.repository.get_by_storage_key(request.storage_key) is not None:
            raise MediaServiceError(
                "MEDIA_STORAGE_KEY_EXISTS",
                "Media file already exists for this storage key.",
                HTTPStatus.CONFLICT,
            )

        media_file = self.repository.add(
            MediaFile(
                storage_key=request.storage_key,
                filename=request.filename,
                mime_type=request.mime_type,
                size_bytes=request.size_bytes,
                width=request.width,
                height=request.height,
                alt_text=request.alt_text,
                uploaded_by=actor.id,
            )
        )
        self.repository.add_derivatives(self._build_pending_derivatives(media_file))
        self.session.commit()
        return media_file

    def _build_storage_key(self, filename: str) -> str:
        prefix = self.settings.media_upload_prefix.strip("/")
        date_path = datetime.now(UTC).strftime("%Y/%m/%d")
        safe_filename = _safe_filename(filename)
        return str(PurePosixPath(prefix, date_path, f"{uuid4().hex}-{safe_filename}"))

    def _sign_upload(self, *, storage_key: str, expires_unix: int) -> str:
        message = f"{storage_key}:{expires_unix}:{self.settings.media_bucket_name}".encode()
        return hmac.new(self.settings.secret_key.encode(), message, hashlib.sha256).hexdigest()

    def _build_pending_derivatives(self, media_file: MediaFile) -> list[MediaDerivative]:
        if not self.settings.media_optimization_enabled:
            return []

        if not media_file.mime_type.startswith("image/"):
            return []

        if media_file.width is None or media_file.height is None:
            return []

        target_widths = sorted({width for width in self.settings.media_optimization_widths if width > 0})
        derivatives: list[MediaDerivative] = []
        for target_width in target_widths:
            if target_width >= media_file.width:
                continue

            target_height = max(1, round(media_file.height * (target_width / media_file.width)))
            derivatives.append(
                MediaDerivative(
                    media_file_id=media_file.id,
                    kind=f"w{target_width}",
                    storage_key=_optimized_storage_key(
                        media_file.storage_key,
                        width=target_width,
                        image_format=self.settings.media_optimization_format,
                    ),
                    mime_type=_optimized_mime_type(self.settings.media_optimization_format),
                    width=target_width,
                    height=target_height,
                    status="pending",
                )
            )

        return derivatives


def _validate_upload_request(*, mime_type: str, size_bytes: int, max_upload_bytes: int) -> None:
    if size_bytes > max_upload_bytes:
        raise MediaServiceError(
            "MEDIA_FILE_TOO_LARGE",
            "Media file exceeds the configured upload size limit.",
            HTTPStatus.BAD_REQUEST,
        )

    if not (mime_type.startswith("image/") or mime_type == "application/pdf"):
        raise MediaServiceError(
            "MEDIA_MIME_TYPE_NOT_ALLOWED",
            "Media file type is not allowed.",
            HTTPStatus.BAD_REQUEST,
        )


def _safe_filename(filename: str) -> str:
    name = filename.strip().replace("\\", "/").split("/")[-1]
    normalized = re.sub(r"[^A-Za-z0-9._-]+", "-", name).strip(".-")
    return normalized or "upload"


def _optimized_storage_key(storage_key: str, *, width: int, image_format: str) -> str:
    source_path = PurePosixPath(storage_key)
    extension = image_format.strip().lower().lstrip(".") or "webp"
    optimized_filename = f"{source_path.stem}-w{width}.{extension}"
    return str(PurePosixPath("optimized", source_path.parent, optimized_filename))


def _optimized_mime_type(image_format: str) -> str:
    normalized = image_format.strip().lower().lstrip(".") or "webp"
    if normalized == "jpg":
        normalized = "jpeg"
    return f"image/{normalized}"

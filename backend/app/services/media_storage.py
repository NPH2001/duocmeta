import hashlib
import hmac
from http import HTTPStatus
from pathlib import Path, PurePosixPath

from app.core.config import Settings


class MediaStorageServiceError(Exception):
    def __init__(self, message: str, status_code: int) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class MediaStorageService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.storage_root = settings.media_local_storage_path

    def verify_upload_signature(self, *, storage_key: str, expires_unix: int, signature: str | None) -> None:
        if not signature:
            raise MediaStorageServiceError("Missing upload signature.", HTTPStatus.FORBIDDEN)

        normalized_storage_key = self._normalize_storage_key(storage_key)
        expected_signature = self._sign_upload(storage_key=normalized_storage_key, expires_unix=expires_unix)
        if not hmac.compare_digest(signature, expected_signature):
            raise MediaStorageServiceError("Upload signature is invalid.", HTTPStatus.FORBIDDEN)

    def store_object(self, *, storage_key: str, payload: bytes) -> Path:
        normalized_storage_key = self._normalize_storage_key(storage_key)
        destination = self.storage_root / Path(normalized_storage_key)
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(payload)
        return destination

    def resolve_public_path(self, storage_key: str) -> Path:
        normalized_storage_key = self._normalize_storage_key(storage_key)
        file_path = self.storage_root / Path(normalized_storage_key)

        if not file_path.is_file():
            raise MediaStorageServiceError("Media file was not found.", HTTPStatus.NOT_FOUND)

        return file_path

    def _normalize_storage_key(self, storage_key: str) -> str:
        normalized_key = str(PurePosixPath(storage_key.strip()))

        if normalized_key in {".", ""}:
            raise MediaStorageServiceError("Storage key is required.", HTTPStatus.BAD_REQUEST)

        if normalized_key.startswith("../") or normalized_key == ".." or "/.." in normalized_key:
            raise MediaStorageServiceError("Storage key is invalid.", HTTPStatus.BAD_REQUEST)

        upload_prefix = self.settings.media_upload_prefix.strip("/")
        if upload_prefix and not normalized_key.startswith(f"{upload_prefix}/"):
            raise MediaStorageServiceError("Storage key is outside upload prefix.", HTTPStatus.BAD_REQUEST)

        return normalized_key

    def _sign_upload(self, *, storage_key: str, expires_unix: int) -> str:
        message = f"{storage_key}:{expires_unix}:{self.settings.media_bucket_name}".encode()
        return hmac.new(self.settings.secret_key.encode(), message, hashlib.sha256).hexdigest()

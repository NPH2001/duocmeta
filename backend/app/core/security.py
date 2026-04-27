import base64
import hashlib
import hmac
import json
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any


def hash_password(password: str, *, salt: str | None = None) -> str:
    password_salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), password_salt.encode(), 260_000)
    return f"pbkdf2_sha256${password_salt}${digest.hex()}"


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False

    try:
        algorithm, salt, expected_digest = password_hash.split("$", 2)
    except ValueError:
        return False

    if algorithm != "pbkdf2_sha256":
        return False

    candidate_hash = hash_password(password, salt=salt)
    return hmac.compare_digest(candidate_hash, password_hash)


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def hash_refresh_token(refresh_token: str, secret_key: str) -> str:
    return hmac.new(secret_key.encode(), refresh_token.encode(), hashlib.sha256).hexdigest()


def create_access_token(
    *,
    subject: str,
    secret_key: str,
    expires_delta: timedelta,
    now: datetime | None = None,
) -> str:
    issued_at = now or datetime.now(UTC)
    expires_at = issued_at + expires_delta
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": subject,
        "type": "access",
        "iat": int(issued_at.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    signing_input = f"{_base64url_json(header)}.{_base64url_json(payload)}"
    signature = _base64url_bytes(_sign(signing_input, secret_key))
    return f"{signing_input}.{signature}"


def decode_access_token(token: str, secret_key: str, *, now: datetime | None = None) -> dict[str, Any] | None:
    token_parts = token.split(".")

    if len(token_parts) != 3:
        return None

    signing_input = ".".join(token_parts[:2])
    expected_signature = _base64url_bytes(_sign(signing_input, secret_key))

    if not hmac.compare_digest(expected_signature, token_parts[2]):
        return None

    try:
        payload = json.loads(_base64url_decode(token_parts[1]))
    except (ValueError, json.JSONDecodeError):
        return None

    if payload.get("type") != "access":
        return None

    current_time = now or datetime.now(UTC)
    expires_at = payload.get("exp")

    if not isinstance(expires_at, int) or expires_at <= int(current_time.timestamp()):
        return None

    return payload


def _sign(signing_input: str, secret_key: str) -> bytes:
    return hmac.new(secret_key.encode(), signing_input.encode(), hashlib.sha256).digest()


def _base64url_json(value: dict[str, Any]) -> str:
    return _base64url_bytes(json.dumps(value, separators=(",", ":"), sort_keys=True).encode())


def _base64url_bytes(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode()


def _base64url_decode(value: str) -> bytes:
    padded = value + "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(padded)

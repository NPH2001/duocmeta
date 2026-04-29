from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "duocmeta-backend"
    app_env: str = "development"
    app_debug: bool = True
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    api_v1_prefix: str = "/api/v1"
    secret_key: str = "change-me-in-local-development"
    access_token_ttl_minutes: int = 15
    refresh_token_ttl_days: int = 30
    database_url: str = "postgresql+psycopg://duocmeta:change-me@postgres:5432/duocmeta"
    redis_url: str = "redis://redis:6379/0"
    backend_cors_origins: list[str] = [
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ]
    media_bucket_name: str = "duocmeta-media"
    media_upload_prefix: str = "uploads"
    media_upload_base_url: str = "http://localhost:8080/media-upload"
    media_public_base_url: str = "http://localhost:8080/media"
    media_presign_ttl_seconds: int = 900
    media_max_upload_bytes: int = 10 * 1024 * 1024
    media_optimization_enabled: bool = True
    media_optimization_format: str = "webp"
    media_optimization_widths: list[int] = [320, 1200]

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def parse_backend_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]

        return value

    @field_validator("media_optimization_widths", mode="before")
    @classmethod
    def parse_media_optimization_widths(cls, value: str | list[int]) -> list[int]:
        if isinstance(value, str):
            return [int(width.strip()) for width in value.split(",") if width.strip()]

        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()

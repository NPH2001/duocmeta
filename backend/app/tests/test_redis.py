from unittest.mock import MagicMock, patch

from app.core.redis import get_redis_client, ping_redis


def test_get_redis_client_uses_settings_url() -> None:
    get_redis_client.cache_clear()

    with patch("app.core.redis.Redis.from_url") as mocked_from_url:
        get_redis_client()

    mocked_from_url.assert_called_once_with("redis://redis:6379/0", decode_responses=True)


def test_ping_redis_returns_true_for_successful_ping() -> None:
    mocked_client = MagicMock()
    mocked_client.ping.return_value = True

    get_redis_client.cache_clear()

    with patch("app.core.redis.get_redis_client", return_value=mocked_client):
        assert ping_redis() is True

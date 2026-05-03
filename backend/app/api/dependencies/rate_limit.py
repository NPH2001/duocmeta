from fastapi import Depends, Request

from app.core.config import Settings, get_settings
from app.core.rate_limit import RateLimitRule, enforce_rate_limit


def rate_limit_auth(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> None:
    enforce_rate_limit(
        request,
        RateLimitRule(
            name="auth",
            limit=settings.rate_limit_auth_limit,
            window_seconds=settings.rate_limit_window_seconds,
        ),
        settings,
    )


def rate_limit_cart_mutation(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> None:
    enforce_rate_limit(
        request,
        RateLimitRule(
            name="cart",
            limit=settings.rate_limit_cart_limit,
            window_seconds=settings.rate_limit_window_seconds,
        ),
        settings,
    )


def rate_limit_checkout_mutation(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> None:
    enforce_rate_limit(
        request,
        RateLimitRule(
            name="checkout",
            limit=settings.rate_limit_checkout_limit,
            window_seconds=settings.rate_limit_window_seconds,
        ),
        settings,
    )

from http import HTTPStatus

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.db import get_db_session
from app.schemas.payments import PaymentInitiateRequest, PaymentInitiateResponse, PaymentWebhookResponse
from app.services.payments import PaymentService, PaymentServiceError


router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/{order_code}/initiate")
def initiate_payment(
    order_code: str,
    request: PaymentInitiateRequest,
    session: Session = Depends(get_db_session),
):
    try:
        payment, created = PaymentService(session).initiate_payment(
            order_code=order_code,
            provider_code=request.provider_code,
            method_code=request.method_code,
            return_url=request.return_url,
            cancel_url=request.cancel_url,
        )
    except PaymentServiceError as exc:
        return _error_response(exc)

    return _success_response(payment, status_code=HTTPStatus.CREATED if created else HTTPStatus.OK)


@router.post("/webhooks/{provider_code}")
async def handle_payment_webhook(
    provider_code: str,
    request: Request,
    session: Session = Depends(get_db_session),
):
    try:
        webhook = PaymentService(session).handle_webhook(
            provider_code=provider_code,
            headers=dict(request.headers),
            raw_body=await request.body(),
            query_params=dict(request.query_params),
        )
    except PaymentServiceError as exc:
        return _error_response(exc)

    return _success_response(webhook, status_code=HTTPStatus.OK)


def _success_response(data: PaymentInitiateResponse | PaymentWebhookResponse, *, status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"data": data.model_dump(mode="json"), "meta": {}, "error": None},
    )


def _error_response(exc: PaymentServiceError) -> JSONResponse:
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

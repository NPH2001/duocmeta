from http import HTTPStatus
from uuid import UUID

from fastapi import APIRouter, Depends, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.api.dependencies.auth import require_permission
from app.core.db import get_db_session
from app.models.identity import User
from app.schemas.catalog import (
    BrandCreateRequest,
    BrandResponse,
    BrandUpdateRequest,
    CategoryCreateRequest,
    CategoryResponse,
    CategoryUpdateRequest,
    ProductCreateRequest,
    ProductResponse,
    ProductUpdateRequest,
    ProductVariantCreateRequest,
    ProductVariantResponse,
    ProductVariantUpdateRequest,
)
from app.services.catalog import CatalogService, CatalogServiceError, PaginatedResult


router = APIRouter(
    prefix="/admin",
    tags=["admin-catalog"],
    dependencies=[Depends(require_permission("manage_products"))],
)


@router.get("/brands")
def list_brands(page: int = 1, page_size: int = 20, session: Session = Depends(get_db_session)):
    result = CatalogService(session).list_brands(page=page, page_size=page_size)
    return _paginated_response(result, BrandResponse)


@router.post("/brands", status_code=HTTPStatus.CREATED)
def create_brand(request: BrandCreateRequest, session: Session = Depends(get_db_session)):
    try:
        brand = CatalogService(session).create_brand(request)
    except CatalogServiceError as exc:
        return _error_response(exc)

    return _success_response(BrandResponse.model_validate(brand).model_dump(mode="json"))


@router.get("/brands/{brand_id}")
def get_brand(brand_id: UUID, session: Session = Depends(get_db_session)):
    try:
        brand = CatalogService(session).get_brand(brand_id)
    except CatalogServiceError as exc:
        return _error_response(exc)

    return _success_response(BrandResponse.model_validate(brand).model_dump(mode="json"))


@router.put("/brands/{brand_id}")
def update_brand(
    brand_id: UUID,
    request: BrandUpdateRequest,
    session: Session = Depends(get_db_session),
):
    try:
        brand = CatalogService(session).update_brand(brand_id, request)
    except CatalogServiceError as exc:
        return _error_response(exc)

    return _success_response(BrandResponse.model_validate(brand).model_dump(mode="json"))


@router.delete("/brands/{brand_id}", status_code=HTTPStatus.NO_CONTENT)
def delete_brand(brand_id: UUID, session: Session = Depends(get_db_session)):
    try:
        CatalogService(session).delete_brand(brand_id)
    except CatalogServiceError as exc:
        return _error_response(exc)

    return Response(status_code=HTTPStatus.NO_CONTENT)


@router.get("/categories")
def list_categories(page: int = 1, page_size: int = 20, session: Session = Depends(get_db_session)):
    result = CatalogService(session).list_categories(page=page, page_size=page_size)
    return _paginated_response(result, CategoryResponse)


@router.post("/categories", status_code=HTTPStatus.CREATED)
def create_category(request: CategoryCreateRequest, session: Session = Depends(get_db_session)):
    try:
        category = CatalogService(session).create_category(request)
    except CatalogServiceError as exc:
        return _error_response(exc)

    return _success_response(CategoryResponse.model_validate(category).model_dump(mode="json"))


@router.get("/categories/{category_id}")
def get_category(category_id: UUID, session: Session = Depends(get_db_session)):
    try:
        category = CatalogService(session).get_category(category_id)
    except CatalogServiceError as exc:
        return _error_response(exc)

    return _success_response(CategoryResponse.model_validate(category).model_dump(mode="json"))


@router.put("/categories/{category_id}")
def update_category(
    category_id: UUID,
    request: CategoryUpdateRequest,
    session: Session = Depends(get_db_session),
):
    try:
        category = CatalogService(session).update_category(category_id, request)
    except CatalogServiceError as exc:
        return _error_response(exc)

    return _success_response(CategoryResponse.model_validate(category).model_dump(mode="json"))


@router.delete("/categories/{category_id}", status_code=HTTPStatus.NO_CONTENT)
def delete_category(category_id: UUID, session: Session = Depends(get_db_session)):
    try:
        CatalogService(session).delete_category(category_id)
    except CatalogServiceError as exc:
        return _error_response(exc)

    return Response(status_code=HTTPStatus.NO_CONTENT)


@router.get("/products")
def list_products(page: int = 1, page_size: int = 20, session: Session = Depends(get_db_session)):
    result = CatalogService(session).list_products(page=page, page_size=page_size)
    return _paginated_response(result, ProductResponse)


@router.post("/products", status_code=HTTPStatus.CREATED)
def create_product(
    request: ProductCreateRequest,
    current_user: User = Depends(require_permission("manage_products")),
    session: Session = Depends(get_db_session),
):
    try:
        product = CatalogService(session).create_product(request, current_user)
    except CatalogServiceError as exc:
        return _error_response(exc)

    return _success_response(ProductResponse.model_validate(product).model_dump(mode="json"))


@router.get("/products/{product_id}")
def get_product(product_id: UUID, session: Session = Depends(get_db_session)):
    try:
        product = CatalogService(session).get_product(product_id)
    except CatalogServiceError as exc:
        return _error_response(exc)

    return _success_response(ProductResponse.model_validate(product).model_dump(mode="json"))


@router.put("/products/{product_id}")
def update_product(
    product_id: UUID,
    request: ProductUpdateRequest,
    current_user: User = Depends(require_permission("manage_products")),
    session: Session = Depends(get_db_session),
):
    try:
        product = CatalogService(session).update_product(product_id, request, current_user)
    except CatalogServiceError as exc:
        return _error_response(exc)

    return _success_response(ProductResponse.model_validate(product).model_dump(mode="json"))


@router.post("/products/{product_id}/publish")
def publish_product(
    product_id: UUID,
    current_user: User = Depends(require_permission("manage_products")),
    session: Session = Depends(get_db_session),
):
    try:
        product = CatalogService(session).publish_product(product_id, current_user)
    except CatalogServiceError as exc:
        return _error_response(exc)

    return _success_response(ProductResponse.model_validate(product).model_dump(mode="json"))


@router.post("/products/{product_id}/archive")
def archive_product(
    product_id: UUID,
    current_user: User = Depends(require_permission("manage_products")),
    session: Session = Depends(get_db_session),
):
    try:
        product = CatalogService(session).archive_product(product_id, current_user)
    except CatalogServiceError as exc:
        return _error_response(exc)

    return _success_response(ProductResponse.model_validate(product).model_dump(mode="json"))


@router.get("/variants")
def list_variants(page: int = 1, page_size: int = 20, session: Session = Depends(get_db_session)):
    result = CatalogService(session).list_variants(page=page, page_size=page_size)
    return _paginated_response(result, ProductVariantResponse)


@router.post("/variants", status_code=HTTPStatus.CREATED)
def create_variant(request: ProductVariantCreateRequest, session: Session = Depends(get_db_session)):
    try:
        variant = CatalogService(session).create_variant(request)
    except CatalogServiceError as exc:
        return _error_response(exc)

    return _success_response(ProductVariantResponse.model_validate(variant).model_dump(mode="json"))


@router.get("/variants/{variant_id}")
def get_variant(variant_id: UUID, session: Session = Depends(get_db_session)):
    try:
        variant = CatalogService(session).get_variant(variant_id)
    except CatalogServiceError as exc:
        return _error_response(exc)

    return _success_response(ProductVariantResponse.model_validate(variant).model_dump(mode="json"))


@router.put("/variants/{variant_id}")
def update_variant(
    variant_id: UUID,
    request: ProductVariantUpdateRequest,
    session: Session = Depends(get_db_session),
):
    try:
        variant = CatalogService(session).update_variant(variant_id, request)
    except CatalogServiceError as exc:
        return _error_response(exc)

    return _success_response(ProductVariantResponse.model_validate(variant).model_dump(mode="json"))


@router.delete("/variants/{variant_id}", status_code=HTTPStatus.NO_CONTENT)
def delete_variant(variant_id: UUID, session: Session = Depends(get_db_session)):
    try:
        CatalogService(session).delete_variant(variant_id)
    except CatalogServiceError as exc:
        return _error_response(exc)

    return Response(status_code=HTTPStatus.NO_CONTENT)


def _success_response(data: dict):
    return {"data": data, "meta": {}, "error": None}


def _paginated_response(result: PaginatedResult, response_schema):
    return {
        "data": [response_schema.model_validate(row).model_dump(mode="json") for row in result.rows],
        "meta": {
            "page": result.page,
            "page_size": result.page_size,
            "total": result.total,
            "total_pages": result.total_pages,
        },
        "error": None,
    }


def _error_response(exc: CatalogServiceError) -> JSONResponse:
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

from fastapi import APIRouter

from app.api.v1.endpoints.admin_cms import router as admin_cms_router
from app.api.v1.endpoints.admin_catalog import router as admin_catalog_router
from app.api.v1.endpoints.admin_orders import router as admin_orders_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.brands import router as brands_router
from app.api.v1.endpoints.cart import router as cart_router
from app.api.v1.endpoints.categories import router as categories_router
from app.api.v1.endpoints.checkout import router as checkout_router
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.orders import router as orders_router
from app.api.v1.endpoints.payments import router as payments_router
from app.api.v1.endpoints.products import router as products_router


router = APIRouter()
router.include_router(admin_cms_router)
router.include_router(admin_catalog_router)
router.include_router(admin_orders_router)
router.include_router(auth_router)
router.include_router(brands_router)
router.include_router(cart_router)
router.include_router(categories_router)
router.include_router(checkout_router)
router.include_router(health_router)
router.include_router(orders_router)
router.include_router(payments_router)
router.include_router(products_router)

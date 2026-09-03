from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.endpoints.health import ai_system_status, router as health_router
from app.api.v1.favorites import router as favorites_router
from app.api.v1.outfits import router as outfits_router
from app.api.v1.tryons import router as tryons_router
from app.api.v1.uploads import router as uploads_router
from app.api.v1.users import router as users_router

api_v1_router = APIRouter()
api_router = api_v1_router  # Backward compatibility alias

api_v1_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_v1_router.include_router(users_router, prefix="/users", tags=["Users"])
api_v1_router.include_router(uploads_router, prefix="/uploads", tags=["Uploads"])
api_v1_router.include_router(outfits_router, prefix="/outfits", tags=["Outfits"])
api_v1_router.include_router(favorites_router, prefix="/favorites", tags=["Favorites"])
api_v1_router.include_router(tryons_router, prefix="/try-ons", tags=["Try-Ons"])
api_v1_router.include_router(health_router, prefix="/health", tags=["Health"])
api_v1_router.add_api_route("/system/ai", ai_system_status, methods=["GET"], tags=["Health"])

__all__ = ["api_v1_router", "api_router"]

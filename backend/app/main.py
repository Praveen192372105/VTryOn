from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app import __version__
from app.api.v1.endpoints.health import root_health_router
from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.exception_handlers import register_exception_handlers
from app.core.logging import logger
from app.core.middleware import RequestTracingMiddleware, SecurityHeadersMiddleware, setup_cors

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup and shutdown lifecycle management."""
    # Log safe configuration context without leaking secrets
    logger.info(
        f"Starting {settings.APP_NAME} v{__version__} [env={settings.APP_ENV.value}]",
        extra={"event": "configuration.loaded", **settings.safe_summary()},
    )

    # Ensure storage root and subdirectories exist
    storage_path = settings.resolved_storage_root
    storage_path.mkdir(parents=True, exist_ok=True)
    (storage_path / "people").mkdir(parents=True, exist_ok=True)
    (storage_path / "outfits").mkdir(parents=True, exist_ok=True)
    (storage_path / "results").mkdir(parents=True, exist_ok=True)
    (storage_path / "tmp").mkdir(parents=True, exist_ok=True)

    yield

    logger.info(f"Shutting down {settings.APP_NAME}")


def create_application() -> FastAPI:
    """FastAPI application factory."""
    current_settings = get_settings()
    app = FastAPI(
        title=current_settings.APP_NAME,
        version=__version__,
        description="Production-grade Virtual Try-On backend powered by FastAPI, MySQL, Celery, and CatVTON.",
        docs_url="/docs" if current_settings.APP_DEBUG else None,
        redoc_url="/redoc" if current_settings.APP_DEBUG else None,
        openapi_url="/openapi.json" if current_settings.APP_DEBUG else None,
        lifespan=lifespan,
    )

    # 1. Register middleware
    app.add_middleware(RequestTracingMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)
    setup_cors(app)

    # 2. Register exception handlers
    register_exception_handlers(app)

    # 3. Mount static storage for local development with revalidation & CORS headers
    class StaticMediaFiles(StaticFiles):
        async def get_response(self, path: str, scope):
            response = await super().get_response(path, scope)
            response.headers["Cache-Control"] = "no-cache, must-revalidate"
            response.headers["Access-Control-Allow-Origin"] = "*"
            return response

    storage_path = current_settings.resolved_storage_root
    storage_path.mkdir(parents=True, exist_ok=True)
    app.mount("/storage", StaticMediaFiles(directory=str(storage_path), check_dir=False), name="storage")
    if current_settings.MEDIA_BASE_URL != "/storage":
        app.mount(current_settings.MEDIA_BASE_URL, StaticMediaFiles(directory=str(storage_path), check_dir=False), name="media")

    # 4. Mount root health endpoints (/health, /ready)
    app.include_router(root_health_router)

    # 5. Mount Prometheus metrics endpoint
    if current_settings.METRICS_ENABLED:
        from fastapi.responses import PlainTextResponse
        from app.core.metrics import metrics_registry

        @app.get("/metrics", response_class=PlainTextResponse, include_in_schema=False)
        def get_metrics() -> PlainTextResponse:
            content = metrics_registry.generate_prometheus_metrics()
            return PlainTextResponse(
                content=content,
                media_type="text/plain; version=0.0.4; charset=utf-8",
            )

    # 6. Mount API v1 router
    app.include_router(api_router, prefix=current_settings.API_V1_PREFIX)

    return app


app = create_application()

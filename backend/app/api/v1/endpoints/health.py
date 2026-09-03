from typing import Any, Dict
from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app import __version__
from app.ai.catvton.config import ai_settings
from app.ai.catvton.loader import get_model_load_state
from app.ai.catvton.validator import inspect_catvton_runtime
from app.core.config import settings
from app.core.exceptions import DatabaseUnavailableError, RedisUnavailableError, StorageUnavailableError
from app.core.redis import check_redis_connectivity
from app.core.responses import ApiResponse, DependencyChecks, HealthData, ReadinessData
from app.db.session import get_db

# V1 API Health Router mounted under /api/v1/health
router = APIRouter(tags=["Health"])

# Root Health Router mounted at application root (for load balancers / container health probes)
root_health_router = APIRouter(tags=["Health"])


def _check_liveness() -> ApiResponse[HealthData]:
    return ApiResponse(
        data=HealthData(
            status="healthy",
            service=settings.APP_NAME,
            version=__version__,
        )
    )


def _check_readiness(db: Session) -> ApiResponse[ReadinessData]:
    # 1. Check Database
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        raise DatabaseUnavailableError(f"Database readiness check failed: {str(exc)}")

    # 2. Check Redis
    if not check_redis_connectivity():
        raise RedisUnavailableError("Redis readiness ping failed.")

    # 3. Check Media Storage
    try:
        if settings.STORAGE_BACKEND == "s3":
            if not settings.S3_BUCKET_NAME:
                raise StorageUnavailableError("S3 storage configured but S3_BUCKET_NAME is unset.")
        else:
            storage_root = settings.resolved_storage_root
            if not storage_root.exists():
                storage_root.mkdir(parents=True, exist_ok=True)
    except Exception as exc:
        raise StorageUnavailableError(f"Storage readiness check failed: {str(exc)}")

    return ApiResponse(
        data=ReadinessData(
            status="ready",
            checks=DependencyChecks(
                database="healthy",
                redis="healthy",
                storage="healthy",
            ),
        )
    )


# -----------------------------------------------------------------------------
# Canonical /api/v1/health Endpoints
# -----------------------------------------------------------------------------
@router.get(
    "/live",
    response_model=ApiResponse[HealthData],
    status_code=status.HTTP_200_OK,
    summary="Process liveness probe",
    operation_id="health_live",
)
def health_live() -> ApiResponse[HealthData]:
    """
    Liveness probe: verifies that the API process is alive and responsive.
    Does not execute expensive dependency queries.
    """
    return _check_liveness()


@router.get(
    "/ready",
    response_model=ApiResponse[ReadinessData],
    status_code=status.HTTP_200_OK,
    summary="Core dependency readiness probe",
    operation_id="health_ready",
)
def health_ready(db: Session = Depends(get_db)) -> ApiResponse[ReadinessData]:
    """
    Readiness probe: verifies core API dependencies (MySQL, Redis, Media Storage).
    Does not load or allocate CatVTON GPU models in the API process.
    """
    return _check_readiness(db)


# -----------------------------------------------------------------------------
# Root Probe Endpoints (/health, /ready)
# -----------------------------------------------------------------------------
@root_health_router.get(
    "/health",
    response_model=ApiResponse[HealthData],
    status_code=status.HTTP_200_OK,
    summary="Root process liveness probe",
    operation_id="root_health",
)
def root_health() -> ApiResponse[HealthData]:
    return _check_liveness()


@root_health_router.get(
    "/ready",
    response_model=ApiResponse[ReadinessData],
    status_code=status.HTTP_200_OK,
    summary="Root core dependency readiness probe",
    operation_id="root_ready",
)
def root_ready(db: Session = Depends(get_db)) -> ApiResponse[ReadinessData]:
    return _check_readiness(db)


# -----------------------------------------------------------------------------
# Internal System AI Diagnostics
# -----------------------------------------------------------------------------
def ai_system_status() -> ApiResponse[Dict[str, Any]]:
    """
    Internal AI diagnostics endpoint reporting CatVTON configuration & loader state.
    """
    inspection = inspect_catvton_runtime()
    return ApiResponse(
        data={
            "catvton_configured": inspection.root_exists,
            "catvton_model_state": get_model_load_state().value,
            "target_device": ai_settings.device,
            "mixed_precision": ai_settings.dtype,
            "target_resolution": f"{ai_settings.width}x{ai_settings.height}",
            "cuda_available": inspection.cuda_available,
        }
    )


__all__ = [
    "router",
    "root_health_router",
    "health_live",
    "health_ready",
    "root_health",
    "root_ready",
    "ai_system_status",
]

from typing import Optional
from fastapi import APIRouter, Depends, Header, Response, status

from app.api.dependencies import get_current_user, get_tryon_service
from app.core.config import settings
from app.core.exceptions import ValidationError
from app.core.rate_limit import RateLimiter, enforce_rate_limit, get_rate_limiter
from app.core.responses import ApiResponse
from app.domain.ownership import CurrentUser
from app.schemas.pagination import PaginatedData, PaginationParams
from app.schemas.tryon import (
    CreateTryOnRequest,
    TryOnListItem,
    TryOnQueryFilter,
    TryOnResponse,
)
from app.services.tryon_service import TryOnService

router = APIRouter(tags=["Try-Ons"])


@router.post(
    "",
    response_model=ApiResponse[TryOnResponse],
    status_code=status.HTTP_202_ACCEPTED,
    summary="Submit a virtual try-on job for asynchronous processing",
    operation_id="create_tryon",
)
def create_tryon_job(
    payload: CreateTryOnRequest,
    response: Response,
    current_user: CurrentUser = Depends(get_current_user),
    service: TryOnService = Depends(get_tryon_service),
    limiter: RateLimiter = Depends(get_rate_limiter),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
) -> ApiResponse[TryOnResponse]:
    if idempotency_key is not None:
        key_clean = idempotency_key.strip()
        if not key_clean or len(key_clean) > 128 or not all(32 <= ord(c) <= 126 for c in key_clean):
            raise ValidationError("Idempotency-Key must consist of 1 to 128 printable ASCII characters.")
        idempotency_key = key_clean

    enforce_rate_limit(
        limiter,
        key=f"tryon:user:{current_user.public_id}",
        limit=settings.RATE_LIMIT_TRYON_PER_MINUTE,
        window_seconds=60,
        error_message="Too many virtual try-on requests. Please try again shortly.",
    )
    created_job = service.create_job(
        user=current_user, payload=payload, idempotency_key=idempotency_key
    )
    response.headers["Location"] = f"/api/v1/try-ons/{created_job.id}"
    if created_job.status in ("succeeded", "failed"):
        response.status_code = status.HTTP_200_OK
    return ApiResponse(data=created_job)


@router.get(
    "/{job_id}",
    response_model=ApiResponse[TryOnResponse],
    status_code=status.HTTP_200_OK,
    summary="Poll virtual try-on job status and result",
    operation_id="get_tryon",
)
def get_tryon_job(
    job_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    service: TryOnService = Depends(get_tryon_service),
) -> ApiResponse[TryOnResponse]:
    job_status = service.get_job(user=current_user, job_id=job_id)
    return ApiResponse(data=job_status)


@router.get(
    "",
    response_model=ApiResponse[PaginatedData[TryOnListItem]],
    status_code=status.HTTP_200_OK,
    summary="List paginated try-on history for authenticated user",
    operation_id="list_tryons",
)
def list_tryon_jobs(
    filters: TryOnQueryFilter = Depends(),
    pagination: PaginationParams = Depends(),
    current_user: CurrentUser = Depends(get_current_user),
    service: TryOnService = Depends(get_tryon_service),
) -> ApiResponse[PaginatedData[TryOnListItem]]:
    paginated = service.list_jobs(
        user=current_user,
        filters=filters,
        pagination=pagination,
    )
    return ApiResponse(data=paginated)


@router.get(
    "/{job_id}/content",
    status_code=status.HTTP_200_OK,
    summary="Download private binary try-on result image",
    operation_id="get_tryon_content",
    responses={
        200: {
            "content": {"image/jpeg": {}, "image/png": {}},
            "description": "Binary image file of the virtual try-on result.",
        }
    },
)
def get_tryon_result_content(
    job_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    service: TryOnService = Depends(get_tryon_service),
) -> Response:
    image_bytes, mime_type = service.get_result_content(user=current_user, job_id=job_id)
    return Response(
        content=image_bytes,
        media_type=mime_type,
        headers={"Cache-Control": "private, no-cache"},
    )


@router.delete(
    "/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Delete a completed virtual try-on job and associated results",
    operation_id="delete_tryon",
)
def delete_tryon_job(
    job_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    service: TryOnService = Depends(get_tryon_service),
) -> Response:
    service.delete_job(user=current_user, job_id=job_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


__all__ = ["router"]

from typing import Optional
from fastapi import APIRouter, Depends, File, Form, Response, UploadFile, status

from app.api.dependencies import (
    get_current_user,
    get_current_user_optional,
    get_favorite_service,
    get_outfit_service,
)
from app.core.config import settings
from app.core.rate_limit import RateLimiter, enforce_rate_limit, get_rate_limiter
from app.core.responses import ApiResponse
from app.core.cache import cache
from app.domain.ownership import CurrentUser
from app.schemas.outfit import OutfitListItem, OutfitQueryFilter, OutfitResponse
from app.schemas.pagination import PaginatedData, PaginationParams
from app.services.favorite_service import FavoriteService
from app.services.outfit_service import OutfitService
from app.utils.files import read_upload_limited

router = APIRouter(tags=["Outfits"])


@router.post(
    "/custom",
    response_model=ApiResponse[OutfitResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Upload a custom garment to use for virtual try-on",
    operation_id="upload_custom_outfit",
)
@router.post(
    "",
    response_model=ApiResponse[OutfitResponse],
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
async def upload_custom_outfit(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    category: str = Form("upper_body"),
    current_user: CurrentUser = Depends(get_current_user),
    service: OutfitService = Depends(get_outfit_service),
    limiter: RateLimiter = Depends(get_rate_limiter),
) -> ApiResponse[OutfitResponse]:
    enforce_rate_limit(
        limiter,
        key=f"upload:outfit:user:{current_user.public_id}",
        limit=settings.RATE_LIMIT_UPLOAD_PER_MINUTE,
        window_seconds=60,
        error_message="Too many upload requests. Please try again shortly.",
    )
    content = await read_upload_limited(file, max_bytes=settings.MAX_UPLOAD_BYTES)
    outfit_dto = service.create_custom_outfit(
        user=current_user,
        filename=file.filename or "garment.jpg",
        content=content,
        mime_type=file.content_type or "image/jpeg",
        name=name,
        category=category,
    )
    cache.clear("outfits:")
    return ApiResponse(data=outfit_dto)


@router.get(
    "",
    response_model=ApiResponse[PaginatedData[OutfitListItem]],
    status_code=status.HTTP_200_OK,
    summary="Browse active catalogue outfits with category and keyword filters",
    operation_id="list_outfits",
)
def list_outfits(
    filters: OutfitQueryFilter = Depends(),
    pagination: PaginationParams = Depends(),
    current_user: Optional[CurrentUser] = Depends(get_current_user_optional),
    service: OutfitService = Depends(get_outfit_service),
) -> ApiResponse[PaginatedData[OutfitListItem]]:
    cache_key = None
    if current_user is None:
        cache_key = f"outfits:list:{filters.category}:{filters.search}:{pagination.page}:{pagination.limit}"
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return ApiResponse(data=PaginatedData[OutfitListItem](**cached_data))

    paginated = service.list_active_outfits(
        filters=filters,
        pagination=pagination,
        current_user=current_user,
    )
    if cache_key:
        cache.set(cache_key, paginated.model_dump(), ttl_seconds=60)
    return ApiResponse(data=paginated)


@router.get(
    "/{outfit_id}",
    response_model=ApiResponse[OutfitResponse],
    status_code=status.HTTP_200_OK,
    summary="Retrieve single outfit details from catalogue",
    operation_id="get_outfit",
)
def get_outfit(
    outfit_id: str,
    current_user: Optional[CurrentUser] = Depends(get_current_user_optional),
    service: OutfitService = Depends(get_outfit_service),
) -> ApiResponse[OutfitResponse]:
    outfit = service.get_active_outfit(outfit_id=outfit_id, current_user=current_user)
    return ApiResponse(data=outfit)


@router.put(
    "/{outfit_id}/favorite",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Add outfit to favorites (Idempotent, empty 204)",
    operation_id="favorite_outfit",
)
@router.post(
    "/{outfit_id}/favorite",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    include_in_schema=False,
)
def favorite_outfit(
    outfit_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    fav_service: FavoriteService = Depends(get_favorite_service),
) -> Response:
    fav_service.favorite_outfit(user=current_user, outfit_id=outfit_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete(
    "/{outfit_id}/favorite",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Remove outfit from favorites (Idempotent, empty 204)",
    operation_id="unfavorite_outfit",
)
def unfavorite_outfit(
    outfit_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    fav_service: FavoriteService = Depends(get_favorite_service),
) -> Response:
    fav_service.unfavorite_outfit(user=current_user, outfit_id=outfit_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


__all__ = ["router"]

from typing import Optional
from fastapi import APIRouter, Depends, Response, status

from app.api.dependencies import (
    get_current_user,
    get_current_user_optional,
    get_favorite_service,
    get_outfit_service,
)
from app.core.responses import ApiResponse
from app.domain.ownership import CurrentUser
from app.schemas.outfit import OutfitListItem, OutfitQueryFilter, OutfitResponse
from app.schemas.pagination import PaginatedData, PaginationParams
from app.services.favorite_service import FavoriteService
from app.services.outfit_service import OutfitService

router = APIRouter(tags=["Outfits"])


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
    paginated = service.list_active_outfits(
        filters=filters,
        pagination=pagination,
        current_user=current_user,
    )
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
